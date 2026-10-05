## 3.0.216 — Supabase primary sync migration (pre-release)

### Supabase backend
- Created a dedicated **michels-life** Supabase project for Michel's Life rather than sharing the unrelated IG Cleaner backend.
- Added authenticated master-state sync through `ml_state`, revision history through `ml_state_history`, and cross-device presence/activity through `ml_devices`.
- Enabled Row Level Security on every Michel's Life table and scoped all policies to the authenticated user's `auth.uid()`.
- Explicitly revoked anonymous table privileges. Supabase Security Advisor reports zero findings after the final hardening migration.
- Desktop/mobile clients use only the modern Supabase publishable key. Release validation rejects `sb_secret_` and `service_role` markers.

- Android PR validation now overlays the branch's canonical frontend before running mobile/Supabase smoke tests and uses the same version-bump/i18n/validation sequence as the production Android build.

### Cross-platform sync
- Added email/password Supabase Auth, access-token refresh, persistent session handling and a dedicated Settings → Sync surface.
- Reused the existing full Michel's Life backup payload as the initial canonical snapshot format so Missions, Journal, Projects, Stats, Chapters and settings migrate without a parallel data model.
- Sync uses monotonic revisions and a dirty flag: unchanged polling does not create new revisions.
- If another device has a newer revision, automatic sync refuses to overwrite it and surfaces a conflict; cloud/local replacement remains an explicit user action.
- The previous remote snapshot is preserved in Supabase history before overwrites.
- The global Sync Center, Command Palette and Windows tray Sync Now now prefer Supabase.
- Google Drive remains available only as a temporary manual recovery/migration fallback. Its automatic sync is disabled whenever a Supabase session is active.
- Google Calendar remains an independent optional integration.

### Android 0.2.2
- The Android WebView reuses the same Supabase client as Windows and reports `source_platform='android'` with a separate Android device identity.
- Android version bumped to **0.2.2 / versionCode 4**.
- Android builds now overlay the branch's canonical frontend into the base AppBundle before APK/AAB packaging, preventing test builds from silently embedding an older public-release frontend.
- Android sync validation requires the Supabase contract and rejects privileged Supabase keys.
- Native Google Drive code remains temporarily available as a fallback only.

### Validation
- Supabase production schema: RLS enabled, anonymous table privileges revoked, Security Advisor **0 findings**.
- Source validation **#721 — success** on the shared Windows/Android Supabase product code.
- UI smoke **#611 — success**, including Supabase sign-in simulation, first master upload, dirty-state revision upload, newer-remote conflict protection, explicit cloud restore and the existing bilingual/UI regression suite.
- Android-mode Supabase smoke validates Android platform detection, `and_` device identity, Android master-state attribution and Android device registration without privileged keys.
- Native Windows/Android live-account validation is still required before public release; no v3.0.216 release has been published.

# Changelog

> Official development log for Michel's Life. Every meaningful app change must be recorded here before a version is considered complete. Entries should describe verified changes only and be grouped by version/date.


## 3.0.216 — 2026-10-05 — Desktop Quick Capture, tray and automatic update detection (validated pre-release)

### Desktop workflow
- Added a native Windows system-tray shell without changing the approved Michel's Life visual baseline.
- Closing or minimizing the desktop window now keeps Michel's Life resident in the tray.
- The tray menu exposes Open Michel's Life, Quick Capture, Current Mission, Sync Now, Start with Windows and Exit.
- Tray labels follow the active English/Spanish interface language, and a failed global Quick Capture hotkey registration is surfaced instead of failing silently.
- Current Mission reuses the existing Current Mission authority; Sync Now reuses the existing Google Drive Cloud Sync API; Start with Windows is an optional per-user Windows startup toggle.
- Added a global `Ctrl + Shift + Space` hotkey that restores Michel's Life and opens Quick Capture.
- Added bilingual Quick Capture for fast Mission or Journal capture while preserving the existing mission and journal data models.
- Quick Capture Mission creation supports category selection; Journal capture appends a timestamped note to the current day.

### Desktop experience expansion
- Added a compact Sync Center that surfaces cloud state, last sync, this PC, connected-device activity and real cloud conflicts without duplicating the existing Google Drive sync engine.
- The existing cloud badge is now a persistent compact entry point: healthy, syncing, attention and conflict states remain visible without opening Settings.
- Expanded the global `Ctrl + K` Command Palette with keyboard navigation and commands for Quick Capture, Sync Center, Sync Now, update checks, Current Mission, Focus, planning, main sections, Settings destinations and starting individual missions.
- Added progressive startup scheduling: critical UI renders first while initial Google/cloud status and cloud-overview work is deferred until browser idle time (with bounded fallbacks), reducing competition with first paint.
- Added native Windows taskbar integration for Current Mission. Running missions use the Windows indeterminate progress state; paused missions use the paused taskbar state; the taskbar/window title and tray tooltip include mission name and focused time.
- Taskbar integration is best-effort and isolated from the app: unsupported/failing Windows taskbar APIs cannot break Michel's Life.

