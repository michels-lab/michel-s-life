package com.michelslab.michelslife

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.view.WindowManager
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebChromeClient
import android.webkit.RenderProcessGoneDetail
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Button
import android.view.Gravity
import android.webkit.ValueCallback
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import java.util.concurrent.Executors

class MainActivity : Activity() {
    lateinit var webView: WebView
        private set
    lateinit var auth: GoogleAuthorizationCoordinator
        private set
    lateinit var calendarConsent: AndroidCalendarConsent
        private set
    lateinit var calendarWriteConsent: AndroidCalendarWriteConsent
        private set
    lateinit var cloud: DriveCloudEngine
        private set
    private val executor = Executors.newSingleThreadExecutor()
    private var rendererGone = false
    private var recoveryRequested = false
    internal fun acceptsWebViewCallbacks(view: WebView): Boolean =
        ::webView.isInitialized && view === webView && !rendererGone && !isDestroyed && !isFinishing

    private var notificationOpenGeneration = 0
    private var pendingNotificationOpen: Runnable? = null
    private var alarmOpenGeneration = 0
    private var pendingAlarmOpen: Runnable? = null
    private val pendingPersonalAlarmIds = linkedSetOf<String>()
    private var activePersonalAlarmId: String? = null
    private var personalAlarmScreenOpened = false
    private val personalAlarmQueueKey = "mlv.personalAlarmQueue"
    private var pendingWebFilePicker: ValueCallback<Array<Uri>>? = null
    private var playingAlarm: MediaPlayer? = null
    private var attentionAlarmId: String? = null
    private var vibratingAlarm: Vibrator? = null

    // The notification can cold-start this Activity before the canonical
    // Story/Focus JavaScript has finished booting. A page-finished event only
    // means the HTML loaded; it does not prove the mobile UI is ready.
    private fun stopPendingNotificationOpen() {
        notificationOpenGeneration++
        if (::webView.isInitialized && !rendererGone) {
            pendingNotificationOpen?.let { webView.removeCallbacks(it) }
        }
        pendingNotificationOpen = null
    }

    private fun stopPendingPersonalAlarm() {
        alarmOpenGeneration++
        if (::webView.isInitialized && !rendererGone) {
            pendingAlarmOpen?.let { webView.removeCallbacks(it) }
        }
        pendingAlarmOpen = null
    }

    private fun beginAlarmAttention(id: String) {
        if (!id.matches(Regex("^[A-Za-z0-9_-]{1,64}$")) || !NativePersonalAlarms.wasDelivered(this, id)) return
        if (PersonalAlarmOverlay.isRinging(id)) return
        if (attentionAlarmId != null) return
        attentionAlarmId = id
        // Wake and show an eligible alarm above the lock screen without unlocking it.
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        try {
            val uri = NativePersonalAlarms.alarmSoundUri(this, id)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val player = MediaPlayer()
            playingAlarm = player
            player.setAudioAttributes(AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
            player.setDataSource(this, uri)
            player.isLooping = true
            player.prepare()
            player.start()
        } catch (_: Exception) {
            try { playingAlarm?.release() } catch (_: Exception) { }
            playingAlarm = null
            // The notification channel still provides a system alarm sound.
        }
        try {
            val vibrator = getSystemService(VIBRATOR_SERVICE) as Vibrator
            if (vibrator.hasVibrator()) {
                vibrator.vibrate(VibrationEffect.createWaveform(
                    longArrayOf(0, 500, 240, 700, 300), 0
                ))
                vibratingAlarm = vibrator
            }
        } catch (_: Exception) { }
    }

    fun stopAlarmAttention(id: String? = null) {
        if (id != null && attentionAlarmId != id) return
        attentionAlarmId = null
        try { playingAlarm?.stop() } catch (_: Exception) { }
        try { playingAlarm?.release() } catch (_: Exception) { }
        playingAlarm = null
        try { vibratingAlarm?.cancel() } catch (_: Exception) { }
        vibratingAlarm = null
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(false)
            setTurnScreenOn(false)
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        }
    }

