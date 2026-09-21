#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, tempfile, sys, re
ROOT=Path(__file__).resolve().parents[1]

def read_text_safe(path):
    return path.read_text(encoding='utf-8', errors='replace')
subprocess.run([sys.executable,str(ROOT/'tools/materialize_host_source.py')],check=True)
PROGRAM=ROOT/'src/MichelsLife/Program.cs'
GOOGLE=ROOT/'src/MichelsLife/GoogleCalendarService.cs'
SECRETS=ROOT/'src/MichelsLife/BuildSecrets.cs'
OVERLAY=ROOT/'src/MichelsLife/AppPatches/v3.0.202.html'
BUILDER=ROOT/'tools/build_frontend_v30202.py'
PROFILE=ROOT/'branding/developer-profile.json'
LICENSE=ROOT/'LICENSE.txt'
for p in (PROGRAM,GOOGLE,SECRETS,OVERLAY,BUILDER,PROFILE,LICENSE):
    assert p.exists(),f'missing {p}'

security_source='\n'.join(read_text_safe(p) for p in (PROGRAM,GOOGLE,SECRETS,OVERLAY,BUILDER,PROFILE,LICENSE))
for forbidden in ('GOCSPX-','github_pat_','ghp_','client_secret_794181'):
    assert forbidden.lower() not in security_source.lower(), f'forbidden committed secret content: {forbidden}'
product_source='\n'.join(read_text_safe(p) for p in (PROGRAM,GOOGLE,SECRETS,OVERLAY,PROFILE,LICENSE))
for forbidden in ('micheltheog','Instagram mission recovery','Restore Instagram missions'):
    assert forbidden.lower() not in product_source.lower(), f'forbidden product content: {forbidden}'

program=read_text_safe(PROGRAM)
assert 'CurrentAppVersion = new("3.0.202")' in program
assert 'ComputeEmbeddedBundleFingerprint' in program
assert 'SHA256.Create()' in program
assert 'string.Equals(marker, bundleFingerprint' in program
assert 'File.WriteAllText(markerPath, bundleFingerprint)' in program
assert '__BUILD_SECRET_GOOGLE__' in read_text_safe(SECRETS)

profile=json.loads(read_text_safe(PROFILE))
for key,value in {
    'studio':'Michel’s Lab',
    'developer':'Michel Duarte',
    'email':'realmichelduarte@gmail.com',
    'copyright':'© 2026 Michel Duarte / Michel’s Lab. All rights reserved.',
}.items():
    assert profile.get(key)==value, f'bad developer profile value: {key}'
for required in (
    'instagram.com/realmichelduarte',
    'facebook.com/realmichelduarte',
    'linkedin.com/in/realmichelduart',
    'github.com/realmichelduarte',
):
    assert required in json.dumps(profile), f'missing developer profile URL: {required}'

builder=read_text_safe(BUILDER)
for required in (
    "panes.about.insertAdjacentHTML('beforeend',aboutPane())",
    'data:image/png;base64,',
    'data:image/jpeg;base64,',
    'window.__mlvToastSession',
    'ChapterScenesV30170?.select?.(scene.dataset.v30170Scene)',
):
    assert required in builder, f'missing root frontend behavior: {required}'
assert 'append_overlay.py --index' not in builder, 'root builder must not invoke runtime overlay appenders'
assert "panes.chapters&&!panes.chapters.querySelector('[data-mlv-chapter-core]')" not in builder, 'About/branding changes must not alter Chapter pane mounting'
assert 'const activeNotifications=new Map();' not in builder, 'Cloud notifications must use the root toast system'

subprocess.run([sys.executable,'-m','py_compile',str(BUILDER)],check=True)

html=read_text_safe(OVERLAY)
scripts=re.findall(r'<script[^>]*>(.*?)</script>',html,flags=re.S|re.I)
with tempfile.TemporaryDirectory() as td:
    for i,code in enumerate(scripts):
        f=Path(td)/f'release_overlay_{i}.js';f.write_text(code,encoding='utf-8')
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:
            print(r.stdout);print(r.stderr,file=sys.stderr);raise SystemExit(f'release overlay JS syntax failed: {i}')
print(f'OK: host secret scan + root frontend builder + {len(scripts)} release-readiness script(s)')
