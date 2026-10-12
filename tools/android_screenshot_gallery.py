#!/usr/bin/env python3
"""Build an offline, self-contained index for Android UI screenshots in CI artifacts.

The original screenshots remain unchanged and use paths relative to the gallery.
This is a presentation/index tool only; it never uploads data or edits the app.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from html import escape
from pathlib import Path
from urllib.parse import quote

IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}

STYLE = """
:root { color-scheme: dark; font: 15px/1.5 system-ui, sans-serif }
* { box-sizing: border-box }
body { margin: 0; background: #0b111e; color: #ecf2fc }
header { padding: 32px max(18px, 3vw); border-bottom: 1px solid #28364b }
h1 { margin: 0 0 8px; font-size: clamp(23px, 4vw, 36px) }
p { color: #b8c8dc; max-width: 900px; margin: 0 0 8px }
main { padding: 10px max(18px, 3vw) 36px }
h2 { margin: 30px 0 12px; font-size: 21px; text-transform: capitalize }
.gallery { display: grid; grid-template-columns: repeat(auto-fill,minmax(min(280px,100%),1fr)); gap: 18px }
figure { margin: 0; padding: 10px; border: 1px solid #26374e; border-radius: 16px; background: #121d2e }
figure a { display: block; border-radius: 10px; overflow: hidden; background: #070e1b }
figure a:focus-visible { outline: 3px solid #80d9ff; outline-offset: 3px }
figure img { display: block; width: 100%; height: auto; max-height: 560px; object-fit: contain }
figcaption { padding: 10px 2px 0; color: #e2ebf8; overflow-wrap: anywhere }
small { color: #adbed2 }
.empty { margin: 32px 0; padding: 22px; border: 1px dashed #586a82; border-radius: 16px }
"""

def image_index(root: Path) -> list[Path]:
    """List only image files inside the given test-artifact directory."""
    return sorted(
        (p.relative_to(root) for p in root.rglob("*")
         if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES),
        key=lambda p: tuple(x.lower() for x in p.parts),
    )

def gallery_html(files: list[Path]) -> str:
    groups: dict[str, list[Path]] = defaultdict(list)
    for rel in files:
        category = rel.parts[0] if len(rel.parts) > 1 else "Overview"
        groups[category].append(rel)

    body: list[str] = []
    for category, screenshots in sorted(groups.items(), key=lambda p: p[0].lower()):
        body.append(f"<section><h2>{escape(category.replace('-', ' ').replace('_', ' '))} "
                    f"<small>({len(screenshots)})</small></h2><div class='gallery'>")
        for path in screenshots:
            encoded = "/".join(quote(part, safe="") for part in path.parts)
            label = escape(path.stem.replace("-", " ").replace("_", " "))
            href = escape(encoded, quote=True)
            body.append("<figure><a href='" + href + "' target='_blank' "
                        "rel='noopener'><img loading='lazy' decoding='async' "
                        "src='" + href + "' alt='" + label + "'></a>"
                        "<figcaption>" + label + "</figcaption></figure>")
        body.append("</div></section>")
    if not files:
        body.append("<p class='empty'>No screenshots were produced in this workflow run. "
                    "Review the preceding CI steps for failures.</p>")
    return ("<!doctype html><html lang='en'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width, initial-scale=1'>"
            "<title>Michel's Life — Android UI review gallery</title>"
            "<style>" + STYLE + "</style></head><body>"
            "<header><h1>Michel's Life — Android UI review</h1>"
            "<p>Real browser-captured screenshots from the exact GitHub Actions candidate. "
            "These are synthetic test fixtures, not physical Galaxy proof.</p>"
            f"<p>{len(files)} screenshot(s). Click to inspect the full-size original. "
            "No external scripts, fonts or network assets.</p></header><main>"
            + "".join(body) + "</main></body></html>\n")

def test_gallery() -> None:
    fixture = [
        Path("sections/calendar-360.png"),
        Path("compact-accessibility/settings-about-320.png"),
        Path("sections/a&b-412.png"),
    ]
    html = gallery_html(fixture)
    assert "calendar-360.png" in html
    assert "a%26b-412.png" in html
    assert "<h2>Sections" in html
    assert "<img " in html
    assert "<script" not in html
    assert "No screenshots" in gallery_html([])

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--directory", type=Path, default=Path("artifacts/android-ui-smoke"))
    ap.add_argument("--output", type=Path, default=None)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    test_gallery()
    if args.self_test:
        print("ANDROID_SCREENSHOT_GALLERY_TEST_PASS")
        return
    root = args.directory.resolve()
    root.mkdir(parents=True, exist_ok=True)
    output = (args.output or root / "index.html").resolve()
    if output.parent != root:
        raise SystemExit("Gallery output must be immediately inside the screenshot root")
    screenshots = image_index(root)
    output.write_text(gallery_html(screenshots), encoding="utf-8")
    print(f"ANDROID_SCREENSHOT_GALLERY_PASS images={len(screenshots)} index={output}")

if __name__ == "__main__":
    main()
