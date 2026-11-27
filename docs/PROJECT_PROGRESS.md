# Michel's Life — avance funcional y puertas de aceptación

## 27-nov — Block 4B integrado y publicación 3.0.235 / 0.2.24 activada

PR #241 fusionado `6f93a41519707973bd47e1d728483a7c83b168c7`; verificación PR incompleta al integrar. Intent fuente `f215871229b262abe79b86efa87131692f25e0eb`, [build exacto #45972159767](https://github.com/michels-lab/michel-s-life/actions/runs/45972159767) en cola; preflight destino #45972087208 SUCCESS, intent destino `8077bb23f4bec76018b8f1be4e1f52e6915f166c` activado. Publicación condicionada a once checks exactos y cuatro jobs de fuente, firma Android Direct code26, instaladores Windows y trece assets. Estable vigente 3.0.234 / 0.2.23; no se afirma publicación nueva. 8/15 hitos (53%).

## 27-nov — Block 4B / 3.0.235 + Android Direct 0.2.24 en preparación

Estable vigente [3.0.234 / 0.2.23](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.234-android-v0.2.23), 13 assets, publicada 2026-11-26 03:05:02 UTC; fuente #45741133970, publicador #45746499113, verificador #45746499216 SUCCESS. PR #241 candidato `fa18f53812ea5a9ee2a55b7fbcc64e9f7c8d22d5`: 11 rutas desktop verificadas contra fondo sólido, vidrio y opacidad, controles flotantes, Play/Pause ambiental siempre visible, campanas de fase, Settings compacto Android; se preservan 18 grabaciones y diseño aprobado. Candidato anterior 21/24 checks aprobados, 2 fallos compartidos de fixture de reintento nativo (corregido), Android build pendiente. Versiones 3.0.235 y 0.2.24 code26, once gates exact-SHA, workflow de publicación destino preparado, sin intent de publicación. Aceptación física y API34/36 pendientes. Avance integral 8/15=53%.

## Michel’s Life — release 3.0.233 / Android Direct 0.2.22 PUBLICADO