    internal fun completePersonalAlarm(id: String) {
        NativePersonalAlarms.dismiss(this, id)
        stopAlarmAttention(id)
        pendingPersonalAlarmIds.remove(id)
        if (activePersonalAlarmId == id) {
            stopPendingPersonalAlarm()
            activePersonalAlarmId = null
            personalAlarmScreenOpened = false
        }
        if (::webView.isInitialized && acceptsWebViewCallbacks(webView)) {
            // Let the current JS dismiss handler finish before showing the next.
            webView.post { openPersonalAlarmFromNotification() }
        }
    }

    private fun enqueuePersonalAlarm(id: String?) {
        if (id == null || !id.matches(Regex("^[A-Za-z0-9_-]{1,64}$"))) return
        if (id != activePersonalAlarmId && NativePersonalAlarms.wasDelivered(this, id))
            pendingPersonalAlarmIds.add(id)
    }

    private fun openPersonalAlarmFromNotification() {
        enqueuePersonalAlarm(intent.getStringExtra(NativePersonalAlarms.EXTRA_OPEN_ALARM))
        intent.removeExtra(NativePersonalAlarms.EXTRA_OPEN_ALARM)
        if (!::webView.isInitialized || !acceptsWebViewCallbacks(webView)) return
        if (activePersonalAlarmId == null) {
            val next = pendingPersonalAlarmIds.firstOrNull()
            if (next == null) return
            pendingPersonalAlarmIds.remove(next)
            activePersonalAlarmId = next
            personalAlarmScreenOpened = false
        }
        val id = activePersonalAlarmId ?: return
        if (!NativePersonalAlarms.wasDelivered(this, id)) {
            stopPendingPersonalAlarm()
            stopAlarmAttention(id)
            activePersonalAlarmId = null
            personalAlarmScreenOpened = false
            webView.post { openPersonalAlarmFromNotification() }
            return
        }
        if (personalAlarmScreenOpened) return
        stopPendingPersonalAlarm()
        beginAlarmAttention(id)
        attemptPersonalAlarmOpen(alarmOpenGeneration, id, 0)
    }

