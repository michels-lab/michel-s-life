#!/usr/bin/env python3
from pathlib import Path
import argparse

TARGET_VERSION = "3.0.210"
PREVIOUS_VERSION = "3.0.209"

REQUIRED = (
    f"const VERSION='{TARGET_VERSION}'",
    f"window.__MICHELS_LIFE_BUILD__='{TARGET_VERSION}'",
    f"shell.dataset.v30171Canonical='{TARGET_VERSION}';",
)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", required=True)
    args = ap.parse_args()

    path = Path(args.index)
    text = path.read_text(encoding="utf-8")

    if all(marker in text for marker in REQUIRED):
        if PREVIOUS_VERSION in text:
            raise SystemExit(f"frontend already has {TARGET_VERSION} markers but still contains stale {PREVIOUS_VERSION}")
        print(f"frontend already at v{TARGET_VERSION}")
        return

    if PREVIOUS_VERSION not in text:
        raise SystemExit(f"frontend contains neither complete v{TARGET_VERSION} markers nor source v{PREVIOUS_VERSION}")

    text = text.replace(PREVIOUS_VERSION, TARGET_VERSION)

    missing = [marker for marker in REQUIRED if marker not in text]
    if missing:
        raise SystemExit(f"frontend version bump incomplete; missing: {missing}")
    if PREVIOUS_VERSION in text:
        raise SystemExit(f"stale frontend version remains: {PREVIOUS_VERSION}")

    path.write_text(text, encoding="utf-8", newline="\n")
    print(f"bumped canonical frontend {PREVIOUS_VERSION} -> {TARGET_VERSION}")

if __name__ == "__main__":
    main()
