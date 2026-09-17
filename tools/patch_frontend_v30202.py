#!/usr/bin/env python3
"""Apply the v3.0.202 frontend changes to a v3.0.201 Michel's Life index.html."""
from pathlib import Path
import argparse

OLD_ACCOUNT = "function specificAccount(v){const s=norm(v);if(s.includes('micheltheog'))return'micheltheog';if(s.includes('realmichelduarte'))return'realmichelduarte';return'';}"
NEW_ACCOUNT = "function specificAccount(v){const raw=String(v||'');const s=norm(raw);if(!/instagram|followers|following|unfollow/.test(s))return'';const at=raw.match(/@([a-z0-9._]{2,30})/i);if(at)return at[1].toLowerCase();const paren=raw.match(/\\(([a-z0-9._]{2,30})\\)/i);if(paren)return paren[1].toLowerCase();const labeled=raw.match(/(?:account|cuenta)\\s*[:\\-]?\\s*([a-z0-9._]{2,30})/i);return labeled?labeled[1].toLowerCase():'';}"
OLD_ABOUT = "v3.0.201 adds a unified Backup Timeline with safe restore previews while preserving onboarding, recaps, Cloud Sync and the approved visual system."
NEW_ABOUT = "v3.0.202 is the Release Readiness build: diagnostics, portable backups, safer update infrastructure and product cleanup, while preserving the approved visual system."

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--index',required=True)
    ap.add_argument('--overlay',required=True)
    args=ap.parse_args()
    p=Path(args.index); overlay=Path(args.overlay).read_text(encoding='utf-8')
    s=p.read_text(encoding='utf-8')
    if 'mlv-v30202-release-readiness-script' in s:
        print('v3.0.202 frontend patch already present'); return
    if '3.0.201' not in s:
        raise SystemExit('Expected v3.0.201 base index markers were not found.')
    s=s.replace('3.0.201','3.0.202')
    if OLD_ACCOUNT in s:
        s=s.replace(OLD_ACCOUNT,NEW_ACCOUNT)
    else:
        raise SystemExit('Expected legacy account matcher not found; refusing an ambiguous patch.')
    if OLD_ABOUT in s:
        s=s.replace(OLD_ABOUT,NEW_ABOUT)
    close='\n</body>\n</html>'
    if close not in s:
        raise SystemExit('index.html closing tags not found')
    s=s.replace(close,'\n'+overlay+'\n</body>\n</html>')
    p.write_text(s,encoding='utf-8')
    print('Applied Michel\'s Life v3.0.202 frontend patch.')

if __name__=='__main__': main()
