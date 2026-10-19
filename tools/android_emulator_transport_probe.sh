#!/usr/bin/env bash
# GRANADA CI-only emulator A/B health probe (#139).
# Test an idle API36 emulator, then the *same* VM with the SHA-verified
# official public release APK. Never read or reset an owner's app data.
set -Eeuo pipefail

# The hosted Android SDK has printed both tab- and space-delimited
# adb devices -l rows. Reject offline/unauthorized rows, not valid devices.
if [[ "${1:-}" == "--self-test" ]]; then
  for row in "${MLV_HEALTH_OUT:-artifacts/emulator-health}"
APK="${MLV_HEALTH_APK:-artifacts/emulator-health-release/MichelsLife-Android-Direct-v0.2.9.apk}"
PACKAGE="com.michelslab.michelslife"
mkdir -p "$OUT"
status="FAILED"
phase="setup"
sample="0"
started="$(date -u +%FT%TZ)"

finish() {
  local rc=$?
  trap - EXIT
  {
    printf 'result=%s\n' "$status"
    printf 'exit_code=%s\n' "$rc"
    printf 'last_phase=%s\n' "$phase"
    printf 'last_sample=%s\n' "$sample"
    printf 'started_utc=%s\n' "$started"
    printf 'finished_utc=%s\n' "$(date -u +%FT%TZ)"
    printf 'candidate=public-signed-android-direct-v0.2.9\n'
    printf 'provenance=public-github-release-sha256-verified-before-emulator\n'
    printf 'source=installed-emulator-not-personal-device\n'
  } > "$OUT/result.env"
  (timeout 6s adb devices -l > "$OUT/final-devices.txt" 2>&1 || true)
  (timeout 8s adb shell getprop sys.boot_completed > "$OUT/final-boot.txt" 2>&1 || true)
  (timeout 8s adb shell pidof "$PACKAGE" > "$OUT/final-app-pid.txt" 2>&1 || true)
  # Only crash tags from a synthetic no-login emulator; no full state export.
  (timeout 8s adb logcat -d -t 250 -s AndroidRuntime:E libc:F > "$OUT/native-crash-tags.log" 2>&1 || true)
  exit "$rc"
}
trap finish EXIT

fail() {
  printf 'PROBE_FAILURE phase=%s sample=%s reason=%s\n' "$phase" "$sample" "$1" | tee -a "$OUT/probe-errors.txt" >&2
  exit 1
}
record_host() {
  {
    printf 'UTC: '; date -u +%FT%TZ
    printf '--- system memory ---\n' 2>/dev/null || true
    free -m || true
    printf '--- emulator/adb processes ---\n' 2>/dev/null || true
    ps -eo pid,ppid,stat,%cpu,%mem,rss,comm,args |
      grep -E '[e]mulator|[q]emu-system|[a]db' |
      sed -E 's/(androidboot.qemu.adb.pubkey=)[^ ]+/\1[redacted]/g' | head -30 || true
  } > "$OUT/host-$phase-$sample.txt"
}
check_png() {
  python3 - "$1" <<'PY'
import pathlib,struct,sys
data=pathlib.Path(sys.argv[1]).read_bytes()
if len(data)<1500 or data[:8]!=bytes.fromhex("89504e470d0a1a0a"):
    raise SystemExit("Not a meaningful captured PNG")
width,height=struct.unpack(">II",data[16:24])
if width<300 or height<400:
    raise SystemExit("Screenshot dimensions invalid")
PY
}
probe_once() {
  sample="$1"
  local name="$phase-$sample"
  record_host
  if ! timeout 15s adb devices -l > "$OUT/devices-$name.txt" 2>&1; then fail "adb devices timed out"; fi
  if ! grep -Eq '^emulator-[0-9]+[[:space:]]+device([[:space:]]|$)' "$OUT/devices-$name.txt"; then fail "emulator not in adb device state"; fi
  if ! timeout 15s adb shell getprop sys.boot_completed > "$OUT/boot-$name.txt" 2>&1; then fail "boot property unavailable"; fi
  if ! grep -qx '1' <(tr -d '\r' < "$OUT/boot-$name.txt"); then fail "emulator no longer booted"; fi
  if ! timeout 20s adb exec-out screencap -p > "$OUT/frame-$name.png" 2>"$OUT/screencap-$name.err"; then
    fail "native screenshot transport dropped"
  fi
  if ! check_png "$OUT/frame-$name.png"; then fail "native screenshot invalid"; fi
  if [[ "$phase" == "installed" ]]; then
    if ! timeout 15s adb shell pidof "$PACKAGE" > "$OUT/pid-$name.txt" 2>&1; then
      fail "official app process unavailable"
    fi
    if ! grep -Eq '^[0-9]+([[:space:]]+[0-9]+)*$' "$OUT/pid-$name.txt"; then
      fail "installed app process exited"
    fi
  fi
  printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$phase" "$sample" "PASS" >> "$OUT/samples.tsv"
  echo "PASS $name: live Android VM, boot property, real emulator pixels, expected process state"
}

