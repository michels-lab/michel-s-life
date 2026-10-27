#!/usr/bin/env python3
"""Offline fail-closed tests for host triage, without an APK or ADB emulator."""
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent

class CandidateHostWrapper(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        (self.root/"tools").mkdir()
        (self.root/"android/tools").mkdir(parents=True)
        shutil.copy2(ROOT/"tools/granada_candidate_host_wrapper.sh",
                     self.root/"tools/granada_candidate_host_wrapper.sh")
        shutil.copy2(ROOT/"tools/granada_android16_host_verdict.py",
                     self.root/"tools/granada_android16_host_verdict.py")
        shutil.copy2(ROOT/"tools/granada_android16_phase_evidence.py",
                     self.root/"tools/granada_android16_phase_evidence.py")
        # The script's source is pinned to a synthetic but valid SHA in the
        # isolated test git repository, and must not depend on any real account.
        subprocess.run(["git","init","-q"],cwd=self.root,check=True)
        subprocess.run(["git","-c","user.name=CI Test","-c",
                        "user.email=ci@example.invalid","commit","--allow-empty",
                        "-qm","synthetic fixture"],cwd=self.root,check=True)

    def run_fake(self,code):
        (self.root/"android/tools/smoke_candidate_apk_install.sh").write_text(
            "#!/usr/bin/env bash\nexit "+str(code)+"\n",encoding="utf-8")
        return subprocess.run(["bash","tools/granada_candidate_host_wrapper.sh"],
                              cwd=self.root,stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE,text=True,timeout=20)

    def test_failing_native_script_never_looks_green(self):
        result=self.run_fake(27)
        self.assertEqual(result.returncode,27)
        out=self.root/"artifacts/candidate-install-host"
        self.assertTrue((out/"host-before.txt").exists())
        self.assertTrue((out/"host-after-failure.txt").exists())
        verdict=json.loads((out/"diagnostic-verdict.json").read_text())
        self.assertIn(verdict["status"],("DIAGNOSTIC_ONLY","INSUFFICIENT_EVIDENCE"))
        self.assertIs(verdict["canonical_persistence_verified"],False)
        self.assertIs(verdict["physical_galaxy_verified"],False)
        self.assertFalse((out/"native-script-complete.txt").exists())
        self.assertNotIn("token",json.dumps(verdict).lower())

    def test_silent_green_without_actual_apk_evidence_is_rejected(self):
        result=self.run_fake(0)
        self.assertNotEqual(result.returncode,0)
        self.assertFalse((self.root/"artifacts/candidate-install-host/native-script-complete.txt").exists())
        self.assertIn("GRANADA_NATIVE_MISSING_REQUIRED_COMPARISON",result.stderr+result.stdout)

    def test_host_timeline_is_bounded_numeric_only(self):
        result=self.run_fake(27)
        self.assertEqual(result.returncode,27)
        p=self.root/"artifacts/candidate-install-host/host-memory-timeline.tsv"
        self.assertTrue(p.is_file())
        rows=p.read_text().splitlines()
        self.assertGreaterEqual(len(rows),2)
        self.assertEqual("epoch_utc\tqemu_processes\tqemu_rss_kib\thost_available_kib\tcgroup_memory_bytes",rows[0])
        self.assertLessEqual(len(rows),482)
        for row in rows[1:]:
            parts=row.split("\t")
            self.assertEqual(5,len(parts))
            self.assertTrue(all(x.lstrip("-").isdigit() for x in parts))
        self.assertNotIn("token",p.read_text().lower())
        self.assertNotIn("password",p.read_text().lower())

    def test_failing_native_script_still_does_not_claim_complete_after_sampling(self):
        failed=self.run_fake(39)
        self.assertEqual(39,failed.returncode)
        root=self.root/"artifacts/candidate-install-host"
        self.assertTrue((root/"host-memory-timeline.tsv").exists())
        self.assertFalse((root/"native-script-complete.txt").exists())
        self.assertIn("GRANADA_CANDIDATE_NATIVE_SMOKE_FAILED status=39",failed.stderr)

    def test_sampler_has_no_real_device_or_fake_frame_bypass(self):
        code=(ROOT/"tools/granada_candidate_host_wrapper.sh").read_text()
        self.assertEqual(1,code.count("bash android/tools/smoke_candidate_apk_install.sh"))
        self.assertIn("watch_host &",code)
        self.assertEqual(code.count("watch_host(){"),1)
        self.assertEqual(code.count("trap failed EXIT"),1)
        self.assertEqual(code.count("python3 - <<'PY'"),1)
        self.assertTrue(code.rstrip().endswith('echo "GRANADA_NATIVE_CANDIDATE_PASS; no physical Galaxy, account or release claim"'))
        self.assertIn("stop_watch",code)
        self.assertNotIn("continue-on-error",code)
        self.assertNotIn("touch artifacts/candidate-install/step0.png",code)

    def test_wrapper_has_exact_original_script_without_skip_controls(self):
        original=(ROOT/"tools/granada_candidate_host_wrapper.sh").read_text()
        self.assertEqual(original.count("bash android/tools/smoke_candidate_apk_install.sh"),1)
        self.assertNotIn("continue-on-error",original)
        self.assertIn("trap failed EXIT",original)
        self.assertIn("png_info(p)",original)
        syntax=subprocess.run(["bash","-n",str(ROOT/"tools/granada_candidate_host_wrapper.sh")],
                              capture_output=True,text=True)
        self.assertEqual(syntax.returncode,0,syntax.stderr)

if __name__=="__main__":
    unittest.main()
