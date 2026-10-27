## Reentrada — 2026-10-26 (bloque de integración P0, consultar estado LIVE antes de siguiente ejecución)

- De 12 a **10 PR abiertos** después de fusionar [#158 Drive privacy](https://github.com/michels-lab/michel-s-life/pull/158) (`7efe77889731a35152a108e8afe6aea2e07ba09d`) y [#151 Focus permission truth](https://github.com/michels-lab/michel-s-life/pull/151) (`2e519a042c555e970e9521385a933884e2e0b1ea`). **Ningún issue P0 se cierra:** estos son fixes de fuente con Kotlin/contrato probados, todavía sin Google Drive/Galaxy real.
- [#181](https://github.com/michels-lab/michel-s-life/pull/181) conserva propiedad exclusiva de diagnóstico Android16. Head actual de su instrumentación corregida `56ffa9ab0163b4f437baca0cc1e6e26d1ac87590`; pipeline [40440979296](https://github.com/michels-lab/michel-s-life/actions/runs/40440979296) en progreso al registrar. Nuevo `host-memory-timeline.tsv` numérico, sin secretos, pero **no se ha demostrado arreglo QEMU**. Primera ejecución `3de3b1e...` falló **bash -n** por quoting del sampler; corregido en SHA posterior, se requiere comprobar CI exacto; no omitir el antecedente.
- Leer bitácora [Granada Android 2026-10-26](../android/audit/2026-10-26-granada-convergence-android.md) y [#139](https://github.com/michels-lab/michel-s-life/issues/139). Sin release Android/Windows/Play; no iniciar una 13.ª rama cuando los P0 restantes tienen propietarios. No inventar validación física.

# GRANADA — prioridad de convergencia Android (2026-10-26)

**Esta norma actual sustituye la cuota histórica de 3–6 PR/paquetes más abajo.** En repositorios con congestión, GRANADA primero revisa GitHub real, corrige CI aplicable, integra PR existentes con evidencia exact-head y conserva los problemas bloqueados con reentrada; **NO abre automáticamente nuevas ramas diagnósticas** ni archiva por antigüedad/título. Si hay más de 12 PR abiertos, más de 8 PR de implementación o más de 3 líneas de producto independientes, congelar trabajo nuevo no crítico. Las excepciones P0 requieren demostrar necesidad, propiedad separada y plan de reducción neta de deuda.

**Aplicación actual:** Michel's Life es Android-first; Windows/MSIX sigue pausado. CI de APK instalado, pruebas Galaxy, OAuth real, firma y publicación no se declaran terminadas por autopruebas ni render de navegador. No cerrar #53/#55/#108/#168/#171/#139 hasta cumplir sus criterios propios. No modificar UI/Themes/bases visuales aprobadas por higiene de backlog. Usar el [estándar maestro vigente](https://github.com/michels-lab/Michel-Software-Standards/blob/main/standards/OPERACION_GRANADA_STANDARD.md).

**Último punto de reentrada y reporte de la ejecución:** [auditoría Android 2026-10-26](../android/audit/2026-10-26-granada-convergence-android.md). Antes 14 PR; después 12 tras integrar **#152 y #138 QA-only**. Sus pruebas de fuente pasaron; candidato nativo Android16 continúa BLOCKED por #139, no hay release. Revisar estado LIVE en el siguiente turno.

---

## GRANADA AMBICIOSA — ampliación del propietario (2026-10-20)

**Obligatorio para este repo y sus Developer Twins:** cada invocación GRANADA debe perseguir un macro-bloque de alto impacto y **varios entregables funcionales y comprobables** (normalmente 3–6 paquetes sustanciales relacionados, si son compatibles), en vez de un micro-PR aislado. Cubrir comportamiento completo, errores/recuperación, persistencia, UI y pruebas de integración donde corresponda. Si un elemento está bloqueado/ocupado, apartarlo con issue/PR/SHA y continuar con el siguiente independiente sin invadir sus archivos. Aceptación física, CI, merge y publicación son hitos distintos. Nunca fabricar datos, hacer clics inseguros ni publicar un release implícitamente.

[Contrato vigente en el repositorio maestro](https://github.com/michels-lab/Michel-Software-Standards/blob/main/standards/OPERACION_GRANADA_STANDARD.md). No eliminar otros pendientes ni cambiar las prioridades originales del propietario.

# GRANADA — continuidad sin interferencias

**Regla permanente de Michel's Lab.** Comando del propietario: **GRANADA**.

Si un bloque de desarrollo sigue incompleto, en pruebas, bloqueado por autenticación/hardware/release, o en manos de otra rama, PR o agente: **dejar constancia real** (issue/PR/SHA, áreas ocupadas, pruebas faltantes, responsable y punto de reentrada) y **pasar al siguiente bloque grande que sea independiente**. No rehacer el anterior, no borrar pendientes, no pisar cambios de otro equipo, no simular validaciones ni dejar procesos supuestamente trabajando en segundo plano.

Contrato maestro: [GRANADA Continuous Block Protocol](https://github.com/michels-lab/Michel-Software-Standards/blob/main/standards/GRANADA_CONTINUOUS_BLOCK_PROTOCOL.md).

En **michels-lab/michel-s-life**:
- Contexto: Michel's Life; Windows explicitly paused, Android active.
- Bitácora/fuente local: `GIT_AUDIT_LOG.md`; issues y PRs activos tienen prioridad sobre una descripción antigua.
- Antes de empezar, comprobar HEAD, estado, PRs, claims, riesgos P0, archivos de propiedad y CI. Un trabajo bloqueado NO se considera completo; solo se aparca de manera reversible y documentada.
- Elegir un bloque diferente ya identificado por usuario o backlog existente, con límites de archivos y pruebas claros. Si hay colisión, cambiar de bloque.
- Ejecutar código y pruebas aplicables, registrar commit/resultado exacto, actualizar bitácora y master cuando corresponda; conservar estado y datos históricos.
- **Orden del propietario (2026-10-21): GRANADA SÍ puede publicar el siguiente release DEFINITIVO y ESTABLE de la app objetivo, sin pedir nueva autorización, cuando pasen todos los gates del producto** (CI exacto, integración, instalación/runtime real, pruebas científicas/cuenta cuando aplique, firma, SHA-256, versión, updater y distribución multiplataforma). No RC/beta/prerelease, otro producto, merge sin QA, alteración de credenciales/datos ni acciones inciertas en Instagram.
- En repos de distribución GRANADA solo puede publicar el release final **del producto origen objetivo** después de validar sus gates y la procedencia de todos los assets. En repos de investigación sin software distribuible, GRANADA no debe inventar una app ni un release. Mantener QA/herramientas/manuales como tareas independientes.

**Estados diferentes:** pendiente → implementado → pruebas superadas → integrado → publicado → validado por el usuario. No presentar una fase como otra.

**Punto de reentrada:** cualquier bloque aparcado conserva en el issue/bitácora su último paso seguro, SHA, dependencias y comprobaciones necesarias. Al siguiente comando **granada**, volver a buscar el siguiente bloque disponible que no interfiera.

## Cambio del propietario — 2026-10-20: GRANADA GRANDE

**Este repositorio hereda inmediatamente la escala obligatoria** del estándar maestro [GRANADA_CONTINUOUS_BLOCK_PROTOCOL.md](https://github.com/michels-lab/Michel-Software-Standards/blob/main/standards/GRANADA_CONTINUOUS_BLOCK_PROTOCOL.md#escala-obligatoria-desde-2026-10-20--granada-grande).

- Priorizar **un paquete amplio y funcional**, normalmente 3 entregables sustanciales relacionados (flujo completo, casos límite, persistencia o seguridad, pruebas de regresión y evidencia), no un mini-PR, una prueba suelta o solamente documentación. Un único P0 grande puede bastar; no inventar relleno.
- Revisar issues/PR/HEAD/claims antes de actuar; **la ambición no permite pisar trabajo de otros**, mezclar estados de usuario, arriesgar datos, reactivar plataformas pausadas ni publicar sin autorización (incluida la nueva autorización condicional GRANADA del producto objetivo tras aprobar todos los gates). Sustituir subpartes bloqueadas por otras independientes.
- Cada bloque debe dejar **código/capacidad real y QA ejecutada cuando sea posible**, con estado A/B/C, SHAs, resultados y próximos gates. Un plan o una bitácora **no es un bloque funcional completado**.
- En repositorios de distribución, GRANADA GRANDE se traduce a paquetes de controles de integridad/procedencia/documentación o pruebas no destructivas; solo publicar una versión/release final con GRANADA cuando se trate del producto objetivo, todos los gates pasen y la distribución oficial esté verificada; nunca RC ni publicación autónoma.
- Mantener las bitácoras locales, los límites de cada producto y su punto de reentrada; al siguiente “operación granada”, empezar con el paquete sustancial seguro de mayor impacto.