phase="baseline"
if ! timeout 60s adb wait-for-device; then fail "initial adb boot handshake"; fi
echo "Probe baseline emulator without Michel's Life installed"
if timeout 10s adb shell pm path "$PACKAGE" | grep -q '^package:'; then
  fail "baseline was not a clean no-app emulator"
fi
# Same phase cadence pre/post APK: 8 capture samples, 15-second apart.
for i in 1 2 3 4 5 6 7 8; do
  probe_once "$i"
  if [[ "$i" != "8" ]]; then sleep 15; fi
done

phase="install"
sample="0"
if [[ ! -s "$APK" ]]; then fail "official signed APK missing"; fi
if ! timeout 110s adb install -r "$APK" > "$OUT/install-result.txt" 2>&1; then
  fail "official published APK install failed"
fi
if ! grep -q 'Success' "$OUT/install-result.txt"; then fail "APK install not confirmed"; fi
if ! timeout 30s adb shell am start -W -n "$PACKAGE/.MainActivity" > "$OUT/launch-result.txt" 2>&1; then
  fail "native Activity launch failed"
fi
if ! grep -q 'Status: ok' "$OUT/launch-result.txt"; then
  fail "native Android launch status missing"
fi
sleep 12
phase="installed"
for i in 1 2 3 4 5 6 7 8; do
  probe_once "$i"
  if [[ "$i" != "8" ]]; then sleep 15; fi
done

status="PASS"
echo "PASS: API36 emulator survived baseline and SHA-verified public APK phases with 16 actual PNG captures"
emulator-5554\tdevice product:pixel_6' 'emulator-5554 device product:pixel_6'; do
    printf '%s\n' "$row" | grep -Eq '^emulator-[0-9]+[[:space:]]+device([[:space:]]|$)' ||
      { echo "FAIL: valid emulator row rejected" >&2; exit 1; }
  done
  for row in "${MLV_HEALTH_OUT:-artifacts/emulator-health}"
APK="${MLV_HEALTH_APK:-artifacts/emulator-health-release/MichelsLife-Android-Direct-v0.2.9.apk}"
PACKAGE="com.michelslab.michelslife"
mkdir -p "$OUT"
status="FAILED"
phase="setup"
sample="0"
started="$(date -u +%FT%TZ)"

