import hashlib
import json
import pathlib
import struct
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
        (self.root/"package-info.txt").write_text("versionName=0.2.9\n")
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
        (self.root/"package-info.txt").write_text("versionName=0.2.8\n")
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
    def test_missing_apk(self):
        self.apk.unlink()
        with self.assertRaisesRegex(ValueError,"APK"):self.check()
if __name__ == "__main__":
    unittest.main()
