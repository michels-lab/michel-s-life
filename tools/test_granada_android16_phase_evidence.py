import os
import struct
import tempfile
import unittest
import zlib
from pathlib import Path

from tools.granada_android16_phase_evidence import PHASES, png_info, report

SHA="a"*40


def chunk(kind, data):
    return (struct.pack(">I", len(data)) + kind + data +
            struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff))


def valid_png(width=360, height=640):
    ihdr=struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    # A real decodable test PNG rather than only the magic bytes.
    raster=(b"\0"+b"\0"*(width*4))*height
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) +
            chunk(b"IDAT", zlib.compress(raster)) + chunk(b"IEND", b""))


class PhaseEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name)
        self.seed()

    def seed(self):
        blob=valid_png()
        for stage in PHASES:
            for n in range(1, 9):
                (self.path / f"{stage}-{n}.png").write_bytes(blob)
        (self.path / "phases-complete.txt").write_text("complete\n")

    def test_real_crc_png_signature_and_dimensions(self):
        x=png_info(self.path/"baseline-1.png")
        self.assertEqual((x["width"],x["height"]), (360,640))
        self.assertEqual(len(x["sha256"]),64)

    def test_full_24_frame_contract_passes_without_claiming_release_or_data(self):
        data=report(self.path,SHA)
        self.assertEqual(data["native_frame_count"],24)
        self.assertEqual(data["status"],"PASS")
        self.assertEqual(len(data["evidence"]),3)
        self.assertFalse(data["physical_galaxy_verified"])
        self.assertFalse(data["canonical_account_persistence_verified"])
        self.assertFalse(data["signed_release_created"])

    def test_every_stage_has_eight_required_images(self):
        for stage in PHASES:
            with self.subTest(stage=stage):
                p=self.path/f"{stage}-8.png"
                p.unlink()
                with self.assertRaisesRegex(ValueError,"missing_real_native_frame"):
                    report(self.path,SHA)
                p.write_bytes(valid_png())

    def test_rejects_truncated_png(self):
        p=self.path/"launched-4.png"
        p.write_bytes(valid_png()[:-9])
        with self.assertRaisesRegex(ValueError,"truncated_native_png|native_png_missing_end"):
            report(self.path,SHA)

    def test_rejects_crc_corruption(self):
        p=self.path/"installed-idle-2.png"
        blob=bytearray(valid_png())
        blob[24]^=0x1
        p.write_bytes(blob)
        with self.assertRaisesRegex(ValueError,"native_png_crc_mismatch"):
            report(self.path,SHA)

    def test_rejects_fake_png_magic(self):
        p=self.path/"baseline-2.png"
        p.write_bytes(b"\x89PNG\r\n\x1a\n" + b"0"*250)
        with self.assertRaises(ValueError):
            report(self.path,SHA)

    def test_rejects_blank_phase_marker_and_failed_stage(self):
        marker=self.path/"phases-complete.txt"
        marker.write_text("not verified")
        with self.assertRaisesRegex(ValueError,"phase_incomplete_or_failed"):
            report(self.path,SHA)
        marker.write_text("complete")
        (self.path/"failed-stage.txt").write_text("launched")
        with self.assertRaisesRegex(ValueError,"phase_incomplete_or_failed"):
            report(self.path,SHA)

    def test_never_accepts_wrong_source_commit(self):
        for bad in ("", "a"*39, "z"*40, SHA+"x"):
            with self.subTest(bad=bad):
                with self.assertRaisesRegex(ValueError,"invalid_exact_source_sha"):
                    report(self.path,bad)

    def test_extra_native_frame_rejected(self):
        (self.path/"launched-9.png").write_bytes(valid_png())
        with self.assertRaisesRegex(ValueError,"unknown_extra_native_frame"):
            report(self.path,SHA)

    def test_symlinked_evidence_rejected(self):
        p=self.path/"installed-idle-1.png"
        p.unlink()
        p.symlink_to(self.path/"baseline-1.png")
        with self.assertRaisesRegex(ValueError,"missing_real_native_frame"):
            report(self.path,SHA)

    def test_enforces_actual_resolution(self):
        (self.path/"baseline-1.png").write_bytes(valid_png(width=128,height=128))
        with self.assertRaisesRegex(ValueError,"unexpected_native_screen_resolution"):
            report(self.path,SHA)


if __name__=="__main__":
    unittest.main()
