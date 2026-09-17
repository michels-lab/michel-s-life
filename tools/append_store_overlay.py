#!/usr/bin/env python3
"""Append the Microsoft Store-only frontend overlay to a generated index.html."""
from __future__ import annotations

import argparse
from pathlib import Path

MARKER = "mlv-store-msix-channel"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", required=True)
    ap.add_argument("--overlay", required=True)
    args = ap.parse_args()

    index = Path(args.index)
    overlay = Path(args.overlay).read_text(encoding="utf-8")
    html = index.read_text(encoding="utf-8")

    if MARKER in html:
        print("Microsoft Store overlay already present")
        return
    if MARKER not in overlay:
        raise SystemExit("Store overlay marker missing; refusing to append an ambiguous overlay.")

    pos = html.lower().rfind("</body>")
    if pos < 0:
        raise SystemExit("index.html closing </body> tag not found")
    html = html[:pos] + "\n" + overlay + "\n" + html[pos:]
    index.write_text(html, encoding="utf-8", newline="\n")
    print("Applied Microsoft Store channel overlay.")


if __name__ == "__main__":
    main()
