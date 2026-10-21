# GRANADA GRANDE — canonical daily-mission XP and history integrity

Date: 2026-10-21, America/Monterrey
Owner: Michel's Life Android / shared domain QA
Tracking: issues #54, #104 and #28
Branch: granada/android-daily-mission-ledger-20261021

## Ownership
This block is disjoint from existing draft product work. No Kotlin, AndroidBridge, user interface, Themes, Chapter, Store, Windows installer, Desktop runtime or release metadata changes. PRs #134, #135, #138, #150, #156, #157, #158 and #160 retain their distinct file ownership.

## Substantial deliverables
1. Strict reusable daily mission ledger invariant engine: exactly one record per expected ID, daily recurrence, no unintended archival, finite XP, rewards, unique completion IDs (including cross-mission collisions), dates, persisted-state consistency, and whitelisted diagnostic codes without private Journal, mission or token text.
2. Synthetic Node unit cases: valid/invalid mission fixtures, missing/duplicated/archived, invalid XP, missing/duplicate/cross-mission completion IDs, untouched-mission integrity and diagnostic redaction.
3. Actual canonical browser runtime on two platforms: mission A/B complete, duplicate-tap idempotence, exact XP/reward, undo independence, new completion ID after recompletion, desktop cold reload, cloud allowlist excluding synthetic device-only keys, Android cold bootstrap, Android duplicate tap, 360/412 reloads, Android undo/recomplete B, then reverse portable transfer to another desktop and cold reload.
4. Dedicated exact-head CI using already public AppBundle combined with the current checked-out source, no new release or native Windows build, all user data strictly synthetic.

## Evidence boundaries
- Initially written before exact-branch CI; NEVER claim success until actual workflow results were read.
- Tests the real canonical shared frontend in browser Android mode, not a physical signed APK, actual Google/Supabase or a Galaxy.
- Never mutate a real account, record private progress or automatically rewrite/delete any user's saved state.
- Issue #104 native reboot drift and #28 real two-device provider parity remain open. Native emulator transport #139 also remains a separate unresolved gate.
- No Windows build, merge, application version increase, user release or public binary is authorized.

## Re-entry
Inspect the exact pull-request head and its CI. Diagnose failures without weakening assertions. Keep this QA branch disjoint from #150 weekly Premium and all Android UI/Kotlin draft PRs.
