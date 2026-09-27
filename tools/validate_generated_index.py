#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import argparse, subprocess, tempfile, sys

ap=argparse.ArgumentParser()
ap.add_argument('--index',required=True)
a=ap.parse_args()
p=Path(a.index)
text=p.read_text(encoding='utf-8')

required=(
    "const VERSION='3.0.209'",
    "window.__MICHELS_LIFE_BUILD__='3.0.209'",
    "assets/michels_life_logo.jpg",
    "assets/michel_duarte_avatar.jpg",
    "['typography','Aa','Typography'",
    "data-mlv-typography-core",
    "michelsLife.typography.v303",
    "MLV303_TYPOGRAPHY",
    "midnights:{name:'Midnights'",
    "ocean_blvd:{name:'Did You Know That There’s a Tunnel Under Ocean Blvd'",
    "--mlv-ui-font:Inter",
    "font-family:var(--mlv-ui-font)",
    "function focusPane()",
    "Focus & Timers settings",
    "--mlv-font-midnights",
    "Choose by era. Every card keeps its own permanent preview, so you can compare styles without selecting them first.",
    "function createCanonicalSettingsShell(root){",
    "shell.dataset.v30171Canonical='3.0.209';",
    "panes.typography.insertAdjacentHTML('beforeend',typographyPane());",
    "panes.about.insertAdjacentHTML('beforeend',aboutPane());",
    "function activateSetting(key,root){",
    "if(String(title||'').trim().toLowerCase()==='cloud overview')return null;",
    "function setChapter(id)",
    "data-mlv184-chapter",
    "© 2026 Michel Duarte / Michel’s Lab. All rights reserved.",
    '<script src="i18n.js" data-mlv-i18n="v1"></script>',
)
for marker in required:
    assert marker in text, f'missing canonical frontend marker: {marker}'
for stale in ('3.0.202','3.0.203','3.0.204','3.0.205','3.0.206','3.0.207','3.0.208'):
    assert stale not in text, f'stale frontend version remains: {stale}'

for forbidden in (
    'data:image/png;base64,',
    'data:image/jpeg;base64,',
    'mlv-v30202-ui-hotfix-script',
    'id="mlv-developer-branding"',
    'const activeNotifications=new Map();',
    '.v30171-scene-card[data-v30170-scene]',
    "artist:'Taylor Swift'",
    "artist:'Lana Del Rey'",
    'data-mlv-font-artist=',
):
    assert forbidden not in text, f'obsolete/non-canonical frontend content remains: {forbidden}'

# Settings must be constructed centrally; activation may only switch state.
activate_start=text.index('function activateSetting(key,root){')
activate_end=text.index('function enhance()',activate_start)
activate_code=text[activate_start:activate_end]
for forbidden in ('document.createElement','insertAdjacentHTML','typographyPane()','aboutPane()'):
    assert forbidden not in activate_code, f'activateSetting is creating UI instead of only activating it: {forbidden}'

# Typography presets must not alter visual palette values.
typo_start=text.index('<style id="mlv-v303-canonical-design-system">')
typo_end=text.index('</style>',typo_start)
typo_css=text[typo_start:typo_end]
for forbidden in ('html[data-mlv-typography="midnights"]{color:', 'html[data-mlv-typography="midnights"]{background:'):
    assert forbidden not in typo_css

def_line=next(line for line in text.splitlines() if line.startswith('function defaultState()'))
mig_line=next(line for line in text.splitlines() if line.startswith('function migrate(s)'))
js=f"""function nowISO(){{return '2026-09-21T00:00:00.000Z'}}\n{def_line}\n{mig_line}\nfunction ok(v,m){{if(!v)throw new Error(m)}}\nconst fresh=defaultState();ok(fresh.settings.characterName==='Player','fresh name');ok(fresh.settings.onboardingRequired===true,'fresh onboarding');ok(fresh.missions.length===0,'fresh missions');const old={{settings:{{hideCompleted:true}},xp:123,missions:[{{id:'m1',completions:[]}}],history:[{{id:'h1'}}],goals:[{{id:'g1'}}]}};const n=migrate(old);ok(n.xp===123,'xp');ok(n.missions.length===1,'missions');console.log('migration checks passed');"""
subprocess.run(['node','-e',js],check=True)

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(); self.ins=False; self.src=False; self.buf=[]; self.items=[]
    def handle_starttag(self,t,a):
        if t.lower()=='script':
            self.ins=True; self.src=bool(dict(a).get('src')); self.buf=[]
    def handle_data(self,d):
        if self.ins and not self.src: self.buf.append(d)
    def handle_endtag(self,t):
        if t.lower()=='script' and self.ins:
            if not self.src:
                code=''.join(self.buf)
                if code.strip(): self.items.append(code)
            self.ins=False

parser=Scripts(); parser.feed(text)
with tempfile.TemporaryDirectory() as td:
    for i,code in enumerate(parser.items):
        f=Path(td)/f'{i}.js'; f.write_text(code,encoding='utf-8')
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:
            print(r.stderr,file=sys.stderr)
            raise SystemExit(f'JS syntax failed {i}')
print(f'OK: canonical v3.0.209 frontend + migration checks + {len(parser.items)} inline scripts')
