package com.michelslab.michelslife

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import okhttp3.Call
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/**
 * Android Direct, user-consented staging and OS installer handoff.
 *
 * No silent install, no WebView-supplied APK URLs, no app-data deletion, no
 * background update polling. Every APK must pass the metadata verifier,
 * streamed SHA-256, PackageManager archive identity AND permanent signer pin
 * before an OS installer intent can be constructed.
 */
internal object VerifiedDirectApk {
    private const val PENDING_APK = "verified-direct.apk"
    private const val MARKER = "verified-direct.json"
    private const val MAX_APK_BYTES = 188_743_680L
    private const val MIN_APK_BYTES = 1_048_576L
    // Prevent concurrent Downloads or cache deletion while a hash is being staged.
    private val staging = AtomicBoolean(false)
    private val cancelRequested = AtomicBoolean(false)
    // Holds only this staging operation's currently active HTTP call.
    // Cancel never needs to wait for socket readTimeout or the download executor.
    private val activeCall = AtomicReference<Call?>(null)
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .followRedirects(false)
        .build()
    private val allowedHosts = setOf("github.com", "release-assets.githubusercontent.com",
        "objects.githubusercontent.com")

    private fun folder(activity: Activity): File =
        File(activity.cacheDir, "verified-direct-updates").also {
            if (!it.isDirectory && !it.mkdirs()) throw IllegalStateException("Update cache unavailable.")
        }

    private fun hex(bytes: ByteArray): String =
        bytes.joinToString("") { "%02x".format(it.toInt() and 255) }

    private fun digestOf(file: File): String {
        val sha = MessageDigest.getInstance("SHA-256")
        file.inputStream().buffered().use { stream ->
            val buffer = ByteArray(65536)
            while (true) {
                val n = stream.read(buffer)
                if (n < 0) break
                sha.update(buffer, 0, n)
            }
        }
        return hex(sha.digest())
    }

    @Suppress("DEPRECATION")
    private fun archiveVerified(activity: Activity, apk: File,
            expectedVersion: String, expectedCode: Long): Boolean {
        if (!apk.isFile || apk.length() !in MIN_APK_BYTES..MAX_APK_BYTES) return false
        val manager = activity.packageManager
        val info = if (Build.VERSION.SDK_INT >= 33)
            manager.getPackageArchiveInfo(apk.absolutePath,
                PackageManager.PackageInfoFlags.of(PackageManager.GET_SIGNING_CERTIFICATES.toLong()))
        else manager.getPackageArchiveInfo(apk.absolutePath,
            PackageManager.GET_SIGNING_CERTIFICATES)
        if (info == null || info.packageName != activity.packageName ||
            info.versionName != expectedVersion) return false
        val code = if (Build.VERSION.SDK_INT >= 28) info.longVersionCode
            else info.versionCode.toLong()
        if (code != expectedCode) return false
        val signatures = if (Build.VERSION.SDK_INT >= 28)
            info.signingInfo?.apkContentsSigners
        else manager.getPackageArchiveInfo(apk.absolutePath,
            PackageManager.GET_SIGNATURES)?.signatures
        if (signatures?.size != 1) return false
        val signer = hex(MessageDigest.getInstance("SHA-256")
            .digest(signatures[0].toByteArray()))
        return DirectUpdatePolicy.DIRECT_SIGNER_SHA256 == signer
    }

