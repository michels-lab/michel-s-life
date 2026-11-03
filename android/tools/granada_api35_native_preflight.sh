#!/usr/bin/env bash
# The emulator-runner invokes its 'script' via /bin/sh -c; this Bash entrypoint
# is explicit so pipefail is supported. Do not weaken native evidence gates.
set -euo pipefail

raw_size="$(timeout 15s adb shell wm size)"
pixels="$(printf '%s\n' "$raw_size" | tr -d '\r' | sed -n 's/^Physical size: //p' | head -n 1)"
if [[ "$pixels" != "1080x2400" ]]; then
  echo "::error::Uncalibrated native onboarding touch geometry: expected Pixel6 1080x2400" >&2
  exit 1
fi
echo "PASS: physical Android Pixel6 onboarding touch geometry verified (1080x2400)"

# --verify-geometry is ONLY for offline harness fixtures. Real CI always
# executes the original native APK install/onboarding/relaunch test below.
if [[ "${1:-}" == "--verify-geometry" ]]; then
  exit 0
fi
if [[ "$#" -ne 0 ]]; then
  echo "::error::Unexpected native preflight argument" >&2
  exit 2
fi
exec bash android/tools/smoke_candidate_apk_install.sh
