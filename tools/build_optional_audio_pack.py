#!/usr/bin/env python3
"""Build an optional offline music pack. Never changes bundled app assets."""
import argparse
import hashlib
import json
import math
import pathlib
import re
import subprocess
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

def validate_catalog(items):
    if not isinstance(items, list) or not items:
        raise ValueError("Empty catalog")
    seen = set()
    for item in items:
        ident = item["id"]
        if not re.fullmatch(r"sb_[a-z0-9_]+", ident) or ident in seen:
            raise ValueError("Duplicate/invalid track ID")
        seen.add(ident)
        if item["artist"] != "Scott Buckley" or item["license"] != "CC BY 4.0" or item["license_url"] != "https://creativecommons.org/licenses/by/4.0/":
            raise ValueError("Missing attribution or license")
        if not official(item["source_page"]) or not official(item["url"]) or not item["url"].lower().endswith(".mp3"):
            raise ValueError("Nonpublisher recording URL")
        if item["group"] not in {"Ambient", "Cinematic"} or not re.fullmatch(r"[A-Za-z0-9 ]+", item["title"]):
            raise ValueError("Invalid collection or file title")
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

def build(items, output, acquire=download, probe=duration):
    validate_catalog(items)
    output = pathlib.Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    records = []
    credits = ["Michel's Life — Optional music pack 01", "", "Extract this ZIP, then select MP3 files in Focus > My music.", "Extrae este ZIP y selecciona los MP3 en Pomodoro > Mi música.", "These are complete publisher MP3s, unmodified. No endorsement implied.", ""]
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
                filename = item["group"] + "/" + item["title"] + " - Scott Buckley.mp3"
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

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    records = build(json.loads(CATALOG.read_text(encoding="utf-8")), args.output)
    print("PACK VERIFIED", len(records), hashlib.sha256(args.output.read_bytes()).hexdigest())
