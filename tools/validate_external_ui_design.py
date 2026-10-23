#!/usr/bin/env python3
"""Fail-closed opt-in gate for EXTERNAL Michel's Life UI proposals, not regular app releases.

A signed-off design candidate must show the approved baseline and proposed change
in real PNG captures of the same app surface and viewport. All evidence is local.
Self-tests use synthetic PNGs; they do NOT validate the actual visual outcome.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import tempfile
import zlib
from pathlib import Path

SCHEMA = "michels-life-external-ui-comparison-v1"
SHA = re.compile(r"^[0-9a-f]{40}$")
HEX64 = re.compile(r"^[0-9a-f]{64}$")
REQUIRED_DASHBOARD = (
    "approved identity and branding",
    "existing navigation and day selector",
    "daily and recurring mission behavior",
    "premium contract progress",
    "statistics",
    "chapter and XP",
    "themes and atmosphere",
    "layout density controls",
    "completed mission retention",
    "fixed About access",
)


def _dimensions(path: Path):
    data = path.read_bytes()
    if len(data) < 33 or data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG capture")
    if data[12:16] != b"IHDR":
        raise ValueError("missing PNG IHDR")
    w, h = struct.unpack(">II", data[16:24])
    if w < 320 or h < 320:
        raise ValueError("capture dimensions too small")
    if len(data) < 60 or b"IEND" not in data:
        raise ValueError("truncated screenshot")
    return (w, h), hashlib.sha256(data).hexdigest()


def validate(doc: dict, base: Path) -> list[str]:
    issues: list[str] = []
    if not isinstance(doc, dict):
        return ["manifest must be a JSON object"]
    if doc.get("schema") != SCHEMA:
        issues.append("unexpected schema")
    if doc.get("source_repository") != "michels-lab/michel-s-life":
        issues.append("candidate must compare canonical Michel's Life repository")
    if not SHA.fullmatch(str(doc.get("source_sha", ""))):
        issues.append("baseline must identify an exact 40-character Git source SHA")
    if doc.get("owner_decision") != "approved":
        issues.append("owner explicit visual approval missing or candidate rejected")
    if not str(doc.get("owner_review_evidence", "")).startswith("https://"):
        issues.append("owner review evidence URL missing")
    if len(str(doc.get("specific_defect", "")).strip()) < 30:
        issues.append("no specific existing UI defect to improve")
    if len(str(doc.get("measurable_improvement", "")).strip()) < 30:
        issues.append("no measurable acceptance target")

    features = doc.get("feature_comparison")
    if not isinstance(features, dict):
        features = {}
    for feature in REQUIRED_DASHBOARD:
        entry = features.get(feature)
        if not isinstance(entry, dict) or entry.get("state") != "preserved" or not entry.get("evidence"):
            issues.append(f"lost or unproven approved feature: {feature}")

    captures: dict[str, dict[tuple[str, int, int], str]] = {"baseline": {}, "candidate": {}}
    for side in ("baseline", "candidate"):
        shots = doc.get(f"{side}_captures")
        if not isinstance(shots, list) or not shots:
            issues.append(f"{side} real screenshots missing")
            continue
        for shot in shots:
            if not isinstance(shot, dict):
                issues.append(f"{side} malformed screenshot")
                continue
            surface, name, digest = shot.get("surface"), shot.get("path"), shot.get("sha256")
            if surface != "dashboard":
                issues.append(f"{side}: missing target dashboard surface")
                continue
            if not HEX64.fullmatch(str(digest)):
                issues.append(f"{side}: missing screenshot SHA256")
                continue
            if not isinstance(name, str) or not name:
                issues.append(f"{side}: path missing")
                continue
            target = (base / name).resolve()
            if not target.is_relative_to(base.resolve()) or not target.is_file():
                issues.append(f"{side}: capture unavailable or outside evidence directory")
                continue
            try:
                (width, height), actual = _dimensions(target)
            except (OSError, ValueError) as exc:
                issues.append(f"{side}: invalid image: {exc}")
                continue
            if actual != digest:
                issues.append(f"{side}: capture SHA256 mismatch")
                continue
            key = (surface, width, height)
            if key in captures[side]:
                issues.append(f"{side}: duplicate surface/viewport")
            captures[side][key] = actual
    pair = set(captures["baseline"]) & set(captures["candidate"])
    if not any(w >= 800 for _, w, _ in pair) or not any(w <= 500 for _, w, _ in pair):
        issues.append("matched desktop and mobile same-viewport screenshot pairs missing")
    for key in pair:
        if captures["baseline"][key] == captures["candidate"][key]:
            issues.append(f"candidate reuses identical baseline capture at {key}")
    if set(captures["baseline"]) != set(captures["candidate"]):
        issues.append("baseline/candidate screenshot viewport coverage differs")
    return issues


def _png(width: int, height: int, pixel: int) -> bytes:
    """Valid tiny synthetic fixture PNG, never a claimed app screenshot."""
    def chunk(label: bytes, buf: bytes) -> bytes:
        return struct.pack(">I", len(buf)) + label + buf + struct.pack(">I", zlib.crc32(label + buf))
    row = b"\x00" + bytes((pixel, pixel, pixel)) * width
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(row * height))
            + chunk(b"IEND", b""))


def self_test() -> None:
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        fixture = {
            "schema": SCHEMA, "source_repository": "michels-lab/michel-s-life",
            "source_sha": "a" * 40, "owner_decision": "approved",
            "owner_review_evidence": "https://example.org/synthetic-owner-test",
            "specific_defect": "Synthetic existing layout problem with measurable scope.",
            "measurable_improvement": "Synthetic measurable target for layout preservation.",
            "feature_comparison": {k: {"state": "preserved", "evidence": "synthetic-test"} for k in REQUIRED_DASHBOARD},
        }
        for side, color in (("baseline", 24), ("candidate", 75)):
            fixture[f"{side}_captures"] = []
            for w, h in ((1280, 800), (390, 844)):
                name = f"{side}-{w}.png"
                data = _png(w, h, color)
                (root / name).write_bytes(data)
                fixture[f"{side}_captures"].append({"surface": "dashboard", "path": name,
                                                     "sha256": hashlib.sha256(data).hexdigest()})
        assert not validate(fixture, root), "complete synthetic fixture should pass"

        def should_fail(change, expected):
            d = json.loads(json.dumps(fixture))
            change(d)
            bad = validate(d, root)
            assert any(expected in msg for msg in bad), (expected, bad)

        should_fail(lambda d: d.update(owner_decision="rejected"), "owner explicit visual approval")
        should_fail(lambda d: d.pop("baseline_captures"), "baseline real screenshots")
        should_fail(lambda d: d["candidate_captures"].pop(), "matched desktop and mobile")
        should_fail(lambda d: d["feature_comparison"].pop("themes and atmosphere"), "themes and atmosphere")
        should_fail(lambda d: d.update(measurable_improvement="pretty"), "measurable acceptance")
        should_fail(lambda d: d["candidate_captures"][0].update(path="baseline-1280.png",
                    sha256=d["baseline_captures"][0]["sha256"]), "identical baseline capture")
        should_fail(lambda d: d["candidate_captures"][0].update(sha256="0"*64), "capture SHA256 mismatch")
        should_fail(lambda d: d["candidate_captures"][0].update(path="../../secrets.png"),
                    "outside evidence directory")
        print("External UI design comparison guard: PASS 9/9 synthetic cases (8 negative + 1 positive)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    if args.manifest is None:
        parser.error("Supply --manifest FILE or --self-test")
    try:
        doc = json.loads(args.manifest.read_text(encoding="utf-8"))
        errors = validate(doc, args.manifest.parent)
    except (OSError, ValueError) as e:
        errors = [f"cannot parse evidence manifest: {e}"]
    for msg in errors:
        print(f"::error::{msg}")
    if errors:
        print(f"External UI candidate: REJECTED/BLOCKED ({len(errors)} gate violations)")
        return 1
    print("External UI candidate: EVIDENCE COMPLETE (manual owner review still authoritative)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
