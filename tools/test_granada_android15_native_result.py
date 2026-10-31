import hashlib
import json
import pathlib
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib
from granada_android15_native_result import validate, FRAMES, REPORTS, CHECKS

def chunk(kind,data):
    return struct.pack(">I",len(data))+kind+data+struct.pack(">I",zlib.crc32(kind+data)&0xffffffff)

def real_png():
    raw = b"".join(
        b"\x00"+b"".join(hashlib.sha256(f"{row}-{i}".encode()).digest()
                           for i in range(12))[:360]
        for row in range(120))
    return (b"\x89PNG\r\n\x1a\n" +
        chunk(b"IHDR",struct.pack(">IIBBBBB",120,120,8,2,0,0,0))+
        chunk(b"IDAT",zlib.compress(raw))+
        chunk(b"IEND",b""))

class NativeAndroid15ResultTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=pathlib.Path(self.temp.name)
        self.apk=self.root/"candidate.apk"
        self.apk.write_bytes(b"fake-debug-apk-fixture" * 10000)
        (self.root/"current-source-commit.txt").write_text("a"*40 + "\n")
        (self.root/"current-source-apk.sha256").write_text(
            hashlib.sha256(self.apk.read_bytes()).hexdigest() + "  " + self.apk.as_posix() + "\n")
        (self.root/"package-info.txt").write_text(
            "Package [com.michelslab.michelslife]\nversionName=0.2.9\n")
        (self.root/"process-id.txt").write_text("123\n")
        (self.root/"relaunch-process-id.txt").write_text("567\n")
        for name in FRAMES:
            (self.root/name).write_bytes(real_png())
        self.before = {
            "onboardingComplete": True,"missionCount":2,
            "missionIdsDigest":"b"*64, "dashboardKpisDigest":"c"*64,
            "collections":{"missions":{"count":2,"idsDigest":"d"*64}}
        }
        self.report={
            "pass":True,"checks":{name:True for name in CHECKS},
            "before":self.before,"after":self.before,"scope":"synthetic"
        }
        for name in REPORTS:
            (self.root/name).write_text(json.dumps(self.report))
    def check(self):
        return validate(self.root,self.apk,"a"*40,"0.2.9")
    def change(self,name,mutator):
        p=self.root/name;d=json.loads(p.read_text());mutator(d);p.write_text(json.dumps(d))
    def test_valid_synthetic(self):
        self.assertEqual(self.check()["frame_count"],10)
    def test_missing_screenshot(self):
        (self.root/FRAMES[3]).unlink()
        with self.assertRaises(OSError):self.check()
    def test_png_crc_corruption(self):
        p=self.root/FRAMES[2];d=bytearray(p.read_bytes());d[32]^=1;p.write_bytes(d)
        with self.assertRaisesRegex(ValueError,"CRC"):self.check()
    def test_png_truncated(self):
        (self.root/FRAMES[1]).write_bytes(b"\x89PNG\r\n\x1a\n")
        with self.assertRaisesRegex(ValueError,"invalid native PNG"):self.check()
    def test_reused_pid(self):
        (self.root/"relaunch-process-id.txt").write_text("123\n")
        with self.assertRaisesRegex(ValueError,"reused"):self.check()
    def test_missing_pid(self):
        (self.root/"process-id.txt").write_text("")
        with self.assertRaisesRegex(ValueError,"PID"):self.check()
    def test_wrong_version(self):
        (self.root/"package-info.txt").write_text(
            "Package [com.michelslab.michelslife]\nversionName=0.2.8\n")
        with self.assertRaisesRegex(ValueError,"version"):self.check()
    def test_missing_comparison(self):
        (self.root/REPORTS[1]).unlink()
        with self.assertRaises(OSError):self.check()
    def test_false_check(self):
        self.change(REPORTS[0],lambda d:d["checks"].update(mission_ids_identical=False))
        with self.assertRaisesRegex(ValueError,"checks failed"):self.check()
    def test_missing_check(self):
        self.change(REPORTS[0],lambda d:d["checks"].pop("mission_ids_identical"))
        with self.assertRaisesRegex(ValueError,"canonical comparison"):self.check()
    def test_contradictory_reports(self):
        self.change(REPORTS[1],lambda d:d["after"].update(missionCount=9))
        with self.assertRaisesRegex(ValueError,"contradictory"):self.check()
    def test_sensitive_key(self):
        self.change(REPORTS[2],lambda d:d.update(refresh_token="NEVER_UPLOAD"))
        with self.assertRaisesRegex(ValueError,"sensitive"):self.check()
    def test_wrong_source(self):
        with self.assertRaisesRegex(ValueError,"source SHA"):
            validate(self.root,self.apk,"short","0.2.9")
    def test_forged_source_commit_is_rejected(self):
        (self.root/"current-source-commit.txt").write_text("b"*40 + "\n")
        with self.assertRaisesRegex(ValueError, "source SHA"):
            self.check()
    def test_apk_modified_after_manifest_is_rejected(self):
        self.apk.write_bytes(self.apk.read_bytes() + b"tampered")
        with self.assertRaisesRegex(ValueError, "SHA256"):
            self.check()
    def test_manifest_references_foreign_binary_path(self):
        f = self.root/"current-source-apk.sha256"
        f.write_text(hashlib.sha256(self.apk.read_bytes()).hexdigest() + "  /tmp/unrelated.apk")
        with self.assertRaisesRegex(ValueError, "filename mismatch"):
            self.check()
    def test_wrong_installed_android_package_rejected(self):
        (self.root/"package-info.txt").write_text(
            "Package [org.unrelated.application]\nversionName=0.2.9\n")
        with self.assertRaisesRegex(ValueError, "package identity"):
            self.check()
    def test_missing_native_provenance_file_fails_closed(self):
        (self.root/"current-source-apk.sha256").unlink()
        with self.assertRaises(OSError):
            self.check()
    def test_missing_apk(self):
        self.apk.unlink()
        with self.assertRaisesRegex(ValueError,"APK"):self.check()
    def run_cli(self):
        output=self.root/"api35-final-evidence.json"
        result=subprocess.run(
            [sys.executable,str(pathlib.Path(__file__).with_name("granada_android15_native_result.py")),
             "--evidence",str(self.root),"--apk",str(self.apk),
             "--source-sha","a"*40,"--version","0.2.9","--output",str(output)],
            capture_output=True,text=True,timeout=10
        )
        return result,output

    def test_failed_emulator_still_writes_private_safe_failure_artifact(self):
        # A real killed QEMU host can leave no screenshots or package info.
        (self.root/"package-info.txt").unlink()
        for name in FRAMES:(self.root/name).unlink()
        result,output=self.run_cli()
        self.assertNotEqual(result.returncode,0)
        report=json.loads(output.read_text())
        self.assertEqual(report["status"],"FAIL")
        self.assertIs(report["native_accepted"],False)
        self.assertEqual(report["reason"],"required_native_evidence_missing_or_invalid")
        self.assertNotIn(str(self.root),output.read_text())
        self.assertNotIn("localStorage",output.read_text())
        self.assertNotIn("token",output.read_text())

    def test_failed_native_comparison_preserves_red_verdict(self):
        (self.root/REPORTS[0]).unlink()
        result,output=self.run_cli()
        self.assertNotEqual(result.returncode,0)
        report=json.loads(output.read_text())
        self.assertEqual(report["status"],"FAIL")
        self.assertIs(report["native_accepted"],False)

    def test_sanitized_stage_first_frame(self):
        (self.root/"step0.png").unlink()
        result,output=self.run_cli()
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(json.loads(output.read_text())["failure_stage"],
                         "first_native_frame_unavailable")

    def test_sanitized_stage_finish_not_verified(self):
        (self.root/"native-state-before.json").unlink(missing_ok=True)
        (self.root/REPORTS[0]).unlink()
        result,output=self.run_cli()
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(json.loads(output.read_text())["failure_stage"],
                         "onboarding_finish_state_unverified")

    def test_sanitized_stage_first_relaunch_missing(self):
        (self.root/"native-state-before.json").write_text("{}")
        (self.root/REPORTS[0]).unlink()
        result,output=self.run_cli()
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(json.loads(output.read_text())["failure_stage"],
                         "first_relaunch_state_unverified")

    def test_sanitized_stage_second_relaunch_missing(self):
        (self.root/"native-state-before.json").write_text("{}")
        (self.root/"native-state-after.json").write_text("{}")
        (self.root/REPORTS[0]).unlink()
        result,output=self.run_cli()
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(json.loads(output.read_text())["failure_stage"],
                         "second_relaunch_state_unverified")

    def test_complete_native_evidence_cli_reports_true_success(self):
        result,output=self.run_cli()
        self.assertEqual(result.returncode,0,result.stderr)
        report=json.loads(output.read_text())
        self.assertEqual(report["status"],"PASS")
        self.assertEqual(report["frame_count"],len(FRAMES))
        self.assertEqual(report["canonical_comparisons"],len(REPORTS))
class NativeWorkflowFailClosedPolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow=(pathlib.Path(__file__).parents[1]/
            ".github/workflows/granada-android15-native.yml").read_text()

    def test_exact_head_checked_before_both_suites(self):
        self.assertEqual(self.workflow.count(
            "Require exact PR-head source checkout, not synthetic merge"),2)
        self.assertEqual(self.workflow.count(
            "ref: ${{ github.event.pull_request.head.sha || github.sha }}"),2)

    def test_no_false_green_after_android_emulator_loss(self):
        self.assertIn(
            "      - name: Fail closed on missing native pixels or incomplete progress comparisons",
            self.workflow)
        self.assertIn(
            "        if: always()\n        run: |\n          python tools/granada_android15_native_result.py",
            self.workflow)
        self.assertNotIn("continue-on-error: true",self.workflow)
        self.assertIn("      - name: Preserve native diagnostics even on RED",self.workflow)

    def test_stale_queued_emulator_runs_cancel_and_native_assertions_unchanged(self):
        self.assertIn("  cancel-in-progress: true",self.workflow)
        self.assertIn("script: bash android/tools/smoke_candidate_apk_install.sh",
                      self.workflow)
        self.assertIn("tools/granada_android15_native_result.py",self.workflow)
        self.assertIn("MLV_REQUIRE_NATIVE_STATE_PROBE: '1'",self.workflow)

if __name__ == "__main__":
    unittest.main()