    private fun attemptPersonalAlarmOpen(generation: Int, id: String, retries: Int) {
        if (generation != alarmOpenGeneration || !acceptsWebViewCallbacks(webView) ||
            activePersonalAlarmId != id) return
        webView.evaluateJavascript(
            "(function(){try{return window.MichelsLifeAlarms?.ringAlarm?.('" + id + "')===true;}" +
                "catch(_){return false;}})();"
        ) { opened ->
            if (generation != alarmOpenGeneration || !acceptsWebViewCallbacks(webView) ||
                activePersonalAlarmId != id) return@evaluateJavascript
            if (opened == "true") {
                personalAlarmScreenOpened = true
                pendingAlarmOpen = null
            } else if (retries < 40) {
                val retry = Runnable { attemptPersonalAlarmOpen(generation, id, retries + 1) }
                pendingAlarmOpen = retry
                webView.postDelayed(retry, 250L)
            } else {
                pendingAlarmOpen = null
                // Keep this alarm active; onResume/onPageFinished can retry.
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        savedInstanceState?.getStringArrayList(personalAlarmQueueKey)?.forEach { enqueuePersonalAlarm(it) }

        NativeFocusAlarm.createChannel(this)
        NativePersonalAlarms.createChannel(this)
        val meta = CloudMetaStore(this)
        auth = GoogleAuthorizationCoordinator(this)
        calendarConsent = AndroidCalendarConsent(this)
        calendarWriteConsent = AndroidCalendarWriteConsent(this)
        cloud = DriveCloudEngine(this, meta)

        // CI can inspect canonical WebView localStorage only in debuggable TEST
        // APKs. This must NEVER expose CDP on production-signed Direct/Play.
        if ((applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this)
        // Activity manifest already enables hardware acceleration. A forced
        // WebView layer adds a second graphics buffer during startup.
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_BOUND, true)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = false
            // A user-selected audio URI from the system picker must be readable.
            // Arbitrary file URLs remain disabled; native import validates bytes.
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            // Large Story/Focus scenes are rendered as needed, not precached.
            offscreenPreRaster = false
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                if (filePathCallback == null) return false
                pendingWebFilePicker?.onReceiveValue(null)
                pendingWebFilePicker = filePathCallback
                return try {
                    val acceptsAudio = fileChooserParams?.acceptTypes?.any {
                        it.startsWith("audio/", ignoreCase = true) ||
                        it.endsWith(".mp3", ignoreCase = true) ||
                        it.endsWith(".wav", ignoreCase = true) ||
                        it.endsWith(".ogg", ignoreCase = true)
                    } == true
                    val picker = if (acceptsAudio) {
                        Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = "audio/*"
                            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
                            putExtra(Intent.EXTRA_MIME_TYPES,
                                arrayOf("audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg"))
                        }
                    } else {
                        // Preserve the user's JSON/ZIP/backup file imports.
                        fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = "*/*"
                        }
                    }
                    startActivityForResult(picker, 7942)
                    true
                } catch (_: Exception) {
                    pendingWebFilePicker?.onReceiveValue(null)
                    pendingWebFilePicker = null
                    false
                }
            }
        }

        webView.addJavascriptInterface(
            AndroidBridge(this, webView, auth, calendarConsent, calendarWriteConsent, cloud, meta, executor),
            "MichelsLifeAndroid"
        )

        webView.webViewClient = object : WebViewClientCompat() {
            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                if (view !== webView) return false
                if (!rendererGone) showRendererRecovery(view)
                return true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                if (view == null || !acceptsWebViewCallbacks(view)) return
                openPomodoroFromNotification()
                openPersonalAlarmFromNotification()
            }

            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (uri.host == WebViewAssetLoader.DEFAULT_DOMAIN) return false
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, uri))
                    true
                } catch (_: Exception) {
                    false
                }
            }
        }

        webView.loadUrl("https://appassets.androidplatform.net/assets/app/index.html")
    }

    // A lost renderer cannot be reused. Keep saved WebView data intact, detach
    // the dead instance and require an explicit retry instead of a crash loop.
    private fun showRendererRecovery(view: WebView) {
        stopPendingNotificationOpen()
        stopPendingPersonalAlarm()
        personalAlarmScreenOpened = false
        rendererGone = true
        pendingWebFilePicker?.onReceiveValue(null)
        pendingWebFilePicker = null
        val spanish = java.util.Locale.getDefault().language == "es"
        val density = resources.displayMetrics.density
        val panel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            val padding = (24 * density).toInt()
            setPadding(padding, padding, padding, padding)
        }
        panel.addView(TextView(this).apply {
            text = if (spanish) "No se pudo mostrar Michel’s Life. Vuelve a abrir la aplicación. Tus datos guardados no se han borrado."
                   else "Michel’s Life could not display its content. Reopen the app. Your saved data has not been erased."
            gravity = Gravity.CENTER
            textSize = 16f
        })
        panel.addView(Button(this).apply {
            text = if (spanish) "Volver a abrir" else "Reopen"
            setOnClickListener {
                if (!recoveryRequested && !isDestroyed && !isFinishing) {
                    recoveryRequested = true
                    isEnabled = false
                    recreate()
                }
            }
        })
        setContentView(panel)
        view.destroy()
    }

    private fun openPomodoroFromNotification() {
        stopPendingNotificationOpen()
        if (!::webView.isInitialized || !acceptsWebViewCallbacks(webView) ||
            !intent.getBooleanExtra(NativeFocusAlarm.EXTRA_OPEN_FOCUS, false)) return
        attemptNotificationFocusOpen(notificationOpenGeneration, 0)
    }

    private fun attemptNotificationFocusOpen(generation: Int, retries: Int) {
        if (generation != notificationOpenGeneration || !acceptsWebViewCallbacks(webView) ||
            !intent.getBooleanExtra(NativeFocusAlarm.EXTRA_OPEN_FOCUS, false)) return

        // Do not acknowledge/consume the notification tap until the REAL
        // Android Focus workspace opens. Optional chaining can silently do
        // nothing during WebView cold start, losing the user's action.
        webView.evaluateJavascript(
            "(function(){try{return window.MichelsLifeMobileExperience?.openFocus?.()===true;}" +
                "catch(_){return false;}})();"
        ) { opened ->
            if (generation != notificationOpenGeneration || !acceptsWebViewCallbacks(webView) ||
                !intent.getBooleanExtra(NativeFocusAlarm.EXTRA_OPEN_FOCUS, false)) {
                return@evaluateJavascript
            }
            if (opened == "true") {
                intent.removeExtra(NativeFocusAlarm.EXTRA_OPEN_FOCUS)
                pendingNotificationOpen = null
            } else if (FocusDeliveryPolicy.shouldRetryNotificationOpen(true, false, retries)) {
                val retry = Runnable { attemptNotificationFocusOpen(generation, retries + 1) }
                pendingNotificationOpen = retry
                webView.postDelayed(retry, 300L)
            }
            // A timed-out request remains pending for a later onResume or
            // page-finished event; no uncontrolled polling and no fake success.
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        val queue = ArrayList<String>()
        activePersonalAlarmId?.let { queue.add(it) }
        queue.addAll(pendingPersonalAlarmIds)
        outState.putStringArrayList(personalAlarmQueueKey, queue)
        super.onSaveInstanceState(outState)
    }

    override fun onNewIntent(newIntent: Intent) {
        super.onNewIntent(newIntent)
        setIntent(newIntent)
        openPomodoroFromNotification()
        openPersonalAlarmFromNotification()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 4706 && ::webView.isInitialized && acceptsWebViewCallbacks(webView))
            webView.evaluateJavascript(
                "window.MichelsLifeMobileExperience?.resyncNativeNotification?.();", null
            )
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized && acceptsWebViewCallbacks(webView)) {
            webView.onResume()
            webView.evaluateJavascript(
                "window.MichelsLifeMobileExperience?.resyncNativeNotification?.();" +
                "window.dispatchEvent(new Event('focus'));", null
            )
            openPomodoroFromNotification()
            openPersonalAlarmFromNotification()
        }
    }

    override fun onPause() {
        stopPendingNotificationOpen()
        stopPendingPersonalAlarm()
        if (::webView.isInitialized && !rendererGone) webView.onPause()
        super.onPause()
    }

    @Deprecated("Deprecated in Android; retained for Google authorization resolution compatibility.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == 7942) {
            val chosen = if (resultCode == Activity.RESULT_OK) {
                val clips = data?.clipData
                if (clips != null) (0 until clips.itemCount).mapNotNull { clips.getItemAt(it).uri }.distinct().toTypedArray()
                else data?.data?.let { arrayOf(it) }
            } else null
            pendingWebFilePicker?.onReceiveValue(chosen)
            pendingWebFilePicker = null
            return
        }
        if (::calendarConsent.isInitialized &&
            calendarConsent.onActivityResult(requestCode, resultCode, data)) return
        if (::calendarWriteConsent.isInitialized &&
            calendarWriteConsent.onActivityResult(requestCode, resultCode, data)) return
        if (::auth.isInitialized && auth.onActivityResult(requestCode, resultCode, data)) return
        super.onActivityResult(requestCode, resultCode, data)
    }

    override fun onDestroy() {
        pendingWebFilePicker?.onReceiveValue(null)
        pendingWebFilePicker = null
        stopPendingNotificationOpen()
        stopPendingPersonalAlarm()
        stopAlarmAttention()
        executor.shutdownNow()
        if (::webView.isInitialized && !rendererGone) webView.destroy()
        super.onDestroy()
    }

    private fun fallbackBackNavigation() {
        if (::webView.isInitialized && !rendererGone && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    @Deprecated("Deprecated in Android; retained while Michel's Life coordinates WebView and native back behavior.")
    override fun onBackPressed() {
        if (!::webView.isInitialized || rendererGone) {
            super.onBackPressed()
            return
        }
        webView.evaluateJavascript(
            "(function(){try{return !!(window.__mlvAndroidHandleBack&&window.__mlvAndroidHandleBack());}catch(e){return false;}})();"
        ) { handled ->
            if (acceptsWebViewCallbacks(webView) && handled != "true") fallbackBackNavigation()
        }
    }
}
