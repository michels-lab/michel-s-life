#!/usr/bin/env bash
# GRANADA Android16 — native candidate + bounded host diagnostic, never fake pixels.
# This runs INSIDE the actual Android emulator job, not on a browser fixture.
set -Eeuo pipefail
readonly OUT="artifacts/candidate-install-host"
mkdir -p "$OUT"
phase="preflight"
operation="host_status"
sample=0

snapshot(){
  local label="$1"
  {
    printf 'schema=mlv-granada-host-failure-v1\n'
    printf 'phase=%s\noperation=%s\nsample=%s\n' "$phase" "$operation" "$sample"
    if test -r /sys/fs/cgroup/memory.events; then
      awk '$1=="oom"||$1=="oom_kill"{if($2 ~ /^[0-9]+$/)print "cgroup_"$1"="$2}' /sys/fs/cgroup/memory.events
    fi
    if test -r /sys/fs/cgroup/memory.current; then
      awk '$1 ~ /^[0-9]+$/ {print "cgroup_memory_bytes="$1}' /sys/fs/cgroup/memory.current
    fi
    printf 'qemu_process_count='
    ps -e -o comm= 2>/dev/null | awk '$1 ~ /^qemu-system/ {n++} END{print n+0}'
    printf 'emulator_process_count='
    ps -e -o comm= 2>/dev/null | awk '$1=="emulator" {n++} END{print n+0}'
  } > "$OUT/host-$label.txt"
}
failed(){
  local status="$?"
  trap - EXIT
  if (( status != 0 )); then
    # Presence of the first REAL PNG indicates the launch was reached, not an
    # assumption about what crashed. Never publish raw logcat or user records.
    if test -s artifacts/candidate-install/step0.png; then
      phase="launched"
      sample=1
    fi
    operation="host_status"
    snapshot "after-failure" || true
    python3 tools/granada_android16_host_verdict.py \
      --root "$OUT" --source-sha "$(git rev-parse HEAD)" \
      --output "$OUT/diagnostic-verdict.json" || true
    printf 'GRANADA_CANDIDATE_NATIVE_SMOKE_FAILED status=%s diagnostic_not_release_acceptance\n' "$status" >&2
  fi
  exit "$status"
}
trap failed EXIT

snapshot "before"
# Keep the actual existing real install/onboarding/two-relaunch script. A
# missing native transport remains RED; no background retries or mocked frames.
bash android/tools/smoke_candidate_apk_install.sh

# Defense in depth: success must include three real canonical comparisons and
# time-separated CRC-complete framebuffer screenshots from this native run.
python3 - <<'PY'
import json
from pathlib import Path
from tools.granada_android16_phase_evidence import png_info
root=Path("artifacts/candidate-install")
for name in ("native-canonical-persistence-comparison.json",
             "native-canonical-second-relaunch-comparison.json",
             "native-canonical-consecutive-relaunch-comparison.json"):
    p=root/name
    if not p.is_file() or p.is_symlink():
        raise SystemExit("GRANADA_NATIVE_MISSING_REQUIRED_COMPARISON")
    record=json.loads(p.read_text(encoding="utf-8"))
    if record.get("pass") is not True:
        raise SystemExit("GRANADA_NATIVE_STATE_CHANGED_OR_UNVERIFIED")
for name in ("step0.png","step0-after-30s.png",
             "step4-after-native-finish.png","step5-after-relaunch-60s.png"):
    p=root/name
    if p.is_symlink() or not p.is_file():
        raise SystemExit("GRANADA_NATIVE_REQUIRED_FRAME_MISSING")
    png_info(p)
print("GRANADA_NATIVE_CANDIDATE_EVIDENCE_VALIDATED; debug emulator only")
PY
printf 'complete\n' > "$OUT/native-script-complete.txt"
echo "GRANADA_NATIVE_CANDIDATE_PASS; no physical Galaxy, account or release claim"