Estable oficial [v3.0.233-android-v0.2.22](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.233-android-v0.2.22), code24, 13 assets, publicada 2026-11-25 03:46:24 UTC (24-nov 21:46 Saltillo), draft=false, prerelease=false. Fuente exacta cc446a3f00200ceadaf5fa8776f372ef6639bfc4: [45540789141](https://github.com/michels-lab/michel-s-life/actions/runs/45540789141) SUCCESS, once gates exact-SHA SUCCESS, Windows Setup/Portable launch y APK Android Direct production-signed instalación/relaunch API35 SUCCESS. Publicador destino fcb60da09e52d3e8adfa5c3fc02755a7bef184b2: [45540970195](https://github.com/michels-lab/michel-s-life-releases/actions/runs/45540970195) SUCCESS, verificador independiente [45540970202](https://github.com/michels-lab/michel-s-life-releases/actions/runs/45540970202) SUCCESS. PR #236 integrado. 18 grabaciones completas, Pomodoro clock-first/frases visibles, playlists/salto/archivo/restauración, importación local múltiple y alarmas sin máximo fijo. 16/40 nuevas grabaciones verificadas, avance integral 8/15=53%; no inflar hitos por release. Android14/16 debug no certificados (ADB); aceptación física, audio completo bloqueado, persistencia de datos personales y futuras ampliaciones pendientes. Actualizar sin desinstalar y respaldar datos.

## 24-nov — 3.0.233 / Android 0.2.22 en preparación
PR #236 integrado, 22/23 checks exitosos, API35 debug PASS; Android14/16 ADB falló. Release firmado pendiente; avance 8/15 = 53%. 18 grabaciones y biblioteca personal, sin cambios de dashboard.

## Candidato 24-nov — biblioteca real y reproductor

18 grabaciones completas en repositorio (12 Scott Buckley + cuatro piano + Mozart/Chaikovski); importaciones 45509032674 y 45516226514 exitosas. 16/40 nuevas verificadas. Reproductor: volumen guardado, repetir/lista/aleatorio sin repetición inmediata, selección de colección, pausa y avance, stop independiente. Valida integridad de cada MP3 al empaquetar, prueba Chromium con archivos reales y conteo actualizado. Pendiente CI exacto de este candidato, física Windows/Galaxy y publicación; estable anterior no aceptada. Se preserva #8–13 y #15 pendientes; avance integral 8/15 = 53%. No se cambia el dashboard.

## Publicación 24-nov 2026 — 3.0.232 / Android Direct 0.2.21

**Estable oficial publicada:** [Windows 3.0.232 + Android Direct 0.2.21](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.232-android-v0.2.21), code23, 13 assets, 2026-11-24 20:52:21 UTC, draft=false, prerelease=false. [Fuente #45478901654](https://github.com/michels-lab/michel-s-life/actions/runs/45478901654) SUCCESS, 11/11 exact-SHA gates, Windows Setup y portable launch PASS, APK firmada e instalación/relaunch API35 SUCCESS. [Publicador #45485082290](https://github.com/michels-lab/michel-s-life-releases/actions/runs/45485082290) SUCCESS y hashes descargados comprobados. Fuente `d82359c010ece7fc0f12d2dcc8238d718093ad22`; intent destino `0941ea1010f38c74fc310172334958356c2a4787`.

**Avance integral 8/15 = 53%** (antes 47%). Hito #14 VERIFICADO: #168 cerrado tras reproducir corrupción exacta de cuatro scripts, corregir limpiador v153, comprobar Story/Focus 6/6 y Android UI; PR #233 y #235 integradas, segunda compilación exacta publicada. Acceso Alarmas en barra superior Android sin overlay de formulario; 8 ambientes + 2 miniaturas clásicas directas, preescucha de fin, 10 arreglos Alarmas, colores días persistentes y preview. Hitos #8–13 y #15 siguen pendientes por aceptación real, no por empaquetado. Android14/16 debug fallidos; Android15 firmado no demuestra datos privados. Antes de actualizar en Galaxy respaldar datos y no desinstalar.

## Publicación 23-nov 2026 — 3.0.231 / Android Direct 0.2.20

**Release técnica publicada:** [Windows 3.0.231 + Android Direct 0.2.20](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.231-android-v0.2.20), `versionCode22`, 13 assets, publicada 2026-11-23 20:13:17 UTC, certificado Android Direct de producción y checksums verificados. [Fuente #45245978185](https://github.com/michels-lab/michel-s-life/actions/runs/45245978185) SUCCESS (9/9 suites exact SHA, Windows lanzado, APK de producción Android15 instalada/reabierta). [Publicador #45256957584](https://github.com/michels-lab/michel-s-life-releases/actions/runs/45256957584) SUCCESS. Fuente `9ce4881b93e16f378f7f78c1808c897d385d67fc`; intent destino `f6b6e65df6b5c037be590d498eee2bd1c609c51f`.

**Música clásica visible de verdad:** PR #230 fusionada: botones directos Mozart K.545 y Chaikovski Op.39/1 en Focus Windows/Android, sin desplegar Audio; selección guardada, reproducción/cambio/detención probados en Chromium. **Fragmentos temáticos sintetizados, NO piezas completas.** La audición/aceptación visual física del usuario del hito #9 sigue pendiente. PR #229 fusionada: actualización real Android firmada 0.2.18→0.2.19 bajo Android15 API35, instalando con `adb install -r`, mismo UID y relanzamiento; no examina los datos privados/localStorage.

**Total integral: 7/15 = 47%**, no confundir release técnica completada con aceptación final. El posible problema de concurrencia del File Steward en repositorio de distribución es independiente del producto, no invalida la release; el usuario todavía necesita probar la estable instalada. Issue JavaScript #168 sigue abierto.

**Corte:** 2026-11-23, última publicación 2026-11-23 20:13:17 UTC · **Alcance:** aceptación de la estable unificada Windows/Android ya publicada, conservando todos los datos y diseños existentes. El avance **NO** es un porcentaje de líneas de código ni certificación de un Galaxy físico.

## Línea base: 47% (7/15 hitos verificados)

La línea base se establece en este corte por primera vez; NO significa que el proyecto avanzó de 0 a 47% hoy. Criterio: un hito se marca verificado solo con fuente y evidencia de CI o artefacto ya publicado; hitos de dispositivos y cuentas reales no se cierran con simulaciones.

| # | Hito | Estado | Evidencia/puerta pendiente |
|---|---|---|---|
| 1 | Windows Setup/Portable estable compilado, iniciado y verificado | VERIFICADO | v3.0.231, source #45245978185 y publisher #45256957584 |
| 2 | Android Direct APK firmada instalada y relanzada en Android 15 emulado | VERIFICADO | v0.2.20 code22, signed-native-android15 #45245978185 SUCCESS |
| 3 | Quick Mission con captura/editor real y persistencia comprobada en pruebas | VERIFICADO | Release 3.0.228/0.2.17, PR #218 |
| 4 | Pomodoro inmersivo Windows/Android y navegación CI sin sidebar antiguo | VERIFICADO | Release 3.0.228/0.2.17, PR #217/218 |
| 5 | Tonos elegibles para fin de Pomodoro, silencio, preview, preferencias | VERIFICADO | PR #218 y release 3.0.228 |
| 6 | Alarmas con seis arreglos originales y protección contra doble pitido Windows | VERIFICADO | PR #221/#223 y release 3.0.229 |
| 7 | Restauración transaccional y seguridad de cuenta verificadas con fuentes/fixtures | VERIFICADO | PR #207; no cuenta como provider real |
| 8 | Colores persistentes y preview Settings aceptados en app compilada | PENDIENTE | v3.0.231 publicada; CI y paquete verificados; falta confirmación visual del propietario en Windows/Galaxy |
| 9 | Mozart/Chaikovski integrados en estable y escuchados con selector real | PENDIENTE | v3.0.231 publicada y botones clásicos visibles en navegador; falta audición/aceptación de propietario, son fragmentos sintéticos |
| 10 | Alarmas Samsung físico con Doze/bloqueo y MP3 personalizados | PENDIENTE | Galaxy/permiso exact-alarm |
| 11 | Actualización firmada Android in-place preserva datos reales | PENDIENTE | Revisión antes/después sin desinstalar |
| 12 | Sincronización Supabase de la misma cuenta Windows↔Android, conflictos y aislamiento real | PENDIENTE | Dos dispositivos, cuentas reales |
| 13 | Google Calendar OAuth real lectura/escritura de misión en Android | PENDIENTE | Aceptación proveedor real |
| 14 | Errores JavaScript intermitentes Story/Pomodoro eliminados, no solo pasan reintentos | VERIFICADO | #168 cerrado, PR #233/#235, release 3.0.232/0.2.21 y CI exacta |
| 15 | Aceptación funcional/estética del propietario en Windows y Galaxy instalados | PENDIENTE | Capturas y uso físico del release candidato |

## Granada completada: release unificado verificado — 20 noviembre México / 21 noviembre UTC

**Release oficial** [Windows 3.0.230 + Android Direct 0.2.19 (code21)](https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.230-android-v0.2.19) publicado **2026-11-21 00:31:09 UTC**, `draft=false`, `prerelease=false`, **13 assets**. Fuente exacta `9e3a3abc84c811fc2baf4eb64e5a50ca1ccc31cf`, [source #44842053581](https://github.com/michels-lab/michel-s-life/actions/runs/44842053581) **SUCCESS**, nueve suites exact-SHA SUCCESS, cuatro jobs (exact-source, Windows, Android, signed-native-android15) SUCCESS. [Publicador destino #44844286557](https://github.com/michels-lab/michel-s-life-releases/actions/runs/44844286557) **SUCCESS**, assets descargados y comparados, firma Android Direct y SHA-256 comprobados, instalado/reabierto en Android15 emulado.

**Hitos #8 y #9:** ya están **publicados técnicamente**, no quedan pendientes de empaquetado o integración; permanecen **PENDIENTES de aceptación física** (colores/panel flotante bajo el equipo del usuario, escucha y estética real de las dos miniaturas Mozart/Chaikovski desde el selector Focus). No se inventa auditoría Samsung físico, MP3 bajo Doze/bloqueo, actualización in-place sin pérdida, Supabase/Google reales ni cierre de [#168](https://github.com/michels-lab/michel-s-life/issues/168).

**Condición de verificación ajena:** el workflow File Steward falló por conflicto de escritura concurrente (no constituye gate de release ni se etiqueta SUCCESS); los tests de emulador *debug* Android14/16 de PR anteriores no sustituyen la comprobación firmada Android15. La versión estable no es RC/Developer Edition. **Línea base integral sigue 7/15 = 47%** hasta cumplir las condiciones de aceptación de hitos #8 y #9, no por falta de release.

## Granada de integración y release staging — 20 noviembre 2026 (histórico)

Los [PR #225](https://github.com/michels-lab/michel-s-life/pull/225) y [#226](https://github.com/michels-lab/michel-s-life/pull/226) quedaron **fusionados en main**, commits `a6a7e1d8` (Settings, incluido AppBundle Windows + Android assets) y `a5fc8d06` (Mozart/Chaikovski sintetizados en Focus). Ambas ramas pasaron sus pruebas dedicadas, Source, UI y compilación/instalación de APK de prueba en Android15; Android14/16 nativo de host sigue con incidentes ADB/QEMU conocidos (#139), sin declarar un gate rojo aprobado.

En el momento de ese corte, la siguiente versión estaba **preparándose, no publicada**, en [PR #227](https://github.com/michels-lab/michel-s-life/pull/227): Windows 3.0.230 / Android Direct 0.2.19/code21, nueve validaciones a commit exacto y empaquetado producción firmado con Android15 AVD. Los hitos #8 y #9 exigen versión estable instalada y aprobación, de modo que el porcentaje **sigue 7/15 = 47%**. Ultima estable real 3.0.229/0.2.18. Sin RC ni Developer Edition.

## Granada 2026-11-20

**Avance estimado 47% → 47% (7/15).** Se abrió el bloque de colores [PR #225](https://github.com/michels-lab/michel-s-life/pull/225): módulo de Settings con contraste, muestras Chapter/Focus/Alarm, botón deshacer, persistencia en clave v30184, pruebas Node y pruebas de navegador desktop/mobile. Se abrió el bloque de música [PR #226](https://github.com/michels-lab/michel-s-life/pull/226): dos temas clásicos basados en fragmentos de dominio público, selección persistente bajo FocusStory, pruebas de síntesis, ocho pistas A/C conservadas, credenciales de música documentadas. **Los dos PRs están abiertos, no equivalen a main ni a release; la CI exact-head sigue en marcha o en cola al registrar el corte.**

**Última estable pública, sin modificación:** Windows 3.0.229 + Android Direct 0.2.18, https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.229-android-v0.2.18, 13 assets, source exact-SHA ac17aefe8b5357f36ae941920774dd652c9f4050. Sin RC ni Developer Edition. Microsoft Store y Google Play no publicados. Issues #168, #139, #171 y QA física se conservan abiertos según su evidencia.

**Próximo cierre Granada:** diagnosticar CI de PR #225/#226 sin ignorar rojos; integrar solo si el HEAD está verificado, entonces preparar release estable unificado con SHA, firma y QA de ambos canales. La aceptación de Galaxy físico y cuentas reales no se sustituye por CI y debe mantenerse pendiente hasta comprobarse.
