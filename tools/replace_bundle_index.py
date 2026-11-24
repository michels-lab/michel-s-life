#!/usr/bin/env python3
"""Replace the web source inside an existing Michel's Life AppBundle.zip.

The large visual pack is intentionally bootstrapped from the previous official
release so source-control changes do not recompress or duplicate 200+ artwork
files on every code change.
"""
from __future__ import annotations
import argparse
import tempfile
import zipfile
from pathlib import Path

DROP = {
    "index.html.pre_v164_themes_cleanup",
    "data/reference_backup_2026-06-23_14-14.json",
    "data/backup_mission_base_2026_06_23.json",
}

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bundle", required=True)
    ap.add_argument("--index", required=True)
    args = ap.parse_args()
    bundle = Path(args.bundle)
    index = Path(args.index)
    motivation = index.with_name('motivation-immersive.js')
    immersion = index.with_name('focus-immersive.js')
    personal_alarms = index.with_name('personal-alarms.js')
    settings_colors = index.with_name('settings-color-floating-preview.js')
    classical = [index.parent / 'assets/audio/classical' / (name + '.mp3') for name in ('mozart_k545','tchaikovsky_op39','sb_meanwhile','sb_moonlight','sb_cobalt','sb_skyward','sb_life_is','sb_first_snow','sb_midsommar','sb_at_the_end_of_all_things','sb_in_this_moment','sb_hyperion','sb_ascension','sb_bring_me_the_sky')]
    rights = index.parent / 'assets/audio/classical/RECORDINGS.json'
    library = rights.with_name('LIBRARY.json')
    shared = (motivation, immersion, personal_alarms, settings_colors, *classical, rights, library)
    if not bundle.exists() or not index.exists() or not all(path.is_file() for path in shared):
        raise SystemExit("bundle/index/shared Focus or Settings source missing")
    if '<script defer src="settings-color-floating-preview.js"></script>' not in index.read_text(encoding="utf-8"):
        raise SystemExit("canonical index must load Settings color preview; refusing invisible release")

    # Keep the temporary archive beside the target bundle. On Windows,
    # os.replace()/Path.replace() cannot atomically move a file between drives
    # (GitHub runners commonly use C: for temp files and D: for the workspace).
    bundle.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".zip",
        prefix=f".{bundle.stem}-",
        dir=bundle.parent,
    ) as tmp:
        temp = Path(tmp.name)

    try:
        with zipfile.ZipFile(bundle, "r") as src, zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as dst:
            for info in src.infolist():
                name = info.filename.replace("\\", "/")
                if name.startswith('assets/audio/classical/'):
                    continue
                if name in ("index.html", "focus-immersive.js", "personal-alarms.js", "motivation-immersive.js", "settings-color-floating-preview.js") or name in DROP:
                    continue
                dst.writestr(info, src.read(info.filename))
            dst.writestr("index.html", index.read_bytes())
            dst.writestr("focus-immersive.js", immersion.read_bytes())
            dst.writestr("personal-alarms.js", personal_alarms.read_bytes())
            dst.writestr("motivation-immersive.js", motivation.read_bytes())
            dst.writestr("settings-color-floating-preview.js", settings_colors.read_bytes())
            for item in (*classical, rights, library):
                dst.writestr("assets/audio/classical/" + item.name, item.read_bytes())

        with zipfile.ZipFile(temp) as check:
            names = check.namelist()
            jpg = sum(n.lower().endswith(".jpg") for n in names)
            if (not {"index.html", "focus-immersive.js", "personal-alarms.js",
                     "motivation-immersive.js", "settings-color-floating-preview.js"}.issubset(names)
                    or names.count("settings-color-floating-preview.js") != 1
                    or jpg < 204 or check.testzip() is not None):
                raise SystemExit(f"rebuilt AppBundle invalid: index={'index.html' in names}, jpg={jpg}")

        temp.replace(bundle)
    finally:
        if temp.exists():
            temp.unlink()

    print(f"AppBundle ready: {bundle} · {jpg} JPEG assets")

if __name__ == "__main__":
    main()
