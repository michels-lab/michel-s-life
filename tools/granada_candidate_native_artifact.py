#!/usr/bin/env python3
"""Fail-closed provenance for a single exact-checkout Android TEST APK in a RAM A/B matrix."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

NAME = "MichelsLife-Android-TEST-v0.2.9.apk"
SCHEMA = "mlv.granada.single-candidate-ram-ab.v1"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def payload(directory: Path, commit: str) -> dict:
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("invalid_source_sha")
    apk = directory / NAME
    if not apk.is_file() or apk.stat().st_size < 1024:
        raise ValueError("missing_or_tiny_apk")
    return {
        "schema": SCHEMA,
        "source_checkout_sha": commit,
        "candidate_apk_filename": NAME,
        "candidate_apk_sha256": sha256(apk),
        "candidate_apk_bytes": apk.stat().st_size,
        "candidate_kind": "debug_ci_only",
        "signed_public_release": False,
        "real_installed_native_validation": False,
    }


def verify(directory: Path, commit: str) -> dict:
    expected = json.loads((directory / "candidate-provenance.json").read_text())
    actual = payload(directory, commit)
    if expected != actual:
        raise ValueError("apk_digest_or_checkout_mismatch")
    sidecar = (directory / (NAME + ".sha256")).read_text().strip().split()
    if len(sidecar) != 2 or sidecar[0] != actual["candidate_apk_sha256"] or sidecar[1].lstrip("*") != NAME:
        raise ValueError("apk_sha256_sidecar_mismatch")
    return actual


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", required=True)
    parser.add_argument("--source-sha", required=True)
    parser.add_argument("--create", action="store_true")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args(argv)
    if args.create == args.verify:
        parser.error("choose exactly one of --create or --verify")
    directory = Path(args.dir)
    try:
        if args.create:
            result = payload(directory, args.source_sha)
            (directory / "candidate-provenance.json").write_text(json.dumps(result, indent=2) + "\n")
            (directory / (NAME + ".sha256")).write_text(
                result["candidate_apk_sha256"] + "  " + NAME + "\n"
            )
        else:
            result = verify(directory, args.source_sha)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print("GRANADA_CANDIDATE_PROVENANCE FAIL " + type(exc).__name__, file=sys.stderr)
        return 1
    print("GRANADA_CANDIDATE_PROVENANCE PASS " + json.dumps({
        "source_checkout_sha": result["source_checkout_sha"],
        "candidate_apk_sha256": result["candidate_apk_sha256"],
        "candidate_kind": result["candidate_kind"],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
