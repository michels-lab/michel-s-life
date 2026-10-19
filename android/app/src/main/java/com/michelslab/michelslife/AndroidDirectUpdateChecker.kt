package com.michelslab.michelslife

import org.json.JSONObject
import java.net.URL
import javax.net.ssl.HttpsURLConnection

/**
 * Read-only official release discovery. This is NOT an installer.
 * Never treat release metadata as a trusted or signed APK. Android's package
 * installer must enforce the pinned signing identity on any actual upgrade.
 */
object AndroidDirectUpdateChecker {
    private const val API =
        "https://api.github.com/repos/michels-lab/michel-s-life-releases/releases/latest"
    private const val TAG_BASE =
        "https://github.com/michels-lab/michel-s-life-releases/releases/tag/"
    private const val DOWNLOAD_BASE =
        "https://github.com/michels-lab/michel-s-life-releases/releases/download/"
    private val assetName = Regex("^MichelsLife-Android-Direct-v([0-9]+\\.[0-9]+\\.[0-9]+)\\.apk$")
    private val semantic = Regex("^[0-9]+\\.[0-9]+\\.[0-9]+$")

    private fun compareVersions(left: String, right: String): Int {
        require(semantic.matches(left) && semantic.matches(right)) {
            "The Android update version is not a supported semantic version."
        }
        val a = left.split('.').map { it.toLong() }
        val b = right.split('.').map { it.toLong() }
        for (i in 0..2) if (a[i] != b[i]) return a[i].compareTo(b[i])
        return 0
    }

    internal fun inspectRelease(release: JSONObject, installedVersion: String): JSONObject {
        require(!release.optBoolean("draft") && !release.optBoolean("prerelease")) {
            "Official update listing is not a stable public release."
        }
        val tag = release.optString("tag_name")
        require(tag.matches(Regex("^v[0-9]+\\.[0-9]+\\.[0-9]+$"))) {
            "Invalid official release version."
        }
        val page = release.optString("html_url")
        require(page == TAG_BASE + tag) { "Unexpected update source URL." }
        val assets = release.optJSONArray("assets") ?: error("Official release assets are missing.")
        val assetNames = (0 until assets.length()).mapNotNull { index ->
            assets.optJSONObject(index)?.optString("name")
        }
        val candidates = assetNames.mapNotNull { name ->
            val version = assetName.matchEntire(name)?.groupValues?.get(1)
            if (version != null && (name + ".sha256") in assetNames) version to name else null
        }
        require(candidates.isNotEmpty()) { "No verified-pair Android Direct APK and checksum in official release." }
        val (latestVersion, apkName) = candidates.maxWithOrNull(
            compareBy<Pair<String, String>> { it.first.split('.')[0].toLong() }
                .thenBy { it.first.split('.')[1].toLong() }
                .thenBy { it.first.split('.')[2].toLong() }
        ) ?: error("No Android Direct APK in official release.")
        val newer = compareVersions(latestVersion, installedVersion) > 0
        val expectedAssetUrl = DOWNLOAD_BASE + tag + "/" + apkName
        val hasAssetUrl = (0 until assets.length()).any { index ->
            val item = assets.optJSONObject(index)
            item?.optString("name") == apkName &&
                item.optString("browser_download_url") == expectedAssetUrl
        }
        require(hasAssetUrl) { "Official APK URL does not match the expected release path." }
        return JSONObject()
            .put("channel", "android-direct")
            .put("managedExternally", false)
            .put("checkedOfficialRelease", true)
            .put("updateAvailable", newer)
            .put("version", installedVersion)
            .put("latestVersion", latestVersion)
            .put("releasePage", page)
            .put("assetName", apkName)
            .put("status", if (newer)
                "An official Android Direct release is available. Open the official release page to review it. Installation requires your approval."
                else "You're using the newest Android Direct version published on the official release page.")
            .put("installationAutomatic", false)
            .put("signatureVerifiedByDiscovery", false)
    }

    fun check(installedVersion: String): JSONObject {
        val connection = URL(API).openConnection() as HttpsURLConnection
        connection.connectTimeout = 7000
        connection.readTimeout = 9000
        connection.instanceFollowRedirects = false
        connection.setRequestProperty("Accept", "application/vnd.github+json")
        connection.setRequestProperty("User-Agent", "MichelsLife-Android-Direct-Update-Check")
        try {
            if (connection.responseCode != 200)
                error("Official release service returned HTTP " + connection.responseCode)
            val max = 240_000
            val body = StringBuilder()
            connection.inputStream.bufferedReader(Charsets.UTF_8).use { reader ->
                val buffer = CharArray(4096)
                while (true) {
                    val count = reader.read(buffer)
                    if (count < 0) break
                    require(body.length + count <= max) { "Official release metadata is too large." }
                    body.append(buffer, 0, count)
                }
            }
            return inspectRelease(JSONObject(body.toString()), installedVersion)
        } finally {
            connection.disconnect()
        }
    }
}
