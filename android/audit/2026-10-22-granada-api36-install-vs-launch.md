# Operación GRANADA — Android 16 install vs startup isolation
Date: 2026-10-22 · target ONLY michels-lab/michel-s-life.

## Evidence prompting this block
Existing #139 / draft #157 repeatedly lose hosted QEMU/ADB around 30 seconds after a public/debug APK starts. A prior exact official release A/B [run 39531746587](https://github.com/michels-lab/michel-s-life/actions/runs/39531746587) captured **eight valid baseline idle emulator frames** but failed on the first installed phase with `boot property unavailable`. Existing probe coupled install and launch, so it cannot distinguish **package installation** from **WebView/app startup**.

## This independent three-phase experiment
- Isolated new workflow `.github/workflows/granada-android16-install-launch-isolation.yml`: downloads the **already published** Android Direct v0.2.9 APK and checks its **published SHA256**; no APK compilation or new release.
- Same API36 x86_64 KVM Pixel 6 AVD, same host and the same verified APK: **8 PNGs without package installed**, **8 PNGs after package installed but never opened**, then **8 PNGs after real Activity launch with app PID checked**. This separates install vs launch without letting a healthy idle baseline be presented as a passing app.
- `tools/granada_android16_phase_probe.sh` checks live boot/ADB status, app process identity, real framebuffer PNG CRC, actual `pm path`, real `am start -W` and 24 unchanged native screenshots. Failures are fatal, produce a bounded stage-only marker and always preserve partial evidence. No capture of real user accounts or Journal.
- `tools/granada_android16_phase_evidence.py` verifies **all 24 actual native images** and their SHA256 digests, validates the workflow source SHA and refuses a green result if any image is missing/corrupt or failure marker exists. Eleven synthetic unit tests cover missing/stale/corrupt/fake data and forbidden native/physical-device success claims.
- Companion unit tests are CI-executed; full native outcome must be reported from exact PR commit. If the hosted emulator fails again, the **last successful phase** distinguishes failure mode without relaxing required persistence/second-relaunch gates in product's independent CI.

## Clear restrictions
This is root-cause **diagnostics**, not proof of Michel's Life production function. An idle emulator is NOT app QA. This cannot close #139/#104/#108/#168/#171, nor does it replace signed Galaxy, Play/Direct signing, release updater, actual account/provider privacy checks, or live physical user acceptance. PR #157 owns the existing transport scripts and remains untouched. PR #134 owns existing Android launcher/updater and remains untouched; #170's Story production source is not modified. Windows release work remains paused.

No public APK, Play/Store upload, release candidate, personal data, new external provider account, or other app was created.
