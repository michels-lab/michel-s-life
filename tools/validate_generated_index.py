#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import argparse, subprocess, tempfile, sys

ap=argparse.ArgumentParser()
ap.add_argument('--index',required=True)
a=ap.parse_args()
p=Path(a.index)
text=p.read_text(encoding='utf-8')

assert '3.0.202' in text and 'mlv-v30202-release-readiness-script' in text
assert 'micheltheog' not in text.lower()
assert 'realmichelduarte' in text.lower()
for required in (
    'data:image/png;base64,',
    "panes.about.insertAdjacentHTML('beforeend',aboutPane())",
    'data-mlv-about-core',
    'data-mlv-developer',
    'data:image/jpeg;base64,',
    '© 2026 Michel Duarte / Michel’s Lab. All rights reserved.',
    'window.__mlvToastSession',
    'ChapterScenesV30170?.select?.(scene.dataset.v30170Scene)',
    '.v30165-hero-actions [data-tab="story"]',
    '.v30171-pane-heading{padding:14px 20px 7px!important}',
    '.mlv190-google-option>input[type="checkbox"]{width:18px!important',
    "if(String(title||'').trim().toLowerCase()==='cloud overview')return null;",
    '.v30171-brand-mark>img{width:82px!important;height:82px!important;display:block!important;visibility:visible!important;opacity:1!important;position:static!important',
):
    assert required in text, f'missing core frontend marker: {required}'
for forbidden in ('mlv-v30202-ui-hotfix-script','id="mlv-developer-branding"',"panes.chapters&&!panes.chapters.querySelector('[data-mlv-chapter-core]')",'const activeNotifications=new Map();','.brand-mark picture,','body.ml-theme-ui .brand-mark img,'):
    assert forbidden not in text, f'obsolete runtime overlay still present: {forbidden}'

def_line=next(line for line in text.splitlines() if line.startswith('function defaultState()'))
mig_line=next(line for line in text.splitlines() if line.startswith('function migrate(s)'))
js=f"""function nowISO(){{return '2026-09-17T00:00:00.000Z'}}\n{def_line}\n{mig_line}\nfunction ok(v,m){{if(!v)throw new Error(m)}}\nconst fresh=defaultState();ok(fresh.settings.characterName==='Player','fresh name');ok(fresh.settings.onboardingRequired===true,'fresh onboarding');ok(fresh.missions.length===0,'fresh missions');for(const v of ['3.0.196','3.0.197','3.0.198','3.0.199','3.0.200','3.0.201']){{const old={{settings:{{hideCompleted:true}},xp:123,missions:[{{id:'m1',completions:[]}}],history:[{{id:'h1'}}],goals:[{{id:'g1'}}]}};const n=migrate(old);ok(n.xp===123,v+' xp');ok(n.missions.length===1,v+' missions');ok(n.settings.onboardingRequired===false,v+' onboarding')}};console.log('migration checks passed');"""
subprocess.run(['node','-e',js],check=True)

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__();self.ins=False;self.src=False;self.buf=[];self.items=[]
    def handle_starttag(self,t,a):
        if t.lower()=='script':
            self.ins=True;self.src=bool(dict(a).get('src'));self.buf=[]
    def handle_data(self,d):
        if self.ins and not self.src:self.buf.append(d)
    def handle_endtag(self,t):
        if t.lower()=='script' and self.ins:
            if not self.src:
                c=''.join(self.buf)
                if c.strip():self.items.append(c)
            self.ins=False

parser=Scripts();parser.feed(text)
with tempfile.TemporaryDirectory() as td:
    for i,c in enumerate(parser.items):
        f=Path(td)/f'{i}.js';f.write_text(c,encoding='utf-8')
        r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        if r.returncode:
            print(r.stderr,file=sys.stderr)
            raise SystemExit(f'JS syntax failed {i}')
print(f'OK: core frontend invariants + migration checks + {len(parser.items)} inline scripts')
