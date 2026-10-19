#!/usr/bin/env python3
"""Owner pause: Windows installer/MSIX must not auto-build on Android work."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
for name in ("build-store-msix.yml", "release-windows.yml"):
    path = ROOT / ".github" / "workflows" / name
    source = path.read_text(encoding="utf-8")
    head = source.split("\npermissions:", 1)[0]
    for trigger in ("push", "pull_request", "schedule"):
        if re.search(r"(?m)^  " + trigger + r":(?:\s|$)", head):
            raise SystemExit(f"Windows paused by owner, but {name} still has automatic trigger: {trigger}")
    if "  workflow_dispatch:" not in head:
        raise SystemExit(f"Windows workflow {name} must remain manually reactivatable")
if "  workflow_call:" not in (ROOT / ".github/workflows/release-windows.yml").read_text(encoding="utf-8"):
    raise SystemExit("Existing opt-in unified release workflow integration missing")
print("PASS: paused Windows/MSIX workflows cannot run on source pushes or PRs")
