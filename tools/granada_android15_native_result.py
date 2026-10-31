#!/usr/bin/env python3
"""Fail-closed read-only summary of a REAL installed debug APK native smoke.

This consumes screenshots and sanitized native CDP comparisons already produced
by android/tools/smoke_candidate_apk_install.sh; it never accesses accounts,
signing keys, personal localStorage or other app data.
"""
import argparse
import hashlib
import json
import pathlib
import re
import struct
import sys
import zlib

FRAMES = (
    "step0.png",
    "step0-after-30s.png",
    "step0-after-55s.png",
    "step2-after-native-continue.png",
    "step3-after-native-continue.png",
    "step4-after-native-finish.png",
    "step4-after-native-finish-30s.png",
    "step5-after-relaunch.png",
    "step5-after-relaunch-30s.png",
    "step5-after-relaunch-60s.png",
)
REPORTS = (
    "native-canonical-persistence-comparison.json",
    "native-canonical-second-relaunch-comparison.json",
    "native-canonical-consecutive-relaunch-comparison.json",
)
CHECKS = frozenset((
    "mission_ids_identical",
    "collections_identical",
    "dashboard_kpis_identical",
    "mission_counts_identical",
    "onboarding_completed_both",
))
SENSITIVE = re.compile(r"token|secret|password|email|credential|localstorage|refresh", re.I)

def safe_png(path):
    data = path.read_bytes()
    if len(data) < 30000 or len(data) > 30_000_000 or data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("invalid native PNG")
    pos, chunks, done = 8, [], False
    while pos < len(data):
        if pos + 12 > len(data):
            raise ValueError("truncated PNG chunk")
        n = struct.unpack_from(">I", data, pos)[0]
        kind = data[pos+4:pos+8]
        if n > 25_000_000 or pos+n+12 > len(data):
            raise ValueError("oversize/truncated PNG")
        payload = data[pos+8:pos+8+n]
        crc = struct.unpack_from(">I", data, pos+8+n)[0]
        if zlib.crc32(kind+payload) & 0xffffffff != crc:
            raise ValueError("PNG CRC invalid")
        if not chunks and (kind != b"IHDR" or n != 13):
            raise ValueError("PNG missing initial IHDR")
        if kind == b"IHDR":
            if chunks or n != 13:
                raise ValueError("duplicate/invalid IHDR")
            width, height = struct.unpack_from(">II", payload)
            if not (100 <= width <= 10000 and 100 <= height <= 10000):
                raise ValueError("PNG dimensions implausible")
        chunks.append(kind)
        pos += 12+n
        if kind == b"IEND":
            if n != 0 or pos != len(data):
                raise ValueError("bad PNG IEND or trailing bytes")
            done = True
            break
    if not done or b"IDAT" not in chunks:
        raise ValueError("PNG missing IDAT/IEND")
    return (width, height)

def reject_sensitive(value):
    if isinstance(value, dict):
        for k, v in value.items():
            if SENSITIVE.search(str(k)):
                raise ValueError("sensitive key in native evidence")
            reject_sensitive(v)
    elif isinstance(value, list):
        for v in value:
            reject_sensitive(v)

