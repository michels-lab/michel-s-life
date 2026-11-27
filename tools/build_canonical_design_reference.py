#!/usr/bin/env python3
"""Package REAL canonical Chromium UI captures as a read-only design reference.

This never generates replacement UI, declares a visual approval or exercises
native Android/Windows. Missing/invalid input screenshots fail closed.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import struct
import tempfile
import zlib
from pathlib import Path

SCHEMA = "michelslife-ui-design-reference-v1"
SPECS = {
    "desktop-browser": [
        ("dashboard", "08-home-1280x800.png", 1280, 800, 1),
        ("about", "07-about-1280x800-initial.png", 1280, 800, 1),
    ],
    "android-browser": [
        ("dashboard", "sections/dashboard-412.png", 412, 915, 2.625),
        ("about", "sections/about-412.png", 412, 915, 2.625),
        ("contracts", "sections/contracts-412.png", 412, 915, 2.625),
        ("statistics", "sections/stats-412.png", 412, 915, 2.625),
    ],
}
SHA = re.compile(r"^[a-fA-F0-9]{40}$")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fd:
        for block in iter(lambda: fd.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def png_size(path: Path) -> tuple[int, int]:
    """Read every PNG chunk with exact length/CRC/IEND validation."""
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    pos, dims, ended = 8, None, False
    while pos + 12 <= len(data):
        size = struct.unpack(">I", data[pos:pos + 4])[0]
        name = data[pos + 4:pos + 8]
        end = pos + 12 + size
        if end > len(data):
            raise ValueError("truncated PNG chunk")
        buf = data[pos + 4:pos + 8 + size]
        recorded = struct.unpack(">I", data[pos + 8 + size:end])[0]
        if zlib.crc32(buf) != recorded:
            raise ValueError("PNG chunk CRC mismatch")
        if dims is None:
            if name != b"IHDR" or size != 13:
                raise ValueError("invalid PNG header")
            dims = struct.unpack(">II", data[pos + 8:pos + 16])
            if dims[0] < 320 or dims[1] < 320:
                raise ValueError("implausible UI screenshot dimensions")
        pos = end
        if name == b"IEND":
            if size != 0 or pos != len(data):
                raise ValueError("invalid PNG ending/trailing bytes")
            ended = True
            break
    if not ended or dims is None:
        raise ValueError("PNG lacks complete IEND")
    return dims


def build(root: Path, bundle: Path, commit: str, platform: str) -> dict:
    if platform not in SPECS:
        raise ValueError("invalid platform")
    if not SHA.fullmatch(commit):
        raise ValueError("requires exact 40-character checked-out commit")
    if not bundle.is_file() or bundle.stat().st_size < 100:
        raise ValueError("canonical generated AppBundle unavailable")
    if not root.is_dir():
        raise ValueError("canonical screenshot directory unavailable")
    captures = []
    for surface, rel, w_css, h_css, dpr in SPECS[platform]:
        path = root / rel
        if not path.is_file():
            raise ValueError("missing REAL canonical screenshot: " + rel)
        w, h = png_size(path)
        if abs(w - round(w_css * dpr)) > 1 or abs(h - round(h_css * dpr)) > 1:
            raise ValueError(f"{rel}: wrong viewport/DPR: {w}x{h}, expected {w_css}x{h_css}@{dpr}")
        captures.append({
            "surface": surface,
            "path": rel,
            "viewport_css": {"width": w_css, "height": h_css},
            "device_pixel_ratio": dpr,
            "screenshot_pixels": {"width": w, "height": h},
            "sha256": sha256(path),
            "capture_method": "running-canonical-chromium",
            "is_owner_approved": False,
        })
    return {
        "schema": SCHEMA,
        "product": "Michel's Life",
        "canonical_repository": "michels-lab/michel-s-life",
        "source_commit": commit,
        "platform": platform,
        "generated_bundle_sha256": sha256(bundle),
        "status": "REFERENCE_ONLY_NOT_VISUAL_APPROVAL",
        "source_is_test_fixture_with_no_personal_account": True,
        "native_android_or_windows_evidence": False,
        "captures": captures,
        "notes": "These are unchanged browser captures from existing CI tests. They do not certify release, user acceptance, physical-device QA, or design superiority."
    }


def index_html(manifest: dict) -> str:
    cards = []
    for cap in manifest["captures"]:
        name = html.escape(cap["surface"])
        path = html.escape(cap["path"], quote=True)
        size = cap["viewport_css"]
        cards.append(
            f'<figure><a href="{path}" target="_blank" rel="noopener">'
            f'<img src="{path}" loading="lazy" alt="Current canonical {name}"></a>'
            f'<figcaption>{name.title()} — {size["width"]}×{size["height"]} CSS px'
            f' · SHA256 {cap["sha256"][:12]}…</figcaption></figure>'
        )
    title = html.escape(manifest["product"])
    commit = html.escape(manifest["source_commit"])
    platform = html.escape(manifest["platform"])
    return (
        '<!doctype html><html lang="en"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<meta name="robots" content="noindex,nofollow">'
        f'<title>{title} — existing UI reference</title>'
        '<style>body{font:15px/1.5 system-ui;background:#111823;color:#e4edf7;margin:0;padding:24px}'
        'p{max-width:920px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(350px,100%),1fr));gap:18px}'
        'figure{background:#1a2736;border:1px solid #36465b;border-radius:14px;margin:0;padding:10px}'
        'img{width:100%;height:auto;max-height:600px;object-fit:contain;display:block}'
        'a{display:block}figcaption{padding:10px}code{overflow-wrap:anywhere}</style>'
        f'<h1>{title} — current UI, not a new design</h1>'
        f'<p>Platform: {platform}. Exact code commit: <code>{commit}</code>. '
        'Captures from a synthetic-data Chromium smoke test. This is not owner approval, native '
        'device evidence or a release. Compare at matching viewports before proposing redesigns.</p>'
        '<main>' + "".join(cards) + '</main></html>'
    )


def png_fixture(w: int, h: int) -> bytes:
    def chunk(t: bytes, payload: bytes) -> bytes:
        data = t + payload
        return struct.pack(">I", len(payload)) + data + struct.pack(">I", zlib.crc32(data))
    row = b"\x00" + b"\x10\x20\x30" * w
    return (b"\x89PNG\r\n\x1a\n" +
            chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) +
            chunk(b"IDAT", zlib.compress(row * h)) + chunk(b"IEND", b""))


def self_test():
    count = 0
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        bundle = root / "AppBundle.zip"
        bundle.write_bytes(b"fake-source-fixture" * 10)
        for platform in SPECS:
            for _, rel, w, h, dpr in SPECS[platform]:
                out = root / rel
                out.parent.mkdir(parents=True, exist_ok=True)
                out.write_bytes(png_fixture(round(w * dpr), round(h * dpr)))
            good = build(root, bundle, "a" * 40, platform)
            assert good["status"] == "REFERENCE_ONLY_NOT_VISUAL_APPROVAL"
            assert len(good["captures"]) == len(SPECS[platform])
            assert "not a new design" in index_html(good)
            count += 1
            _, rel, w, h, dpr = SPECS[platform][0]
            shot = root / rel
            contents = shot.read_bytes()
            shot.write_bytes(contents[:-8])
            try:
                build(root, bundle, "a" * 40, platform)
                raise AssertionError("truncated screenshot accepted")
            except ValueError as exc:
                assert "IEND" in str(exc) or "chunk" in str(exc)
            shot.write_bytes(contents)
            count += 1
            shot.write_bytes(png_fixture(320, 320))
            try:
                build(root, bundle, "a" * 40, platform)
                raise AssertionError("wrong viewport accepted")
            except ValueError as exc:
                assert "wrong viewport" in str(exc)
            shot.write_bytes(contents)
            count += 1
            shot.unlink()
            try:
                build(root, bundle, "a" * 40, platform)
                raise AssertionError("missing screenshot accepted")
            except ValueError as exc:
                assert "missing REAL" in str(exc)
            shot.write_bytes(contents)
            count += 1
            corrupted = bytearray(contents)
            corrupted[44] ^= 0xFF
            shot.write_bytes(corrupted)
            try:
                build(root, bundle, "a" * 40, platform)
                raise AssertionError("CRC-damaged screenshot accepted")
            except ValueError as exc:
                assert "CRC mismatch" in str(exc)
            shot.write_bytes(contents)
            count += 1
    print(f"PASS {count} synthetic canonical-design-reference fixtures (2 positive + 8 negative)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--platform", choices=sorted(SPECS))
    parser.add_argument("--directory", type=Path)
    parser.add_argument("--bundle", type=Path)
    parser.add_argument("--commit")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    if not all((args.platform, args.directory, args.bundle, args.commit)):
        parser.error("--platform, --directory, --bundle and --commit required")
    try:
        data = build(args.directory, args.bundle, args.commit, args.platform)
        (args.directory / "design-baseline.json").write_text(
            json.dumps(data, indent=2) + "\n", encoding="utf-8")
        (args.directory / "design-baseline.html").write_text(index_html(data), encoding="utf-8")
    except (OSError, ValueError) as exc:
        parser.exit(1, f"FAIL: {exc}\n")
    print(f"PASS canonical reference {args.platform}: {len(data['captures'])} REAL matching captures")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
