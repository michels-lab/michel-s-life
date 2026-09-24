# Changelog

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
