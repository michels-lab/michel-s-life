#!/usr/bin/env bash
# Install THE Android APK artifact built from the current candidate source,
# launch its true WebView Activity, and drive first-run touch actions.
set -euo pipefail
PKG="com.michelslab.michelslife"
# Default remains the CI debug APK; signed candidate workflow selects its verified Direct APK by explicit APK environment variable.
APK="${APK:-artifacts/candidate/MichelsLife-Android-TEST-v${ANDROID_VERSION}.apk}"
OUT="artifacts/candidate-install"
mkdir -p "$OUT"
test -s "$APK"
# Native WebView captures can fail with "error: closed" during adb transport
# reconnects on hosted Android 16 emulators. Retry the exact native screenshot
# command and validate the PNG; never replace missing pixels with browser mocks.
capture_png(){
  local dest="$1" attempt tmp="1.partial" remote="/sdcard/mlv-ci-native-capture.png"
  for attempt in 1 2 3 4 5; do
    # First use Android's raw PNG stdout. If an API 36 ADB transport drops
    # during exec-out, use a separate on-device screenshot + pull route.
    if timeout 25s adb exec-out screencap -p > "$tmp" 2>"$OUT/adb-screencap-last-error.txt" &&
       python3 -c 'import pathlib,sys;d=pathlib.Path(sys.argv[1]).read_bytes();sys.exit(0 if d.startswith(bytes.fromhex("89504e470d0a1a0a")) and len(d)>30000 else 1)' "$tmp"; then
      mv "$tmp" "$dest"
      return 0
    fi
    rm -f "$tmp"
    echo "::warning::Native exec-out screencap failed ($attempt/5): $dest"
    cat "$OUT/adb-screencap-last-error.txt" || true
    # No browser fixture or synthetic fallback: both commands below capture
    # the actual emulator framebuffer, just through a different ADB transport.
    if timeout 25s adb shell screencap -p "$remote" >"$OUT/adb-shell-screencap-last.txt" 2>&1 &&
       timeout 25s adb pull "$remote" "$tmp" >"$OUT/adb-pull-screencap-last.txt" 2>&1 &&
       python3 -c 'import pathlib,sys;d=pathlib.Path(sys.argv[1]).read_bytes();sys.exit(0 if d.startswith(bytes.fromhex("89504e470d0a1a0a")) and len(d)>30000 else 1)' "$tmp"; then
      mv "$tmp" "$dest"
      timeout 8s adb shell rm -f "$remote" || true
      echo "Native screenshot recovered via on-device capture and ADB pull (attempt $attempt)"
      return 0
    fi
    rm -f "$tmp"
    echo "::warning::Native on-device screencap also unavailable ($attempt/5)"
    cat "$OUT/adb-shell-screencap-last.txt" "$OUT/adb-pull-screencap-last.txt" 2>/dev/null || true
    # Repair only the CI runner's isolated adb transport, not the app. Keep
    # camera/screenframe assertions fail-closed if Android really died.
    timeout 10s adb devices -l >"$OUT/adb-device-retry-state.txt" 2>&1 || true
    if ! grep -q $'\tdevice' "$OUT/adb-device-retry-state.txt"; then
      timeout 8s adb kill-server || true
      timeout 12s adb start-server || true
      timeout 20s adb wait-for-device || true
    fi
    sleep 3
  done
  echo "::error::Missing real native Android pixels after five screenshot attempts: $dest"
  timeout 12s adb logcat -d -t 3000 >"$OUT/adb-capture-failure-logcat.txt" || true
  timeout 12s adb devices -l >"$OUT/adb-capture-failure-devices.txt" || true
  return 1
}
# Canonical-state inspection is limited to debuggable TEST builds.
# Never expose Chrome DevTools on signed Direct/Play APKs.
capture_native_state(){
  local stage="$1" pid
  pid="$(timeout 15s adb shell pidof "$PKG" | tr -d '\r\n ')"
  if [[ ! "$pid" =~ ^[0-9]+$ ]]; then
    echo "::error::Cannot identify native WebView process for $stage"
    return 1
  fi
  timeout 15s adb forward tcp:9222 "localabstract:webview_devtools_remote_$pid"
  if ! python3 android/tools/native_webview_state_probe.py capture \
      --port 9222 --output "$OUT/native-state-$stage.json"; then
    timeout 8s adb forward --remove tcp:9222 || true
    return 1
  fi
  timeout 8s adb forward --remove tcp:9222
}
adb wait-for-device
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
NATIVE_STATE_TEST=0
if timeout 10s adb shell run-as "$PKG" id >/dev/null 2>&1; then
  NATIVE_STATE_TEST=1
