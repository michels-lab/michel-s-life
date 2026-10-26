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
