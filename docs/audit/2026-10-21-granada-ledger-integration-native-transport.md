# Michel's Life — Operación Granada: Android ledger integrations and native transport truth

Date: 2026-10-21 (America/Monterrey). Product repository only: `michels-lab/michel-s-life`. Windows native packaging remains paused; no change to other apps or OpenFOAM repositories.

## Integration A — daily missions (#161, merged)

- [PR #161](https://github.com/michels-lab/michel-s-life/pull/161) merged as `031f6ce3b2c9d91daa0b9df0fa4c94f7c71e7512`.
- Exact tested PR source `1e04703ecb31d3ea61d752cae59d726258879b5f`.
- The original ledger regression was RED at `desktop_reload` / `reward_amount_changed`: the synthetic medium-difficulty fixture incorrectly seeded 25 XP, despite the canonical 50-XP medium reward. The correction keeps the strict before/after reward, completion-ID, undo, re-complete, no-double-tap, persisted Windows/Android-browser-roundtrip checks; it does not weaken any assertion.
- [Daily ledger workflow 39678762193](https://github.com/michels-lab/michel-s-life/actions/runs/39678762193) SUCCESS at exact PR source; [Source 39678762084](https://github.com/michels-lab/michel-s-life/actions/runs/39678762084), [Android UI 39678762156](https://github.com/michels-lab/michel-s-life/actions/runs/39678762156) and [UI 39678762085](https://github.com/michels-lab/michel-s-life/actions/runs/39678762085) SUCCESS. These are synthetic/browser validations, not signed Galaxy durability.

## Integration B — weekly Premium (#150, merged)

- [PR #150](https://github.com/michels-lab/michel-s-life/pull/150) merged as `86b0241ca310692618197fad2dbcf9e45dedd483`.
- Exact tested PR source `a3509f9aef036d159094f6d57e093db68f1fb3ad`.
- Protects one-time mission XP, repeated tap, Undo/new completion ID, week target=4, Windows reload and initial + two separate Android-browser bootstraps through the actual canonical portable-storage allowlist.
- [Source 39381078904](https://github.com/michels-lab/michel-s-life/actions/runs/39381078904) and [UI smoke 39381078847](https://github.com/michels-lab/michel-s-life/actions/runs/39381078847) SUCCESS. Transient Android Story/Pomodoro baseline issue caused earlier Android UI failure; [Android UI 39381078932 attempt 4](https://github.com/michels-lab/michel-s-life/actions/runs/39381078932) SUCCESS on exactly the PR source with no user app code changes. P0 #168/#171 are **not** closed by that intermittent success.

## Blocked track — Android15 exact native persistence (#166)

- [PR #166](https://github.com/michels-lab/michel-s-life/pull/166), exact source `697a886ff23c5e538395bd1a9873e55a9dda3bed`, remains DRAFT, OPEN and UNMERGED. Fix for missing CI-only Python `websocket-client` dependency and enhanced source/APK SHA-256/native-package provenance is implemented and synthetic gates PASS.
- [Real API35 job 39677022880](https://github.com/michels-lab/michel-s-life/actions/runs/39677022880) FAILED: exact debug APK compiled, installed successfully, launched, PID 2314 observed; *no* valid initial screenshot after 5 attempts. ADB showed `error: closed`, missing emulator serial and refused port 5554. No after-relaunch image or XP/mission comparison was accepted.
- Recorded in PR #166 and [issue #139](https://github.com/michels-lab/michel-s-life/issues/139). Do not treat a prior package install or an ADB restart as persistence evidence. Continue to coordinate with separate native transport PR #157; do not modify its owned scripts from a different track.

## Release and next GRANADA

Latest checked public [v3.0.221](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.221) remains Windows 3.0.221 / Android Direct 0.2.9. **No new app release**, RC, signed APK, cloud-provider or Galaxy acceptance in this operation.

Next independent high-impact blocks: P0 account separation #108 and private backup boundary #55 (source core in draft #169; no production integration), Story/Focus 412px submit obstruction #171 and intermittent JS error #168 (draft #170; candidate behavior is not shipped), Android native host #139 and signed persistence #104 (native PRs #157/#166). Keep Developer Twin #134, canonical frontend Data Health #156, native Calendar #160, native Drive #158 and other open PR scopes separate. Do not reactivate Windows builds, alter user records or mix Michel's Life with FoamLens/OpenFOAM/other projects.

State vocabulary: implemented → exact-head CI validated → merged → public release → provider/device verified → owner accepted. Only first three phases were reached for #150/#161.