finish() {
  local rc=$?
  trap - EXIT
  {
    printf 'result=%s\n' "$status"
    printf 'exit_code=%s\n' "$rc"
    printf 'last_phase=%s\n' "$phase"
    printf 'last_sample=%s\n' "$sample"
    printf 'started_utc=%s\n' "$started"
    printf 'finished_utc=%s\n' "$(date -u +%FT%TZ)"
    printf 'candidate=public-signed-android-direct-v0.2.9\n'
    printf 'provenance=public-github-release-sha256-verified-before-emulator\n'
    printf 'source=installed-emulator-not-personal-device\n'
  } > "$OUT/result.env"
  (timeout 6s adb devices -l > "$OUT/final-devices.txt" 2>&1 || true)
  (timeout 8s adb shell getprop sys.boot_completed > "$OUT/final-boot.txt" 2>&1 || true)
  (timeout 8s adb shell pidof "$PACKAGE" > "$OUT/final-app-pid.txt" 2>&1 || true)
  # Only crash tags from a synthetic no-login emulator; no full state export.
  (timeout 8s adb logcat -d -t 250 -s AndroidRuntime:E libc:F > "$OUT/native-crash-tags.log" 2>&1 || true)
  exit "$rc"
}
trap finish EXIT

fail() {
  printf 'PROBE_FAILURE phase=%s sample=%s reason=%s\n' "$phase" "$sample" "$1" | tee -a "$OUT/probe-errors.txt" >&2
  exit 1
}
record_host() {
  {
    printf 'UTC: '; date -u +%FT%TZ
    printf '--- system memory ---\n' 2>/dev/null || true
    free -m || true
    printf '--- emulator/adb processes ---\n' 2>/dev/null || true
    ps -eo pid,ppid,stat,%cpu,%mem,rss,comm,args |
      grep -E '[e]mulator|[q]emu-system|[a]db' |
      sed -E 's/(androidboot.qemu.adb.pubkey=)[^ ]+/\1[redacted]/g' | head -30 || true
  } > "$OUT/host-$phase-$sample.txt"
}
check_png() {
  python3 - "$1" <<'PY'
import pathlib,struct,sys
data=pathlib.Path(sys.argv[1]).read_bytes()
if len(data)<1500 or data[:8]!=bytes.fromhex("89504e470d0a1a0a"):
    raise SystemExit("Not a meaningful captured PNG")
width,height=struct.unpack(">II",data[16:24])
if width<300 or height<400:
    raise SystemExit("Screenshot dimensions invalid")
PY
}
probe_once() {
  sample="$1"
  local name="$phase-$sample"
  record_host
  if ! timeout 15s adb devices -l > "$OUT/devices-$name.txt" 2>&1; then fail "adb devices timed out"; fi
  if ! grep -Eq '^emulator-[0-9]+[[:space:]]+device([[:space:]]|$)' "$OUT/devices-$name.txt"; then fail "emulator not in adb device state"; fi
  if ! timeout 15s adb shell getprop sys.boot_completed > "$OUT/boot-$name.txt" 2>&1; then fail "boot property unavailable"; fi
  if ! grep -qx '1' <(tr -d '\r' < "$OUT/boot-$name.txt"); then fail "emulator no longer booted"; fi
  if ! timeout 20s adb exec-out screencap -p > "$OUT/frame-$name.png" 2>"$OUT/screencap-$name.err"; then
    fail "native screenshot transport dropped"
  fi
  if ! check_png "$OUT/frame-$name.png"; then fail "native screenshot invalid"; fi
  if [[ "$phase" == "installed" ]]; then
    if ! timeout 15s adb shell pidof "$PACKAGE" > "$OUT/pid-$name.txt" 2>&1; then
      fail "official app process unavailable"
    fi
    if ! grep -Eq '^[0-9]+([[:space:]]+[0-9]+)*$' "$OUT/pid-$name.txt"; then
      fail "installed app process exited"
    fi
  fi
  printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$phase" "$sample" "PASS" >> "$OUT/samples.tsv"
  echo "PASS $name: live Android VM, boot property, real emulator pixels, expected process state"
}

phase="baseline"
if ! timeout 60s adb wait-for-device; then fail "initial adb boot handshake"; fi
echo "Probe baseline emulator without Michel's Life installed"
if timeout 10s adb shell pm path "$PACKAGE" | grep -q '^package:'; then
  fail "baseline was not a clean no-app emulator"
