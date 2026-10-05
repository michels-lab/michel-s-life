## 2026-10-05 — Final Supabase migration audit

### Current state
- Dedicated Supabase project: `michels-life` (`lqnkcqredlxrykynacwr`) is ACTIVE_HEALTHY.
- Tables `ml_state`, `ml_state_history` and `ml_devices` have RLS enabled and authenticated ownership policies based on `auth.uid()`.
- Supabase Security Advisor reports **0 findings**.
- Desktop and Android share the same canonical Supabase sync client; Android identifies itself with platform `android` and an `and_` device ID namespace, while Windows uses `windows` / `win_`.
- Client bundles contain only the publishable Supabase key. Source validation rejects `sb_secret_` and `service_role`.
- Google Drive is a temporary manual fallback only; Google Calendar remains independent.

### Validation
- Source validation #721 — **success**.
- UI smoke #611 — **success**.
- Supabase smoke covers first upload, dirty-state revision upload, remote-newer conflict protection and explicit cloud download.
- Android-mode Supabase smoke covers Android platform/device attribution and rejects privileged-key leakage.
- Remaining release gate: live login/sync on actual Windows + Android installations using one real Supabase account.


# Michel's Life — Git Audit Log

## 2026-10-05 — Desktop v3.0.216 pre-release: Quick Capture, tray and automatic update detection

### Goal
- Make the Windows app useful as a resident desktop application instead of requiring navigation back into Michel's Life for every capture.
- Make Michel's Life discover new public desktop releases automatically while preserving explicit user approval for installation.
- Keep the v3.0.211-approved visual presentation unchanged.

### Automatic update architecture
- Reused the existing `updateStatus` / `installOnlineUpdate` host bridge and the public `realmichelduarte/michel-s-life-releases` channel.
- Removed the obsolete duplicate startup update request from the older finish-system layer.
- Added automatic online checks after startup, every six hours while the app remains open, and on focus when the previous check is sufficiently old.
- Added session-level duplicate suppression so the same available version does not repeatedly notify.
- Automatic connectivity failures are silent; manual update checks still report errors.
- No automatic installation was added. SHA-256 verification and the mandatory pre-update restore point remain authoritative.

### Desktop shell and Quick Capture
- Added `src/MichelsLife/DesktopShell.cs` as a separate native WinForms responsibility rather than expanding the already-large host class.
- The materialized Windows host attaches the desktop shell after WebView2 initialization.
- Added tray actions for Open Michel's Life, Quick Capture, Current Mission, Sync Now, Start with Windows and Exit, plus resident close/minimize behavior.
- Current Mission routes through `CurrentMissionV131`; Sync Now routes through `GoogleCloudV30192`/`GoogleCloudV30191`; Start with Windows writes only the current-user Windows Run entry.
- Registered `Ctrl + Shift + Space` through the Windows hotkey API and routes it to the existing WebView2 document.
- The tray language is refreshed from the active Michel's Life interface when the menu opens, with the installed Windows-language preference as fallback.
- Hotkey registration failure is detected and reported through a Windows notification while Quick Capture remains available from the tray.
- Added `window.MLV216QuickCapture` in the canonical frontend.
- Quick Capture writes Missions through the existing `makeMission` / `state.missions` path and Journal notes through `JournalV30189`; no parallel data model was introduced.

### Sync Center, Command Palette and progressive startup
- Reused `MLV197Reliability`, `GoogleCloudV30192` / `GoogleCloudV30191` and their existing `cloudOverview` contract to build a compact Sync Center rather than creating a second synchronization model.
- The center reports actual connection/conflict state, last sync, current device identity and the most recent connected-device activity. It does not infer that Android/PC data is newer unless the cloud metadata supports that conclusion.
- Upgraded the global command experience behind `Ctrl + K` with bilingual search, arrow-key selection, Enter execution and navigation/action commands, including per-mission Current Mission starts.
- Initial Google/cloud status and cloud-overview requests are scheduled after critical UI through `requestIdleCallback` when available, with bounded timer fallbacks.
- Critical Dashboard rendering and visual layers remain synchronous; automatic update detection was already delayed and remains non-blocking.

