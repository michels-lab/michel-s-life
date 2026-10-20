#!/usr/bin/env python3
"""GRANADA #23: fail-closed native Android16 A/B framebuffer provenance.

Only hashes and coordinates of CI-generated, no-login emulator captures;
never fabricates a screenshot, marks Android APK installed from browser mocks,
or claims owner Galaxy validation.
"""
import argparse
import binascii
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
from tempfile import TemporaryDirectory
import zlib

NATIVE = "artifacts/emulator-health"
RELEASE = "artifacts/emulator-health-release"
APK_NAME = "MichelsLife-Android-Direct-v0.2.9.apk"
SIGNATURE = b"\x89PNG\r\n\x1a\n"


def sha256(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def png_shape(path):
    data = Path(path).read_bytes()
    if len(data) < 1500 or data[:8] != SIGNATURE:
        raise ValueError("not a complete native PNG screenshot")
    offset = 8
    shape = None
    seen_end = False
    while offset < len(data):
        if offset + 12 > len(data):
            raise ValueError("truncated PNG chunk")
        n = struct.unpack(">I", data[offset:offset + 4])[0]
        typ = data[offset + 4:offset + 8]
        end = offset + 12 + n
        if n > 32 * 1024 * 1024 or end > len(data):
            raise ValueError("invalid PNG chunk length")
        payload = data[offset + 8:end - 4]
        observed_crc = struct.unpack(">I", data[end - 4:end])[0]
        expected_crc = binascii.crc32(typ + payload) & 0xffffffff
        if observed_crc != expected_crc:
            raise ValueError("PNG chunk CRC mismatch")
        if typ == b"IHDR":
            if shape is not None or n != 13:
                raise ValueError("invalid/duplicated PNG header")
            width, height = struct.unpack(">II", payload[:8])
            if width < 300 or height < 400:
                raise ValueError("native screenshot too small")
            shape = (width, height)
        elif typ == b"IEND":
            if n != 0 or end != len(data):
                raise ValueError("PNG contains unexpected bytes after end")
            seen_end = True
        offset = end
    if shape is None or not seen_end:
        raise ValueError("missing PNG header or terminal chunk")
    return shape


def make_manifest(root, source_sha):
    root = Path(root)
    evidence = root / NATIVE
    release = root / RELEASE
    problems = []
    frames = []
    if not re.fullmatch(r"[0-9a-f]{40}", source_sha or ""):
        problems.append("checkout SHA is missing or invalid")
    report_file = evidence / "result.env"
    values = {}
    if report_file.is_file():
        for line in report_file.read_text(encoding="utf-8").splitlines():
            if "=" in line:
                key, value = line.split("=", 1)
                values[key] = value
    else:
        problems.append("native emulator probe did not write result.env")
    if not (values.get("result") == "PASS" and values.get("exit_code") == "0" and
            values.get("last_phase") == "installed" and values.get("last_sample") == "8"):
        problems.append("native emulator probe did not complete both phases")

    apk = release / APK_NAME
    expected_sidecar = release / (APK_NAME + ".sha256")
    official_apk_sha = None
    if apk.is_file() and expected_sidecar.is_file():
        expected_hash = expected_sidecar.read_text(encoding="utf-8").strip().split()
        if len(expected_hash) != 2 or expected_hash[1].lstrip("*") != APK_NAME:
            problems.append("official APK checksum manifest is malformed")
        else:
            official_apk_sha = sha256(apk)
            if expected_hash[0].lower() != official_apk_sha:
                problems.append("installed APK does not match published SHA256")
    else:
        problems.append("published signed APK or its SHA256 sidecar is missing")

    # The named files come from real ADB exec-out screencap captures.
    for phase in ("baseline", "installed"):
        for sample in range(1, 9):
            filename = f"frame-{phase}-{sample}.png"
            path = evidence / filename
            if not path.is_file():
                problems.append(f"missing real native frame {filename}")
                continue
            try:
                width, height = png_shape(path)
            except (ValueError, OSError) as exc:
                problems.append(f"invalid real native frame {filename}: {exc}")
                continue
            frames.append({"phase": phase, "sample": sample,
                           "path": str(path.relative_to(root)),
                           "sha256": sha256(path), "bytes": path.stat().st_size,
                           "width": width, "height": height})

    if len(frames) != 16:
        problems.append(f"only {len(frames)}/16 native frames verified")
    return {
        "schema": "michelslab.android16.native-frame-evidence.v1",
        "source_checkout_sha": source_sha,
        "public_release": "v3.0.221",
        "public_android_direct": "0.2.9",
        "apk_filename": APK_NAME,
        "verified_apk_sha256": official_apk_sha,
        "runtime": "hosted Android 16 Google APIs emulator (not owner Galaxy)",
        "observed_phases": ["baseline", "installed"],
        "result": "PASS" if not problems else "FAIL",
        "native_frames": frames,
        "errors": problems,
        "owner_post_release_visual_review": "PENDING",
        "physical_device_tested": False,
    }


def create_test_png():
    def chunk(label, data):
        return (struct.pack(">I", len(data)) + label + data +
                struct.pack(">I", binascii.crc32(label + data) & 0xffffffff))
    width, height = 400, 500
    image = (b"\x00" + b"\x00\x00\x00" * width) * height
    return (SIGNATURE +
            chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)) +
            chunk(b"tEXt", b"synthetic=" + b"x" * 1750) +
            chunk(b"IDAT", zlib.compress(image, 6)) + chunk(b"IEND", b""))


