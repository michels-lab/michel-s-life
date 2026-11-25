# GRANADA — 2026-11-25 — Focus audio transport

Base publicada: Windows 3.0.233 / Android Direct 0.2.22. Rama de candidato; no release nuevo.

- Conserva IDs válidos de música personal archivada mientras se carga IndexedDB; no hace visibles entradas no cargadas.
- Navegación manual, cambio de colección y sustitución por archivo conservan pausa sin llamar play en el nuevo medio; reproducción explícita y avance automático conservan su intención.
- Casos de regresión añadidos al contrato existente. CI y prueba física pendientes; no afirmar integración ni publicación.
- Sin cambios a temas, temporizador, grabaciones, persistencia central o permisos nativos.
