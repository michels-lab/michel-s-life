"""Offline regression tests for the real AppBundle bootstrap downloader."""
import io
import json
import tempfile
import unittest
import urllib.error
import zipfile
from pathlib import Path
from unittest.mock import patch

import download_latest_michels_life_bundle as bundle


def valid_archive():
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_STORED) as archive:
        archive.writestr("index.html", "M" * 1600)
    return output.getvalue()


def gateway_timeout():
    return urllib.error.HTTPError(
        "https://example.test/AppBundle.zip", 504, "Gateway Timeout", {}, None
    )


class BootstrapRecoveryTests(unittest.TestCase):
    @patch.object(bundle.time, "sleep")
    @patch.object(bundle.urllib.request, "urlopen")
    def test_asset_504_then_success(self, get, sleep):
        archive = valid_archive()
        get.side_effect = [gateway_timeout(), io.BytesIO(archive)]
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "AppBundle.zip"
            bundle.download("https://example.test/AppBundle.zip", output)
            self.assertEqual(output.read_bytes(), archive)
            self.assertFalse((Path(tmp) / "AppBundle.zip.part").exists())
        self.assertEqual(get.call_count, 2)
        sleep.assert_called_once_with(1)

    @patch.object(bundle.time, "sleep")
    @patch.object(bundle.urllib.request, "urlopen")
    def test_invalid_zip_is_not_promoted_and_is_retried(self, get, sleep):
        archive = valid_archive()
        get.side_effect = [io.BytesIO(b"<html>Bad gateway</html>" * 100),
                           io.BytesIO(archive)]
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "AppBundle.zip"
            bundle.download("https://example.test/AppBundle.zip", output)
            self.assertEqual(output.read_bytes(), archive)
            self.assertFalse(output.with_name(output.name + ".part").exists())
        self.assertEqual(get.call_count, 2)
        self.assertEqual(sleep.call_count, 1)

    @patch.object(bundle.time, "sleep")
    @patch.object(bundle.urllib.request, "urlopen")
    def test_permanent_404_fails_fast(self, get, sleep):
        get.side_effect = urllib.error.HTTPError(
            "https://example.test/AppBundle.zip", 404, "Not Found", {}, None
        )
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "AppBundle.zip"
            with self.assertRaises(urllib.error.HTTPError):
                bundle.download("https://example.test/AppBundle.zip", output)
            self.assertFalse(output.exists())
            self.assertFalse(output.with_name(output.name + ".part").exists())
        self.assertEqual(get.call_count, 1)
        sleep.assert_not_called()

    @patch.object(bundle.time, "sleep")
    @patch.object(bundle.urllib.request, "urlopen")
    def test_exhaustion_keeps_prior_valid_bundle(self, get, sleep):
        get.side_effect = [gateway_timeout() for _ in range(bundle.MAX_ATTEMPTS)]
        archive = valid_archive()
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "AppBundle.zip"
            output.write_bytes(archive)
            with self.assertRaises(urllib.error.HTTPError):
                bundle.download("https://example.test/AppBundle.zip", output)
            self.assertEqual(output.read_bytes(), archive)
            self.assertFalse(output.with_name(output.name + ".part").exists())
        self.assertEqual(get.call_count, bundle.MAX_ATTEMPTS)
        self.assertEqual(sleep.call_count, bundle.MAX_ATTEMPTS - 1)

    @patch.object(bundle.time, "sleep")
    @patch.object(bundle.urllib.request, "urlopen")
    def test_release_listing_504_then_stable_selected(self, get, sleep):
        releases = [
            {"tag_name": "louderme-v9.0.0", "assets": [
                {"name": "AppBundle.zip", "browser_download_url": "https://wrong"}]},
            {"tag_name": "v3.0.222", "prerelease": True, "assets": [
                {"name": "AppBundle.zip", "browser_download_url": "https://pre"}]},
            {"tag_name": "v3.0.221", "assets": [
                {"name": "AppBundle.zip",
                 "browser_download_url": "https://example.test/AppBundle.zip"}]},
        ]
        get.side_effect = [gateway_timeout(), io.BytesIO(json.dumps(releases).encode())]
        self.assertEqual(
            bundle.resolve("michels-lab/michel-s-life-releases"),
            ("v3.0.221", "https://example.test/AppBundle.zip"),
        )
        self.assertEqual(get.call_count, 2)
        sleep.assert_called_once_with(1)


if __name__ == "__main__":
    unittest.main()
