#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
bridge = (ROOT / "android-bridge.js").read_text(encoding="utf-8")
mobile_experience = (ROOT / "mobile-experience.js").read_text(encoding="utf-8")
mobile_sections = (ROOT / "mobile-sections.js").read_text(encoding="utf-8")
bundler = (ROOT / "tools/prepare_bundle.py").read_text(encoding="utf-8")
main = (ROOT / "app/src/main/java/com/michelslab/michelslife/MainActivity.kt").read_text(encoding="utf-8")
manifest = (ROOT / "app/src/main/AndroidManifest.xml").read_text(encoding="utf-8")
adaptive_icon = ROOT / "app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml"
adaptive_round_icon = ROOT / "app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml"
launcher_foreground = ROOT / "app/src/main/res/drawable/ic_launcher_foreground.xml"
focus_alarm = (ROOT / "app/src/main/java/com/michelslab/michelslife/NativeFocusAlarm.kt").read_text(encoding="utf-8")

required_bridge = [
    "window.__MICHELSLIFE_ANDROID_BRIDGE__='0.2.8'",
    "const MOBILE_BREAKPOINT=4096;",
    "@media(min-width:900px) and (max-width:${MOBILE_BREAKPOINT}px)",
    "mlv-android-topbar",
    "mlv-android-drawer-backdrop",
    "mlv-android-prev-section",
    "mlv-android-next-section",
    "function stabilizeAndroidOnboarding()",
    "function layoutAndroidOnboarding(root)",
    "mlv-android-onboard-scroll",
    "body:has(#mlv200Onboarding:not([hidden])) #mlv-android-topbar",
    "z-index:2147483500",
    "[data-mlv200-onboard=\"next\"]",
    "max(42px,env(safe-area-inset-bottom,0px))",
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
    "#mlv200Onboarding{position:fixed!important",
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

required_mobile_experience = [
    "mlv-android-bottom-nav",
    "mlv-android-focus-overlay",
    "FocusStoryV30162",
    "mlv-android-capture-button",
    "MLV216QuickCapture",
    "[data-mlv216-qc]",
    "mlv-android-focus-sheet",
    "mlv-android-focus-open",
    "env(safe-area-inset-bottom,0px)",
    "window.__mlvAndroidHandleBack=function()",
]
missing_mobile_experience = [needle for needle in required_mobile_experience if needle not in mobile_experience]
if missing_mobile_experience:
    raise SystemExit("Android mobile experience missing: " + ", ".join(missing_mobile_experience))
if "MOBILE_EXPERIENCE = ROOT / \"mobile-experience.js\"" not in bundler or "shutil.copy2(MOBILE_EXPERIENCE" not in bundler:
    raise SystemExit("Android app bundling no longer includes its mobile-specific UI script")

if "mobile-sections.js" not in bundler or "MOBILE_SECTIONS" not in bundler:
    raise SystemExit("Android bundle does not include mobile-specific Missions, Calendar and Journal layouts")
if not all(term in mobile_sections for term in ("v132-mission", "v30135-grid", "mlv184-journal-layout", "mlv184JournalBody", "MichelsLifeAndroidSections")):
    raise SystemExit("Android mission, calendar or journal mobile layout contract missing")

# Android polish must be an Android-scoped layout owner, not changes to the
# user-approved desktop Themes/Chapters. Real viewport probes run separately.
for section_id in ("tab-contracts", "tab-stats", "tab-achievements", "tab-affirmations", "tab-settings", "tab-story"):
    if section_id not in mobile_sections:
        raise SystemExit("Android section visual owner missing: " + section_id)
for contract in (
    "v216-contract-grid", "v156-ach-grid", "v133-ach-grid",
    "v30171-settings-nav", "mlvAndroidSectionEnter",
    "prefers-reduced-motion:reduce", "max-width:720px",
):
    if contract not in mobile_sections:
        raise SystemExit("Android section design contract missing: " + contract)
if 'html[data-mlv-platform="android"]' not in mobile_sections:
    raise SystemExit("Android visual layout changes must be platform isolated")
if not (ROOT.parent / "tools/ui_android_section_design_smoke.mjs").exists():
    raise SystemExit("Android rendered mobile section design test is missing")


# Story/Chapters and About must be phone-owned presentations of their
# canonical desktop domain and identity, never a second mobile state model.
story_about_contract = [
    '[data-v30171-pane="about"] [data-mlv-about-core]',
    '.mlvdev-product-lockup',
    '.mlvdev-avatar',
    '.mlvdev-socials',
    '.v30162-story-form',
    '.v30162-chapter-archive',
]
missing_story_about = [term for term in story_about_contract if term not in mobile_sections]
if missing_story_about:
    raise SystemExit("Android Story/About phone design missing: " + ", ".join(missing_story_about))
phone_test = (ROOT.parent / "tools/ui_android_section_design_smoke.mjs").read_text(encoding="utf-8")
if "Story still uses desktop multi-column edit geometry" not in phone_test or \
        "About social cards are clipped" not in phone_test:
    raise SystemExit("Android Story/About real viewport regression assertions missing")

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

if 'android:icon="@mipmap/ic_launcher"' not in manifest or 'android:roundIcon="@mipmap/ic_launcher_round"' not in manifest:
    raise SystemExit("Android manifest is not using the canonical Michel's Life launcher resources")
if 'android:windowSoftInputMode="adjustResize"' not in manifest:
    raise SystemExit("Android mission/Journal sheets must resize above the soft keyboard")

# Reboot/package upgrade clears Android AlarmManager state; ensure an existing
# canonical deadline is re-armed without fabricating a new Focus session.
if 'android.permission.RECEIVE_BOOT_COMPLETED' not in manifest:
    raise SystemExit("Focus alarm recovery needs RECEIVE_BOOT_COMPLETED permission")
if 'android.intent.action.BOOT_COMPLETED' not in manifest or 'android.intent.action.MY_PACKAGE_REPLACED' not in manifest:
    raise SystemExit("Native Focus recovery boot/upgrade broadcasts are not registered")
if not re.search(r'<receiver\s+android:name="\.FocusAlarmBootReceiver"\s+android:exported="false"', manifest):
    raise SystemExit("Focus recovery receiver must be registered and non-exported")

for token in (
        "fun recoverAfterBoot(context: Context)",
        "token != \"$mode:$deadline\"",
        "deadline <= now || deadline > now + MAX_FUTURE_MS",
        "alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, deadline, intent(context, token))",
        "class FocusAlarmBootReceiver : BroadcastReceiver()",
        "Intent.ACTION_BOOT_COMPLETED",
        "Intent.ACTION_MY_PACKAGE_REPLACED",
):
    if token not in focus_alarm:
        raise SystemExit("Focus reboot recovery contract missing: " + token)

for path in (adaptive_icon, adaptive_round_icon, launcher_foreground):
    if not path.exists() or path.stat().st_size == 0:
        raise SystemExit(f"Canonical Michel's Life Android launcher resource is missing: {path}")
for path in (adaptive_icon, adaptive_round_icon):
    xml = path.read_text(encoding="utf-8")
    if '@drawable/ic_launcher_foreground' not in xml or '@color/ml_icon_background' not in xml:
        raise SystemExit(f"Adaptive launcher icon is not wired to the canonical foreground/background: {path}")

print("OK: Android UX contract covers phone + wide-emulator app mode, active-surface navigation, stable onboarding/checklists, in-drawer quick actions, hardware rendering, canonical adaptive launcher identity, fixed drawer layering, swipe navigation, mission alignment and back handling")
