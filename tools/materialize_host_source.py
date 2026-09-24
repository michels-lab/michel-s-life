#!/usr/bin/env python3
from pathlib import Path
import base64,gzip

ROOT=Path(__file__).resolve().parents[1]/'src'/'MichelsLife'
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
    text=text.replace('3.0.203','3.0.207')
    if name=='GoogleCalendarService.cs':
        for old_client_id in LEGACY_GOOGLE_CLIENT_IDS:
            text=text.replace(old_client_id,GOOGLE_CLIENT_ID)
        if GOOGLE_CLIENT_ID not in text:
            raise SystemExit('GoogleCalendarService.cs does not contain the approved Google Desktop OAuth client id')
    if '3.0.203' in text:
        raise SystemExit(f'{name} still contains a stale v3.0.203 marker after materialization')
    if name=='Program.cs' and 'CurrentAppVersion = new("3.0.207")' not in text:
        raise SystemExit('Program.cs did not materialize with CurrentAppVersion v3.0.207')
    data=text.encode('utf-8')
    (ROOT/name).write_bytes(data)
    print('materialized',name)
