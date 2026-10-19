package com.michelslab.michelslife

import android.webkit.JavascriptInterface

/** No privileged audit endpoint is exposed by the customer-facing APK. */
class DeveloperReportBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun saveReport(name: String, content: String) {
        activity.saveDeveloperReport(name, content)
    }
}
