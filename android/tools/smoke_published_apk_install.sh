#!/usr/bin/env bash
# Genuine public signed Android Direct install -> in-place upgrade -> relaunch.
# Clean Android15 emulator only, never the user's Galaxy. Protected release
# build prevents inspecting private WebView/localStorage without user consent.
set -euo pipefail
trap 'echo "::error::Signed native upgrade aborted at script line $LINENO" >&2' ERR

PKG="com.michelslab.michelslife"
PREVIOUS_VERSION="${PREVIOUS_VERSION:?set previous official version}"
LATEST_VERSION="${LATEST_VERSION:?set latest official version}"
PREVIOUS_CODE="${PREVIOUS_CODE:?set previous code from manifest}"
LATEST_CODE="${LATEST_CODE:?set latest code from manifest}"
OLD_APK="artifacts/public/previous/MichelsLife-Android-Direct-v${PREVIOUS_VERSION}.apk"
NEW_APK="artifacts/public/latest/MichelsLife-Android-Direct-v${LATEST_VERSION}.apk"
OUT="artifacts/installed"
mkdir -p "$OUT"
test -s "$OLD_APK"
test -s "$NEW_APK"
if [[ ! "$PREVIOUS_CODE" =~ ^[0-9]+$ || ! "$LATEST_CODE" =~ ^[0-9]+$ ||
      "$LATEST_CODE" -ne "$((PREVIOUS_CODE+1))" ]]; then
  echo "::error::Non-consecutive Android version codes"
  exit 1
fi

capture_png(){
  local dest="$1" attempt temp="$1.partial"
  for attempt in 1 2 3; do
    if timeout 30s adb exec-out screencap -p >"$temp" 2>"$OUT/screenshot-adb-error.txt" &&
       python3 - "$temp" <<'PY'
from pathlib import Path
import struct,sys
data=Path(sys.argv[1]).read_bytes()
if not data.startswith(b'\x89PNG\r\n\x1a\n') or len(data)<30000:
    raise SystemExit("Missing actual Android PNG pixels")
width,height=struct.unpack(">II",data[16:24])
if min(width,height)<200:
    raise SystemExit("Actual screenshot has invalid physical dimensions")
PY
    then
      mv "$temp" "$dest"
      return 0
    fi
    rm -f "$temp"
    echo "::warning::Native ADB screenshot unavailable ($attempt/3): $dest"
    timeout 8s adb devices -l >"$OUT/adb-devices-last.txt" 2>&1 || true
    sleep 3
  done
  echo "::error::Missing REAL native screenshot: $dest"
  return 1
}

package_info(){
  local label="$1" code="$2" version="$3" uid
  timeout 20s adb shell dumpsys package "$PKG" >"$OUT/package-$label.txt"
  grep -F "versionCode=$code" "$OUT/package-$label.txt"
  grep -F "versionName=$version" "$OUT/package-$label.txt"
  # Android 15 exposes stable package UID through pm list packages -U.
  # Some API35 dumpsys layouts no longer print userId=<number>, so a
  # grep-only command substitution previously killed the smoke silently
  # under set -e / pipefail, BEFORE the actual upgrade ever ran.
  timeout 15s adb shell pm list packages -U "$PKG" >"$OUT/package-uid-$label.txt"
  local package_line
  package_line="$(grep -F "package:$PKG " "$OUT/package-uid-$label.txt" | head -1 || true)"
  uid="$(printf '%s\n' "$package_line" | sed -nE 's/.*[[:space:]]uid:([0-9]+).*/\1/p')"
  if [[ ! "$uid" =~ ^[0-9]+$ ]]; then
    uid="$(grep -oE 'userId=[0-9]+' "$OUT/package-$label.txt" | head -1 | cut -d= -f2 || true)"
  fi
  if [[ ! "$uid" =~ ^[0-9]+$ ]]; then
    echo "::error::Unable to obtain exact installed $PKG UID from package manager at stage $label"
    echo "::error::No APK upgrade accepted as proof without a real UID comparison"
    return 1
  fi
  echo "$uid" >"$OUT/uid-$label.txt"
  timeout 15s adb shell pm path "$PKG" >"$OUT/apk-path-$label.txt"
  grep -q 'package:' "$OUT/apk-path-$label.txt"
  if timeout 12s adb shell run-as "$PKG" id >/dev/null 2>&1; then
    echo "::error::Production release unexpectedly exposes debug data access"
    return 1
  fi
}

launch_and_capture(){
  local label="$1"
  timeout 45s adb shell am start -W -n "$PKG/.MainActivity" >"$OUT/launch-$label.txt"
  sleep 20
  timeout 15s adb shell pidof "$PKG" >"$OUT/pid-$label.txt"
  grep -Eq '[0-9]+' "$OUT/pid-$label.txt"
  capture_png "$OUT/$label.png"
}

timeout 120s adb wait-for-device
api="$(timeout 15s adb shell getprop ro.build.version.sdk | tr -d '\r\n')"
test "$api" = "35" || { echo "::error::Expected API35 but got $api"; exit 1; }
echo "SIGNED_ANDROID_API35=$api" >"$OUT/environment.txt"
if timeout 15s adb shell pm list packages "$PKG" | grep -Fq "$PKG"; then
  echo "::error::Upgrade test requires a clean initial emulator"
  exit 1
fi

# Real predecessor public APK, no -r/-d/-t on initial installation.
timeout 120s adb install "$OLD_APK" >"$OUT/install-before.txt" 2>&1 || {
  cat "$OUT/install-before.txt"; echo "::error::Predecessor signed APK refused"; exit 1;
}
grep -q 'Success' "$OUT/install-before.txt"
package_info before "$PREVIOUS_CODE" "$PREVIOUS_VERSION"
launch_and_capture before-upgrade

# Genuine non-uninstall upgrade, never pm clear/uninstall/downgrade.
timeout 45s adb shell am force-stop "$PKG"
timeout 120s adb install -r "$NEW_APK" >"$OUT/inplace-upgrade.txt" 2>&1 || {
  cat "$OUT/inplace-upgrade.txt"; echo "::error::In-place Direct upgrade refused"; exit 1;
}
grep -q 'Success' "$OUT/inplace-upgrade.txt"
package_info after "$LATEST_CODE" "$LATEST_VERSION"
test "$(cat "$OUT/uid-before.txt")" = "$(cat "$OUT/uid-after.txt")" || {
  echo "::error::Android package UID changed during update"; exit 1;
}
launch_and_capture after-upgrade

timeout 45s adb shell am force-stop "$PKG"
launch_and_capture after-cold-relaunch
package_info relaunch "$LATEST_CODE" "$LATEST_VERSION"
test "$(cat "$OUT/uid-before.txt")" = "$(cat "$OUT/uid-relaunch.txt")" || {
  echo "::error::Android package UID changed after cold relaunch"; exit 1;
}
printf 'SIGNED_PUBLIC_INPLACE_UPGRADE_API35_PASS: %s code%s -> %s code%s; stable UID and genuine PNGs\n' \
  "$PREVIOUS_VERSION" "$PREVIOUS_CODE" "$LATEST_VERSION" "$LATEST_CODE"
echo "::notice::No private production WebView state exposed; mission/localStorage data contents NOT certified by this OS-level install -r test."