    private fun downloadVerified(url: String, destination: File,
            expectedBytes: Long, expectedSha: String,
            onProgress: (Long, Long) -> Unit) {
        if (expectedBytes !in MIN_APK_BYTES..MAX_APK_BYTES ||
            !expectedSha.matches(Regex("[0-9a-f]{64}")))
            throw IllegalStateException("Official APK size or digest was invalid.")
        var current = url
        for (hop in 0..4) {
            val uri = Uri.parse(current)
            if (uri.scheme != "https" || uri.host !in allowedHosts)
                throw IllegalStateException("Untrusted APK download host.")
            val request = Request.Builder().url(current)
                .header("User-Agent", "MichelsLife-Android-Direct-Update")
                .get().build()
            val call = client.newCall(request)
            activeCall.set(call)
            // Handles Cancel pressed between redirects or before execute().
            if (cancelRequested.get()) call.cancel()
            try {
                call.execute().use { response ->
                if (response.code in setOf(301, 302, 303, 307, 308)) {
                    val location = response.header("Location")
                        ?: throw IllegalStateException("Invalid APK redirect.")
                    val resolved = response.request.url.resolve(location)
                        ?: throw IllegalStateException("APK redirect target was invalid.")
                    if (resolved.scheme != "https" || resolved.host !in allowedHosts)
                        throw IllegalStateException("APK redirected to an untrusted server.")
                    current = resolved.toString()
                } else {
                    if (!response.isSuccessful)
                        throw IllegalStateException("Official APK download was unavailable.")
                    val body = response.body
                        ?: throw IllegalStateException("Official APK response was empty.")
                    if (body.contentLength() > expectedBytes)
                        throw IllegalStateException("Official APK response size changed.")
                    val sha = MessageDigest.getInstance("SHA-256")
                    var copied = 0L
                    var nextProgress = 0L
                    destination.outputStream().buffered().use { output ->
                        body.byteStream().use { input ->
                            val buffer = ByteArray(65536)
                            while (true) {
                                val n = input.read(buffer)
                                if (n < 0) break
                                if (cancelRequested.get())
                                    throw java.util.concurrent.CancellationException("APK download cancelled.")
                                copied += n.toLong()
                                if (copied > expectedBytes || copied > MAX_APK_BYTES)
                                    throw IllegalStateException("Downloaded APK exceeded declared size.")
                                output.write(buffer, 0, n)
                                sha.update(buffer, 0, n)
                                // Throttle WebView events to 512 KiB. The
                                // progress callback never receives APK data.
                                if (copied >= nextProgress) {
                                    onProgress(copied, expectedBytes)
                                    nextProgress = copied + 524_288L
                                }
                            }
                        }
                    }
                    if (cancelRequested.get())
                        throw java.util.concurrent.CancellationException("APK download cancelled.")
                    if (copied != expectedBytes || hex(sha.digest()) != expectedSha)
                        throw IllegalStateException("APK download integrity verification failed.")
                    return
                }
                }
            } finally {
                activeCall.compareAndSet(call, null)
            }
        }
        throw IllegalStateException("Too many APK CDN redirects.")
    }

    /** User explicitly taps Download: always re-query trustworthy metadata. */
    fun stage(activity: Activity,
            onProgress: (Long, Long) -> Unit = { _, _ -> }): JSONObject {
        if (!staging.compareAndSet(false, true))
            return JSONObject().put("staged", false)
                .put("busy", true)
                .put("status", "A verified APK download is already in progress.")
        cancelRequested.set(false)
        return try { stageInternal(activity, onProgress) }
            finally {
                activeCall.getAndSet(null)?.cancel()
                staging.set(false)
                cancelRequested.set(false)
            }
    }

    private fun stageInternal(activity: Activity,
        onProgress: (Long, Long) -> Unit): JSONObject {
        if (AndroidDirectUpdateChecker.channel(activity) != "android-direct")
            return JSONObject().put("staged", false)
                .put("status", "Only a permanently signed Android Direct installation can download this update.")
        val dir = folder(activity)
        val candidate = File(dir, "download.part")
        val ready = File(dir, PENDING_APK)
        val marker = File(dir, MARKER)
        // An old candidate must never look ready after network interruption.
        marker.delete()
        ready.delete()
        candidate.delete()
        try {
            val metadata = AndroidDirectUpdateChecker.check(activity)
            if (!metadata.optBoolean("checked") || !metadata.optBoolean("updateAvailable"))
                throw IllegalStateException("No verified newer Direct release available.")
            val version = metadata.optString("latestAndroidVersion")
            val code = metadata.optLong("latestAndroidVersionCode", 0L)
            val filename = metadata.optString("verifiedApkFilename")
            val url = metadata.optString("verifiedApkUrl")
            val digest = metadata.optString("verifiedApkSha256")
            val bytes = metadata.optLong("verifiedApkSize", 0L)
            val tag = metadata.optString("releaseUrl").substringAfterLast('/')
            if (!DirectUpdatePolicy.validVersion(version) ||
                !DirectUpdatePolicy.officialAssetUrl(url, tag, filename) ||
                !filename.equals("MichelsLife-Android-Direct-v" + version + ".apk") ||
                code <= 0 || bytes !in MIN_APK_BYTES..MAX_APK_BYTES)
                throw IllegalStateException("Official APK identity did not match the release.")
            if (cancelRequested.get())
                throw java.util.concurrent.CancellationException("APK download cancelled.")
            downloadVerified(url, candidate, bytes, digest, onProgress)
            if (cancelRequested.get())
                throw java.util.concurrent.CancellationException("APK download cancelled.")
            if (!archiveVerified(activity, candidate, version, code))
                throw IllegalStateException("APK signature or package identity failed verification.")
            if (cancelRequested.get())
                throw java.util.concurrent.CancellationException("APK download cancelled.")
            if (!candidate.renameTo(ready))
                throw IllegalStateException("Could not safely stage the verified APK.")
            if (cancelRequested.get())
                throw java.util.concurrent.CancellationException("APK download cancelled.")
            val receipt = JSONObject().put("version", version).put("versionCode", code)
                .put("sha256", digest).put("bytes", bytes)
                .put("filename", filename).put("source", metadata.optString("releaseUrl"))
            marker.writeText(receipt.toString(), Charsets.UTF_8)
            return JSONObject().put("staged", true).put("version", version)
                .put("bytes", bytes)
                .put("status", "APK downloaded, SHA-256 and permanent signing certificate verified. Tap Install to open the Android installer.")
        } catch (error: Exception) {
            // Never leave behind an unverified APK or a false-ready receipt.
            marker.delete()
            ready.delete()
            // OkHttp Call.cancel() interrupts execute/read with IOException,
            // not CancellationException. Treat an explicit user-requested
            // cancellation as cancelled even when it interrupts the socket.
            val cancelled = cancelRequested.get() ||
                error is java.util.concurrent.CancellationException
            return JSONObject().put("staged", false).put("cancelled", cancelled)
                .put("status", if (cancelled)
                    "APK download cancelled. Partial files removed; your data is unchanged."
                    else "Could not verify a signed APK. Nothing was installed; your app data is unchanged.")
        } finally {
            candidate.delete()
        }
    }

