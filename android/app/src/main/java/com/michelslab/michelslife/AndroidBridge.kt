package com.michelslab.michelslife

import android.content.Intent
import android.provider.CalendarContract
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.Instant
import java.time.format.DateTimeFormatter
import java.util.concurrent.ExecutorService

class AndroidBridge(
    private val activity: MainActivity,
    private val webView: WebView,
    private val auth: GoogleAuthorizationCoordinator,
    private val calendarConsent: AndroidCalendarConsent,
    private val cloud: DriveCloudEngine,
    private val meta: CloudMetaStore,
    private val executor: ExecutorService
) {
    private val calendarGateway = AndroidCalendarGateway()

    companion object {
        private const val CHANNEL = "michels-life-google-calendar"
        private const val RESPONSE = "michels-life-google-calendar-response"
    }

    /**
     * Delivery-only native alarm API for the shared FocusStoryV30162 clock.
     * Does not write WebView timer state, award XP or create sessions.
     */
    @JavascriptInterface
    fun syncFocusAlarm(rawState: String): String = try {
        NativeFocusAlarm.sync(activity, JSONObject(rawState)).toString()
    } catch (e: Exception) {
        JSONObject().put("scheduled", false)
            .put("error", e.message ?: "Could not schedule Focus notification.").toString()
    }

    @JavascriptInterface
    fun focusNotificationStatus(): String =
        NativeFocusAlarm.status(activity).toString()

    @JavascriptInterface
    fun requestFocusNotificationPermission(): String {
        if (android.os.Build.VERSION.SDK_INT >= 33 &&
            !NativeFocusAlarm.notificationPermissionGranted(activity)) {
            activity.runOnUiThread {
                activity.requestPermissions(
                    arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 4706
                )
            }
        }
        return NativeFocusAlarm.status(activity).toString()
    }

    /** When the user disabled just the Focus notification channel, a new
     * POST_NOTIFICATIONS permission dialog cannot restore that channel.
     * Open the genuine Android app-notification settings instead. */
    @JavascriptInterface
    fun openFocusNotificationSettings() {
        activity.runOnUiThread {
            try {
                activity.startActivity(
                    Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                        putExtra(
                            android.provider.Settings.EXTRA_APP_PACKAGE,
                            activity.packageName
                        )
                    }
                )
            } catch (_: Exception) {
                // OS settings are not guaranteed on every manufacturer.
                // Do not claim notification delivery was enabled.
            }
        }
    }

    @JavascriptInterface
    fun calendarReadAvailable(): Boolean = true

    @JavascriptInterface
    fun postMessage(raw: String) {
        try {
            val msg = JSONObject(raw)
            if (msg.optString("channel") != CHANNEL) return
            val requestId = msg.optString("requestId")
            val action = msg.optString("action")
            val payload = msg.optJSONObject("payload") ?: JSONObject()
            handle(requestId, action, payload)
        } catch (_: Exception) { }
    }

    private fun handle(requestId: String, action: String, payload: JSONObject) {
        when (action) {
            "status" -> authorizeFor(requestId, false) { token, account ->
                respondOk(requestId, cloud.status(account))
            }
            "connect" -> authorizeFor(requestId, true) { token, account ->
                respondOk(requestId, cloud.status(account))
            }
            "disconnect" -> {
                meta.resetForDisconnect()
                respondOk(requestId, cloud.status(""))
            }
            "cloudDirty" -> {
                val at = parseInstant(payload.optString("changedAt")) ?: Instant.now()
                meta.markDirty(at)
                respondOk(requestId, JSONObject().put("marked", true).put("changedAt", at.toString()))
            }
            "cloudAccept" -> {
                val hash = payload.optString("hash", "")
                val modified = parseInstant(payload.optString("remoteModifiedAt"))
                meta.acceptRestore(hash, modified)
                respondOk(requestId, JSONObject().put("accepted", true))
            }
            "cloudSync" -> authorizeFor(requestId, false) { token, account ->
                executor.execute {
                    try {
                        val result = cloud.sync(
                            token,
                            account,
                            payload.optString("backupJson", ""),
                            payload.optString("localChangedAt", ""),
                            payload.optString("mode", "auto")
                        )
                        respondOk(requestId, result)
                    } catch (e: Exception) {
                        respondError(requestId, e.message ?: "Cloud sync failed.")
                    }
                }
            }
            "cloudOverview" -> authorizeFor(requestId, false) { token, account ->
                executor.execute {
                    try { respondOk(requestId, cloud.overview(token)) }
                    catch (e: Exception) { respondError(requestId, e.message ?: "Cloud overview failed.") }
                }
            }
            "cloudRestoreBackup" -> authorizeFor(requestId, false) { token, account ->
                executor.execute {
                    try {
                        payload.optString("backupJson", "").takeIf { it.isNotBlank() }?.let {
                            createRestorePoint(it, "before_cloud_history_restore")
                        }
                        respondOk(requestId, cloud.restoreCloudBackup(token, payload.optString("fileId")))
                    } catch (e: Exception) {
                        respondError(requestId, e.message ?: "Cloud backup restore failed.")
                    }
                }
            }
            "createRestorePoint" -> {
                try {
                    respondOk(requestId, createRestorePoint(
                        payload.optString("backupJson", ""),
                        payload.optString("reason", "manual")
                    ))
                } catch (e: Exception) {
                    respondError(requestId, e.message ?: "Could not create restore point.")
                }
            }
            "restorePointOverview" -> respondOk(requestId, restorePointOverview())
            "restoreLocalPoint" -> {
                try {
                    payload.optString("backupJson", "").takeIf { it.isNotBlank() }?.let {
                        createRestorePoint(it, "before_local_timeline_restore")
                    }
                    val file = safeRestoreFile(payload.optString("fileName"))
                    respondOk(requestId, JSONObject().put("backupJson", file.readText()))
                } catch (e: Exception) {
                    respondError(requestId, e.message ?: "Local restore failed.")
                }
            }
            "openCalendar" -> {
                try {
                    activity.startActivity(Intent(Intent.ACTION_VIEW, CalendarContract.CONTENT_URI))
                    respondOk(requestId, JSONObject().put("opened", true))
                } catch (e: Exception) {
                    respondError(requestId, e.message ?: "Could not open Calendar.")
                }
            }
            // Explicit Android-only Calendar read. Uses an independent
            // read-only consent token, never the Drive app-folder credential.
            // No mission, XP, Supabase or cloud backup is mutated here.
            "calendarRead" -> activity.runOnUiThread {
                calendarConsent.authorize(true) { result ->
                    result.onFailure {
                        respondError(requestId, "Google Calendar permission was not granted or is unavailable.")
                    }
                    result.onSuccess { authorized ->
                        if (authorized == null) {
                            respondError(requestId, "Google Calendar permission is required.")
                            return@onSuccess
                        }
                        executor.execute {
                            try {
                                val email = cloud.fetchUserEmail(authorized.accessToken)
                                if (email.isBlank()) throw SecurityException("Google Calendar account identity is unavailable.")
                                val events = calendarGateway.readEvents(
                                    authorized.accessToken,
                                    payload.optString("timeMin"),
                                    payload.optString("timeMax")
                                )
                                respondOk(requestId, events.put("account", email))
                            } catch (_: Exception) {
                                // Never echo provider JSON, bearer credentials
                                // or account identifiers into errors/logs.
                                respondError(requestId, "Google Calendar could not be read. Check the connection and permissions.")
                            }
                        }
                    }
                }
            }
            // The original desktop 'sync' can publish missions in bulk.
            // Native Android does not do that without per-action write consent.
            "sync" -> respondError(
                requestId,
                "Google Calendar publishing is not enabled on Android. No events were written."
            )
            "diagnostics" -> respondOk(requestId, JSONObject()
                .put("platform", "Android")
                .put("version", DriveCloudEngine.ANDROID_VERSION)
                .put("status", "ok"))
            "updateStatus" -> {
                // Read-only discovery uses the installed signing certificate,
                // not a missing installer label, to recognize real Direct APKs.
                // Network requests must never run on the Activity/UI thread.
                when (AndroidDirectUpdateChecker.channel(activity)) {
                    "android-direct" -> executor.execute {
                        respondOk(requestId, AndroidDirectUpdateChecker.check(activity))
                    }
                    "google-play" -> respondOk(requestId, JSONObject()
                        .put("updateAvailable", false)
                        .put("checked", false)
                        .put("managedExternally", true)
                        .put("channel", "google-play")
                        .put("version", DriveCloudEngine.ANDROID_VERSION)
                        .put("status", "Updates for this installation are managed by Google Play."))
                    else -> respondOk(requestId, JSONObject()
                        .put("updateAvailable", false)
                        .put("checked", false)
                        .put("managedExternally", false)
                        .put("channel", "test")
                        .put("version", DriveCloudEngine.ANDROID_VERSION)
                        .put("status", "Unrecognized or debug signer. No production update offered; protect local data."))
                }
            }
            else -> respondError(requestId, "This Michel's Life desktop action is not available on Android yet: " + action)
        }
    }

    private fun authorizeFor(
        requestId: String,
        interactive: Boolean,
        block: (String, String) -> Unit
    ) {
        activity.runOnUiThread {
            auth.authorize(interactive) { result ->
                result.onFailure { respondError(requestId, it.message ?: "Google authorization failed.") }
                result.onSuccess { session ->
                    if (session == null) {
                        respondError(requestId, if (interactive) "Google authorization failed." else "Connect Google first.")
                        return@onSuccess
                    }
                    executor.execute {
                        try {
                            val email = cloud.fetchUserEmail(session.accessToken)
                            block(session.accessToken, email)
                        } catch (e: Exception) {
                            respondError(requestId, e.message ?: "Google account lookup failed.")
                        }
                    }
                }
            }
        }
    }

    private fun respondOk(requestId: String, payload: Any?) {
        send(JSONObject()
            .put("channel", RESPONSE)
            .put("requestId", requestId)
            .put("ok", true)
            .put("payload", payload ?: JSONObject.NULL))
    }

    private fun respondError(requestId: String, error: String) {
        send(JSONObject()
            .put("channel", RESPONSE)
            .put("requestId", requestId)
            .put("ok", false)
            .put("error", error))
    }

    private fun send(message: JSONObject) {
        val quoted = JSONObject.quote(message.toString())
        activity.runOnUiThread {
            webView.evaluateJavascript("window.__mlvAndroidReceive && window.__mlvAndroidReceive(" + quoted + ");", null)
        }
    }

    private fun restoreDir(): File = File(activity.filesDir, "restore-points").also { it.mkdirs() }

    private fun createRestorePoint(backupJson: String, reason: String): JSONObject {
        if (backupJson.isBlank()) throw IllegalArgumentException("Restore point payload is empty.")
        JSONObject(backupJson)
        val safeReason = reason.replace(Regex("[^A-Za-z0-9_-]"), "_").take(40)
        val stamp = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS")
            .withZone(java.time.ZoneOffset.UTC)
            .format(Instant.now())
        val file = File(restoreDir(), "michels_life_restore_" + stamp + "_" + safeReason + ".json")
        file.writeText(backupJson)
        pruneLocalRestorePoints()
        return JSONObject()
            .put("fileName", file.name)
            .put("createdAt", Instant.ofEpochMilli(file.lastModified()).toString())
            .put("size", file.length())
            .put("reason", reason)
    }

    private fun restorePointOverview(): JSONObject {
        val rows = JSONArray()
        restoreDir().listFiles()
            ?.filter { it.isFile && it.extension.equals("json", true) }
            ?.sortedByDescending { it.lastModified() }
            ?.take(20)
            ?.forEach { f ->
                rows.put(JSONObject()
                    .put("fileName", f.name)
                    .put("createdAt", Instant.ofEpochMilli(f.lastModified()).toString())
                    .put("size", f.length())
                    .put("reason", f.name.substringAfterLast("_").substringBeforeLast(".")))
            }
        return JSONObject()
            .put("restorePoints", rows)
            .put("currentDeviceName", android.os.Build.MANUFACTURER + " " + android.os.Build.MODEL)
    }

    private fun safeRestoreFile(name: String): File {
        // A textual path prefix can accidentally accept sibling directories
        // such as restore-points-old. Require an actual file whose canonical
        // parent is exactly our device-local restore directory.
        if (name.isBlank() || name.length > 160 ||
            !name.matches(Regex("[A-Za-z0-9._-]+")) ||
            name == "." || name == "..") {
            throw IllegalArgumentException("Invalid restore point file name.")
        }
        val base = restoreDir().canonicalFile
        val file = File(base, name).canonicalFile
        if (file.parentFile != base || !file.isFile) {
            throw IllegalArgumentException("Restore point not found.")
        }
        return file
    }

    private fun pruneLocalRestorePoints() {
        restoreDir().listFiles()
            ?.filter { it.isFile }
            ?.sortedByDescending { it.lastModified() }
            ?.drop(20)
            ?.forEach { it.delete() }
    }

    private fun parseInstant(raw: String?): Instant? = try {
        if (raw.isNullOrBlank() || raw == "null") null else Instant.parse(raw)
    } catch (_: Exception) { null }
}
