#!/usr/bin/env python3
"""Fail-closed, offline validator for synthetic/aggregate Android evidence."""
import hashlib, json, pathlib, struct, sys, zlib
STAGES = ('initial', 'restart1', 'restart2')
METRICS = ('xp', 'missions', 'completed')

def verify_png(path):
    data = path.read_bytes()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('invalid PNG signature')
    pos = 8
    found = set()
    while pos < len(data):
        if pos + 12 > len(data):
            raise ValueError('truncated PNG chunk')
        size = struct.unpack('>I', data[pos:pos+4])[0]
        if size > 40000000 or pos + 12 + size > len(data):
            raise ValueError('invalid PNG chunk length')
        kind = data[pos+4:pos+8]
        payload = data[pos+8:pos+8+size]
        crc = struct.unpack('>I', data[pos+8+size:pos+12+size])[0]
        if zlib.crc32(kind + payload) & 0xffffffff != crc:
            raise ValueError('corrupt PNG CRC')
        if kind == b'IHDR':
            if kind in found or size != 13:
                raise ValueError('invalid IHDR')
            w, h = struct.unpack('>II', payload[:8])
            if not 100 <= w <= 10000 or not 100 <= h <= 10000:
                raise ValueError('implausible PNG dimensions')
        if kind == b'IEND':
            if size or pos + size + 12 != len(data):
                raise ValueError('invalid PNG ending')
        found.add(kind)
        pos += size + 12
    if not {b'IHDR', b'IDAT', b'IEND'} <= found:
        raise ValueError('incomplete PNG')

def validate(root):
    manifest = json.loads((root / 'evidence.json').read_text(encoding='utf-8'))
    if set(manifest) != {'source_sha','apk_sha256','device','stages'}:
        raise ValueError('unexpected manifest fields')
    sha, apk_sha = manifest['source_sha'], manifest['apk_sha256']
    for value, length in ((sha,40),(apk_sha,64)):
        if not isinstance(value,str) or len(value)!=length or any(c not in '0123456789abcdef' for c in value):
            raise ValueError('invalid SHA')
    apk = root / 'candidate.apk'
    if not apk.is_file() or hashlib.sha256(apk.read_bytes()).hexdigest() != apk_sha:
        raise ValueError('APK SHA256 mismatch or missing APK')
    device = manifest['device']
    if not isinstance(device,dict) or set(device) != {'serial','api','installed_package'} or not all(device.values()):
        raise ValueError('device/package provenance missing')
    stages = manifest['stages']
    if not isinstance(stages,dict) or set(stages) != set(STAGES):
        raise ValueError('exactly three stages required')
    seen_pids, seen_screenshots, first = set(), set(), None
    for stage in STAGES:
        row=stages[stage]
        if not isinstance(row,dict) or set(row) != {'apk_sha256','app_pid','boot_id','screenshot','metrics'}:
            raise ValueError(stage+': incomplete evidence')
        pid=row['app_pid']
        if row['apk_sha256'] != apk_sha or type(pid) is not int or pid <= 0:
            raise ValueError(stage+': APK or app PID mismatch')
        if pid in seen_pids:
            raise ValueError(stage+': cold relaunch PID reused')
        seen_pids.add(pid)
        if not isinstance(row['boot_id'],str) or not row['boot_id'].strip():
            raise ValueError(stage+': missing boot identity')
        name=row['screenshot']
        if not isinstance(name,str) or not name.endswith('.png') or pathlib.PurePath(name).name != name:
            raise ValueError(stage+': invalid screenshot path')
        if name in seen_screenshots:
            raise ValueError(stage+': repeated screenshot')
        seen_screenshots.add(name)
        verify_png(root / name)
        metrics=row['metrics']
        if not isinstance(metrics,dict) or set(metrics) != set(METRICS) or any(type(v) is not int or v < 0 for v in metrics.values()):
            raise ValueError(stage+': invalid metrics')
        if first is None:
            first=metrics
        elif first != metrics:
            raise ValueError(stage+': canonical progress drift')
    return {'result':'PASS','source_sha':sha,'stages_verified':3,'metrics_verified':3,
            'limitations':'supplied native evidence only; no Galaxy or live-account certification'}

if __name__=='__main__':
    try:
        if len(sys.argv)!=2:
            raise ValueError('Usage: python granada_android_evidence_gate.py BUNDLE_DIR')
        print(json.dumps(validate(pathlib.Path(sys.argv[1]).resolve()),sort_keys=True))
    except (ValueError,TypeError,KeyError,OSError,json.JSONDecodeError) as exc:
        print(json.dumps({'result':'FAIL','reason':str(exc)}),file=sys.stderr)
        sys.exit(1)
