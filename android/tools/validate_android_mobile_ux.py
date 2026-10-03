#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
bridge = (ROOT / "android-bridge.js").read_text(encoding="utf-8")
main = (ROOT / "app/src/main/java/com/michelslab/michelslife/MainActivity.kt").read_text(encoding="utf-8")

required_bridge = [
    "window.__MICHELSLIFE_ANDROID_BRIDGE__='0.2.0'",
    "mlv-android-topbar",
    "mlv-android-drawer-backdrop",
    "#v30171Sidebar{",
    "body.mlv-android-nav-open #v30171Sidebar",
    "function navigateSwipe(direction)",
    "window.__mlvAndroidHandleBack=function()",
    "article.v132-mission",
    ".v132-check",
    ".v132-mission-actions{grid-column:2",
    ".topbar{display:none",\n    "#v176StatusPanel{position:relative",\n    "#v176StatusPanel .v176-card:first-child",
    "data-mlv-platform",
]
missing = [needle for needle in required_bridge if needle not in bridge]
if missing:
    raise SystemExit("Android mobile UX contract missing: " + ", ".join(missing))

if "__mlvAndroidHandleBack" not in main:
    raise SystemExit("MainActivity does not delegate Android back handling to the web UI")

print("OK: Android mobile UX contract contains final drawer target, swipe navigation, compact dashboard, mission alignment and back handling")
