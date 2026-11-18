#!/usr/bin/env python3
"""Synthetic regression coverage for Android native relaunch ADB guard."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / "android/tools/granada_relaunch_transport_guard.py"
spec = importlib.util.spec_from_file_location("granada_native_relaunch", MODULE)
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)
SERIAL = "emulator-5554"
PKG = "com.michelslab.michelslife"


class SimulatedADB:
    """Each device-list call advances one synthetic transport snapshot."""
    def __init__(self, cases):
        self.cases = cases
        self.index = -1
        self.actions = []

    def __call__(self, argv):
        self.actions.append(argv)
        if argv == ("kill-server",) or argv == ("start-server",):
            return (0, "")
        if argv == ("devices", "-l"):
            self.index = min(self.index + 1, len(self.cases) - 1)
        row = self.cases[max(0, self.index)]
        if argv == ("devices", "-l"):
            if row.get("transport") == "error":
                return 127, "SECRET ADAPTER ERROR PASSWORD"
            state = row.get("transport", "device")
            return 0, "List of devices attached\n" + SERIAL + "\t" + state + " product:emulator\n"
        if argv == ("-s", SERIAL, "shell", "getprop", "sys.boot_completed"):
            return 0, row.get("boot", "1")
        if argv == ("-s", SERIAL, "shell", "pidof", PKG):
            return row.get("pid_exit", 0), row.get("pid", "2345\n")
        raise AssertionError("Unexpected ADB command")

    def has(self, command):
        return command in self.actions


class GuardTests(unittest.TestCase):
    def apply(self, cases, **kwargs):
        stub = SimulatedADB(cases)
        result = guard.recover(stub, SERIAL, PKG, delay_seconds=0,
                               sleep=lambda _: None, **kwargs)
        return result, stub

    def test_clean_real_pid_immediately(self):
        result, stub = self.apply([{}])
        self.assertEqual(result["status"], "pass")
        self.assertEqual(result["code"], "verified")
        self.assertEqual(result["attempts"], 1)
        self.assertEqual(result["adb_resets"], 0)
        self.assertFalse(stub.has(("kill-server",)))

    def test_offline_to_running_pid_needs_exact_real_proof(self):
        result, stub = self.apply([{"transport": "offline"}, {}])
        self.assertEqual(result["status"], "pass")
        self.assertEqual(result["code"], "recovered")
        self.assertEqual(result["attempts"], 2)
        self.assertEqual(result["adb_resets"], 1)
        self.assertTrue(stub.has(("kill-server",)))
        self.assertTrue(stub.has(("start-server",)))

    def test_offline_then_boot_then_running(self):
        result, stub = self.apply([
            {"transport": "offline"}, {"boot": "0"}, {}
        ])
        self.assertEqual(result["status"], "pass")
        self.assertEqual(result["attempts"], 3)
        self.assertEqual(result["adb_resets"], 1)

    def test_emulator_never_comes_online_fails_closed(self):
        result, stub = self.apply([{"transport": "offline"}], max_attempts=4)
        self.assertEqual(result["status"], "fail")
        self.assertEqual(result["code"], "transport_unavailable")
        self.assertEqual(result["adb_resets"], 2)
        self.assertEqual(result["attempts"], 4)

    def test_missing_app_process_never_relaunches_or_resets(self):
        result, stub = self.apply([{"pid_exit": 1, "pid": ""}], max_attempts=4)
        self.assertEqual(result["status"], "fail")
        self.assertEqual(result["code"], "app_process_missing")
        self.assertFalse(stub.has(("kill-server",)))
        self.assertTrue(all("force-stop" not in " ".join(cmd) and
                            "am" not in cmd and "install" not in cmd
                            for cmd in stub.actions))

    def test_bad_pid_must_not_be_treated_as_alive(self):
        result, _ = self.apply([{"pid": "1234 SECRET_ACCESS_TOKEN"}])
        self.assertEqual(result["code"], "app_process_missing")

    def test_nonbooted_emulator_must_not_pass(self):
        result, _ = self.apply([{"boot": "0"}])
        self.assertEqual(result["code"], "boot_unavailable")

    def test_malformed_android_serial_is_rejected_without_adb(self):
        stub = SimulatedADB([{}])
        result = guard.recover(stub, "emulator-5554; rm -rf /",
                               PKG, delay_seconds=0)
        self.assertEqual(result["code"], "invalid_input")
        self.assertEqual(stub.actions, [])

    def test_malformed_package_is_rejected_without_adb(self):
        stub = SimulatedADB([{}])
        result = guard.recover(stub, SERIAL, "com.foo;cat /proc",
                               delay_seconds=0)
        self.assertEqual(result["code"], "invalid_input")
        self.assertEqual(stub.actions, [])

    def test_rejects_unbounded_retry_and_sleep(self):
        for attempts, delay in [(0, 0), (9, 0), (1, 100), (1, -1)]:
            stub = SimulatedADB([{}])
            self.assertEqual(guard.recover(
                stub, SERIAL, PKG, attempts, delay
            )["code"], "invalid_input")
            self.assertEqual(stub.actions, [])

    def test_device_parser_exact_no_substring_and_no_offline(self):
        self.assertEqual(guard.device_state(
            "emulator-5554evil\tdevice\n", SERIAL), "missing")
        self.assertEqual(guard.device_state(
            "emulator-5554\toffline\n", SERIAL), "offline")
        self.assertEqual(guard.device_state(
            "emulator-5554\tdevice\nemulator-5554\tdevice\n", SERIAL), "missing")

    def test_transport_error_code_excludes_raw_credentials(self):
        result, _ = self.apply([{"transport": "error"}])
        self.assertEqual(result["status"], "fail")
        self.assertNotIn("SECRET", json.dumps(result))

    def test_redacted_json_manifest_never_claims_native_progress(self):
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / "deep" / "report.json"
            report, _ = self.apply([{}])
            guard.safe_write(target, report)
            data = json.loads(target.read_text())
            self.assertTrue(data["status"] == "pass")
            self.assertFalse(data["native_persistence_verified"])
            self.assertFalse(data["package_relaunched_by_guard"])
            self.assertFalse(data["browser_simulation"])
            self.assertNotIn("2345", target.read_text())

    def test_cli_exit_failure_is_not_softened(self):
        with tempfile.TemporaryDirectory() as d:
            actual = guard.default_runner
            try:
                guard.default_runner = lambda argv: (127, "")
                rc = guard.main(["--package", PKG, "--output", str(Path(d)/"r.json"),
                                 "--attempts", "1", "--delay", "0"])
                self.assertEqual(rc, 1)
                self.assertEqual(json.loads((Path(d)/"r.json").read_text())["status"], "fail")
            finally:
                guard.default_runner = actual

    def test_early_screenshot_recovery_requires_real_app_pid(self):
        script = (ROOT / "android/tools/smoke_candidate_apk_install.sh").read_text()
        self.assertEqual(script.count("granada_relaunch_transport_guard.py"), 2)
        self.assertIn('granada-capture-transport-$attempt.json', script)
        self.assertIn("Native screenshot transport or real Android app process lost", script)
        self.assertIn("::error::Missing real native Android pixels", script)
        self.assertIn('return 1', script)

    def test_integration_script_uses_guard_without_disabling_native_gates(self):
        script = (ROOT / "android/tools/smoke_candidate_apk_install.sh").read_text()
        self.assertIn("granada_relaunch_transport_guard.py", script)
        self.assertIn("native-state-after.json", script)
        self.assertIn("capture_native_state after", script)
        self.assertIn("::error::Cannot verify native Android process after relaunch", script)
        self.assertNotIn("continue-on-error", script)


if __name__ == "__main__":
    unittest.main()