fi
if [[ "${MLV_REQUIRE_PROTECTED_SIGNED:-0}" == "1" && "$NATIVE_STATE_TEST" -eq 1 ]]; then
  echo "::error::Production-signed Direct APK unexpectedly permits run-as/debug data access"
  exit 1
fi
if [[ "${MLV_REQUIRE_PROTECTED_SIGNED:-0}" == "1" && "${MLV_REQUIRE_NATIVE_STATE_PROBE:-0}" == "1" ]]; then
  echo "::error::Cannot require debug and production-protected inspection in the same run"
  exit 1
fi
if [[ "${MLV_REQUIRE_NATIVE_STATE_PROBE:-0}" == "1" && "$NATIVE_STATE_TEST" -ne 1 ]]; then
  echo "::error::Native state probe requires a debuggable APK; refusing screenshot-only success"
  exit 1
fi
if [[ "$NATIVE_STATE_TEST" -ne 1 ]]; then
  echo "::notice::Signed/release APK: CDP state capture disabled; canonical persistence UNVERIFIED"
fi
adb shell dumpsys package "$PKG" >"$OUT/package-info.txt"
grep -F "versionName=${ANDROID_VERSION}" "$OUT/package-info.txt"
adb shell am start -W -n "$PKG/.MainActivity" | tee "$OUT/launch-result.txt"
sleep 10
adb shell pidof "$PKG" | tee "$OUT/process-id.txt"
# Do not override emulator WM size/density: physical native WebView surface may
# go blank after a forced display configuration change on API 36.
# Wait until ACTUAL rendered app pixels exist instead of passing a black window.
RENDERED=0
for attempt in 1 2 3 4 5 6 7 8; do
  capture_png "$OUT/step0.png"
  if python3 -c 'import pathlib,sys; p=pathlib.Path(sys.argv[1]);d=p.read_bytes();sys.exit(0 if d.startswith(bytes.fromhex("89504e470d0a1a0a")) and len(d)>30000 else 1)' "$OUT/step0.png"; then
    echo "Native Android pixels present at screenshot attempt $attempt"
    RENDERED=1
    break
  fi
  sleep 10
done
if [ "$RENDERED" -ne 1 ]; then
  echo "::error::Activity started, but native Android WebView never rendered meaningful pixels"
  adb logcat -d -t 4000 >"$OUT/native-blank-screen-logcat.txt" || true
  adb shell dumpsys activity activities >"$OUT/activity-diagnostics.txt" || true
  adb shell dumpsys window windows >"$OUT/window-diagnostics.txt" || true
  exit 1
fi
# A non-black *early* frame is NOT proof that WebView completed rendering:
# v0.2.3 produced a cropped giant logo/white slab on the first nonblack image.
# Keep separate later screenshots for pixel review instead of inventing RENDER PASS.
cp "$OUT/step0.png" "$OUT/step0-first-visible.png"
sleep 30
capture_png "$OUT/step0-after-30s.png"
sleep 25
capture_png "$OUT/step0-after-55s.png"
for frame in "$OUT/step0-after-30s.png" "$OUT/step0-after-55s.png"; do
  python3 -c 'import pathlib,sys;d=pathlib.Path(sys.argv[1]).read_bytes();sys.exit(0 if d.startswith(bytes.fromhex("89504e470d0a1a0a")) and len(d)>30000 else 1)' "$frame"
