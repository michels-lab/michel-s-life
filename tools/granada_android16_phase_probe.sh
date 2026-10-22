#!/usr/bin/env bash
# GRANADA #139 — same, officially published Android APK, three isolated states.
# This script collects ONLY synthetic/native screen evidence; never contacts
# live account providers, changes user records or claims persistence acceptance.
set -Eeuo pipefail

readonly SERIAL="emulator-5554"
readonly PKG="com.michelslab.michelslife"
readonly ACTIVITY="$PKG/.MainActivity"
readonly OUT="artifacts/granada-android16-phases"
readonly APK="${MLV_PHASE_APK:-artifacts/granada-phase-public/MichelsLife-Android-Direct-v0.2.9.apk}"
phase="preflight"
mkdir -p "$OUT"
on_exit(){
  local result="$?"
  trap - EXIT
  if ((result != 0)); then
    printf 'GRANADA_PHASE_FAIL stage=%s result=not_verified exit=%s\n' "$phase" "$result" >&2
    printf '%s\n' "$phase" > "$OUT/failed-stage.txt"
  fi
  exit "$result"
}
trap on_exit EXIT

adb_real(){
  timeout 22s adb -s "$SERIAL" "$@"
}
verify_png(){
  python3 - "$1" <<'PY'
import struct,sys,zlib
from pathlib import Path
p=Path(sys.argv[1])
b=p.read_bytes()
assert 100 < len(b) < 8_000_000 and b.startswith(b'\x89PNG\r\n\x1a\n'), 'invalid native PNG size/signature'
pos=8
saw_ihdr=saw_iend=False
while pos+12 <= len(b):
    size=struct.unpack('>I',b[pos:pos+4])[0]
    assert size <= 8_000_000 and pos+12+size <= len(b), 'truncated PNG chunk'
    kind=b[pos+4:pos+8]
    body=b[pos+8:pos+8+size]
    claimed=struct.unpack('>I',b[pos+8+size:pos+12+size])[0]
    assert zlib.crc32(kind+body)&0xffffffff == claimed, 'PNG CRC mismatch'
    if kind==b'IHDR':
        assert not saw_ihdr and len(body)==13
        width,height=struct.unpack('>II',body[:8])
        assert 240 <= width <= 4096 and 400 <= height <= 4096
        saw_ihdr=True
    if kind==b'IEND':
        assert size==0 and pos+12==len(b), 'trailing/malformed native frame'
        saw_iend=True
        break
    pos+=size+12
assert saw_ihdr and saw_iend, 'missing native PNG boundaries'
PY
}
sample(){
  local label="$1" index="$2" mode="$3" completed pid value frame
  phase="$label"
  completed="$(adb_real shell getprop sys.boot_completed | tr -d '\r')"
  test "$completed" = "1" || { echo "::error::Android boot disappeared during $label"; return 1; }
  value="$(adb_real get-state | tr -d '\r')"
  test "$value" = "device" || { echo "::error::ADB transport disappeared during $label"; return 1; }
  pid="$(adb_real shell pidof "$PKG" | tr -d '\r' || true)"
  case "$mode" in
    not_running)
      test -z "$pid" || { echo "::error::App unexpectedly started in $label"; return 1; };;
    running)
      test -n "$pid" || { echo "::error::App process absent in $label"; return 1; };;
    *) echo "::error::Unsupported sample expectation"; return 1;;
  esac
  frame="$OUT/$label-$index.png"
  adb_real exec-out screencap -p > "$frame"
  verify_png "$frame"
  printf 'PASS %s-%s native_pixels=real guest=%s app=%s\n' "$label" "$index" "$completed" "$mode"
}

test -s "$APK" || { echo "::error::No official SHA-verified public APK"; exit 1; }
# A new isolated AVD must not already have Michel's Life installed.
phase="baseline"
test -z "$(adb_real shell pm path "$PKG" | tr -d '\r')" ||
  { echo "::error::Nonempty preinstalled app breaks baseline"; exit 1; }
for i in 1 2 3 4 5 6 7 8; do
  sample "baseline" "$i" "not_running"
  sleep 8
done

phase="installed-idle"
adb_real install -r "$APK"
adb_real shell pm path "$PKG" | grep -qF "$PKG" ||
  { echo "::error::Package missing after official APK installation"; exit 1; }
for i in 1 2 3 4 5 6 7 8; do
  sample "installed-idle" "$i" "not_running"
  sleep 8
done

phase="launched"
adb_real shell am start -W -n "$ACTIVITY"
for i in 1 2 3 4 5 6 7 8; do
  sample "launched" "$i" "running"
  sleep 8
done
phase="verified-three-phases"
printf '%s\n' "complete" > "$OUT/phases-complete.txt"
echo "GRANADA_PHASES_NATIVE_PASS 24/24 real CRC-checked screenshots; not signed-device persistence proof"
