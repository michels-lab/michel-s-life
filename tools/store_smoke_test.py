#!/usr/bin/env python3
"""Static checks for the Microsoft Store/MSIX packaging path."""
from __future__ import annotations

import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "store" / "AppxManifest.template.xml"
RENDER = ROOT / "tools" / "render_store_manifest.py"
APPEND = ROOT / "tools" / "append_store_overlay.py"
OVERLAY = ROOT / "src" / "MichelsLife" / "AppPatches" / "store-msix.html"
ASSETS = ROOT / "tools" / "create_store_assets.ps1"
WORKFLOW = ROOT / ".github" / "workflows" / "build-store-msix.yml"

required = [TEMPLATE, RENDER, APPEND, OVERLAY, ASSETS, WORKFLOW]
missing = [str(p.relative_to(ROOT)) for p in required if not p.exists()]
if missing:
    raise SystemExit("Missing Store packaging files: " + ", ".join(missing))

subprocess.run([sys.executable, "-m", "py_compile", str(RENDER), str(APPEND)], check=True)

with tempfile.TemporaryDirectory() as td:
    out = Path(td) / "AppxManifest.xml"
    subprocess.run(
        [
            sys.executable,
            str(RENDER),
            "--template", str(TEMPLATE),
            "--output", str(out),
            "--package-name", "12345MichelLife.Test",
            "--publisher", "CN=00000000-0000-0000-0000-000000000000",
            "--publisher-display-name", "Michel Life Test",
            "--display-name", "Michel's Life",
            "--version", "3.0.202",
        ],
        check=True,
    )
    root = ET.parse(out).getroot()
    ns = {
        "f": "http://schemas.microsoft.com/appx/manifest/foundation/windows10",
        "r": "http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities",
    }
    identity = root.find("f:Identity", ns)
    app = root.find("f:Applications/f:Application", ns)
    cap = root.find("f:Capabilities/r:Capability", ns)
    assert identity is not None and identity.attrib["Version"] == "3.0.202.0"
    assert app is not None and app.attrib["Executable"] == "MichelsLife.exe"
    assert cap is not None and cap.attrib["Name"] == "runFullTrust"

overlay = OVERLAY.read_text(encoding="utf-8")
assert "mlv-store-msix-channel" in overlay
assert "data-mlv202-update" in overlay
assert "Microsoft Store updates" in overlay

workflow = WORKFLOW.read_text(encoding="utf-8")
assert re.search(r"(?ms)^  push:\s*\n(?:.*\n)*?    branches:\s*\n(?:.*\n)*?      - main(?:\s|$)", workflow), (
    "Store workflow must validate the default branch automatically."
)
assert "name: Validate Microsoft Store channel" in workflow
assert "needs: validate" in workflow
assert "if: ${{ github.event_name == 'workflow_dispatch' }}" in workflow, (
    "Real Partner Center package construction must remain manual/provider-bound."
)

print("OK: Microsoft Store/MSIX source checks passed")
