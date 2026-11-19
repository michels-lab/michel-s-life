# Michel's Life

## Actual release estable verificado — 18 de noviembre de 2026 (México; 19 de noviembre UTC)

**Windows 3.0.228 + Android Direct 0.2.17 (versionCode 19)** es la versión pública estable actual: [descarga oficial unificada con 13 archivos](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.228-android-v0.2.17). Publicada 2026-11-19 05:50:18 UTC, sin draft ni prerelease. [Compilación exacta fuente #44466658753](https://github.com/michels-lab/michel-s-life/actions/runs/44466658753) **SUCCESS** sobre SHA `0a9b6e966c25d9400a0e7db15c5f8aec1acb995a`; [publicador oficial #44467820961](https://github.com/michels-lab/michel-s-life-releases/actions/runs/44467820961) **SUCCESS**, firma Android Direct permanente verificada, SHA-256 y Windows Setup/Portable ejecutados.

**Cambios:** [#218](https://github.com/michels-lab/michel-s-life/pull/218) integró Quick Mission funcional, ocho paisajes sonoros originales seleccionables (A+C), seis tonos originales para terminar Pomodoro más silencio, previsualización y preferencias persistentes, Focus inmersivo legible en 976×737, y textos completos en español/inglés. [#219](https://github.com/michels-lab/michel-s-life/pull/219) preparó ambas plataformas; [#220](https://github.com/michels-lab/michel-s-life/pull/220) reparó las verificaciones obligatorias del release a SHA exacto. Sigue preservada la eliminación de código obsoleto Focus y las alarmas/Quick Alarms de la anterior v3.0.227.

**Evidencia / límites:** todas las siete verificaciones del SHA de release, Windows Setup/Portable real y Android Direct **firmado, instalado, completado el onboarding y relanzado en emulador Android 15** terminaron en verde. El [incidente intermitente #168](https://github.com/michels-lab/michel-s-life/issues/168) continúa abierto; Galaxy físico (Doze, bloqueo y MP3 propio), actualización in-place conservando datos, OAuth/Supabase de cuentas reales y transporte ADB de Android 14/16 **no** se acreditan como validados. Este release no es Developer Edition, RC, Microsoft Store ni Google Play. La v3.0.227/0.2.16 permanece disponible como histórica.

## Referencias visuales reales para Figma/Lovable (Operación Granada, 2026-10-23)

[Cómo consultar y comparar las capturas oficiales de la app actual](docs/audit/2026-10-23-granada-canonical-design-reference.md). La CI de escritorio y Android genera `design-baseline.html` y `design-baseline.json` junto a sus capturas reales; las referencias están ligadas al SHA del código, paquete y tamaño de pantalla. **No son una aprobación de un rediseño ni sustituyen pruebas del APK/Windows instalado**. Diseños nuevos deben preservar las características aprobadas y compararse antes de consumir más créditos externos.

## Operación Granada — preservación visual y prototipo externo rechazado (2026-10-22)

[Auditoría y prevención del prototipo Lovable rechazado](docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md). **El diseño actual de Michel's Life permanece como referencia aprobada.** Lovable UI Lab no es mejora aceptada, ni versión pública, ni reemplazo. Nuevas propuestas requieren capturas comparables, paridad de funciones y aceptación del propietario; el validador opcional es `tools/validate_external_ui_design.py`. No se cambió el frontend ni se publicó un release por este hallazgo.

## Operación Granada — auditoría de aplicación y plugins (2026-10-21)

[Ver auditoría y bitácora propias de este producto](docs/GRANADA_APP_PLUGIN_AUDIT_2026-10-21.md): evidencia de GitHub Actions, conectores ChatGPT aplicables, servicios existentes, costo cero adicional por defecto, pendientes reales y separación estricta de los demás productos. La documentación no prueba QA físico ni publica una versión.

Michel's Life is an RPG-inspired productivity and life-management application for Windows and Android, developed by Michel Duarte / Michel's Lab.

## Current development and release lines

- **Latest public unified release: Windows v3.0.228 + Android Direct v0.2.17 (versionCode 19).** Published 2026-11-19 05:50:18 UTC on https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.228-android-v0.2.17. The 13 public assets include tested Windows Setup/Portable, SHA-256 sidecars, signed Android Direct `MichelsLife-Android-Direct-v0.2.17.apk`, and exact source provenance. Emulator success does not prove Galaxy/real-account acceptance.
- **Previous unified releases:** Windows v3.0.220 + Android Direct v0.2.8, https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.220; Windows v3.0.219 + Android Direct v0.2.7, https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.219. Older releases remain historical, not the current installer.
- **Android distribution:** Direct v0.2.17 is the current publicly released permanently signed APK; **not** a Google Play publication. The ancient v0.2.2 TEST APK uses a different debug certificate; back up user data before switching signing channels or uninstalling. Live in-place upgrade and real same-account sync are not yet certified.
- **Development priority (updated 2026-11-18):** Windows and Android are both distributed as a single verified stable release with no separate Developer Edition or RC. Earlier October Windows pause was superseded by the owner's later release work; Microsoft Store and Google Play remain independent future submissions.
- **GRANADA:** while any PR/issue is incomplete or in parallel, work on a separate non-overlapping block with its own validation and handoff. See `.michelslab/GRANADA.md`, `docs/CURRENT_HANDOFF.md` and the current open PRs rather than treating a queued change as published.
- Google Play and Microsoft Store distribution have separate provider, signing and validation states; a generated APK/AAB/MSIX does not mean provider publication.

## Product

Michel's Life manages missions, recurring tasks, Premium Contracts, Current Chapter, goals, Journal, achievements, statistics, focus and productivity, themes, English/Spanish interface, and local import/export backups.

The Windows v3.0.216-and-later line includes a native Windows tray, Quick Capture, Start with Windows, a global Command Palette, Sync Center, update detection and a shared Supabase sync client for Windows and Android. Google Calendar remains independent; Google Drive serves as a temporary migration/recovery fallback. Real same-account two-device sync/conflict/restore testing is still pending; Android issue #104 remains open for signed persistence/device evidence, even when browser/emulator regression suites pass.

## Code, releases and validation

- Source: `michels-lab/michel-s-life`.
- **One customer-facing release for both platforms:** https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.228-android-v0.2.17. Windows v3.0.228 and Android Direct v0.2.17 share the same official release page, with independently verified versions and signing. Future releases still require exact-source CI, signed-native checks and release provenance.
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
