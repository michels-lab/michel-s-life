# Changelog

> Official development log for Michel's Life. Every meaningful app change must be recorded here before a version is considered complete. Entries should describe verified changes only and be grouped by version/date.

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
