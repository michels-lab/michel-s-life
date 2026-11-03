# GRANADA — Android16 same-official-APK phase experiment: integrated diagnostic closure
Date: 2026-10-22 · Scope: **Michel's Life only** · Repository: michels-lab/michel-s-life

## Merged infrastructure
- [PR #178](https://github.com/michels-lab/michel-s-life/pull/178) merged as `3ce9efd08270a2c647213192bd7d87017725cb49` after all four exact-head CI gates PASS (Source, UI, Android UI and real native API36 three-phase liveness).
- [Full evidence run #39871451561](https://github.com/michels-lab/michel-s-life/actions/runs/39871451561) on **exact PR HEAD** `585c2dfe2dd0b9305523bd495144e037ad879ff1`. Workflow confirms SHA256 of official published Android Direct v0.2.9 APK, isolated 3072MiB x86_64 Pixel 6 API36, and **24/24 actual CRC+SHA validated screenshots**, eight each with package absent, package installed and never launched, and application running with native PID. Downloaded earlier green artifact #12466975225 and observed genuine Michel's Life onboarding rendered pixels.
- The latest run emitted `GRANADA_ANDROID16_PHASE_EVIDENCE PASS`, `GRANADA_HOST_VERDICT NO_FAILURE_OBSERVED` rather than inventing crash metadata for a green run.
- Prior identical published APK on hosted runners failed in the running stage with `boot_property` timeout during launched sample 2. A host-only snapshot showed QEMU host process still counted, but no cgroup OOM counters available. **The hosted Android/WebView/ADB problem is intermittent, not conclusively repaired**. Keep [#139](https://github.com/michels-lab/michel-s-life/issues/139) open.

## NEXT test acceptance
[PR #170](https://github.com/michels-lab/michel-s-life/pull/170) has production Story/Focus safe-area source, real six-case Android touch browser acceptance, and now a separate new workflow `granada-android-native-xp-relaunch.yml` which compiles that **exact Story candidate** into a debuggable APK, uses fixed CI-only daily mission (50 XP, exact-once completion), and inspects canonical WebView saved/live mission+XP after **two real OS force-stop relaunches**. Its latest job must be checked at [native XP run #39888087655](https://github.com/michels-lab/michel-s-life/actions/runs/39888087655); this audit **does not claim an outcome for that new test**.

## Release and privacy hold
- 24/24 liveness screenshots **are not** two force-stop relaunches, signed APK, Galaxy physical touchscreen/keyboard, real A/B Supabase ownership, local vault integration, Android notification or XP persistence.
- Production PR #170 remains open/unmerged; #168 intermittent JS SyntaxError, #171 Story/Focusing overlap and #108 account switching must not be reported resolved solely by diagnostic evidence.
- No release candidate policy. Latest public release still **v3.0.221**, Android Direct **v0.2.9**. No Windows native packaging restart. No user account content, credentials or private data captured/published; no cross-project modules.