done
# Exercise the real packaged WebView at its first-run Continue button,
# following the fully rendered reference frame on this fixed Pixel 6 AVD.
# Capture the result for human-independent comparison and later visual review.
DEVICE_SIZE="$(adb shell wm size | tr -d '\r' | sed -n 's/^Physical size: //p' | head -1)"
if [[ "$DEVICE_SIZE" =~ ^([0-9]+)x([0-9]+)$ ]]; then
  W="${BASH_REMATCH[1]}"
  H="${BASH_REMATCH[2]}"
  X="$((W * 83 / 100))"
  Y="$((H * 78 / 100))"
  echo "Tapping installed WebView step-1 Continue at pixel $X,$Y on $DEVICE_SIZE"
  adb shell input tap "$X" "$Y"
  sleep 8
  capture_png "$OUT/step2-after-native-continue.png"
  # On the pinned 1080x2400 Pixel 6 emulator, the step 2 focus footer
  # Continue is lower than the step 1 button (roughly 84% of display height).
  # Capture the next real packaged-WebView state separately. Do not call
  # this a native Finish pass until the resulting screenshot is inspected.
  NEXT_X="$((W * 83 / 100))"
  NEXT_Y="$((H * 84 / 100))"
  echo "Tapping installed WebView step-2 Continue at pixel $NEXT_X,$NEXT_Y on $DEVICE_SIZE"
  adb shell input tap "$NEXT_X" "$NEXT_Y"
  sleep 8
  capture_png "$OUT/step3-after-native-continue.png"
  # The step-3 Finish setup control is at ~81% width, 62% height on
  # this pinned device. This coordinate is grounded in the same-run
  # step-3 screenshot, not guessed from the browser-only fixture.
  FINISH_X="$((W * 81 / 100))"
  FINISH_Y="$((H * 62 / 100))"
  echo "Tapping installed WebView Finish setup at pixel $FINISH_X,$FINISH_Y on $DEVICE_SIZE"
  adb shell input tap "$FINISH_X" "$FINISH_Y"
  sleep 12
  capture_png "$OUT/step4-after-native-finish.png"
  sleep 20
  capture_png "$OUT/step4-after-native-finish-30s.png"
  adb shell uiautomator dump --compressed /sdcard/mlv-pre-relaunch.xml >"$OUT/pre-relaunch-accessibility-output.txt" 2>&1 || true
  adb shell cat /sdcard/mlv-pre-relaunch.xml >"$OUT/step4-hierarchy.xml" 2>/dev/null || true
  if [[ "$NATIVE_STATE_TEST" -eq 1 ]]; then
    capture_native_state before
  fi
  # A mere disappearing card may not mean the onboarding completion was
  # persisted. Restart the exact installed app without clearing data and
  # record whether it wrongly reappears.
  adb shell am force-stop "$PKG"
  adb shell am start -W -n "$PKG/.MainActivity" | tee "$OUT/relaunch-result.txt"
  sleep 20
  RELAUNCH_PID_OK=0
  for attempt in 1 2 3 4 5; do
    if timeout 15s adb shell pidof "$PKG" >"$OUT/relaunch-process-id.txt" 2>"$OUT/adb-relaunch-last-error.txt" &&
       test -s "$OUT/relaunch-process-id.txt"; then
      RELAUNCH_PID_OK=1
      break
    fi
    echo "::warning::Waiting for relaunched Android process and adb ($attempt/5)"
    timeout 12s adb wait-for-device || true
    sleep 3
  done
  if [ "$RELAUNCH_PID_OK" -ne 1 ]; then
    echo "::error::Cannot verify native Android process after relaunch"
    exit 1
  fi
  capture_png "$OUT/step5-after-relaunch.png"
  # WebView can still be mid-paint even after PackageManager / ActivityManager
  # have reported success. Keep time-separated same-process evidence rather
  # than classifying the initial cropped-logo/slab frame as a stable UI defect.
  sleep 30
  capture_png "$OUT/step5-after-relaunch-30s.png"
  sleep 30
  capture_png "$OUT/step5-after-relaunch-60s.png"
  if [[ "$NATIVE_STATE_TEST" -eq 1 ]]; then
    capture_native_state after
    python3 android/tools/native_webview_state_probe.py compare \
      --before "$OUT/native-state-before.json" \
      --after "$OUT/native-state-after.json" \
      --output "$OUT/native-canonical-persistence-comparison.json"
    # Android 16 real process restart #2: rule out transient first-reload state.
    # No clearing data and no state mutation between captures.
    adb shell am force-stop "$PKG"
    adb shell am start -W -n "$PKG/.MainActivity" | tee "$OUT/second-relaunch-result.txt"
    sleep 20
    capture_native_state after-second-relaunch
    python3 android/tools/native_webview_state_probe.py compare \
      --before "$OUT/native-state-before.json" \
      --after "$OUT/native-state-after-second-relaunch.json" \
      --output "$OUT/native-canonical-second-relaunch-comparison.json"
    python3 android/tools/native_webview_state_probe.py compare \
      --before "$OUT/native-state-after.json" \
      --after "$OUT/native-state-after-second-relaunch.json" \
      --output "$OUT/native-canonical-consecutive-relaunch-comparison.json"
  fi
