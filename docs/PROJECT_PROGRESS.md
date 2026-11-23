# Michel's Life — avance funcional y puertas de aceptación

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
| 14 | Errores JavaScript intermitentes Story/Pomodoro eliminados, no solo pasan reintentos | PENDIENTE | Issue #168, trazabilidad script/línea |
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
