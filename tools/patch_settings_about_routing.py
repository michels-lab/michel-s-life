#!/usr/bin/env python3
"""Keep About-owned cards inside the About Settings pane.

Michel's Life v3.0.202 normalizes direct Settings cards through classify().
Cards whose headings are not recognized are sent to General, even when a later
feature intentionally mounted them in About. Patch the classifier itself so
About ownership is explicit and stable.
"""
from __future__ import annotations
import argparse
from pathlib import Path

ANCHOR = """function classify(el){
 if(el?.matches?.('[data-mlv190-google-card]'))return 'google';"""
RULE = """ if(el?.matches?.('[data-mlv-developer],[data-mlv200-update],[data-mlv202-update],[data-mlv202-changelog]'))return 'about';"""
MARKER = "[data-mlv-developer],[data-mlv200-update],[data-mlv202-update],[data-mlv202-changelog]"

def main() -> None:
    ap=argparse.ArgumentParser()
    ap.add_argument("--index",required=True)
    args=ap.parse_args()
    path=Path(args.index)
    html=path.read_text(encoding="utf-8")
    if MARKER in html:
        print("About routing patch already present")
        return
    if ANCHOR not in html:
        raise SystemExit("Settings classify() anchor not found; refusing unsafe patch.")
    html=html.replace(ANCHOR,ANCHOR+"\n"+RULE,1)
    if html.count(MARKER)!=1:
        raise SystemExit("About routing patch was not applied exactly once.")
    path.write_text(html,encoding="utf-8",newline="\n")
    print("Patched Settings classifier: About-owned cards stay in About.")

if __name__=="__main__":
    main()
