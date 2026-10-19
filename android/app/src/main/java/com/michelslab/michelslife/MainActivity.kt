package com.michelslab.michelslife

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
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
    lateinit var cloud: DriveCloudEngine
        private set
    private val executor = Executors.newSingleThreadExecutor()
    private val isDeveloperEdition: Boolean
        get() = packageName.endsWith(".developer")
    private var pendingDeveloperExport: Pair<String, ByteArray>? = null
    private val developerExportRequest = 4719

    fun saveDeveloperReport(name: String, text: String) {
        if (!isDeveloperEdition || text.length > 1_000_000) return
        val safeName = name.replace(Regex("[^A-Za-z0-9._-]"), "-").take(100)
        if (!safeName.startsWith("michels-life-developer-")) return
        val bytes = text.toByteArray(Charsets.UTF_8)
        runOnUiThread {
            pendingDeveloperExport = safeName to bytes
            val chooser = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = if (safeName.endsWith(".json")) "application/json" else "text/plain"
                putExtra(Intent.EXTRA_TITLE, safeName)
            }
            try {
                startActivityForResult(chooser, developerExportRequest)
            } catch (_: Exception) {
                pendingDeveloperExport = null
                Toast.makeText(this, "Document export is not available", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        NativeFocusAlarm.createChannel(this)
        val meta = CloudMetaStore(this)
        auth = GoogleAuthorizationCoordinator(this)
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
            AndroidBridge(this, webView, auth, cloud, meta, executor),
            "MichelsLifeAndroid"
        )
        // This native export bridge is absent from every PUBLIC build.
        if (isDeveloperEdition) {
            webView.addJavascriptInterface(DeveloperReportBridge(this), "MichelsLabDeveloperNative")
        }

        webView.webViewClient = object : WebViewClientCompat() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                openPomodoroFromNotification()
                // Source-set-only asset: the public APK cannot load this UI.
                if (isDeveloperEdition) {
                    try {
                        val script = assets.open("app/developer-diagnostics.js").bufferedReader().use { it.readText() }
                        webView.evaluateJavascript(script, null)
                    } catch (_: Exception) {
                        android.util.Log.e("MichelLifeDeveloper", "Developer diagnostics bundle missing")
                    }
                }
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
        if (!::webView.isInitialized ||
            !intent.getBooleanExtra(NativeFocusAlarm.EXTRA_OPEN_FOCUS, false)) return
        intent.removeExtra(NativeFocusAlarm.EXTRA_OPEN_FOCUS)
        webView.evaluateJavascript(
            "window.MichelsLifeMobileExperience?.openFocus?.();", null
        )
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
        }
    }

    override fun onPause() {
        if (::webView.isInitialized) webView.onPause()
        super.onPause()
    }

    @Deprecated("Deprecated in Android; retained for Google authorization resolution compatibility.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == developerExportRequest) {
            val export = pendingDeveloperExport
            pendingDeveloperExport = null
            if (resultCode == RESULT_OK && data?.data != null && export != null) {
                try {
                    contentResolver.openOutputStream(data.data!!)?.use { it.write(export.second) }
                        ?: error("No writable document stream")
                    Toast.makeText(this, "Developer report saved", Toast.LENGTH_SHORT).show()
                } catch (_: Exception) {
                    Toast.makeText(this, "Could not save developer report", Toast.LENGTH_SHORT).show()
                }
            }
            return
        }
        if (::auth.isInitialized && auth.onActivityResult(requestCode, resultCode, data)) return
        super.onActivityResult(requestCode, resultCode, data)
    }

    override fun onDestroy() {
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
