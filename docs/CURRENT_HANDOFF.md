# Michel's Life — Current handoff

Updated: 2026-10-19 (America/Monterrey)  
Owner: Michel's Lab  
Canonical repository: `michels-lab/michel-s-life`  
Default branch: `main`  
**Verified `main` HEAD when this snapshot was captured:** `a6b94de8ca9d86358b682a09caf71fdfc28f690f` (PRs #136/#137/#140/#141/#142/#143 merged and checked). Re-read before modifying or merging; this snapshot is not a branch lock.

Project evidence: `GIT_AUDIT_LOG.md`, `android/ANDROID_AUDIT_LOG.md`, `docs/INFRASTRUCTURE_AUDIT.md`, GitHub PR/issue state and authoritative public Releases. Legacy snapshots are historical, not instructions.

## Published customer releases vs. working code

- **Latest public unified GitHub Release:** https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.221 — GitHub release API checked 2026-10-19. **Published 2026-10-19T14:18:28Z**, not draft/prerelease, **13 public assets**, including Windows Setup/Portable/legacy alias, SHA-256 sidecars, `AppBundle.zip`, `release-provenance.json`, signed Android Direct `MichelsLife-Android-Direct-v0.2.9.apk`, APK SHA-256 and signer/manifest metadata.
- Release mapping: **Windows v3.0.221** and **Android Direct v0.2.9 / versionCode 11**. Android code/version verified against current `android/app/build.gradle.kts`. Same public page, separate platform versions.
- **Do not confuse publication with validation on the owner's phone.** A GitHub release plus Android16 emulator smoke is not a verified Galaxy upgrade, real Google OAuth, Google Play Store listing, lock-screen alarms or live Windows↔Galaxy sync. The latest-release timestamp is not a claim all those gates passed.
- Windows **v3.0.221 remains downloadable**, but owner paused further Windows/Desktop development, native builds, installers and Store/MSIX packaging on 2026-10-19. Existing Windows workflows are intentionally manual/dormant; never resume them to test unrelated Android changes.

## Operación GRANADA — non-interference protocol

Rule: `.michelslab/GRANADA.md` and master `michels-lab/Michel-Software-Standards/standards/GRANADA_CONTINUOUS_BLOCK_PROTOCOL.md`. Check current issues, branches, claim registry and CI before every block. A pending PR, hardware test or provider condition stays **pending**; choose a disjoint task rather than changing an occupied file.

### Active independent branches/PRs at snapshot time

| PR | Branch / scope | File ownership and status | Next gate |
| --- | --- | --- | --- |
| [#134](https://github.com/michels-lab/michel-s-life/pull/134) | Android Developer Twin + guided audits, persistent section comments, native-safe export; Android updater, auth/privacy guards | **Draft, not merged.** Touches `android/mobile-experience.js`, `android/android-bridge.js`, native Kotlin/manifest/Gradle, Android build/UI workflows, `android/ANDROID_AUDIT_LOG.md`, `GIT_AUDIT_LOG.md`, `docs/INFRASTRUCTURE_AUDIT.md`, diagnostics and related CI probes. | Exact-head Android UI/Gradle/native install tests and Galaxy/real-account tests; **do not** treat source candidate as released |
| [#135](https://github.com/michels-lab/michel-s-life/pull/135) | `granada/android-calendar-accessibility-20261019` — accessible Android Calendar date controls and Journal save status | **Draft, not merged.** Files: `android/mobile-sections.js`, `tools/ui_android_section_design_smoke.mjs`, `android/audit/2026-10-19-granada-calendar-a11y.md`. No overlap with #134. | Exact-head Android UI/browser tests, installed Android16 rendering, physical Galaxy TalkBack and keyboard review |
| [#138](https://github.com/michels-lab/michel-s-life/pull/138) | `granada/native-persistence-progress-digests-20261019` — native debug Android completion history and XP relaunch integrity | **Draft, not merged.** Files: `android/tools/native_webview_state_probe.py`, independent `android/audit/2026-10-19-granada-native-progress-integrity.md`. Source, browser UI, Android UI and Gradle CI passed on its exact head, **installed debug APK native test failed when emulator/ADB died before completion**. | Native candidate installed real screenshots/2 relaunch CDP checks, signed Direct/Galaxy acceptance. Never call native persistent data proved from source pass. |

| [#62](https://github.com/michels-lab/michel-s-life/pull/62) | Native Windows Home/About screenshot gate | **Open; deferred** under owner's Windows build pause. | Resume only after explicit owner direction; no installer/MSIX job now |

**Already integrated into `main` after green exact-head checks:** release-truth docs [#136](https://github.com/michels-lab/michel-s-life/pull/136) `30461e6`; synthetic same-account cross-device mission/reward/conflict/offline regression [#137](https://github.com/michels-lab/michel-s-life/pull/137) `b49e0dd`; isolated emulator A/B diagnostic [#140](https://github.com/michels-lab/michel-s-life/pull/140) `8b39693` (**8 actual PNG samples before installing the public APK and 8 with it installed; SHA256 verified; one green runner trial, not a cure for intermittent ADB loss**); handoff docs [#141](https://github.com/michels-lab/michel-s-life/pull/141) `6efc277`; A/B/C account isolation and guest-import Cancel/Accept recoverability tests [#142](https://github.com/michels-lab/michel-s-life/pull/142) `3318356` (Chromium desktop/Android modes, mock backend only); Android Google Calendar fake-success prevention [#143](https://github.com/michels-lab/michel-s-life/pull/143) `a6b94de` (exact-head Source, Android UI and browser UI green; provider still unavailable). Issue [#139](https://github.com/michels-lab/michel-s-life/issues/139) remains open because the exact installed Android debug candidate persistence job [#138](https://github.com/michels-lab/michel-s-life/pull/138) failed **again on rerun attempt #2**, with emulator/ADB disappearing at the 30-second native screenshot. Green #140 does not imply #138 passed.

## Active user-facing risks / backlog

1. **#54 Android per-section usability:** UI tests cover touch layouts, Mission, Contracts, Calendar, Journal, Projects, Story and Settings in part; physical Galaxy touch, keyboard/IME, screenreader and owner visual acceptance remain a separate gate. Do not change approved desktop Themes, Chapter graphics or fonts.
2. **#104 signed persistence:** earlier signed Android v0.2.6 showed after-onboarding vs relaunch mission/contract count drift; improved browser/native QA does not retrospectively certify all signed user builds or fix physical storage. Keep issue open for reproduced signed/Galaxy state evidence.
3. **#28 live same-account Supabase:** Windows ↔ Galaxy two-way writes, revisions, offline recovery, no duplicate XP/IDs and token/device-local exclusion remain unverified with the real provider and devices.
4. **#53 native Focus alarms:** background notification logic exists, but Doze/lock screen/reboot/permissions and general scheduled reminders on Galaxy are not fully accepted.
5. **#55/#108 P0 backup and account switching:** source allowlist/account-isolation exists; green merged #142 verifies per-account mission/Journal and explicit guest-import Cancel/Accept with local vault and cloud-history backups on synthetic browser backend. Require live provider + account/device recovery verification before closure.
6. **#109 Direct Android updater:** feature under draft #134; do not claim working official release checks or public self-update from a pending PR.
7. **#110 Google Calendar Android:** current shared Android frontend explicitly disables Sync and reports provider unavailable. Merged PR #143 has green Android-mode browser regression proving no false success, no fake native provider call and no local mission/Calendar/XP mutation when unsupported. **Native Google OAuth/Calendar read/write remains unimplemented and unvalidated.**
8. **#131 Developer Twin:** draft #134 for Android. Developer app must remain separately installed, preserve normal user login, support section-anchored annotations/persistent audit/AI export. Desktop variant deferred.

## Engineering and release boundaries

- Preserve canonical data state and accepted visual identity, never delete existing user data to make a test pass. No second timer, sync or project model.
- Owner is the only assumed tester until explicitly changed. Do not ask owner to test PR Artifacts: only official **public** Releases are acceptable user downloads.
- Keep phases distinct: **implemented → tested at same SHA → merged → released → tested on real device/provider → owner accepted**. A source-only PR is not installed on a Galaxy.
- For affected Android code, inspect exact-branch UI/source/Gradle/native CI. Do not trigger paused Windows packaging. After a merge/release, re-read both repo HEAD and public releases; never report this dated snapshot as the current state without rechecking.
- Do not publish another release without explicit owner authorization. Keep independent Android audit and handoff records; no conflicting edits to the draft #134 shared logs.

## Re-entry

On the next **GRANADA** turn: check PRs **#134, #135 and #138** (their red native/UI gates), main HEAD, latest public release, and master claims. PR #143 is already green and merged at `a6b94de`, but native Google Calendar provider remains #110. PR #138 candidate installed run 39335405555 attempt #2 is RED after lost emulator/ADB (not native XP persistence proof); coordinate #139 runner diagnostics without weakening gates. Keep #28 live-provider, #55/#108 real account privacy, #104 signed-device integrity and #139 emulator reliability open until owner-device/provider acceptance. Continue on disjoint files if blocked; Windows remains paused.
