"""Offline negative/positive gates for official latest/previous native Direct upgrade."""
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location(
    "stable_pair", HERE / "select_published_android_upgrade.py")
selector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(selector)


def stable(win=230, android=19, *, draft=False, prerelease=False):
    v = f"0.2.{android}"
    w = f"3.0.{win}"
    names = [
        f"MichelsLife-Setup-v{w}.exe",
        f"MichelsLife-Setup-v{w}.exe.sha256",
        f"MichelsLife-Portable-v{w}.exe",
        f"MichelsLife-Portable-v{w}.exe.sha256",
        f"MichelsLife-v{w}.exe",
        f"MichelsLife-v{w}.exe.sha256",
        f"MichelsLife-Android-Direct-v{v}.apk",
        f"MichelsLife-Android-Direct-v{v}.apk.sha256",
        f"android-v{v}-manifest.json",
        f"android-signing-certificate-v{v}.txt",
        "AppBundle.zip", "michels_life_icon.ico", "release-provenance.json",
    ]
    return {
        "tag_name": f"v{w}-android-v{v}",
        "draft": draft, "prerelease": prerelease,
        "assets": [{"name": n} for n in names],
    }


class SignedUpgradeReleasePairTests(unittest.TestCase):
    def test_real_stable_release_pair_requires_exactly_thirteen_assets(self):
        pair = selector.choose(stable(), [stable(230,19),stable(229,18)])
        self.assertEqual(pair["LATEST_TAG"], "v3.0.230-android-v0.2.19")
        self.assertEqual(pair["PREVIOUS_TAG"], "v3.0.229-android-v0.2.18")
        self.assertEqual(pair["LATEST_VERSION"], "0.2.19")
        self.assertEqual(pair["PREVIOUS_VERSION"], "0.2.18")

    def test_draft_and_prerelease_are_not_acceptable(self):
        for item in [stable(draft=True),stable(prerelease=True)]:
            with self.assertRaisesRegex(ValueError,"missing_public_stable_release"):
                selector.choose(item, [stable(229,18)])

    def test_missing_or_duplicate_assets_fail_closed(self):
        bad=stable()
        bad["assets"].pop()
        with self.assertRaisesRegex(ValueError,"release_not_13_distinct_assets"):
            selector.choose(bad,[stable(229,18)])
        bad=stable()
        bad["assets"][-1]["name"]=bad["assets"][0]["name"]
        with self.assertRaisesRegex(ValueError,"release_not_13_distinct_assets"):
            selector.choose(bad,[stable(229,18)])

    def test_wrong_platform_pair_and_missing_previous_denied(self):
        for x in [stable(231,19),stable(230,17)]:
            with self.assertRaisesRegex(ValueError,"unsupported_release_version_chain"):
                selector.choose(x,[stable(229,18)])
        with self.assertRaisesRegex(ValueError,"immediately_previous_signed_release_not_found"):
            selector.choose(stable(),[stable(228,17)])
        with self.assertRaisesRegex(ValueError,"immediately_previous_signed_release_not_found"):
            selector.choose(stable(),[stable(229,18),stable(229,18)])

    def test_previous_must_be_signed_public_and_complete(self):
        old=stable(229,18)
        old["assets"][0]["name"]="wrong-installer.exe"
        with self.assertRaisesRegex(ValueError,"immediately_previous_signed_release_not_found"):
            selector.choose(stable(),[old])
        with self.assertRaisesRegex(ValueError,"immediately_previous_signed_release_not_found"):
            selector.choose(stable(),[stable(229,18,draft=True)])

    def test_cli_does_not_need_network_credentials(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            (root/"latest.json").write_text(json.dumps(stable()))
            (root/"all.json").write_text(json.dumps([stable(),stable(229,18)]))
            env=root/"env"
            p=subprocess.run([
                sys.executable,str(HERE/"select_published_android_upgrade.py"),
                "--latest",str(root/"latest.json"),
                "--history",str(root/"all.json"),
                "--env",str(env)
            ],capture_output=True,text=True)
            self.assertEqual(p.returncode,0,p.stderr)
            self.assertIn("LATEST_VERSION=0.2.19",env.read_text())
            self.assertIn("PREVIOUS_TAG=v3.0.229-android-v0.2.18",env.read_text())


if __name__ == "__main__":
    unittest.main()