    /** Re-verify from on-disk bytes on EVERY installation attempt. */
    private fun validatedCandidate(activity: Activity): Pair<File, JSONObject>? {
        if (AndroidDirectUpdateChecker.channel(activity) != "android-direct") return null
        val dir = folder(activity)
        val ready = File(dir, PENDING_APK)
        val receiptFile = File(dir, MARKER)
        if (!ready.isFile || !receiptFile.isFile) return null
        return try {
            val receipt = JSONObject(receiptFile.readText(Charsets.UTF_8))
            val version = receipt.optString("version")
            val code = receipt.optLong("versionCode")
            val expectedBytes = receipt.optLong("bytes")
            val expectedHash = receipt.optString("sha256")
            val filename = receipt.optString("filename")
            val tag = receipt.optString("source").substringAfterLast('/')
            val url = "https://github.com/michels-lab/michel-s-life-releases/releases/download/" +
                tag + "/" + filename
            val installedCode = if (Build.VERSION.SDK_INT >= 33)
                activity.packageManager.getPackageInfo(activity.packageName,
                    PackageManager.PackageInfoFlags.of(0L)).longVersionCode
            else {
                @Suppress("DEPRECATION")
                val info = activity.packageManager.getPackageInfo(activity.packageName, 0)
                if (Build.VERSION.SDK_INT >= 28) info.longVersionCode else info.versionCode.toLong()
            }
            if (!DirectUpdatePolicy.validVersion(version) ||
                !DirectUpdatePolicy.officialReleaseUrl(receipt.optString("source"), tag) ||
                !DirectUpdatePolicy.officialAssetUrl(url, tag, filename) ||
                filename != "MichelsLife-Android-Direct-v" + version + ".apk" ||
                code <= installedCode || expectedBytes !in MIN_APK_BYTES..MAX_APK_BYTES ||
                ready.length() != expectedBytes || !expectedHash.matches(Regex("[0-9a-f]{64}")) ||
                digestOf(ready) != expectedHash || !archiveVerified(activity, ready, version, code))
                null else Pair(ready, receipt)
        } catch (_: Exception) { null }
    }

    /**
     * An explicit Cancel tap only sets a flag. The download worker owns and
     * removes its partial file; no other caller deletes it underneath a write.
     * This action is safe to run immediately, not on the busy executor.
     */
    fun cancel(activity: Activity): JSONObject {
        if (AndroidDirectUpdateChecker.channel(activity) != "android-direct")
            return JSONObject().put("requested", false)
                .put("status", "Only Android Direct downloads can be cancelled.")
        if (!staging.get())
            return JSONObject().put("requested", false)
                .put("status", "No APK download is running.")
        cancelRequested.set(true)
        // Abort a blocked DNS/connect/read immediately, instead of waiting
        // up to OkHttp's read timeout. The worker still cleans partial files.
        activeCall.get()?.cancel()
        return JSONObject().put("requested", true)
            .put("status", "Cancellation requested; partial APK will be deleted.")
    }

    /**
     * Local-only resume check, safe to use after Activity recreation or a
     * WebView renderer refresh. No network, no installer and no state writes.
     * The marker is untrusted and the actual on-disk bytes are rehashed.
     */
    fun readiness(activity: Activity): JSONObject {
        if (staging.get())
            return JSONObject().put("ready", false).put("busy", true)
                .put("status", "APK verification is still running.")
        val candidate = validatedCandidate(activity)
        if (candidate == null) {
            val dir = folder(activity)
            val cached = File(dir, PENDING_APK).exists() ||
                File(dir, MARKER).exists() || File(dir, "download.part").exists()
            return JSONObject().put("ready", false)
                .put("hasCached", cached)
                .put("status", if (cached)
                    "A previous APK is incomplete, outdated or unverified. Remove it and download again."
                    else "No verified APK ready to install.")
        }
        return JSONObject().put("ready", true).put("hasCached", true)
            .put("version", candidate.second.optString("version"))
            .put("needsPermission", !activity.packageManager.canRequestPackageInstalls())
            .put("status", if (activity.packageManager.canRequestPackageInstalls())
                "Previously downloaded APK reverified. Tap Install to open Android's confirmation screen."
                else "Previously downloaded APK reverified. Android install permission may be required.")
    }