### Windows taskbar integration
- Added an isolated `ITaskbarList3` wrapper inside `DesktopShell.cs`.
- The desktop host polls the existing `CurrentMissionV131` state through WebView2 every 1.5 seconds.
- Running Current Mission → Windows indeterminate taskbar progress; paused Current Mission → paused taskbar state; no Current Mission → no taskbar progress.
- Window/taskbar title and tray tooltip surface the active mission name; the title also includes focused elapsed time.
- COM/taskbar failures are intentionally swallowed so Windows shell integration can never break Michel's Life core behavior.

### Test findings and corrections
- UI smoke #557 initially failed the Spanish source-copy audit because the new translation used the anglicism `app`. The wording was corrected to `aplicación de escritorio`; the audit was not weakened.
- Early Quick Capture smoke runs #567–#569 exposed test-harness assumptions that top-level lexical bindings such as `state` and `makeMission` were properties of `window`. The test was corrected to inspect the actual lexical application state rather than changing product code to satisfy the test.
- Automatic update detection had already passed UI smoke #558 before the desktop-shell work was layered on top.
- UI smoke #587 later exposed a timing-flaky seasonal-animation assertion: tab navigation preserved the exact same canvas and completed in 17.5 ms, but the frame counter had not advanced within the first requestAnimationFrame. The test was corrected to observe multiple frames across ~80 ms; no product animation code was changed. UI smoke #588 then passed the complete suite.

### Final validation
- Branch: `desktop-v3.0.216`.
- Draft PR: #10.
- Final validated functional head: `757a92014cf78943bf76c8e3c7f0c59508e9da13`.
- Source validation #702 — **success**.
  - Release-readiness smoke — success.
  - Canonical frontend validation — success.
  - Spanish source-copy audit — success.
  - Generated bilingual corpus audit — success.
  - Microsoft Store packaging smoke — success.
  - Windows host compile with embedded icon and native `DesktopShell` — success.
- UI smoke #594 — **success** for the complete product code and dedicated desktop-experience smoke.
  - Automatic desktop update detection — success.
  - Desktop Quick Capture — success.
  - Existing Spanish/UI/Settings/Dashboard/animation regression suite — success.
- UI smoke #594 validated the new desktop experience end-to-end: Ctrl+K palette, bilingual search, keyboard selection, Sync Center and progressive-startup markers all passed before the legacy regression suite completed green.

### Release state
- No merge to `main` has been performed.
- No v3.0.216 release has been published.
- Windows test build #49 remains the last downloadable candidate and predates the final Sync Center/Command Palette/progressive-startup/taskbar additions. The final code is validated by Source validation #702 and UI smoke #594. A refreshed test ZIP was not generated because the connected GitHub tool blocked temporarily changing the manual-only test-build workflow trigger. Public release remains blocked on an interactive native Windows check of the final code.

## 2026-10-01 — Android v0.1.0 synchronized-client prototype

### Goal
- Build a native Android client that uses the same Michel's Life state as Windows instead of creating a separate mobile data model.
- Reuse the current Michel's Life web application inside a native Android WebView and implement a native bridge compatible with the Windows WebView2 cloud messages.

### Cloud compatibility
- Android uses the same Google Drive application-data scope: `https://www.googleapis.com/auth/drive.appdata`.
- Master cloud object: `michels_life_cloud_state.json`.
- Cloud history prefix: `michels_life_backup_` with the same 10-backup retention target.
- Device-presence prefix: `michels_life_device_`.
- Preserved SHA-256 state hashing, `michelsLifeHash`, `michelsLifeDevice`, `michelsLifeUpdatedAt`, first-device download behavior and the Windows 3-second conflict-resolution window.
- Android bridge implements the current state-sync actions: `status`, `connect`, `disconnect`, `cloudDirty`, `cloudSync`, `cloudAccept`, `cloudOverview`, `cloudRestoreBackup`, local restore-point creation/list/restore and basic Android diagnostics.

