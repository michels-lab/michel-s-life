#!/usr/bin/env bash
# Runs as ONE process inside the Android emulator action. The action executes
# lines of its script: property individually, so compound shell constructs live
# here rather than in the workflow YAML.
set -euo pipefail

APK="artifacts/public/MichelsLife-Android-v0.2.2-TEST.apk"
PACKAGE="com.michelslab.michelslife"
mkdir -p artifacts/installed
test -s "$APK"

adb wait-for-device
adb shell getprop ro.build.version.sdk | tee artifacts/installed/android-sdk.txt

echo "Checking that Michel's Life is not already installed:"
adb shell pm list packages "$PACKAGE" | tee artifacts/installed/before-install.txt
if grep -Fq "$PACKAGE" artifacts/installed/before-install.txt; then
  echo "::error::Emulator was not clean before APK installation"
  exit 1
fi

# Do NOT pass '-t': the user's normal package installer cannot bypass
# INSTALL_FAILED_TEST_ONLY. We want the actual phone-style install behavior.
if adb install -r "$APK" >artifacts/installed/install-output.txt 2>&1; then
  cat artifacts/installed/install-output.txt
else
  cat artifacts/installed/install-output.txt
  adb logcat -d -t 2500 >artifacts/installed/install-failure-logcat.txt || true
  echo "::error::Android PackageManager rejected the unmodified public APK"
  exit 1
fi

adb shell dumpsys package "$PACKAGE" >artifacts/installed/package-info.txt
grep -E 'versionCode=4|versionName=0.2.2' artifacts/installed/package-info.txt | head -8

adb shell am start -W -n "$PACKAGE/.MainActivity" | tee artifacts/installed/launch-output.txt
sleep 15
adb shell pidof "$PACKAGE" | tee artifacts/installed/process-id.txt
adb exec-out screencap -p >artifacts/installed/home-screenshot.png

python3 - <<'PY'
from pathlib import Path
png=Path("artifacts/installed/home-screenshot.png").read_bytes()
if not png.startswith(bytes.fromhex("89504e470d0a1a0a")) or len(png)<10000:
    raise SystemExit("Screenshot of Android installed app is absent or invalid")
print(f"PASS: unmodified GitHub APK installed, launched, remains running; screenshot {len(png)} bytes")
PY
