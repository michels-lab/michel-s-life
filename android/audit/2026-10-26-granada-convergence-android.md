## Addendum — corregidas regresiones del propio monitor de #181 (2026-10-26)

- Primera prueba de la nueva telemetría `3de3b1e7fc23204a8527d29ea4c1ca90374861f4`: [CI #40440438800](https://github.com/michels-lab/michel-s-life/actions/runs/40440438800) compiló Android (`android`: SUCCESS), pero la fase pre-emulador cayó en `bash -n` por un fallback de QEMU mal citado. No se ejecutó el dispositivo en ese run.
- Segunda prueba tras corregir fallback `56ffa9ab0163b4f437baca0cc1e6e26d1ac87590`: [CI #40440979296](https://github.com/michels-lab/michel-s-life/actions/runs/40440979296) volvió a compilar, pero `bash -n` detectó que un reemplazo había dejado **bloque terminal duplicado** en el wrapper; tampoco probó la instalación nativa. No etiquetar estos fallos como QEMU.
- El mismo PR #181 corrigió **ambos defectos**; eliminó tail duplicado y agregó guard de unicidad para wrapper/monitor/heredoc y final de archivo, conservando seis regresiones locales. **HEAD actual `1bb286f2f2080c68bf549c65d5a9d3846eec148d`**; [CI candidato #40441373678](https://github.com/michels-lab/michel-s-life/actions/runs/40441373678), source/UI/Android UI se ejecutaban al documentar. Inspección exact-head del contenido confirmó 1 bloque shell, 1 comando de APK nativa, 1 heredoc y 1 trigger EXIT. Falta validación Bash/CI efectiva del head final.
- Se documentan explícitamente los dos errores de instrumentación para no atribuirlos a Google Drive, Focus o al emulador. **Mantener #181 draft y #139 abierto** hasta que exista prueba Android16 instalada con capturas/estado canónico reales; ningún nuevo release.

---

## Continuación Granada — 2026-10-26 (segundo bloque)

**Estado real:** se volvió a consultar GitHub. El repositorio pasó de **12 a 10 PR abiertos** mediante dos integraciones funcionales P0; **no se creó ninguna rama ni PR**. Los 13 issues originales continúan abiertos porque sus criterios completos de cuenta/Android real no están aprobados. No hubo cambio de versión, distribuciones, firmas, Themes, Home, Chapter ni Windows.

### #158 Drive Android: protección nativa de snapshots (merge fuente)

- Merge squash **`7efe77889731a35152a108e8afe6aea2e07ba09d`** desde head exacto `4db7756562cdfd34579ff6cbb1956ab1b201d6ef`; [PR](https://github.com/michels-lab/michel-s-life/pull/158).
- [CI dirigido 39538742457](https://github.com/michels-lab/michel-s-life/actions/runs/39538742457) SUCCESS: regresiones del contrato y allowlist, restauración local segura, y compilación Gradle de `CloudSync.kt` de producción. Source/UI/Android UI también pasaron.
- `CloudSync.kt` rechaza subir metadatos/desconocidos y claves locales de autenticación, filtra claves privadas al restaurar legado y exige crear el respaldo histórico antes de reemplazar remoto. La auditoría del diff no encontró solapamiento con #134/#156/#181.
- **No verificado:** backend Google Drive real con dos cuentas, legado de propietario, Galaxy/Android firmado y protección de extremo a extremo. #55 y #108 **siguen abiertos**. Workflow general de Android16 tenía subjob `android` verde pero humo nativo rojo por transporte QEMU/ADB de #139. Merge **no es release ni aceptación de usuario**.

### #151 Focus: contrato de permisos y disponibilidad (merge fuente)

- Merge squash **`2e519a042c555e970e9521385a933884e2e0b1ea`** desde head `1356abc8a764b6103b4f0060f6cf081998d49c5d`; [PR](https://github.com/michels-lab/michel-s-life/pull/151).
- [Compilación exact-head 39381910489](https://github.com/michels-lab/michel-s-life/actions/runs/39381910489), subjob Android SUCCESS; UI/Android UI/source SUCCESS, humo de emulador candidato FAILED por #139. Kotlin minSdk=26 permite comprobación del canal.
- Reporte `NativeFocusAlarm.status()` deja de afirmar `backgroundDelivery=true` cuando notificaciones están bloqueadas. Reporta permisos del sistema/canal de completación, canal de countdown y naturaleza inexacta; no cambia el planificador ni inventa garantías Doze. El validador #152 ya integrado verifica el contrato con 21 regresiones sintéticas.
- **No verificado:** notificaciones reales en Galaxy, Doze, pantalla bloqueada, canales/OS y finalización de temporizador. #53 sigue abierto. No hay APK nueva.

### #181 Android16 — instrumentación sobre PR existente (NO merge)

- Rama de [PR #181](https://github.com/michels-lab/michel-s-life/pull/181), commit instrumentado `3de3b1e7fc23204a8527d29ea4c1ca90374861f4`: registra en artifact `host-memory-timeline.tsv` cifras numéricas de presencia y RSS QEMU, RAM `MemAvailable`, bytes cgroup cuando disponibles, cada 3 s máximo 480 muestras. Agrega tres regresiones y modifica el mismo workflow para disparar prueba Android nativa ante cambios al diagnosticador.
- No se cambiaron RAM del AVD ni `-gpu swiftshader`, estado/tema/JS de app, scripts de instalación, validación de capturas ni datos del propietario. El watchdog **no es una solución confirmada de QEMU**.
- [Source validation exact-head 40440438798](https://github.com/michels-lab/michel-s-life/actions/runs/40440438798): SUCCESS. Otras [pruebas 40440438800](https://github.com/michels-lab/michel-s-life/actions/runs/40440438800) y UI permanecían pendientes/in-progress al registrar este bloque; NO certificar instalación ni persistencia. Mantener PR #181 DRAFT y issue #139 OPEN hasta evidencia real.
- Comentario de reentrada en [issue #139](https://github.com/michels-lab/michel-s-life/issues/139); revisar próximo artefacto numérico y diferenciar fallo anfitrión de fallo de app. No falsificar píxeles, no false-green por compilación, no random rerun.

**Granada siguiente:** primero terminar #181 y diagnosticar runner sin crear otra rama; después pruebas real-provider A/B de #158 y permisos/dispositivo #151 antes de release. Priorizar wiring real #169/#156 sin pisar sus propietarios, Story #168/#171 sin cambios visuales no solicitados. Mantener Windows pausado.

---

# Michel's Life — Operación Granada: convergencia Android (2026-10-26)

## Estado verificado antes / después

- Objetivo único: `michels-lab/michel-s-life`. Desarrollo de Windows, instaladores/MSIX y Desktop Developer permanecen PAUSADOS.
- Consulta GitHub previa: **13 issues funcionales abiertos (sin contar PR), 14 PR abiertos, todos draft**.
- Tras dos integraciones de instrumentación independiente: **13 issues abiertos y 12 PR abiertos**. **Creados 0 PR/issue nuevos; fusionados 2; archivados/cerrados como obsoletos 0**. Ningún issue funcional fue declarado arreglado.
- P0 todavía en curso: cuentas/sincronización #108, privacidad de snapshots #55, Story/Pomodoro #168/#171, notificaciones de Focus #53. Android16 CI fiable #139 pendiente.

## Integración de PR existentes (código QA, no producto publicado)

### #152 — evidencia nativa de permisos de Focus

- Fuente head exacto `333c1f43dc16f83a4fb94fbd85dd5a3d1a8d8341`.
- Merge squash: `ad912588490c981351772be05e605d8cd7e765b6`.
- [PR #152](https://github.com/michels-lab/michel-s-life/pull/152) y [QA específico #40403405068](https://github.com/michels-lab/michel-s-life/actions/runs/40403405068): 21 fixtures estrictos y contrato privado sin campos adicionales, SUCCESS. Source, UI, Android UI y smoke de APK pública PASS en el mismo head.
- Solamente agrega validador Node, pruebas, workflow dedicado y auditoría. **NO** modifica `NativeFocusAlarm.kt` (lo conserva PR #151), no confirma notificación bloqueada/Doze ni dispositivo Galaxy, ni cierra #53.
- [Workflow candidato Android16 #40403405316](https://github.com/michels-lab/michel-s-life/actions/runs/40403405316) FAIL después de la primera pantalla por desaparición de emulador; su subjob `android` compiló correctamente.

### #138 — persistencia de completaciones/XP

- Fuente head exacto `3dd87614aa3b3e6f3debd52083abbfabd1a1cb72`.
- Merge squash: `9a726a1b6848037a2db0218176b3414b395dd5f2`.
- [PR #138](https://github.com/michels-lab/michel-s-life/pull/138) y [compilación y autoprueba #39335405555](https://github.com/michels-lab/michel-s-life/actions/runs/39335405555): subjob `android` SUCCESS, `native_webview_state_probe.py self-test` dentro de la build, source/UI/Android UI PASS; [instalación de APK publicada #39335405541](https://github.com/michels-lab/michel-s-life/actions/runs/39335405541) SUCCESS.
- Agrega a la sonda de prueba debuggable hashes/cantidad de completaciones y XP, comparados entre dos force-stop; no registra nombres, fechas, tokens ni IDs personales. El probe en un APK firmado no se habilita.
- **La ejecución nativa del APK candidato #39335405555 FALLÓ** igualmente por pérdida QEMU/ADB antes de completar comparación de estado. Esto NO valida en Android físico persistencia real o datos existentes.

## Diagnóstico bloqueado de infraestructura: issue #139

- [#181 run 40014418793](https://github.com/michels-lab/michel-s-life/actions/runs/40014418793) y [#152 run 40403405316](https://github.com/michels-lab/michel-s-life/actions/runs/40403405316): compilación debug Android PASÓ; el emulador `emulator-5554` desapareció tras la primera pantalla, y falló screenshot `step0-after-30s.png`. Múltiples reintentos ADB no obtuvieron píxeles. En #181 se clasificó `qemu_emulator_process_disappeared`; la causa OS/OOM/GPU sigue sin demostrarse.
- [Issue #139](https://github.com/michels-lab/michel-s-life/issues/139) conserva el punto de reentrada. #181 owns host/workflow; #157 owns diagnóstico de transporte; no se crearon ramas/PR duplicados. Una prueba de navegador o un APK compilado NO sustituye aceptación Android instalado.
- Mantener HARD RED y evitar `continue-on-error`, screenshots fabricados o falsos PASS.

## No fusionado / próximo bloque seguro

- **#151, #158**: correcciones Kotlin de Focus y privacidad Drive; su compilación dirigida y/o pruebas sintéticas pasan, pero faltan validaciones nativas/dispositivo/proveedor. No confundir `CloudSync.kt` compilado con backup/restore seguro probado en una cuenta.
- **#169, #156, #134**: protección A/B de cuentas y Data Health necesitan integración de frontend y compatibilidad Developer; se respetan sus archivos/claims; issue P0 #108 y #55 siguen abiertos.
- **#170 y #135** se solapan en `android/mobile-sections.js`; #171 sigue sin una corrección de producción verificada, #168 sigue como issue separado. No fusionar a ciegas.
- **#62** Windows: desarrollar y publicar siguen pausados. No ejecutar build MSIX.
- Siguiente Granada: completar el fallo del runner Android16 bajo PR #181 y, con QA nativa válida, integrar primero seguridad P0 de #158/#151 y el flujo seguro de cuentas. Si el runner permanece bloqueado, trabajar en tests funcionales bajo ramas ya existentes sin nuevos PR instrumentales.

**Control de release:** no hubo cambio de versión, firma, publicación, datos de usuario ni release de app. Las dos integraciones son QA de fuente; no equivalen a una versión oficial aceptada por el propietario.
