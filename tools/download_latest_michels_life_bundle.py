#!/usr/bin/env python3
"""Download the bootstrap AppBundle from the newest Michel's Life release.

The public release repository is shared with other Michel's Lab apps, so GitHub's
/releases/latest endpoint is not a reliable Michel's Life selector.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

TAG_RE = re.compile(r"^v(\d+)\.(\d+)\.(\d+)$")
ASSET_NAME = "AppBundle.zip"


def request(url: str):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "michels-life-build",
    }
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return urllib.request.Request(url, headers=headers)


def resolve(repo: str) -> tuple[str, str]:
    api = f"https://api.github.com/repos/{repo}/releases?per_page=100"
    with urllib.request.urlopen(request(api), timeout=30) as response:
        releases = json.load(response)

    candidates = []
    for release in releases:
        if release.get("draft") or release.get("prerelease"):
            continue
        match = TAG_RE.fullmatch(str(release.get("tag_name") or ""))
        if not match:
            continue
        asset = next(
            (item for item in release.get("assets", []) if item.get("name") == ASSET_NAME),
            None,
        )
        if asset and asset.get("browser_download_url"):
            version = tuple(int(part) for part in match.groups())
            candidates.append((version, release["tag_name"], asset["browser_download_url"]))

    if not candidates:
        raise RuntimeError(
            f"No stable Michel's Life vX.Y.Z release with {ASSET_NAME} was found in {repo}."
        )

    _, tag, url = max(candidates, key=lambda item: item[0])
    return tag, url


def download(url: str, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(request(url), timeout=90) as response, output.open("wb") as target:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            target.write(chunk)
    if not output.exists() or output.stat().st_size < 1024:
        raise RuntimeError(f"Downloaded bundle is missing or unexpectedly small: {output}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default="realmichelduarte/michel-s-life-releases")
    parser.add_argument("--output", required=True)
    parser.add_argument("--url", default="", help="Optional explicit bootstrap URL.")
    args = parser.parse_args()

    if args.url.strip():
        tag, url = "explicit-url", args.url.strip()
    else:
        tag, url = resolve(args.repo)

    output = Path(args.output)
    print(f"Michel's Life bootstrap: {tag} -> {output}")
    download(url, output)
    print(f"Downloaded {output.stat().st_size} bytes.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