### Automatic updates
- Reused the existing safe GitHub Releases updater instead of introducing a second update system.
- Michel's Life now checks the public release channel automatically shortly after desktop startup, every six hours while open, and on refocus when the previous check is old enough.
- A newer online release produces one persistent bilingual notification per version per app session.
- Automatic network-check failures stay silent; the existing manual update check continues to surface errors.
- Installation remains user-initiated and retains the existing SHA-256 verification and pre-update restore point.

### Validation
- Source validation #702 — **success**, including release-readiness checks, bilingual corpus checks, Store packaging and Windows host compilation with tray + taskbar integration.
- UI smoke #594 — **success** with the same product code and the dedicated Sync Center / Command Palette smoke included.
- Dedicated automatic-update smoke — **success**.
- Dedicated Quick Capture smoke — **success**, including categorized Mission creation, Journal append and Spanish UI.
- Dedicated desktop-experience smoke — **success**, including Ctrl+K opening, Spanish command search, arrow-key selection, Sync Center rendering/actions and progressive-startup timing markers.
- Existing Spanish first-run, Missions, exhaustive UI, language round trip, Settings, Dashboard and seasonal-animation continuity tests all remained green.
- UI smoke #587 exposed a timing-flaky animation assertion: the same seasonal canvas remained mounted and the tab switched in 17.5 ms, but the frame counter had not advanced within the first requestAnimationFrame. The test now samples across ~80 ms without changing product animation code; #588 passed.

### Release state
- Work is isolated on `desktop-v3.0.216` / draft PR #10.
- No v3.0.216 public release has been published and `main` has not been changed by this pre-release cycle.
- Windows test build #49 — **success** for the earlier tray/Quick Capture candidate. The newer Sync Center/Command Palette/progressive-startup/taskbar code is source/UI validated, but a refreshed downloadable Windows candidate has not been generated because the connected GitHub tool blocked temporarily enabling the push trigger for the manual-only test-build workflow.

## 3.0.215 — 2026-09-30 — Spanish navigation performance

### Performance
- Changed normal tab navigation to rerender only the tab bar and active main panel instead of running the full application renderer.
- Preserved global visual/animation layers during tab switches so navigation does not unnecessarily recreate unrelated UI.
- Added bounded translation memoization and precomputed translation rule lists so repeated Spanish labels do not rerun the full normalization pipeline on every tab render.

### Localization
- Added the missing `Start Break` → `Iniciar descanso` translation used by the Focus recovery timer.

### Regression protection
- Extended the Spanish seasonal-animation smoke test to switch among Missions, Premium Contracts, Stats and Dashboard while verifying that the same canvas keeps advancing and the next paint stays responsive.
- Added that animation/tab-switch test to the main UI smoke workflow.
- Source validation #517 — **success**.
- UI smoke #461 — **success**, including Spanish tab-switch animation continuity.

## 3.0.214 — 2026-09-30 — Approved visual fidelity lock

### Visual fidelity
- Preserved the approved pre-regression Michel's Life presentation while keeping the current bilingual text system.
- Re-established the approved visual authorities for sidebar geometry, Settings layout, cards, hero, backgrounds, spacing and typography without redesigning the interface.
- Kept the current celestial Michel's Life logo asset inside the approved sidebar geometry.
- Preserved the language selector's readable text color without changing the surrounding Settings design.
- Compared the current frontend against the approved v3.0.211 baseline: the remaining `index.html` differences are limited to Settings classification/deduplication logic, not CSS/layout redesign.

### Validation
- Final pre-release source commit: `01d662b3`.
- Source validation #512 — **success**.
- UI smoke #456 — **success**.
- Verified critical UI render, Spanish first run, installed-language selector, Missions, general and exhaustive Spanish UI, bilingual corpus, Spanish ↔ English round trip, translated-control overflow, installer/Settings language behavior, Settings integrity and Spanish Dashboard.

## 3.0.213 — 2026-09-30 — Visual baseline restoration with bilingual parity

