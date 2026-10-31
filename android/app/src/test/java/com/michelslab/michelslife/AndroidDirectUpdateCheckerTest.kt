package com.michelslab.michelslife

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

/** Exercises the production Kotlin release parser without a network or installed APK. */
class AndroidDirectUpdateCheckerTest {
    private fun asset(
        version: String = "0.2.9",
        tag: String = "v3.0.221",
        digest: String = "sha256:" + "a".repeat(64),
        size: Long = 68004436L
    ): JSONObject {
        val name = "MichelsLife-Android-Direct-v$version.apk"
        return JSONObject()
            .put("name", name)
            .put("size", size)
            .put("digest", digest)
            .put("browser_download_url",
                "https://github.com/michels-lab/michel-s-life-releases/releases/download/$tag/$name")
    }

    private fun release(): JSONObject = JSONObject()
        .put("draft", false)
        .put("prerelease", false)
        .put("tag_name", "v3.0.221")
        .put("html_url",
            "https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.221")
        .put("published_at", "2026-10-19T14:18:28Z")
        .put("assets", JSONArray().put(asset()))

    private fun unchecked(r: JSONObject) {
        assertEquals("unchecked", r.getString("status"))
        assertFalse(r.getBoolean("updateCheckPerformed"))
        assertTrue(r.isNull("updateAvailable"))
        assertFalse(r.getBoolean("managedExternally"))
    }

    @Test fun matchingInstalledVersion() {
        val r = AndroidDirectUpdateChecker.parse(release(), "0.2.9")
        assertEquals("up_to_date", r.getString("status"))
        assertTrue(r.getBoolean("updateCheckPerformed"))
        assertFalse(r.getBoolean("updateAvailable"))
        assertEquals("0.2.9", r.getString("latestVersion"))
        assertEquals("a".repeat(64), r.getString("apkSha256"))
    }

    @Test fun newerOfficialVersion() {
        val r = AndroidDirectUpdateChecker.parse(release(), "0.2.8")
        assertEquals("update_available", r.getString("status"))
        assertTrue(r.getBoolean("updateAvailable"))
    }

    @Test fun installedVersionAheadOfPublic() {
        val r = AndroidDirectUpdateChecker.parse(release(), "0.2.10")
        assertEquals("ahead_of_public_release", r.getString("status"))
        assertFalse(r.getBoolean("updateAvailable"))
    }

    @Test fun draftsAndPrereleasesNeverPass() {
        unchecked(AndroidDirectUpdateChecker.parse(release().put("draft", true), "0.2.9"))
        unchecked(AndroidDirectUpdateChecker.parse(release().put("prerelease", true), "0.2.9"))
        unchecked(AndroidDirectUpdateChecker.parse(release().remove("draft"), "0.2.9"))
    }

    @Test fun missingOrWrongMetadataNeverPasses() {
        unchecked(AndroidDirectUpdateChecker.parse(release().remove("published_at"), "0.2.9"))
        unchecked(AndroidDirectUpdateChecker.parse(release().put("html_url", "https://example.org/x"), "0.2.9"))
        unchecked(AndroidDirectUpdateChecker.parse(release().put("tag_name", "v3.0.221-rc1"), "0.2.9"))
        unchecked(AndroidDirectUpdateChecker.parse(release().remove("assets"), "0.2.9"))
    }

    @Test fun noOrMultipleAndroidApksNeverPass() {
        unchecked(AndroidDirectUpdateChecker.parse(release().put("assets", JSONArray()), "0.2.9"))
        unchecked(AndroidDirectUpdateChecker.parse(
            release().put("assets", JSONArray().put(asset()).put(asset())), "0.2.9"))
    }

    @Test fun unknownOrUntrustedAssetCannotClaimUpdate() {
        val wrong = asset().put("browser_download_url", "https://example.org/other.apk")
        unchecked(AndroidDirectUpdateChecker.parse(
            release().put("assets", JSONArray().put(wrong)), "0.2.8"))
        unchecked(AndroidDirectUpdateChecker.parse(
            release().put("assets", JSONArray().put(asset(digest = "sha256:bad"))), "0.2.8"))
        unchecked(AndroidDirectUpdateChecker.parse(
            release().put("assets", JSONArray().put(asset(size = 100L))), "0.2.8"))
    }

    @Test fun invalidInstalledVersionNeverLooksCurrent() {
        unchecked(AndroidDirectUpdateChecker.parse(release(), "0.2.9-rc"))
        unchecked(AndroidDirectUpdateChecker.parse(release(), "unknown"))
    }

    @Test fun extraNonAndroidAssetsArePermitted() {
        val assets = JSONArray()
            .put(JSONObject().put("name", "AppBundle.zip"))
            .put(asset())
            .put(JSONObject().put("name", "MichelsLife-Portable-v3.0.221.exe"))
        val result = AndroidDirectUpdateChecker.parse(release().put("assets", assets), "0.2.8")
        assertTrue(result.getBoolean("updateCheckPerformed"))
        assertTrue(result.getBoolean("updateAvailable"))
    }
}
