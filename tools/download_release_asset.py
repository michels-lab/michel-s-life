#!/usr/bin/env python3
"""Resolve and download an asset from the newest matching GitHub Release.

This avoids relying on /releases/latest when a shared release repository hosts
multiple products. The newest published release that actually contains the
requested asset (and optional tag prefix) is selected deterministically.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError
from urllib.request import Request, urlopen

API = "https://api.github.com"


def select_release_asset(
    releases: Iterable[dict],
    asset_name: str,
    tag_prefix: str = "",
) -> tuple[dict, dict] | None:
    for release in releases:
        if release.get("draft"):
            continue
        tag = str(release.get("tag_name") or "")
        if tag_prefix and not tag.startswith(tag_prefix):
            continue
        for asset in release.get("assets") or []:
            if asset.get("name") == asset_name:
                return release, asset
    return None


def request_json(url: str, token: str | None = None) -> object:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "MichelsLife-CI/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(url, headers=headers)
    with urlopen(request, timeout=60) as response:
        return json.load(response)


def download_file(url: str, output: Path, token: str | None = None) -> None:
    headers = {
        "Accept": "application/octet-stream",
        "User-Agent": "MichelsLife-CI/1.0",
    }
    if token and url.startswith(API):
        headers["Authorization"] = f"Bearer {token}"
    request = Request(url, headers=headers)
    output.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(request, timeout=180) as response, output.open("wb") as target:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            target.write(chunk)


def resolve_asset(
    repo: str,
    asset_name: str,
    tag_prefix: str = "",
    token: str | None = None,
    max_pages: int = 10,
) -> tuple[dict, dict]:
    for page in range(1, max_pages + 1):
        url = f"{API}/repos/{repo}/releases?per_page=100&page={page}"
        releases = request_json(url, token)
        if not isinstance(releases, list):
            raise RuntimeError(f"Unexpected GitHub releases response for {repo}.")
        match = select_release_asset(releases, asset_name, tag_prefix)
        if match:
            return match
        if len(releases) < 100:
            break
    prefix_note = f" with tag prefix {tag_prefix!r}" if tag_prefix else ""
    raise RuntimeError(
        f"No published release in {repo}{prefix_note} contains asset {asset_name!r}."
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--asset", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--tag-prefix", default="")
    args = parser.parse_args()

    token = (
        os.environ.get("RELEASES_REPO_TOKEN")
        or os.environ.get("GH_TOKEN")
        or os.environ.get("GITHUB_TOKEN")
        or None
    )

    try:
        release, asset = resolve_asset(
            repo=args.repo,
            asset_name=args.asset,
            tag_prefix=args.tag_prefix,
            token=token,
        )
        browser_url = asset.get("browser_download_url")
        api_url = asset.get("url")
        if not browser_url and not api_url:
            raise RuntimeError("Matched asset has no downloadable URL.")

        # Public release assets work directly through browser_download_url.
        # If only the API URL exists, the authenticated octet-stream path is used.
        download_file(str(browser_url or api_url), Path(args.output), token)
    except HTTPError as exc:
        raise SystemExit(
            f"GitHub asset resolution failed with HTTP {exc.code}: {exc.reason}"
        ) from exc

    output = Path(args.output)
    if not output.exists() or output.stat().st_size == 0:
        raise SystemExit(f"Downloaded asset is empty or missing: {output}")

    print(
        f"Resolved {args.asset} from {args.repo} release "
        f"{release.get('tag_name')} -> {output} ({output.stat().st_size} bytes)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