### Android build
- Package: `com.michelslab.michelslife`.
- Android test version: `0.1.0`.
- Stable build baseline: compile/target Android 16 (API 36), JDK 17, AGP 9.4.0, Gradle 9.6.0.
- OkHttp pinned to 5.4.0 because 5.5.0 requires compile API 37 while Android 17 SDK distribution is still preview-dependent.
- Build Android test APK run #18 — **success**.
- Windows-compatible cloud-contract validation — **success**.
- APK artifact: `MichelsLife-Android-TEST-v0.1.0` — 67,714,829 bytes (artifact archive).
- APK SHA-256: `51463cf688779e9edb9b7494dbf89fcb9de8361acf159fcae39fb6ebdd942e86`.
- Test signing certificate SHA-1: `FE:B1:35:23:32:60:6A:5F:88:C7:E6:FA:B4:50:B2:CF:C6:5A:EB:9E`.
- Test signing certificate SHA-256: `73:59:AB:A9:5C:BF:C6:B4:2F:0A:70:05:A3:A3:44:14:59:AC:E5:3B:F4:60:D3:F9:61:82:18:20:3F:D9:E7:CF`.

### Remaining live-sync gate
- Google requires a separate Android OAuth client for each Android package/signing certificate combination.
- Before live Drive sync can be exercised on the test APK, create an Android OAuth client in the existing Michel's Life Google Cloud project with package `com.michelslab.michelslife` and the test SHA-1 above.
- No Android client secret is embedded in the APK.
- Google Calendar event synchronization is not implemented in Android v0.1.0 yet; this milestone targets Michel's Life state/cloud synchronization first.


> Chronological technical record of important repository, CI, release, and recovery events.
> This file complements `CHANGELOG.md`: the changelog describes product changes by release, while this audit log records how the repository reached that state.

## 2026-09-30 — Spanish tab-switch responsiveness fix after v3.0.214

### User-visible issue
- Spanish mode felt intermittently slower than English when changing tabs.
- During those tab changes, visible animations could pause because navigation called the full application renderer and Spanish i18n synchronously reprocessed the newly recreated DOM.
- The Focus recovery timer still exposed the English label `Start Break`.

### Root cause
- Generic `[data-tab]` navigation called `renderAll()`, rebuilding global UI that did not need to change for simple navigation.
- The Spanish translation path repeatedly rebuilt/sorted translation rule lists and reran the full normalization pipeline for repeated strings on every recreated tab.
- That extra synchronous work temporarily blocked the browser's next paint, making animations appear to stop.

### Corrective action
- `6a7debbe` — **Keep Spanish tab switches fluid without restarting global UI**.
- Normal tab navigation now updates only the tab bar and active main panel instead of invoking the full renderer.
- Added bounded translation memoization and precomputed translation rule lists.
- Added `Start Break` → `Iniciar descanso`.
- Added Spanish tab-switch animation continuity coverage to the main UI smoke workflow.

### Validation
- Source validation #517 — **success**.
- UI smoke #461 — **success**.
- New Spanish tab-switch animation test — **success**.
- The seasonal canvas remained the exact same DOM object and its frame counter advanced across Missions → Premium Contracts → Stats → Dashboard.
- Measured next-paint tab-switch times on the GitHub runner: Missions **99 ms**, Premium Contracts **7.3 ms**, Stats **32.5 ms**, Dashboard **90.9 ms**.
- Spanish → English → Spanish animation round-trip also remained continuous.
- The fix was promoted to **v3.0.215** after the versioned validation run completed successfully.