def self_test():
    with TemporaryDirectory() as temp:
        base = Path(temp)
        native = base / NATIVE
        release = base / RELEASE
        native.mkdir(parents=True)
        release.mkdir(parents=True)
        (native / "result.env").write_text(
            "result=PASS\nexit_code=0\nlast_phase=installed\nlast_sample=8\n",
            encoding="utf-8")
        apk = release / APK_NAME
        apk.write_bytes(b"synthetic apk fixture; not a signed user artifact")
        (release / (APK_NAME + ".sha256")).write_text(
            f"{sha256(apk)}  {APK_NAME}\n", encoding="utf-8")
        for phase in ("baseline", "installed"):
            for i in range(1, 9):
                (native / f"frame-{phase}-{i}.png").write_bytes(create_test_png())
        sha = "a" * 40
        good = make_manifest(base, sha)
        assert good["result"] == "PASS" and len(good["native_frames"]) == 16
        victim = native / "frame-installed-8.png"
        victim.write_bytes(victim.read_bytes()[:-15])
        bad = make_manifest(base, sha)
        assert bad["result"] == "FAIL" and len(bad["native_frames"]) == 15
        corrupted = bytearray(create_test_png())
        corrupted[200] ^= 0x01
        victim.write_bytes(corrupted)
        crc_bad = make_manifest(base, sha)
        assert crc_bad["result"] == "FAIL" and any(
            "CRC" in problem for problem in crc_bad["errors"])
        victim.write_bytes(create_test_png())
        apk.write_bytes(apk.read_bytes() + b"tampered")
        bad = make_manifest(base, sha)
        assert bad["result"] == "FAIL" and any("SHA256" in p for p in bad["errors"])
        (native / "result.env").write_text("result=FAILED\nexit_code=1\n", encoding="utf-8")
        assert make_manifest(base, sha)["result"] == "FAIL"
    print("PASS: 16-frame SHA/PNG provenance + missing/CRC/truncated/tampered APK failure gates")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--source-sha", default=os.environ.get("GITHUB_SHA", ""))
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    result = make_manifest(args.root, args.source_sha)
    path = Path(args.root) / NATIVE / "provenance.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Native A/B provenance: {result['result']} "
          f"{len(result['native_frames'])}/16 PNGs; "
          f"sha={result['source_checkout_sha']}; errors={result['errors']}")
    return 0 if result["result"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
