import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("candidate_native_attestation",
    ROOT / "tools/granada_candidate_native_artifact.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
SHA = "a" * 40
NAME = mod.NAME


class SameCandidateTests(unittest.TestCase):
    def sample(self, d):
        apk = Path(d) / NAME
        apk.write_bytes(b"debug ci apk placeholder" * 80)
        self.assertEqual(mod.main(["--dir", str(d), "--source-sha", SHA, "--create"]), 0)
        return apk

    def test_same_apk_and_commit_pass(self):
        with tempfile.TemporaryDirectory() as d:
            self.sample(d)
            self.assertEqual(mod.main(["--dir", d, "--source-sha", SHA, "--verify"]), 0)

    def test_wrong_checkout_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            self.sample(d)
            self.assertEqual(mod.main(["--dir", d, "--source-sha", "b"*40, "--verify"]), 1)

    def test_tampered_apk_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            apk = self.sample(d)
            apk.write_bytes(apk.read_bytes() + b"corrupt")
            self.assertEqual(mod.main(["--dir", d, "--source-sha", SHA, "--verify"]), 1)

    def test_tampered_sidecar_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            self.sample(d)
            (Path(d) / (NAME + ".sha256")).write_text("c"*64+"  "+NAME+"\n")
            self.assertEqual(mod.main(["--dir", d, "--source-sha", SHA, "--verify"]), 1)

    def test_manifest_fails_closed_for_wrong_filename_and_commit(self):
        with tempfile.TemporaryDirectory() as d:
            self.sample(d)
            path=Path(d)/"candidate-provenance.json"
            x=json.loads(path.read_text());x["candidate_apk_filename"]="other.apk"
            path.write_text(json.dumps(x))
            self.assertEqual(mod.main(["--dir", d, "--source-sha", SHA, "--verify"]), 1)
            self.assertEqual(mod.main(["--dir", d, "--source-sha", "not-sha", "--verify"]), 1)

    def test_short_missing_apk_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(mod.main(["--dir", d, "--source-sha", SHA, "--create"]), 1)
            (Path(d) / NAME).write_bytes(b"short")
            self.assertEqual(mod.main(["--dir", d, "--source-sha", SHA, "--create"]), 1)

    def test_no_public_or_galaxy_claims(self):
        with tempfile.TemporaryDirectory() as d:
            self.sample(d)
            x=json.loads((Path(d)/"candidate-provenance.json").read_text())
            self.assertFalse(x["real_installed_native_validation"])
            self.assertFalse(x["signed_public_release"])
            self.assertEqual(x["candidate_kind"],"debug_ci_only")
            self.assertNotIn("password",str(x))

    def test_matrix_uses_exact_head_and_current_version(self):
        wf=(ROOT/".github/workflows/granada-native-candidate-ram-matrix.yml").read_text()
        self.assertNotIn("0.2.9",wf)
        self.assertIn("github.event.pull_request.head.sha || github.sha",wf)
        self.assertEqual(wf.count("ref: ${{ env.CANDIDATE_SHA }}"),5)
        self.assertEqual(wf.count('test "$(git rev-parse HEAD)" = "$CANDIDATE_SHA"'),5)
        self.assertEqual(wf.count('echo "ANDROID_VERSION=$VERSION" >> "$GITHUB_ENV"'),4)
        self.assertIn("APK: artifacts/candidate/"+NAME,wf)
        self.assertNotIn("$GITHUB_SHA",wf)

    def test_versioned_artifact_preserves_sidecar_and_rejects_path_traversal(self):
        with tempfile.TemporaryDirectory() as d:
            name="MichelsLife-Android-TEST-v0.2.24.apk"
            apk=Path(d)/name
            apk.write_bytes(b"x"*2048)
            sidecar=Path(d)/(name+".sha256")
            original=mod.sha256(apk)+"  artifacts/android/"+name+"\n"
            sidecar.write_text(original)
            args=["--dir",d,"--source-sha",SHA,"--filename",name]
            self.assertEqual(mod.main(args+["--create"]),0)
            self.assertEqual(sidecar.read_text(),original)
            self.assertEqual(mod.main(args+["--verify"]),0)
            self.assertEqual(mod.main(["--dir",d,"--source-sha",SHA,"--filename","../"+name,"--verify"]),1)
            sidecar.write_text(mod.sha256(apk)+"  ../"+name+"\n")
            self.assertEqual(mod.main(args+["--verify"]),1)
            self.assertEqual(mod.main(args+["--create"]),1)

    def test_main_build_verifies_exact_head_and_all_native_arms(self):
        wf=(ROOT/".github/workflows/android-build.yml").read_text()
        self.assertEqual(wf.count("ref: ${{ env.CANDIDATE_SHA }}"),4)
        self.assertEqual(wf.count('test "$(git rev-parse HEAD)" = "$CANDIDATE_SHA"'),4)
        self.assertEqual(wf.count('tools/granada_candidate_native_artifact.py --dir artifacts/candidate --source-sha "$CANDIDATE_SHA"'),3)
        self.assertEqual(wf.count("cp artifacts/candidate/candidate-provenance.json"),3)

    def test_no_windows_or_main_android_build_changes(self):
        wf=(ROOT/".github/workflows/granada-native-candidate-ram-matrix.yml").read_text()
        self.assertIn("native-default:",wf)
        self.assertIn("native-3gib:",wf)
        self.assertEqual(wf.count("needs: compile"),3)
        self.assertEqual(wf.count("granada_candidate_native_artifact.py --dir artifacts/candidate --source-sha"),8)
        self.assertIn("ram-size: 3072M",wf)
        self.assertIn("-gpu software",wf)
        self.assertIn("native-3gib-software:",wf)
        self.assertNotIn("continue-on-error",wf)
        self.assertNotIn("windows",wf.lower())
        self.assertIn("MLV_REQUIRE_NATIVE_STATE_PROBE: '1'",wf)


if __name__ == "__main__":
    unittest.main()
