# Michel's Life — Current handoff

Updated: 2026-10-19 (America/Monterrey)  
Owner: Michel's Lab  
Canonical repository: `michels-lab/michel-s-life`  
Default branch: `main`  
**Verified `main` HEAD when this snapshot was captured:** `b49e0dd431d6c7f99fbfd2dfb5b5366fb0ecb1e2` (PR #136 documentation and PR #137 mocked sync regression already merged). Re-read before modifying or merging; this snapshot is not a branch lock.

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
| [#140](https://github.com/michels-lab/michel-s-life/pull/140) | `granada/android-emulator-transport-health-20261019` — isolated API36 no-app vs verified public APK A/B | **Draft, not merged.** New independent workflow, standalone bash probe, dated audit. First runner execution failed from probe's strict ADB parser, now fixed + regression self-test; **latest exact-head CI is pending**. | Run actual 8+8 real native screenshots, classify failure phase from saved A/B evidence; do not mask emulator failure. |
| [#62](https://github.com/michels-lab/michel-s-life/pull/62) | Native Windows Home/About screenshot gate | **Open; deferred** under owner's Windows build pause. | Resume only after explicit owner direction; no installer/MSIX job now |

**Already integrated into main:** documentation PR [#136](https://github.com/michels-lab/michel-s-life/pull/136) at `30461e6`; synthetic cross-device mission/reward/conflict/offline recovery regression PR [#137](https://github.com/michels-lab/michel-s-life/pull/137) at `b49e0dd`. Its exact-head Source, Android UI and browser UI checks all passed. These are **mock-cloud automated tests**, not production Galaxy account proof. Issue [#139](https://github.com/michels-lab/michel-s-life/issues/139) records repeated native CI/emulator/ADB transport loss. This later handoff refresh is docs-only and does not claim either blocked PR was validated.

## Active user-facing risks / backlog

1. **#54 Android per-section usability:** UI tests cover touch layouts, Mission, Contracts, Calendar, Journal, Projects, Story and Settings in part; physical Galaxy touch, keyboard/IME, screenreader and owner visual acceptance remain a separate gate. Do not change approved desktop Themes, Chapter graphics or fonts.
2. **#104 signed persistence:** earlier signed Android v0.2.6 showed after-onboarding vs relaunch mission/contract count drift; improved browser/native QA does not retrospectively certify all signed user builds or fix physical storage. Keep issue open for reproduced signed/Galaxy state evidence.
3. **#28 live same-account Supabase:** Windows ↔ Galaxy two-way writes, revisions, offline recovery, no duplicate XP/IDs and token/device-local exclusion remain unverified with the real provider and devices.
4. **#53 native Focus alarms:** background notification logic exists, but Doze/lock screen/reboot/permissions and general scheduled reminders on Galaxy are not fully accepted.
5. **#55/#108 P0 backup and account switching:** source allowlist/account-isolation protections are in candidate work and tests; require live provider + account/device recovery verification before closure.
6. **#109 Direct Android updater:** feature under draft #134; do not claim working official release checks or public self-update from a pending PR.
7. **#110 Google Calendar Android:** old bridge path returned an empty result that might look like successful sync. Native real-provider support is not validated; UI must tell the truth and avoid silent no-op success.
8. **#131 Developer Twin:** draft #134 for Android. Developer app must remain separately installed, preserve normal user login, support section-anchored annotations/persistent audit/AI export. Desktop variant deferred.

## Engineering and release boundaries

- Preserve canonical data state and accepted visual identity, never delete existing user data to make a test pass. No second timer, sync or project model.
- Owner is the only assumed tester until explicitly changed. Do not ask owner to test PR Artifacts: only official **public** Releases are acceptable user downloads.
- Keep phases distinct: **implemented → tested at same SHA → merged → released → tested on real device/provider → owner accepted**. A source-only PR is not installed on a Galaxy.
- For affected Android code, inspect exact-branch UI/source/Gradle/native CI. Do not trigger paused Windows packaging. After a merge/release, re-read both repo HEAD and public releases; never report this dated snapshot as the current state without rechecking.
- Do not publish another release without explicit owner authorization. Keep independent Android audit and handoff records; no conflicting edits to the draft #134 shared logs.

## Re-entry

On the next **GRANADA** turn: check exact-head CI and merge status of PRs **#134, #135, #138 and #140**, the published release and master claims. Pay special attention to #140 A/B diagnostic evidence: a parser self-test and boot are not native app pixels; a failed Android16 ADB screenshot is not a success. Keep #134 native/developer-owned sources and #135 Calendar source isolated. Keep #28 live-provider, #104 signed-device integrity and #139 emulator reliability open until real acceptance. Continue on disjoint files if blocked; Windows remains paused.
