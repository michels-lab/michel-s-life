package com.michelslab.michelslife

import android.content.Context
import android.os.Build
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.HttpUrl.Companion.toHttpUrl
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.security.MessageDigest
import java.time.Instant
import java.util.UUID
import java.util.concurrent.TimeUnit

data class CloudFileInfo(
    val id: String,
    val name: String,
    val modifiedTime: Instant?,
    val contentHash: String,
    val sourceDeviceId: String,
    val sourceUpdatedAt: Instant?,
    val size: Long,
    val appProperties: JSONObject
)

data class CloudMeta(
    var deviceId: String,
    var account: String = "",
    var lastSyncedHash: String = "",
    var lastSyncedAt: Instant? = null,
    var lastCloudModifiedAt: Instant? = null,
    var lastLocalDirtyAt: Instant? = null,
    var generation: Long = 0L,
    var dirtyRevision: Long = 0L
)

class CloudMetaStore(context: Context) {
    private val prefs = context.getSharedPreferences("michels_life_cloud_meta", Context.MODE_PRIVATE)
    // Activity recreation can create another store over the same preferences.
    companion object { private val lock = Any() }
    private data class PendingRestore(val owner: CloudMeta, val hash: String, val modified: Instant?)
    private var pendingRestore: PendingRestore? = null

    fun load(): CloudMeta = synchronized(lock) { loadLocked() }

    private fun loadLocked(): CloudMeta {
        val device = prefs.getString("deviceId", null) ?: UUID.randomUUID().toString().replace("-", "").also {
            check(prefs.edit().putString("deviceId", it).commit()) { "Cloud identity persistence failed." }
        }
        return CloudMeta(
            deviceId = device,
            account = prefs.getString("account", "") ?: "",
            lastSyncedHash = prefs.getString("lastSyncedHash", "") ?: "",
            lastSyncedAt = parseInstant(prefs.getString("lastSyncedAt", null)),
            lastCloudModifiedAt = parseInstant(prefs.getString("lastCloudModifiedAt", null)),
            lastLocalDirtyAt = parseInstant(prefs.getString("lastLocalDirtyAt", null)),
            generation = prefs.getLong("generation", 0L),
            dirtyRevision = prefs.getLong("dirtyRevision", 0L)
        )
    }

    private fun saveLocked(meta: CloudMeta) {
        check(prefs.edit()
            .putString("deviceId", meta.deviceId)
            .putString("account", meta.account)
            .putString("lastSyncedHash", meta.lastSyncedHash)
            .putString("lastSyncedAt", meta.lastSyncedAt?.toString())
            .putString("lastCloudModifiedAt", meta.lastCloudModifiedAt?.toString())
            .putString("lastLocalDirtyAt", meta.lastLocalDirtyAt?.toString())
            .putLong("generation", meta.generation)
            .putLong("dirtyRevision", meta.dirtyRevision)
            .commit()) { "Cloud metadata persistence failed." }
    }

    fun beginSync(account: String, localChangedAt: Instant?, expectedGeneration: Long,
                  expectedDirtyRevision: Long): CloudMeta =
        synchronized(lock) {
            require(account.isNotBlank()) { "Cloud account is required." }
            var meta = loadLocked()
            check(meta.generation == expectedGeneration) { "Cloud account changed; retry." }
            check(meta.dirtyRevision == expectedDirtyRevision) { "Local edits changed before cloud sync; retry." }
            pendingRestore = null
            if (meta.account.isNotBlank() && !meta.account.equals(account, true)) {
                meta = CloudMeta(deviceId = UUID.randomUUID().toString().replace("-", ""),
                    account = account, generation = meta.generation + 1)
            }
            meta.account = account
            if (localChangedAt != null &&
                (meta.lastLocalDirtyAt == null || localChangedAt.isAfter(meta.lastLocalDirtyAt))) {
                meta.lastLocalDirtyAt = localChangedAt
                meta.dirtyRevision++
            }
            saveLocked(meta)
            meta
        }

