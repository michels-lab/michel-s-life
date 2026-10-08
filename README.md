# Michel's Life

Michel's Life is an RPG-inspired productivity and life-management application for Windows and Android, developed by Michel Duarte / Michel's Lab.

## Current development and release lines

- **Windows v3.0.216:** published stable on 2026-10-08: https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.216. Installer, Portable and checksums were published from a tested Windows build.
- **Windows v3.0.215:** previous stable release (2026-09-30).
- **Android v0.2.2:** integrated Android development candidate (versionCode 4); the previous mainline test line was v0.2.1.
- Google Play and Microsoft Store distribution have separate provider, signing and validation states; a generated APK/AAB/MSIX does not mean provider publication.

## Product

Michel's Life manages missions, recurring tasks, Premium Contracts, Current Chapter, goals, Journal, achievements, statistics, focus and productivity, themes, English/Spanish interface, and local import/export backups.

The released v3.0.216 Windows app adds a native Windows tray, Quick Capture, Start with Windows, a global Command Palette, Sync Center, update detection and a shared Supabase sync client for Windows and Android. Google Calendar remains independent; Google Drive serves as a temporary migration/recovery fallback. Real same-account two-device sync/conflict/restore testing is still pending.

## Code, releases and validation

- Source: `michels-lab/michel-s-life`.
- Canonical public binaries and AppBundle bootstrap: `michels-lab/michel-s-life-releases`.
- Recommended Windows installer: `MichelsLife-Setup-vX.Y.Z.exe`. Optional portable binary: `MichelsLife-Portable-vX.Y.Z.exe`; transitional older updater aliases are documented in `docs/RELEASE_CHANNEL.md`.
- Canonical frontend: `src/MichelsLife/frontend/`. CI reconstructs the visual bundle using previously published bootstrap assets and overlays the source-controlled frontend and official branding.

Local smoke/validation entry points: `python tools/release_smoke_test.py`, `python tools/store_smoke_test.py` and platform-specific Android validators. GitHub Actions performs source, browser-render/UI, Android APK/AAB and Windows build/installer checks on the relevant branch.

## Identity / About

The Michel's Life official product identity is **The Ascent** (mountain, path, star), governed by `michels-lab/Michel-Software-Standards/shared-assets/product-logos/manifest.json`. Canonical app-icon, mark and lockup files live under `branding/`. The author's portrait is immutable source artwork. The About composition includes product/version, Michel Duarte, Michel's Lab, `TOOLS WITH IDENTITY.` and visible social icons plus names.

Preserve the approved Themes, backgrounds, Current Chapter and layout. Automated build/security/integrity controls apply before publication; Michel's visual review of captured candidate screenshots takes place **after** publication, not as a manual release block.

## Security, privacy and licensing

Do not commit user states, private OAuth tokens, signing keystores or secrets. Supabase browser clients use a publishable key only, with per-user RLS in the backend. GitHub repository signing credentials and Play Console setup are separate from source code. The source repository is public, but redistribution and reuse rights depend on `LICENSE.txt`, not the public repository visibility.

Project state and known gaps are recorded in `GIT_AUDIT_LOG.md`, `android/ANDROID_AUDIT_LOG.md` and `docs/INFRASTRUCTURE_AUDIT.md`.
