package com.michelslab.michelslife

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
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
    lateinit var cloud: DriveCloudEngine
        private set
    private val executor = Executors.newSingleThreadExecutor()
    private var notificationOpenGeneration = 0
    private var pendingNotificationOpen: Runnable? = null

    // The notification can cold-start this Activity before the canonical
    // Story/Focus JavaScript has finished booting. A page-finished event only
    // means the HTML loaded; it does not prove the mobile UI is ready.
    private fun stopPendingNotificationOpen() {
        notificationOpenGeneration++
        if (::webView.isInitialized) {
            pendingNotificationOpen?.let { webView.removeCallbacks(it) }
        }
        pendingNotificationOpen = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        NativeFocusAlarm.createChannel(this)
        val meta = CloudMetaStore(this)
        auth = GoogleAuthorizationCoordinator(this)
        calendarConsent = AndroidCalendarConsent(this)
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
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_BOUND, true)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = false
            allowContentAccess = false
            mediaPlaybackRequiresUserGesture = false
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            offscreenPreRaster = true
        }

        webView.addJavascriptInterface(
            AndroidBridge(this, webView, auth, calendarConsent, cloud, meta, executor),
            "MichelsLifeAndroid"
        )

        webView.webViewClient = object : WebViewClientCompat() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                openPomodoroFromNotification()
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

    private fun openPomodoroFromNotification() {
        stopPendingNotificationOpen()
        if (!::webView.isInitialized || isDestroyed ||
            !intent.getBooleanExtra(NativeFocusAlarm.EXTRA_OPEN_FOCUS, false)) return
        attemptNotificationFocusOpen(notificationOpenGeneration, 0)
    }

    private fun attemptNotificationFocusOpen(generation: Int, retries: Int) {
        if (generation != notificationOpenGeneration || isDestroyed ||
            !intent.getBooleanExtra(NativeFocusAlarm.EXTRA_OPEN_FOCUS, false)) return

        // Do not acknowledge/consume the notification tap until the REAL
        // Android Focus workspace opens. Optional chaining can silently do
        // nothing during WebView cold start, losing the user's action.
        webView.evaluateJavascript(
            "(function(){try{return window.MichelsLifeMobileExperience?.openFocus?.()===true;}" +
                "catch(_){return false;}})();"
        ) { opened ->
            if (generation != notificationOpenGeneration || isDestroyed ||
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

    override fun onNewIntent(newIntent: Intent) {
        super.onNewIntent(newIntent)
        setIntent(newIntent)
        openPomodoroFromNotification()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 4706 && ::webView.isInitialized)
            webView.evaluateJavascript(
                "window.MichelsLifeMobileExperience?.resyncNativeNotification?.();", null
            )
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized) {
            webView.onResume()
            webView.evaluateJavascript(
                "window.MichelsLifeMobileExperience?.resyncNativeNotification?.();" +
                "window.dispatchEvent(new Event('focus'));", null
            )
            openPomodoroFromNotification()
        }
    }

    override fun onPause() {
        stopPendingNotificationOpen()
        if (::webView.isInitialized) webView.onPause()
        super.onPause()
    }

    @Deprecated("Deprecated in Android; retained for Google authorization resolution compatibility.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (::calendarConsent.isInitialized &&
            calendarConsent.onActivityResult(requestCode, resultCode, data)) return
        if (::auth.isInitialized && auth.onActivityResult(requestCode, resultCode, data)) return
        super.onActivityResult(requestCode, resultCode, data)
    }

    override fun onDestroy() {
        stopPendingNotificationOpen()
        executor.shutdownNow()
        if (::webView.isInitialized) webView.destroy()
        super.onDestroy()
    }

    private fun fallbackBackNavigation() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    @Deprecated("Deprecated in Android; retained while Michel's Life coordinates WebView and native back behavior.")
    override fun onBackPressed() {
        if (!::webView.isInitialized) {
            super.onBackPressed()
            return
        }
        webView.evaluateJavascript(
            "(function(){try{return !!(window.__mlvAndroidHandleBack&&window.__mlvAndroidHandleBack());}catch(e){return false;}})();"
        ) { handled ->
            if (handled != "true") fallbackBackNavigation()
        }
    }
}
