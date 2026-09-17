#!/usr/bin/env python3
"""Render the Microsoft Store MSIX manifest using Partner Center identity values."""
from __future__ import annotations

import argparse
import html
import re
import xml.etree.ElementTree as ET
from pathlib import Path

PLACEHOLDERS = {
    "PACKAGE_IDENTITY_NAME",
    "PUBLISHER",
    "PUBLISHER_DISPLAY_NAME",
    "DISPLAY_NAME",
    "VERSION",
}


def normalize_version(raw: str) -> str:
    parts = [p.strip() for p in str(raw).strip().lstrip("v").split(".") if p.strip()]
    if len(parts) == 3:
        parts.append("0")
    if len(parts) != 4 or any(not p.isdigit() for p in parts):
        raise SystemExit("MSIX version must contain 3 or 4 numeric parts, for example 3.0.202 or 3.0.202.0.")
    numbers = [int(p) for p in parts]
    if any(n < 0 or n > 65535 for n in numbers):
        raise SystemExit("Every MSIX version component must be between 0 and 65535.")
    return ".".join(str(n) for n in numbers)


def clean(label: str, value: str) -> str:
    value = str(value or "").strip()
    if not value:
        raise SystemExit(f"{label} is required. Copy the exact value from Partner Center.")
    return value


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--package-name", required=True)
    ap.add_argument("--publisher", required=True)
    ap.add_argument("--publisher-display-name", required=True)
    ap.add_argument("--display-name", default="Michel's Life")
    ap.add_argument("--version", required=True)
    args = ap.parse_args()

    template = Path(args.template).read_text(encoding="utf-8")
    missing = [x for x in PLACEHOLDERS if "{{" + x + "}}" not in template]
    if missing:
        raise SystemExit("Manifest template is missing placeholders: " + ", ".join(sorted(missing)))

    values = {
        "PACKAGE_IDENTITY_NAME": clean("Package identity name", args.package_name),
        "PUBLISHER": clean("Publisher", args.publisher),
        "PUBLISHER_DISPLAY_NAME": clean("Publisher display name", args.publisher_display_name),
        "DISPLAY_NAME": clean("Display name", args.display_name),
        "VERSION": normalize_version(args.version),
    }

    rendered = template
    for key, value in values.items():
        rendered = rendered.replace("{{" + key + "}}", html.escape(value, quote=True))

    leftovers = re.findall(r"\{\{[A-Z0-9_]+\}\}", rendered)
    if leftovers:
        raise SystemExit("Unresolved manifest placeholders: " + ", ".join(sorted(set(leftovers))))

    try:
        ET.fromstring(rendered)
    except ET.ParseError as exc:
        raise SystemExit(f"Rendered AppxManifest.xml is invalid XML: {exc}") from exc

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(rendered, encoding="utf-8", newline="\n")
    print(f"Rendered Store manifest: {out} · version {values['VERSION']}")


if __name__ == "__main__":
    main()
