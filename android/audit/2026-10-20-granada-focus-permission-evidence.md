# GRANADA — Focus native notification permission acceptance (2026-10-20)

Scope: **#53 only**, independent of native Kotlin change under PR #151. Do not alter the canonical JS timer, existing Chapter artwork, auth/Developer Twin PR #134, Calendar PR #135, persistence probe PR #138, Windows workflows or public binaries.

## Evidence acquisition on installed Android / Galaxy
After installing a permitted **official** build, change exactly one Android OS setting per scenario. Query the actual native Focus status returned by the Android bridge after each change (do not infer from the Settings toggle alone). Save **redacted** values in a locally controlled JSON file; do not check in screenshots, tokens, account data, or device IDs.

Required four entries, in order-independent form:
- `permission-denied`: POST_NOTIFICATIONS denied
- `app-disabled`: all app notifications disabled in Android Settings
- `completion-channel-muted`: app allowed, Focus completion notification channel disabled
- `allowed`: permission/app channel enabled

Input shape: `{"snapshots":[{"scenario":"permission-denied","status":{...actual native JSONObject...}}, ...]}`. The captured native status must expose `precision`, `backgroundDeliveryGuaranteed`, `notificationsGranted`, and `backgroundDelivery`. Run `node android/tools/verify_focus_notification_status.mjs <capture-path>`. Fail means not accepted; a passing synthetic fixture is **not** evidence. Capture the APK identity/signature, source SHA, OS build and screenshot separately; never publish owner data. The validator intentionally does not accept missing entries, ambiguous permission states or missing fields.

Additional **real-device** checks still needed: ongoing Pomodoro countdown while screen is locked; channel toggling while timer is running; pause/reset removes the ongoing notification; completion while backgrounded/Doze, delayed-delivery disclosure, reboot and force-stop behavior. Native completion must not be represented as exact or guaranteed under Doze.

## Status
- Validator source added on an isolated branch. It is **not executed against a physical Galaxy** in this block and should not be marked as physical acceptance.
- Existing `main` still reports unconditional `backgroundDelivery: true` in `NativeFocusAlarm.status()`. Corrective Android implementation is owned by draft PR #151 and **must not be edited concurrently here**.
- Merge/use this validator only when its source checks and review pass; physical status capture and native device acceptance remain open. No version increase, package build, release, UI redesign or modification to user data.


## 2026-10-26 — GRANADA continuation: fail-closed evidence consistency and privacy

**Specific defect in the earlier verifier:** a plausible-looking four-snapshot JSON could contain arbitrary private keys, omit actual NativeFocusAlarm fields, misreport the ongoing countdown or use an inconsistent `deliveryReason`, yet be presented as a successful 'real capture'. Pure JSON assertions cannot establish physical-device provenance; an apparent PASS must never be described as native-device proof.

**Changes scoped to this QA branch:** 
1. The executable validator now checks the exact expected set of `NativeFocusAlarm.status()` fields, types, channel/permission-specific delivery reason and countdown availability, inexact-alarm disclosure and nonnegative numeric deadline; rejects unexpected top-level/snapshot/status keys to prevent private strings entering the report.
2. A bounded 64 KiB input and categorical errors prevent raw private JSON from appearing in action logs; output explicitly states 'NOT physical-device verification'.
3. New `tools/test_granada_focus_evidence_contract.mjs` covers **21 synthetic acceptance/adversarial cases**: duplicate, missing, fabricated guarantee, mutable reason, muted channel, permission denied, types, private keys and inverted countdown reporting.
4. New `.github/workflows/granada-focus-evidence.yml` checks Node syntax and invokes the real regression test on the exact PR head, with no Android app build, packaging, visual changes or account actions.

**Evidence:** 21 pure evaluation cases were executed during generation with **21/21 passing**; the actual Node script and exact-head GitHub Actions outcome require separate CI verification. The physical Galaxy capture, APK source/signature provenance, screen-locked countdown and delivery under Doze are NOT evidenced here. PR #151 retains exclusive ownership of native Kotlin runtime correction. PR #152 stays DRAFT until its relevant gates are assessed. No release or merge performed by this block.
