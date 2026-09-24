#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
def read(path): return path.read_text(encoding='utf-8',errors='replace')

subprocess.run([sys.executable,str(ROOT/'tools/materialize_host_source.py')],check=True)

PROGRAM=ROOT/'src/MichelsLife/Program.cs'
GOOGLE=ROOT/'src/MichelsLife/GoogleCalendarService.cs'
SECRETS=ROOT/'src/MichelsLife/BuildSecrets.cs'
FRONTEND=ROOT/'src/MichelsLife/frontend/index.html'
LOGO=ROOT/'branding/michels_life_logo.svg'
AVATAR=ROOT/'branding/michel_duarte_avatar.jpg'
PROFILE=ROOT/'branding/developer-profile.json'
LICENSE=ROOT/'LICENSE.txt'
WORKFLOWS=[
    ROOT/'.github/workflows/build-test-windows.yml',
    ROOT/'.github/workflows/release-windows.yml',
    ROOT/'.github/workflows/build-store-msix.yml',
]
for p in (PROGRAM,GOOGLE,SECRETS,FRONTEND,LOGO,AVATAR,PROFILE,LICENSE,*WORKFLOWS):
    assert p.exists(),f'missing {p}'

program=read(PROGRAM)
assert 'CurrentAppVersion = new("3.0.207")' in program
for marker in ('ComputeEmbeddedBundleFingerprint','SHA256.Create()','string.Equals(marker, bundleFingerprint','File.WriteAllText(markerPath, bundleFingerprint)'):
    assert marker in program, f'missing runtime cache protection: {marker}'
assert '__BUILD_SECRET_GOOGLE__' in read(SECRETS)

profile=json.loads(read(PROFILE))
for key,value in {
    'studio':'Michel’s Lab',
    'developer':'Michel Duarte',
    'email':'realmichelduarte@gmail.com',
    'copyright':'© 2026 Michel Duarte / Michel’s Lab. All rights reserved.',
}.items():
    assert profile.get(key)==value, f'bad developer profile: {key}'

frontend=read(FRONTEND)
for marker in (
    "const VERSION='3.0.207'",
    "assets/michels_life_logo.svg",
    "assets/michel_duarte_avatar.jpg",
    "['typography','Aa','Typography'",
    "midnights:{name:'Midnights'",
    "michelsLife.typography.v303",
):
    assert marker in frontend, f'missing canonical frontend source: {marker}'
for forbidden in ('data:image/png;base64,','data:image/jpeg;base64,'):
    assert forbidden not in frontend, f'embedded UI asset remains: {forbidden}'

workflow_text='\n'.join(read(p) for p in WORKFLOWS)
for forbidden in ('build_frontend_v30202.py','AppPatches/v3.0.202.html','branding/michels_life_mark.svg'):
    assert forbidden not in workflow_text, f'legacy frontend build dependency remains: {forbidden}'
for required in ('src/MichelsLife/frontend/index.html','branding/michels_life_logo.svg','assets/michels_life_logo.svg'):
    assert required in workflow_text, f'canonical build dependency missing: {required}'

security='\n'.join(read(p) for p in (PROGRAM,GOOGLE,SECRETS,FRONTEND,PROFILE,LICENSE))
for forbidden in ('GOCSPX-','github_pat_','ghp_','client_secret_794181'):
    assert forbidden.lower() not in security.lower(), f'committed secret-like value: {forbidden}'

print('OK: v3.0.207 host + canonical frontend + branding + clean build pipeline')
