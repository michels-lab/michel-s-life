# Michel's Life

## Actual release estable verificado — 19 de noviembre de 2026 (UTC; 18 de noviembre tarde en México)

**Windows 3.0.229 + Android Direct 0.2.18 (versionCode 20)** es la última versión pública estable: [descargar los 13 archivos oficiales](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.229-android-v0.2.18). Publicado el 2026-11-19 07:18:56 UTC, `draft=false`, `prerelease=false`. Fuente exacta `ac17aefe8b5357f36ae941920774dd652c9f4050`, [CI source #44476655063](https://github.com/michels-lab/michel-s-life/actions/runs/44476655063) **SUCCESS** y [publicador destino #44478564052](https://github.com/michels-lab/michel-s-life-releases/actions/runs/44478564052) **SUCCESS**. Firma Android Direct permanente, SHA-256, Windows Setup/Portable iniciados e instalación/reapertura del APK de producción en Android15 AVD aprobados.

**Granada de audio:** [PR #221](https://github.com/michels-lab/michel-s-life/pull/221) fusionada: sustituidos los seis tonos antiguos de dos notas/pitidos por seis composiciones propias de 24 segundos, estéreo, cuatro cambios armónicos, campanas resonantes, bajos cálidos, ecos, ritmos distintos y nombres ES/EN. Nuevas alarmas sugieren Primera luz; las alarmas guardadas conservan su sonido elegido. Preview 12s, MP3/WAV/OGG propio, Quick Alarm, repetición, snooze, wallpapers y alarmas nativas preservados. Android cachea el nuevo PCM v3 y usa un canal de notificación silencioso solo si la escena inmersiva reproduce efectivamente el audio; en caso contrario conserva el canal audible de respaldo. [PR #223](https://github.com/michels-lab/michel-s-life/pull/223) corrigió el pitido adicional de Windows que se superponía a las composiciones. [PR #222](https://github.com/michels-lab/michel-s-life/pull/222) preparó el versionado/release.

**Evidencia y límites:** siete/siete checks obligatorios exact-SHA, Windows y APK firmado con instalación/reapertura Android15 emulado **SUCCESS**; el [problema intermitente JavaScript #168](https://github.com/michels-lab/michel-s-life/issues/168) sigue abierto. No está acreditada la escucha estética en bocinas del usuario, Samsung físico en Doze/bloqueo, MP3 propio en dispositivo real, actualización in-place sin pérdida de datos ni sincronización de cuentas reales. Tampoco se publicó en Microsoft Store o Google Play. La estable 3.0.228/0.2.17 continúa disponible como histórica.

## Referencias visuales reales para Figma/Lovable (Operación Granada, 2026-10-23)

[Cómo consultar y comparar las capturas oficiales de la app actual](docs/audit/2026-10-23-granada-canonical-design-reference.md). La CI de escritorio y Android genera `design-baseline.html` y `design-baseline.json` junto a sus capturas reales; las referencias están ligadas al SHA del código, paquete y tamaño de pantalla. **No son una aprobación de un rediseño ni sustituyen pruebas del APK/Windows instalado**. Diseños nuevos deben preservar las características aprobadas y compararse antes de consumir más créditos externos.

## Operación Granada — preservación visual y prototipo externo rechazado (2026-10-22)

[Auditoría y prevención del prototipo Lovable rechazado](docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md). **El diseño actual de Michel's Life permanece como referencia aprobada.** Lovable UI Lab no es mejora aceptada, ni versión pública, ni reemplazo. Nuevas propuestas requieren capturas comparables, paridad de funciones y aceptación del propietario; el validador opcional es `tools/validate_external_ui_design.py`. No se cambió el frontend ni se publicó un release por este hallazgo.

## Operación Granada — auditoría de aplicación y plugins (2026-10-21)

[Ver auditoría y bitácora propias de este producto](docs/GRANADA_APP_PLUGIN_AUDIT_2026-10-21.md): evidencia de GitHub Actions, conectores ChatGPT aplicables, servicios existentes, costo cero adicional por defecto, pendientes reales y separación estricta de los demás productos. La documentación no prueba QA físico ni publica una versión.

Michel's Life is an RPG-inspired productivity and life-management application for Windows and Android, developed by Michel Duarte / Michel's Lab.

## Current development and release lines

- **Latest public unified release: Windows v3.0.229 + Android Direct v0.2.18 (versionCode 20).** Published 2026-11-19 07:18:56 UTC: https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.229-android-v0.2.18. Official stable (13 assets), permanent Android certificate, exact-SHA provenance, Windows Setup/Portable launch and production-signed Android15 AVD install/relaunch. Physical phone and live-account acceptance are independent.
- **Previous unified releases:** Windows v3.0.220 + Android Direct v0.2.8, https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.220; Windows v3.0.219 + Android Direct v0.2.7, https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.219. Older releases remain historical, not the current installer.
- **Android distribution:** Android Direct v0.2.18 is the current permanently signed sideload APK, **not** a Google Play publication. The old v0.2.2 TEST APK has a different debug signer; back up data before uninstall/switching channels. Live in-place upgrade data retention is still unverified.
- **Development priority (updated 2026-11-18):** Windows and Android are both distributed as a single verified stable release with no separate Developer Edition or RC. Earlier October Windows pause was superseded by the owner's later release work; Microsoft Store and Google Play remain independent future submissions.
- **GRANADA:** while any PR/issue is incomplete or in parallel, work on a separate non-overlapping block with its own validation and handoff. See `.michelslab/GRANADA.md`, `docs/CURRENT_HANDOFF.md` and the current open PRs rather than treating a queued change as published.
- Google Play and Microsoft Store distribution have separate provider, signing and validation states; a generated APK/AAB/MSIX does not mean provider publication.

## Product

Michel's Life manages missions, recurring tasks, Premium Contracts, Current Chapter, goals, Journal, achievements, statistics, focus and productivity, themes, English/Spanish interface, and local import/export backups.

The Windows v3.0.216-and-later line includes a native Windows tray, Quick Capture, Start with Windows, a global Command Palette, Sync Center, update detection and a shared Supabase sync client for Windows and Android. Google Calendar remains independent; Google Drive serves as a temporary migration/recovery fallback. Real same-account two-device sync/conflict/restore testing is still pending; Android issue #104 remains open for signed persistence/device evidence, even when browser/emulator regression suites pass.

## Code, releases and validation

- Source: `michels-lab/michel-s-life`.
- **One customer-facing release for both platforms:** https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.229-android-v0.2.18. The current Windows installer is 3.0.229 and Android Direct 0.2.18; release includes setup, portable, APK, SHA-256 sidecars and provenance. Never publish unverified candidates.
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
