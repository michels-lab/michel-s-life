#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, tempfile, sys, re
ROOT=Path(__file__).resolve().parents[1]
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

all_source='\n'.join(p.read_text(encoding='utf-8') for p in (PROGRAM,GOOGLE,SECRETS,OVERLAY,BUILDER,PROFILE,LICENSE))
assert 'CurrentAppVersion = new("3.0.202")' in PROGRAM.read_text(encoding='utf-8')
assert '__BUILD_SECRET_GOOGLE__' in SECRETS.read_text(encoding='utf-8')
for forbidden in ('GOCSPX-','github_pat_','ghp_','client_secret_794181','micheltheog','Instagram mission recovery','Restore Instagram missions'):
    assert forbidden.lower() not in all_source.lower(), f'forbidden committed content: {forbidden}'

profile=json.loads(PROFILE.read_text(encoding='utf-8'))
for key,value in {
    'studio':'Michel’s Lab',
    'developer':'Michel Duarte',
    'email':'realmichelduarte@gmail.com',
}.items():
    assert profile.get(key)==value, f'bad developer profile value: {key}'
for required in (
    'instagram.com/realmichelduarte',
    'facebook.com/realmichelduarte',
    'linkedin.com/in/realmichelduart',
    'github.com/realmichelduarte',
):
    assert required in json.dumps(profile), f'missing developer profile URL: {required}'

builder=BUILDER.read_text(encoding='utf-8')
for required in (
    "panes.about.insertAdjacentHTML('beforeend',aboutPane())",
    'assets/michels_life_mark.svg',
    'const activeNotifications=new Map();',
    '© 2026 Michel Duarte / Michel’s Lab. All rights reserved.',
):
    assert required in builder, f'missing root frontend behavior: {required}'
for forbidden in ('append_overlay.py --index','mlv-v30202-ui-hotfix-script'):
    assert forbidden not in builder, f'root builder contains obsolete overlay behavior: {forbidden}'

subprocess.run([sys.executable,'-m','py_compile',str(BUILDER)],check=True)

html=OVERLAY.read_text(encoding='utf-8')
scripts=re.findall(r'<script[^>]*>(.*?)</script>',html,flags=re.S|re.I)
with tempfile.TemporaryDirectory() as td:
    for i,code in enumerate(scripts):
        f=Path(td)/f'release_overlay_{i}.js';f.write_text(code,encoding='utf-8')
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:
            print(r.stdout);print(r.stderr,file=sys.stderr);raise SystemExit(f'release overlay JS syntax failed: {i}')
print(f'OK: host secret scan + root frontend builder + {len(scripts)} release-readiness script(s)')
