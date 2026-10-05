#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
bridge = (ROOT / "android-bridge.js").read_text(encoding="utf-8")
main = (ROOT / "app/src/main/java/com/michelslab/michelslife/MainActivity.kt").read_text(encoding="utf-8")
manifest = (ROOT / "app/src/main/AndroidManifest.xml").read_text(encoding="utf-8")
logo = ROOT / "app/src/main/res/drawable-nodpi/michels_life_logo.jpg"
EXPECTED_ANDROID_LOGO_BLOB_SHA = "3f170f27dcd460c45a892cde51d6385d6608cfe7"

required_bridge = [
    "window.__MICHELSLIFE_ANDROID_BRIDGE__='0.2.2'",
    "const MOBILE_BREAKPOINT=4096;",
    "@media(min-width:900px) and (max-width:${MOBILE_BREAKPOINT}px)",
    "mlv-android-topbar",
    "mlv-android-drawer-backdrop",
    "mlv-android-prev-section",
    "mlv-android-next-section",
    "function stabilizeAndroidOnboarding()",
    "michelsLife.onboarding.v30200",
    "function fastRoute(id)",
    "window.__mlvAndroidFastRoute=fastRoute",
    "android-render-main",
    "function installFastNavCapture()",
    "installFastNavCapture();",
    "(document.body||document.head).appendChild(style)",
    "#v30171Sidebar{",
    "document.body.appendChild(side)",
    "setImportantOnce(side,'z-index','2147482995')",
    "body.mlv-android-nav-open #v30171Sidebar",
    "function navigateSwipe(direction)",
    "window.__mlvAndroidHandleBack=function()",
    "article.v132-mission",
    ".v132-check",
    ".v132-mission-actions{grid-column:2",
    ".topbar{display:none",
    "#mlv200Onboarding{padding:8px!important",
    "#mlv200Onboarding .mlv200-focus input[type=\"checkbox\"]",
    "width:22px!important",
    "#v30175ActionDock{position:sticky",
    "#v30106QuickFab",
    "#v30162FocusDock",
    "#v176StatusPanel{position:relative",
    "#v176StatusPanel .v176-card:first-child",
    "setInterval(maintenance,1000)",
    "mlv-android-drawer-hint",
    "data-mlv-platform",
]
missing = [needle for needle in required_bridge if needle not in bridge]
if missing:
    raise SystemExit("Android mobile UX contract missing: " + ", ".join(missing))

native_required = [
    "setLayerType(View.LAYER_TYPE_HARDWARE",
    "setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_BOUND",
    "offscreenPreRaster = true",
]
missing_native = [needle for needle in native_required if needle not in main]
if missing_native:
    raise SystemExit("Android native performance contract missing: " + ", ".join(missing_native))

if "__mlvAndroidHandleBack" not in main:
    raise SystemExit("MainActivity does not delegate Android back handling to the web UI")

if 'android:icon="@drawable/michels_life_logo"' not in manifest or 'android:roundIcon="@drawable/michels_life_logo"' not in manifest:
    raise SystemExit("Android manifest is not using the approved Michel's Life celestial launcher logo")
if not logo.exists():
    raise SystemExit("Approved Michel's Life Android launcher logo asset is missing")
import hashlib
logo_bytes = logo.read_bytes()
git_blob_sha = hashlib.sha1(b"blob " + str(len(logo_bytes)).encode("ascii") + b"\0" + logo_bytes).hexdigest()
if git_blob_sha != EXPECTED_ANDROID_LOGO_BLOB_SHA:
    raise SystemExit("Android launcher logo is not the approved normalized celestial-logo asset")

print("OK: Android UX contract covers phone + wide-emulator app mode, active-surface navigation, stable onboarding/checklists, in-drawer quick actions, hardware rendering, approved launcher logo, fixed drawer layering, swipe navigation, mission alignment and back handling")
