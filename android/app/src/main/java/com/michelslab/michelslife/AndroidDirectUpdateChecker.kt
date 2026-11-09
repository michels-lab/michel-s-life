package com.michelslab.michelslife

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/** Read-only official Android Direct update discovery. It never installs APKs
 * or modifies application, user, notification or cloud data. */
internal object AndroidDirectUpdateChecker {
    private const val RELEASES_API =
        "https://api.github.com/repos/michels-lab/michel-s-life-releases/releases/latest"
    private const val MAX_RESPONSE_BYTES = 256 * 1024
    private val client = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .followRedirects(false).build()
    private val apkPattern = Regex("""^MichelsLife-Android-Direct-v([0-9]+\.[0-9]+\.[0-9]+)\.apk$""")

    @Suppress("DEPRECATION")
    fun channel(context: Context): String {
        val pm = context.packageManager
        val installer = try {
            if (Build.VERSION.SDK_INT >= 30)
                pm.getInstallSourceInfo(context.packageName).installingPackageName
            else pm.getInstallerPackageName(context.packageName)
        } catch (_: Exception) { null }
        val debuggable =
            (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
        val signer = try {
            val info = if (Build.VERSION.SDK_INT >= 33)
                pm.getPackageInfo(context.packageName,
                    PackageManager.PackageInfoFlags.of(PackageManager.GET_SIGNING_CERTIFICATES.toLong()))
            else pm.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES)
            val certificates = if (Build.VERSION.SDK_INT >= 28) {
                val signing = info.signingInfo ?: return "test"
                if (signing.hasMultipleSigners()) signing.apkContentsSigners
                else signing.signingCertificateHistory
            } else {
                pm.getPackageInfo(context.packageName, PackageManager.GET_SIGNATURES).signatures
            }
            if (certificates == null || certificates.size != 1) null
            else MessageDigest.getInstance("SHA-256").digest(certificates[0].toByteArray())
                .joinToString("") { "%02x".format(it.toInt() and 255) }
        } catch (_: Exception) { null }
        return DirectUpdatePolicy.channel(installer, debuggable, signer)
    }

    @Suppress("DEPRECATION")
    private fun installedCode(context: Context): Long {
        val info = if (Build.VERSION.SDK_INT >= 33)
            context.packageManager.getPackageInfo(context.packageName,
                PackageManager.PackageInfoFlags.of(0L))
        else context.packageManager.getPackageInfo(context.packageName, 0)
        return if (Build.VERSION.SDK_INT >= 28) info.longVersionCode
        else info.versionCode.toLong()
    }

    /** Call only from executor, never from Android's UI thread. */
    fun check(context: Context): JSONObject {
        val result = JSONObject()
            .put("channel", "android-direct")
            .put("version", DriveCloudEngine.ANDROID_VERSION)
            .put("managedExternally", false)
            .put("updateAvailable", false)
            .put("checked", false)
            .put("installAutomatically", false)
        try {
            if (channel(context) != "android-direct")
                return result.put("status", "Installed signing channel changed. No Direct update was offered.")
            val request = Request.Builder().url(RELEASES_API)
                .header("Accept", "application/vnd.github+json")
                .header("User-Agent", "MichelsLife-Android-Direct-UpdateCheck")
                .get().build()
            val release = client.newCall(request).execute().use { response ->
                if (!response.isSuccessful)
                    throw IllegalStateException("Official release lookup unavailable.")
                val body = response.body ?: throw IllegalStateException("Empty official metadata.")
                val bytes = ByteArrayOutputStream()
                body.byteStream().use { stream ->
                    val buffer = ByteArray(8192)
                    while (true) {
                        val n = stream.read(buffer)
                        if (n < 0) break
                        if (bytes.size() + n > MAX_RESPONSE_BYTES)
                            throw IllegalStateException("Release response exceeds safety limit.")
                        bytes.write(buffer, 0, n)
                    }
                }
                JSONObject(bytes.toString(Charsets.UTF_8.name()))
            }
            val tag = release.optString("tag_name")
            val page = release.optString("html_url")
            val official = DirectUpdatePolicy.officialReleaseUrl(page, tag)
            val stable = !release.optBoolean("draft", true) &&
                !release.optBoolean("prerelease", true) &&
                release.optString("published_at").isNotBlank()
            val assets = release.optJSONArray("assets")
                ?: throw IllegalStateException("Official release has no assets.")
            val names = mutableSetOf<String>()
            var version = ""
            var apkFile = ""
            var validApk = false
            var apkCount = 0
            for (index in 0 until assets.length()) {
                val asset = assets.optJSONObject(index) ?: continue
                val name = asset.optString("name")
                if (!DirectUpdatePolicy.officialAssetUrl(
                        asset.optString("browser_download_url"), tag, name))
                    throw IllegalStateException("Release contains an untrusted asset link.")
                names.add(name)
                val match = apkPattern.matchEntire(name)
                if (match != null) {
                    apkCount++
                    apkFile = name
                    version = match.groupValues[1]
                    validApk = asset.optLong("size") > 0L
                }
            }
            if (apkCount != 1)
                throw IllegalStateException("Official Direct APK is missing or ambiguous.")
            val complete = validApk &&
                names.contains(apkFile + ".sha256") &&
                names.contains("android-v" + version + "-manifest.json")
            val codePattern = Regex(
                "Android Direct\\s+" + Regex.escape(version) + "\\s*\\(versionCode\\s+([0-9]{1,6})\\)",
                RegexOption.IGNORE_CASE)
            val remoteCode = codePattern.find(release.optString("body"))
                ?.groupValues?.get(1)?.toLongOrNull() ?: 0L
            val decision = DirectUpdatePolicy.compare(
                DriveCloudEngine.ANDROID_VERSION, installedCode(context),
                version, remoteCode, stable, complete, official)
            if (decision == DirectUpdatePolicy.Status.UNVERIFIED)
                return result.put("status",
                    "Official Android update metadata is incomplete or inconsistent; no APK was offered.")
            return result
                .put("checked", true)
                .put("updateAvailable", decision == DirectUpdatePolicy.Status.NEWER)
                .put("latestAndroidVersion", version)
                .put("latestAndroidVersionCode", remoteCode)
                .put("releaseUrl", page)
                .put("status", if (decision == DirectUpdatePolicy.Status.NEWER)
                    "An official Android Direct update is listed. Review the release before downloading. Installation is never automatic."
                    else "This Android Direct version is up to date.")
                .put("integrityNote",
                    "Discovery only. Verify downloaded APK signature, manifest and SHA-256 before installation.")
        } catch (_: Exception) {
            return result.put("status",
                "Could not verify the official Android Direct release. Try again when online.")
        }
    }
}