### Visual restoration
- Restored the exact v3.0.211 frontend renderer baseline from commit `fd8cd4b3` after v3.0.212 localization work unintentionally changed the rendered interface.
- Preserved the approved v3.0.211 layout, cards, sidebar, hero, typography, sizing, backgrounds, spacing and visual hierarchy.
- Kept visual presentation identical between English and Spanish: changing language changes copy, dates and labels only, not structure or styling.

### Bilingual behavior
- Kept the expanded v3.0.212 translation dictionary and language persistence layer while returning presentation authority to the v3.0.211 renderers.
- English and Spanish coexist in the same application and remain switchable from Settings.
- Verified Spanish first run, installed-language switching, Missions, exhaustive Spanish UI, bilingual corpus, Spanish ↔ English round trip, translated-control overflow, Settings integrity and Spanish Dashboard without changing the restored visual baseline.

### Validation
- Visual-baseline restoration commit `01a23af9`.
- Source validation #504 — **success**.
- UI smoke #448 — **success**.
- Windows host/icon compilation, release-readiness, canonical frontend validation, Spanish source audit, bilingual corpus and Store packaging all passed before the v3.0.213 bump.


## 3.0.212 — 2026-09-30 — Source-bilingual UI hardening and CI recovery

### Language & localization
- Aligned duplicate Spanish system defaults with the canonical dictionary, including `Read all` → `Marcar todo como leído` and `This month vs last month` → `Este mes vs el mes pasado`.
- Removed stale `Boss Quest` anglicisms and standardized those system messages around `Misión de jefe`.
- Canonicalized duplicate late-night copy so Spanish → English → Spanish round trips are deterministic.
- Localized search, Settings relabels, status chrome, contract status, planning surfaces and cloud-conflict language detection at their active source renderers.
- Canonicalized system contract identity across languages and stabilized visible language round trips without rewriting user-authored text.
- Rerendered source-owned bilingual UI on language changes and retired the obsolete English status writer that could reintroduce mixed-language copy.

### Navigation & UI stability
- Gave the left navigation its own i18n helper and stabilized the Michel's Life brand lockup/navigation across authoritative rerenders.
- Repaired renderer dependencies exposed by exhaustive Spanish UI testing and added actionable DOM/route diagnostics to the UI smoke suite.
- Refined Spanish UI auditing to evaluate visible product surfaces while avoiding false positives from inactive/hidden legacy markup.

### Validation & Windows build
- Restored GitHub Actions runner availability by temporarily using public repository visibility after private-repository jobs stopped receiving runners.
- Verified the full pre-release functional suite on commit `50383840`: Source validation #497 and UI smoke #441 both completed successfully.
- Bumped Michel's Life from **v3.0.211** to **v3.0.212** across the .NET project, host materialization, installer, frontend bump/validators and Windows/UI workflows.
- Preserved the canonical v3.0.209 frontend source as the supported baseline while generating and validating the v3.0.212 packaged frontend during CI/release builds.


## 3.0.211 — 2026-09-28 — Bilingual Round-trip Hardening

### Language & localization
- Fixed Spanish → English switching for freshly rerendered UI nodes by restoring known canonical English system labels even when their original DOM node no longer exists.
- Added English normalization for system text, placeholders, tooltips and ARIA labels that could otherwise remain in Spanish after changing languages.
- Removed remaining English copy from Spanish mode across focus, thesis, statistics, calendar, comparison, Gold, action and notification surfaces.
- Normalized legacy mixed-language defaults such as `Revisión weekly`, `Usar equipo de casa 2 times`, `Prepare comida 3 times`, `Today vs ayer` and `Este mes vs mes pasado`.
- Added exact bilingual handling for time-of-day/default labels including Breakfast/Desayuno, Lunch/Comida, Work/Trabajo, Home/Casa, Dinner/Cena and After/Después.

### Settings & regression protection
- Fixed duplicate Settings cards produced by repeated Settings reconstruction.
- Prevented selected language and typography controls from inheriting the global dark-on-accent text override.
- Strengthened the Spanish UI audit to detect full English phrases and functional vocabulary instead of relying on a short list of known strings.
- Strengthened the Spanish → English round-trip audit to catch Spanish and mixed-language residue across all principal routes.
- Verified Spanish UI, English round-trip, installer/Settings language behavior, Settings integrity and Spanish Dashboard together before the version bump.

### Build / versioning
- Bumped Michel's Life from **v3.0.210** to **v3.0.211** across the .NET project, generated host, installer, validators, frontend versioning and Windows workflows.
- Kept the frontend bump compatible with either the v3.0.209 canonical source or a v3.0.210 generated source while rejecting stale version markers.

