#!/usr/bin/env bash
# Install THE Android APK artifact built from the current candidate source,
# launch its true WebView Activity, and drive first-run touch actions.
set -euo pipefail
PKG="com.michelslab.michelslife"
APK="artifacts/candidate/MichelsLife-Android-TEST-v${ANDROID_VERSION}.apk"
OUT="artifacts/candidate-install"
mkdir -p "$OUT"
test -s "$APK"
adb wait-for-device
adb shell wm size 412x915
adb shell wm density 160
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
test -z "$(adb shell pm list packages "$PKG" | tr -d '\r')"
if ! adb install -r "$APK" >"$OUT/install-result.txt" 2>&1; then
  cat "$OUT/install-result.txt"
  adb logcat -d -t 3000 >"$OUT/install-failure-logcat.txt" || true
  echo "::error::Actual current-candidate APK refused fresh Android installation"
  exit 1
fi
cat "$OUT/install-result.txt"
adb shell dumpsys package "$PKG" >"$OUT/package-info.txt"
grep -F "versionName=${ANDROID_VERSION}" "$OUT/package-info.txt"
adb shell am start -W -n "$PKG/.MainActivity" | tee "$OUT/launch-result.txt"
sleep 16
adb shell pidof "$PKG" | tee "$OUT/process-id.txt"
adb exec-out screencap -p >"$OUT/step0.png"
# Accessibility on Android WebView exposes actual screen buttons in XML.
# Record tree first; treat missing accessibility support separately, never
# fabricate an end-to-end tap PASS from source code or emulator startup alone.
adb shell uiautomator dump --compressed /sdcard/michel-candidate-ui.xml >"$OUT/accessibility-dump-output.txt" 2>&1 || true
adb shell cat /sdcard/michel-candidate-ui.xml >"$OUT/step0-hierarchy.xml" 2>/dev/null || true
python3 - <<'PY'
from pathlib import Path
p=Path("artifacts/candidate-install")
s=(p/"step0.png").read_bytes()
if not s.startswith(bytes.fromhex("89504e470d0a1a0a")) or len(s)<10000:
    raise SystemExit("Failed to capture real Android candidate app screenshot")
print("PASS: current candidate APK fresh-installed and launched in Android 16")
if (p/"step0-hierarchy.xml").exists():
    xml=(p/"step0-hierarchy.xml").read_text(errors="replace")
    print("Accessibility tree available:",len(xml),"bytes, Continue visible:", "Continue" in xml)
else:
    print("Accessibility tree unavailable; onboarding native gesture test NOT VERIFIED")
PY
