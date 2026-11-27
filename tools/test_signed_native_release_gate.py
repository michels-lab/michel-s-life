#!/usr/bin/env python3
"""Fail-closed contract for the immutable Android Direct native release gate.

These checks prevent a future CI refactor from silently converting an emulator
failure into publication, accepting a debug APK, or reusing stale first-attempt
screenshots as evidence from a fallback device.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
workflow = (ROOT / ".github/workflows/release-android-direct-v0211.yml").read_text()

def section(first, second):
    assert first in workflow, f"Missing job {first}"
    assert second in workflow, f"Missing job {second}"
    return workflow.split(first, 1)[1].split(second, 1)[0]

native = section("  signed-native-api35:\n", "  publish-unified:\n")
publish = workflow.split("  publish-unified:\n", 1)[1]

assert native.count("uses: reactivecircus/android-emulator-runner@v2") == 2
assert native.count("continue-on-error: true") == 2
assert "id: primary" in native and "id: fallback" in native
assert "if: steps.primary.outcome != 'success'" in native
assert "if: always()" in native
assert "avd-name: mlv-direct-0211-primary" in native
assert "avd-name: mlv-direct-0211-alternate" in native
assert "-gpu software" in native and "-gpu swiftshader_indirect" in native
assert "MLV_REQUIRE_PROTECTED_SIGNED: '1'" in native
assert "MichelsLife-Direct-v0.2.11-SIGNED" in native
assert "mv artifacts/candidate-install artifacts/primary-native-failed" in native
assert "script: bash android/tools/smoke_candidate_apk_install.sh" in native
assert "PRIMARY_OUTCOME:" in native and "FALLBACK_OUTCOME:" in native
assert 'if [ "$PRIMARY_OUTCOME" != "success" ] && [ "$FALLBACK_OUTCOME" != "success" ]; then' in native
assert "exit 1" in native
assert 'test -s "$APK"' in native
assert re.search(r"test -s\s+\"artifacts/candidate-install/\$image\"", native)
assert "step4-after-native-finish.png" in native
assert "step5-after-relaunch.png" in native

# A failed native job must still block a public release. Neither the native
# job nor the publish job can use a permissive condition.
assert "needs: [exact-source-gate, build-signed-android, signed-native-api35]" in publish
assert "if: always()" not in publish
assert "continue-on-error: true" not in publish
assert "gh release create" in publish and "gh release edit" in publish
assert "ANDROID_DIRECT_CERT_SHA256" in workflow
assert "0.2.11" in workflow and "versionCode==13" in workflow
print("PASS: signed-native v0.2.11 uses independent real-device attempts, no stale evidence and fail-closed publication")
