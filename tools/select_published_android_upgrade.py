#!/usr/bin/env python3
"""Select latest and immediately previous official *stable* Android Direct releases.

No arbitrary hardcoded v0.2.3/v0.2.4 fallback: fail closed if release history,
Windows/Android pairing, or required exact APK/provenance assets are inconsistent.
This helper does not fetch GitHub or execute any installer.
"""
import argparse
import json
import re
from pathlib import Path

TAG = re.compile(r"^v3\.0\.(\d+)-android-v0\.2\.(\d+)$")
REPO = "michels-lab/michel-s-life-releases"


def identity(release):
    if not isinstance(release, dict) or release.get("draft") or release.get("prerelease"):
        raise ValueError("missing_public_stable_release")
    tag = release.get("tag_name", "")
    match = TAG.fullmatch(tag)
    if not match:
        raise ValueError("invalid_unified_release_tag")
    windows, android = map(int, match.groups())
    if android < 19 or windows < 230 or windows - android != 211:
        raise ValueError("unsupported_release_version_chain")
    assets = release.get("assets")
    if not isinstance(assets, list):
        raise ValueError("release_assets_missing")
    names = [item.get("name") for item in assets if isinstance(item, dict)]
    if len(names) != len(set(names)) or len(names) != 13:
        raise ValueError("release_not_13_distinct_assets")
    for name in (
        f"MichelsLife-Android-Direct-v0.2.{android}.apk",
        f"MichelsLife-Android-Direct-v0.2.{android}.apk.sha256",
        f"android-v0.2.{android}-manifest.json",
        f"android-signing-certificate-v0.2.{android}.txt",
        f"MichelsLife-Setup-v3.0.{windows}.exe",
        f"MichelsLife-Portable-v3.0.{windows}.exe",
        "release-provenance.json",
    ):
        if name not in names:
            raise ValueError("required_release_asset_missing")
    return windows, android, tag


def choose(latest, history):
    new_win, new_android, new_tag = identity(latest)
    if not isinstance(history, list):
        raise ValueError("release_history_missing")
    matches = []
    for release in history:
        try:
            old_win, old_android, old_tag = identity(release)
        except ValueError:
            continue
        if old_win == new_win - 1 and old_android == new_android - 1:
            matches.append((release, old_tag, old_android))
    if len(matches) != 1 or matches[0][1] == new_tag:
        raise ValueError("immediately_previous_signed_release_not_found")
    return {
        "LATEST_TAG": new_tag,
        "LATEST_VERSION": f"0.2.{new_android}",
        "LATEST_WINDOWS": f"3.0.{new_win}",
        "PREVIOUS_TAG": matches[0][1],
        "PREVIOUS_VERSION": f"0.2.{matches[0][2]}",
        "RELEASES_REPOSITORY": REPO,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--latest", type=Path, required=True)
    p.add_argument("--history", type=Path, required=True)
    p.add_argument("--env", type=Path, required=True)
    args = p.parse_args()
    pair = choose(
        json.loads(args.latest.read_text(encoding="utf-8")),
        json.loads(args.history.read_text(encoding="utf-8"))
    )
    with args.env.open("a", encoding="utf-8") as output:
        for key, value in pair.items():
            output.write(f"{key}={value}\n")
    print(f"VERIFIED_STABLE_PAIR: {pair['PREVIOUS_TAG']} -> {pair['LATEST_TAG']}")


if __name__ == "__main__":
    main()
