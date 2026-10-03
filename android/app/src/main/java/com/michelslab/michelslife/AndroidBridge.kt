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
    private val cloud: DriveCloudEngine,
    private val meta: CloudMetaStore,
    private val executor: ExecutorService
) {
    companion object {
        private const val CHANNEL = "michels-life-google-calendar"
        private const val RESPONSE = "michels-life-google-calendar-response"
    }

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
            "sync" -> respondOk(requestId, JSONObject()
                .put("events", JSONArray())
                .put("syncedAt", Instant.now().toString())
                .put("googleEventCount", 0)
                .put("managedEventCount", 0)
                .put("pushedMissionCount", 0))
            "diagnostics" -> respondOk(requestId, JSONObject()
                .put("platform", "Android")
                .put("version", DriveCloudEngine.ANDROID_VERSION)
                .put("status", "ok"))
            "updateStatus" -> {
                val channel = installChannel()
                respondOk(requestId, JSONObject()
                    .put("updateAvailable", false)
                    .put("managedExternally", true)
                    .put("channel", channel)
                    .put("version", DriveCloudEngine.ANDROID_VERSION)
                    .put(
                        "status",
                        if (channel == "google-play")
                            "Updates are managed by Google Play."
                        else
                            "Test build. Production updates are delivered through Google Play."
                    ))
            }
            else -> respondError(requestId, "This Michel's Life desktop action is not available on Android yet: " + action)
        }
    }

    @Suppress("DEPRECATION")
    private fun installChannel(): String {
        val installer = try {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                activity.packageManager
                    .getInstallSourceInfo(activity.packageName)
                    .installingPackageName
            } else {
                activity.packageManager.getInstallerPackageName(activity.packageName)
            }
        } catch (_: Exception) {
            null
        }
        return if (installer == "com.android.vending") "google-play" else "test"
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
        val base = restoreDir().canonicalFile
        val file = File(base, name).canonicalFile
        if (!file.path.startsWith(base.path) || !file.exists()) throw IllegalArgumentException("Restore point not found.")
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
