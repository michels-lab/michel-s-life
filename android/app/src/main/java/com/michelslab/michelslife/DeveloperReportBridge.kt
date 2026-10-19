package com.michelslab.michelslife

import android.webkit.JavascriptInterface
import android.os.Debug
import android.os.SystemClock
import org.json.JSONObject

/** No privileged audit endpoint is exposed by the customer-facing APK. */
class DeveloperReportBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun saveReport(name: String, content: String) {
        activity.saveDeveloperReport(name, content)
    }

    /**
     * Non-personal native signals only: no Logcat, URLs, account identifiers,
     * storage paths, credentials, user-entered values or device identifiers.
     * This JavaScript interface is installed only for the .developer package.
     */
    @JavascriptInterface
    fun runtimeSnapshot(): String {
        if (!activity.packageName.endsWith(".developer")) return "{}"
        return try {
            val runtime = Runtime.getRuntime()
            val installedVersion = activity.packageManager
                .getPackageInfo(activity.packageName, 0).versionName ?: "unknown"
            JSONObject()
                .put("developerEdition", true)
                .put("platform", "android")
                .put("appVersion", installedVersion.take(45))
                .put("notificationPermission", NativeFocusAlarm.notificationPermissionGranted(activity))
                .put("javaHeapUsedKb", (runtime.totalMemory() - runtime.freeMemory()) / 1024)
                .put("javaHeapMaxKb", runtime.maxMemory() / 1024)
                .put("nativeHeapAllocatedKb", Debug.getNativeHeapAllocatedSize() / 1024)
                .put("uptimeMs", SystemClock.elapsedRealtime())
                .toString()
        } catch (_: Exception) {
            """{"developerEdition":true,"platform":"android","diagnosticsUnavailable":true}"""
        }
    }
}
