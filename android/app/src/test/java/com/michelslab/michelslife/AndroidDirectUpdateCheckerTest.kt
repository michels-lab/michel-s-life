package com.michelslab.michelslife

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class AndroidDirectUpdateCheckerTest {
    private fun release(version: String = "0.2.9", tag: String = "v3.0.221"): JSONObject {
        val name = "MichelsLife-Android-Direct-v$version.apk"
        val root = "https://github.com/michels-lab/michel-s-life-releases/releases/"
        return JSONObject()
            .put("draft", false)
            .put("prerelease", false)
            .put("tag_name", tag)
            .put("html_url", root + "tag/" + tag)
            .put("assets", JSONArray()
                .put(JSONObject().put("name", name)
                    .put("browser_download_url", root + "download/" + tag + "/" + name))
                .put(JSONObject().put("name", name + ".sha256")
                    .put("browser_download_url", root + "download/" + tag + "/" + name + ".sha256")))
    }

    @Test fun detectsOfficialUpgradeButNeverInstallsAutomatically() {
        val result = AndroidDirectUpdateChecker.inspectRelease(release(), "0.2.8")
        assertTrue(result.getBoolean("updateAvailable"))
        assertTrue(result.getBoolean("checkedOfficialRelease"))
        assertFalse(result.getBoolean("installationAutomatic"))
        assertFalse(result.getBoolean("signatureVerifiedByDiscovery"))
        assertEquals("0.2.9", result.getString("latestVersion"))
        assertTrue(result.getString("releasePage").endsWith("/releases/tag/v3.0.221"))
    }

    @Test fun noNewVersionIsOnlyReportedAfterActualMetadataInspection() {
        val result = AndroidDirectUpdateChecker.inspectRelease(release(), "0.2.9")
        assertFalse(result.getBoolean("updateAvailable"))
        assertEquals("android-direct", result.getString("channel"))
    }

    @Test fun doesNotOfferDowngrades() {
        assertFalse(AndroidDirectUpdateChecker.inspectRelease(release("0.2.7"), "0.2.9")
            .getBoolean("updateAvailable"))
    }

    @Test fun rejectsMissingChecksum() {
        val listing = release()
        listing.getJSONArray("assets").remove(1)
        assertThrows(IllegalArgumentException::class.java) {
            AndroidDirectUpdateChecker.inspectRelease(listing, "0.2.8")
        }
    }

    @Test fun rejectsForeignDownloadUrlEvenWithOfficialLookingName() {
        val listing = release()
        listing.getJSONArray("assets").getJSONObject(0)
            .put("browser_download_url", "https://example.org/untrusted.apk")
        assertThrows(IllegalArgumentException::class.java) {
            AndroidDirectUpdateChecker.inspectRelease(listing, "0.2.8")
        }
    }

    @Test fun rejectsDraftAndPrereleaseMetadata() {
        val draft = release().put("draft", true)
        assertThrows(IllegalArgumentException::class.java) {
            AndroidDirectUpdateChecker.inspectRelease(draft, "0.2.8")
        }
        val prerelease = release().put("prerelease", true)
        assertThrows(IllegalArgumentException::class.java) {
            AndroidDirectUpdateChecker.inspectRelease(prerelease, "0.2.8")
        }
    }

    @Test fun rejectsUnexpectedOfficialPageAndInvalidVersion() {
        val listing = release().put("html_url", "https://elsewhere.example/releases/tag/v3.0.221")
        assertThrows(IllegalArgumentException::class.java) {
            AndroidDirectUpdateChecker.inspectRelease(listing, "0.2.8")
        }
        assertThrows(IllegalArgumentException::class.java) {
            AndroidDirectUpdateChecker.inspectRelease(release(), "0.2.9-developer")
        }
    }
}
