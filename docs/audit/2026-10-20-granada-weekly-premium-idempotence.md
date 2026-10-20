# Operación GRANADA — weekly Premium contract integrity

Date: 2026-10-20, America/Monterrey.
Repo: michels-lab/michel-s-life.
Branch: granada/weekly-contract-progress-integrity-20261020.
Base main: acda7a400d71a508e16ed7122656f1627676080d.
Related issues: #54 (Android Premium Contracts parity), #104 (native XP/mission retention), #28 (same-account cloud sync).

## Scope and acceptance

New real-Chromium canonical test `tools/ui_weekly_premium_progress_roundtrip_smoke.mjs`, plus one dedicated step in the existing `ui-smoke.yml`, plus this audit. No shared app source or accepted graphics changed. No Kotlin/Android bridge/Developer Twin changes.

1. Create one synthetic **weekly Premium mission** in the unchanged shared business model with `weeklyTarget=4`, a stable test ID and a per-completion XP reward.
2. Complete once: require one unique dated completion and exactly one XP reward, with runtime state and stored state identical. Complete a second time on the same day: require unchanged XP/history.
3. Undo: require all reward XP refunded and the completion ID removed. Complete once again: require exactly one reward, one **new** unique completion ID, no premature archive and preserved weekly target 4.
4. Restart the Windows browser/runtime and require complete ID, target, completion history and XP unchanged.
5. Capture shareable state using actual `MLVCloudSharedStorageV30216.capture()`, restore through actual `restore()` in an isolated Android platform Chromium context, perform **two** Android bootstraps and require unchanged weekly target, exact XP, mission ID and completion ID. Double-tap in Android after restore must still be a no-op.
6. Run the same test in the repository's normal UI CI, preceded by a Node syntax check. Do not suppress failures or use synthetic provider success claims.

## Validation boundaries

The scenario uses the **real existing canonical mission and cloud-allowlist engines**, with synthetic test data. It does not establish a live Supabase account, backgrounded Android WebView, production signed APK or Galaxy physical acceptance, so it does not close #28/#54/#104. The Windows **test context** is allowed; Windows installers, MSIX and Desktop-native builds remain owner-paused.

Active draft owners #134 (Developer Twin native/updater), #135 (Calendar/Journal mobile), #138 (native debug XP persistence), and draft #149 (Journal conflict test) are file-disjoint. Exact-head source, browser UI and Android UI must pass before merging. No new release/tag.
