#!/usr/bin/env python3
from pathlib import Path
import subprocess, tempfile, sys, re
ROOT=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(ROOT/'tools/materialize_host_source.py')],check=True)
PROGRAM=ROOT/'src/MichelsLife/Program.cs'; GOOGLE=ROOT/'src/MichelsLife/GoogleCalendarService.cs'; SECRETS=ROOT/'src/MichelsLife/BuildSecrets.cs'; OVERLAY=ROOT/'src/MichelsLife/AppPatches/v3.0.202.html'
for p in (PROGRAM,GOOGLE,SECRETS,OVERLAY): assert p.exists(),f'missing {p}'
all_source='\n'.join(p.read_text(encoding='utf-8') for p in (PROGRAM,GOOGLE,SECRETS,OVERLAY))
assert 'CurrentAppVersion = new("3.0.202")' in PROGRAM.read_text(encoding='utf-8')
assert '__BUILD_SECRET_GOOGLE__' in SECRETS.read_text(encoding='utf-8')
for forbidden in ('GOCSPX-','github_pat_','ghp_','client_secret_794181','micheltheog','Instagram mission recovery','Restore Instagram missions'):
    assert forbidden.lower() not in all_source.lower(), f'forbidden committed content: {forbidden}'
html=OVERLAY.read_text(encoding='utf-8')
scripts=re.findall(r'<script[^>]*>(.*?)</script>',html,flags=re.S|re.I)
with tempfile.TemporaryDirectory() as td:
    for i,code in enumerate(scripts):
        f=Path(td)/f'overlay_{i}.js'; f.write_text(code,encoding='utf-8')
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:
            print(r.stdout); print(r.stderr,file=sys.stderr); raise SystemExit(f'overlay JS syntax failed: {i}')
print(f'OK: host secret scan + {len(scripts)} v3.0.202 overlay script(s) syntax-checked')
