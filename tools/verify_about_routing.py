#!/usr/bin/env python3
"""Fail a build if the generated About pane cannot retain its owned cards."""
from __future__ import annotations
import argparse
from pathlib import Path

ROUTING="[data-mlv-developer],[data-mlv200-update],[data-mlv202-update],[data-mlv202-changelog]"
REQUIRED=(
    "id=\"mlv-developer-branding\"",
    "data-mlv-developer",
    "assets/michel_duarte_avatar.jpg",
    "Michel Duarte",
    "Michel’s Lab",
    "realmichelduarte@gmail.com",
    "instagram.com/realmichelduarte",
    "facebook.com/realmichelduarte",
    "linkedin.com/in/realmichelduart",
    "github.com/realmichelduarte",
    "© 2026 Michel Duarte / Michel’s Lab. All rights reserved.",
)

def main() -> None:
    ap=argparse.ArgumentParser()
    ap.add_argument("--index",required=True)
    args=ap.parse_args()
    html=Path(args.index).read_text(encoding="utf-8")
    if html.count(ROUTING)!=1:
        raise SystemExit("About routing selector missing or duplicated.")
    classify=html.find("function classify(el)")
    route=html.find(ROUTING,classify)
    heading=html.find("const h=heading(el)",classify)
    if min(classify,route,heading)<0 or not (classify < route < heading):
        raise SystemExit("About routing rule is not active before generic heading classification.")
    missing=[x for x in REQUIRED if x not in html]
    if missing:
        raise SystemExit("Generated About content is incomplete: "+", ".join(missing))
    print("About routing verification passed: Developer card remains About-owned.")

if __name__=="__main__":
    main()