### Release publication
- `f920d290` — **Release Michel's Life v3.0.215**.
- Source validation #519 — **success**.
- UI smoke #463 — **success**, including the Spanish tab-switch animation continuity test.
- `d415063e` — temporary **Dispatch Michel's Life v3.0.215 release** workflow.
- Dispatcher run #1 — **success**.
- Windows release build #16 — **success**.
- Public release `v3.0.215` published successfully to `realmichelduarte/michel-s-life-releases`.
- Verified release assets:
  - `AppBundle.zip`
  - `MichelsLife-Setup-v3.0.215.exe`
  - `MichelsLife-v3.0.215.exe`
  - `MichelsLife-v3.0.215.exe.sha256`
  - `michels_life_icon.ico`
- Release is final, not a prerelease.
- `69e41cf5` — removed the temporary v3.0.215 dispatcher after successful publication.

## 2026-09-30 — v3.0.214 visual-fidelity lock after restored baseline

### Reason for follow-up release
- The v3.0.212 release changed more than copy and the resulting visual presentation was rejected.
- v3.0.213 restored the v3.0.211 renderer baseline, but post-release verification identified a few compatibility fixes still needed around restored visual authorities and Settings behavior.

### Post-v3.0.213 corrections
- `6d4ce14a` — **Restore approved v3.0.207 visual authorities**.
- `19816812` — **Normalize restored visual build markers**.
- `b84cdd49` — **Keep approved sidebar geometry with current logo asset**.
- `a5bcaf22` — **Keep restored Settings layout without duplicate cards**.
- `01d662b3` — **Preserve language control text color in restored visual baseline**.

### Visual verification
- Exact comparison against the approved v3.0.211 baseline shows only 29 changed lines in `src/MichelsLife/frontend/index.html` at `01d662b3`.
- Those remaining changes are Settings classification/deduplication logic; no CSS/layout redesign remains in the canonical frontend.
- Language work may change copy, dates and labels, but must not change presentation geometry or visual hierarchy unless separately requested.

### Validation
- Source validation #512 — **success**.
- UI smoke #456 — **success**.
- Both workflows ran on real GitHub-hosted runners; no runner-allocation/billing failure occurred.

### Release publication
- `928b39ab` — **Bump Michel's Life to v3.0.214 with approved visual fidelity**.
- Source validation #513 — **success**.
- UI smoke #457 — **success**.
- `c997a754` — temporary **Dispatch Michel's Life v3.0.214 release** workflow.
- Dispatcher run #1 — **success**.
- Windows release build #15 — **success**.
- Public release `v3.0.214` published successfully to `realmichelduarte/michel-s-life-releases`.
- Verified release assets:
  - `AppBundle.zip`
  - `MichelsLife-Setup-v3.0.214.exe`
  - `MichelsLife-v3.0.214.exe`
  - `MichelsLife-v3.0.214.exe.sha256`
  - `michels_life_icon.ico`
- Release is final, not a prerelease.
- `ede4dfd0` — removed the temporary v3.0.214 dispatcher after successful publication.


## 2026-09-30 — v3.0.213 visual rollback to approved v3.0.211 presentation

### User-visible regression identified
- The v3.0.212 Windows release was functionally bilingual but its rendered interface no longer matched the previously approved v3.0.211 presentation.
- Michel's Life remains one application with coexisting English and Spanish modes; switching language must change text only and must not change layout or visual design.

### Root cause
- Exact comparison against the v3.0.211 release source commit `fd8cd4b3` showed only three small CSS block differences, while dozens of JavaScript renderers had been rewritten during source-bilingual hardening.
- The visual regression therefore came primarily from translation logic being moved inside renderers, changing generated markup/renderer behavior instead of only changing visible copy.
- The v3.0.211 frontend contained no `data-mlv-i18n-owned="source"` regions, confirming that its approved renderer structure could remain authoritative while the expanded i18n layer handled language changes globally.

### Corrective action
- `01a23af9` — **Restore v3.0.211 visual renderer baseline**
  - Restored `src/MichelsLife/frontend/index.html` exactly from the v3.0.211 release-build commit `fd8cd4b3`.
  - Kept the current expanded `i18n.js` translation layer.
  - No new layout, styling, card, navigation or renderer redesign was introduced.