fi
# Same phase cadence pre/post APK: 8 capture samples, 15-second apart.
for i in 1 2 3 4 5 6 7 8; do
  probe_once "$i"
  if [[ "$i" != "8" ]]; then sleep 15; fi
done

phase="install"
sample="0"
if [[ ! -s "$APK" ]]; then fail "official signed APK missing"; fi
if ! timeout 110s adb install -r "$APK" > "$OUT/install-result.txt" 2>&1; then
  fail "official published APK install failed"
fi
if ! grep -q 'Success' "$OUT/install-result.txt"; then fail "APK install not confirmed"; fi
if ! timeout 30s adb shell am start -W -n "$PACKAGE/.MainActivity" > "$OUT/launch-result.txt" 2>&1; then
  fail "native Activity launch failed"
fi
if ! grep -q 'Status: ok' "$OUT/launch-result.txt"; then
  fail "native Android launch status missing"
fi
sleep 12
phase="installed"
for i in 1 2 3 4 5 6 7 8; do
  probe_once "$i"
  if [[ "$i" != "8" ]]; then sleep 15; fi
done

status="PASS"
echo "PASS: API36 emulator survived baseline and SHA-verified public APK phases with 16 actual PNG captures"
emulator-5554\toffline' 'emulator-5554 unauthorized' 'List of devices attached'; do
    if printf '%s\n' "$row" | grep -Eq '^emulator-[0-9]+[[:space:]]+device([[:space:]]|$)'; then
      echo "FAIL: inactive emulator row accepted" >&2; exit 1
    fi
  done
  echo "PASS: adb device parser accepts real spacing and rejects offline/unauthorized states"
  exit 0
fi

OUT="${MLV_HEALTH_OUT:-artifacts/emulator-health}"
APK="${MLV_HEALTH_APK:-artifacts/emulator-health-release/MichelsLife-Android-Direct-v0.2.9.apk}"
PACKAGE="com.michelslab.michelslife"
mkdir -p "$OUT"
status="FAILED"
phase="setup"
sample="0"
started="$(date -u +%FT%TZ)"

finish() {
  local rc=$?
  trap - EXIT
  {
    printf 'result=%s\n' "$status"
    printf 'exit_code=%s\n' "$rc"
    printf 'last_phase=%s\n' "$phase"
    printf 'last_sample=%s\n' "$sample"
    printf 'started_utc=%s\n' "$started"
    printf 'finished_utc=%s\n' "$(date -u +%FT%TZ)"
    printf 'candidate=public-signed-android-direct-v0.2.9\n'
    printf 'provenance=public-github-release-sha256-verified-before-emulator\n'
    printf 'source=installed-emulator-not-personal-device\n'
  } > "$OUT/result.env"
  (timeout 6s adb devices -l > "$OUT/final-devices.txt" 2>&1 || true)
  (timeout 8s adb shell getprop sys.boot_completed > "$OUT/final-boot.txt" 2>&1 || true)
  (timeout 8s adb shell pidof "$PACKAGE" > "$OUT/final-app-pid.txt" 2>&1 || true)
  # Only crash tags from a synthetic no-login emulator; no full state export.
  (timeout 8s adb logcat -d -t 250 -s AndroidRuntime:E libc:F > "$OUT/native-crash-tags.log" 2>&1 || true)
  exit "$rc"
}
trap finish EXIT

