#!/usr/bin/env python3
from pathlib import Path
import base64,gzip
ROOT=Path(__file__).resolve().parents[1]/'src'/'MichelsLife'
for name in ('Program.cs','GoogleCalendarService.cs'):
    packed=ROOT/(name+'.gz.b64')
    if not packed.exists(): raise SystemExit(f'missing {packed}')
    (ROOT/name).write_bytes(gzip.decompress(base64.b64decode(packed.read_text().strip())))
    print('materialized',name)