### Verification
- Source validation #504 — **success**.
- UI smoke #448 — **success**.

### Release publication
- `9b7710f5` — **Bump Michel's Life to v3.0.213 with restored visual baseline**.
- Source validation #505 — **success**.
- UI smoke #449 — **success**.
- `41fb484f` — temporary **Dispatch Michel's Life v3.0.213 release** workflow.
- Dispatcher run #1 — **success**.
- Windows release build #14 — **success**.
- Public release `v3.0.213` published successfully to `realmichelduarte/michel-s-life-releases`.
- Verified release assets:
  - `AppBundle.zip`
  - `MichelsLife-Setup-v3.0.213.exe`
  - `MichelsLife-v3.0.213.exe`
  - `MichelsLife-v3.0.213.exe.sha256`
  - `michels_life_icon.ico`
- Release is final, not a prerelease.
- The temporary v3.0.213 dispatcher is removed after publication so `main` returns to the normal workflow set.
- Verified critical UI render, Spanish first run, installed language selector, Spanish Missions, general and exhaustive Spanish UI, complete bilingual corpus, Spanish-English round trip, translated-control overflow, installer/Settings language behavior, Settings integrity, translated theme controls and Spanish Dashboard.
- This establishes the v3.0.211 presentation as the visual authority and bilingual text behavior as an independent layer.

## 2026-09-30 — v3.0.212 localization hardening, CI recovery, and release

### CI / GitHub Actions infrastructure incident
- Repeated `Source validation` and `UI smoke` runs were failing in only a few seconds before any workflow step executed.
- Failed jobs reported:
  - `runner_id: 0`
  - empty `runner_name`
  - `steps: []`
- A retry of Source validation #475 reproduced the same behavior, confirming it was not a transient workflow-step failure.
- Historical Actions inspection showed the problem affected many commits and both Ubuntu and Windows jobs, predating the final localization commits.
- The source repository was temporarily changed from private to public to restore GitHub-hosted runner availability.
- After the visibility change, jobs immediately began receiving real runners and executing normal steps again.
- This separated the infrastructure problem from actual application/test failures.

### First real failures after runners recovered
- `5ab882fc` — localization work had advanced through planning and Next Up surfaces.
- Source validation then reached the real application checks and exposed bilingual corpus inconsistencies instead of infrastructure failures.

### Bilingual corpus repairs
- `1c131792` — **Align Spanish system defaults with canonical translations**
  - Removed stale disagreement between canonical `PAIRS` and `SPANISH_SYSTEM_DEFAULTS`.
  - Unified:
    - `Read all` → `Marcar todo como leído`
    - `This month vs last month` → `Este mes vs el mes pasado`
- `dfaaad71` — **Make sidebar brand UI smoke deterministic**
  - Replaced a blind DOM geometry read with an explicit wait for the complete brand lockup.
  - Improved failure quality so missing elements no longer surfaced only as `getBoundingClientRect()` null errors.
- `e6e8350e` — **Remove stale Boss Quest anglicisms from Spanish copy**
  - Replaced mixed Spanish/English system copy such as `Boss Quest` / `Jefe Quest` with canonical `Misión de jefe`.
- `17d6c63d` — **Canonicalize late-night mission copy**
  - Removed duplicate English variants that mapped to the same Spanish sentence.
  - Stabilized Spanish → English → Spanish round trips.
- Source validation #479 passed completely on `17d6c63d`, including:
  - release-readiness smoke tests
  - canonical frontend validation
  - Spanish source-copy audit
  - generated bilingual system corpus audit
  - Microsoft Store packaging smoke tests
  - Windows host compile and embedded icon validation