## 3.0.210 — 2026-09-28 — Bilingual Windows / Language Reliability

### Language & localization
- Completed the Spanish UI pass across Dashboard, Missions, Contracts, Calendar, Journal, Stats, Compare, Weekly Review, Projects, Achievements, Affirmations, Story, Settings, dialogs, hidden panels, tooltips, placeholders, ARIA labels, dates, weekdays, months, and dynamic status text.
- Added editorial Spanish checks for spelling, accents, punctuation, agreement, avoidable anglicisms, and awkward literal translations.
- Fixed mixed-language UI strings such as standalone difficulty labels, completion actions, category names, mission metadata, dynamic `Next #n` labels, and default mission text.
- Reworked Spanish → English switching so translated DOM values retain their canonical English originals and restore cleanly instead of relying on reverse translation.
- Added narrow normalization for legacy default content that was already stored in Spanish, without reverse-translating user-authored content.
- Added automatic fitting checks for translated controls and shortened cramped mission actions to `Siguiente` and `Vincular` where needed.

### Installer & Settings language behavior
- Fixed the Windows installer language bridge so choosing Spanish during installation wins even when Windows/WebView2 reports English.
- Added a late WebView2 reconciliation path so installer language is applied even if the web document is already loaded.
- Persisted the installer language baseline to remove startup timing races.
- Preserved manual language choices made in Settings across reloads/restarts.
- Fixed the Settings language control so it no longer reverts immediately because of delayed/global UI refreshes.
- Standardized the current Settings language control around explicit `English` / `Español` choices and validated their active state.

### Regression protection
- Added first-run coverage for **English OS/browser + Spanish installer**.
- Added installed-app language tests covering installer language, Settings switching, persistence after reload, and late native bridge arrival.
- Added Spanish ↔ English round-trip tests that fail if system-language residue remains.
- Added translated-control overflow tests using actual rendered geometry.
- Expanded exhaustive Spanish UI auditing to visible and hidden DOM text plus controls and accessibility attributes.
- Added a permanent Spanish source-copy audit to CI.

### Build / versioning
- Bumped Michel's Life from **v3.0.209** to **v3.0.210** across the .NET project, generated host, installer, validators, UI-smoke artifact naming, and Windows build workflows.
- Added a deterministic frontend version-bump step so the canonical generated HTML is packaged as v3.0.210 without manually editing the oversized frontend bundle.
- Added v3.0.209 to the legacy-version checks so stale build markers are rejected.
- Final source validation and the complete UI smoke suite passed for the v3.0.210 codebase.

## 3.0.207 — Google Cloud Baseline

- Established v3.0.207 as the approved Michel’s Life baseline.
- Fixed Desktop OAuth credential handling so `client_secret` is sent as the actual secret value rather than the credential JSON document.
- Switched the host build to the approved Google Desktop OAuth client for project `michel-s-life`.
- Verified Google authorization, token exchange, Google Drive API access, and persistent Cloud Sync access end-to-end.
- Kept Google connection/status/error feedback inside Settings → Google instead of Michel’s Life-owned popup dialogs.
- Preserved the accepted Typography architecture and About the Developer presentation unchanged.
- Added CI protection that rejects a mismatched Google OAuth secret before an official Windows build is produced.


## 3.0.202 — Release Readiness

- Added **App Health & Diagnostics** in Settings → Data & Backup.
- Added automatic local error reports and on-demand diagnostic snapshots.
- Added portable **`.michelslife` export/import** with a safety restore point before import.
- Prepared the public GitHub Releases update channel.
- Online updates require a matching **SHA-256** checksum before installation.
- Added Windows installer definition and CI/release automation.
- Moved the Google OAuth build credential out of committed source.
- Removed legacy personal backup/bootstrap files from the bundled product source.
- Replaced account-specific Instagram matching logic with a generic account detector.
- Preserved all 204 existing JPG visual assets byte-for-byte.

## 3.0.201 — Backup Timeline

- Unified local restore points and Google Drive history in a chronological Backup Timeline.
- Added restore preview/comparison and automatic safety snapshots before restore.

## 3.0.200 — Product Finish Systems

- Added first-run onboarding for new installations.
- Added weekly/monthly progress recaps.
- Added safe local EXE updater with mandatory restore point.
- Removed personal starter data from fresh installs.

## 3.0.199 — Final Five Worlds

- Added Obsidian Empire, Celestial Garden, The Last Observatory, Cathedral of the Moon, and Golden Dunes as six-stage dynamic world packs.
