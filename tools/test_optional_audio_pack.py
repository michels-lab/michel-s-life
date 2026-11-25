import copy
import hashlib
import json
import pathlib
import tempfile
import unittest
import zipfile
from build_optional_audio_pack import CATALOG, build, validate_catalog

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

if __name__ == "__main__":
    unittest.main()
