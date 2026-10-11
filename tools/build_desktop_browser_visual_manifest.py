#!/usr/bin/env python3
"""Bind real Michel's Life Chromium screenshots to the exact UI bundle.

This deliberately certifies only the desktop *browser* runtime and does not
claim Windows installer or Android APK screenshot acceptance.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image


def hash_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def create_manifest(directory, bundle, commit, output):
    if len(commit) != 40 or any(x not in "0123456789abcdefABCDEF" for x in commit):
        raise ValueError("Exact source commit SHA required")
    if not bundle.is_file() or bundle.stat().st_size < 10000:
        raise ValueError("Built UI bundle unavailable")
    if directory.resolve() != output.resolve().parent:
        raise ValueError("Manifest must be alongside existing image evidence")
    expected = (
        ("home", "wide", "05-dashboard.png"),
        ("about", "wide", "03-about.png"),
        ("home", "compact", "08-home-1280x800.png"),
        ("about", "compact", "07-about-1280x800-initial.png"),
    )
    artifact_digest = hash_file(bundle)
    shots = []
    for surface, viewport, name in expected:
        file = directory / name
        if not file.is_file():
            raise ValueError(f"Missing real browser screenshot: {file}")
        with Image.open(file) as im:
            im.verify()
        with Image.open(file) as im:
            w, h = im.size
        shots.append({
            "platform": "desktop-browser",
            "surface": surface, "viewport": viewport,
            "path": name, "width": w, "height": h,
            "sha256": hash_file(file),
            "candidate_artifact_sha256": artifact_digest,
            "capture_method": "running-browser",
        })
    obj = {
        "schema": "michelslab-rendered-ui-v1",
        "source_commit": commit,
        "artifact_sha256": {"desktop-browser": artifact_digest},
        "screenshots": shots,
        "human_visual_review": {"decision": "PENDING"},
    }
    output.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
    return obj


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, required=True)
    parser.add_argument("--bundle", type=Path, required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    create_manifest(args.directory, args.bundle, args.commit, args.output)
    print("Desktop browser Home/About captured with exact bundle provenance. Native Windows and Android still pending.")