    private fun requireCurrentLocked(expected: CloudMeta): CloudMeta {
        val current = loadLocked()
        check(current.generation == expected.generation && current.deviceId == expected.deviceId &&
            current.account.equals(expected.account, true)) { "Cloud account changed; retry." }
        return current
    }

    fun requireCurrent(expected: CloudMeta) = synchronized(lock) { requireCurrentLocked(expected); Unit }

    fun snapshotIfCurrent(expected: CloudMeta): CloudMeta = synchronized(lock) { requireCurrentLocked(expected) }

    fun markDirty(at: Instant) = synchronized(lock) {
        val meta = loadLocked()
        if (meta.lastLocalDirtyAt == null || at.isAfter(meta.lastLocalDirtyAt))
            meta.lastLocalDirtyAt = at
        meta.dirtyRevision++
        saveLocked(meta)
    }

    fun commitUploaded(expected: CloudMeta, hash: String, remoteModifiedAt: Instant?) = synchronized(lock) {
        val current = requireCurrentLocked(expected)
        current.lastSyncedHash = hash
        current.lastSyncedAt = Instant.now()
        current.lastCloudModifiedAt = remoteModifiedAt
        // A completed upload acknowledges only the snapshot it actually sent.
        if (current.dirtyRevision == expected.dirtyRevision) current.lastLocalDirtyAt = null
        saveLocked(current)
    }

    fun registerRestore(expected: CloudMeta, hash: String, modified: Instant?) = synchronized(lock) {
        val current = requireCurrentLocked(expected)
        check(current.dirtyRevision == expected.dirtyRevision) { "Local edits changed during cloud read; retry." }
        check(hash.matches(Regex("^[a-fA-F0-9]{64}$"))) { "Invalid cloud snapshot hash." }
        pendingRestore = PendingRestore(expected.copy(), hash, modified)
    }

    fun acceptRestore(hash: String, remoteModifiedAt: Instant?) = synchronized(lock) {
        val pending = pendingRestore ?: throw IllegalStateException("No verified cloud restore is pending.")
        val current = requireCurrentLocked(pending.owner)
        check(pending.hash.equals(hash, true) && pending.modified == remoteModifiedAt) {
            "Cloud restore does not match the reviewed snapshot."
        }
        current.lastSyncedHash = hash
        current.lastSyncedAt = Instant.now()
        current.lastCloudModifiedAt = remoteModifiedAt
        if (current.dirtyRevision == pending.owner.dirtyRevision) current.lastLocalDirtyAt = null
        saveLocked(current)
        pendingRestore = null
    }

    fun resetForDisconnect() = synchronized(lock) {
        val previous = loadLocked()
        pendingRestore = null
        check(prefs.edit().clear().putString("deviceId", previous.deviceId)
            .putLong("generation", previous.generation + 1).commit()) { "Cloud disconnect persistence failed." }
    }

    private fun parseInstant(raw: String?): Instant? = try {
        if (raw.isNullOrBlank()) null else Instant.parse(raw)
    } catch (_: Exception) { null }
}

