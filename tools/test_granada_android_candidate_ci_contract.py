#!/usr/bin/env python3
"""Negative regressions for Android's exact-head candidate and native host config."""
from pathlib import Path

SOURCE=Path(".github/workflows/android-build.yml")
PIN="ref: ${ github.event.pull_request.head.sha || github.sha }}"
VERIFY='test "$(git rev-parse HEAD)" = "${ github.event.pull_request.head.sha || github.sha }}"'

def verify(src):
    if "  installed-candidate-smoke:\n" not in src or "  android:\n" not in src:
        raise AssertionError("missing_native_or_builder_job")
    build,native=src.split("  installed-candidate-smoke:\n",1)
    build=build.split("  android:\n",1)[1]
    native=native.split("\n  installed-developer-smoke:",1)[0]
    for name,job in (("builder",build),("native",native)):
        if job.count(PIN)!=1 or job.count(VERIFY)!=1:
            raise AssertionError("wrong_exact_source_"+name)
    if "avd-name: michels-life-candidate-android16" not in native:
        raise AssertionError("wrong_emulator")
    options=native.split("avd-name: michels-life-candidate-android16",1)[1].split("script: bash android/tools/smoke_candidate_apk_install.sh",1)[0]
    if "ram-size: 3072M" not in options or "heap-size: 512M" not in options:
        raise AssertionError("missing_resource_parity")
    if "script: bash android/tools/smoke_candidate_apk_install.sh" not in native:
        raise AssertionError("native_smoke_replaced")
    if "continue-on-error: true" in native:
        raise AssertionError("native_failure_softened")

def reject(name,src):
    try:
        verify(src)
    except AssertionError:
        print("EXPECTED_NEGATIVE_PASS",name)
    else:
        raise AssertionError("NEGATIVE_FALSE_GREEN "+name)

if __name__=="__main__":
    original=SOURCE.read_text(encoding="utf-8")
    verify(original)
    reject("missing_ram",original.replace("ram-size: 3072M","",1))
    reject("missing_heap",original.replace("heap-size: 512M","",1))
    reject("synthetic_merge_sha",original.replace(PIN,"ref: ${ github.sha }}",1))
    reject("unchecked_source_sha",original.replace(VERIFY,"echo unchecked",1))
    reject("silent_native_failure",original.replace("script: bash android/tools/smoke_candidate_apk_install.sh","continue-on-error: true\n          script: bash android/tools/smoke_candidate_apk_install.sh",1))
    print("GRANADA_ANDROID_CANDIDATE_PROVENANCE_PARITY_PASS")
