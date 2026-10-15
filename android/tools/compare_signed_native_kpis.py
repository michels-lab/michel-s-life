#!/usr/bin/env python3
"""Compare visible mission/contract KPI crops in REAL Android 16 screenshots.

The nondebuggable signed Direct APK must never expose CDP/localStorage.
Instead, compare its pinned Pixel 6 dashboard number regions to a SAME-SOURCE
debug APK whose canonical persisted state was independently verified via CDP.
This is corroborating visual evidence, NOT a signed internal-state export.
"""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

EXPECTED_SIZE = (1080, 2400)
# Fixed Android 16 Pixel 6 emulator and app layout. Coordinates were measured
# from the actual Oct 15 native Dashboard captures; fail on other geometry.
ROIS = {
    "todays_missions_count": (70, 1044, 216, 1133),
    "premium_contracts_count": (572, 1044, 713, 1133),
}
MAX_MEAN_DELTA = 2.0
MAX_HIGH_CONTRAST_PIXELS = 0.015
MAX_VERTICAL_LAYOUT_SHIFT = 24  # 16 px observed across native time-card relayout


def crops(path):
    with Image.open(path) as original:
        if original.size != EXPECTED_SIZE:
            raise ValueError(f"Unexpected installed emulator pixel geometry: {original.size}")
        image = original.convert("RGB")
    result = {name: image.crop(rect) for name, rect in ROIS.items()}
    for name, crop in result.items():
        std = ImageStat.Stat(crop.convert("L")).stddev[0]
        if std < 22:
            raise ValueError(f"{name}: missing nontrivial Dashboard KPI glyphs (std={std:.2f})")
    return result


def compare(a, b, label):
    # A real Android 16 Oct-15 test proved exact canonical data persistence
    # while the time-of-day card moved the ENTIRE KPI row 16 physical pixels.
    # Align both KPI crops together with ONE bounded vertical offset; never
    # warp individual glyphs or permit arbitrary per-KPI matches.
    left, right = crops(a), crops(b)  # validates geometry and nonempty glyphs
    with Image.open(b) as source:
        target = source.convert("RGB")
    candidates = []
    for dy in range(-MAX_VERTICAL_LAYOUT_SHIFT, MAX_VERTICAL_LAYOUT_SHIFT + 1):
        scores = []
        for name, rect in ROIS.items():
            shifted = (rect[0], rect[1] + dy, rect[2], rect[3] + dy)
            difference = ImageChops.difference(left[name], target.crop(shifted))
            scores.append(sum(ImageStat.Stat(difference).mean) / 3)
        candidates.append((sum(scores) / len(scores), abs(dy), dy))
    _, _, best_shift = min(candidates)
    result = {}
    for name, rect in ROIS.items():
        shifted = (rect[0], rect[1] + best_shift, rect[2], rect[3] + best_shift)
        difference = ImageChops.difference(left[name], target.crop(shifted))
        mean = sum(ImageStat.Stat(difference).mean) / 3
        gray = difference.convert("L")
        histogram = gray.histogram()
        changed = sum(histogram[26:]) / sum(histogram)
        result[name] = {
            "verticalAlignmentPixels": best_shift,
            "meanPixelDifference": round(mean, 4),
            "fractionHighContrastDifference": round(changed, 6),
            "pass": mean <= MAX_MEAN_DELTA and changed <= MAX_HIGH_CONTRAST_PIXELS,
        }
    return {"comparison": label, "regions": result,
            "pass": all(x["pass"] for x in result.values())}


def main(debug_before, debug_after, signed_before, signed_after, output):
    checks = [
        compare(debug_before, debug_after, "source-debug-first-relaunch"),
        compare(debug_before, signed_before, "source-debug-vs-signed-before"),
        compare(debug_after, signed_after, "source-debug-vs-signed-after"),
        compare(signed_before, signed_after, "signed-first-relaunch"),
    ]
    summary = {
        "scope": "Visible KPIs in exact-source native Android 16 debuggable and signed APK screenshots",
        "limitation": "Does not inspect or certify canonical state INSIDE nondebuggable signed APK; physical Galaxy and live provider not tested",
        "checks": checks,
        "pass": all(x["pass"] for x in checks)
    }
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    Path(output).write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    if not summary["pass"]:
        problems = [x["comparison"] + "/" + n
                    for x in checks for n, v in x["regions"].items() if not v["pass"]]
        raise SystemExit("Signed native Dashboard KPI visual drift: " + ", ".join(problems))
    print("PASS: Signed Direct Android 16 visible mission/contract totals match same-source debug APK and remain stable after real native force-stop")


def self_test():
    # No OCR or user data: verify empty/unrendered regions cannot pass, then
    # prove changed pixel values in either count region are rejected.
    from PIL import ImageDraw
    from tempfile import TemporaryDirectory
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        first = Image.new("RGB", EXPECTED_SIZE, (25, 32, 42))
        draw = ImageDraw.Draw(first)
        for bounds in ROIS.values():
            x1,y1,x2,y2 = bounds
            draw.rectangle((x1+8,y1+15,x2-15,y2-10), fill=(240,240,240))
        a = root/"a.png"
        first.save(a)
        assert compare(a, a, "identity")["pass"]
        # Relayout of KPI row by 16 pixels must be accepted; this was the
        # observed harmless geometry change in source-debug and signed APKs.
        translated = Image.new("RGB", EXPECTED_SIZE, (25, 32, 42))
        translated.paste(first, (0, -16))
        shifted = root/"shifted.png"
        translated.save(shifted)
        repositioned = compare(a, shifted, "same-kpis-shifted-16px")
        assert repositioned["pass"] and all(
            v["verticalAlignmentPixels"] == -16
            for v in repositioned["regions"].values()
        ), "Genuine common vertical layout shift was not aligned"
        second = first.copy()
        ImageDraw.Draw(second).rectangle((81, 1053, 133, 1117), fill=(5, 5, 5))
        b = root/"b.png"
        second.save(b)
        assert not compare(a, b, "changed-mission-count")["pass"]
        changed_and_shifted = Image.new("RGB", EXPECTED_SIZE, (25, 32, 42))
        changed_and_shifted.paste(second, (0, -16))
        changed_path = root/"changed-shifted.png"
        changed_and_shifted.save(changed_path)
        assert not compare(a, changed_path, "changed-number-even-with-shift")["pass"], (
            "Vertical registration cannot hide a genuinely changed KPI number"
        )
        try:
            crops(root/"absent.png")
        except FileNotFoundError:
            pass
        else:
            raise AssertionError("Missing screenshot was accepted")
        blank = root/"blank.png"
        Image.new("RGB",EXPECTED_SIZE,(20,20,20)).save(blank)
        try:
            crops(blank)
        except ValueError:
            pass
        else:
            raise AssertionError("Blank KPI crop was accepted")
    print("PASS: native KPI screenshot visual parity gate self-test")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    for name in ("debug-before","debug-after","signed-before","signed-after","output"):
        parser.add_argument("--" + name)
    args = parser.parse_args()
    if args.self_test:
        self_test()
    else:
        vals = [getattr(args, name.replace("-","_")) for name in ("debug-before","debug-after","signed-before","signed-after","output")]
        if not all(vals):
            parser.error("All five screenshot source/output flags are required")
        main(*vals)