class DriveCloudEngine(
    private val context: Context,
    private val metaStore: CloudMetaStore
) {
    companion object {
        const val DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata"
        const val CLOUD_FILE_NAME = "michels_life_cloud_state.json"
        const val CLOUD_BACKUP_PREFIX = "michels_life_backup_"
        const val DEVICE_FILE_PREFIX = "michels_life_device_"
        const val CLOUD_BACKUP_LIMIT = 10
        const val ANDROID_VERSION = "0.2.24"
    }

    private val http = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .writeTimeout(45, TimeUnit.SECONDS)
        .build()

    fun fetchUserEmail(accessToken: String): String {
        val request = Request.Builder()
            .url("https://www.googleapis.com/oauth2/v3/userinfo")
            .header("Authorization", "Bearer " + accessToken)
            .get()
            .build()
        val body = execute(request)
        return JSONObject(body).optString("email", "")
    }

    fun status(account: String): JSONObject {
        val meta = metaStore.load()
        return JSONObject()
            .put("hasCredentials", true)
            .put("connected", account.isNotBlank())
            .put("cloudReady", account.isNotBlank())
            .put("account", account)
            .put("credentialProject", "Michel's Life Android")
            .put("storageFolder", "Google Drive appDataFolder")
            .put("cloudLastSync", if (account.isNotBlank() && meta.account.equals(account, true))
                meta.lastSyncedAt?.toString() ?: "" else "")
            .put("deviceId", meta.deviceId)
            .put("deviceName", deviceName())
    }

    fun sync(accessToken: String, account: String, backupJson: String, localChangedAtRaw: String?, modeRaw: String,
             expectedGeneration: Long, expectedDirtyRevision: Long): JSONObject {
        // Never allow a native bridge caller to upload credentials, provider
        // permissions, another device's identity or an unknown localStorage key.
        // The shared WebView allowlist is useful UX; this native guard is an
        // independent fail-closed defense before ANY Google network request.
        validateBackup(backupJson, forUpload = true)
        val mode = modeRaw.trim().lowercase()
        require(mode in setOf("auto", "upload", "download")) { "Unsupported cloud sync mode." }
        require(account.isNotBlank()) { "Cloud account is required." }
        val localChangedAt = parseInstant(localChangedAtRaw)

        val meta = metaStore.beginSync(account, localChangedAt, expectedGeneration, expectedDirtyRevision)

        val localHash = hashText(backupJson)
        val remote = findCloudFile(accessToken)
        metaStore.requireCurrent(meta)

        if (mode == "upload") {
            if (remote != null) {
                createHistoryBackup(accessToken, remote, "before_manual_upload")
            }
            metaStore.requireCurrent(meta)
            val uploaded = uploadCloudFile(accessToken, remote?.id, backupJson, localHash, meta.deviceId, Instant.now())
            commitUploaded(meta, localHash, uploaded)
            touchDevice(accessToken, meta, "uploaded")
            return result("uploaded", localHash, uploaded, null, false, "This device was uploaded to Google Drive.")
        }

        if (mode == "download") {
            if (remote == null) throw IllegalStateException("No Michel's Life cloud save exists in this Google account yet.")
            val downloaded = downloadCloudFile(accessToken, remote)
            metaStore.registerRestore(meta, downloaded.second, remote.modifiedTime)
            touchDevice(accessToken, meta, "download_requested")
            return result("downloaded", downloaded.second, remote, downloaded.first, true, "Cloud data is ready to restore on Android.")
        }

        if (remote == null) {
            metaStore.requireCurrent(meta)
            val created = uploadCloudFile(accessToken, null, backupJson, localHash, meta.deviceId, Instant.now())
            commitUploaded(meta, localHash, created)
            touchDevice(accessToken, meta, "created")
            return result("created", localHash, created, null, false, "First cloud save created from Android.")
        }

        var remoteHash = remote.contentHash
        var remoteContent: String? = null
        if (remoteHash.isBlank()) {
            val downloaded = downloadCloudFile(accessToken, remote)
            remoteContent = downloaded.first
            remoteHash = downloaded.second
        }

        // Identical copies converge even when both devices changed since the
        // last baseline or this is the first sync on the device.
        if (localHash.equals(remoteHash, true)) {
            commitUploaded(meta, localHash, remote)
            touchDevice(accessToken, meta, "noop")
            return result("noop", localHash, remote, null, false, "Android and Google Drive are already identical.")
        }

        if (meta.lastSyncedHash.isBlank()) {
            if (meta.lastLocalDirtyAt != null) {
                return conflict(localHash, remoteHash, remote, meta.lastLocalDirtyAt,
                    "This Android device has unsynced edits and an existing cloud save was found. Choose Keep this device or Use cloud.")
            }
            if (remoteContent == null) remoteContent = downloadCloudFile(accessToken, remote).first
            metaStore.registerRestore(meta, remoteHash, remote.modifiedTime)
            return result("downloaded", remoteHash, remote, remoteContent, true,
                "Existing cloud save found. Android will restore it before uploading anything.")
        }

        val localChanged = !localHash.equals(meta.lastSyncedHash, true)
        val remoteChanged = !remoteHash.equals(meta.lastSyncedHash, true)

        if (localChanged && !remoteChanged) {
            createHistoryBackup(accessToken, remote, "before_auto_upload")
            metaStore.requireCurrent(meta)
            val uploaded = uploadCloudFile(accessToken, remote.id, backupJson, localHash, meta.deviceId, Instant.now())
            commitUploaded(meta, localHash, uploaded)
            touchDevice(accessToken, meta, "uploaded")
            return result("uploaded", localHash, uploaded, null, false, "Android changes uploaded to Google Drive.")
        }

        if (!localChanged && remoteChanged) {
            if (remoteContent == null) remoteContent = downloadCloudFile(accessToken, remote).first
            metaStore.registerRestore(meta, remoteHash, remote.modifiedTime)
            return result("downloaded", remoteHash, remote, remoteContent, true, "Newer cloud changes found and ready to restore.")
        }

        // Both copies changed: wall-clock order cannot establish which edits
        // are disposable, especially across offline devices. Do not auto-win.
        return conflict(localHash, remoteHash, remote, meta.lastLocalDirtyAt,
            "Both Android and Google Drive changed. Choose Keep this device or Use cloud.")
    }

    fun overview(accessToken: String): JSONObject {
        val meta = metaStore.load()
        val backups = listFiles(accessToken, "name contains '" + CLOUD_BACKUP_PREFIX + "'", 100)
            .sortedByDescending { it.modifiedTime ?: Instant.EPOCH }
            .take(CLOUD_BACKUP_LIMIT)
        val backupJson = JSONArray()
        for (file in backups) {
            backupJson.put(JSONObject()
                .put("fileId", file.id)
                .put("name", file.name)
                .put("createdAt", file.modifiedTime?.toString() ?: "")
                .put("size", file.size)
                .put("hash", file.contentHash)
                .put("reason", file.appProperties.optString("michelsLifeReason", ""))
                .put("sourceDeviceId", file.appProperties.optString("michelsLifeSourceDevice", ""))
                .put("appVersion", file.appProperties.optString("michelsLifeVersion", "")))
        }

        val devices = listFiles(accessToken, "name contains '" + DEVICE_FILE_PREFIX + "'", 100)
        val deviceJson = JSONArray()
        for (file in devices) {
            try {
                deviceJson.put(JSONObject(downloadText(accessToken, file.id)))
            } catch (_: Exception) { }
        }

        return JSONObject()
            .put("backups", backupJson)
            .put("devices", deviceJson)
            .put("currentDeviceId", meta.deviceId)
            .put("currentDeviceName", deviceName())
    }

    fun restoreCloudBackup(accessToken: String, fileId: String, account: String, expectedGeneration: Long,
                           expectedDirtyRevision: Long): JSONObject {
        require(fileId.matches(Regex("^[A-Za-z0-9_-]{1,256}$"))) { "Invalid cloud backup identifier." }
        val meta = metaStore.beginSync(account, null, expectedGeneration, expectedDirtyRevision)
        val info = getFileById(accessToken, fileId) ?: throw IllegalArgumentException("Cloud backup not found.")
        require(info.id == fileId && info.name.startsWith(CLOUD_BACKUP_PREFIX) &&
            info.name.endsWith(".json")) { "Selected file is not a Michel's Life recovery backup." }
        val content = downloadText(accessToken, info.id)
        if (info.contentHash.isNotBlank() && !info.contentHash.equals(hashText(content), true))
            throw IOException("Cloud recovery backup failed integrity verification.")
        // Legacy Drive files may contain token/device keys; preserve mission
        // content but strip unauthorized keys before giving JSON to WebView.
        val safeContent = validateBackup(content, forUpload = false)
        val hash = hashText(content)
        metaStore.registerRestore(meta, hash, info.modifiedTime)
        return JSONObject()
            .put("backupJson", safeContent)
            .put("localHash", hash)
            .put("remoteHash", hash)
            .put("remoteModifiedAt", info.modifiedTime?.toString() ?: JSONObject.NULL)
            .put("requiresRestore", true)
            .put("conflict", false)
            .put("action", "downloaded")
    }

    private fun conflict(localHash: String, remoteHash: String, remote: CloudFileInfo, localWhen: Instant?, message: String): JSONObject {
        return JSONObject()
            .put("action", "conflict")
            .put("conflict", true)
            .put("requiresRestore", false)
            .put("localHash", localHash)
            .put("remoteHash", remoteHash)
            .put("remoteModifiedAt", remote.modifiedTime?.toString() ?: JSONObject.NULL)
            .put("localChangedAt", localWhen?.toString() ?: JSONObject.NULL)
            .put("message", message)
    }

    private fun result(action: String, hash: String, remote: CloudFileInfo, content: String?, requiresRestore: Boolean, message: String): JSONObject {
        return JSONObject()
            .put("action", action)
            .put("conflict", false)
            .put("requiresRestore", requiresRestore)
            .put("backupJson", content ?: JSONObject.NULL)
            .put("localHash", hash)
            .put("remoteHash", hash)
            .put("remoteModifiedAt", remote.modifiedTime?.toString() ?: JSONObject.NULL)
            .put("message", message)
    }

    private fun commitUploaded(meta: CloudMeta, hash: String, remote: CloudFileInfo) {
        metaStore.commitUploaded(meta, hash, remote.modifiedTime)
    }

    private fun findCloudFile(accessToken: String): CloudFileInfo? {
        val matches = listFiles(accessToken, "name='" + CLOUD_FILE_NAME + "'", 10)
        if (matches.size > 1)
            throw IOException("Multiple cloud saves found; resolve duplicates before synchronizing.")
        return matches.firstOrNull()
    }

    private fun getFileById(accessToken: String, fileId: String): CloudFileInfo? {
        val url = ("https://www.googleapis.com/drive/v3/files/" + fileId).toHttpUrl().newBuilder()
            .addQueryParameter("fields", "id,name,modifiedTime,size,md5Checksum,appProperties")
            .build()
        val req = Request.Builder().url(url).header("Authorization", "Bearer " + accessToken).get().build()
        return parseFile(JSONObject(execute(req)))
    }

    private fun listFiles(accessToken: String, query: String, pageSize: Int): List<CloudFileInfo> {
        val url = "https://www.googleapis.com/drive/v3/files".toHttpUrl().newBuilder()
            .addQueryParameter("spaces", "appDataFolder")
            .addQueryParameter("q", query + " and 'appDataFolder' in parents and trashed=false")
            .addQueryParameter("pageSize", pageSize.coerceIn(1, 1000).toString())
            .addQueryParameter("orderBy", "modifiedTime desc")
            .addQueryParameter("fields", "files(id,name,modifiedTime,size,md5Checksum,appProperties)")
            .build()
        val req = Request.Builder().url(url).header("Authorization", "Bearer " + accessToken).get().build()
        val arr = JSONObject(execute(req)).optJSONArray("files") ?: JSONArray()
        val out = ArrayList<CloudFileInfo>()
        for (i in 0 until arr.length()) parseFile(arr.optJSONObject(i))?.let(out::add)
        return out
    }

    private fun parseFile(obj: JSONObject?): CloudFileInfo? {
        if (obj == null) return null
        val id = obj.optString("id", "")
        if (id.isBlank()) return null
        val props = obj.optJSONObject("appProperties") ?: JSONObject()
        return CloudFileInfo(
            id = id,
            name = obj.optString("name", CLOUD_FILE_NAME),
            modifiedTime = parseInstant(obj.optString("modifiedTime", "")),
            contentHash = props.optString("michelsLifeHash", ""),
            sourceDeviceId = props.optString("michelsLifeDevice", ""),
            sourceUpdatedAt = parseInstant(props.optString("michelsLifeUpdatedAt", "")),
            size = obj.optLong("size", 0L),
            appProperties = props
        )
    }

    private fun downloadCloudFile(accessToken: String, remote: CloudFileInfo): Pair<String, String> {
        val content = downloadText(accessToken, remote.id)
        val safeContent = validateBackup(content, forUpload = false)
        // Verify the raw remote bytes before exposing a restore candidate.
        // Legacy metadata may omit the hash; modern mismatches are errors.
        if (remote.contentHash.isNotBlank() && !remote.contentHash.equals(hashText(content), true))
            throw IOException("Cloud contents changed or failed integrity verification; refresh before restoring.")
        // Identity is the raw remote object. Restorable JSON is always sanitized.
        return safeContent to hashText(content)
    }

    private fun downloadText(accessToken: String, fileId: String): String {
        val url = ("https://www.googleapis.com/drive/v3/files/" + fileId).toHttpUrl().newBuilder()
            .addQueryParameter("alt", "media")
            .build()
        val req = Request.Builder().url(url).header("Authorization", "Bearer " + accessToken).get().build()
        return execute(req)
    }

    private fun uploadCloudFile(
        accessToken: String,
        fileId: String?,
        backupJson: String,
        contentHash: String,
        deviceId: String,
        sourceUpdatedAt: Instant
    ): CloudFileInfo {
        val props = JSONObject()
            .put("michelsLifeHash", contentHash)
            .put("michelsLifeDevice", deviceId)
            .put("michelsLifeUpdatedAt", sourceUpdatedAt.toString())
            .put("michelsLifeVersion", "android-" + ANDROID_VERSION)
        val uploaded = uploadJson(accessToken, fileId, CLOUD_FILE_NAME, backupJson, props)
        require(uploaded.contentHash.equals(contentHash, true) &&
            (fileId == null || uploaded.id == fileId)) {
            "Google Drive did not confirm the expected cloud save."
        }
        return uploaded
    }

    private fun uploadJson(accessToken: String, fileId: String?, fileName: String, json: String, props: JSONObject): CloudFileInfo {
        val metadata = JSONObject()
            .put("name", fileName)
            .put("mimeType", "application/json")
            .put("appProperties", props)
        if (fileId.isNullOrBlank()) metadata.put("parents", JSONArray().put("appDataFolder"))

        val boundary = "mlv_android_" + UUID.randomUUID().toString().replace("-", "")
        val bodyText = "--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
            metadata.toString() +
            "\r\n--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
            json +
            "\r\n--" + boundary + "--\r\n"

        val base = if (fileId.isNullOrBlank())
            "https://www.googleapis.com/upload/drive/v3/files"
        else
            "https://www.googleapis.com/upload/drive/v3/files/" + fileId
        val url = base.toHttpUrl().newBuilder()
            .addQueryParameter("uploadType", "multipart")
            .addQueryParameter("fields", "id,name,modifiedTime,size,md5Checksum,appProperties")
            .build()
        val media = ("multipart/related; boundary=" + boundary).toMediaType()
        val requestBody = bodyText.toRequestBody(media)
        val builder = Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + accessToken)
        val req = if (fileId.isNullOrBlank()) builder.post(requestBody).build() else builder.patch(requestBody).build()
        return parseFile(JSONObject(execute(req))) ?: throw IOException("Google Drive did not return uploaded file metadata.")
    }

    private fun createHistoryBackup(accessToken: String, remote: CloudFileInfo, reason: String) {
        // Before overwriting remote state, a recoverable copy is mandatory.
        // A failed history read/upload must STOP the destructive overwrite,
        // never be silently swallowed and then report "Uploaded" as success.
            val now = Instant.now()
            // A recent backup is not proof it contains this exact revision.
            val current = downloadCloudFile(accessToken, remote)
            if (remote.contentHash.isNotBlank() && !remote.contentHash.equals(current.second, true))
                throw IOException("Cloud contents changed or failed integrity verification; refresh before uploading.")
            val name = CLOUD_BACKUP_PREFIX + now.toString().replace(":", "").replace("-", "").replace(".", "_") + ".json"
            val props = JSONObject()
                .put("michelsLifeType", "history")
                // History contents are sanitized; hash their actual bytes.
                .put("michelsLifeHash", hashText(current.first))
                .put("michelsLifeCreatedAt", now.toString())
                .put("michelsLifeReason", reason)
                .put("michelsLifeSourceDevice", remote.sourceDeviceId)
                .put("michelsLifeVersion", "android-" + ANDROID_VERSION)
            val saved = uploadJson(accessToken, null, name, current.first, props)
            require(saved.contentHash.equals(hashText(current.first), true)) {
                "Google Drive did not confirm the recovery backup hash."
            }
            pruneBackups(accessToken)
            // Recheck after the backup network calls. This detects many races,
            // but is not a provider-side atomic compare-and-swap.
            val latest = findCloudFile(accessToken)
            if (latest == null || latest.id != remote.id ||
                latest.modifiedTime != remote.modifiedTime || latest.contentHash != remote.contentHash)
                throw IOException("Cloud save changed during backup; refresh before uploading.")
    }

    private fun pruneBackups(accessToken: String) {
        val files = listFiles(accessToken, "name contains '" + CLOUD_BACKUP_PREFIX + "'", 100)
            .sortedByDescending { it.modifiedTime ?: Instant.EPOCH }
        for (old in files.drop(CLOUD_BACKUP_LIMIT)) {
            try {
                val req = Request.Builder()
                    .url("https://www.googleapis.com/drive/v3/files/" + old.id)
                    .header("Authorization", "Bearer " + accessToken)
                    .delete()
                    .build()
                execute(req, allowEmpty = true)
            } catch (_: Exception) { }
        }
    }

    private fun touchDevice(accessToken: String, meta: CloudMeta, action: String) {
        try {
            val current = metaStore.snapshotIfCurrent(meta)
            val fileName = DEVICE_FILE_PREFIX + current.deviceId + ".json"
            val existing = listFiles(accessToken, "name='" + fileName + "'", 10).firstOrNull()
            val now = Instant.now()
            val json = JSONObject()
                .put("DeviceId", meta.deviceId)
                .put("DeviceName", deviceName())
                .put("LastSeenAt", now.toString())
                .put("LastSyncAt", current.lastSyncedAt?.toString() ?: "")
                .put("LastAction", action)
                .put("AppVersion", "android-" + ANDROID_VERSION)
            val props = JSONObject()
                .put("michelsLifeType", "device")
                .put("michelsLifeDeviceId", meta.deviceId)
                .put("michelsLifeDeviceName", deviceName())
                .put("michelsLifeLastSeen", now.toString())
                .put("michelsLifeVersion", "android-" + ANDROID_VERSION)
            metaStore.requireCurrent(meta)
            uploadJson(accessToken, existing?.id, fileName, json.toString(), props)
        } catch (_: Exception) { }
    }

    // Match the shared frontend's explicit MLV_SHARED_STORAGE_KEYS policy.
    // Unknown future keys are PRIVATE by default. The native Google Drive
    // bridge must never trust arbitrary JSON even when called outside Settings.
    private val sharedStorageKeys = setOf(
        "vida_rpg_personal_progress_v2",
        "michelsLife.backgroundSet.v3049",
        "michelsLifeTheme.v3000", "michelsLifeTheme.v341",
        "michelsLife.theme.v342", "michelsLife.theme.v343",
        "michelsLifeThemePreset.v341",
        "michelsLife.themePreset.v342", "michelsLife.themePreset.v343",
        "michelsLife.colorTheme.v30184",
        "michelsLife.typography.v303", "michelsLife.glassAtmosphere.v3042",
        "michelsLife.panelTransparency.v3060", "michelsLife.premiumColor.v3044",
        "michelsLife.textColor.v3042", "michelsLife.mutedTextColor.v3042",
        "michelsLife.dayText.v3072", "michelsLife.dayText.v3073",
        "michelsLife.dayChipText.v3062", "michelsLife.dayChipText.v3064",
        "michelsLifePalette.v264", "michelsLife.journal.v30184",
        "michelsLifeBackgroundSetsV3088", "michelsLife.language.v1"
    )
    private val sharedRootKeys = setOf(
        "app", "type", "cloudPayloadVersion", "version", "state", "localStorage"
    )

    private fun validateBackup(raw: String, forUpload: Boolean): String {
        val byteSize = raw.toByteArray(Charsets.UTF_8).size
        if (byteSize == 0 || byteSize > 10 * 1024 * 1024) {
            throw IllegalArgumentException("Cloud payload is empty or exceeds the safe size limit.")
        }
        val root = JSONObject(raw)
        val board = root.optJSONObject("state")
        val storage = root.optJSONObject("localStorage")
        if ((root.has("state") && board == null) ||
            (root.has("localStorage") && storage == null) ||
            (board == null && storage?.optString("vida_rpg_personal_progress_v2", "")?.isNotBlank() != true)) {
            throw IllegalArgumentException("Cloud payload does not contain valid Michel's Life state.")
        }

        // Keep source user state intact, but never transmit or replay untrusted
        // provider/device fields from the LOCAL STORAGE envelope.
        val filtered = JSONObject()
        for (key in root.keys()) {
            if (key !in sharedRootKeys) {
                if (forUpload) throw IllegalArgumentException("Cloud payload contains private or unsupported metadata.")
                continue
            }
            if (key == "localStorage") {
                val cleanStorage = JSONObject()
                if (storage != null) for (storedKey in storage.keys()) {
                    if (storedKey !in sharedStorageKeys || storage.opt(storedKey) !is String) {
                        if (forUpload) throw IllegalArgumentException("Cloud payload contains unsafe device-local storage.")
                        continue
                    }
                    cleanStorage.put(storedKey, storage.getString(storedKey))
                }
                filtered.put(key, cleanStorage)
            } else {
                filtered.put(key, root.get(key))
            }
        }
        // A fresh, modern upload must use the explicit app-scoped envelope.
        if (forUpload && root.optString("app", "") != "Michel's Life") {
            throw IllegalArgumentException("Cloud payload does not identify Michel's Life.")
        }
        // Preserve modern upload serialization byte-for-byte for stable hashes.
        // Legacy restore is always canonicalized to the sanitized envelope.
        return if (forUpload) raw else filtered.toString()
    }

    private fun execute(request: Request, allowEmpty: Boolean = false): String {
        http.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Google API HTTP " + response.code)
            val source = response.body?.source()
            if (source?.request(10L * 1024 * 1024 + 1L) == true)
                throw IOException("Google API response exceeds the safe size limit.")
            val text = source?.readUtf8().orEmpty()
            if (!allowEmpty && text.isBlank()) throw IOException("Google API returned an empty response.")
            return text
        }
    }

    private fun hashText(text: String): String {
        return MessageDigest.getInstance("SHA-256")
            .digest(text.toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }
    }

    private fun parseInstant(raw: String?): Instant? = try {
        if (raw.isNullOrBlank()) null else Instant.parse(raw)
    } catch (_: Exception) { null }

    private fun deviceName(): String {
        val maker = Build.MANUFACTURER.orEmpty().trim()
        val model = Build.MODEL.orEmpty().trim()
        return (maker + " " + model).trim().ifBlank { "Android" }
    }
}
