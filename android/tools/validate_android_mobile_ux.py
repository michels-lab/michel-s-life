#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
bridge = (ROOT / "android-bridge.js").read_text(encoding="utf-8")
main = (ROOT / "app/src/main/java/com/michelslab/michelslife/MainActivity.kt").read_text(encoding="utf-8")

required_bridge = [
    "window.__MICHELSLIFE_ANDROID_BRIDGE__='0.2.1'",
    "mlv-android-topbar",
    "mlv-android-drawer-backdrop",
    "mlv-android-prev-section",
    "mlv-android-next-section",
    "function stabilizeAndroidOnboarding()",
    "michelsLife.onboarding.v30200",
    "function fastRoute(id)",
    "window.__mlvAndroidFastRoute=fastRoute",
    "android-fast-route",
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
    "#v30175ActionDock{left:auto",
    "#v30106QuickFab",
    "#v30162FocusDock",
    "#v176StatusPanel{position:relative",
    "#v176StatusPanel .v176-card:first-child",
    "setInterval(maintenance,1000)",
    "body[data-mlv-android-tab=\"journal\"] #v30175ActionDock",
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

print("OK: Android mobile UX contract contains fast drawer navigation, end-of-DOM Android cascade, stable onboarding/checklists, safe floating actions, hardware rendering, fixed drawer layering, swipe navigation, mission alignment and back handling")
