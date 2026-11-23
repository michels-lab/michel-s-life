# Michel's Life

## Última estable verificada — 23 de noviembre de 2026

**Windows 3.0.231 + Android Direct 0.2.20 (versionCode22)** es la [última release pública oficial](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.231-android-v0.2.20). Publicada **2026-11-23 20:13:17 UTC (14:13 Saltillo)**, `draft=false`, `prerelease=false`, **13 assets** con manifiesto, checksums y certificado Android de producción.

**Evidencia verificable:** commit fuente exacto `9ce4881b93e16f378f7f78c1808c897d385d67fc`; [source CI #45245978185](https://github.com/michels-lab/michel-s-life/actions/runs/45245978185) **SUCCESS** con nueve suites del mismo SHA y los cuatro jobs `exact-source`, `windows / build`, `android / android`, `signed-native-android15` **SUCCESS**; [destino publisher #45256957584](https://github.com/michels-lab/michel-s-life-releases/actions/runs/45256957584) **SUCCESS**, mismo SHA, 13 archivos inspeccionados y descarga de control.

**Cambio de interfaz ya instalado en las builds públicas:** [PR #230](https://github.com/michels-lab/michel-s-life/pull/230) — Mozart Sonata K.545 y Chaikovski Oración matinal Op.39/1 ahora aparecen en una sección **Música clásica** con botones visibles y reproducibles sin desplegar Audio, tanto en Windows como Android. Las ocho ambientaciones anteriores y los tonos de fin de Pomodoro se conservan. **Son fragmentos breves sintetizados, no obras completas ni grabaciones comerciales.** [PR #229](https://github.com/michels-lab/michel-s-life/pull/229) añadió una comprobación real Android15 de actualización in-place de las APK firmadas anteriores, UID invariable; no lee ni garantiza el contenido privado WebView en el Galaxy.

**Pendientes de aceptación del propietario:** escuchar/ver en equipos físicos, Samsung Doze/bloqueo/MP3, preservación de los datos personales al actualizar, Supabase/Google reales, issue #168 y QA de apariencia. Progreso integral **7/15 = 47%**, sin aumentar artificialmente. La versión anterior **3.0.230/0.2.19** permanece disponible y no fue sobrescrita.

**Desarrollo en revisión, NO incluido en la estable anterior:** [PR #232 — biblioteca ambiental visible y preescucha de Pomodoro](https://github.com/michels-lab/michel-s-life/pull/232). [Auditoría y límites de aceptación](docs/audit/2026-11-23-focus-direct-catalog.md). El avance oficial sigue 7/15; estos cambios requieren CI exacto, revisión instalada y una publicación estable posterior.

---

## Historial: release anterior — 20 de noviembre de 2026 (México) / 21 de noviembre UTC

**Windows 3.0.230 + Android Direct 0.2.19 (versionCode 21)** fue la última versión pública verificada en el corte anterior: [descargar 13 archivos oficiales](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.230-android-v0.2.19), publicada el **2026-11-21 00:31:09 UTC**; `draft=false`, `prerelease=false`, 13 assets. Fuente exacta `9e3a3abc84c811fc2baf4eb64e5a50ca1ccc31cf`, [workflow source #44842053581](https://github.com/michels-lab/michel-s-life/actions/runs/44842053581) **SUCCESS** y [publicador destino #44844286557](https://github.com/michels-lab/michel-s-life-releases/actions/runs/44844286557) **SUCCESS**. Las nueve suites exact-SHA pasaron; Setup/Portable Windows iniciados, APK Direct con firma permanente y SHA-256 comprobados e instalación/onboarding/reapertura del **APK firmado de producción** en Android15 AVD aprobados. Las validaciones de Android14/16 debug hospedado siguen teniendo incidencias ADB/QEMU y File Steward audit falló por conflicto de actualización concurrente; ninguna se finge superada.

**Mejoras de esta Granada:** [PR #225](https://github.com/michels-lab/michel-s-life/pull/225) colores de Settings con panel flotante contextual, persistencia, muestras de Chapter/Focus/Alarms, contraste, deshacer por token y empaquetado real Windows+Android; [PR #226](https://github.com/michels-lab/michel-s-life/pull/226) miniaturas breves sintetizadas de Mozart K545 y Chaikovski Op39/1 sobre motivos de dominio público, conservando ocho soundscapes originales (no son obras completas ni grabaciones comerciales); [PR #227](https://github.com/michels-lab/michel-s-life/pull/227) versionado y controles. La distribución oficial verificó 13 assets, certificado, hashes y procedencia de un solo source run.

**Aceptación pendiente:** colores y audición en equipos físicos, Samsung Doze/bloqueo y MP3 propio, actualización Android in-place preservando datos, Supabase/Google OAuth reales, error JavaScript intermitente [#168](https://github.com/michels-lab/michel-s-life/issues/168), Microsoft Store/Google Play y aceptación visual del propietario. El hecho de que el release técnico esté publicado no equivale a cerrar esas pruebas. Sin RC ni Developer Edition.

---


## Release anterior verificado — 19 de noviembre de 2026 (México y UTC)

**Windows 3.0.229 + Android Direct 0.2.18 (versionCode 20)** fue la versión pública estable anterior: [descargar los 13 archivos oficiales](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.229-android-v0.2.18). Publicado el 2026-11-19 07:18:56 UTC, `draft=false`, `prerelease=false`. Fuente exacta `ac17aefe8b5357f36ae941920774dd652c9f4050`, [CI source #44476655063](https://github.com/michels-lab/michel-s-life/actions/runs/44476655063) **SUCCESS** y [publicador destino #44478564052](https://github.com/michels-lab/michel-s-life-releases/actions/runs/44478564052) **SUCCESS**. Firma Android Direct permanente, SHA-256, Windows Setup/Portable iniciados e instalación/reapertura del APK de producción en Android15 AVD aprobados.

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


## Michel's Life stable publication — 2026-11-23

Windows **3.0.231** / Android Direct **0.2.20** (`versionCode 22`) was published as stable tag [`v3.0.231-android-v0.2.20`](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.231-android-v0.2.20). Exact source SHA: `9ce4881b93e16f378f7f78c1808c897d385d67fc`; source run [45245978185](https://github.com/michels-lab/michel-s-life/actions/runs/45245978185) completed success; destination publisher [45256957584](https://github.com/michels-lab/michel-s-life-releases/actions/runs/45256957584) completed success. `releases/latest` resolves to this tag, with 13 uploaded assets, `draft=false`, `prerelease=false`. No RC or Developer Edition was published. The previous stable release was not overwritten.

**Acceptance baseline remains 7/15 (47%)** until real user acceptance on Windows and Galaxy. Mozart K545 and Tchaikovsky Op. 39 are **visible buttons playing synthesized thematic excerpts**, **not complete works**; integrating complete performances remains pending. Publication does not equal device acceptance.
