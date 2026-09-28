#!/usr/bin/env python3
from pathlib import Path
import base64,gzip

ROOT=Path(__file__).resolve().parents[1]/'src'/'MichelsLife'
APP_VERSION='3.0.209'
LEGACY_APP_VERSIONS=('3.0.202','3.0.203','3.0.204','3.0.205','3.0.206','3.0.207','3.0.208')
GOOGLE_CLIENT_ID='256320502181-fvfuhkbijecscl1p3g41f8n28cr2541i.apps.googleusercontent.com'
LEGACY_GOOGLE_CLIENT_IDS=(
    '794181282949-v3ufh901g9rlec673qd0kho1karaqacj.apps.googleusercontent.com',
)

for name in ('Program.cs','GoogleCalendarService.cs'):
    packed=ROOT/(name+'.gz.b64')
    if not packed.exists():
        raise SystemExit(f'missing {packed}')
    data=gzip.decompress(base64.b64decode(packed.read_text().strip()))
    text=data.decode('utf-8')
    for old_version in LEGACY_APP_VERSIONS:
        text=text.replace(old_version,APP_VERSION)
    if name=='GoogleCalendarService.cs':
        for old_client_id in LEGACY_GOOGLE_CLIENT_IDS:
            text=text.replace(old_client_id,GOOGLE_CLIENT_ID)
        if GOOGLE_CLIENT_ID not in text:
            raise SystemExit('GoogleCalendarService.cs does not contain the approved Google Desktop OAuth client id')
    stale=[v for v in LEGACY_APP_VERSIONS if v in text]
    if stale:
        raise SystemExit(f'{name} still contains stale app version markers: {stale}')
    if name=='Program.cs' and f'CurrentAppVersion = new("{APP_VERSION}")' not in text:
        raise SystemExit(f'Program.cs missing CurrentAppVersion {APP_VERSION}')
    if name=='Program.cs':
        lines=text.splitlines()
        needles=('WebView2','CoreWebView2','EnsureCoreWebView2','Navigate','Source =')
        hits=[i for i,line in enumerate(lines) if any(n in line for n in needles)]
        for i in hits[:30]:
            lo=max(0,i-2); hi=min(len(lines),i+3)
            print('HOST_CONTEXT', i+1)
            for j in range(lo,hi):
                print(f'{j+1:04d}: {lines[j]}')
    data=text.encode('utf-8')
    (ROOT/name).write_bytes(data)
    print('materialized',name)