def validate(root, apk, source_sha, version):
    if not re.fullmatch(r"[0-9a-f]{40}", source_sha):
        raise ValueError("invalid exact source SHA")
    if not apk.is_file() or apk.stat().st_size < 100_000:
        raise ValueError("actual debug APK missing")
    with apk.open("rb") as handle:
        apk_digest = hashlib.file_digest(handle, "sha256").hexdigest()
    # The native runner must consume the exact APK built from this checkout.
    # A hash alone computed after the fact does not bind a binary to the run.
    pinned_source = (root/"current-source-commit.txt").read_text(encoding="utf-8").strip()
    if pinned_source != source_sha:
        raise ValueError("native candidate source SHA does not match checkout")
    checksum_line = (root/"current-source-apk.sha256").read_text(encoding="utf-8").strip()
    checksum_parts = checksum_line.split(maxsplit=1)
    if (len(checksum_parts) != 2 or
            not re.fullmatch(r"[0-9a-f]{64}", checksum_parts[0]) or
            checksum_parts[0] != apk_digest or
            checksum_parts[1].lstrip("*") != apk.as_posix()):
        raise ValueError("native candidate artifact SHA256 or filename mismatch")
    package_info = (root/"package-info.txt").read_text(encoding="utf-8")
    if not re.search(r"Package \[com\.michelslab\.michelslife\]", package_info):
        raise ValueError("installed package identity mismatch")
    if f"versionName={version}" not in package_info:
        raise ValueError("installed version mismatch")
    first_pid = (root/"process-id.txt").read_text().strip()
    second_pid = (root/"relaunch-process-id.txt").read_text().strip()
    if not (first_pid.isdigit() and second_pid.isdigit() and int(first_pid)>0 and int(second_pid)>0):
        raise ValueError("native application PID evidence missing")
    if first_pid == second_pid:
        raise ValueError("initial and first cold-relaunch PIDs reused")

    dimensions = {safe_png(root/name) for name in FRAMES}
    if len(dimensions) != 1:
        raise ValueError("native frames disagree on dimensions")
    states = []
    for name in REPORTS:
        report = json.loads((root/name).read_text(encoding="utf-8"))
        reject_sensitive(report)
        checks = report.get("checks")
        if report.get("pass") is not True or not isinstance(checks,dict) or set(checks) != CHECKS:
            raise ValueError("missing or failed native canonical comparison")
        if any(checks[k] is not True for k in CHECKS):
            raise ValueError("one or more native canonical checks failed")
        before, after = report.get("before"), report.get("after")
        if not isinstance(before,dict) or not isinstance(after,dict):
            raise ValueError("native snapshots missing")
        states.append((before,after))
    # before -> first restart -> second restart, verified three separate ways.
    first, second, consecutive = states
    if not (first[0] == second[0] and
            first[1] == consecutive[0] and
            second[1] == consecutive[1] and
            first[0] == first[1] == second[1]):
        raise ValueError("native comparison reports are contradictory")

    return {
        "status": "PASS",
        "scope": "installed Android 15 debug APK synthetic onboarding and two real force-stop relaunches",
        "source_sha": source_sha,
        "apk_sha256": apk_digest,
        "frame_count": len(FRAMES),
        "canonical_comparisons": len(REPORTS),
        "dimensions": list(dimensions.pop()),
        "limitations": "not Android 16, signed APK, Galaxy, Play, live account or provider proof",
    }

def failure_stage(root):
    """Sanitized stage category. File existence is diagnostic, NEVER acceptance."""
    if not (root/"step0.png").is_file():
        return "first_native_frame_unavailable"
    if not (root/"step4-after-native-finish.png").is_file():
        return "onboarding_navigation_incomplete"
    if not (root/"native-state-before.json").is_file():
        return "onboarding_finish_state_unverified"
    if not (root/"native-state-after.json").is_file():
        return "first_relaunch_state_unverified"
    if not (root/"native-state-after-second-relaunch.json").is_file():
        return "second_relaunch_state_unverified"
    return "native_evidence_or_comparison_invalid"

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--evidence", required=True, type=pathlib.Path)
    p.add_argument("--apk", required=True, type=pathlib.Path)
    p.add_argument("--source-sha", required=True)
    p.add_argument("--version", required=True)
    p.add_argument("--output", required=True, type=pathlib.Path)
    a = p.parse_args()
    try:
        result = validate(a.evidence, a.apk, a.source_sha, a.version)
        a.output.parent.mkdir(parents=True, exist_ok=True)
        a.output.write_text(json.dumps(result,sort_keys=True,indent=2)+"\n")
        print("GRANADA_ANDROID15_NATIVE",json.dumps(result,sort_keys=True))
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as err:
        # Even a missing QEMU-created artifact must yield machine-readable
        # evidence. Do not serialize exception paths, screenshots, CDP state,
        # journal content, credentials, or raw Android WebView output.
        reason = (
            str(err)[:180] if isinstance(err, ValueError)
            else "required_native_evidence_missing_or_invalid"
        )
        result = {
            "status": "FAIL",
            "reason": reason,
            "source_sha": a.source_sha if re.fullmatch(r"[0-9a-f]{40}",a.source_sha) else "",
            "native_accepted": False,
            "failure_stage": failure_stage(a.evidence),
            "scope": "Android15 installed-APK persistence gate",
        }
        try:
            a.output.parent.mkdir(parents=True, exist_ok=True)
            a.output.write_text(json.dumps(result,sort_keys=True,indent=2)+"\n")
        except OSError:
            # Still fail hard, even if the GitHub artifact folder is unusable.
            pass
        print("GRANADA_ANDROID15_NATIVE",json.dumps(result,sort_keys=True),file=sys.stderr)
        sys.exit(1)
