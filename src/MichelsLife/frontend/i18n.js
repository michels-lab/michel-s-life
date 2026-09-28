(function(){
'use strict';
if(window.MichelsLifeI18n)return;

const KEY='michelsLife.language.v1';
const PAIRS={
  "Dashboard":"Inicio","Missions":"Misiones","Premium Contracts":"Contratos Premium","Calendar":"Calendario",
  "Statistics":"Estadísticas","Projects":"Proyectos","Achievements":"Logros","Affirmations":"Afirmaciones",
  "Story":"Historia","Settings":"Configuración","Compare":"Comparar","Weekly Review":"Revisión semanal",
  "General":"General","Themes":"Temas","Color Theme":"Tema de color","Typography":"Tipografía",
  "UI Customization":"Personalización de interfaz","Focus & Timers":"Enfoque y temporizadores",
  "Notifications":"Notificaciones","Planning & Next Up":"Planificación y siguientes",
  "Google":"Google","Data & Backup":"Datos y respaldo","Chapter Scenes":"Escenas de capítulos","About":"Acerca de",
  "Profile, time ambience and core behavior.":"Perfil, ambiente horario y comportamiento principal.",
  "Background sets, wallpapers and visual worlds.":"Conjuntos de fondos, fondos de pantalla y mundos visuales.",
  "Color presets, window palette, accents, Gold and text colors.":"Preajustes de color, paleta de ventana, acentos, dorado y colores de texto.",
  "Choose the type style used across the interface.":"Elige la tipografía usada en toda la interfaz.",
  "Glass, transparency, density and interface surfaces.":"Cristal, transparencia, densidad y superficies de la interfaz.",
  "Pomodoro, focus sessions and timer behavior.":"Pomodoro, sesiones de enfoque y comportamiento del temporizador.",
  "Alerts and notification behavior.":"Alertas y comportamiento de las notificaciones.",
  "Day planning, Next Up and mission time-of-day rules.":"Planificación diaria, Siguientes y reglas horarias de misiones.",
  "Cloud-sync all Michel’s Life data and optionally connect Calendar.":"Sincroniza en la nube todos los datos de Michel’s Life y conecta Calendar opcionalmente.",
  "Export, import, recovery and maintenance tools.":"Herramientas de exportación, importación, recuperación y mantenimiento.",
  "Cinematic worlds used only by Current Chapter.":"Mundos cinematográficos usados solo por el Capítulo actual.",
  "Developer, license and build information.":"Información del desarrollador, licencia y versión.",
  "Personal Progress System":"Sistema de progreso personal",
  "Add":"Agregar","All":"Todos","Start":"Iniciar","Open":"Abrir","Clear":"Limpiar","Restore":"Restaurar",
  "Pending":"Pendientes","completed":"completadas",
  "Example: Laundry":"Ejemplo: Lavar ropa",
  "Easy · 25 XP":"Fácil · 25 XP","Medium · 50 XP":"Media · 50 XP","Hard · 75 XP":"Difícil · 75 XP","Boss · 100 XP":"Jefe · 100 XP",
  "Easy":"Fácil","Medium":"Media","Hard":"Difícil","Boss":"Jefe","Complete":"Completar",
  "Image / Presence":"Imagen / presencia",
  "Review followers / following cleanup":"Revisar seguidores / depurar seguidos",
  "Audit IG followers/following or cleanup list.":"Auditar seguidores/seguidos de IG o depurar la lista.",
  "Mission library":"Biblioteca de misiones",
  "No linked missions":"Sin misiones vinculadas",
  "Create mission":"Crear misión",
  "Dismiss today":"Ocultar hoy",
  "Times this mission has been completed this week.":"Veces que esta misión se ha completado esta semana.",
  "Do not show this kind of notification":"No mostrar este tipo de notificación",
  "Open Focus timer":"Abrir temporizador de enfoque",
  "Premium Contracts, linked missions and useful mission alerts.":"Contratos Premium, misiones vinculadas y alertas útiles de misiones.",
  "Grouped contract and mission signals.":"Señales agrupadas de contratos y misiones.",
  "Hide Missions":"Ocultar misiones",
  "Month completed":"Mes completado",
  "Give this day a title…":"Dale un título a este día…",
  "Last month":"Mes pasado",
  "Next best action":"Siguiente mejor acción",
  "Backup / Export":"Respaldo / Exportar",
  "Next balancing move":"Siguiente acción de equilibrio",
  "Create snapshot":"Crear instantánea",
  "Contracts completed":"Contratos completados",
  "Mission health":"Estado de las misiones",
  "Mission Health":"Estado de las misiones",
  "No mission health problems detected.":"No se detectaron problemas en las misiones.",
  "Next Up":"Siguientes",
  "Start a new chapter":"Iniciar un nuevo capítulo",
  "Start date":"Fecha de inicio",
  "Start chapter":"Iniciar capítulo",
  "Finish the degree. Build the next version.":"Termina la maestría. Construye la siguiente versión.",
  "Click to choose a date":"Haz clic para elegir una fecha",
  "Notification intensity":"Intensidad de notificaciones",
  "Data cleanup":"Limpieza de datos",
  "English-only interface and default content":"Idioma de la interfaz y contenido predeterminado",
  "Type RESET to confirm":"Escribe RESET para confirmar",
  "Essential only":"Solo esenciales",
  "Balanced":"Equilibrado",
  "Coach mode":"Modo guía",
  "Start Work":"Iniciar trabajo",
  "Apply":"Aplicar",
  "Auto · Current mission":"Automático · Misión actual",
  "Auto · Current misión":"Automático · Misión actual",
  "Auto-start break":"Iniciar descanso automáticamente",
  "AI Export":"Exportar para IA",
  "Linked tasks":"Tareas vinculadas",
  "On track":"En curso",
  "Important changes made inside the app.":"Cambios importantes realizados dentro de la aplicación.",
  "The five most recent recovery points.":"Los cinco puntos de recuperación más recientes.",
  "Your life, archived as eras instead of a pile of tasks.":"Tu vida, archivada como eras en lugar de una pila de tareas.",
  "Time ambience":"Ambiente horario",
  "Use custom opacity":"Usar opacidad personalizada",
  "Main panel":"Panel principal",
  "Apply timer settings":"Aplicar ajustes del temporizador",
  "Clear Next Up":"Limpiar Siguientes",
  "Open Maintenance":"Abrir mantenimiento",
  "Choose photo":"Elegir foto",
  "Save system settings":"Guardar configuración del sistema",
  "Create snapshot now":"Crear instantánea ahora",
  "Choose newer EXE…":"Elegir un EXE más reciente…",
  "Enabled":"Activado",
  "Disabled":"Desactivado",
  "Main growth direction":"Dirección principal de crecimiento",
  "Weighted build radar":"Radar ponderado de progreso",
  "Unassigned Focus":"Enfoque sin asignar",
  "Ready":"Listo",
  "Recent Focus":"Enfoque reciente",
  "No Focus blocks saved yet":"Aún no hay bloques de enfoque guardados",
  "Focus mission":"Misión de enfoque",
  "Focus misión":"Misión de enfoque",
  "Player":"Jugador",
  "Use":"Usar",
  "available":"disponible",
  "Pick a preset or create your own window palette.":"Elige un ajuste preestablecido o crea tu propia paleta de ventana.",
  "Controls active weekly day chips, Premium Contracts and premium badges.":"Controla los botones de días semanales activos, los Contratos Premium y las insignias Premium.",
  "Tall condensed sans-serif with a sharper, poster-like rhythm.":"Tipografía de palo seco, alta y condensada, con un ritmo más marcado similar al de un cartel.",
  "Editorial Caslon-style serif with stronger contrast and bookish weight.":"Tipografía editorial con serifas al estilo Caslon, de mayor contraste y con una presencia más propia de libro.",
  "Tall condensed italic display direction adapted for interface readability.":"Estilo de exhibición alto, condensado e inclinado, adaptado para mantener la legibilidad de la interfaz.",
  "Narrow cinematic sans-serif using the era’s condensed visual language.":"Tipografía estrecha de palo seco con aire cinematográfico, basada en el lenguaje visual condensado de la era.",
  "Geometric display direction with a cleaner, lighter interface treatment.":"Estilo geométrico de exhibición con un tratamiento de interfaz más limpio y ligero.",
  "Elegant vintage serif with a restrained mid-century feel.":"Tipografía elegante con serifas, de aire clásico y carácter sobrio de mediados de siglo.",
  "Classic Garamond-style book serif with warm, traditional proportions.":"Tipografía clásica con serifas al estilo Garamond, pensada para lectura y con proporciones cálidas y tradicionales.",
  "High-contrast modern serif with heavier vertical emphasis.":"Tipografía moderna con serifas, de alto contraste y mayor énfasis vertical.",
  "handwriting, script and blackletter-only eras are not used as full-interface presets. Display-heavy eras use a readable adaptation while keeping their own distinct visual direction.":"Las eras basadas únicamente en escritura manuscrita, caligráfica o gótica no se usan como ajustes preestablecidos para toda la interfaz. Las eras con tipografías muy decorativas usan una adaptación legible sin perder su identidad visual.",
  "Real frame-by-frame motion for clouds, rain, leaves, petals, Halloween, snow and lights.":"Movimiento real fotograma a fotograma para nubes, lluvia, hojas, pétalos, Halloween, nieve y luces.",
  "Every surface uses a true 0–100% range. The preview shows exactly which layer each slider controls.":"Cada superficie usa un rango real de 0 a 100 %. La vista previa muestra exactamente qué capa controla cada deslizador.",
  "Main left navigation shell.":"Panel principal de navegación lateral izquierda.",
  "Changes while you drag":"Cambia mientras arrastras",
  "Your own rhythm":"Tu propio ritmo",
  "CURRENT PHASE":"FASE ACTUAL",
  "STATUS":"ESTADO",
  "Next Up queue":"Cola de Siguientes",
  "Planning, projects & focus":"Planificación, proyectos y enfoque",
  "Optionally use your own photo for any time-of-day stage, instead of the default sky. This is an extra option on top of the default — leave a stage empty to keep the default look for it.":"Puedes usar tu propia foto en cualquier etapa del día en lugar del cielo predeterminado. Es una opción adicional: deja una etapa vacía para conservar su apariencia predeterminada.",
  "Backup & restore":"Respaldo y restauración",
  "The five newest states are retained.":"Se conservan los cinco estados más recientes.",
  "Proprietary · Personal use":"Propietario · Uso personal",
  "Free for personal use. Unauthorized copying, modification, redistribution, rebranding, resale, sublicensing, or claiming this software as your own is not permitted without prior written permission.":"Gratis para uso personal. No se permite copiar, modificar, redistribuir, cambiar la marca, revender, sublicenciar ni presentar este software como propio sin autorización previa por escrito.",
  "Updates preserve the same data profile and create a restore point before replacing the app.":"Las actualizaciones conservan el mismo perfil de datos y crean un punto de restauración antes de reemplazar la aplicación.",
  "Current Mission":"Misión actual","Start mission":"Iniciar misión","Start as Current Mission":"Iniciar como misión actual",
  "Delete mission":"Eliminar misión","Edit":"Editar","Add today":"Agregar hoy","Tomorrow":"Mañana",
  "Not today":"Hoy no","Duplicate":"Duplicar","Archive":"Archivar","Completed":"Completada",
  "Save":"Guardar","Cancel":"Cancelar","Delete":"Eliminar","Close":"Cerrar","Reset":"Restablecer",
  "Save settings":"Guardar configuración","Save configuration":"Guardar configuración",
  "Language":"Idioma","Interface language":"Idioma de la interfaz","English":"Inglés","Spanish":"Español",
  "Use the language selected during installation the first time Michel’s Life opens. You can change it here anytime.":"Usa el idioma elegido durante la instalación la primera vez que abre Michel’s Life. Puedes cambiarlo aquí cuando quieras.",
  "Today":"Hoy","Yesterday":"Ayer","Tomorrow":"Mañana","Week":"Semana","Month":"Mes","Year":"Año",
  "Coins":"Monedas","Streak":"Racha","Level":"Nivel","New mission":"Nueva misión","Shop":"Tienda",
  "Export AI":"Exportar IA","Export":"Exportar","Import":"Importar","Backup":"Respaldo",
  "Quick Capture":"Captura rápida","Capture":"Captura","Mission":"Misión","Project":"Proyecto","Decision":"Decisión",
  "Save decision":"Guardar decisión","Add decision":"Agregar decisión","Reason":"Razón",
  "Existing project":"Proyecto existente","No project":"Sin proyecto","New project name":"Nombre del nuevo proyecto",
  "Save project link":"Guardar vínculo de proyecto","Plan today":"Planear hoy","Plan tomorrow":"Planear mañana",
  "Main":"Principal","Important":"Importante","Optional":"Opcional","Not in plan":"Fuera del plan",
  "Background Themes":"Temas de fondo","Background themes":"Temas de fondo",
  "Current Chapter":"Capítulo actual","Appearance":"Apariencia","Focus":"Enfoque","Timers":"Temporizadores",
  "Automatic":"Automático","Manual":"Manual","Soft":"Suave","Direct":"Directa","Intense":"Intensa",
  "Character name":"Nombre del personaje","Visual stage":"Etapa visual","Messages":"Mensajes",
  "Settings saved":"Configuración guardada","Project saved":"Proyecto guardado","Project linked":"Proyecto vinculado",
  "Project unlinked":"Proyecto desvinculado","No pending items":"Sin pendientes",
  "Journal":"Diario",
  "Yesterday":"Ayer",
  "Quick actions":"Acciones rápidas",
  "Quick mission":"Misión rápida",
  "Add a quick mission":"Agregar una misión rápida",
  "Add a quick mission for today…":"Agregar una misión rápida para hoy…",
  "Create quick task":"Crear tarea rápida",
  "+ Quick task":"+ Tarea rápida",
  "Recurring Missions":"Misiones recurrentes",
  "Due today":"Vence hoy",
  "Pending today":"Pendientes de hoy",
  "Done today":"Hecho hoy",
  "Done this week":"Hecho esta semana",
  "This week":"Esta semana",
  "Last week":"Semana pasada",
  "This month":"Este mes",
  "Current week":"Semana actual",
  "Already completed":"Ya completada",
  "Already marked today":"Ya marcada hoy",
  "Nothing completed yet.":"Aún no hay nada completado.",
  "Nothing pending.":"No hay pendientes.",
  "No missed missions.":"No hay misiones omitidas.",
  "No one-off tasks scheduled for this date.":"No hay tareas únicas programadas para esta fecha.",
  "No recurring missions land on this date.":"No hay misiones recurrentes para esta fecha.",
  "Nothing hidden for today.":"No hay nada oculto para hoy.",
  "Nothing was marked Not today.":"No se marcó nada como Hoy no.",
  "Nothing was carried forward from this day.":"No se arrastró nada desde este día.",
  "No completed missions recorded.":"No hay misiones completadas registradas.",
  "No completed missions are recorded in this period yet.":"Todavía no hay misiones completadas registradas en este periodo.",
  "Visible missions marked done.":"Misiones visibles marcadas como completadas.",
  "Another active mission has the same title.":"Otra misión activa tiene el mismo título.",
  "Write a mission name.":"Escribe el nombre de la misión.",
  "Write a weekly mission name.":"Escribe el nombre de la misión semanal.",
  "Weekly mission added":"Misión semanal agregada",
  "Weekly planned mission":"Misión semanal planeada",
  "Weekly planned mission.":"Misión semanal planeada.",
  "Archive this weekly template?":"¿Archivar esta plantilla semanal?",
  "Archived but still referenced by Next Up or Premium Contracts.":"Archivada, pero todavía vinculada a Siguientes o Contratos Premium.",
  "Mission archived from health review":"Misión archivada desde la revisión de salud",
  "Mission health warning muted":"Advertencia de salud de misión silenciada",
  "Mission completed":"Misión completada",
  "Mission completed:":"Misión completada:",
  "Mission completed for":"Misión completada para",
  "Mission created":"Misión creada",
  "Mission created:":"Misión creada:",
  "Mission edited:":"Misión editada:",
  "Mission updated":"Misión actualizada",
  "Moved to today":"Movida a hoy",
  "Added to today":"Agregada a hoy",
  "Added to Next Up":"Agregada a Siguientes",
  "Add to Next Up":"Agregar a Siguientes",
  "Remove from Next Up":"Quitar de Siguientes",
  "Expand Next Up":"Expandir Siguientes",
  "Minimize Next Up":"Minimizar Siguientes",
  "Add mission to Next Up":"Agregar misión a Siguientes",
  "Add linked task to Next Up":"Agregar tarea vinculada a Siguientes",
  "No linked tasks":"Sin tareas vinculadas",
  "Current mission completed":"Misión actual completada",
  "Current Mission reset":"Misión actual restablecida",
  "Current mission timer reset":"Temporizador de misión actual reiniciado",
  "Drag to reorder":"Arrastra para reordenar",
  "All day":"Todo el día",
  "Scheduled for":"Programada para",
  "Edit schedule, category, status and difficulty. XP is automatic from difficulty.":"Edita horario, categoría, estado y dificultad. El XP se asigna automáticamente según la dificultad.",
  "XP is assigned automatically from mission difficulty. Change the difficulty to change the reward.":"El XP se asigna automáticamente según la dificultad de la misión. Cambia la dificultad para cambiar la recompensa.",
  "Times this mission has been completed this week.":"Veces que esta misión se ha completado esta semana.",
  "Goal converted into mission":"Meta convertida en misión",
  "Goal converted into linked mission:":"Meta convertida en misión vinculada:",
  "New goal mission":"Nueva misión de meta",
  "Daily priority":"Prioridad diaria",
  "Daily priority disabled":"Prioridad diaria desactivada",
  "Choose Main, Important and Optional missions":"Elige misiones principales, importantes y opcionales",
  "Choose priorities for tomorrow.":"Elige las prioridades para mañana.",
  "Change project":"Cambiar proyecto",
  "Change or remove the linked project":"Cambiar o quitar el proyecto vinculado",
  "Add contract":"Agregar contrato",
  "Write the contract name first.":"Escribe primero el nombre del contrato.",
  "This contract has no active missions linked to it.":"Este contrato no tiene misiones activas vinculadas.",
  "Contract completed":"Contrato completado",
  "Contract links already current":"Los vínculos del contrato ya están actualizados",
  "Contract name, linked task, category...":"Nombre del contrato, tarea vinculada, categoría...",
  "Impossible this week":"Imposible esta semana",
  "left this week.":"restantes esta semana.",
  "Complete mission":"Completar misión",
  "Complete one useful mission and leave evidence.":"Completa una misión útil y deja evidencia.",
  "Choose the mission that changes the score.":"Elige la misión que cambia el marcador.",
  "Choose the next mission so you do not lose the thread.":"Elige la siguiente misión para no perder el hilo.",
  "Choose one important thing and make it lighter by starting.":"Elige algo importante y hazlo más ligero empezando.",
  "Choose one useful action and let the day open.":"Elige una acción útil y deja que el día se abra.",
  "Do the important mission before the day starts negotiating.":"Haz la misión importante antes de que el día empiece a negociar contigo.",
  "Do the useful thing before the day starts negotiating.":"Haz lo útil antes de que el día empiece a negociar contigo.",
  "Do the thing that makes tomorrow easier.":"Haz lo que hará mañana más fácil.",
  "Do not call the day lost while there is still leverage.":"No des el día por perdido mientras todavía haya margen.",
  "Do not let the day become noise. Execute now.":"No dejes que el día se vuelva ruido. Ejecuta ahora.",
  "Do not let noon become noise.":"No dejes que el mediodía se convierta en ruido.",
  "Close clean. Reduce tomorrow’s noise.":"Cierra limpio. Reduce el ruido de mañana.",
  "Close strong. Earn the feeling before you rest.":"Cierra fuerte. Gánate la sensación antes de descansar.",
  "Close the day with evidence, not pressure.":"Cierra el día con evidencia, no con presión.",
  "Close the day with one small clean action.":"Cierra el día con una acción pequeña y limpia.",
  "Close with intention, not chaos.":"Cierra con intención, no con caos.",
  "Protect tomorrow with one final reset.":"Protege mañana con un último reinicio.",
  "Low stimulation. Small useful action.":"Baja estimulación. Una acción pequeña y útil.",
  "Less noise. More proof.":"Menos ruido. Más evidencia.",
  "One useful action is enough to shift the day.":"Una acción útil basta para mover el día.",
  "One focused action is enough to change the reading of today.":"Una acción enfocada basta para cambiar cómo se lee el día.",
  "Second window. One strong action still changes the day.":"Segunda ventana. Una acción fuerte todavía cambia el día.",
  "Recover progress before the day drifts.":"Recupera progreso antes de que el día se desvíe.",
  "Win the morning with one real action.":"Gana la mañana con una acción real.",
  "Pick the highest-XP mission and create momentum.":"Elige la misión con más XP y crea impulso.",
  "Build early advantage while everything is quiet.":"Construye ventaja temprano mientras todo está en calma.",
  "Start before the day gets loud.":"Empieza antes de que el día se vuelva ruidoso.",
  "One clean action now gives the whole day leverage.":"Una acción clara ahora le da ventaja a todo el día.",
  "End the day with proof, not mental clutter.":"Termina el día con evidencia, no con ruido mental.",
  "Attack early. Build proof before the world wakes up.":"Ataca temprano. Construye evidencia antes de que el mundo despierte.",
  "A small reset prevents a larger mess.":"Un pequeño reinicio evita un desorden mayor.",
  "Discipline also means knowing when to shut down.":"La disciplina también significa saber cuándo parar.",
  "Discipline now protects tomorrow. Do the final reset.":"La disciplina ahora protege mañana. Haz el reinicio final.",
  "second window of the day":"segunda ventana del día",
  "clean close, no chaos":"cierre limpio, sin caos",
  "execute with calm focus":"ejecuta con enfoque tranquilo",
  "build early advantage":"construye ventaja temprano",
  "I treat myself like someone worth the effort.":"Me trato como alguien que vale el esfuerzo.",
  "Evidence matters more than intention.":"La evidencia importa más que la intención.",
  "I can start small and still move forward.":"Puedo empezar pequeño y aun así avanzar.",
  "My professional future improves through concrete actions.":"Mi futuro profesional mejora mediante acciones concretas.",
  "Focused work compounds.":"El trabajo enfocado se acumula y rinde.",
  "My body responds to consistency.":"Mi cuerpo responde a la constancia.",
  "I can reduce noise and choose the next useful action.":"Puedo reducir el ruido y elegir la siguiente acción útil.",
  "I can protect my attention and my boundaries.":"Puedo proteger mi atención y mis límites.",
  "I execute before I negotiate with myself.":"Ejecuto antes de negociar conmigo mismo.",
  "My discipline is visible in the way I move today.":"Mi disciplina se ve en la forma en que actúo hoy.",
  "I do not wait to feel ready; I create proof through action.":"No espero a sentirme listo; creo evidencia mediante la acción.",
  "I am building the body, career, and life that match my standards.":"Estoy construyendo el cuerpo, la carrera y la vida que están a la altura de mis estándares.",
  "Every completed mission makes my identity more real.":"Cada misión completada vuelve más real mi identidad.",
  "I keep my attention where my future gets stronger.":"Mantengo mi atención donde mi futuro se fortalece.",
  "I am not here to perform potential. I am here to produce evidence.":"No estoy aquí para aparentar potencial. Estoy aquí para producir evidencia.",
  "My life responds when I act with structure.":"Mi vida responde cuando actúo con estructura.",
  "I become impossible to ignore because I keep showing up.":"Me vuelvo imposible de ignorar porque sigo apareciendo y cumpliendo.",
  "Today I choose execution over fantasy.":"Hoy elijo ejecución sobre fantasía.",
  "Confidence grows from keeping promises to myself.":"Mi confianza crece cuando cumplo las promesas que me hago.",
  "Curiosity is part of my discipline.":"La curiosidad forma parte de mi disciplina.",
  "Consistency is shaping the body I want.":"La constancia está moldeando el cuerpo que quiero.",
  "Build self-respect through action.":"Construye respeto propio mediante la acción.",
  "Command":"Comando",
  "Affirmation":"Afirmación",
  "New phrase":"Nueva frase",
  "Open affirmations":"Abrir afirmaciones",
  "Hello":"Hola",
  "One useful action is enough.":"Una acción útil es suficiente.",
  "complete the next visible action.":"completa la siguiente acción visible.",
  "missions today":"misiones hoy",
  "Active today":"Activas hoy",
  "One-Week Streak":"Racha de una semana",
  "Two-Week Streak":"Racha de dos semanas",
  "ACHIEVEMENT UNLOCKED":"LOGRO DESBLOQUEADO",
  "Complete 100 missions total.":"Completar 100 misiones en total.",
  "Complete 50 missions total.":"Completar 50 misiones en total.",
  "Complete 30 physical health missions.":"Completar 30 misiones de salud física.",
  "Complete 10 physical health missions.":"Completar 10 misiones de salud física.",
  "Complete 30 education/thesis missions.":"Completar 30 misiones de educación/tesis.",
  "Complete 10 education/thesis missions.":"Completar 10 misiones de educación/tesis.",
  "Complete 10 career missions.":"Completar 10 misiones de carrera.",
  "Complete 10 image/presence missions.":"Completar 10 misiones de imagen/presencia.",
  "Complete 15 order/execution missions.":"Completar 15 misiones de orden/ejecución.",
  "Complete 7 emotional autonomy missions.":"Completar 7 misiones de autonomía emocional.",
  "Complete the weekly education challenge 10 times.":"Completar 10 veces el reto semanal de educación.",
  "active days in a row":"días activos seguidos",
  "Connect Google":"Conectar Google",
  "Reconnect Google":"Reconectar Google",
  "Disconnect":"Desconectar",
  "Disconnect Google?":"¿Desconectar Google?",
  "Connect Google first.":"Conecta Google primero.",
  "Waiting for Google sign-in…":"Esperando el inicio de sesión de Google…",
  "Google connected successfully.":"Google conectado correctamente.",
  "Google disconnected.":"Google desconectado.",
  "Google Calendar synced":"Google Calendar sincronizado",
  "Google Calendar request failed.":"Falló la solicitud de Google Calendar.",
  "Google Calendar request timed out.":"La solicitud de Google Calendar agotó el tiempo.",
  "Ready to connect":"Listo para conectar",
  "Needs reconnect":"Necesita reconexión",
  "Needs attention":"Necesita atención",
  "Connecting…":"Conectando…",
  "Connecting to Google…":"Conectando con Google…",
  "Finish sign-in in your browser. This panel will update automatically.":"Termina el inicio de sesión en tu navegador. Este panel se actualizará automáticamente.",
  "Google account":"Cuenta de Google",
  "Cloud Sync":"Sincronización en la nube",
  "Sign-in":"Inicio de sesión",
  "Linked":"Vinculado",
  "Sync your complete Michel’s Life between PCs with Google Drive. Calendar remains optional.":"Sincroniza Michel’s Life completo entre PCs con Google Drive. Calendar sigue siendo opcional.",
  "Michel’s Life Cloud Sync":"Sincronización en la nube de Michel’s Life",
  "Journal, daily tasks, missions, Premium Contracts, stats, chapters, settings, history, progress and the complete restorable local state.":"Diario, tareas diarias, misiones, Contratos Premium, estadísticas, capítulos, configuración, historial, progreso y todo el estado local restaurable.",
  "Syncing…":"Sincronizando…",
  "Last cloud sync":"Última sincronización en la nube",
  "Storage":"Almacenamiento",
  "Private Google Drive app data":"Datos privados de la aplicación en Google Drive",
  "Sync Michel’s Life now":"Sincronizar Michel’s Life ahora",
  "Keep this PC → Cloud":"Conservar esta PC → Nube",
  "Use Cloud → This PC":"Usar nube → Esta PC",
  "Keep all Michel’s Life data synced automatically":"Mantener todos los datos de Michel’s Life sincronizados automáticamente",
  "Uploads about 30 seconds after you stop making changes, checks Drive every 10 minutes, and checks again after returning to the app.":"Sube los cambios unos 30 segundos después de que dejas de editar, revisa Drive cada 10 minutos y vuelve a comprobarlos al regresar a la aplicación.",
  "Cloud conflict":"Conflicto en la nube",
  "Both copies changed.":"Ambas copias cambiaron.",
  "Keep this PC":"Conservar esta PC",
  "Use cloud":"Usar nube",
  "Show Google Calendar events inside Michel’s Life":"Mostrar eventos de Google Calendar dentro de Michel’s Life",
  "Optional. Google events stay separate from missions and do not earn XP.":"Opcional. Los eventos de Google permanecen separados de las misiones y no generan XP.",
  "Send dated Michel’s Life missions to Google Calendar":"Enviar a Google Calendar las misiones de Michel’s Life con fecha",
  "Optional. Only missions with a concrete date are sent and tagged to avoid duplicates.":"Opcional. Solo se envían las misiones con una fecha concreta y se etiquetan para evitar duplicados.",
  "Auto-sync Calendar every 15 minutes":"Sincronizar Calendar automáticamente cada 15 minutos",
  "Only affects Google Calendar events. Your Michel’s Life data uses Cloud Sync above.":"Solo afecta los eventos de Google Calendar. Los datos de Michel’s Life usan la sincronización en la nube de arriba.",
  "Sync Calendar now":"Sincronizar Calendar ahora",
  "Open Google Calendar":"Abrir Google Calendar",
  "Google sign-in:":"Inicio de sesión de Google:",
  "Overwrite the cloud copy?":"¿Sobrescribir la copia de la nube?",
  "Replace this PC with the cloud copy?":"¿Reemplazar esta PC con la copia de la nube?",
  "This PC will become the master copy and replace the Michel’s Life save in Google Drive.":"Esta PC se convertirá en la copia principal y reemplazará el guardado de Michel’s Life en Google Drive.",
  "A local safety backup will be created first, then Google Drive will replace this PC’s Michel’s Life data.":"Primero se creará un respaldo local de seguridad y después Google Drive reemplazará los datos de Michel’s Life de esta PC.",
  "Your cloud save and Google Calendar events will not be deleted.":"Tu guardado en la nube y los eventos de Google Calendar no se eliminarán.",
  "Both this PC and Google Drive changed. Choose which copy to keep in Settings → Google.":"Tanto esta PC como Google Drive cambiaron. Elige qué copia conservar en Configuración → Google.",
  "Reconnect Google once to grant Google Drive Cloud Sync permission.":"Vuelve a conectar Google una vez para otorgar permiso de sincronización con Google Drive.",
  "Google Drive returned no Michel’s Life cloud data.":"Google Drive no devolvió datos de Michel’s Life en la nube.",
  "Cloud save is not restorable.":"El guardado en la nube no se puede restaurar.",
  "Cloud save created":"Guardado en la nube creado",
  "Uploaded":"Subido",
  "Restored from cloud":"Restaurado desde la nube",
  "Up to date":"Actualizado",
  "Conflict":"Conflicto",
  "Your cloud data is loaded on this PC.":"Tus datos de la nube están cargados en esta PC.",
  "Cloud error":"Error de nube",
  "Cloud request failed.":"Falló la solicitud a la nube.",
  "Cloud restore failed":"Falló la restauración desde la nube",
  "Cloud updated":"Nube actualizada",
  "Cloud update after restore":"Actualización de nube después de restaurar",
  "Cloud history restore requested":"Restauración desde historial de nube solicitada",
  "Backup Timeline":"Cronología de respaldos",
  "Backup Timeline request failed.":"Falló la solicitud de cronología de respaldos.",
  "A historical Drive backup was selected.":"Se seleccionó un respaldo histórico de Drive.",
  "Data restored successfully.":"Datos restaurados correctamente.",
  "Restore failed":"Falló la restauración",
  "Request failed.":"Falló la solicitud.",
  "Could not capture current state.":"No se pudo capturar el estado actual.",
  "Could not import this JSON backup. Make sure it is a Michel’s Life backup file.":"No se pudo importar este respaldo JSON. Verifica que sea un archivo de respaldo de Michel’s Life.",
  "Check for updates":"Buscar actualizaciones",
  "Update failed":"Falló la actualización",
  "This action requires the Windows app.":"Esta acción requiere la aplicación de Windows.",
  "Could not create the required pre-update restore point. Update cancelled.":"No se pudo crear el punto de restauración previo a la actualización. Actualización cancelada.",
  "Install a newer Michel’s Life build? A restore point will be created before the current EXE is replaced.":"¿Instalar una versión más reciente de Michel’s Life? Se creará un punto de restauración antes de reemplazar el EXE actual.",
  "App reset":"Aplicación restablecida",
  "Type RESET first.":"Escribe RESET primero.",
  "A short first-run setup. Your data stays local unless you choose Cloud Sync.":"Una configuración inicial breve. Tus datos permanecen locales a menos que elijas sincronización en la nube.",
  "Choose how much starter structure you want. You can change all of it later.":"Elige cuánta estructura inicial quieres. Puedes cambiarla toda después.",
  "Start with an empty board? You can create missions and contracts later.":"¿Empezar con un tablero vacío? Puedes crear misiones y contratos después.",
  "Starter mission created during onboarding.":"Misión inicial creada durante la configuración.",
  "Your Michel’s Life board is ready.":"Tu tablero de Michel’s Life está listo.",
  "Build your starting system":"Construye tu sistema inicial",
  "Untitled Chapter":"Capítulo sin título",
  "Chapter name":"Nombre del capítulo",
  "Chapter began":"Capítulo iniciado",
  "Chapter started:":"Capítulo iniciado:",
  "Chapter closed:":"Capítulo cerrado:",
  "Close Chapter":"Cerrar capítulo",
  "An era in progress.":"Una era en progreso.",
  "Current Chapter shade and top summary surfaces.":"Sombreado del Capítulo actual y superficies superiores de resumen.",
  "Train 5 days this week":"Entrenar 5 días esta semana",
  "Legs/glutes twice per week":"Pierna/glúteo dos veces por semana",
  "Read one paper for 30 minutes":"Leer un artículo durante 30 minutos",
  "Apply to one job opening":"Postularme a una vacante",
  "No impulsive messages today":"Sin mensajes impulsivos hoy",
  "Reset room/desk":"Ordenar habitación/escritorio",
  "Check money and expenses once this week.":"Revisar dinero y gastos una vez esta semana.",
  "Buy or plan essentials once this week.":"Comprar o planear básicos una vez esta semana.",
  "Wash/fold clothes once this week.":"Lavar/doblar ropa una vez esta semana.",
  "Reset room and desk once this week.":"Ordenar habitación y escritorio una vez esta semana.",
  "Technical reading for research progress.":"Lectura técnica para avanzar en investigación.",
  "Minimum work block to finish your master’s.":"Bloque mínimo de trabajo para terminar tu maestría.",
  "Physical priority: strength, volume and presence.":"Prioridad física: fuerza, volumen y presencia.",
  "Move your career with a concrete action.":"Mueve tu carrera con una acción concreta.",
  "Keep money under control.":"Mantén el dinero bajo control.",
  "Keep culture/language active.":"Mantén activa la cultura/el idioma.",
  "Do not act from anxiety or seek validation.":"No actúes desde la ansiedad ni busques validación.",
  "All alert types are enabled again.":"Todos los tipos de alerta están activados otra vez.",
  "Execution and recovery settings updated.":"Configuración de ejecución y recuperación actualizada.",
  "Show the other Dashboard panel before hiding this one.":"Muestra el otro panel de Inicio antes de ocultar este.",
  "Background reset":"Fondo restablecido",
  "Progreso inicial":"Progreso inicial",
  "Build radar":"Radar de progreso",
  "Progreso equilibrado":"Progreso equilibrado",
  "Optional notes":"Notas opcionales",
  "Unmark completed":"Desmarcar completada",
  "First Contract":"Primer contrato",
  "You have":"Tienes",
  "Move them to today without duplicating existing tasks.":"Muévelas a hoy sin duplicar tareas existentes.",
  "Choose which ones":"Elegir cuáles",
  "Today’s missions":"Misiones de hoy",
  "Today +":"Hoy +",
  "This contract already has progress today.":"Este contrato ya tiene progreso hoy.",
  "Convert into mission":"Convertir en misión",
  "New mission":"Nueva misión",
  "No missions":"Sin misiones",
  "Visual theme":"Tema visual",
  "Save colors":"Guardar colores",
  "Restore base":"Restaurar base",
  "Next #":"Siguiente #",
  "Set next":"Siguiente",
  "Link project":"Vincular",
  "Premium weekly fitness contract.":"Contrato premium semanal de fitness.",
  "Log gym weights 3 times this week":"Registrar cargas del gimnasio 3 veces esta semana",
  "Paper, chapter, class notes or literature review.":"Artículo, capítulo, apuntes de clase o revisión bibliográfica.",
  "Apply to one target job":"Postularme a una vacante objetivo",
  "Apply to a serious job opportunity.":"Postularme a una oportunidad laboral seria.",
  "Journal / emotional check-in":"Diario / revisión emocional",
  "Short journal, plan or emotional reset.":"Diario breve, planificación o reinicio emocional.",
  "Reset physical environment.":"Reordenar el entorno físico.",
  "Plan tomorrow":"Planear mañana",
  "Journal / plan the day":"Diario / planear el día",
  "Sleep with intention / prepare tomorrow":"Dormir con intención / preparar mañana",
  "Make the bed":"Tender la cama",
  "Last hour":"Última hora",
  "Last 3 hours":"Últimas 3 horas",
  "Last 24 h":"Últimas 24 h",
  "Last 14 days":"Últimos 14 días",
  "Most recurrent missions":"Misiones más recurrentes",
  "Most missed missions":"Misiones más olvidadas",
  "The larger the shape, the more balanced and advanced your build is.":"Cuanto más grande sea la figura, más equilibrado y avanzado estará tu progreso.",
  "Favorite, hideable and editable.":"Favoritas, ocultables y editables.",
  "Add affirmation":"Agregar afirmación",
  "Mission unmarked":"Misión desmarcada",
  "Start gently. One clean action is enough to open the day.":"Empieza con calma. Una acción clara basta para abrir el día.",
  "You can still rescue the day with one focused action.":"Todavía puedes rescatar el día con una acción enfocada.",
  "Keep it simple: one mission, then the next.":"Mantenlo simple: una misión y luego la siguiente.",
  "Do a small reset and protect tomorrow.":"Haz un pequeño reinicio y protege mañana.",
  "Take advantage before the day gets loud.":"Aprovecha antes de que el día se vuelva ruidoso.",
  "Pick the highest-impact pending mission and execute.":"Elige la misión pendiente de mayor impacto y ejecútala.",
  "Finish one thing. Do not leave the day undefined.":"Termina una cosa. No dejes el día indefinido.",
  "Reset, close loops, and stop leaking energy.":"Reinicia, cierra pendientes y deja de perder energía.",
  "Execute the next mission.":"Ejecuta la siguiente misión.",
  "No decoration. Pick the hardest useful mission and move.":"Sin adornos. Elige la misión útil más difícil y avanza.",
  "No more drifting. Choose the mission that changes the score.":"No sigas a la deriva. Elige la misión que cambia el marcador.",
  "Full backup exported from Settings":"Respaldo completo exportado desde Configuración",
  "Export backup":"Exportar respaldo",
  "Import backup":"Importar respaldo",
  "Reset app":"Restablecer aplicación",
  "📅 Weekly planned":"📅 Planeación semanal",
  "Execute the next visible action.":"Ejecuta la siguiente acción visible.",
  "Stage and messages applied.":"Etapa y mensajes aplicados.",
  "Pause, choose one thing, and recover momentum.":"Pausa, elige una cosa y recupera impulso.",
  "There is still room for one meaningful action.":"Todavía hay espacio para una acción significativa.",
  "Keep it low stimulation. One small reset is enough.":"Mantén baja la estimulación. Un pequeño reinicio basta.",
  "Do certifications for 1 hour":"Hacer certificaciones durante 1 hora",
  "One focused hour for certifications, courses, or professional credentials. Monday to Friday.":"Una hora enfocada en certificaciones, cursos o credenciales profesionales. De lunes a viernes.",
  "Work on thesis for 2 hours":"Trabajar en tesis durante 2 horas",
  "Two deep-work hours for thesis progress. Monday to Friday. This is a serious academic block.":"Dos horas de trabajo profundo para avanzar la tesis. De lunes a viernes. Es un bloque académico serio.",
  "New actions added":"Nuevas acciones agregadas",
  "Certifications and thesis blocks were added Monday to Friday.":"Se agregaron bloques de certificaciones y tesis de lunes a viernes.",
  "Today only · very reactive":"Solo hoy · muy sensible a cambios",
  "Current week due so far · default":"Semana actual hasta hoy · predeterminado",
  "Last 30 days · identity trend":"Últimos 30 días · tendencia de identidad",
  "Not enough scheduled actions":"No hay suficientes acciones programadas",
  "No scheduled load yet.":"Todavía no hay carga programada.",
  "Write the task first.":"Escribe primero la tarea.",
  "Mission restored:":"Misión restaurada:",
  "Mission restored":"Misión restaurada",
  "Example: Certifications 5x/week":"Ejemplo: Certificaciones 5x/semana",
  "Counted today":"Contabilizado hoy",
  "Manual complete":"Completado manualmente",
  "Search Premium Contract or linked task...":"Buscar Contrato Premium o tarea vinculada...",
  "· linked tasks saved":"· tareas vinculadas guardadas",
  "Delete this Premium Contract permanently?":"¿Eliminar permanentemente este Contrato Premium?",
  "This clears it from linked tasks and removes its progress logs. This cannot be undone.":"Esto lo quita de las tareas vinculadas y elimina sus registros de progreso. No se puede deshacer.",
  "Not scheduled":"No programada",
  "Clear this week":"Limpiar esta semana",
  "Search tasks / missions":"Buscar tareas / misiones",
  "Theme saved":"Tema guardado",
  "Today’s to‑do":"Pendientes de hoy",
  "Today’s to-do":"Pendientes de hoy",
  "Today’s to–do":"Pendientes de hoy",
  "Today, week, month, and year with real tracking.":"Hoy, semana, mes y año con seguimiento real.",
  "For one-time tasks or today’s missions.":"Para tareas únicas o misiones de hoy.",
  "View missions":"Ver misiones",
  "Weekly habits with daily XP and a completion bonus.":"Hábitos semanales con XP diario y bono de finalización.",
  "Weekly reset in":"Reinicio semanal en",
  "Weekly bonus":"Bono semanal",
  "Quick task":"Tarea rápida",
  "New task":"Nueva tarea",
  "New goal":"Nueva meta",
  "Edit goal":"Editar meta",
  "Save changes":"Guardar cambios",
  "Move to tomorrow":"Mover a mañana",
  "Weekly goal":"Meta semanal",
  "No missions for today. Add a quick one or check your frequencies.":"No hay misiones para hoy. Agrega una rápida o revisa tus frecuencias.",
  "No active missions here.":"No hay misiones activas aquí.",
  "No missions in this view.":"No hay misiones en esta vista.",
  "Weekly progress":"Progreso semanal",
  "Restore suggested":"Restaurar sugeridas",
  "You can reactivate them whenever you want.":"Puedes reactivarlas cuando quieras.",
  "Legs and glutes":"Pierna y glúteo",
  "Send resume":"Enviar CV",
  "I choose myself":"Me elijo",
  "This is the hour to attack what matters, not decorate your to-do list.":"Esta es la hora de atacar lo importante, no de decorar pendientes.",
  "A strong mission early makes the rest of the day feel less lost.":"Una misión fuerte temprano hace que el resto del día se sienta menos perdido.",
  "Last call: a small mission or real rest.":"Última llamada: una misión pequeña o descanso real.",
  "Controls glass tint, border and glow. It keeps the sky/preset visible.":"Controla el tinte, el borde y el brillo del cristal. Mantiene visible el cielo o el ajuste preestablecido.",
  "Main text":"Texto principal",
  "Controls main text color.":"Controla el color del texto principal.",
  "Controls helper/small text color.":"Controla el color del texto auxiliar/pequeño.",
  "was already done on":"ya estaba completada el",
  "Marked done":"Marcada como hecha",
  "Mission unchecked for":"Misión desmarcada para",
  "Optional catch-up: mark what you actually did yesterday without forcing carryover.":"Recuperación opcional: marca lo que realmente hiciste ayer sin forzar arrastre.",
  "Preview what is planned for the next day based on your mission schedule.":"Revisa lo planeado para el día siguiente según el horario de tus misiones.",
  "Today has no completed missions yet. One useful mission is enough to stop the day from feeling wasted.":"Hoy todavía no hay misiones completadas. Una misión útil basta para evitar que el día se sienta desperdiciado.",
  "🔮 Tomorrow":"🔮 Mañana",
  "Optional catch-up for tasks you actually did.":"Recuperación opcional para tareas que realmente hiciste.",
  "Preview what is planned for the next day.":"Revisa lo planeado para el día siguiente.",
  "Mission unmarked:":"Misión desmarcada:",
  "Review and close yesterday without reloading the app.":"Revisa y cierra el día de ayer sin recargar la aplicación.",
  "Preview and adjust tomorrow without reloading the app.":"Revisa y ajusta el día de mañana sin recargar la aplicación.",
  "Done yesterday":"Hecho ayer",
  "Archive failed":"Falló el archivado",
  "The mission could not be found.":"No se pudo encontrar la misión.",
  "Already archived":"Ya archivada",
  "Mission archived:":"Misión archivada:",
  "The change could not be saved.":"No se pudo guardar el cambio.",
  "The task was restored because it could not be saved.":"La tarea se restauró porque no se pudo guardar.",
  "Next Up reordered":"Siguientes reordenado",
  "Mission moved to position":"Misión movida a la posición",
  "Only pending, visible missions can be queued.":"Solo las misiones pendientes y visibles pueden entrar en la cola.",
  "Next Up updated":"Siguientes actualizado",
  "· Not scheduled today":"· No programada hoy",
  "➜ Next #":"➜ Siguiente #",
  "Plan my day will be placed at #1 each new day.":"Planear mi día se colocará en #1 cada día nuevo.",
  "The queue will stay fully manual.":"La cola permanecerá completamente manual.",
  "Next Up missions":"Misiones siguientes",
  "Mission opened":"Misión abierta",
  "Use Missions to view the selected task.":"Usa Misiones para ver la tarea seleccionada.",
  "linked automatically.":"vinculada automáticamente.",
  "No new strong matches were found.":"No se encontraron nuevas coincidencias fuertes.",
  "No linked missions":"Sin misiones vinculadas",
  "Create mission":"Crear misión",
  "Dismiss today":"Descartar hoy",
  "Open contract":"Abrir contrato",
  "One mission away":"A una misión",
  "Complete one linked mission to finish “":"Completa una misión vinculada para terminar “",
  "selflove":"amor propio",
  "order":"orden",
  "career":"carrera",
  "academic":"académica",
  "physical":"física",
  "mental":"mental",
  "autonomy":"autonomía",
  "presence":"presencia",
  "finance":"finanzas",
  "culture":"cultura",
  "custom":"personalizada",
  "Cathedral of the Moon":"Catedral de la Luna",
  "The Last Observatory":"El Último Observatorio",
  "A darker abyss with giants and immense blue canyons.":"Un abismo más oscuro con gigantes y enormes cañones azules.",
  "A high-altitude observatory above the clouds beneath auroras and deep stars.":"Un observatorio de gran altitud sobre las nubes, bajo auroras y estrellas profundas.",
  "A naturally glowing alien river with mineral spires and luminous vegetation.":"Un río alienígena de brillo natural con agujas minerales y vegetación luminosa.",
  "Alien skies, planets and cinematic space landscapes.":"Cielos alienígenas, planetas y paisajes espaciales cinematográficos.",
  "Ancient forest ruins, mist, streams and fireflies.":"Ruinas antiguas en el bosque, niebla, arroyos y luciérnagas.",
  "Ancient sea ruins, reflective waters and quiet mystery.":"Ruinas marinas antiguas, aguas reflectantes y misterio sereno.",
  "Barren worlds, ruins, dust and hostile horizons.":"Mundos áridos, ruinas, polvo y horizontes hostiles.",
  "Black fortresses, war skies and a darker fantasy realm.":"Fortalezas negras, cielos de guerra y un reino de fantasía más oscuro.",
  "Crystal caverns and luminous lagoons.":"Cavernas de cristal y lagunas luminosas.",
  "Dark spires, moonlit stone and cathedral-scale drama.":"Agujas oscuras, piedra a la luz de la luna y dramatismo monumental.",
  "Dragons, unicorns and high-fantasy wilderness.":"Dragones, unicornios y naturaleza de alta fantasía.",
  "Dreamlike floating worlds and impossible landscapes.":"Mundos flotantes de ensueño y paisajes imposibles.",
  "Floating gardens, white-stone terraces, waterfalls and cloudbound citadels.":"Jardines flotantes, terrazas de piedra blanca, cascadas y ciudadelas entre nubes.",
  "Frozen fjords, jagged peaks and northern lights.":"Fiordos helados, picos escarpados y auroras boreales.",
  "Frozen strongholds, auroras and glacial power.":"Fortalezas congeladas, auroras y poder glacial.",
  "Hidden Leaf inspired village landscapes through the day.":"Paisajes de aldea inspirados en la Hoja Oculta a lo largo del día.",
  "Monumental pyramids, jungle stone and ceremonial gold.":"Pirámides monumentales, piedra selvática y oro ceremonial.",
  "Moonlit gothic sanctuaries, roses, water and monumental stained glass.":"Santuarios góticos a la luz de la luna, rosas, agua y vitrales monumentales.",
  "Mountain temples, storm light and a feudal-war atmosphere.":"Templos de montaña, luz de tormenta y atmósfera de guerra feudal.",
  "Obsidian temples, jungle mist, volcanic horizons and ceremonial fire.":"Templos de obsidiana, niebla selvática, horizontes volcánicos y fuego ceremonial.",
  "Radiant sky-fortresses, clouds and divine architecture.":"Fortalezas radiantes en el cielo, nubes y arquitectura divina.",
  "Rain-soaked futuristic waterfronts and neon reflections.":"Costas futuristas bajo la lluvia y reflejos de neón.",
  "Severe concrete, bridges and monumental architecture.":"Concreto severo, puentes y arquitectura monumental.",
  "Steel, furnaces, smoke and a heavy industrial world.":"Acero, hornos, humo y un mundo industrial pesado.",
  "Sunlit desert ruins, oasis cities, wind-carved dunes and ancient horizons.":"Ruinas desérticas iluminadas por el sol, ciudades oasis, dunas talladas por el viento y horizontes antiguos.",
  "Towering jungle pillars, waterfalls and overgrown ruins.":"Pilares selváticos gigantes, cascadas y ruinas cubiertas de vegetación.",
  "Whales, glowing jellyfish and dramatic underwater worlds.":"Ballenas, medusas luminosas y mundos submarinos dramáticos.",
  "pending from yesterday":"pendientes de ayer",
  "this week":"esta semana",
  "resets weekly":"se reinicia semanalmente",
  "every week":"cada semana",
  "weekly bonus":"bono semanal",
  "from yesterday":"de ayer",
  "Backup exported":"Respaldo exportado",
  "Reset Michel’s Life and delete all local progress? This cannot be undone unless you exported a backup.":"¿Restablecer Michel’s Life y eliminar todo el progreso local? No se puede deshacer salvo que hayas exportado un respaldo.",
  "Fresh start created.":"Inicio nuevo creado.",
  "Settings and window palette applied.":"Configuración y paleta de ventana aplicadas.",
  "Progress reset while keeping missions":"Progreso restablecido conservando las misiones",
  "Progress reset":"Progreso restablecido",
  "Missions kept:":"Misiones conservadas:",
  "Skipped tomorrow":"Omitida mañana",
  "Add suggested mission":"Agregar misión sugerida",
  "Suggested next mission":"Siguiente misión sugerida",
  "Open mission":"Abrir misión",
  "View contract":"Ver contrato",
  "Mission overdue":"Misión vencida",
  "Plan the day is still pending":"Planear el día sigue pendiente",
  "Your daily planning mission has not been completed yet.":"Tu misión diaria de planificación todavía no se ha completado.",
  "Keep it first":"Mantenerla primero",
  "Next Up is empty":"Siguientes está vacío",
  "Add a strong mission":"Agregar una misión fuerte",
  "Open notifications":"Abrir notificaciones",
  "Notification type muted":"Tipo de notificación silenciado",
  "You can reset notification preferences in Settings.":"Puedes restablecer las preferencias de notificaciones en Configuración.",
  "⚠ No linked missions":"⚠ Sin misiones vinculadas",
  "✓ Completed":"✓ Completada",
  "Mission deleted":"Misión eliminada",
  "· Undo is available for 9 seconds.":"· Puedes deshacer durante 9 segundos.",
  "No new links":"Sin vínculos nuevos",
  "Notification preferences reset":"Preferencias de notificaciones restablecidas",
  "The linked mission is now in your queue.":"La misión vinculada ya está en tu cola.",
  "Notification mode updated":"Modo de notificaciones actualizado",
  "Train legs and glutes":"Entrenar pierna y glúteo",
  "Work on thesis for 45 minutes":"Trabajar en tesis durante 45 minutos",
  "Apply to a target job":"Postularme a una vacante objetivo",
  "Do not stalk, beg, or act from anxiety":"No stalkear, rogar ni actuar desde la ansiedad",
  "Prepare for sleep and tomorrow":"Prepararme para dormir y para mañana",
  "Wash the dishes":"Lavar los trastes",
  "French / language practice for 20 minutes":"Francés / práctica de idioma durante 20 minutos",
  "Read a book for 20 minutes":"Leer un libro durante 20 minutos",
  "Log today's expenses":"Registrar los gastos de hoy",
  "Review the weekly budget":"Revisar el presupuesto semanal",
  "Repeat a positive affirmation":"Repetir una afirmación positiva",
  "Speak kindly to myself today":"Hablarme con amabilidad hoy",
  "Do something kind for myself 3 times":"Hacer algo amable por mí 3 veces",
  "Do something kind for myself":"Hacer algo amable por mí",
  "Do not review old chats for 7 days":"No revisar chats viejos durante 7 días",
  "Positive affirmation":"Afirmación positiva",
  "Apply to":"Postularme a",
  "Complete 3 practical pending items":"Completar 3 pendientes prácticos",
  "Review pending payments":"Revisar pagos pendientes",
  "Organize the desk":"Organizar el escritorio",
  "pending items":"pendientes",
  "per week":"por semana",
  "No weekly contracts.":"No hay contratos semanales.",
  "Linked missions":"Misiones vinculadas",
  "Link mission":"Vincular misión",
  "Search linked tasks...":"Buscar tareas vinculadas...",
  "Never completed in more than 30 days.":"Sin completar en más de 30 días.",
  "Linked to":"Vinculada a",
  "Scheduled every day but completed only":"Programada todos los días, pero solo se completó",
  "times in the last 14 days.":"veces en los últimos 14 días.",
  "Keep 30 days":"Conservar 30 días",
  "Export a backup and remove older snapshots.":"Exporta un respaldo y elimina instantáneas antiguas.",
  "Automatic ·":"Automático ·",
  "Restore snapshot “":"Restaurar instantánea “",
  "No reversible action is available.":"No hay una acción reversible disponible.",
  "Undo failed":"Falló deshacer",
  "last action":"última acción",
  "Project created":"Proyecto creado",
  "What do you need to remember?":"¿Qué necesitas recordar?",
  "Duplicate mission IDs":"IDs de misión duplicados",
  "Orphan Next Up references":"Referencias huérfanas de Siguientes",
  "missing missions.":"misiones faltantes.",
  "Orphan project links":"Vínculos de proyecto huérfanos",
  "My focus grows every time I return to the task.":"Mi enfoque crece cada vez que regreso a la tarea.",
  "I can feel discomfort and still act with discipline.":"Puedo sentir incomodidad y aun así actuar con disciplina.",
  "One deliberate action can reset my whole day.":"Una acción deliberada puede reiniciar todo mi día.",
  "Every application and technical practice moves me forward.":"Cada postulación y cada práctica técnica me hacen avanzar.",
  "Strategy and execution create opportunities.":"La estrategia y la ejecución crean oportunidades.",
  "I can finish this stage with evidence.":"Puedo terminar esta etapa con evidencia.",
  "Every focused block brings the finish line closer.":"Cada bloque enfocado acerca la meta.",
  "Every workout builds strength and presence.":"Cada entrenamiento construye fuerza y presencia.",
  "I choose dignity over impulse.":"Elijo dignidad sobre impulso.",
  "My presence comes from care and intention.":"Mi presencia viene del cuidado y la intención.",
  "I can be visible without performing for approval.":"Puedo ser visible sin actuar para obtener aprobación.",
  "I build my image through consistent actions.":"Construyo mi imagen mediante acciones constantes.",
  "I use money with intention.":"Uso el dinero con intención.",
  "I can enjoy life and still protect my future.":"Puedo disfrutar la vida y aun así proteger mi futuro.",
  "I speak to myself with respect.":"Me hablo con respeto.",
  "I choose myself without abandoning my goals.":"Me elijo sin abandonar mis metas.",
  "Learning expands the life available to me.":"Aprender expande la vida que tengo disponible.",
  "Every page and new word compounds.":"Cada página y cada palabra nueva se acumulan.",
  "I make room for ideas beyond my routine.":"Hago espacio para ideas más allá de mi rutina.",
  "Weekly target reached.":"Meta semanal alcanzada.",
  "needed, but only":"necesarias, pero solo",
  "scheduled opportunities":"oportunidades programadas",
  "Search Premium Contract or linked task...":"Buscar Contrato Premium o tarea vinculada...",
  "Search tasks / missions":"Buscar tareas / misiones",
  "Search mission":"Buscar misión",
  "Open contract":"Abrir contrato",
  "Open Focus timer":"Abrir temporizador de enfoque",
  "Close Focus":"Cerrar enfoque",
  "Close Focus controls":"Cerrar controles de enfoque",
  "Close Focus timer":"Cerrar temporizador de enfoque",
  "Keep one panel visible":"Mantener un panel visible",
  "Apply to one target job":"Postularme a una vacante objetivo",
  "Apply to a serious job opportunity.":"Postularme a una oportunidad laboral seria.",
  "journal plan the day":"diario planear el día",
  "journal plan my day":"diario planear mi día",
  "read a book for 20 minutes":"leer un libro durante 20 minutos",
  "work on thesis for 45 minutes":"trabajar en tesis durante 45 minutos",
  "Duplicate check complete":"Revisión de duplicados completada",
  "duplicate mission":"misión duplicada",
  "missed mission":"misión omitida",
  "missed missions":"misiones omitidas",
  "pending mission":"misión pendiente",
  "pending missions":"misiones pendientes",
  "YOUR STORY":"TU HISTORIA",
  "◈ YOUR STORY":"◈ TU HISTORIA",
  "Name the era you are living and make it part of the run.":"Nombra la era que estás viviendo y hazla parte del recorrido.",
  "Dashboard layout":"Diseño de Inicio",
  "Search Premium Contracts":"Buscar Contratos Premium",
  "Premium Contracts, linked missions and useful mission alerts.":"Contratos Premium, misiones vinculadas y alertas útiles de misiones.",
  "No linked missions":"Sin misiones vinculadas",
  "No linked tasks yet. Open Edit to link tasks.":"Todavía no hay tareas vinculadas. Abre Editar para vincular tareas.",
  "Plan and edit missions directly from each date.":"Planea y edita misiones directamente desde cada fecha.",
  "Open Dashboard":"Abrir Inicio",
  "Weekly and monthly evidence from your actual mission history.":"Evidencia semanal y mensual basada en tu historial real de misiones.",
  "Schedule and complete actions to reveal your build":"Programa y completa acciones para revelar tu progreso",
  "This prevents the build from becoming only gym, only work, or only admin.":"Esto evita que tu progreso se concentre únicamente en el gimnasio, el trabajo o la administración.",
  "Connect related missions, decisions and Premium Contracts without turning everything into a weekly habit.":"Conecta misiones, decisiones y Contratos Premium relacionados sin convertir todo en un hábito semanal.",
  "New project":"Nuevo proyecto",
  "Keep the decision, the reason and the project it belongs to.":"Guarda la decisión, la razón y el proyecto al que pertenece.",
  "Checks for repeated missions and Premium Contracts without deleting progress.":"Busca misiones y Contratos Premium repetidos sin eliminar progreso.",
  "Exact duplicates are merged. Completion dates, linked contracts, schedules and Next Up references are preserved.":"Los duplicados exactos se fusionan. Se conservan fechas de finalización, contratos vinculados, horarios y referencias de Siguientes.",
  "Controls automatic mission matching and the notification center.":"Controla la vinculación automática de misiones y el centro de notificaciones.",
  "is the default: contracts without missions, contracts at risk, useful Next Up suggestions, overdue missions and daily planning reminders. Automatic links use titles, categories, descriptions and related keywords, while respecting links you manually rejected.":"es el valor predeterminado: contratos sin misiones, contratos en riesgo, sugerencias útiles de Siguientes, misiones vencidas y recordatorios de planificación diaria. Los vínculos automáticos usan títulos, categorías, descripciones y palabras relacionadas, respetando los vínculos que rechazaste manualmente.",
  "Wallpaper worlds only. Original Dynamic Sky uses the same live six-stage pipeline as every other theme.":"Solo mundos de fondo. Cielo dinámico original usa el mismo sistema vivo de seis etapas que los demás temas.",
  "Interface Typography":"Tipografía de la interfaz",
  "Choose by era. Every card keeps its own permanent preview, so you can compare styles without selecting them first.":"Elige por era. Cada tarjeta mantiene su propia vista previa permanente para que compares estilos sin seleccionarlos primero.",
  "Build the life you imagine · 0123":"Construye la vida que imaginas · 0123",
  "Heavier industrial sans-serif kept distinct from the earlier condensed eras.":"Sans serif industrial más pesada, diferenciada de las eras condensadas anteriores.",
  "Readable typewriter companion from the era instead of the extreme outlined cover title.":"Tipografía de máquina de escribir legible inspirada en la era, en lugar del título extremo delineado de la portada.",
  "Settings sidebar":"Barra lateral de Configuración",
  "Settings category navigation shell.":"Navegación por categorías de Configuración.",
  "Next Up and Focus panels.":"Paneles de Siguientes y Enfoque.",
  "Next Up / Focus":"Siguientes / Enfoque",
  "Configure the same Focus timer used from the action dock.":"Configura el mismo temporizador de Enfoque que se usa desde el panel de acciones.",
  "Open Focus controls":"Abrir controles de enfoque",
  "A running timer is never silently restarted. New durations apply immediately when the timer is ready or paused.":"Un temporizador en ejecución nunca se reinicia silenciosamente. Las nuevas duraciones se aplican inmediatamente cuando está listo o en pausa.",
  "Maximum Next Up missions":"Máximo de misiones en Siguientes",
  "Dashboard missions are grouped into Morning, Afternoon and Night using the same clock logic as the background.":"Las misiones de Inicio se agrupan en Mañana, Tarde y Noche usando la misma lógica horaria del fondo.",
  "Existing active missions were assigned by their title, description, category and linked project. A stage changed manually from a mission card is preserved.":"Las misiones activas existentes se asignaron según título, descripción, categoría y proyecto vinculado. Una etapa cambiada manualmente desde una tarjeta de misión se conserva.",
  "Controls the new execution system without adding energy tags or completion notes.":"Controla el nuevo sistema de ejecución sin agregar etiquetas de energía ni notas de finalización.",
  "Restart progress without deleting missions, categories, presets, settings, background sets or premium contracts.":"Reinicia el progreso sin eliminar misiones, categorías, ajustes preestablecidos, configuración, conjuntos de fondos ni Contratos Premium.",
  "Current Mission, link warnings, Weekly Review and automatic recovery snapshots.":"Misión actual, advertencias de vínculos, Revisión semanal e instantáneas automáticas de recuperación.",
  "Current Mission dock":"Panel de Misión actual",
  "Open Weekly Review":"Abrir Revisión semanal",
  "Current build":"Progreso actual",
  "I finish what is in front of me.":"Termino lo que tengo enfrente.",
  "My thesis moves when I work on it.":"Mi tesis avanza cuando trabajo en ella.",
  "Physical health":"Salud física",
  "Education / thesis":"Educación / tesis",
  "Career":"Carrera",
  "Image / presence":"Imagen / presencia",
  "Culture / languages":"Cultura / idiomas",
  "Order / execution":"Orden / ejecución",
  "Self-worth":"Amor propio",
  "Emotional autonomy":"Autonomía emocional",
  "Mental strength":"Fortaleza mental",
  "Finances":"Finanzas",
  "Uncategorized":"Sin categoría",
  "Initiate":"Iniciado",
  "Operator":"Operador",
  "Specialist":"Especialista",
  "Master":"Maestro",
  "Legend":"Leyenda",
  "First Contract":"Primer contrato",
  "Rhythm":"Ritmo",
  "Consistency":"Constancia",
  "Discipline":"Disciplina",
  "Machine":"Máquina",
  "Institution":"Institución",
  "Legacy":"Legado",
  "Consistent Operator":"Operador constante",
  "Elite Mode":"Modo élite",
  "Life Architect":"Arquitecto de vida",
  "Iron System":"Sistema de hierro",
  "Mythic Executor":"Ejecutor mítico",
  "Monthly Streak":"Racha mensual",
  "Two-Month Streak":"Racha de dos meses",
  "Hundred-Day Operator":"Operador de cien días",
  "Full-Year System":"Sistema de año completo",
  "Good morning":"Buenos días",
  "Good noon":"Buenas tardes",
  "Good afternoon":"Buenas tardes",
  "Good evening":"Buenas noches",
  "Dawn":"Amanecer",
  "Morning":"Mañana",
  "Noon":"Mediodía",
  "Afternoon":"Tarde",
  "Night":"Noche",
  "Late night":"Noche tardía",
  "Today’s goals":"Metas de hoy",
  "Goal reset":"Reinicio de metas",
  "No linked tasks · This contract has no active missions linked to it.":"Sin tareas vinculadas · Este contrato no tiene misiones activas vinculadas.",
  "Choose priorities for tomorrow.":"Elige las prioridades para mañana.",
  "Weekly reset in":"Reinicio semanal en",
  "Clear this week":"Limpiar esta semana",
  "Wash/fold clothes once this week.":"Lavar/doblar ropa una vez esta semana.",
  "Reset room and desk once this week.":"Ordenar habitación y escritorio una vez esta semana.",
  "Buy or plan essentials once this week.":"Comprar o planear básicos una vez esta semana.",
  "Check money and expenses once this week.":"Revisar dinero y gastos una vez esta semana.",
  "Train 5 days this week":"Entrenar 5 días esta semana",
  "Log gym weights 3 times this week":"Registrar cargas del gimnasio 3 veces esta semana",
  "I choose clarity over noise.":"Elijo claridad sobre ruido.",
  "My professional future is built through real preparation.":"Mi futuro profesional se construye con preparación real.",
  "I am capable of entering bigger rooms.":"Soy capaz de entrar a espacios más grandes.",
  "Science does not require perfect conditions.":"La ciencia no requiere condiciones perfectas.",
  "My body responds to repetition.":"Mi cuerpo responde a la repetición.",
  "Every set counts.":"Cada serie cuenta.",
  "I do not chase what drains me.":"No persigo lo que me drena.",
  "Not reacting is also power.":"No reaccionar también es poder.",
  "My peace is not negotiable.":"Mi paz no se negocia.",
  "Order gives my energy a direction.":"El orden le da dirección a mi energía.",
  "My environment supports my execution.":"Mi entorno apoya mi ejecución.",
  "Every expense I track gives me more control.":"Cada gasto que registro me da más control.",
  "Financial stability is built through repeated decisions.":"La estabilidad financiera se construye con decisiones repetidas.",
  "I do not need to earn my own kindness.":"No necesito ganarme mi propia amabilidad.",
  "My worth is not decided by someone else’s attention.":"Mi valor no lo decide la atención de otra persona.",
  "Learning expands the life available to me.":"Aprender expande la vida que tengo disponible.",
  "Every page and new word compounds.":"Cada página y cada palabra nueva se acumulan.",
  "I make room for ideas beyond my routine.":"Hago espacio para ideas más allá de mi rutina.",
  "I finish what is in front of me.":"Termino lo que tengo enfrente.",
  "My thesis moves when I work on it.":"Mi tesis avanza cuando trabajo en ella.",
  "Missing name":"Falta el nombre",
  "Import this backup and replace the current app data?":"¿Importar este respaldo y reemplazar los datos actuales de la aplicación?",
  "Missing task":"Falta la tarea",
  "Added once":"Agregada una vez",
  "Archived":"Archivada",
  "Missing contract":"Falta el contrato",
  "Premium contract added":"Contrato Premium agregado",
  "Could not open contract editor":"No se pudo abrir el editor del contrato",
  "Premium contract updated":"Contrato Premium actualizado",
  "Premium contract deleted":"Contrato Premium eliminado",
  "Weekly action updated":"Acción semanal actualizada",
  "Could not read image":"No se pudo leer la imagen",
  "Could not read file":"No se pudo leer el archivo",
  "Background saved":"Fondo guardado",
  "Confirmation needed":"Se necesita confirmación",
  "Nothing to undo":"No hay nada que deshacer",
  "Unchecked":"Desmarcada",
  "Yesterday updated":"Ayer actualizado",
  "Linked missions updated":"Misiones vinculadas actualizadas",
  "Linked mission created":"Misión vinculada creada",
  "Background style updated":"Estilo de fondo actualizado",
  "Duplicate data cleaned":"Datos duplicados limpiados",
  "Stale references repaired":"Referencias obsoletas reparadas",
  "Snapshot storage full":"Almacenamiento de instantáneas lleno",
  "Snapshot created":"Instantánea creada",
  "Snapshot restored":"Instantánea restaurada",
  "Undone":"Deshecho",
  "System settings saved":"Configuración del sistema guardada",
  "Choose one main mission":"Elige una misión principal",
  "Plan is too large":"El plan es demasiado grande",
  "Plan ready":"Plan listo",
  "Tomorrow is ready":"Mañana está listo",
  "Safe cleanup complete":"Limpieza segura completada",
  "Mission blocked":"Misión bloqueada",
  "Self-test complete":"Autoprueba completada",
  "Mission recalibrated":"Misión recalibrada",
  "Captured":"Capturado",
  "Time of day updated":"Horario actualizado",
  "Mission stages reassigned":"Etapas de misión reasignadas",
  "Difficulty updated":"Dificultad actualizada",
  "XP scale updated":"Escala de XP actualizada",
  "Contract links cleaned":"Vínculos de contratos limpiados",
  "Export complete":"Exportación completada",
  "Replace current mission":"Reemplazar misión actual",
  "Scheduled":"Programada",
  "Mission moved":"Misión movida",
  "Scheduled task moved":"Tarea programada movida",
  "Recurring schedule changed":"Horario recurrente modificado",
  "Reset the running Focus block and change preset?":"¿Reiniciar el bloque de enfoque en curso y cambiar el ajuste preestablecido?",
  "Motto / subtitle":"Lema / subtítulo",
  "Delete this Story Moment?":"¿Eliminar este Momento de Historia?",
  "Reset the running Focus block and switch to Deep Focus?":"¿Reiniciar el bloque de Enfoque en curso y cambiar a Enfoque Profundo?",
  "Michel’s Life Cloud":"Nube de Michel’s Life",
  "Cloud overview":"Resumen de nube",
  "Restore this historical cloud backup? Michel’s Life will create a local restore point first, and the current cloud save will also be preserved in history.":"¿Restaurar este respaldo histórico de la nube? Michel’s Life creará primero un punto de restauración local y el guardado actual de la nube también se conservará en el historial.",
  "Cloud restore":"Restauración de nube",
  "Restore point created":"Punto de restauración creado",
  "Restore point warning":"Advertencia del punto de restauración",
  "Repair local data? Michel’s Life will create a restore point first, then normalize saved structures.":"¿Reparar los datos locales? Michel’s Life creará primero un punto de restauración y después normalizará las estructuras guardadas.",
  "Install the newer local executable? A restore point will be created first.":"¿Instalar el ejecutable local más reciente? Primero se creará un punto de restauración.",
  "CURRENT CHAPTER":"CAPÍTULO ACTUAL",
  "STORY CHAPTERS":"CAPÍTULOS DE HISTORIA",
  "LEVEL":"NIVEL",
  "TOTAL XP":"XP TOTAL",
  "TODAY":"HOY",
  "FOCUS":"ENFOQUE",
  "POMODOROS":"POMODOROS",
  "DAY":"DÍA",
  "CURRENT BOSS":"JEFE ACTUAL",
  "No active boss battle":"No hay un jefe activo",
  "Choose in Projects":"Elegir en Proyectos",
  "Open Story":"Abrir historia",
  "Life Build":"Progreso de vida",
  "Bosses & Quest Chains":"Jefes y cadenas de misiones",
  "COMING NEXT":"SIGUIENTE",
  "queued":"en cola",
  "missions":"Misiones",
  "Weekly review":"Revisión semanal",
  "Revisión weekly":"Revisión semanal",
  "Present":"Presente",
  "Focus blocks":"Bloques de enfoque",
  "Bosses":"Jefes",
  "Story timeline":"Línea de tiempo",
  "Main threads":"Temas principales",
  "Projects worked":"Proyectos trabajados",
  "No story events yet.":"Aún no hay eventos de historia.",
  "No completed threads yet":"Aún no hay temas completados",
  "Edit chapter":"Editar capítulo",
  "Close chapter":"Cerrar capítulo",
  "Delete moment":"Eliminar momento",
  "Sunday":"Domingo",
  "Monday":"Lunes",
  "Tuesday":"Martes",
  "Wednesday":"Miércoles",
  "Thursday":"Jueves",
  "Friday":"Viernes",
  "Saturday":"Sábado",
  "Sun":"dom",
  "Mon":"lun",
  "Tue":"mar",
  "Wed":"mié",
  "Thu":"jue",
  "Fri":"vie",
  "Sat":"sáb",
  "January":"Enero",
  "February":"Febrero",
  "March":"Marzo",
  "April":"Abril",
  "May":"Mayo",
  "June":"Junio",
  "July":"Julio",
  "August":"Agosto",
  "September":"Septiembre",
  "October":"Octubre",
  "November":"Noviembre",
  "December":"Diciembre",
  "Deep winter":"Invierno profundo",
  "Soft February":"Febrero suave",
  "Early spring":"Inicio de primavera",
  "Spring rain":"Lluvia de primavera",
  "Full spring":"Primavera plena",
  "Early summer":"Inicio de verano",
  "High summer":"Pleno verano",
  "Late summer":"Final de verano",
  "Early autumn":"Inicio de otoño",
  "Late autumn":"Final de otoño",
  "Holiday season":"Temporada festiva",
  "Cold light · clean start":"Luz fría · inicio limpio",
  "Warmth · care · momentum":"Calidez · cuidado · impulso",
  "New growth · fresh movement":"Nuevo crecimiento · movimiento fresco",
  "Rain · reset · grow":"Lluvia · reinicio · crecimiento",
  "Bloom · build · expand":"Florece · construye · expande",
  "Bright days · open energy":"Días brillantes · energía abierta",
  "Long light · full momentum":"Luz prolongada · impulso total",
  "Warm light · finish the season strong":"Luz cálida · termina fuerte la temporada",
  "Golden shift · sharpen the routine":"Transición dorada · afina la rutina",
  "Night energy · sharper edges":"Energía nocturna · contornos más intensos",
  "Amber light · close the year well":"Luz ámbar · cierra bien el año",
  "Winter lights · year-end glow":"Luces de invierno · brillo de fin de año",
  "Focus Mode":"Modo enfoque",
  "Earlier today":"Más temprano hoy",
  "Positive affirmations":"Afirmaciones positivas",
  "Listen, read or write affirmations intentionally.":"Escucha, lee o escribe afirmaciones con intención.",
  "Premium contracts":"Contratos Premium",
  "Cloud needs attention":"La nube necesita atención",
  "Use category shortcuts to find missions fast and add them to today.":"Usa los accesos directos por categoría para encontrar misiones rápidamente y agregarlas a las de hoy.",
  "Time of day":"Hora del día",
  "History":"Historial",
  "Monthly and annual completion history.":"Historial mensual y anual de completados.",
  "Write what deserves to remain from this day.":"Escribe lo que merece permanecer de este día.",
  "Only days with actual writing are kept.":"Solo se conservan los días que realmente tienen texto.",
  "No entries yet. Your first written day will appear here.":"Aún no hay entradas. Tu primer día escrito aparecerá aquí.",
  "Active days":"Días activos",
  "Journal days":"Días de diario",
  "Closest achievements":"Logros más cercanos",
  "View achievements":"Ver logros",
  "Contracts, mission health, focus history and safe recovery in one place.":"Contratos, estado de misiones, historial de enfoque y recuperación segura en un solo lugar.",
  "completed this week":"completadas esta semana",
  "No projects yet. Create one for your thesis, Michel’s Life, home improvements or job search.":"Aún no hay proyectos. Crea uno para tu tesis, Michel’s Life, mejoras del hogar o búsqueda de empleo.",
  "A chapter is global. Missions, XP, bosses, achievements and Focus blocks completed during its dates are collected automatically. Close it when the era ends; its summary becomes historical.":"Un capítulo es global. Las misiones, XP, jefes, logros y bloques de enfoque completados durante sus fechas se recopilan automáticamente. Ciérralo cuando termine la era; su resumen quedará en el historial.",
  "A chapter is global. misiones, XP, bosses, achievements and Focus blocks completed during its dates are collected automatically. Close it when the era ends; its summary becomes historical.":"Un capítulo es global. Las misiones, XP, jefes, logros y bloques de enfoque completados durante sus fechas se recopilan automáticamente. Ciérralo cuando termine la era; su resumen quedará en el historial.",
  "SETTINGS":"CONFIGURACIÓN",
  "This clears completions, XP,, achievements and progress history. missions keep their archived and hidden state.":"Esto borra completados, XP, logros e historial de progreso. Las misiones conservan su estado archivado y oculto.",
  "Smart notifications & contract links":"Notificaciones inteligentes y vínculos de contratos",
  "At risk":"En riesgo",
  "Tight":"Ajustado",
  "pending now":"pendientes ahora",
  "pending from earlier":"pendientes anteriores",
  "later today":"más tarde hoy",
  "A mission rule blocked completion.":"Una regla de la misión impidió completarla.",
  "A restore point was created first.":"Primero se creó un punto de restauración.",
  "Add only this occurrence":"Agregar solo esta ocasión",
  "Add task":"Agregar tarea",
  "Add task to Calendar":"Agregar tarea al Calendario",
  "Backup imported":"Respaldo importado",
  "Break ready":"Descanso listo",
  "Break ready ·":"Descanso listo ·",
  "By days":"Por días",
  "Capture an idea without leaving your work":"Captura una idea sin salir de tu trabajo",
  "Change the task or move it to another date/stage.":"Cambia la tarea o muévela a otra fecha/etapa.",
  "Cloud conflict resolved":"Conflicto de nube resuelto",
  "Cloud copy was selected.":"Se seleccionó la copia de la nube.",
  "Color theme":"Tema de color",
  "Connect Google in Settings → Google to include Drive history.":"Conecta Google en Configuración → Google para incluir el historial de Drive.",
  "Content summary unavailable for this legacy backup.":"El resumen de contenido no está disponible para este respaldo antiguo.",
  "Could not capture the current state for the required safety backup.":"No se pudo capturar el estado actual para el respaldo de seguridad requerido.",
  "Create a one-off copy on":"Crear una copia única el",
  "Create a one-off mission tied to this exact date.":"Crear una misión única vinculada a esta fecha exacta.",
  "Current stage":"Etapa actual",
  "Daily shutdown completed":"Cierre diario completado",
  "Drive history is connected.":"El historial de Drive está conectado.",
  "Drive returned no restorable backup data.":"Drive no devolvió datos de respaldo restaurables.",
  "FOCUS · BREAK":"ENFOQUE · DESCANSO",
  "FOCUS · WORK":"ENFOQUE · TRABAJO",
  "Focus block complete":"Bloque de enfoque completado",
  "Focus block completed:":"Bloque de enfoque completado:",
  "Focus block saved:":"Bloque de enfoque guardado:",
  "Full backup + AI analysis saved in one JSON file.":"Respaldo completo + análisis de IA guardados en un solo archivo JSON.",
  "Give this day a title…":"Dale un título a este día…",
  "Glass tint, borders and glow.":"Tinte del cristal, bordes y brillo.",
  "Health & body":"Salud y cuerpo",
  "Helper, labels and secondary lettering.":"Ayudas, etiquetas y texto secundario.",
  "Hide the occurrence on":"Ocultar la ocasión el",
  "Keeping this PC and saving the previous cloud version in backup history.":"Conservando esta PC y guardando la versión anterior de la nube en el historial de respaldos.",
  "Large tab panels and Settings sections.":"Paneles grandes de pestañas y secciones de Configuración.",
  "Link this mission to a project":"Vincular esta misión a un proyecto",
  "Loading the cloud copy. A local restore point is being created first.":"Cargando la copia de la nube. Primero se está creando un punto de restauración local.",
  "Local data repaired":"Datos locales reparados",
  "Local restore points loaded, but Drive history could not be refreshed:":"Se cargaron los puntos de restauración locales, pero no se pudo actualizar el historial de Drive:",
  "Michel’s Life loaded the selected saved state.":"Michel’s Life cargó el estado guardado seleccionado.",
  "Michel’s Life original sky, changing automatically with the day.":"Cielo original de Michel’s Life, cambia automáticamente con el día.",
  "Mission linked to project":"Misión vinculada al proyecto",
  "Mission not completed":"Misión no completada",
  "Mission totals":"Totales de misiones",
  "Mission unlinked from project":"Misión desvinculada del proyecto",
  "Missions, contracts, KPIs and nested cards.":"Misiones, contratos, KPI y tarjetas anidadas.",
  "Move your body for 30 minutes":"Mueve tu cuerpo durante 30 minutos",
  "Next Up limit changed":"Límite de Siguientes actualizado",
  "Next work block is ready.":"El siguiente bloque de trabajo está listo.",
  "No achievements":"Sin logros",
  "No active chapter":"Sin capítulo activo",
  "No contracts":"Sin contratos",
  "No duplicate missions or Premium Contracts were found.":"No se encontraron misiones ni Contratos Premium duplicados.",
  "No new strong matches for":"No hay nuevas coincidencias fuertes para",
  "No next mission queued":"No hay una siguiente misión en cola",
  "No pending active mission":"No hay misión activa pendiente",
  "Open Pomodoro Focus Timer":"Abrir temporizador Pomodoro de enfoque",
  "Open project outcomes and decision log":"Abrir resultados del proyecto y registro de decisiones",
  "Open the mission creation form":"Abrir el formulario para crear una misión",
  "Orphan Current Mission":"Misión actual huérfana",
  "Orphan Next Up, dependency, project and Current Mission references were repaired.":"Se repararon referencias huérfanas de Siguientes, dependencias, proyectos y Misión actual.",
  "Pick the areas you actually want on your board.":"Elige las áreas que realmente quieres en tu tablero.",
  "Planning and streak settings updated.":"Configuración de planificación y rachas actualizada.",
  "Preparing restore point and historical backup…":"Preparando punto de restauración y respaldo histórico…",
  "Progress reset requested":"Restablecimiento de progreso solicitado",
  "Protect one boundary today":"Protege un límite hoy",
  "Quick Capture · Ctrl+K for commands":"Captura rápida · Ctrl+K para comandos",
  "Read or learn for 20 minutes":"Lee o aprende durante 20 minutos",
  "Repeat days":"Días de repetición",
  "Restore saved state":"Restaurar estado guardado",
  "Review contracts, mission health and snapshots":"Revisar contratos, estado de misiones e instantáneas",
  "Review today’s spending":"Revisar los gastos de hoy",
  "RPG PROJECT OPTIONS":"OPCIONES DE PROYECTO RPG",
  "Run health checks and calibration":"Ejecutar comprobaciones y calibración",
  "Saved structures normalized after creating a restore point.":"Las estructuras guardadas se normalizaron después de crear un punto de restauración.",
  "See the year of completed work":"Ver el año de trabajo completado",
  "Selected backup is not restorable.":"El respaldo seleccionado no se puede restaurar.",
  "Show only the current mission and what comes next":"Mostrar solo la misión actual y lo que sigue",
  "Specific task for this date":"Tarea específica para esta fecha",
  "Start this mission as Current Mission":"Iniciar esta misión como Misión actual",
  "Story moment:":"Momento de historia:",
  "Study or deep-work for 30 minutes":"Estudia o haz trabajo profundo durante 30 minutos",
  "The active timer points to a missing mission.":"El temporizador activo apunta a una misión inexistente.",
  "The restored local state is now the current Google Drive copy.":"El estado local restaurado ahora es la copia actual de Google Drive.",
  "This action requires the Windows WebView2 app.":"Esta acción requiere la aplicación de Windows con WebView2.",
  "This PC":"Esta PC",
  "This PC was selected.":"Se seleccionó esta PC.",
  "Today’s plan needs exactly one main mission.":"El plan de hoy necesita exactamente una misión principal.",
  "Type a command or mission…":"Escribe un comando o misión…",
  "Use up to two important and three optional missions.":"Usa hasta dos misiones importantes y tres opcionales.",
  "Weekly contracts":"Contratos semanales",
};
const REVERSE=Object.fromEntries(Object.entries(PAIRS).map(([en,es])=>[es,en]));

function installedDefault(){
  const n=String(navigator.language||'').toLowerCase();
  return n.startsWith('es')?'es':'en';
}
function getLanguage(){
  try{const v=localStorage.getItem(KEY);if(v==='en'||v==='es')return v}catch(_){}
  return installedDefault();
}
let language=getLanguage();

// Track only DOM values that this i18n layer actually changed. This lets us
// restore canonical English exactly without reverse-translating user content.
const translatedTextNodes=new WeakMap();
const translatedAttributes=new WeakMap();

function mapText(raw){
  const s=String(raw);
  const t=s.trim();
  if(!t)return s;
  // English is the canonical application language. Never reverse-translate
  // arbitrary Spanish text, because it may be user-authored data. Switching to
  // English rebuilds the UI from canonical state instead.
  if(language==='en')return s;
  const dict=PAIRS;
  if(dict[t]){
    const lead=s.slice(0,s.indexOf(t)),tail=s.slice(s.indexOf(t)+t.length);
    return lead+dict[t]+tail;
  }
  if(language==='es'){
    const decorated=t.match(/^([^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]*)(.*?)(\s*[→←]?)$/);
    if(decorated&&decorated[2]&&dict[decorated[2]]){
      const translated=decorated[1]+dict[decorated[2]]+decorated[3];
      const at=s.indexOf(t);
      return s.slice(0,at)+translated+s.slice(at+t.length);
    }
  }
  let out=s;
  if(language==='es'){
    const catMap={'physical health':'salud física','education / thesis':'educación / tesis','career':'carrera','image / presence':'imagen / presencia','culture / languages':'cultura / idiomas','order / execution':'orden / ejecución','self-worth':'amor propio','emotional autonomy':'autonomía emocional','mental strength':'fortaleza mental'};
    out=out.replace(new RegExp('Complete the weekly (.+?) challenge (\\d+) time(s)?\\.','gi'),(m,cat,n)=>'Completa el reto semanal de '+(catMap[String(cat).toLowerCase()]||cat)+' '+n+' '+(Number(n)===1?'vez':'veces')+'.');
    out=out.replace(new RegExp('Complete (\\d+) (.+?) missions\\.','gi'),(m,n,cat)=>'Completa '+n+' misiones de '+(catMap[String(cat).toLowerCase()]||cat)+'.');
    out=out.replace(new RegExp('Complete (\\d+) total missions\\.','gi'),(m,n)=>'Completa '+n+' misiones en total.');
    out=out.replace(new RegExp('Complete at least one mission per day for (\\d+) consecutive days\\.','gi'),(m,n)=>'Completa al menos una misión por día durante '+n+' días consecutivos.');
    out=out.replace(new RegExp('(\\d+\\/\\d+) distinctDays this week','gi'),'$1 días distintos esta semana');
    out=out.replace(new RegExp('(\\d+\\/\\d+) count this week','gi'),'$1 conteo esta semana');
    out=out.replace(new RegExp('(\\d+\\/\\d+) times this week','gi'),'$1 veces esta semana');
    out=out.replace(new RegExp('linked tasks count automatically\\.','gi'),'las tareas vinculadas cuentan automáticamente.');
    out=out.replace(new RegExp('“([^”]+)” has no active missions connected to it\\.','gi'),'“$1” no tiene misiones activas vinculadas.');
    out=out.replace(new RegExp('Today \\+(\\d+) XP','gi'),'Hoy +$1 XP');
    out=out.replace(new RegExp('This week ·','gi'),'Esta semana ·');
    out=out.replace(new RegExp('Current week due so far · default','gi'),'Semana actual hasta hoy · predeterminado');
    const fullWeekdays={Sunday:'Domingo',Monday:'Lunes',Tuesday:'Martes',Wednesday:'Miércoles',Thursday:'Jueves',Friday:'Viernes',Saturday:'Sábado'};
    const fullMonths={January:'Enero',February:'Febrero',March:'Marzo',April:'Abril',May:'Mayo',June:'Junio',July:'Julio',August:'Agosto',September:'Septiembre',October:'Octubre',November:'Noviembre',December:'Diciembre'};
    out=out.replace(/\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/gi,m=>fullWeekdays[Object.keys(fullWeekdays).find(k=>k.toLowerCase()===m.toLowerCase())]||m);
    out=out.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi,m=>fullMonths[Object.keys(fullMonths).find(k=>k.toLowerCase()===m.toLowerCase())]||m);
    out=out.replace(/\bGood morning\b/gi,'Buenos días');
    out=out.replace(/\bGood noon\b/gi,'Buenas tardes');
    out=out.replace(/\bGood afternoon\b/gi,'Buenas tardes');
    out=out.replace(/\bGood evening\b/gi,'Buenas noches');
    out=out.replace(/\bLate night\b/gi,'Noche tardía');
    out=out.replace(/\bCURRENT CHAPTER\b/g,'CAPÍTULO ACTUAL');
    out=out.replace(/\bCHAPTER\s+([IVXLCDM]+)\b/g,'CAPÍTULO $1');
    out=out.replace(/\bCURRENT BOSS\b/g,'JEFE ACTUAL');
    out=out.replace(/\bCOMING NEXT\b/g,'SIGUIENTE');
    out=out.replace(/\b(\d+)\s+queued\b/gi,'$1 en cola');
    out=out.replace(/\bRevisión\s+weekly\b/gi,'Revisión semanal');
    out=out.replace(/\bWeekly\s+Review\b/gi,'Revisión semanal');
    out=out.replace(/\bweekly\b/gi,'semanal');
    out=out.replace(/\bAdd\s+semanal\b/gi,'Agregar semanal');
    out=out.replace(/\bSchedule\s+for\s+([A-Za-zÁÉÍÓÚÑáéíóúñ.]+)/gi,'Programar para $1');
    out=out.replace(/\bEasy\b/gi,'Fácil');
    out=out.replace(/\bMedium\b/gi,'Media');
    out=out.replace(/\bHard\b/gi,'Difícil');
    out=out.replace(/\bBoss\b/gi,'Jefe');
    out=out.replace(/\bNext\s*#\s*(\d+)\b/gi,'Siguiente #$1');
    out=out.replace(/\bImage\s*\/\s*Presence\b/gi,'Imagen / presencia');
    out=out.replace(/\bMental strength\b/gi,'Fortaleza mental');
    out=out.replace(/This clears completions,[^.]*progress history\.\s*(?:missions|misiones) keep their archived and hidden state\./gi,'Esto borra los completados, XP, logros y el historial de progreso. Las misiones conservan su estado archivado y oculto.');
    out=out.replace(/\bAdd\s+a\s+Siguientes\b/gi,'Agregar a Siguientes');
    out=out.replace(/\bAdd\s+decisión\b/gi,'Agregar decisión');
    out=out.replace(/\bAdd\s+afirmación\b/gi,'Agregar afirmación');
    out=out.replace(/\bAdd\s+tarea\b/gi,'Agregar tarea');
    out=out.replace(/\bHora del día\s+for\s+/gi,'Hora del día para ');
    out=out.replace(/\bPlan\s+tomorrow\b/gi,'Planear mañana');
    out=out.replace(/\bCurrent stage:\s*/gi,'Etapa actual: ');
    out=out.replace(/\bLate night\b/gi,'Noche tardía');
    out=out.replace(/\bDawn\b/gi,'Amanecer');
    out=out.replace(/\bMorning\b/gi,'Mañana');
    out=out.replace(/\bNoon\b/gi,'Mediodía');
    out=out.replace(/\bAfternoon\b/gi,'Tarde');
    out=out.replace(/\bEvening\b/gi,'Noche');
    out=out.replace(/\bNight\b/gi,'Noche');
    out=out.replace(/\bEdit\b/g,'Editar');
    out=out.replace(/\bFocus\s*·/gi,'Enfoque ·');
    out=out.replace(/\bStart Work\b/gi,'Iniciar trabajo');
    out=out.replace(/\bAuto\s*·\s*Current\s+misión\b/gi,'Automático · Misión actual');
    out=out.replace(/\bAuto-start break\b/gi,'Iniciar descanso automáticamente');
    out=out.replace(/\bAI Export\b/gi,'Exportar para IA');
    out=out.replace(/\bApply\b/gi,'Aplicar');
    out=out.replace(/\bOn track\b/gi,'En curso');
    out=out.replace(/(\d+)\s+left\s+this\s+Semana/gi,'$1 restantes esta semana');
    out=out.replace(/\bthis\s+Semana\b/gi,'esta semana');
    out=out.replace(/\bpendientes\s+now\b/gi,'pendientes ahora');
    out=out.replace(/\bpendientes\s+from\s+earlier\b/gi,'pendientes anteriores');
    out=out.replace(/\bLinked tasks\b/gi,'Tareas vinculadas');
    out=out.replace(/(\d+)\s+linked\b/gi,'$1 vinculadas');
    out=out.replace(/This contract has no active misiones linked to it\./gi,'Este contrato no tiene misiones activas vinculadas.');
    out=out.replace(/\bYour life, archived as eras instead of a pile of tasks\.\b/gi,'Tu vida, archivada como eras en lugar de una pila de tareas.');
    out=out.replace(/\bTime ambience\b/gi,'Ambiente horario');
    out=out.replace(/\bUse custom opacity\b/gi,'Usar opacidad personalizada');
    out=out.replace(/\bMain panel\b/gi,'Panel principal');
    out=out.replace(/\bApply timer settings\b/gi,'Aplicar ajustes del temporizador');
    out=out.replace(/\bClear Next Up\b/gi,'Limpiar Siguientes');
    out=out.replace(/\bOpen Maintenance\b/gi,'Abrir mantenimiento');
    out=out.replace(/\bChoose photo\b/gi,'Elegir foto');
    out=out.replace(/\bSave system settings\b/gi,'Guardar configuración del sistema');
    out=out.replace(/\bCreate snapshot now\b/gi,'Crear instantánea ahora');
    out=out.replace(/\bChoose newer EXE…/gi,'Elegir un EXE más reciente…');
    out=out.replace(/\bDefault is 6\. The floating dock grows to a second row when needed\./gi,'El valor predeterminado es 6. El panel flotante crece a una segunda fila cuando es necesario.');
    out=out.replace(/\bKeep Plan my day first\b/gi,'Mantener «Planear mi día» primero');
    out=out.replace(/\bOnce per new day, the matching misión is placed at #1 automatically\./gi,'Una vez por cada nuevo día, la misión correspondiente se coloca automáticamente en el puesto 1.');
    out=out.replace(/\bAuto-open hoy Plan after Plan my day\b/gi,'Abrir automáticamente el plan de hoy después de «Planear mi día»');
    out=out.replace(/\bEnabled\b/gi,'Activado');
    out=out.replace(/\bDisabled\b/gi,'Desactivado');
    out=out.replace(/\bRadar de progreso\b/gi,'Radar de progreso');
    out=out.replace(/\brevelar tu build\b/gi,'revelar tu progreso');
    out=out.replace(/\bla build\b/gi,'el progreso');
    out=out.replace(/\bMain growth direction\b/gi,'Dirección principal de crecimiento');
    out=out.replace(/\bWeighted build radar\b/gi,'Radar ponderado de progreso');
    out=out.replace(/\bPhysical\b/gi,'Físico');
    out=out.replace(/\bAcademic\b/gi,'Académico');
    out=out.replace(/\bOrder\b/gi,'Orden');
    out=out.replace(/\bPresence\b/gi,'Presencia');
    out=out.replace(/\bFinance\b/gi,'Finanzas');
    out=out.replace(/\bAutonomy\b/gi,'Autonomía');
    out=out.replace(/\bCulture\b/gi,'Cultura');
    out=out.replace(/\bTrain\s+5\s+días\s+esta\s+semana\b/gi,'Entrenar 5 días esta semana');
    out=out.replace(/\bLog gym weights\s+3\s+times\s+esta\s+semana\b/gi,'Registrar cargas del gimnasio 3 veces esta semana');
    out=out.replace(/\bBuild early advantage while everything is quiet\./gi,'Aprovecha la calma para avanzar desde temprano.');
    out=out.replace(/\bcomplete the next visible action\./gi,'completa la siguiente acción visible.');
    out=out.replace(/\bon a (?:mission|misión) to build your queue\./gi,'en una misión para armar tu cola.');
    out=out.replace(/\bDay,\s*Semana,\s*level and contracts\./gi,'Día, semana, nivel y contratos.');
    out=out.replace(/\bFocus\s+misión\b/gi,'Misión de enfoque');
    out=out.replace(/\bPlayer\b/g,'Jugador');
    out=out.replace(/\bavailable\b/gi,'disponible');
    out=out.replace(/Controls active\s+semanal\s+day chips,/gi,'Controla los botones activos de los días semanales,');
    out=out.replace(/\band premium badges\./gi,'y las insignias Premium.');
    out=out.replace(/I become impossible to ignore because I keep showing up\./gi,'Me vuelvo imposible de ignorar porque sigo apareciendo y cumpliendo.');
    out=out.replace(/(\d+\/\d+)\s+(?:missions|misiones)\s+today\s*·\s*(?:Week|Semana)\s+(\d+)%\s*·\s*Reset\s+([^\n]*)/gi,'$1 misiones hoy · Semana $2% · Reinicio $3');
    out=out.replace(/\bWeek\b/gi,'Semana');
    out=out.replace(/\bNo linked misiones\b/gi,'Sin misiones vinculadas');
    out=out.replace(/has no active (?:missions|misiones) connected to it\./gi,'no tiene misiones activas vinculadas.');
    out=out.replace(/\bAutomatic\s+semanal\s+status based on linked misiones and remaining opportunities\./gi,'Estado semanal automático basado en las misiones vinculadas y las oportunidades restantes.');
    out=out.replace(/\bMission\s+Hora del día\b/gi,'Hora del día de la misión');
    out=out.replace(/\bmission\b/gi,'misión');
    out=out.replace(/\bNotifications\b/gi,'Notificaciones');
    out=out.replace(/\bNotification\b/gi,'Notificación');
    out=out.replace(/\bpending\b/gi,'pendientes');
    out=out.replace(/\bcompleted\b/gi,'completadas');
    out=out.replace(/\b(\d+)%\s+to\s+next\b/gi,'$1% para el siguiente nivel');
    out=out.replace(/\bAdd a quick misión for today…\b/gi,'Agregar una misión rápida para hoy…');
    out=out.replace(/\bAdd a quick misión for today\.\.\.\b/gi,'Agregar una misión rápida para hoy…');
    out=out.replace(/\bCreate misión\b/gi,'Crear misión');
    out=out.replace(/\bStart a new chapter\b/gi,'Iniciar un nuevo capítulo');
    out=out.replace(/\bStart date\b/gi,'Fecha de inicio');
    out=out.replace(/\bStart chapter\b/gi,'Iniciar capítulo');
    out=out.replace(/\bClick to choose a date\b/gi,'Haz clic para elegir una fecha');
    out=out.replace(/\bOpen Focus timer\b/gi,'Abrir temporizador de enfoque');
    out=out.replace(/\bDo not show this kind of notificación\b/gi,'No mostrar este tipo de notificación');
    out=out.replace(/\bmissions\b/gi,'misiones');
    const wd={Sun:'dom',Mon:'lun',Tue:'mar',Wed:'mié',Thu:'jue',Fri:'vie',Sat:'sáb'};
    const mon={Jan:'ene',Feb:'feb',Mar:'mar',Apr:'abr',May:'may',Jun:'jun',Jul:'jul',Aug:'ago',Sep:'sep',Oct:'oct',Nov:'nov',Dec:'dic'};
    out=out.replace(/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b/g,m=>wd[m]||m);
    out=out.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g,m=>mon[m]||m);
    out=out.replace(/\bNo active boss battle\b/gi,'No hay un jefe activo');
    out=out.replace(/\bChoose in Projects\b/g,'Elegir en Proyectos');
    out=out.replace(/\bOpen Story\b/g,'Abrir historia');
    out=out.replace(/\bLife Build\b/g,'Progreso de vida');
    out=out.replace(/\bBosses & Quest Chains\b/g,'Jefes y cadenas de misiones');
    out=out.replace(/\bSeptember\b/gi,'Septiembre');
    out=out.replace(/\bEarly\s+autumn\b/gi,'Inicio de otoño');
    out=out.replace(/\bGolden\s+shift\s*·\s*sharpen\s+the\s+routine\b/gi,'Transición dorada · afina la rutina');
    out=out.replace(/\bDo not call the day lost while there is still leverage\.\b/gi,'No des el día por perdido mientras todavía haya margen.');
    out=out.replace(/\bStart Chapter\s+([IVXLCDM]+)\b/gi,'Iniciar Capítulo $1');
    out=out.replace(/\bFocus Mode\b/gi,'Modo enfoque');
    out=out.replace(/\b(\d+)\s+today\b/gi,'$1 hoy');
    out=out.replace(/\b(\d+)\s+pending now\b/gi,'$1 pendientes ahora');
    out=out.replace(/\b(\d+)\s+pending from earlier\b/gi,'$1 pendientes anteriores');
    out=out.replace(/\b(\d+)\s+later today\b/gi,'$1 más tarde hoy');
    out=out.replace(/\bEarlier today\b/gi,'Más temprano hoy');
    out=out.replace(/\bPositive affirmations\b/gi,'Afirmaciones positivas');
    out=out.replace(/\bPremium contracts\b/gi,'Contratos Premium');
    out=out.replace(/\bAt risk · needs (\d+) actions? in (\d+) days?\b/gi,'En riesgo · necesita $1 acciones en $2 días');
    out=out.replace(/\bAt risk · needs (\d+) actions? in 1 day\b/gi,'En riesgo · necesita $1 acciones en 1 día');
    out=out.replace(/\bTight · needs one action per day\b/gi,'Ajustado · necesita una acción por día');
    out=out.replace(/\bCloud needs attention\b/gi,'La nube necesita atención');
    out=out.replace(/\bTime of day\b/gi,'Hora del día');
    out=out.replace(/\bActive days\b/gi,'Días activos');
    out=out.replace(/\bJournal days\b/gi,'Días de diario');
    out=out.replace(/\bClosest achievements\b/gi,'Logros más cercanos');
    out=out.replace(/\bView achievements\b/gi,'Ver logros');
    out=out.replace(/\b(\d+)\s+days\b/gi,'$1 días');
    out=out.replace(/\bcompleted this week\b/gi,'completadas esta semana');
    out=out.replace(/\bmission per day\b/gi,'misión por día');
    out=out.replace(/\bper day\b/gi,'por día');
    out=out.replace(/\bweek\b/gi,'semana');
    out=out.replace(/\btoday\b/gi,'hoy');
    out=out.replace(/\bSunday\b/g,'domingo');
    out=out.replace(/\bMonday\b/g,'lunes');
    out=out.replace(/\bTuesday\b/g,'martes');
    out=out.replace(/\bWednesday\b/g,'miércoles');
    out=out.replace(/\bThursday\b/g,'jueves');
    out=out.replace(/\bFriday\b/g,'viernes');
    out=out.replace(/\bSaturday\b/g,'sábado');
    out=out.replace(/\bJanuary\b/g,'enero');
    out=out.replace(/\bFebruary\b/g,'febrero');
    out=out.replace(/\bMarch\b/g,'marzo');
    out=out.replace(/\bApril\b/g,'abril');
    out=out.replace(/\bMay\b/g,'mayo');
    out=out.replace(/\bJune\b/g,'junio');
    out=out.replace(/\bJuly\b/g,'julio');
    out=out.replace(/\bAugust\b/g,'agosto');
    out=out.replace(/\bSeptember\b/g,'septiembre');
    out=out.replace(/\bOctober\b/g,'octubre');
    out=out.replace(/\bNovember\b/g,'noviembre');
    out=out.replace(/\bDecember\b/g,'diciembre');
    out=out.replace(/\bdays\s*·/gi,'días ·');
    out=out.replace(/\bNo revisar chats viejos\s+7\s+days\b/gi,'No revisar chats viejos 7 días');
  }
  const partial=language==='es'?[
    [/\bDelete mission\b/g,'Eliminar misión'],[/\bCurrent Mission\b/g,'Misión actual'],
    [/\bCompleted\b/g,'Completada'],[/\bToday\b/g,'Hoy'],[/\bTomorrow\b/g,'Mañana'],
    [/\bYesterday\b/g,'Ayer'],[/\bWeek\b/g,'Semana'],[/\bCoins\b/g,'Monedas'],
    [/\bStreak\b/g,'Racha'],[/\bLevel\b/g,'Nivel'],
    [/\bmissions today\b/gi,'misiones hoy'],[/\bWeek\b/g,'Semana'],[/\bReset\b/g,'Reinicio'],
    [/\bNew phrase\b/g,'Nueva frase'],[/\bOpen affirmations\b/g,'Abrir afirmaciones'],
    [/\bAdded to Next Up\b/g,'Agregada a Siguientes'],[/\bAdded to today\b/g,'Agregada a hoy'],
    [/\bDone today\b/g,'Hecho hoy'],[/\bDone this week\b/g,'Hecho esta semana'],
    [/\bDue today\b/g,'Vence hoy'],[/\bPending today\b/g,'Pendientes de hoy'],
    [/\bAffirmation\b/g,'Afirmación'],[/\bMissions\b/g,'Misiones'],[/\bPremium Contracts\b/g,'Contratos Premium'],
    [/\bStatistics\b/g,'Estadísticas'],[/\bProjects\b/g,'Proyectos'],[/\bAchievements\b/g,'Logros'],
    [/\bSettings\b/g,'Configuración'],[/\bNotifications\b/g,'Notificaciones'],
    [/\bDashboard\b/g,'Inicio'],[/\bThis week\b/g,'Esta semana'],[/\bNew mission\b/g,'Nueva misión'],
    [/\bDelete project\b/g,'Eliminar proyecto'],[/\bDelete archived chapter\b/g,'Eliminar capítulo archivado'],
    [/\bRemove\b/g,'Quitar'],[/\bDelete\b/g,'Eliminar'],[/\bPremium contract\b/gi,'Contrato Premium'],
    [/\bCURRENT CHAPTER\b/g,'CAPÍTULO ACTUAL'],[/\bCURRENT BOSS\b/g,'JEFE ACTUAL'],
    [/\bTOTAL XP\b/g,'XP TOTAL'],[/\bFOCUS\b/g,'ENFOQUE'],[/\bDAY\b/g,'DÍA'],
    [/\bCOMING NEXT\b/g,'SIGUIENTE']
  ]:[
    [/\bMisión actual\b/g,'Current Mission'],[/\bEliminar misión\b/g,'Delete mission'],
    [/\bCompletada\b/g,'Completed'],[/\bHoy\b/g,'Today'],[/\bMañana\b/g,'Tomorrow'],
    [/\bAyer\b/g,'Yesterday'],[/\bSemana\b/g,'Week'],[/\bMonedas\b/g,'Coins'],
    [/\bRacha\b/g,'Streak'],[/\bNivel\b/g,'Level']
  ];
  for(const [re,v] of partial)out=out.replace(re,v);
  return out;
}
function restoreTranslatedNode(node){
  if(!node)return;
  if(node.nodeType===Node.TEXT_NODE){
    const rec=translatedTextNodes.get(node);
    if(rec){
      if(node.nodeValue===rec.translated)node.nodeValue=rec.original;
      translatedTextNodes.delete(node);
    }
    return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const el=node;
  const attrs=translatedAttributes.get(el);
  if(attrs){
    for(const [attr,rec] of attrs.entries()){
      if(el.getAttribute(attr)===rec.translated)el.setAttribute(attr,rec.original);
    }
    translatedAttributes.delete(el);
  }
  [...el.childNodes].forEach(restoreTranslatedNode);
}
function restoreEnglishWeekdayInitials(){
  const sundayFirst=['S','M','T','W','T','F','S'];
  document.querySelectorAll('.v169-day-btn[data-day]').forEach(el=>{
    const idx=Number(el.getAttribute('data-day'));
    if(Number.isInteger(idx)&&idx>=0&&idx<7)el.textContent=sundayFirst[idx];
  });
  const mondayFirst=['M','T','W','T','F','S','S'];
  const parents=[...new Set([...document.querySelectorAll('.v137-day-chip')].map(el=>el.parentElement).filter(Boolean))];
  for(const p of parents){
    const chips=[...p.children].filter(el=>el.matches?.('.v137-day-chip'));
    chips.forEach((el,idx)=>{if(idx<7)el.textContent=mondayFirst[idx]});
  }
}
function translateNode(node){
  if(!node)return;
  if(node.nodeType===Node.TEXT_NODE){
    const p=node.parentElement;
    if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE)$/i.test(p.tagName)||p.isContentEditable)return;
    if(language==='en')return;

    const current=node.nodeValue;
    const previous=translatedTextNodes.get(node);
    if(previous&&current===previous.translated)return;

    const next=mapText(current);
    if(next!==current){
      translatedTextNodes.set(node,{original:current,translated:next});
      node.nodeValue=next;
    }else if(previous){
      translatedTextNodes.delete(node);
    }
    return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const el=node;
  if(/^(SCRIPT|STYLE|CODE|PRE)$/i.test(el.tagName)||el.isContentEditable)return;

  if(language==='es'){
    for(const attr of ['title','aria-label','placeholder']){
      if(el.hasAttribute?.(attr)){
        const old=el.getAttribute(attr);
        let records=translatedAttributes.get(el);
        const prev=records?.get(attr);
        if(prev&&old===prev.translated)continue;
        const next=mapText(old);
        if(next!==old){
          if(!records){records=new Map();translatedAttributes.set(el,records)}
          records.set(attr,{original:old,translated:next});
          el.setAttribute(attr,next);
        }else if(prev){
          records.delete(attr);
          if(!records.size)translatedAttributes.delete(el);
        }
      }
    }
  }
  if(/^(TEXTAREA|INPUT)$/i.test(el.tagName))return;

  if(language==='es'){
    if(el.matches?.('.v169-day-btn[data-day]')){
      const initials=['D','L','M','X','J','V','S'];
      const idx=Number(el.getAttribute('data-day'));
      if(Number.isInteger(idx)&&idx>=0&&idx<7&&el.textContent!==initials[idx])el.textContent=initials[idx];
    }else if(el.matches?.('.v137-day-chip')){
      const siblings=el.parentElement?[...el.parentElement.children].filter(x=>x.matches?.('.v137-day-chip')):[];
      const idx=siblings.indexOf(el);
      const initials=['L','M','X','J','V','S','D'];
      if(idx>=0&&idx<7&&el.textContent!==initials[idx])el.textContent=initials[idx];
    }
  }
  [...el.childNodes].forEach(translateNode);
}
function ensureLanguageControl(){
  const pane=document.querySelector('[data-v30171-pane="general"]')||document.querySelector('#tab-settings');
  if(!pane||pane.querySelector('[data-mlv-language-card]'))return;
  const card=document.createElement('section');
  card.className='card';
  card.dataset.mlvLanguageCard='v1';
  card.innerHTML='<div class="section-title"><div><h2 data-mlv-lang-title>Interface language</h2><p data-mlv-lang-help>Use the language selected during installation the first time Michel’s Life opens. You can change it here anytime.</p></div></div><label style="display:grid;gap:7px;max-width:320px;font-weight:700">Language<select data-mlv-language-select><option value="en">English</option><option value="es">Español</option></select></label>';
  pane.prepend(card);
  const sel=card.querySelector('[data-mlv-language-select]');
  sel.value=language;
  sel.addEventListener('change',()=>setLanguage(sel.value));
  translateNode(card);
}
function ensureTranslationFitStyles(){
  if(document.getElementById('mlv-i18n-fit-style'))return;
  const style=document.createElement('style');
  style.id='mlv-i18n-fit-style';
  style.textContent=`
    html[lang="es"] .mlv-i18n-fit{
      white-space:normal!important;
      overflow:visible!important;
      text-overflow:clip!important;
      overflow-wrap:anywhere!important;
      word-break:normal!important;
      height:auto!important;
      min-height:2.45em!important;
      max-width:100%!important;
      line-height:1.12!important;
      padding-top:.42em!important;
      padding-bottom:.42em!important;
    }
  `;
  document.head.appendChild(style);
}
function fitTranslatedControls(root=document){
  if(language!=='es'||!root?.querySelectorAll)return;
  ensureTranslationFitStyles();
  const controls=[...root.querySelectorAll('button,[role="button"]')];
  for(const el of controls){
    el.classList.remove('mlv-i18n-fit');
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!text)continue;
    try{
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      if(cs.display==='none'||cs.visibility==='hidden'||r.width<=0||r.height<=0)continue;
      if(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1){
        el.classList.add('mlv-i18n-fit');
      }
    }catch(_){}
  }
}
function refresh(root=document.body){
  if(!root)return;
  document.documentElement.lang=language;
  translateNode(root);
  ensureLanguageControl();
  document.querySelectorAll('[data-mlv-language-select]').forEach(s=>s.value=language);
  requestAnimationFrame(()=>fitTranslatedControls(document));
}
function setLanguage(next){
  if(next!=='en'&&next!=='es')return;
  language=next;
  try{localStorage.setItem(KEY,next)}catch(_){}

  if(next==='en'){
    // Restore only values previously changed by this translation layer.
    restoreTranslatedNode(document.body);
    restoreEnglishWeekdayInitials();
  }

  // Re-render canonical application state where supported. Existing global
  // surfaces are still handled by the provenance restoration above.
  try{window.renderAll?.()}catch(_){}
  try{window.LeftNavV30171?.render?.()}catch(_){}

  const apply=()=>{
    if(next==='en'){
      restoreTranslatedNode(document.body);
      restoreEnglishWeekdayInitials();
      document.documentElement.lang='en';
      ensureLanguageControl();
      document.querySelectorAll('[data-mlv-language-select]').forEach(s=>s.value='en');
    }else{
      refresh(document.body);
    }
  };
  apply();
  setTimeout(apply,40);
  setTimeout(apply,180);
  setTimeout(apply,520);
  window.dispatchEvent(new CustomEvent('michelslife:languagechange',{detail:{language:next}}));
}
const mo=new MutationObserver(records=>{
  for(const r of records){
    if(r.type==='characterData'||r.type==='attributes')translateNode(r.target);
    for(const n of r.addedNodes)translateNode(n);
  }
  ensureLanguageControl();
});
function init(){
  refresh(document.body);
  mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});
  setInterval(()=>{
    if(language!=='es')return;
    const badge=document.getElementById('mlv197CloudBadge');
    if(badge)translateNode(badge);

    // Some live panels rewrite their labels after initial render. Re-translate only
    // visible app surfaces so dynamic counters/statuses cannot fall back to English.
    document.querySelectorAll('[id^="tab-"],[role="dialog"],.modal,.drawer').forEach(el=>{
      try{
        const cs=getComputedStyle(el),r=el.getBoundingClientRect();
        if(cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)!==0&&r.width>0&&r.height>0){
          translateNode(el);
          fitTranslatedControls(el);
        }
      }catch(_){}
    });
  },500);
}
let refreshTimer=0;
function queueRefresh(){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>refresh(document.body),30);
  setTimeout(()=>refresh(document.body),140);
  setTimeout(()=>refresh(document.body),520);
}
document.addEventListener('click',queueRefresh,true);
document.addEventListener('change',queueRefresh,true);
window.addEventListener('michelslife:uiupdated',queueRefresh);
window.MichelsLifeI18n={get language(){return language},setLanguage,getLanguage,refresh,mapText};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
