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

    /**
     * Follow only GitHub's HTTPS asset CDN redirects. A GitHub Release can
     * legitimately redirect to release-assets.githubusercontent.com, but
     * an unknown host never receives the request. Limit every body by bytes.
     */
    private fun readOfficialAsset(url: String, maxBytes: Int): String {
        var current = url
        val allowedHosts = setOf("github.com", "release-assets.githubusercontent.com",
            "objects.githubusercontent.com")
        for (hop in 0..3) {
            val request = Request.Builder().url(current)
                .header("User-Agent", "MichelsLife-Android-Direct-UpdateCheck")
                .get().build()
            client.newCall(request).execute().use { response ->
                if (response.code in setOf(301, 302, 303, 307, 308)) {
                    val location = response.header("Location")
                        ?: throw IllegalStateException("GitHub asset redirect missing.")
                    val resolved = response.request.url.resolve(location)
                        ?: throw IllegalStateException("GitHub asset redirect invalid.")
                    if (resolved.scheme != "https" || resolved.host !in allowedHosts)
                        throw IllegalStateException("GitHub asset redirected outside trusted HTTPS.")
                    current = resolved.toString()
                } else {
                    if (!response.isSuccessful)
                        throw IllegalStateException("Official asset unavailable.")
                    val body = response.body
                        ?: throw IllegalStateException("Official asset has no body.")
                    if (body.contentLength() > maxBytes)
                        throw IllegalStateException("Official asset exceeded size limit.")
                    val bytes = ByteArrayOutputStream()
                    body.byteStream().use { stream ->
                        val chunk = ByteArray(4096)
                        while (true) {
                            val n = stream.read(chunk)
                            if (n < 0) break
                            if (bytes.size() + n > maxBytes)
                                throw IllegalStateException("Official asset exceeded size limit.")
                            bytes.write(chunk, 0, n)
                        }
                    }
                    return bytes.toString(Charsets.UTF_8.name())
                }
            }
        }
        throw IllegalStateException("GitHub asset redirect limit exceeded.")
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
                if (!names.add(name))
                    throw IllegalStateException("Duplicate official release asset name.")
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
            val manifestName = "android-v" + version + "-manifest.json"
            val sidecarName = apkFile + ".sha256"
            val complete = validApk && names.contains(sidecarName) &&
                names.contains(manifestName)
            if (!stable || !official || !complete)
                throw IllegalStateException("Stable official release assets are incomplete.")

            val assetPrefix = "https://github.com/michels-lab/michel-s-life-releases/releases/download/" +
                tag + "/"
            // Actual bytes and fields, NOT merely the names of matching files.
            val manifest = JSONObject(readOfficialAsset(assetPrefix + manifestName, 16 * 1024))
            val sidecar = readOfficialAsset(assetPrefix + sidecarName, 256)
            val remoteCode = manifest.optLong("versionCode", 0L)
            val digest = manifest.optString("sha256")
            val attested = DirectUpdatePolicy.manifestMatches(
                manifest.optString("product"), manifest.optString("platform"),
                manifest.optString("channel"), manifest.optString("distribution"),
                manifest.optString("package"), manifest.optString("versionName"),
                remoteCode, manifest.optString("apkFilename"), digest,
                manifest.optString("signerCertSha256"), version, remoteCode, apkFile)
                && DirectUpdatePolicy.checksumMatches(sidecar, apkFile, digest)
            if (!attested)
                throw IllegalStateException("Official manifest or checksum mismatch.")
            // If human release notes also state the Android code, they must
            // agree with the actual release manifest. No notes-only trust.
            val notesCode = Regex(
                "Android Direct\\s+" + Regex.escape(version) + "\\s*\\(versionCode\\s+([0-9]{1,6})\\)",
                RegexOption.IGNORE_CASE).find(release.optString("body"))
                ?.groupValues?.get(1)?.toLongOrNull()
            if (notesCode != null && notesCode != remoteCode)
                throw IllegalStateException("Release notes and Android manifest disagree.")

            val decision = DirectUpdatePolicy.compare(
                DriveCloudEngine.ANDROID_VERSION, installedCode(context),
                version, remoteCode, stable, attested, official)
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
