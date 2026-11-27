#!/usr/bin/env python3
"""Build an optional offline music pack. Never changes bundled app assets."""
import argparse
import hashlib
import json
import math
import pathlib
import re
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
from urllib.parse import urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = ROOT / "docs/audio/OPTIONAL_PACK_01.json"
HOST = "www.scottbuckley.com.au"
LIMIT = 40_000_000

def official(url):
    u = urlsplit(url)
    return u.scheme == "https" and u.netloc == HOST and u.path.startswith("/library/") and not u.query and not u.fragment

def archive_member(item):
    """Return the deterministic ZIP member path for a catalog entry."""
    return f'{item["group"]}/{item["title"]} - Scott Buckley.mp3'

def validate_catalog(items):
    if not isinstance(items, list) or not items:
        raise ValueError("Empty catalog")
    seen_ids = set()
    seen_urls = set()
    seen_members = {"credits.txt", "manifest.json"}
    for item in items:
        if not isinstance(item, dict):
            raise ValueError("Invalid catalog entry")
        ident = item.get("id")
        if not isinstance(ident, str) or not re.fullmatch(r"sb_[a-z0-9_]+", ident) or ident in seen_ids:
            raise ValueError("Duplicate/invalid track ID")
        seen_ids.add(ident)
        if item.get("artist") != "Scott Buckley" or item.get("license") != "CC BY 4.0" or item.get("license_url") != "https://creativecommons.org/licenses/by/4.0/":
            raise ValueError("Missing attribution or license")
        source_page = item.get("source_page")
        url = item.get("url")
        if not isinstance(source_page, str) or not isinstance(url, str) or not official(source_page) or not official(url) or not url.lower().endswith(".mp3"):
            raise ValueError("Nonpublisher recording URL")
        url_key = urlsplit(url).geturl()
        if url_key in seen_urls:
            raise ValueError(f"Duplicate recording URL: {url}")
        seen_urls.add(url_key)
        group = item.get("group")
        title = item.get("title")
        if group not in {"Ambient", "Cinematic"} or not isinstance(title, str) or not re.fullmatch(r"[A-Za-z0-9 ]+", title):
            raise ValueError("Invalid collection or file title")
        member = archive_member(item)
        member_key = member.casefold()
        if member_key in seen_members:
            raise ValueError(f"Case-insensitive archive member collision: {member}")
        seen_members.add(member_key)
    return items

class OfficialRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not official(newurl):
            raise ValueError("Nonpublisher redirect")
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def download(url):
    opener = urllib.request.build_opener(OfficialRedirect())
    req = urllib.request.Request(url, headers={"User-Agent": "MichelsLife optional licensed audio pack"})
    with opener.open(req, timeout=120) as response:
        if not official(response.geturl()):
            raise ValueError("Unexpected download origin")
        data = response.read(LIMIT + 1)
    if not 100_000 < len(data) <= LIMIT:
        raise ValueError("Unexpected recording size")
    return data

def duration(path):
    info = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)]))
    if not any(s.get("codec_name") == "mp3" and s.get("codec_type") == "audio" for s in info["streams"]):
        raise ValueError("Not an MP3 recording")
    seconds = float(info["format"]["duration"])
    if not math.isfinite(seconds) or not 30 < seconds < 1800:
        raise ValueError("Unexpected full track duration")
    subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-i", str(path), "-map", "0:a:0", "-f", "null", "-"], check=True)
    return seconds

