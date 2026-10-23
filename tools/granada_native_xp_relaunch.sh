#!/usr/bin/env bash
# GRANADA — ACTUAL installed debuggable Michel's Life APK, synthetic progress
# and exactly two Android OS force-stop / relaunch cycles. Never live accounts.
set -Eeuo pipefail
readonly PKG="com.michelslab.michelslife"
readonly SERIAL="emulator-5554"
readonly OUT="artifacts/granada-native-xp-relaunch"
readonly APK="artifacts/granada-native-xp-candidate/app-debug.apk"
phase="bootstrap"
mkdir -p "$OUT"
trap 'result=$?; if ((result!=0)); then
  printf "GRANADA_NATIVE_XP_FAIL phase=%s code=%d\\n" "$phase" "$result" >&2
  printf "%s\\n" "$phase" > "$OUT/failed-phase.txt"
fi' EXIT

adb_safe(){ timeout 24s adb -s "$SERIAL" "$@"; }
verify_frame(){
  python3 - "$1" <<'PY'
import sys
from tools.granada_android16_phase_evidence import png_info
info=png_info(sys.argv[1])
assert info["width"]>=240 and info["height"]>=400
print("GRANADA_NATIVE_XP_PNG_PASS",info["width"],info["height"])
PY
}
native_shot(){
  local label="$1"
  phase="native_frame_$label"
  adb_safe exec-out screencap -p > "$OUT/$label.png"
  verify_frame "$OUT/$label.png"
}
native_pid(){
  local pid
  pid="$(adb_safe shell pidof "$PKG" | tr -d '\r\n[:space:]')"
  [[ "$pid" =~ ^[0-9]+$ ]] || { echo "::error::Missing actual Android process"; return 1; }
  printf "%s" "$pid"
}
capture_js(){
  local action="$1" output="$2" pid
  phase="native_cdp_$action"
  pid="$(native_pid)"
  adb_safe forward tcp:9222 "localabstract:webview_devtools_remote_$pid"
  if ! python3 tools/granada_native_xp_relaunch.py "$action" --port 9222 --output "$OUT/$output.json"; then
    adb_safe forward --remove tcp:9222 || true
    return 1
  fi
  adb_safe forward --remove tcp:9222
}
if [[ "${1:-}" == "--self-test" ]]; then
  bash -n "$0"
  python3 tools/granada_native_xp_relaunch.py self-test
  python3 -m unittest -v tools/test_granada_native_xp_relaunch.py
  echo "GRANADA_NATIVE_XP_OFFLINE_SELF_TEST_PASS"
  exit 0
fi

phase="verify_fresh_device"
test -s "$APK"
[[ "$(adb_safe shell getprop sys.boot_completed | tr -d '\r')" == "1" ]]
test -z "$(adb_safe shell pm path "$PKG" | tr -d '\r')"
phase="install_same_head_debug_apk"
adb_safe install -r "$APK"
adb_safe shell run-as "$PKG" id >/dev/null ||
  { echo "::error::Unsigned/signed production build may not expose test WebView"; exit 1; }
adb_safe shell dumpsys package "$PKG" | grep -qF 'versionName=0.2.9'
phase="launch_actual_webview"
adb_safe shell am start -W -n "$PKG/.MainActivity"
sleep 15
first_pid="$(native_pid)"
native_shot "before"
capture_js seed "canonical-before"
for number in 1 2; do
  phase="force_stop_$number"
  adb_safe shell am force-stop "$PKG"
  if adb_safe shell pidof "$PKG" | grep -qE '[0-9]'; then
    echo "::error::Android force-stop did not end the existing WebView process"
    exit 1
  fi
  phase="cold_restart_$number"
  adb_safe shell am start -W -n "$PKG/.MainActivity"
  sleep 16
  new_pid="$(native_pid)"
  if [[ "$new_pid" == "$first_pid" ]]; then
    echo "::error::Cold Android process PID was unexpectedly reused"
    exit 1
  fi
  first_pid="$new_pid"
  native_shot "after-$number"
  capture_js capture "canonical-after-$number"
done
phase="compare_native_canonical_ledger"
python3 tools/granada_native_xp_relaunch.py compare \
  --before "$OUT/canonical-before.json" \
  --first "$OUT/canonical-after-1.json" \
  --second "$OUT/canonical-after-2.json" \
  --output "$OUT/native-two-force-stop-ledger.json"
phase="complete"
printf '%s\n' "complete" > "$OUT/native-proof-complete.txt"
echo "GRANADA_NATIVE_XP_REAL_WEBVIEW_PASS; actual Android16 debug APK; 2 process restarts; no Galaxy/provider/release"
