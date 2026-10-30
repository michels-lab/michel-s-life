"""Fail-closed source guard for the actual official Android Direct updater.

Runs in Source validation. The strict version comparator is separately executed
as real JVM code; neither test claims an installed APK/Galaxy acceptance.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
BRIDGE = ROOT / "android/app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt"
CHECKER = ROOT / "android/app/src/main/java/com/michelslab/michelslife/AndroidDirectUpdateChecker.kt"

class UpdateStatusContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bridge = BRIDGE.read_text(encoding="utf-8")
        cls.checker = CHECKER.read_text(encoding="utf-8")

    def test_play_never_claims_an_unperformed_check(self):
        self.assertIn('channel == "google-play"', self.bridge)
        self.assertIn('.put("managedExternally", true)', self.bridge)
        self.assertIn('.put("updateAvailable", JSONObject.NULL)', self.bridge)
        self.assertIn('.put("updateCheckPerformed", false)', self.bridge)

    def test_debug_install_is_not_misrepresented_as_signed_direct(self):
        self.assertIn("ApplicationInfo.FLAG_DEBUGGABLE", self.bridge)
        self.assertIn('.put("channel", "test")', self.bridge)
        self.assertIn('Test build; official Direct update status does not apply.', self.bridge)

    def test_direct_check_is_off_ui_thread(self):
        self.assertIn('executor.execute {', self.bridge)
        self.assertIn('AndroidDirectUpdateChecker.check(', self.bridge)
        self.assertIn('respondOk(requestId, AndroidDirectUpdateChecker.check(', self.bridge)

    def test_official_feed_only_and_bounded_network(self):
        self.assertIn("https://api.github.com/repos/michels-lab/michel-s-life-releases/releases/latest", self.checker)
        self.assertIn("HttpsURLConnection", self.checker)
        self.assertIn("instanceFollowRedirects = false", self.checker)
        self.assertIn("connection.connectTimeout = 5000", self.checker)
        self.assertIn("connection.readTimeout = 7000", self.checker)
        self.assertIn("buffer.size() + n > LIMIT", self.checker)

    def test_unverified_release_fails_closed(self):
        self.assertIn('.put("updateAvailable", JSONObject.NULL)', self.checker)
        self.assertIn('.put("updateCheckPerformed", false)', self.checker)
        self.assertIn('.put("status", "unchecked")', self.checker)
        self.assertIn("candidates.size != 1", self.checker)
        self.assertIn("release.optBoolean(\"prerelease\", true)", self.checker)
        self.assertIn("release.optBoolean(\"draft\", true)", self.checker)

    def test_success_requires_release_asset_and_digest(self):
        self.assertIn('APK_PREFIX + tag + "/" + name', self.checker)
        self.assertIn("shaPattern.matches(digest)", self.checker)
        self.assertIn("AndroidReleaseVersion.compare(latest, installed)", self.checker)
        self.assertIn('.put("updateAvailable", difference > 0)', self.checker)
        self.assertIn('.put("updateCheckPerformed", true)', self.checker)

    def test_no_silent_install_or_user_state_mutations(self):
        self.assertNotIn("ACTION_INSTALL_PACKAGE", self.checker)
        self.assertNotIn("DownloadManager", self.checker)
        self.assertNotIn("localStorage", self.checker)
        self.assertNotIn("accessToken", self.checker)

    def test_calendar_and_focus_unchanged(self):
        self.assertIn("Google Calendar sync is not available on Android yet", self.bridge)
        self.assertIn("fun syncFocusAlarm(rawState: String)", self.bridge)

if __name__ == "__main__":
    unittest.main()
