#!/usr/bin/env python3
from pathlib import Path
import argparse

TARGET_VERSION = "3.0.212"
PREVIOUS_VERSIONS = ("3.0.211", "3.0.210", "3.0.209")

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
        stale = [v for v in PREVIOUS_VERSIONS if v in text]
        if stale:
            raise SystemExit(f"frontend already has {TARGET_VERSION} markers but still contains stale versions: {stale}")
        print(f"frontend already at v{TARGET_VERSION}")
        return

    present = [v for v in PREVIOUS_VERSIONS if v in text]
    if not present:
        raise SystemExit(f"frontend contains neither complete v{TARGET_VERSION} markers nor a supported source version: {PREVIOUS_VERSIONS}")

    for previous in PREVIOUS_VERSIONS:
        text = text.replace(previous, TARGET_VERSION)

    missing = [marker for marker in REQUIRED if marker not in text]
    if missing:
        raise SystemExit(f"frontend version bump incomplete; missing: {missing}")
    stale = [v for v in PREVIOUS_VERSIONS if v in text]
    if stale:
        raise SystemExit(f"stale frontend versions remain: {stale}")

    path.write_text(text, encoding="utf-8", newline="\n")
    print(f"bumped canonical frontend {present} -> {TARGET_VERSION}")

if __name__ == "__main__":
    main()
