# 2026-10-12 — Android 16 native framebuffer/ADB transport recovery (candidate)

## Finding
PR #81 and #84 each passed the Android browser UI smoke and source/desktop checks, and the APK-build subjob passed, but their installed-candidate Android 16 jobs failed on the first native screenshot: `adb exec-out screencap -p` lost the emulator transport (`Unable to connect to adb daemon on port 5037`, `error: closed`, `emulator-5554 not found`, or `Missing real native Android pixels after five screenshot attempts`). Repeating exactly the same job is insufficient as a permanent solution. The prior independently validated #80 native job demonstrates the same release workflow *can* capture the installed app. This is a CI runtime/ADB instability observation, **not proof of an app UI defect** or of a successful native candidate.

## Bounded change
- Retain `adb exec-out screencap -p` as the primary Android framebuffer capture.
- On failed/invalid raw PNG bytes, try a real **on-device** `adb shell screencap -p /sdcard/mlv-ci-native-capture.png` and `adb pull` before retrying, requiring the same PNG signature and nontrivial size.
- If both paths fail and `adb devices -l` shows no connected device, restart the isolated CI job's adb server and wait for device reconnect. Keep five attempts and all failure diagnostics. **No fake screenshots, browser fallbacks, skipped native gates, downgraded API, or swallowed failures.**
- Run `bash -n` on the actual shell smoke script in Android workflow source validation.

## Evidence / status
Changes are implemented in isolated QA branch, not integrated. Exact-head APK build + Android 16 install/launch/screenshots must pass before merger. This helper is reusable across design PRs but does **not** automatically retest PR #81/#84 (different commit SHA), so those PRs still require own native validation, or an explicitly reconciled candidate with identical code and all required gates. Physical Galaxy remains unverified. No release or certificate change.
