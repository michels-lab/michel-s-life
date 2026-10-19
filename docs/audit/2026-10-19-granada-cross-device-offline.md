# Operación GRANADA — cross-device mission integrity and offline conflict recovery

Date: 2026-10-19 (America/Monterrey)  
Repo: `michels-lab/michel-s-life`  
Base verified: `main@30461e6ca24036154ff8d25c2ed368d071074d1a` (docs PR #136 merged, published GitHub release remains v3.0.221 / Android Direct 0.2.9).  
Task: #28 real Windows↔Android sync acceptance; **this PR only expands mock-provider regression, NOT real-provider/device certification**.  
Branch: `granada/cross-device-offline-integrity-20261019`  
File ownership: `tools/ui_supabase_cross_device_smoke.mjs`, this new dated log only.  
Status: source implementation staged, exact-head CI pending.

## Why this is a genuinely different GRANADA block

- Draft PR #134 still occupies the Android Developer Twin, Kotlin/WebView bridge, Direct updater, privacy, Android workflows and shared general/Android logs. CI includes unsuccessful installed Android APK/Developer smoke, so no merging or release claim.
- Draft PR #135 occupies Android Calendar/Journal post-render accessibility and its section smoke; Android UI/native gates failed on its previous head. Keep its scope untouched, do not mask a red CI by reporting source as validated.
- Docs PR #136 reached green exact-head source/UI/Android UI CI and was squash merged into `main` as `30461e6...` before opening this branch. No Windows packaging or production APK was built from this new branch.
- The master claim registry had no active claims on the check; GRANADA requires isolated work rather than branch collision.

## New regression contracts, all synthetic data

1. Seed **one** canonical mission on Windows after first account auth; ensure the first cloud snapshot preserves its exact ID and zero completions.
2. Android explicitly adopts the existing Windows master; after a real full browser reload both localStorage and the canonical in-memory model must contain the exact same single mission ID.
3. Complete that mission with the existing `completeMission()` action **twice**, checking that XP increases once and exactly one distinct completion ID exists.
4. Upload from Android, detect the newer revision on Windows without any silent overwrite, choose Use Cloud and reload; Windows must now contain exactly one mission, one completion and unchanged cumulative XP.
5. Introduce a scoped synthetic **Windows-only network outage** (mock Supabase returns 503), make a locally dirty XP edit, allow auto-sync attempt, and assert that remote revision/writes do not change and the local dirty state survives.
6. Independently advance Android's remote revision during the simulated Windows outage, reconnect Windows and require an explicit conflict, no silent cloud overwrite, and preservation of the unsynced local value.
7. Explicit Use Cloud must first write `before_download_local` recovery history containing the synthetic offline value. After reload the cloud winner and mission/completion identity must remain intact.

The test uses the existing mocked Supabase HTTP routing, real canonical frontend and existing browser UI smoke job; it does not add another sync engine, credentials or external account calls.

## Validation and handoff

- Direct GitHub source-write evidence: branch source commit `f8ef1b69be1454d3c06dbd5e26b517fa0d0ab544`.
- `ui-smoke.yml` already executes this exact file under `Audit Supabase cross-device Windows Android sync`; no CI workflow change required.
- **Pending:** syntax checks, exact-head browser UI CI in GitHub Actions and regression run; do not classify as passed until actual checks report success.
- **Still blocked outside CI:** physical Galaxy and Windows with real same account, deliberate disconnected edit/recovery, auth/session security, and signed in-place APK persistence. #28 remains open until these real-provider/hardware gates are accepted.
- No user data, app versions, Windows installer/MSIX workflow, release credentials or stable release artifact changed.

Re-entry: if UI CI fails, read its exact cross-device step/log, distinguish a failing real synchronization contract from fixture timing, repair only this test branch. If it passes, merge only after exact-head review; continue GRANADA with the next distinct issue. Do not collide with PR #134/#135, do not publish a release from test-only changes.
