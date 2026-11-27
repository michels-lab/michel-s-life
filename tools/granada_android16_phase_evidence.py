#!/usr/bin/env python3
"""Fail-closed, non-personal Android16 native phase evidence/manifest.

Only accepts real CRC-valid PNG frames collected from the emulator, records
their SHA256 digests, and NEVER infers signed-device app persistence.
"""
import argparse
import hashlib
import json
import re
import struct
import zlib
from pathlib import Path

PHASES = ("baseline", "installed-idle", "launched")
PNG = b"\x89PNG\r\n\x1a\n"
COMMIT = re.compile(r"^[0-9a-f]{40}$")


def png_info(path):
    raw = Path(path).read_bytes()
    if len(raw) < 100 or len(raw) > 8_000_000 or not raw.startswith(PNG):
        raise ValueError("invalid_png_signature_or_size")
    n, dims, finish = 8, None, False
    while n + 12 <= len(raw):
        size = struct.unpack_from(">I", raw, n)[0]
        if size > 8_000_000 or n + size + 12 > len(raw):
            raise ValueError("truncated_native_png")
        kind = raw[n + 4:n + 8]
        data = raw[n + 8:n + 8 + size]
        given = struct.unpack_from(">I", raw, n + 8 + size)[0]
        if zlib.crc32(kind + data) & 0xffffffff != given:
            raise ValueError("native_png_crc_mismatch")
        if kind == b"IHDR":
            if dims is not None or len(data) != 13:
                raise ValueError("bad_png_header")
            dims = struct.unpack_from(">II", data)
            if not (240 <= dims[0] <= 4096 and 400 <= dims[1] <= 4096):
                raise ValueError("unexpected_native_screen_resolution")
        n += size + 12
        if kind == b"IEND":
            if size != 0 or n != len(raw):
                raise ValueError("extra_bytes_after_native_png")
            finish = True
            break
    if dims is None or not finish:
        raise ValueError("native_png_missing_end")
    return {"sha256": hashlib.sha256(raw).hexdigest(), "width": dims[0], "height": dims[1]}


def report(root, source_sha):
    if not COMMIT.fullmatch(source_sha):
        raise ValueError("invalid_exact_source_sha")
    root = Path(root)
    if not root.exists() or not root.is_dir():
        raise ValueError("evidence_root_missing")
    total, phases = 0, []
    for stage in PHASES:
        frames = []
        for i in range(1, 9):
            path = root / f"{stage}-{i}.png"
            if not path.is_file() or path.is_symlink():
                raise ValueError("missing_real_native_frame")
            frames.append({"sample": i, **png_info(path)})
            total += 1
        phases.append({"name": stage, "frames": frames, "count": 8})
    if (root / "failed-stage.txt").exists() or (
            not (root / "phases-complete.txt").is_file() or
            (root / "phases-complete.txt").read_text().strip() != "complete"):
        raise ValueError("phase_incomplete_or_failed")
    extras = sorted(p.name for p in root.glob("*.png") if p.name not in {
        f"{phase}-{i}.png" for phase in PHASES for i in range(1, 9)
    })
    if extras:
        raise ValueError("unknown_extra_native_frame")
    return {
        "schema": "mlv.granada.android16.install_launch_isolation.v1",
        "source_sha": source_sha,
        "mode": "official_published_apk_3_native_phases",
        "status": "PASS",
        "native_frame_count": total,
        "evidence": phases,
        "physical_galaxy_verified": False,
        "canonical_account_persistence_verified": False,
        "signed_release_created": False,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True)
    p.add_argument("--source-sha", required=True)
    p.add_argument("--output", required=True)
    a = p.parse_args()
    out = Path(a.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        result = report(Path(a.root), a.source_sha)
    except (OSError, ValueError, struct.error) as e:
        result = {
            "schema": "mlv.granada.android16.install_launch_isolation.v1",
            "status": "FAIL",
            "category": str(e) if str(e) in {
                "missing_real_native_frame", "phase_incomplete_or_failed",
                "evidence_root_missing", "invalid_exact_source_sha",
                "invalid_png_signature_or_size", "native_png_crc_mismatch",
                "truncated_native_png", "bad_png_header",
                "unexpected_native_screen_resolution", "extra_bytes_after_native_png",
                "native_png_missing_end", "unknown_extra_native_frame"} else "invalid_evidence",
            "native_frame_count": 0,
            "canonical_account_persistence_verified": False,
            "physical_galaxy_verified": False,
            "signed_release_created": False,
        }
    out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print("GRANADA_ANDROID16_PHASE_EVIDENCE " + result["status"])
    if result["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
