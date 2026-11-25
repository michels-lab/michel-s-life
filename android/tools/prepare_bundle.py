#!/usr/bin/env python3
from pathlib import Path
from zipfile import ZipFile
import argparse
import json
import hashlib
import shutil

ROOT = Path(__file__).resolve().parents[1]
BRIDGE = ROOT / "android-bridge.js"
MOBILE_EXPERIENCE = ROOT / "mobile-experience.js"
MOBILE_SECTIONS = ROOT / "mobile-sections.js"
FOCUS_IMMERSION = ROOT.parent / 'src/MichelsLife/frontend/focus-immersive.js'
PERSONAL_ALARMS = ROOT.parent / 'src/MichelsLife/frontend/personal-alarms.js'
MOTIVATION = ROOT.parent / 'src/MichelsLife/frontend/motivation-immersive.js'
SETTINGS_COLOR_PREVIEW = ROOT.parent / 'src/MichelsLife/frontend/settings-color-floating-preview.js'

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
    shutil.copy2(FOCUS_IMMERSION, assets / 'focus-immersive.js')
    shutil.copy2(PERSONAL_ALARMS, assets / 'personal-alarms.js')
    shutil.copy2(MOTIVATION, assets / 'motivation-immersive.js')
    shutil.copy2(SETTINGS_COLOR_PREVIEW, assets / 'settings-color-floating-preview.js')
    for filename in ('mozart_k545.mp3','tchaikovsky_op39.mp3','RECORDINGS.json','LIBRARY.json','sb_meanwhile.mp3', 'sb_moonlight.mp3', 'sb_cobalt.mp3', 'sb_skyward.mp3', 'sb_life_is.mp3', 'sb_first_snow.mp3', 'sb_midsommar.mp3', 'sb_at_the_end_of_all_things.mp3', 'sb_in_this_moment.mp3', 'sb_hyperion.mp3', 'sb_ascension.mp3', 'sb_bring_me_the_sky.mp3','PIANO.json','debussy_clair_de_lune.mp3','chopin_nocturne_op9.mp3','satie_gymnopedie_1.mp3','bach_prelude_bwv846.mp3'):
        source = FOCUS_IMMERSION.parent / 'assets/audio/classical' / filename
        target = assets / 'assets/audio/classical' / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    audio_dir = assets / 'assets/audio/classical'
    for manifest in ('RECORDINGS.json','LIBRARY.json','PIANO.json'):
        for record in json.loads((audio_dir / manifest).read_text(encoding='utf-8')):
            if hashlib.sha256((audio_dir / (record['id']+'.mp3')).read_bytes()).hexdigest() != record['asset_sha256']:
                raise SystemExit('Android audio integrity mismatch: ' + record['id'])
    text = index.read_text(encoding="utf-8")
    if '<script defer src="settings-color-floating-preview.js"></script>' not in text:
        raise SystemExit("Android source missing Settings preview loader")
    marker = '<script src="android-bridge.js" data-mlv-android-bridge="v1"></script>'
    mobile_marker = '<script src="mobile-experience.js" data-mlv-android-mobile-experience="v1"></script>'
    if marker not in text:
        charset = '<meta charset="UTF-8" />'
        if "<head>" not in text or charset not in text:
            raise SystemExit("index.html must declare UTF-8 early in <head>")
        if text.index(charset) > 1024 or text.index(charset) > text.index('<script'):
            raise SystemExit("UTF-8 meta must precede all inline scripts")
        # The Android bridge also belongs after encoding detection.
        # Never move charset beyond the first 1024 bytes again.
        text = text.replace(charset, charset + "\n" + marker, 1)
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
