import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from tools.granada_native_webview_failure_diagnosis import (
    PHASES, CATEGORIES, categorize_logcat, safe_report, collect
)

def fixture(phase="webview_capture_failed_1"):
    return {
        "phase":phase,"boot_completed":True,"app_pid_present":True,
        "cdp_http_reachable":False,"cdp_page_count":None,
        "native_window_visible":True,"adb_reachable":True,
        "logcat_reachable":True,
        "events":{k:0 for k in CATEGORIES}
    }

class NativeWebViewDiagnosticTests(unittest.TestCase):
    def test_safe_empty_counts(self):
        self.assertEqual(categorize_logcat("unrelated user content"),{k:0 for k in CATEGORIES})
    def test_anr_and_crash_classification_counts_only(self):
        raw="ANR in com.michelslab.michelslife\nFatal signal 11\nOutOfMemoryError\nWebViewFactory"
        event=categorize_logcat(raw)
        self.assertEqual(event["anr"],1)
        self.assertEqual(event["fatal_signal"],1)
        self.assertEqual(event["oom_event"],1)
        self.assertEqual(event["webview_provider"],1)
        self.assertNotIn("com.michelslab",str(event))
    def test_no_raw_user_payload_in_evidence(self):
        text="user@example.com TOKEN=supersecret\nMy private journal"
        report=fixture();report["events"]=categorize_logcat(text)
        self.assertNotIn("supersecret",json.dumps(safe_report(report)))
        self.assertNotIn("journal",json.dumps(safe_report(report)))
        self.assertNotIn("example.com",json.dumps(safe_report(report)))
    def test_reject_unknown_phase(self):
        with self.assertRaisesRegex(ValueError,"unknown_native_phase"):
            safe_report(fixture("leak-my-token"))
    def test_reject_additional_provider_identifiers(self):
        for extra in ("accountId","auth_token","raw_logcat","user_email"):
            with self.subTest(extra=extra):
                data=fixture();data[extra]="unsafe-value"
                with self.assertRaisesRegex(ValueError,"wrong_report_schema"):
                    safe_report(data)
    def test_reject_missing_categories(self):
        data=fixture();data["events"].pop("anr")
        with self.assertRaisesRegex(ValueError,"invalid_event_categories"):
            safe_report(data)
    def test_reject_unexpected_log_category(self):
        data=fixture();data["events"]["account_payload"]=1
        with self.assertRaisesRegex(ValueError,"invalid_event_categories"):
            safe_report(data)
    def test_reject_untrusted_numeric(self):
        for bad in (False,-1,5001,"2",2.5):
            with self.subTest(bad=bad):
                data=fixture();data["events"]["anr"]=bad
                with self.assertRaisesRegex(ValueError,"invalid_event_count"):
                    safe_report(data)
    def test_reject_cdp_page_unbounded_or_credential(self):
        for bad in (False,-1,201,"cookie"):
            with self.subTest(bad=bad):
                data=fixture();data["cdp_page_count"]=bad
                with self.assertRaisesRegex(ValueError,"invalid_cdp_count"):
                    safe_report(data)
    def test_reject_flags_that_are_not_boolean(self):
        for bad in ("yes",1,[],{}):
            with self.subTest(bad=bad):
                data=fixture();data["adb_reachable"]=bad
                with self.assertRaisesRegex(ValueError,"invalid_native_boolean"):
                    safe_report(data)
    def test_offline_guest_report_does_not_claim_native_success(self):
        with patch("tools.granada_native_webview_failure_diagnosis.adb",return_value=None):
            x=collect("after_force_stop_1")
        self.assertFalse(x["adb_reachable"])
        self.assertIsNone(x["app_pid_present"])
        self.assertIsNone(x["boot_completed"])
        self.assertIsNone(x["cdp_http_reachable"])
        self.assertEqual(x["events"],{k:0 for k in CATEGORIES})
        self.assertNotIn("pass",json.dumps(x).lower())
    def test_pid_non_numeric_does_not_escape_raw_string(self):
        def fake_adb(*args,**kwargs):
            if args==("get-state",):return "device"
            if args[:2]==("shell","getprop"):return "1"
            if args[:2]==("shell","pidof"):return "123; secret-token"
            return ""
        with patch("tools.granada_native_webview_failure_diagnosis.adb",side_effect=fake_adb),patch(
            "tools.granada_native_webview_failure_diagnosis.urlopen",side_effect=OSError
        ):
            x=collect("webview_capture_failed_1")
        self.assertFalse(x["app_pid_present"])
        self.assertNotIn("secret-token",json.dumps(x))
    def test_every_declared_phase_is_accepted(self):
        for phase in PHASES:
            with self.subTest(phase=phase):
                safe_report(fixture(phase))
if __name__=="__main__":
    unittest.main()
