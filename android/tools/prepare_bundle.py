#!/usr/bin/env python3
from pathlib import Path
from zipfile import ZipFile
import argparse
import shutil

ROOT = Path(__file__).resolve().parents[1]
BRIDGE = ROOT / "android-bridge.js"
MOBILE_EXPERIENCE = ROOT / "mobile-experience.js"
MOBILE_SECTIONS = ROOT / "mobile-sections.js"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bundle", required=True)
    ap.add_argument("--assets", required=True)
    args = ap.parse_args()

    bundle = Path(args.bundle)
    assets = Path(args.assets)
    if assets.exists():
        shutil.rmtree(assets)
    assets.mkdir(parents=True)

    with ZipFile(bundle) as z:
        z.extractall(assets)

    index = assets / "index.html"
    if not index.exists():
        raise SystemExit("AppBundle.zip did not contain index.html")

    bridge_name = "android-bridge.js"
    shutil.copy2(BRIDGE, assets / bridge_name)
    shutil.copy2(MOBILE_EXPERIENCE, assets / "mobile-experience.js")
    shutil.copy2(MOBILE_SECTIONS, assets / "mobile-sections.js")
    text = index.read_text(encoding="utf-8")
    marker = '<script src="android-bridge.js" data-mlv-android-bridge="v1"></script>'
    mobile_marker = '<script src="mobile-experience.js" data-mlv-android-mobile-experience="v1"></script>'
    if marker not in text:
        if "<head>" not in text:
            raise SystemExit("index.html has no <head> tag")
        text = text.replace("<head>", "<head>\n" + marker, 1)
    sections_marker = '<script src="mobile-sections.js" data-mlv-android-mobile-sections="v1"></script>'
    if mobile_marker not in text:
        # Keep the platform-owned shell next to the bridge, before the
        # shared frontend scripts; both boot at DOMContentLoaded.
        text = text.replace(marker, marker + "\n" + mobile_marker, 1)
    if sections_marker not in text:
        text = text.replace(mobile_marker, mobile_marker + "\n" + sections_marker, 1)
    index.write_text(text, encoding="utf-8", newline="\n")

    print("Prepared Michel's Life Android web bundle:", assets)
    print("Files:", sum(1 for p in assets.rglob("*") if p.is_file()))

if __name__ == "__main__":
    main()
