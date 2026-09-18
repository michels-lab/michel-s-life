#!/usr/bin/env python3
"""Append one source-controlled frontend overlay before </body>."""
from __future__ import annotations
import argparse
from pathlib import Path

def main() -> None:
    ap=argparse.ArgumentParser()
    ap.add_argument("--index",required=True)
    ap.add_argument("--overlay",required=True)
    ap.add_argument("--marker",required=True)
    args=ap.parse_args()
    index=Path(args.index)
    overlay=Path(args.overlay).read_text(encoding="utf-8")
    html=index.read_text(encoding="utf-8")
    if args.marker in html:
        print(f"Overlay already present: {args.marker}")
        return
    if args.marker not in overlay:
        raise SystemExit(f"Overlay marker missing: {args.marker}")
    pos=html.lower().rfind("</body>")
    if pos<0:
        raise SystemExit("index.html closing </body> tag not found")
    html=html[:pos]+"\n"+overlay+"\n"+html[pos:]
    index.write_text(html,encoding="utf-8",newline="\n")
    print(f"Applied overlay: {args.marker}")

if __name__=="__main__":
    main()
