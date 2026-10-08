#!/usr/bin/env python3
"""Fail closed on Android Direct distribution version/signature drift.

The expected certificate SHA-256 is a public fingerprint pinned in GitHub
Actions Variables, not a private signing key. Never accept a CI-generated
Android Debug certificate as a stable direct update.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess


def normalized_fingerprint(value: str) -> str:
    clean = re.sub(r"[^0-9a-f]", "", value.lower())
    if len(clean) != 64:
        raise ValueError("Expected signing certificate SHA-256 must have 64 hex characters")
    return clean


def extract_signing_certificate(report: str) -> tuple[str, str]:
    matches = re.findall(
        r"^Signer #(\d+) certificate SHA-256 digest:\s*([0-9a-fA-F: ]+)$",
        report,
        re.MULTILINE,
    )
    if len(matches) != 1 or matches[0][0] != "1":
        raise ValueError("Expected exactly one Android APK signing certificate")
    subjects = re.findall(
        r"^Signer #1 certificate DN:\s*(.+)$", report, re.MULTILINE
    )
    if len(subjects) != 1:
        raise ValueError("APK signer subject missing or ambiguous")
    if re.search(r"CN\s*=\s*Android Debug", subjects[0], re.IGNORECASE):
        raise ValueError("Android Debug signing is forbidden for direct releases")
    return normalized_fingerprint(matches[0][1]), subjects[0].strip()


def extract_package_info(badging: str) -> tuple[str, int, str]:
    match = re.search(
        r"^package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'",
        badging,
        re.MULTILINE,
    )
    if not match:
        raise ValueError("Could not inspect compiled APK package name/version")
    return match[1], int(match[2]), match[3]


def self_test() -> None:
    valid = (
        "Signer #1 certificate DN: CN=Michel's Lab, O=Michel's Lab, C=MX\n"
        "Signer #1 certificate SHA-256 digest: "
        + "ab" * 32
        + "\n"
    )
    assert extract_signing_certificate(valid)[0] == "ab" * 32
    assert extract_package_info(
        "package: name='com.michelslab.michelslife' "
        "versionCode='4' versionName='0.2.2'\n"
    ) == ("com.michelslab.michelslife", 4, "0.2.2")
    for text in [
        valid.replace("CN=Michel's Lab", "CN=Android Debug"),
        "Signer #1 certificate DN: CN=Android Debug\n"
        "Signer #1 certificate SHA-256 digest: " + "ab" * 32 + "\n",
    ]:
        try:
            extract_signing_certificate(text)
        except ValueError:
            continue
        raise AssertionError("Debug signing was accepted as stable")
    print("OK: signing policy correctly rejects debug cert and parses version")


def command(*args: str) -> str:
    return subprocess.run(
        args, text=True, capture_output=True, check=True
    ).stdout


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--apk", type=Path)
    p.add_argument("--apksigner", default="apksigner")
    p.add_argument("--aapt", default="aapt")
    p.add_argument("--expected-cert-sha256")
    p.add_argument("--version-name")
    p.add_argument("--version-code", type=int)
    p.add_argument("--manifest-output", type=Path)
    p.add_argument("--self-test", action="store_true")
    args = p.parse_args()
    if args.self_test:
        self_test()
        return
    if not all(
        [
            args.apk, args.expected_cert_sha256, args.version_name,
            args.version_code, args.manifest_output,
        ]
    ):
        p.error("APK, pinned signing SHA, version and output manifest are required")

    expected = normalized_fingerprint(args.expected_cert_sha256)
    actual, signer_subject = extract_signing_certificate(
        command(args.apksigner, "verify", "--verbose", "--print-certs", str(args.apk))
    )
    if actual != expected:
        raise SystemExit(
            "REJECTED: Android Direct signing certificate changed! "
            f"expected={expected} actual={actual}. "
            "Never silently rotate signing keys."
        )
    package, code, name = extract_package_info(
        command(args.aapt, "dump", "badging", str(args.apk))
    )
    if (package, code, name) != (
        "com.michelslab.michelslife", args.version_code, args.version_name
    ):
        raise SystemExit(
            f"REJECTED: Wrong Android package/version {package} {code} {name}"
        )
    digest = hashlib.sha256(args.apk.read_bytes()).hexdigest()
    output = args.manifest_output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(
            {
                "product": "Michel's Life",
                "platform": "android",
                "channel": "direct",
                "distribution": "production-signed",
                "package": package,
                "versionName": name,
                "versionCode": code,
                "apkFilename": args.apk.name,
                "sha256": digest,
                "signerCertSha256": actual,
                "signerSubject": signer_subject,
                "sourceSha": os.environ.get("GITHUB_SHA", "local"),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"PASS: production-signed {package} v{name} code {code}")
    print(f"APK SHA-256: {digest}")
    print(f"Signer certificate SHA-256: {actual}")


if __name__ == "__main__":
    main()
