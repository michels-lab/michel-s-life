# Michel's Life — Current handoff

Updated: 2026-10-14 (America/Monterrey)
Owner: Michel's Lab
Canonical repository: `michels-lab/michel-s-life`
Default branch: `main`
Main HEAD verified before this documentation branch: `58ae3aa43ae08037794cf88783e933fabd3e2066`
Source of truth: `GIT_AUDIT_LOG.md`, `android/ANDROID_AUDIT_LOG.md`, `docs/INFRASTRUCTURE_AUDIT.md`.
Older handoff preserved: `docs/audit/HANDOFF_LEGACY_2026-10-05.md` (do not follow the legacy repository/branch/versions).

## Real published customer build

- Official unified release: https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.218
- Published 2026-10-12: Windows **v3.0.218**, Android Direct **v0.2.6 / versionCode 8**; independent version numbers, same release, installer, portable, permanent Android signing manifest and checksums.
- Source release workflow `38296739118`: exact-source, Windows installed binary, signed Android APK and Android16 install jobs passed, **publisher job failed**. The separate public release page and its 13 assets exist; do not report the failed workflow as green or publish another release to "repair" history.
- Source HEAD `58ae3aa` CI: Source validation `38296738741`, UI smoke `38296738897`, Android UI smoke `38296738776` succeeded. These do not prove physical Galaxy or live account integration.

## Active priority and blockers

1. **Mobile-first design and usability (#54):** preserve approved Windows visual system/Themes/backgrounds/Chapter/typography; Android uses one canonical shared data model with touch-first UX. Browser 320/360/412-pixel layout/touch tests exist. Physical Galaxy gestures, keyboard, scrolling and rendered acceptance remain required before closure.
2. **Android onboard state drift (#104, P0):** native signed v0.2.6 emulator screenshots show Today missions `0/3`, Contracts `0 active` after Finish, then `0/18`, `71 active` after same-app relaunch. Root cause is unverified. See https://github.com/michels-lab/michel-s-life/issues/104.
3. **Same-account sync (#28):** verify Windows ↔ Galaxy Supabase first-device authority, two-way writes, offline/reconnect, conflict recovery, no duplicate XP/IDs and secret isolation with real account/devices. Browser mocks are not proof.
4. **Focus background alarms (#53):** native single-session notification bridge exists; real Galaxy lock-screen/Doze permission, alarm precision and general repeat reminders remain unverified.
5. **Windows installed visual gate (#62 PR):** native installed Home/About screenshots and actual visible/clickable header/About remain blocked/require exact installed runtime evidence.
6. **Additional post-release P0/P1:** cross-account board isolation, Google Calendar Android silent no-op, Android Direct official updater and safe cloud restore must not be reported solved without implementation and provider/device validation.

## Current candidate work (not merged, no release authorization)

- PR #111: https://github.com/michels-lab/michel-s-life/pull/111
- Branch: `test/android-onboarding-relaunch-state-20261014`; HEAD `62f326f415b9c2d9c1751ee0a8de4576a6044a14`.
- Scope: Android UI browser-model first-run wizard, saved mission/contract identities and dashboard KPI comparisons across true reload; writes dated Android QA log and screenshot evidence. Exact-PR workflows were in progress when this handoff was written. **Do not merge on an unverified or red head**; isolate app-side hydration/migration cause if it fails. Signed APK/native restart remains independent gate.
- This documentation reconciliation is a separate branch `docs/accurate-oct14-release-and-handoff`, not a runtime change.

## Engineering/release rules

- Never claim app completion from source compile or browser mocks alone. Inspect actual installed/native behavior and candidate screenshots when possible.
- Never change approved desktop Themes, Chapter scenes, typography, backgrounds or assets as collateral mobile work.
- Keep task-specific dated Android/general/infra audit logs updated with real evidence, state and follow-up.
- While CI/reviews run, do independent work only on non-conflicting scopes. Before a tracked task, respect master `.michelslab/task-claims.json` active claims.
- Michel is the only assumed tester until he explicitly confirms this particular application has been shared. No PR/Actions artifacts as user-facing downloads. **Each new release needs explicit owner authorization** and must be delivered via the official public GitHub Releases page, after required validations.
