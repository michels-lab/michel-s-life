#!/usr/bin/env python3
"""Download the bootstrap AppBundle from the newest Michel's Life release.

The public release repository is shared with other Michel's Lab apps, so GitHub's
/releases/latest endpoint is not a reliable Michel's Life selector.
"""
from __future__ import annotations

import argparse
import http.client
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

TAG_RE = re.compile(r"^v(\d+)\.(\d+)\.(\d+)$")
ASSET_NAME = "AppBundle.zip"
# Upstream GitHub release assets periodically fail with HTTP 504 for large
# downloads, including on otherwise healthy PR/main build runners.
MAX_ATTEMPTS = 5
RETRY_HTTP_CODES = {408, 425, 429, 500, 502, 503, 504}


def _retryable(error: Exception) -> bool:
    if isinstance(error, urllib.error.HTTPError):
        return error.code in RETRY_HTTP_CODES
    return isinstance(
        error,
        (urllib.error.URLError, TimeoutError, ConnectionError,
         http.client.IncompleteRead, zipfile.BadZipFile, json.JSONDecodeError),
    )


def _with_retries(operation, label: str):
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            return operation()
        except Exception as error:
            if attempt == MAX_ATTEMPTS or not _retryable(error):
                raise
            delay = min(12, 2 ** (attempt - 1))
            print(
                f"WARNING: {label} attempt {attempt}/{MAX_ATTEMPTS} failed: "
                f"{error}; retrying in {delay}s",
                file=sys.stderr,
            )
            time.sleep(delay)


def _load_releases(api: str):
    with urllib.request.urlopen(request(api), timeout=30) as response:
        return json.load(response)



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
    releases = _with_retries(lambda: _load_releases(api), "Release metadata")

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
    """Retry transient network/ZIP failures without leaving partial candidates.

    A build must never consume a truncated or HTML error response as AppBundle.
    Retain any previous *complete* output until the new ZIP has passed its CRC
    check, then replace it atomically.
    """
    output.parent.mkdir(parents=True, exist_ok=True)
    partial = output.with_name(output.name + ".part")

    def transfer():
        try:
            with urllib.request.urlopen(request(url), timeout=90) as response, partial.open("wb") as target:
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    target.write(chunk)
            if not partial.exists() or partial.stat().st_size < 1024:
                raise zipfile.BadZipFile("Downloaded bundle is missing or unexpectedly small")
            with zipfile.ZipFile(partial) as archive:
                if not archive.infolist():
                    raise zipfile.BadZipFile("Downloaded bundle contains no files")
                broken = archive.testzip()
                if broken is not None:
                    raise zipfile.BadZipFile(f"Downloaded bundle failed ZIP CRC: {broken}")
            os.replace(partial, output)
        finally:
            partial.unlink(missing_ok=True)

    _with_retries(transfer, "AppBundle download")


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
