# Operación Granada — auditoría de aplicación e integraciones ChatGPT

**Corte de evidencia:** 2026-10-21 UTC. **Tipo:** auditoría documental de árbol/README y últimos GitHub Actions consultados, NO prueba funcional en hardware, cuenta de cliente, ni validación completa del ejecutable. 

**Regla de costo:** usar primero las herramientas ya instaladas en ChatGPT Plus y los servicios existentes; **no contratar suscripciones extra**, activar facturación, subir de plan, comprar dominio ni desplegar sin autorización. Un plugin de ChatGPT no se incorpora automáticamente al código de la aplicación. “Instalado en ChatGPT” no prueba sesión activa, permisos o servicio operativo. [Bitácora central de ocho conectores instalados](https://github.com/michels-lab/Michel-Software-Standards/blob/main/docs/CHATGPT_PLUGIN_LEDGER.md). No guardar tokens ni datos de usuarios en documentación pública.

## Alcance y frontera
Fuente de Michel's Life (Windows y Android), **no** OpenFOAM, FoamLens, InstaCleaner o LouderMe. Distribución unificada separada: [michel-s-life-releases](https://github.com/michels-lab/michel-s-life-releases). No cambiar el pipeline de distribución por una recomendación de plugin.

## Conectores y servicios: decisiones por proyecto
| Herramienta | Condición comprobada | Aplicación real / cautela | Decisión |
| --- | --- | --- | --- |
| **GitHub (ChatGPT)** | Instalado/habilitado y usado en auditoría | Issues, PR, CI, releases, bitácoras y gate sobre HEAD | USAR; no embebido en la app |
| **Supabase (ChatGPT)** | Instalado/habilitado; este repo posee `supabase/` | Facilitar revisión autorizada del backend/sync ya existente; no inferir uso del conector ni eficacia del sync por la mera instalación | USAR SOLO con alcance y permiso verificado |
| **Google Calendar** | Instalado/habilitado | Apoyo al desarrollo/planificación personal, no promesa de sincronización funcional en Michel's Life | OPCIONAL, no nueva dependencia |
| **Google Drive** | Instalado/habilitado | Posible transferencia manual/documental; el fallback de migración citado en README no es prueba de backup real validado | OPCIONAL, sin datos sensibles |
| **Documents / Spreadsheets** | Instalados/habilitados | Resúmenes de QA y matrices de aceptación externas | OPCIONAL |
| **Gmail / Google Contacts** | Instalados/habilitados | Sin requisito directo para funcionamiento de esta app | NO INTEGRAR por defecto |
| **Vercel y otros hosts** | No instalado, no conexión/despliegue verificados | No necesario para una versión Windows/Android ni para reemplazar Supabase actual | NO CONTRATAR |

## Últimas comprobaciones consultadas
- [Build Android test APK #39666381067](https://github.com/michels-lab/michel-s-life/actions/runs/39666381067): **FAILURE**, head `c8e7fdbe`.
- [UI smoke #39666381058](https://github.com/michels-lab/michel-s-life/actions/runs/39666381058): **FAILURE**, mismo head.
- [Android UI smoke #39666380766](https://github.com/michels-lab/michel-s-life/actions/runs/39666380766): SUCCESS; [Project Story cloud roundtrip #39666380644](https://github.com/michels-lab/michel-s-life/actions/runs/39666380644) y [Source validation #39666380643](https://github.com/michels-lab/michel-s-life/actions/runs/39666380643): SUCCESS en ese head.
- El README sitúa Windows v3.0.221 / Android Direct v0.2.9 como release pública anterior; **publicar un binario no valida sincronización de dos dispositivos**.

## Pendientes concretos
1. Diagnosticar fallos de APK y UI en el head que los produjo, volver a correrlos tras reparación, y no atribuir los éxitos parciales al conjunto.
2. Completar evidencia física de persistencia/sync Android y conflicto/restore con permisos y datos de prueba; no marcar como probado el Galaxy real.
3. Mantener la pausa del trabajo de empaquetado automático Windows que documenta el README, hasta autorización correspondiente.
4. Revisar y eliminar referencias a solver/OpenFOAM fuera de dominio detectadas por la auditoría central, sin tocar archivos científicos ajenos.
5. Mantener gemelo de desarrollador, auditoría y anotaciones por sección según gobernanza; registrar resultados verificables por versión.

**Estado:** AUDITADO DOCUMENTALMENTE / QA INCOMPLETA / SIN RELEASE NI DEPLOY POR ESTA BITÁCORA. Ver [handoff vigente](CURRENT_HANDOFF.md) y [auditoría central de 13 repos](https://github.com/michels-lab/Michel-Software-Standards/blob/main/reports/2026-10-21_GRANADA_13_REPOS_PLUGIN_AUDIT.md).
