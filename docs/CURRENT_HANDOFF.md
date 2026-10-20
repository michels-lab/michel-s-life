# Michel's Life — GRANADA current integration checkpoint (2026-10-20)

**This checkpoint overrides older branch/PR snapshots below; historical handoff is retained for traceability.** Verified main after three independent exact-head green PRs: `58e2fb7a2972d65a51be959d02ac432ecd87683a`.

## Newly integrated into main (QA/tooling only; no APK/public release)
- [#154](https://github.com/michels-lab/michel-s-life/pull/154) `1afba42` — read-only, offline backup integrity/privacy/ID/XP/old-vs-new tool; synthetic preflight regression + dedicated green CI.
- [#155](https://github.com/michels-lab/michel-s-life/pull/155) `f6e556f` — Android-mode real-touch 9 routes × 320/360/412px = 27/27; two reloads/width, no progress drift; 11/11 unit cases, 0 browser route failures on verified head `4324258`; screenshot and redacted report. The initial 6 apparent nav hit-test failures were transient drawer animation; the final test waits for the menu to exit before measuring, without hiding persistent obstruction.
- [#153](https://github.com/michels-lab/michel-s-life/pull/153) `58e2fb7` — real canonical Android Projects + Chapter forms, Journal/XP and authenticated same-account synthetic Supabase roundtrip, protected conflict/recovery flow. Mock service only, not live Supabase/Galaxy proof.
- All four GitHub workflows for each of #153, #154, and #155 completed SUCCESS at their exact PR head prior to merge. New main push source validation completed successfully; main push UI may run longer, do not invent its result.

## Current constraints and open owner issues
- **Windows packaging/MSIX/installer development remains paused**. Source validation + browser UI checks may still run; do not turn on Windows build pipelines.
- **Current PUBLIC unified release remains** `v3.0.221` (Windows 3.0.221 + Android Direct 0.2.9), reverified by GitHub Release API 2026-10-20. Code merged to main has **NOT** been published as a new APK, and no device acceptance has occurred.
- **Draft PR #134 / issue #131:** Developer Twin owns native/auth/Gradle/android-bridge and app main logs. Do not overlap; awaits exact-head/native/Galaxy/OAuth tests.
- **Draft PR #135:** Calendar/Journal accessibility owns `android/mobile-sections.js`; native emulator gate is still blocked by #139 instability.
- **Draft PR #138:** persistence probe owns `android/tools/native_webview_state_probe.py`; real native candidate gate blocked, #104 unresolved.
- **Draft PR #150:** Premium Contracts XP and weekly target roundtrip is NOT green: Android UI workflow failed on its branch head; must diagnose the exact job failure before merge. Do not mark completed.
- **Draft PR #151/#152:** Focus notification permission correction + independent evidence QA. Native actual Galaxy notification permissions, lock screen, Doze remain unverified; #53 open.
- **Draft PR #62:** Windows native screenshot review remains deferred.
- #28 real Windows↔Galaxy Supabase, #55/#108 real account/privacy, #104 signed Android persistence, #109 updater, #110 Google Calendar native provider, #139 emulator transport remain open until target/provider validation.

**Next GRANADA entry:** verify new main HEAD, current open PR ownership, main push CI, no accidental Windows builds, then choose a non-overlapping *substantial* Android user-flow or recovery block. Do not add a micro-PR simply to fill the log. Distinguish source → CI → merge → public release → Galaxy/owner acceptance; report each truthfully.

---

# Michel's Life — Current handoff

Updated: 2026-10-19 (America/Monterrey)  
Owner: Michel's Lab  
Canonical repository: `michels-lab/michel-s-life`  
Default branch: `main`  
**Verified `main` HEAD when this snapshot was captured:** `08abf5f2f376fba112fa3a61eebaed4d753214d9` (PRs #144/#145/#146/#147 merged after green exact-head checks). Re-read before modifying or merging; this snapshot is not a branch lock.

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
| [#135](https://github.com/michels-lab/michel-s-life/pull/135) | `granada/android-calendar-accessibility-20261019` — keyboard/TalkBack Calendar and Journal live-save status | **Draft, not merged.** Exact head `2e7676ca`: source, browser UI, Android UI and Gradle compilation passed after Calendar active-tab/DOM recovery; **native installed candidate still RED** (ADB vanished before 30-second screenshot, including later rerun). Files: `android/mobile-sections.js`, section design smoke and dated audit. | Real native installation, Galaxy keyboard/TalkBack, no duplicate redrawing/data corruption; do not label as released |
| [#138](https://github.com/michels-lab/michel-s-life/pull/138) | `granada/native-persistence-progress-digests-20261019` — native debug Android completion history and XP relaunch integrity | **Draft, not merged.** Files: `android/tools/native_webview_state_probe.py`, independent `android/audit/2026-10-19-granada-native-progress-integrity.md`. Source, browser UI, Android UI and Gradle CI passed on its exact head, **installed debug APK native test failed when emulator/ADB died before completion**. | Native candidate installed real screenshots/2 relaunch CDP checks, signed Direct/Galaxy acceptance. Never call native persistent data proved from source pass. |

| [#62](https://github.com/michels-lab/michel-s-life/pull/62) | Native Windows Home/About screenshot gate | **Open; deferred** under owner's Windows build pause. | Resume only after explicit owner direction; no installer/MSIX job now |

**Already integrated into `main` after green exact-head checks:** release-truth docs [#136](https://github.com/michels-lab/michel-s-life/pull/136) `30461e6`; synthetic same-account cross-device mission/reward/conflict/offline regression [#137](https://github.com/michels-lab/michel-s-life/pull/137) `b49e0dd`; isolated emulator A/B diagnostic [#140](https://github.com/michels-lab/michel-s-life/pull/140) `8b39693` (**8 actual PNG samples before installing the public APK and 8 with it installed; SHA256 verified; one green runner trial, not a cure for intermittent ADB loss**); handoff docs [#141](https://github.com/michels-lab/michel-s-life/pull/141) `6efc277`; A/B/C account isolation and guest-import Cancel/Accept recoverability tests [#142](https://github.com/michels-lab/michel-s-life/pull/142) `3318356` (Chromium desktop/Android modes, mock backend only); Android Google Calendar fake-success prevention [#143](https://github.com/michels-lab/michel-s-life/pull/143) `a6b94de` (exact-head Source, Android UI and browser UI green; provider still unavailable); consolidated handoff [#144](https://github.com/michels-lab/michel-s-life/pull/144) `72e51f7`; two-way real-browser shareable-vs-device-private state regression [#145](https://github.com/michels-lab/michel-s-life/pull/145) `de56458` (green Source, UI, Android UI); Focus native-alarm mirror lifecycle+retry simulated bridge [#146](https://github.com/michels-lab/michel-s-life/pull/146) `6208756` (green Source, UI, Android UI); Android16 real native screenshot provenance manifest [#147](https://github.com/michels-lab/michel-s-life/pull/147) `08abf5f` (green Source/UI/Android UI plus actual emulated 8+8 native PNGs with validated CRC/SHA, verified public signed APK hash and tested checkout SHA, rerun job 118392413509). Issue [#139](https://github.com/michels-lab/michel-s-life/issues/139) remains open because the exact installed Android debug candidate persistence job [#138](https://github.com/michels-lab/michel-s-life/pull/138) failed **again on rerun attempt #2**, with emulator/ADB disappearing at the 30-second native screenshot. Green #140 does not imply #138 passed.

## Active user-facing risks / backlog

1. **#54 Android per-section usability:** UI tests cover touch layouts, Mission, Contracts, Calendar, Journal, Projects, Story and Settings in part; physical Galaxy touch, keyboard/IME, screenreader and owner visual acceptance remain a separate gate. Do not change approved desktop Themes, Chapter graphics or fonts.
2. **#104 signed persistence:** earlier signed Android v0.2.6 showed after-onboarding vs relaunch mission/contract count drift; improved browser/native QA does not retrospectively certify all signed user builds or fix physical storage. Keep issue open for reproduced signed/Galaxy state evidence.
3. **#28 live same-account Supabase:** Windows ↔ Galaxy two-way writes, revisions, offline recovery, no duplicate XP/IDs and token/device-local exclusion remain unverified with the real provider and devices.
4. **#53 native Focus alarms:** Android OS companion exists and #146 green real-browser canonical Focus bridge tests cover one alarm through start/pause/resume/skip/reset, deduplication and transient native-call retry. Actual Doze/locked/suspended Galaxy alert delivery, reboot/permissions and general custom repeat/snooze reminders are still **not accepted**.
5. **#55/#108 P0 backup and account switching:** green #142 covers A/B/C missions/Journal and explicit guest-import consent; green merged #145 covers two distinct real Chromium platform contexts, shareable XP/missions/Journal/themes, and exclusion of synthetic auth/device/vault/unknown keys on both transfer directions. Real cloud/provider and owner Galaxy remain unverified.
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

On the next **GRANADA** turn: check PRs **#134, #135 and #138** (still-red candidate-native gates), main HEAD, latest public release, and master claims. PR #147 is now green and merged, but its clean public APK A/B sample is not candidate/Galaxy approval. PR #143 is already green and merged at `a6b94de`, but native Google Calendar provider remains #110. PR #138 candidate installed run 39335405555 attempt #2 is RED after lost emulator/ADB (not native XP persistence proof); coordinate #139 runner diagnostics without weakening gates. Keep #28 live-provider, #55/#108 real account privacy, #104 signed-device integrity and #139 emulator reliability open until owner-device/provider acceptance. Continue on disjoint files if blocked; Windows remains paused.
