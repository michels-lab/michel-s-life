import hashlib, json, pathlib, struct, tempfile, unittest, zlib
from granada_android_evidence_gate import validate

def png():
    def chunk(t,b):
        return struct.pack('>I',len(b))+t+b+struct.pack('>I',zlib.crc32(t+b)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',120,120,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b'\x00'+b'\x00'*360))+chunk(b'IEND',b'')

class NativeEvidenceGateTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=pathlib.Path(self.temp.name)
        (self.root/'candidate.apk').write_bytes(b'synthetic test fixture - NOT an installable APK')
        sha=hashlib.sha256((self.root/'candidate.apk').read_bytes()).hexdigest()
        self.doc={'source_sha':'a'*40,'apk_sha256':sha,'device':{'serial':'emulator-5554','api':36,'installed_package':'lab.life'},'stages':{}}
        for i,stage in enumerate(('initial','restart1','restart2')):
            (self.root/f'{stage}.png').write_bytes(png())
            self.doc['stages'][stage]={'apk_sha256':sha,'app_pid':42+i,'boot_id':'same-boot','screenshot':f'{stage}.png','metrics':{'xp':7,'missions':3,'completed':1}}
        self.save()
    def save(self):
        (self.root/'evidence.json').write_text(json.dumps(self.doc))
    def test_synthetic_good(self):
        self.assertEqual(validate(self.root)['result'],'PASS')
    def test_xp_drift(self):
        self.doc['stages']['restart2']['metrics']['xp']=5;self.save()
        with self.assertRaisesRegex(ValueError,'drift'):validate(self.root)
    def test_missing_restart(self):
        del self.doc['stages']['restart2'];self.save()
        with self.assertRaisesRegex(ValueError,'three'):validate(self.root)
    def test_corrupt_png(self):
        p=self.root/'restart1.png';b=bytearray(p.read_bytes());b[20]^=1;p.write_bytes(b)
        with self.assertRaises(ValueError):validate(self.root)
    def test_no_pid(self):
        self.doc['stages']['restart1']['app_pid']=0;self.save()
        with self.assertRaisesRegex(ValueError,'PID'):validate(self.root)
    def test_reused_pid(self):
        self.doc['stages']['restart1']['app_pid']=42;self.save()
        with self.assertRaisesRegex(ValueError,'reused'):validate(self.root)
    def test_wrong_apk(self):
        (self.root/'candidate.apk').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError,'SHA256'):validate(self.root)
    def test_reused_screenshot(self):
        self.doc['stages']['restart1']['screenshot']='initial.png';self.save()
        with self.assertRaisesRegex(ValueError,'repeated'):validate(self.root)
    def test_path_traversal(self):
        self.doc['stages']['restart1']['screenshot']='../secret.png';self.save()
        with self.assertRaisesRegex(ValueError,'path'):validate(self.root)
if __name__=='__main__':
    unittest.main()
