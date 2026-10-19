# Operación GRANADA — Android emulator transport A/B isolation (#139)
Date: 2026-10-19 (America/Monterrey).
Repository: michels-lab/michel-s-life.
Branch: granada/android-emulator-transport-health-20261019.
Parent main: b49e0dd431d6c7f99fbfd2dfb5b5366fb0ecb1e2 (PR #137 green and merged).
Owner scope: tools/android_emulator_transport_probe.sh, .github/workflows/android-emulator-transport-diagnostic.yml, and this dated audit.

## Confirmed prior results
- PR #138: exact-head source, Android build, Android UI and browser UI checks passed. The native debug candidate two-relaunch/XP persistence probe did not run to completion.
- Native job 118344415482 lost ADB at step0-after-30s.png. It logged error: closed, emulator-5554 not found and refusal on TCP/5554 after five attempts. This is a failed native gate, not a successful XP persistence validation.
- PR #134 Developer Twin native proof remains red; PR #135 native proof remains red on similar emulator transport loss. PR #135 separately has a red browser accessibility test.
- Shared CI instability is a plausible hypothesis but NOT proven. A baseline without the installed app is needed to discriminate.

## Independent diagnostic implemented
1. Download official public unified v3.0.221 Android Direct 0.2.9 APK plus the published SHA256 manifest; verify with sha256sum -c.
2. Run same Android16 Google APIs Pixel6 emulator settings as the production smoke (KVM; SwiftShader GLES; Vulkan disabled).
3. First observe a clean emulator with no Michel's Life installed: eight separated native PNG captures, boot checks, ADB state and host processes/memory.
4. Install and launch the verified official APK in that SAME VM. Observe another eight separated native frames plus app PID/ADB/boot.
5. Keep precise failed phase/sample, host and device telemetry, result.env, real diagnostic PNG and limited synthetic no-login crash tags. Fail closed on absent/invalid pixels or lost ADB; no simulated screenshot; no continue-on-error for the probe.
6. Baseline-only failure implicates emulator infrastructure without app; installed-only failure implicates app/WebView workload or its interaction with emulator, but neither result alone proves root cause. Both phases green is a single diagnostic trial, not proof all emulator flakiness is gone.

## Scope and next action
Only new diagnostic workflow/script/log; no changes to AndroidBridge, Developer Twin #134 files, Calendar #135 files, source versions, Android signatures, native smoke script, Windows or release process.
Workflow runs for this diagnostic's paths on PR and can be manually dispatched. Native screenshots and exact-head results remain pending at source-authoring time.
Read exact head job and uploaded real evidence before deciding a fix. Rerun candidate installed native persistence separately for #138; keep #104 and #139 open until accepted. Physical Galaxy/Google Play/live provider acceptance is not implied.