### Sidebar / renderer investigation
- UI smoke exposed that after `renderAll()`, `#v30171Sidebar` could contain only the navigation shell and Focus Dock while the Michel's Life brand lockup disappeared.
- Diagnostics confirmed `LeftNavV30171.renderNav()` still existed, so the problem was not a missing navigation API.
- The investigation then moved from timing assumptions to authoritative renderer dependencies.
- Subsequent commits repaired active renderer dependencies and source-owned bilingual behavior instead of adding another DOM cleanup patch.

### Source-owned bilingual UI hardening
- `d53aed5c` — **Rerender global bilingual UI on language changes**
- `c2816eea` — **Move status i18n helpers into the active renderer**
- `a221d228` — **Make status chrome bilingual at source**
- `82e3b5b7` — **Capture route render errors in exhaustive UI audit**
- `4af490c9` — **Retire obsolete English status writer**
- `fe119622` — **Restore canonical runtime translation helpers**
- `0457f9bf` — **Localize contract status and planning copy at source**
- `1ec473d0` — **Stabilize authoritative sidebar UI smoke**
- `1af05fe8` — **Repair exhaustive Spanish UI renderer dependencies**
- `3792716b` — **Finish source-owned Spanish UI copy**
- `91b02688` — **Make cloud conflict language detection authoritative**
- `b95293a9` — **Audit only visible Spanish UI surfaces**
- `a7fc692c` — **Stabilize visible language round trip**
- `50383840` — **Canonicalize system contract identity across languages**

### Pre-release verification
- On `50383840`:
  - Source validation #497 — **success**
  - UI smoke #441 — **success**
- `95fdcc18` — **Log September 30 validation and localization work**
  - Added the v3.0.212 changelog entry and documented the verified localization/CI work.
  - Source validation #498 — **success**
  - UI smoke #442 — **success**

### Version bump and release preparation
- `ba7cb127` — **Bump Michel's Life to v3.0.212**
  - Updated the .NET project/versioning, installer/build validation, and packaged frontend version flow.
  - Source validation #499 — **success**
  - UI smoke #443 — **success**
- `e3c6c3b9` — **Dispatch v3.0.212 Windows release**
  - Initial temporary release dispatcher attempt.
  - Dispatcher run #1 failed because the release target needed correction.
  - Source validation #500 — **success**
  - UI smoke #444 — **success**
- `be55c12c` — **Fix v3.0.212 release dispatcher repository target**
  - Corrected the temporary dispatcher.
  - Dispatcher run #2 — **success**
  - Windows release build #13 — **success**
  - Source validation #501 — **success**
  - UI smoke #445 — **success**

### Published release
- Public release repository: `realmichelduarte/michel-s-life-releases`
- Release: **v3.0.212**
- Published: 2026-09-30
- Release assets:
  - `AppBundle.zip`
  - `MichelsLife-Setup-v3.0.212.exe`
  - `MichelsLife-v3.0.212.exe`
  - `MichelsLife-v3.0.212.exe.sha256`
  - `michels_life_icon.ico`
- The release is a normal final release, not a prerelease.

### Post-release cleanup
- `6ab1be97` — **Remove temporary v3.0.212 release dispatcher**
  - Removed the one-off release dispatch mechanism after successful publication.
  - Source validation #502 — **success**
  - UI smoke #446 — **success**
- Current main therefore ends in a clean post-release state with both primary validation workflows green.

## Repository release policy
- Source repository: `realmichelduarte/michel-s-life`
- Public binary/release channel: `realmichelduarte/michel-s-life-releases`
- Release preference: final releases only; do not use prereleases unless explicitly requested.
- Repository visibility may be made public temporarily when needed to restore GitHub-hosted Actions execution, then returned to private after validation/release work is complete.
- Michel's Life remains proprietary / all rights reserved unless explicitly changed by the owner.

## Audit rule going forward
For every meaningful future Michel's Life development cycle, record:
1. date and affected version;
2. root cause / observed problem;
3. commit(s) that changed behavior;
4. CI/workflow run numbers and outcomes;
5. release publication result and assets;
6. any temporary infrastructure or repository-setting changes;
7. final clean-up state.


