# GRANADA — Alarmas clásicas nativas, 24 noviembre 2026

## Causa raíz
Michel's Life ya ofrece temas de Mozart y Chaikovski en Pomodoro, pero la selección de tonos para alarmas únicas, diarias, semanales y rápidas no los incluía. En Android la alarma debe sonar desde el sistema nativo sin depender del WebView ni de que Pomodoro esté abierto.

## Cambio funcional
- Añadidos los identificadores `mozart_k545` y `tchaikovsky_op39` al catálogo de alarmas en español e inglés. No se eliminan los seis tonos anteriores ni la importación MP3/WAV/OGG.
- Dos arreglos de **24 segundos**, con los fragmentos melódicos de dominio público que ya están declarados en Focus, armonía por cuatro frases, eco estéreo y volumen gradual. No son las obras completas ni se reproducen grabaciones protegidas.
- Desktop: síntesis WebAudio existente en `personal-alarms.js`; preescucha mediante el selector normal y reproducción cuando llega la alarma.
- Android: generación autónoma de PCM WAV dentro del directorio privado, reutilizando la entrega nativa de AlarmManager, el overlay y la actividad bloqueada. No necesita obtener ni ejecutar música desde la WebView.
- Persistencia: normalización `SOUNDS` conserva estos IDs en el almacenamiento existente, sin clave ni motor paralelo. No se alteran permisos, posponer, estado de alarma ni canales nativos.
- Nueva comprobación de correspondencia entre IDs, notas y motor WebAudio/PCM en el contrato del repositorio.

## Estado exacto
Código candidato en `granada/classical-native-alarm-soundscapes-20261124`. Última estable publicada sigue Windows **3.0.231** / Android Direct **0.2.20**. Avance integral de aceptación **7/15 = 47 %**; esta implementación no equivale a publicación, CI aprobado o audición física. Revisar CI exact-HEAD y escuchar en Windows/Galaxy real, comprobar alarma en pantalla bloqueada, Doze, volumen, notificación, permiso de alarmas exactas y MP3 personalizado.

No fusionar confundiendo la rama del catálogo Focus #232 con la de Settings/Story #233; su integración y errores de CI se tratan por separado.
