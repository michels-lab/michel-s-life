# Michel's Life

## Operación Granada — preservación visual y prototipo externo rechazado (2026-10-22)

[Auditoría y prevención del prototipo Lovable rechazado](docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md). **El diseño actual de Michel's Life permanece como referencia aprobada.** Lovable UI Lab no es mejora aceptada, ni versión pública, ni reemplazo. Nuevas propuestas requieren capturas comparables, paridad de funciones y aceptación del propietario; el validador opcional es `tools/validate_external_ui_design.py`. No se cambió el frontend ni se publicó un release por este hallazgo.

## Operación Granada — auditoría de aplicación y plugins (2026-10-21)

[Ver auditoría y bitácora propias de este producto](docs/GRANADA_APP_PLUGIN_AUDIT_2026-10-21.md): evidencia de GitHub Actions, conectores ChatGPT aplicables, servicios existentes, costo cero adicional por defecto, pendientes reales y separación estricta de los demás productos. La documentación no prueba QA físico ni publica una versión.

Michel's Life is an RPG-inspired productivity and life-management application for Windows and Android, developed by Michel Duarte / Michel's Lab.

## Current development and release lines

- **Latest public unified release: Windows v3.0.221 + Android Direct v0.2.9 (versionCode 11).** Published 2026-10-19 on the official unified release page: https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.221. GitHub verified 13 public assets including Windows Setup/Portable, SHA-256 sidecars, source provenance, and the permanently signed `MichelsLife-Android-Direct-v0.2.9.apk`. A published binary is **not** physical-Galaxy or live-account acceptance.
- **Previous unified releases:** Windows v3.0.220 + Android Direct v0.2.8, https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.220; Windows v3.0.219 + Android Direct v0.2.7, https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.219. Older releases remain historical, not the current installer.
- **Android distribution:** Direct v0.2.9 is the publicly released, separately signed sideload APK; it is **not** a Google Play publication. The old v0.2.2 TEST APK used a different debug signing certificate: back up data before changing signing channels or uninstalling. Never infer data retention or same-account sync solely from CI.
- **Development priority (2026-10-19):** Android remains active. Owner paused Windows/Desktop implementation and all automatic Windows installer, Store/MSIX, and Desktop Developer Edition builds until a final Windows version. The existing Windows v3.0.221 binary stays publicly available; source/browser-only parity checks are permitted.
- **GRANADA:** while any PR/issue is incomplete or in parallel, work on a separate non-overlapping block with its own validation and handoff. See `.michelslab/GRANADA.md`, `docs/CURRENT_HANDOFF.md` and the current open PRs rather than treating a queued change as published.
- Google Play and Microsoft Store distribution have separate provider, signing and validation states; a generated APK/AAB/MSIX does not mean provider publication.

## Product

Michel's Life manages missions, recurring tasks, Premium Contracts, Current Chapter, goals, Journal, achievements, statistics, focus and productivity, themes, English/Spanish interface, and local import/export backups.

The Windows v3.0.216-and-later line includes a native Windows tray, Quick Capture, Start with Windows, a global Command Palette, Sync Center, update detection and a shared Supabase sync client for Windows and Android. Google Calendar remains independent; Google Drive serves as a temporary migration/recovery fallback. Real same-account two-device sync/conflict/restore testing is still pending; Android issue #104 remains open for signed persistence/device evidence, even when browser/emulator regression suites pass.

## Code, releases and validation

- Source: `michels-lab/michel-s-life`.
- **One customer-facing release for both platforms:** https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.221. Windows v3.0.221 and Android Direct v0.2.9 have independent version numbers and live on the **same page**. Further Windows releases remain paused; new release publication requires explicit authorization.
- Canonical public binaries and AppBundle bootstrap: `michels-lab/michel-s-life-releases`.
- Recommended Windows installer: `MichelsLife-Setup-vX.Y.Z.exe`. Optional portable binary: `MichelsLife-Portable-vX.Y.Z.exe`; transitional older updater aliases are documented in `docs/RELEASE_CHANNEL.md`.
- Canonical frontend: `src/MichelsLife/frontend/`. CI reconstructs the visual bundle using previously published bootstrap assets and overlays the source-controlled frontend and official branding.

Local smoke/validation entry points: `python tools/release_smoke_test.py`, `python tools/store_smoke_test.py` and platform-specific Android validators. GitHub Actions performs source, browser-render/UI and Android APK/AAB checks on the relevant branch. Automatic Windows installer/Store/MSIX packaging is paused by owner instruction.

## Identity / About

The Michel's Life official product identity is **The Ascent** (mountain, path, star), governed by `michels-lab/Michel-Software-Standards/shared-assets/product-logos/manifest.json`. Canonical app-icon, mark and lockup files live under `branding/`. The author's portrait is immutable source artwork. The About composition includes product/version, Michel Duarte, Michel's Lab, `TOOLS WITH IDENTITY.` and visible social icons plus names.

Preserve the approved Themes, backgrounds, Current Chapter and layout. Automated build/security/integrity controls apply before publication; Michel's visual review of captured candidate screenshots takes place **after** publication, not as a manual release block.

## Security, privacy and licensing

Do not commit user states, private OAuth tokens, signing keystores or secrets. Supabase browser clients use a publishable key only, with per-user RLS in the backend. GitHub repository signing credentials and Play Console setup are separate from source code. The source repository is public, but redistribution and reuse rights depend on `LICENSE.txt`, not the public repository visibility.

Project state and known gaps are recorded in `GIT_AUDIT_LOG.md`, `android/ANDROID_AUDIT_LOG.md` and `docs/INFRASTRUCTURE_AUDIT.md`.