## 2026-10-05 — Supabase becomes Michel's Life primary sync backend

Decision:
- Google Drive was useful as the first full-state sync transport but is no longer the preferred source of truth for a Windows + Android product.
- A dedicated Supabase project named `michels-life` was created under Michel's Lab. The unrelated `ig-cleaner-sync` project was deliberately not reused.
- Supabase becomes the automatic primary sync authority. Google Drive remains temporarily available for manual migration/recovery and Google Calendar remains independent.

Production backend:
- Project ref: `lqnkcqredlxrykynacwr`.
- Region: `us-east-2`.
- Tables: `ml_state`, `ml_state_history`, `ml_devices`.
- Migration `michels_life_initial_sync_schema` created the state/history/device model, indexes, authenticated grants and RLS policies.
- Migration `lock_michels_life_sync_to_authenticated` explicitly revoked all table access from `anon`.
- Verification confirmed RLS=true on all three tables; authenticated has required CRUD privileges; anon SELECT/INSERT are false.
- Supabase Security Advisor: zero findings after hardening.
- Only the publishable client key is embedded; privileged `sb_secret_` / `service_role` markers are prohibited by source validation.

Sync behavior:
- The canonical existing Michel's Life cloud backup JSON remains the initial snapshot payload; no second Missions/Journal/etc. model was introduced.
- Supabase Auth supports email/password sign-in, signup, refresh and logout.
- Per-device revision metadata prevents automatic overwrites when a different device has a higher remote revision.
- Local saves mark the Supabase state dirty; automatic upload happens only when dirty instead of creating a revision on every poll.
- Before overwriting a remote master, the previous remote snapshot is stored in history.
- Device records capture platform, app version, activity and last-seen time.
- Initial login on a device that finds existing cloud data requires an explicit local-vs-cloud choice rather than silently replacing either copy.

Google transition:
- `syncCloud('auto')`, Drive save scheduling, Drive polling and focus-triggered Drive autosync all short-circuit while a Supabase session is connected.
- Manual Drive functions remain available as a recovery bridge during migration.
- Google Calendar functionality is retained.

Windows:
- Settings gains a dedicated Sync section.
- Sync Center, Command Palette and tray Sync Now prefer `SupabaseSyncV30216`.
- The Supabase settings card mounts for both direct clicks and programmatic Settings routing.
- Root-cause correction during testing: the first implementation read `window.state`, but Michel's Life uses lexical `state`; switching to canonical `state` fixed routed Sync-pane mounting.

Android:
- Shared canonical frontend reads `window.__MICHELSLIFE_PLATFORM__='android'` from the Android bridge.
- Android sync rows use Android platform metadata and a distinct device id.
- Android version advanced to 0.2.2 / versionCode 4.
- Android build workflow now overlays the current branch frontend into the downloaded base AppBundle before packaging.
- Android contract validation requires Supabase markers and forbids privileged keys.
- Android-specific audit details remain in `android/ANDROID_AUDIT_LOG.md`.

Validation:
- Source validation #717: SUCCESS on shared Supabase product code.
- UI smoke #607: SUCCESS, including dedicated Supabase flow.
- The dedicated smoke verifies sign in, first remote master creation, one revision per dirty sync, no overwrite of a simulated newer Android revision, and explicit cloud restore.
- Later Android metadata/workflow/documentation commits do not alter the tested Supabase runtime; native APK/AAB compilation for 0.2.2 still requires the Android workflow to be dispatched or run after merge.
- Real cross-device production validation still requires signing into the same Michel's Life Supabase account on Windows and Android.
- Public v3.0.216 release remains intentionally unpublished.


## 2026-10-05 — Reconcile Michel's Lab governance with Supabase migration