def build(items, output, acquire=download, probe=duration, pack="01"):
    validate_catalog(items)
    output = pathlib.Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    records = []
    credits = [f"Michel's Life — Optional music pack {pack}", "", "Extract this ZIP, then select MP3 files in Focus > My music.", "Extrae este ZIP y selecciona los MP3 en Pomodoro > Mi música.", "These are complete publisher MP3s, unmodified. No endorsement implied.", ""]
    with tempfile.TemporaryDirectory(dir=output.parent) as tmp:
        tmp = pathlib.Path(tmp)
        candidate = tmp / "pack.zip"
        with zipfile.ZipFile(candidate, "w", compression=zipfile.ZIP_STORED) as archive:
            hashes = set()
            for item in items:
                data = acquire(item["url"])
                digest = hashlib.sha256(data).hexdigest()
                if digest in hashes:
                    raise ValueError("Duplicate audio bytes")
                hashes.add(digest)
                media = tmp / (item["id"] + ".mp3")
                media.write_bytes(data)
                seconds = probe(media)
                filename = archive_member(item)
                archive.write(media, filename)
                media.unlink()
                records.append({**item, "file": filename, "sha256": digest, "bytes": len(data), "duration_seconds": seconds, "modifications": "none"})
                credits.append(f'{item["title"]} — Scott Buckley — CC BY 4.0 — {item["source_page"]} — {item["license_url"]}')
                print("VERIFIED", item["id"], seconds, digest, flush=True)
            archive.writestr("CREDITS.txt", "\n".join(credits) + "\n")
            archive.writestr("MANIFEST.json", json.dumps(records, ensure_ascii=False, indent=2) + "\n")
        with zipfile.ZipFile(candidate) as archive:
            if archive.testzip() is not None:
                raise ValueError("Corrupt archive")
            for record in records:
                if hashlib.sha256(archive.read(record["file"])).hexdigest() != record["sha256"]:
                    raise ValueError("Archive hash mismatch")
        candidate.replace(output)
    return records

def load_catalogs(catalog_dir=None):
    """Load sibling OPTIONAL_PACK_*.json catalogs from a directory."""
    directory = CATALOG.parent if catalog_dir is None else pathlib.Path(catalog_dir)
    paths = sorted(directory.glob("OPTIONAL_PACK_*.json"))
    if not paths:
        raise ValueError(f"No optional pack catalogs found in {directory}")
    catalogs = {}
    for path in paths:
        try:
            catalogs[path.name] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid catalog JSON in {path.name}: {exc}") from exc
    return catalogs

def preflight_catalogs(catalogs):
    """Validate each pack and reject duplicate IDs or recording URLs across sibling catalogs."""
    entries = list(catalogs.items()) if isinstance(catalogs, dict) else list(catalogs)
    if not entries:
        raise ValueError("No catalogs to validate")
    seen_ids = {}
    seen_urls = {}
    validated = {}
    for name, items in entries:
        validate_catalog(items)
        for item in items:
            ident = item["id"]
            if ident in seen_ids:
                raise ValueError(f"Duplicate track ID across catalogs ({seen_ids[ident]} and {name}): {ident}")
            seen_ids[ident] = name
            url_key = urlsplit(item["url"]).geturl()
            if url_key in seen_urls:
                raise ValueError(f"Duplicate recording URL across catalogs ({seen_urls[url_key]} and {name}): {item['url']}")
            seen_urls[url_key] = name
        validated[name] = items
    return validated

def main(argv=None, acquire=download, probe=duration):
    """Run library preflight and optionally build the selected optional audio pack."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=pathlib.Path)
    parser.add_argument("--pack", choices=("01", "02"), default="01")
    parser.add_argument("--catalog-dir", type=pathlib.Path, default=None)
    parser.add_argument("--preflight-only", action="store_true")
    args = parser.parse_args(argv)
    if not args.preflight_only and args.output is None:
        parser.error("--output is required unless --preflight-only is set")
    catalog_dir = CATALOG.parent if args.catalog_dir is None else args.catalog_dir
    catalog = (CATALOG if args.catalog_dir is None else catalog_dir / CATALOG.name).with_name(f"OPTIONAL_PACK_{args.pack}.json")
    if not args.preflight_only and not catalog.is_file():
        raise ValueError(f"Missing catalog: {catalog}")
    validated = preflight_catalogs(load_catalogs(catalog_dir))
    if args.preflight_only:
        total = sum(len(items) for items in validated.values())
        print("PREFLIGHT VERIFIED", len(validated), total)
        return 0
    if catalog.name not in validated:
        raise ValueError(f"Catalog not included in library preflight: {catalog.name}")
    records = build(validated[catalog.name], args.output, acquire=acquire, probe=probe, pack=args.pack)
    print("PACK VERIFIED", len(records), hashlib.sha256(args.output.read_bytes()).hexdigest())
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
