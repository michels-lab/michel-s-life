import copy
import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest
import zipfile
from build_optional_audio_pack import CATALOG, build, main, validate_catalog

SCRIPT = pathlib.Path(__file__).resolve().with_name("build_optional_audio_pack.py")

class OptionalPackTests(unittest.TestCase):
    def setUp(self):
        self.items = json.loads(CATALOG.read_text(encoding="utf-8"))

    def test_catalog_and_publisher_only(self):
        self.assertEqual(len(validate_catalog(self.items)), 8)
        for bad in ("https://evil.example/file.mp3", "https://www.scottbuckley.com.au@evil.example/library/a.mp3"):
            items = copy.deepcopy(self.items)
            items[0]["url"] = bad
            with self.assertRaises(ValueError):
                validate_catalog(items)
        with self.assertRaises(ValueError):
            validate_catalog(self.items + [self.items[0]])

    def test_pack_two_unique_against_pack_one(self):
        other = json.loads(CATALOG.with_name("OPTIONAL_PACK_02.json").read_text(encoding="utf-8"))
        self.assertEqual(len(validate_catalog(other)), 8)
        self.assertFalse({i["id"] for i in self.items} & {i["id"] for i in other})
        self.assertFalse({i["url"] for i in self.items} & {i["url"] for i in other})
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "pack02.zip"
            build(other, path, acquire=lambda url: url.encode(), probe=lambda p: 180, pack="02")
            with zipfile.ZipFile(path) as archive:
                self.assertIn("Optional music pack 02", archive.read("CREDITS.txt").decode())

    def test_complete_pack_and_hashes(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "pack.zip"
            records = build(self.items, path, acquire=lambda url: url.encode(), probe=lambda p: 180.0)
            with zipfile.ZipFile(path) as archive:
                self.assertEqual(len(archive.namelist()), 10)
                self.assertEqual(json.loads(archive.read("MANIFEST.json")), records)
                for item in records:
                    self.assertEqual(hashlib.sha256(archive.read(item["file"])).hexdigest(), item["sha256"])
                self.assertIn("CC BY 4.0", archive.read("CREDITS.txt").decode())

    def test_failed_acquisition_never_overwrites_existing_pack(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "pack.zip"
            path.write_bytes(b"previous")
            def fail(url):
                raise ValueError("network error")
            with self.assertRaises(ValueError):
                build(self.items, path, acquire=fail)
            self.assertEqual(path.read_bytes(), b"previous")
            with self.assertRaises(ValueError):
                build(self.items, path, acquire=lambda url: b"duplicate", probe=lambda p: 180)
            self.assertEqual(path.read_bytes(), b"previous")

    def _write_catalogs(self, directory, pack01, pack02):
        (directory / "OPTIONAL_PACK_01.json").write_text(json.dumps(pack01), encoding="utf-8")
        (directory / "OPTIONAL_PACK_02.json").write_text(json.dumps(pack02), encoding="utf-8")

    def _assert_cli_preflight_rejects(self, pack01, pack02, pack="01", expected_text=None):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = pathlib.Path(tmp)
            self._write_catalogs(tmp_path, pack01, pack02)
            archive_path = tmp_path / "pack.zip"
            archive_path.write_bytes(b"previous")

            def fail_download(url):
                raise AssertionError(f"download must not run during failed preflight: {url}")

            with self.assertRaises(ValueError) as ctx:
                main(
                    ["--catalog-dir", str(tmp_path), "--pack", pack, "--output", str(archive_path)],
                    acquire=fail_download,
                    probe=lambda p: 180.0,
                )
            if expected_text:
                self.assertIn(expected_text, str(ctx.exception))
            self.assertEqual(archive_path.read_bytes(), b"previous")

            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--catalog-dir", str(tmp_path), "--pack", pack, "--output", str(archive_path)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertNotIn("VERIFIED", result.stdout)
            if expected_text:
                self.assertIn(expected_text, result.stderr)
            self.assertEqual(archive_path.read_bytes(), b"previous")

    def test_rejects_case_insensitive_member_collision_and_duplicate_url_in_pack(self):
        colliding = copy.deepcopy(self.items)
        colliding[1]["group"] = colliding[0]["group"]
        colliding[0]["title"] = "Sample Track"
        colliding[1]["title"] = "sample track"
        dup_url = copy.deepcopy(self.items)
        dup_url[1]["url"] = dup_url[0]["url"]
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "pack.zip"
            path.write_bytes(b"previous")

            def fail_download(url):
                raise AssertionError(f"download must not run: {url}")

            for bad_items in (colliding, dup_url):
                with self.assertRaises(ValueError):
                    validate_catalog(bad_items)
                with self.assertRaises(ValueError):
                    build(bad_items, path, acquire=fail_download, probe=lambda p: 180.0)
                self.assertEqual(path.read_bytes(), b"previous")

    def test_cli_preflight_only_passes_for_repo_catalogs(self):
        self.assertEqual(main(["--preflight-only"]), 0)
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--preflight-only"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PREFLIGHT VERIFIED", result.stdout)

    def test_cli_rejects_duplicate_id_across_sibling_catalogs_before_download(self):
        pack01 = copy.deepcopy(self.items)
        pack02 = json.loads(CATALOG.with_name("OPTIONAL_PACK_02.json").read_text(encoding="utf-8"))
        pack02[0]["id"] = pack01[0]["id"]
        self._assert_cli_preflight_rejects(pack01, pack02, pack="01", expected_text="Duplicate track ID across catalogs")

    def test_cli_rejects_duplicate_url_across_sibling_catalogs_before_download(self):
        pack01 = copy.deepcopy(self.items)
        pack02 = json.loads(CATALOG.with_name("OPTIONAL_PACK_02.json").read_text(encoding="utf-8"))
        pack02[0]["url"] = pack01[0]["url"]
        self._assert_cli_preflight_rejects(pack01, pack02, pack="01", expected_text="Duplicate recording URL across catalogs")

    def test_cli_rejects_case_insensitive_member_collision_before_download(self):
        pack01 = copy.deepcopy(self.items)
        pack02 = json.loads(CATALOG.with_name("OPTIONAL_PACK_02.json").read_text(encoding="utf-8"))
        pack01[1]["group"] = pack01[0]["group"]
        pack01[0]["title"] = "Sample Track"
        pack01[1]["title"] = "sample track"
        self._assert_cli_preflight_rejects(pack01, pack02, pack="01", expected_text="archive member collision")

        clean01 = copy.deepcopy(self.items)
        pack02[1]["group"] = pack02[0]["group"]
        pack02[0]["title"] = "Other Track"
        pack02[1]["title"] = "other track"
        self._assert_cli_preflight_rejects(clean01, pack02, pack="01", expected_text="archive member collision")

    def test_cli_builds_pack_when_preflight_passes(self):
        pack01 = copy.deepcopy(self.items)
        pack02 = json.loads(CATALOG.with_name("OPTIONAL_PACK_02.json").read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = pathlib.Path(tmp)
            self._write_catalogs(tmp_path, pack01, pack02)
            archive_path = tmp_path / "pack02.zip"
            rc = main(
                ["--catalog-dir", str(tmp_path), "--pack", "02", "--output", str(archive_path)],
                acquire=lambda url: url.encode(),
                probe=lambda p: 180.0,
            )
            self.assertEqual(rc, 0)
            with zipfile.ZipFile(archive_path) as archive:
                self.assertIn("Optional music pack 02", archive.read("CREDITS.txt").decode())

if __name__ == "__main__":
    unittest.main()
