package com.michelslab.michelslife

import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.URL
import java.time.Instant
import javax.net.ssl.HttpsURLConnection

/**
 * Read-only direct-install release lookup. Never downloads or installs an APK,
 * stores credentials, changes mission data, or trusts a non-official host.
 */
internal object AndroidDirectUpdateChecker {
    private const val FEED = "https://api.github.com/repos/michels-lab/michel-s-life-releases/releases/latest"
    private const val PAGE_PREFIX = "https://github.com/michels-lab/michel-s-life-releases/releases/tag/"
    private const val APK_PREFIX = "https://github.com/michels-lab/michel-s-life-releases/releases/download/"
    private const val LIMIT = 262144
    private val apkPattern = Regex("^MichelsLife-Android-Direct-v([0-9]+\\.[0-9]+\\.[0-9]+)\\.apk$")
    private val shaPattern = Regex("^sha256:[0-9a-fA-F]{64}$")
    private val tagPattern = Regex("^v[0-9]+\\.[0-9]+\\.[0-9]+$")

    fun check(installed: String): JSONObject {
        var connection: HttpsURLConnection? = null
        try {
            connection = URL(FEED).openConnection() as HttpsURLConnection
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 5000
            connection.readTimeout = 7000
            connection.setRequestProperty("Accept", "application/vnd.github+json")
            connection.setRequestProperty("User-Agent", "MichelsLife-Android-Direct-Updater")
            if (connection.responseCode != 200)
                return unchecked(installed, "Could not confirm the official Android release. Try again later.")

            val buffer = ByteArrayOutputStream()
            connection.inputStream.use { input ->
                val chunk = ByteArray(8192)
                while (true) {
                    val n = input.read(chunk)
                    if (n < 0) break
                    if (buffer.size() + n > LIMIT)
                        return unchecked(installed, "The official update response exceeded its safety limit.")
                    buffer.write(chunk, 0, n)
                }
            }
            return parse(JSONObject(buffer.toString("UTF-8")), installed)
        } catch (_: Exception) {
            return unchecked(installed, "Could not check the official Android release. Check your connection.")
        } finally {
            connection?.disconnect()
        }
    }

    internal fun parse(release: JSONObject, installed: String): JSONObject {
        if (release.optBoolean("draft", true) || release.optBoolean("prerelease", true))
            return unchecked(installed, "No confirmed stable Android release was found.")

        val tag = release.optString("tag_name")
        if (!tagPattern.matches(tag) || release.optString("html_url") != PAGE_PREFIX + tag ||
            release.optString("published_at").isBlank())
            return unchecked(installed, "Could not validate the official release metadata.")

        val assets = release.optJSONArray("assets")
            ?: return unchecked(installed, "The official release has no Android APK.")
        val candidates = (0 until assets.length()).mapNotNull { assets.optJSONObject(it) }
            .filter { apkPattern.matches(it.optString("name")) }
        if (candidates.size != 1)
            return unchecked(installed, "Could not identify exactly one official Android APK.")

        val apk = candidates.single()
        val name = apk.optString("name")
        val latest = apkPattern.matchEntire(name)?.groupValues?.get(1) ?: ""
        val difference = AndroidReleaseVersion.compare(latest, installed)
            ?: return unchecked(installed, "Android version information could not be compared.")
        val digest = apk.optString("digest")
        if (apk.optString("browser_download_url") != APK_PREFIX + tag + "/" + name ||
            !shaPattern.matches(digest) || apk.optLong("size", 0L) < 1000000L)
            return unchecked(installed, "Could not verify the official Android APK metadata.")

        val state = when {
            difference > 0 -> "update_available"
            difference == 0 -> "up_to_date"
            else -> "ahead_of_public_release"
        }
        val description = when (state) {
            "update_available" -> "A newer stable Android Direct version is available on the official release page."
            "up_to_date" -> "Installed Android Direct version matches the latest verified public APK."
            else -> "This installed version is newer than the latest verified public APK."
        }
        return base(installed)
            .put("status", state)
            .put("message", description)
            .put("updateCheckPerformed", true)
            .put("updateAvailable", difference > 0)
            .put("latestVersion", latest)
            .put("releasePageUrl", PAGE_PREFIX + tag)
            .put("apkSha256", digest.removePrefix("sha256:").lowercase())
            .put("checkedAt", Instant.now().toString())
    }

    private fun base(version: String): JSONObject = JSONObject()
        .put("channel", "direct")
        .put("version", version)
        .put("managedExternally", false)

    internal fun unchecked(version: String, message: String): JSONObject = base(version)
        .put("updateAvailable", JSONObject.NULL)
        .put("updateCheckPerformed", false)
        .put("status", "unchecked")
        .put("message", message)
}
