"""Regression guard: Android updater must not manufacture an up-to-date verdict.

Run: python -m unittest tools/test_android_update_status_contract.py
This source-level test is NOT a native APK/Google Play integration test.
"""
from pathlib import Path
import re
import unittest

SOURCE = Path(__file__).resolve().parents[1] / "android/app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt"

def action_body(source: str, action: str) -> str:
    marker = f'"{action}" -> {{'
    start = source.index(marker)
    # Stop at the next sibling dispatch case, not comments or nested if.
    suffix = source[start + len(marker):]
    match = re.search(r'\n            (?:"[^"]+" ->|else ->)', suffix)
    if not match:
        raise AssertionError("Action boundary not found")
    return suffix[:match.start()]

class UpdateStatusContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SOURCE.read_text(encoding="utf-8")
        cls.action = action_body(cls.source, "updateStatus")

    def test_unchecked_is_explicit(self):
        self.assertIn('.put("status", "unchecked")', self.action)
        self.assertIn('.put("updateCheckPerformed", false)', self.action)

    def test_unknown_is_not_false(self):
        self.assertIn('.put("updateAvailable", JSONObject.NULL)', self.action)
        self.assertNotIn('.put("updateAvailable", false)', self.action)

    def test_google_play_channel_is_distinct(self):
        self.assertIn('channel == "google-play"', self.action)
        self.assertIn('.put("managedExternally", channel == "google-play")', self.action)

    def test_calendar_unavailable_is_truthful(self):
        self.assertIn('Google Calendar sync is not available on Android yet', self.source)
        self.assertNotIn('googleEventCount", 0', self.source)

    def test_native_focus_bridge_preserved(self):
        self.assertIn('fun syncFocusAlarm(rawState: String)', self.source)

if __name__ == "__main__":
    unittest.main()