    /**
     * Only an explicit user tap may discard the private updater cache.
     * Never touch account data, external storage or a running download.
     */
    fun discard(activity: Activity): JSONObject {
        if (AndroidDirectUpdateChecker.channel(activity) != "android-direct")
            return JSONObject().put("discarded", false)
                .put("status", "No Android Direct update cache is available.")
        // Acquire the SAME atomic gate as stage(): a racing download must
        // never restore a cache file while the user is discarding it.
        if (!staging.compareAndSet(false, true))
            return JSONObject().put("discarded", false).put("busy", true)
                .put("status", "Wait until the APK download finishes before removing it.")
        return try { discardInternal(activity) } finally { staging.set(false) }
    }

    private fun discardInternal(activity: Activity): JSONObject {
        val dir = folder(activity)
        val targets = listOf(File(dir, MARKER), File(dir, PENDING_APK),
            File(dir, "download.part"))
        // Delete receipt first so no half-deleted file can ever be offered.
        for (file in targets) {
            if (file.exists() && !file.delete())
                return JSONObject().put("discarded", false)
                    .put("status", "Could not remove the staged APK completely.")
        }
        return JSONObject().put("discarded", true)
            .put("status", "Downloaded update removed. Your missions and account data are unchanged.")
    }

    /**
     * A signed file can become stale if its release is withdrawn. The cached
     * receipt is not authority for a future install: require current official
     * release metadata to agree with the already-rehashed on-disk APK.
     */
    private fun matchesCurrentOfficialRelease(activity: Activity, receipt: JSONObject): Boolean {
        val latest = AndroidDirectUpdateChecker.check(activity)
        return latest.optBoolean("checked") &&
            latest.optBoolean("updateAvailable") &&
            latest.optString("verifiedApkFilename") == receipt.optString("filename") &&
            latest.optString("verifiedApkSha256") == receipt.optString("sha256") &&
            latest.optLong("verifiedApkSize") == receipt.optLong("bytes") &&
            latest.optLong("latestAndroidVersionCode") == receipt.optLong("versionCode") &&
            latest.optString("latestAndroidVersion") == receipt.optString("version") &&
            latest.optString("releaseUrl") == receipt.optString("source")
    }

    /** Explicit second user tap only, always subject to Android OS confirmation. */
    fun requestInstaller(activity: Activity, onResult: (JSONObject) -> Unit) {
        if (staging.get()) {
            onResult(JSONObject().put("opened", false).put("busy", true)
                .put("status", "Download verification is still running."))
            return
        }
        val candidate = validatedCandidate(activity)
        if (candidate == null) {
            onResult(JSONObject().put("opened", false)
                .put("status", "No verified signed APK is ready; download it again."))
            return
        }
        if (!matchesCurrentOfficialRelease(activity, candidate.second)) {
            onResult(JSONObject().put("opened", false).put("stale", true)
                .put("status", "This staged APK is no longer the latest verified official release. Check updates and download again."))
            return
        }
        if (!activity.packageManager.canRequestPackageInstalls()) {
            onResult(JSONObject().put("opened", false).put("needsPermission", true)
                .put("status", "Allow installations from Michel's Life in Android Settings, then tap Install again."))
            return
        }
        activity.runOnUiThread {
            try {
                val uri = FileProvider.getUriForFile(activity,
                    activity.packageName + ".verifiedupdates", candidate.first)
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "application/vnd.android.package-archive")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                activity.startActivity(intent)
                // OS confirmation is NOT evidence an update was installed.
                onResult(JSONObject().put("opened", true)
                    .put("status", "Android's installer was opened; confirm or cancel there."))
            } catch (_: Exception) {
                onResult(JSONObject().put("opened", false)
                    .put("status", "Android could not open the package installer."))
            }
        }
    }

    /** Separate explicit tap. Permission settings never trigger an install. */
    fun openPermissionSettings(activity: Activity, onResult: (JSONObject) -> Unit) {
        if (validatedCandidate(activity) == null) {
            onResult(JSONObject().put("opened", false).put("status", "No verified APK is staged."))
            return
        }
        activity.runOnUiThread {
            try {
                val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + activity.packageName))
                activity.startActivity(intent)
                onResult(JSONObject().put("opened", true)
                    .put("status", "Android settings opened. Permission remains your choice."))
            } catch (_: Exception) {
                onResult(JSONObject().put("opened", false)
                    .put("status", "Could not open Android installation-permission settings."))
            }
        }
    }
}
