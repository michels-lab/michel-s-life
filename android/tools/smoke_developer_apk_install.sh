#!/usr/bin/env bash
set -euo pipefail
# Called ONLY from the isolated Android 16 candidate emulator job.
PKG="com.michelslab.michelslife.developer"
PUBLIC="com.michelslab.michelslife"
DEV="artifacts/developer-candidate/MichelsLife-Android-Developer-CANDIDATE.apk"
OUT="artifacts/developer-installed"
mkdir -p "$OUT"
test -s "$DEV"
adb wait-for-device
adb shell pm list packages "$PUBLIC" | tr -d '\r' > "$OUT/before-packages.txt"
grep -qx "package:$PUBLIC" "$OUT/before-packages.txt"
adb install -r "$DEV" | tee "$OUT/install.txt"
adb shell pm list packages "$PKG" | tr -d '\r' > "$OUT/after-packages.txt"
grep -qx "package:$PKG" "$OUT/after-packages.txt"
adb shell am start -W -n "$PKG/com.michelslab.michelslife.MainActivity" | tee "$OUT/launch.txt"
sleep 8
pid="$(adb shell pidof "$PKG" | tr -d '\r\n ')"
test -n "$pid"
adb forward tcp:9224 "localabstract:webview_devtools_remote_$pid"
python3 android/tools/native_developer_probe.py --port 9224 --output "$OUT/installed-ui.json" --invoke-native-export
adb forward --remove tcp:9224 || true
sleep 3
adb shell dumpsys activity activities > "$OUT/document-picker-activity.txt"
if ! grep -Eiq 'documentsui|DocumentsActivity|ACTION_CREATE_DOCUMENT|CreateDocumentActivity' "$OUT/document-picker-activity.txt"; then
  echo "::error::Native Developer JSON/AI export did not open Android document picker"
  exit 1
fi
echo "PASS: real installed Developer native Save As picker opened"
adb shell input keyevent KEYCODE_BACK || true
adb shell am force-stop "$PKG"
adb shell am start -W -n "$PKG/com.michelslab.michelslife.MainActivity" > "$OUT/relaunch.txt"
sleep 4
test -n "$(adb shell pidof "$PKG" | tr -d '\r\n ')"
grep -qx "package:$PUBLIC" <(adb shell pm list packages "$PUBLIC" | tr -d '\r')
echo "PASS: Developer survived relaunch, public app remained separately installed"