else
  echo "::warning::Could not resolve native device dimensions: $DEVICE_SIZE; touch step not verified"
fi
# Native WebView accessibility may expose only a WebView container rather than
# HTML controls. Save the real tree; do not fabricate button-press or completion
# evidence when the actual native accessibility nodes are missing.
adb shell uiautomator dump --compressed /sdcard/michel-candidate-ui.xml >"$OUT/accessibility-dump-output.txt" 2>&1 || true
adb shell cat /sdcard/michel-candidate-ui.xml >"$OUT/step5-hierarchy.xml" 2>/dev/null || true
python3 - <<'PY'
from pathlib import Path
p=Path("artifacts/candidate-install")
s=(p/"step0.png").read_bytes()
if not s.startswith(bytes.fromhex("89504e470d0a1a0a")) or len(s)<10000:
    raise SystemExit("Failed to capture real Android candidate app screenshot")
for name in ("step2-after-native-continue.png", "step3-after-native-continue.png", "step4-after-native-finish.png", "step4-after-native-finish-30s.png", "step5-after-relaunch.png", "step5-after-relaunch-30s.png", "step5-after-relaunch-60s.png"):
    frame = p/name
    if not frame.exists():
        raise SystemExit(f"Required native onboarding capture missing: {name}")
    data = frame.read_bytes()
    if not data.startswith(bytes.fromhex("89504e470d0a1a0a")) or len(data) < 30000:
        raise SystemExit(f"Native onboarding screenshot is not a valid nontrivial PNG: {name}")
reports = [
    "native-canonical-persistence-comparison.json",
    "native-canonical-second-relaunch-comparison.json",
    "native-canonical-consecutive-relaunch-comparison.json",
]
if any((p/name).exists() for name in reports):
    import json
    if not all((p/name).exists() for name in reports):
        raise SystemExit("Native persistence evidence incomplete: require both consecutive relaunch comparisons")
    if not all(json.loads((p/name).read_text()).get("pass") is True for name in reports):
        raise SystemExit("One or more native canonical persistence comparisons FAILED")
    print("INSTALL + TWO FORCE-STOP RELAUNCHES PASS; same persisted mission/contract IDs and Dashboard KPIs in real debuggable TEST APK")
else:
    print("INSTALL + LAUNCH + RELAUNCH PASS; screenshot-only evidence. Canonical state persistence UNVERIFIED on protected signed APK")
from xml.etree import ElementTree
def snapshot(name):
    path=p/name
    if not path.exists(): return None
    try:
        root=ElementTree.fromstring(path.read_text(errors="replace"))
        values=sorted((n.attrib.get("text","").strip(),n.attrib.get("content-desc","").strip())
                      for n in root.iter("node") if n.attrib.get("text") or n.attrib.get("content-desc"))
        return values
    except ElementTree.ParseError: return None
before=snapshot("step4-hierarchy.xml")
after=snapshot("step5-hierarchy.xml")
if before is not None and after is not None:
    import json
    (p/"native-accessibility-comparison.json").write_text(json.dumps({
        "before_node_count":len(before),"after_node_count":len(after),
        "same_accessibility_labels":before==after,
        "NOTE":"Accessibility labels are NOT canonical persisted mission/contract state; layout/time can change labels."
    },indent=2))
    print("Native accessibility snapshots compared; canonical data persistence still UNVERIFIED")
else:
    print("Native accessibility comparisons unavailable; canonical data persistence UNVERIFIED")
if (p/"step5-hierarchy.xml").exists():
    xml=(p/"step5-hierarchy.xml").read_text(errors="replace")
    print("Accessibility tree after native relaunch available:",len(xml),"bytes; WebView exposes label:", "Continue" in xml or "Finish" in xml)
else:
    print("Accessibility tree unavailable; verify native Finish/relaunch screenshots before claiming successful completion")
PY

# Verify a REAL installed debug WebView posts an Android countdown notification
# that remains present with the display asleep, and removes it on pause.
# Never inspect synthetic JS only and call that a lock-screen success.
if [[ "$NATIVE_STATE_TEST" -eq 1 ]]; then
  python3 android/tools/native_focus_lock_probe.py
else
  echo "::notice::Protected signed APK: lock-screen notification CDP probe skipped (no debuggability)"
fi