- Merged the newer `main` governance/infrastructure work into the Supabase migration branch.
- `.michelslab/project.yml` and `MICHELS_LAB_PROJECT.md` remain authoritative for the parent/child reporting contract with `realmichelduarte/Michel-Software-Standards`.
- The earlier infrastructure audit conclusion that Google Drive should remain the cloud authority is superseded by the explicit product decision in this development cycle to migrate Michel's Life to Supabase.
- Current authority: Supabase for Michel's Life state/account/device sync; Google Drive only as a temporary manual migration/recovery fallback; Google Calendar remains optional and independent.
- Shared cloud/auth/security decisions from this migration must be promoted to the Michel's Lab standards repository without copying secret values.


### 2026-10-05 — Android Supabase PR gate hardened
- Added `pull_request` execution to the independent Android UI smoke workflow so Android/Supabase regressions are blocked before merge rather than only after reaching `main`.
- Root cause found in first Android PR-gate attempt (#40): the smoke downloaded the latest public AppBundle and injected only the Android bridge, so the new Supabase smoke could have exercised stale public-release frontend code.
- Corrected the Android UI smoke to overlay the current branch's canonical `index.html`, `i18n.js` and branding before preparing browser assets.
- The first corrected attempt exposed a second pipeline mismatch: Android workflows skipped `tools/bump_frontend_version.py`, causing canonical validation to reject the source version before packaging.
- Corrected both `.github/workflows/android-ui-smoke.yml` and `.github/workflows/android-build.yml` so their canonical frontend sequence matches Desktop: version bump → i18n enablement → canonical validation → bundle overlay/injection → Android asset preparation.
- Source validation #734: **SUCCESS**, including Windows host compile, release-readiness, canonical frontend validation and Android Supabase contract validation.
- Android UI smoke #42: **SUCCESS**, including canonical frontend overlay, Android mobile UX at 412×915 and Android Supabase sync contract.
- UI smoke #620 is the final shared-regression run for this pipeline hardening and was still running when this entry was written.


## 2026-10-05 — `limon` handoff checkpoint

Workflow keyword:
- **`limon`** means: update all relevant permanent project logs, record the exact branch/CI/pending state, and leave a clean handoff so development can continue in a new chat without reconstructing context.
- This is a development-workflow convention, not an app feature or user-facing command.

Current repository state:
- Branch: `desktop-v3.0.216`.
- Draft PR: **#10 — v3.0.216: Supabase sync, desktop shell and Android integration**.
- PR is currently mergeable.
- Handoff HEAD before this log-only checkpoint: `419de33c4038e371debd1a74fd8d13db0d9907e7`.
- Public **v3.0.216 is not published**.

Current validation at the handoff HEAD:
- Source validation **#736 — SUCCESS**.
- UI smoke **#622 — SUCCESS**.
- Android UI smoke **#44 — SUCCESS**.
- Supabase production schema remains hardened with RLS enabled, anonymous table access revoked and Security Advisor at zero findings.

Implemented / stable:
- Supabase is the primary Michel's Life state/account/device sync backend.
- Windows and Android share the canonical Supabase sync client.
- Dirty/revision logic prevents poll-driven revision spam and refuses automatic overwrite of a newer remote revision.
- Sync Center, Command Palette and Windows tray prefer Supabase.
- Google Drive is transitional manual recovery/migration fallback only; Google Calendar remains independent.
- Android PR smoke tests the branch's exact canonical frontend, not the public-release bundle.
- Desktop shell improvements from the same pre-release cycle remain in place: Quick Capture, tray residency/actions, automatic update detection, Command Palette, progressive startup and Current Mission taskbar integration.

Remaining gates for the next chat:
1. Perform a real same-account cross-device validation: Windows ↔ Android, including first-device choice, upload/download, newer-remote conflict and explicit restore.
2. Generate a refreshed native Windows candidate containing the final Supabase code and interactively test tray/hotkey/taskbar/Sync Center.
3. Run the native Android APK/AAB build for **0.2.2 / versionCode 4**, configure signing secrets if still absent, and test on device/emulator.
4. Only after those native gates pass: bump/finalize release metadata as needed, merge PR #10, publish v3.0.216 and verify final assets.
