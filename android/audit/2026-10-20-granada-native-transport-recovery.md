# Operación GRANADA — Android 16 native transport recovery
Date: 2026-10-20 (America/Monterrey). Ownership: independent P0 CI transport resilience block under #139, designed to unblock the native persistence gate #104 and blocked Android UX PRs.

## Actual work packages

1. **Bounded recovery engine:** `android/tools/granada_relaunch_transport_guard.py` checks the EXACT Android serial `emulator-5554`, live ADB device state, `sys.boot_completed=1`, and a nonempty numeric PID for `com.michelslab.michelslife`. On transport loss it may restart only the CI-host ADB server twice; it never resets app storage, resets the emulator, relaunches the app or overrides persisted progress. Six finite attempts × 3-second intervals in candidate installer integration.
2. **Real candidate reinstall/relaunch wiring:** `android/tools/smoke_candidate_apk_install.sh` invokes the guard after the real APK has been installed, onboarded, state-captured and force-stopped/relaunched. A PASS still requires the installed app PID and booted emulator. Real screenshot capture and three separate canonical state comparisons across two restarts remain mandatory. The existing native `#104` checks are NOT disabled.
3. **Machine diagnostic:** atomic `artifacts/candidate-install/granada-relaunch-transport.json` with bounded status/code/attempt counts, without stdout, stderr, PIDs, login names, keys, tokens, journal, mission details, or account IDs. The report explicitly declares native persistence **unverified**, whether transport recovered or not, because a live process alone is not data parity.
4. **Synthetic regressions:** 16 unit tests of clean PID, lost transport recovery, boot failure, genuine app-exit detection, wrong/offline/ambiguous serial, malformed PID, bounded retries, no app restart, redacted evidence, CLI failure exit code and integration gate ownership.
5. **Dedicated CI:** `.github/workflows/granada-native-transport-recovery.yml` executes unit, Python syntax, Bash syntax and structural fail-closed checks separately from heavyweight Android 16 emulators. The existing Android build CI remains the **only real candidate APK proof**, never mocked.

## Provenance and observed blocker

On candidate [#156](https://github.com/michels-lab/michel-s-life/pull/156), [Android run 39403330462](https://github.com/michels-lab/michel-s-life/actions/runs/39403330462) compiled and installed a candidate APK, completed onboarding, captured a real before-state with WebView DevTools, force-stopped/relaunched the app, then **could not reverify the native process**, and port 5554 refused connection when shutting down the emulator. Therefore NO post-relaunch XP/mission/completion acceptance; not necessarily proof of an app regression.

Issue #139 already documents repeated ADB/host emulator flakiness across unrelated PRs. A process that has actually crashed must remain RED; merely restarting adb cannot turn an absent PID into a PASS. If the hosted VM has died entirely, the guard fails without inventing a successful native screenshot.

## Safety and integration boundaries

- Does NOT change Developer Twin #134 ownership of `.github/workflows/android-build.yml`, Kotlin, AndroidBridge, Developer auth, or native Developer smoke. Does NOT edit #138 `native_webview_state_probe.py`, #135 Calendar, #150 Premium, #151/152 Focus or #156 Data Health/frontend.
- Windows installer/MSIX native builds remain paused. Android debug APK built for CI is not a public release.
- Native Galaxy physical acceptance, signed Direct security, real account login/sync and app background behavior remain unverified.
- If a job fails under a restored live ADB connection but absent app process, investigate a real app crash and preserve that classification. Never add a blanket retry/continue-on-error that auto-masks failures.
- Do not merge until dedicated CI and existing source/native tests are assessed at exact branch HEAD. If emulator instability persists, record the red check and move to the next disjoint Granada block; no release.
