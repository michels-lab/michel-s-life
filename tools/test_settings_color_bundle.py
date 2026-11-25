"""Offline contract for the actual Windows AppBundle and native Android assets.
A browser-only injection is not sufficient: the shipped ZIP/APK must contain
the shared Settings module referenced by the canonical index.
"""
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "src/MichelsLife/frontend"
SHARED = (
    "focus-immersive.js",
    "personal-alarms.js",
    "motivation-immersive.js",
    "settings-color-floating-preview.js",
)
LOADER = '<script defer src="settings-color-floating-preview.js"></script>'


class SettingsBundleTests(unittest.TestCase):
    def fixture(self, directory, *, include_loader=True):
        directory = Path(directory)
        source = directory / "frontend"
        source.mkdir()
        for filename in SHARED:
            shutil.copy2(FRONTEND / filename, source / filename)
        # Use the genuine versioned recording resources, not fake empty MP3s.
        shutil.copytree(FRONTEND / "assets/audio/classical", source / "assets/audio/classical")
        markup = (
            '<!doctype html><html><head><meta charset="UTF-8" /></head>'
            '<body><h1>Michel Life</h1>'
            + (LOADER if include_loader else "")
            + '</body></html>'
        )
        index = source / "index.html"
        index.write_text(markup, encoding="utf-8")
        bundle = directory / "AppBundle.zip"
        with zipfile.ZipFile(bundle, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("index.html", "<html>stale preview, old release</html>")
            z.writestr("settings-color-floating-preview.js", "old dead script")
            for n in range(204):
                z.writestr("assets/sky%03d.jpg" % n, b"\xff\xd8\xff\xd9")
        return bundle, index

    def build(self, bundle, index):
        return subprocess.run(
            [sys.executable, str(ROOT / "tools/replace_bundle_index.py"),
             "--bundle", str(bundle), "--index", str(index)],
            cwd=ROOT, text=True, capture_output=True
        )

    def test_windows_bundle_replaces_stale_settings_script_once(self):
        with tempfile.TemporaryDirectory() as d:
            bundle, index = self.fixture(d)
            for _ in range(2):
                result = self.build(bundle, index)
                self.assertEqual(result.returncode, 0, result.stderr+result.stdout)
            with zipfile.ZipFile(bundle) as z:
                names = z.namelist()
                self.assertEqual(names.count("settings-color-floating-preview.js"), 1)
                self.assertEqual(
                    z.read("settings-color-floating-preview.js"),
                    (FRONTEND / "settings-color-floating-preview.js").read_bytes()
                )
                self.assertIn(LOADER.encode(), z.read("index.html"))
                self.assertEqual(sum(name.endswith(".jpg") for name in names), 204)
                for name in sorted(p.name for p in (FRONTEND / 'assets/audio/classical').iterdir() if p.suffix in ('.mp3','.json')):
                    path = "assets/audio/classical/" + name
                    self.assertEqual(names.count(path), 1)
                    self.assertEqual(z.read(path), (FRONTEND / path).read_bytes())
                self.assertIsNone(z.testzip())

    def test_android_assets_ship_same_live_source_and_loader(self):
        with tempfile.TemporaryDirectory() as d:
            bundle, index = self.fixture(d)
            self.assertEqual(self.build(bundle, index).returncode, 0)
            assets = Path(d) / "android"
            result = subprocess.run(
                [sys.executable, str(ROOT / "android/tools/prepare_bundle.py"),
                 "--bundle", str(bundle), "--assets", str(assets)],
                cwd=ROOT, text=True, capture_output=True
            )
            self.assertEqual(result.returncode, 0, result.stderr+result.stdout)
            self.assertEqual(
                (assets / "settings-color-floating-preview.js").read_bytes(),
                (FRONTEND / "settings-color-floating-preview.js").read_bytes()
            )
            for name in sorted(p.name for p in (FRONTEND / 'assets/audio/classical').iterdir() if p.suffix in ('.mp3','.json')):
                path = "assets/audio/classical/" + name
                self.assertEqual((assets / path).read_bytes(), (FRONTEND / path).read_bytes())
            android_html=(assets / "index.html").read_text(encoding="utf-8")
            self.assertIn(LOADER, android_html)
            self.assertIn('data-mlv-android-bridge="v1"', android_html)

    def test_missing_loader_fails_closed_instead_of_shipping_invisible_preview(self):
        with tempfile.TemporaryDirectory() as d:
            bundle, index = self.fixture(d,include_loader=False)
            original = bundle.read_bytes()
            result = self.build(bundle, index)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("refusing invisible release", result.stderr+result.stdout)
            self.assertEqual(bundle.read_bytes(),original,"old bundle remains unchanged")

    def test_mandatory_shared_source_is_checked_before_bundle_rewrite(self):
        with tempfile.TemporaryDirectory() as d:
            bundle, index = self.fixture(d)
            (index.parent / "settings-color-floating-preview.js").unlink()
            result = self.build(bundle, index)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("shared Focus or Settings source missing",result.stderr+result.stdout)


if __name__ == "__main__":
    unittest.main()