fail() {
  printf 'PROBE_FAILURE phase=%s sample=%s reason=%s\n' "$phase" "$sample" "$1" | tee -a "$OUT/probe-errors.txt" >&2
  exit 1
}
record_host() {
  {
    printf 'UTC: '; date -u +%FT%TZ
    printf '--- system memory ---\n' 2>/dev/null || true
    free -m || true
    printf '--- emulator/adb processes ---\n' 2>/dev/null || true
    ps -eo pid,ppid,stat,%cpu,%mem,rss,comm,args |
      grep -E '[e]mulator|[q]emu-system|[a]db' |
      sed -E 's/(androidboot.qemu.adb.pubkey=)[^ ]+/\1[redacted]/g' | head -30 || true
  } > "$OUT/host-$phase-$sample.txt"
}
check_png() {
  python3 - "$1" <<'PY'
import pathlib,struct,sys
data=pathlib.Path(sys.argv[1]).read_bytes()
if len(data)<1500 or data[:8]!=bytes.fromhex("89504e470d0a1a0a"):
    raise SystemExit("Not a meaningful captured PNG")
width,height=struct.unpack(">II",data[16:24])
if width<300 or height<400:
    raise SystemExit("Screenshot dimensions invalid")
PY
}
probe_once() {
  sample="$1"
  local name="$phase-$sample"
  record_host
  if ! timeout 15s adb devices -l > "$OUT/devices-$name.txt" 2>&1; then fail "adb devices timed out"; fi
  if ! grep -Eq '^emulator-[0-9]+[[:space:]]+device([[:space:]]|$)' "$OUT/devices-$name.txt"; then fail "emulator not in adb device state"; fi
  if ! timeout 15s adb shell getprop sys.boot_completed > "$OUT/boot-$name.txt" 2>&1; then fail "boot property unavailable"; fi
  if ! grep -qx '1' <(tr -d '\r' < "$OUT/boot-$name.txt"); then fail "emulator no longer booted"; fi
  if ! timeout 20s adb exec-out screencap -p > "$OUT/frame-$name.png" 2>"$OUT/screencap-$name.err"; then
    fail "native screenshot transport dropped"
  fi
  if ! check_png "$OUT/frame-$name.png"; then fail "native screenshot invalid"; fi
  if [[ "$phase" == "installed" ]]; then
    if ! timeout 15s adb shell pidof "$PACKAGE" > "$OUT/pid-$name.txt" 2>&1; then
      fail "official app process unavailable"
    fi
    if ! grep -Eq '^[0-9]+([[:space:]]+[0-9]+)*$' "$OUT/pid-$name.txt"; then
      fail "installed app process exited"
    fi
  fi
  printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$phase" "$sample" "PASS" >> "$OUT/samples.tsv"
  echo "PASS $name: live Android VM, boot property, real emulator pixels, expected process state"
}

phase="baseline"
if ! timeout 60s adb wait-for-device; then fail "initial adb boot handshake"; fi
echo "Probe baseline emulator without Michel's Life installed"
if timeout 10s adb shell pm path "$PACKAGE" | grep -q '^package:'; then
  fail "baseline was not a clean no-app emulator"
fi
# Same phase cadence pre/post APK: 8 capture samples, 15-second apart.
for i in 1 2 3 4 5 6 7 8; do
  probe_once "$i"
  if [[ "$i" != "8" ]]; then sleep 15; fi
done

phase="install"
sample="0"
if [[ ! -s "$APK" ]]; then fail "official signed APK missing"; fi
if ! timeout 110s adb install -r "$APK" > "$OUT/install-result.txt" 2>&1; then
  fail "official published APK install failed"
fi
if ! grep -q 'Success' "$OUT/install-result.txt"; then fail "APK install not confirmed"; fi
if ! timeout 30s adb shell am start -W -n "$PACKAGE/.MainActivity" > "$OUT/launch-result.txt" 2>&1; then
  fail "native Activity launch failed"
fi
if ! grep -q 'Status: ok' "$OUT/launch-result.txt"; then
  fail "native Android launch status missing"
fi
sleep 12
phase="installed"
for i in 1 2 3 4 5 6 7 8; do
  probe_once "$i"
  if [[ "$i" != "8" ]]; then sleep 15; fi
done

status="PASS"
echo "PASS: API36 emulator survived baseline and SHA-verified public APK phases with 16 actual PNG captures"
