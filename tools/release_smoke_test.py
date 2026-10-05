#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
def read(path): return path.read_text(encoding='utf-8',errors='replace')

subprocess.run([sys.executable,str(ROOT/'tools/materialize_host_source.py')],check=True)

PROGRAM=ROOT/'src/MichelsLife/Program.cs'
GOOGLE=ROOT/'src/MichelsLife/GoogleCalendarService.cs'
SECRETS=ROOT/'src/MichelsLife/BuildSecrets.cs'
DESKTOP_SHELL=ROOT/'src/MichelsLife/DesktopShell.cs'
FRONTEND=ROOT/'src/MichelsLife/frontend/index.html'
LOGO=ROOT/'branding/michels_life_logo.webp'
AVATAR=ROOT/'branding/michel_duarte_avatar.jpg'
PROFILE=ROOT/'branding/developer-profile.json'
LICENSE=ROOT/'LICENSE.txt'
WORKFLOWS=[
    ROOT/'.github/workflows/build-test-windows.yml',
    ROOT/'.github/workflows/release-windows.yml',
    ROOT/'.github/workflows/build-store-msix.yml',
]
for p in (PROGRAM,GOOGLE,SECRETS,DESKTOP_SHELL,FRONTEND,LOGO,AVATAR,PROFILE,LICENSE,*WORKFLOWS):
    assert p.exists(),f'missing {p}'

program=read(PROGRAM)
assert 'CurrentAppVersion = new("3.0.215")' in program
for stale in ('3.0.202','3.0.203','3.0.204','3.0.205','3.0.206','3.0.207','3.0.208','3.0.209','3.0.210','3.0.211','3.0.212','3.0.213','3.0.214'):
    assert stale not in program, f'stale host version remains: {stale}'
for marker in ('ComputeEmbeddedBundleFingerprint','SHA256.Create()','string.Equals(marker, bundleFingerprint','File.WriteAllText(markerPath, bundleFingerprint)'):
    assert marker in program, f'missing runtime cache protection: {marker}'
assert 'DesktopShell.Attach(this, _webView);' in program, 'desktop shell is not attached to the Windows host'
desktop_shell=read(DESKTOP_SHELL)
for marker in ('NotifyIcon','RegisterHotKey','CloseReason.UserClosing','MLV216QuickCapture','Quick Capture','Exit'):
    assert marker in desktop_shell, f'missing desktop shell behavior: {marker}'
assert '__BUILD_SECRET_GOOGLE__' in read(SECRETS)
assert 'NormalizeGoogleClientSecret' in read(SECRETS)
assert 'JsonDocument.Parse' in read(SECRETS)

profile=json.loads(read(PROFILE))
for key,value in {
    'studio':'Michel’s Lab',
    'developer':'Michel Duarte',
    'email':'realmichelduarte@gmail.com',
    'copyright':'© 2026 Michel Duarte / Michel’s Lab. All rights reserved.',
}.items():
    assert profile.get(key)==value, f'bad developer profile: {key}'

subprocess.run([sys.executable,str(ROOT/'tools/bump_frontend_version.py'),'--index',str(FRONTEND)],check=True)
subprocess.run([sys.executable,str(ROOT/'tools/enable_i18n.py'),'--index',str(FRONTEND)],check=True)
frontend=read(FRONTEND)
for marker in (
    "const VERSION='3.0.215'",
    "assets/michels_life_logo.webp",
    "assets/michel_duarte_avatar.jpg",
    "['typography','Aa','Typography'",
    "midnights:{name:'Midnights'",
    "ocean_blvd:{name:'Did You Know That There’s a Tunnel Under Ocean Blvd'",
    "--mlv-ui-font:Inter",
    "function focusPane()",
    "Focus & Timers settings",
    "michelsLife.typography.v303",
    "<script data-mlv-language-guard=\"v1\">",
    "<script src=\"i18n.js\" data-mlv-i18n=\"v1\"></script>",
    "MLV216QuickCapture",
    "automaticUpdateCheck",
    "AUTO_UPDATE_INTERVAL_MS=6*60*60*1000",
):
    assert marker in frontend, f'missing canonical frontend source: {marker}'
for forbidden in ('data:image/png;base64,','data:image/jpeg;base64,',"artist:'Taylor Swift'","artist:'Lana Del Rey'","data-mlv-font-artist="):
    assert forbidden not in frontend, f'non-canonical frontend content remains: {forbidden}'
for stale in ('3.0.202','3.0.203','3.0.204','3.0.205','3.0.206','3.0.207','3.0.208','3.0.209','3.0.210','3.0.211','3.0.212','3.0.213'):
    assert stale not in frontend, f'stale frontend version remains: {stale}'

workflow_text='\n'.join(read(p) for p in WORKFLOWS)
for forbidden in ('build_frontend_v30202.py','AppPatches/v3.0.202.html','branding/michels_life_mark.svg'):
    assert forbidden not in workflow_text, f'legacy frontend build dependency remains: {forbidden}'
for required in ('src/MichelsLife/frontend/index.html','branding/michels_life_logo.webp','assets/michels_life_logo.webp'):
    assert required in workflow_text, f'canonical build dependency missing: {required}'

security='\n'.join(read(p) for p in (PROGRAM,GOOGLE,SECRETS,FRONTEND,PROFILE,LICENSE))
for forbidden in ('GOCSPX-','github_pat_','ghp_','client_secret_794181'):
    assert forbidden.lower() not in security.lower(), f'committed secret-like value: {forbidden}'

print('OK: v3.0.215 host + desktop shell + Quick Capture + automatic updates + bilingual canonical frontend + branding + clean build pipeline')
