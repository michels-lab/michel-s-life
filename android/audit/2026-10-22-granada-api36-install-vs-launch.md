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


## First real hosted AVD experiment (run #39864598092, 2026-10-22)

Exact commit `b3f51c466378a71b9862acaac485ff4aa0e7cfe4` produced a clear stage boundary:

- The officially published Android Direct APK passed its independent SHA256 manifest; 11/11 synthetic evidence tests passed.
- **Baseline (app absent): 8/8** real PNG samples passed with Android boot property, live ADB and no Michel's Life process.
- **Installed but not opened: 8/8** real PNG samples passed with the app installed, Android healthy, and the app process still absent.
- **Launched: 1/8** native sample passed with an actual launched MainActivity and app PID. The following sample exited `124` from a bounded ADB command timeout. The workflow and strict evidence manifest correctly failed and uploaded partial evidence, [artifact #12462939557](https://github.com/michels-lab/michel-s-life/actions/runs/39864598092/artifacts/12462939557).

**Inference:** installation alone was not sufficient to trigger the hosted Android16 failure in this same-run experiment. The failure was correlated with active app/WebView use after launch; QEMU host-vs-guest cause, renderer/hardware acceleration, memory pressure and whether an application bug contributed **remain unproven**. Never generalize this as a verified physical Galaxy crash or a definitive native code diagnosis.

### Second diagnostic iteration

Added phase/operation/sample-only trace (boot/ADB/pid/framebuffer/CRC), plus read-only **host process counts** (emulator, QEMU) and cgroup `oom`/`oom_kill` counters and used memory before the experiment and after a failure. All outputs are bounded categorical/numeric metadata only: no process arguments, environment, private app content, account tokens or journal. Native screenshot and the 24-image acceptance requirements are unchanged. Rerun the complete same-official-APK experiment at exact updated source; do not claim a second-round result until observed.
