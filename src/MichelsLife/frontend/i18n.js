(function(){
'use strict';
if(window.MichelsLifeI18n)return;

const KEY='michelsLife.language.v1';
const INSTALL_DEFAULT_KEY='michelsLife.language.installDefault.v1';
const USER_OVERRIDE_BASE_KEY='michelsLife.language.userOverrideBase.v1';
const PAIRS={
  "Dashboard":"Inicio","Missions":"Misiones","Premium Contracts":"Contratos Premium","Calendar":"Calendario",
  "Statistics":"Estadísticas","Projects":"Proyectos","Achievements":"Logros","Affirmations":"Afirmaciones",
  "Story":"Historia","Settings":"Configuración","Compare":"Comparar","Weekly Review":"Revisión semanal",
  "General":"General","Themes":"Temas","Color Theme":"Tema de color","Typography":"Tipografía","Gold":"Dorado","gold":"dorado",
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
  "Drop here":"Suelta aquí",
  "due":"pendientes",
  "Calendar · Week":"Calendario · Semana",
  "Drag missions between days and Morning / Afternoon / Night.":"Arrastra misiones entre días y Mañana / Tarde / Noche.",
  "Drag within a stage to plan visually. Moving a recurring mission to another day asks whether you mean only that occurrence or the whole recurring schedule.":"Arrastra dentro de una etapa para planear visualmente. Al mover una misión recurrente a otro día, eliges si cambia sólo esa ocurrencia o todo el horario recurrente.",
  "Move only this occurrence":"Mover sólo esta ocurrencia",
  "Change recurring schedule":"Cambiar horario recurrente",
  "Occurrence moved":"Ocurrencia movida",
  "Occurrence added":"Ocurrencia agregada",
  "Chapter":"Capítulo",
  "Ready to link · ":"Listo para vincular · ",
  "Recovery block":"Bloque de recuperación",
  "Running":"En curso",
  "Paused":"En pausa",
  "Custom":"Personalizado",
  "Break":"Descanso",
  "Skip":"Omitir",
  "Break min":"Min de descanso",
  "None":"Ninguna",
  "blocks":"bloques",
  "Focus block completed: ":"Bloque de enfoque completado: ",
  "Focus block saved: ":"Bloque de enfoque guardado: ",
  "Today’s outlook":"Panorama de hoy",
  "Impossible":"Imposible",
  "No tasks":"Sin tareas",
  "Health issues":"Problemas de salud",
  "Unused":"Sin uso",
  "Too many links":"Demasiados vínculos",
  "Schedule":"Programación",
  "Stale reference":"Referencia obsoleta",
  "No valid category is assigned.":"No tiene una categoría válida asignada.",
  "Repair":"Reparar",
  "Repair stale references":"Reparar referencias obsoletas",
  "Completed this week":"Completadas esta semana",
  "At risk / impossible":"En riesgo / imposible",
  "Premium Contract outlook":"Panorama de Contratos Premium",
  "Automatic weekly status based on linked missions and remaining opportunities.":"Estado semanal automático basado en misiones vinculadas y oportunidades restantes.",
  "Unused, duplicated, overlinked or stale missions.":"Misiones sin uso, duplicadas, sobrevinculadas u obsoletas.",
  "Recent activity":"Actividad reciente",
  "No recent activity yet.":"Aún no hay actividad reciente.",
  "Automatic snapshots":"Instantáneas automáticas",
  "Execution, review & recovery":"Ejecución, revisión y recuperación",
  "Excessive-link warning threshold":"Umbral de advertencia por exceso de vínculos",
  "Recovery snapshots":"Instantáneas de recuperación",
  "Current":"Actual",
  "previous":"anterior",
  "Progress recap":"Resumen de progreso",
  "Completion":"Cumplimiento",
  "XP earned":"XP obtenida",
  "Most active category":"Categoría más activa",
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
  "Full Michel’s Life data, import and reset tools in one place.":"Todos los datos de Michel’s Life, junto con las herramientas de importación y restablecimiento, en un solo lugar.",
  "No stalking / no chasing":"No vigilar / no perseguir",
  "Do not act from anxiety or seek validation.":"No actúes desde la ansiedad ni busques validación.",
  "Emotional Autonomy":"Autonomía emocional",
  "Emotional Autonomy: 0/10":"Autonomía emocional: 0/10",
  "Physical health":"Salud física",
  "Physical health: 0/10":"Salud física: 0/10",
  "Train arms":"Entrenar brazos",
  "Weekly premium fitness contract.":"Contrato premium semanal de acondicionamiento físico.",
  "Close with intention, not chaos.":"Cierra con intención, no con caos.",
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
  "Books, papers or technical reading.":"Libros, artículos o lectura técnica.",
  "Matches move up":"Las coincidencias suben",
  "Filter by category. Search now reorders cards without re-rendering each key.":"Filtra por categoría. La búsqueda ahora reordena las tarjetas sin volver a renderizarlas con cada tecla.",
  "Matches move up. No Goals tab.":"Las coincidencias suben. No hay pestaña de Metas.",
  "Check duplicates now":"Revisar duplicados ahora",
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
  "Move them to today without duplicating existing tasks.":"Muévelas a hoy sin crear duplicados.",
  "Move them to today without creating duplicates.":"Muévelas a hoy sin crear duplicados.",
  "Move all without duplicates":"Mover todas sin duplicados",
  "Do not move anything":"No mover nada",
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
  "Once per new day, the matching mission is placed at #1 automatically.":"Una vez por cada nuevo día, la misión correspondiente se coloca automáticamente en el puesto 1.",
  "Auto-open Today Plan after Plan my day":"Abrir automáticamente el plan de hoy después de «Planear mi día»",
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
  "Positive affirmation 7 days":"Afirmación positiva 7 días",
  "Plan the day 5 times":"Planear el día 5 veces",
  "Legs and glutes 2 times per week":"Piernas y glúteos 2 veces por semana",
  "Make the bed 7 days":"Tender la cama 7 días",
  "Rest without guilt 1 time":"Descansar sin culpa 1 vez",
  "Post or plan content 1 time":"Subir o planear contenido 1 vez",
  "Review followers / following 1 time":"Revisar seguidores / seguidos 1 vez",
  "Organize the desk 3 times":"Organizar el escritorio 3 veces",
  "Review debt / savings 1 time":"Revisar deuda / ahorro 1 vez",
  "Take care of the marmot 1 time":"Cuidar a la marmota 1 vez",
  "Journal entry":"Entrada de diario",
  "Personal Journal":"Diario personal",
  "Write freely…":"Escribe libremente…",
  "Nothing saved yet":"Nada guardado aún",
  "Saving…":"Guardando…",
  "Nothing saved":"Nada guardado",
  "word":"palabra",
  "words":"palabras",
  "Past entries":"Entradas anteriores",
  "Open Journal entry":"Abrir entrada del diario",
  "Seasonal panel":"Panel estacional",
  "Canvas-driven animated month scene.":"Escena mensual animada mediante canvas.",
  "Animated decoration off":"Decoración animada desactivada",
  "Open, execute, and close. No avatar or extra decoration.":"Abre, ejecuta y cierra. Sin avatar ni decoración extra.",
  "Missions by section":"Misiones por sección",
  "Health, education, career, image, autonomy and order.":"Salud, educación, carrera, imagen, autonomía y orden.",
  "Weekly habits with daily XP/coins and a completion bonus.":"Hábitos semanales con XP/monedas diarios y un bono al completar.",
  "Upcoming badges":"Insignias próximas",
  "They replace the character shop/items.":"Reemplazan la tienda y los objetos del personaje.",
  "View all":"Ver todas",
  "Organized by life areas. Secondary actions stay in ⋯ to avoid clutter.":"Organizadas por áreas de vida. Las acciones secundarias quedan en ⋯ para no saturar.",
  "visible":"visibles",
  "Do not suggest":"No sugerir",
  "The character/mascot is no longer the focus. This keeps a sober visual identity based on your categories.":"El personaje o mascota ya no es el foco. Aquí queda una identidad visual sobria basada en tus categorías.",
  "Weekly progress raises your real build.":"El progreso semanal mejora tu progreso real.",
  "The shop was replaced by achievements unlocked through consistency. You do not buy clothes or accessories: you earn status through missions.":"La tienda se reemplazó por logros desbloqueables mediante constancia. No compras ropa ni accesorios: ganas estatus mediante misiones.",
  "Unlocked badges.":"Insignias desbloqueadas.",
  "You do not have any unlocked badges yet. Complete missions by section.":"Aún no tienes insignias desbloqueadas. Completa misiones por sección.",
  "Initial build":"Build inicial",
  "Dominant build:":"Build dominante:",
  "Needs":"Necesita",
  "completions":"completados",
  "but linked tasks are scheduled on only":"pero las tareas vinculadas están programadas sólo en",
  "day":"día",
  "days":"días",
  "left this week":"restantes esta semana",
  "linked":"vinculadas",
  "more":"más",
  "Open Edit to manage all.":"Abre Editar para administrarlas todas.",
  "linked tasks count automatically.":"las tareas vinculadas cuentan automáticamente.",
  "shown":"mostrados",
  "Cards stay rendered":"Las tarjetas permanecen renderizadas",
  "Shown":"Mostrados",
  "Category":"Categoría",
  "Contract board":"Panel de contratos",
  "No Premium Contracts found.":"No se encontraron Contratos Premium.",
  "Task name, category, note...":"Nombre de tarea, categoría, nota...",
  "More":"Más",
  "match moved up":"coincidencia subida",
  "matches moved up":"coincidencias subidas",
  "contracts":"contratos",
  "tasks":"tareas",
  "distinctDays":"días distintos",
  "Undo":"Deshacer",
  "One-off":"Única",
  "Recurring":"Recurrente",
  "Past":"Pasado",
  "Future":"Futuro",
  "Missed":"Perdidas",
  "Carryover":"Arrastre",
  "Scheduled Tasks":"Tareas programadas",
  "scheduled":"programadas",
  "Due":"Pendientes",
  "No scheduled activity in this month.":"No hay actividad programada este mes.",
  "Agenda":"Agenda",
  "Past missed":"Perdidas anteriores",
  "Scheduled one-offs":"Únicas programadas",
  "Month XP":"XP del mes",
  "Edit scheduled task":"Editar tarea programada",
  "Name":"Nombre",
  "Task name":"Nombre de la tarea",
  "Date":"Fecha",
  "Difficulty":"Dificultad",
  "Day stage":"Etapa del día",
  "Description":"Descripción",
  "Favorites, hideable and editable.":"Favoritas, ocultables y editables.",
  "Status":"Estado",
  "Actions":"Acciones",
  "Favorite":"Favorita",
  "Hidden":"Oculta",
  "Visible":"Visible",
  "Show":"Mostrar",
  "Hide":"Ocultar",
  "XP accumulated":"XP acumulados",
  "Compare progress":"Comparar progreso",
  "Today vs yesterday":"Hoy vs ayer",
  "This week vs last week":"Esta semana vs la semana pasada",
  "This month vs last month":"Este mes vs el mes pasado",
  "Current:":"Actual:",
  "previous:":"anterior:",
  "Dominant category":"Categoría dominante",
  "No description yet.":"Sin descripción aún.",
  "active":"activo",
  "Target":"Objetivo",
  "NEXT ACTION":"SIGUIENTE ACCIÓN",
  "No available next action":"No hay una siguiente acción disponible",
  "Blocked by":"Bloqueada por",
  "Blocked by:":"Bloqueada por:",
  "Edit project":"Editar proyecto",
  "Start next":"Iniciar siguiente",
  "Open task":"Abrir tarea",
  "Decision Log":"Registro de decisiones",
  "No decisions recorded yet.":"Aún no hay decisiones registradas.",
  "FOCUS MODE":"MODO ENFOQUE",
  "Choose one mission":"Elige una misión",
  "Resume":"Reanudar",
  "Pause":"Pausar",
  "Stop":"Detener",
  "Exit focus":"Salir del enfoque",
  "Annual Heatmap":"Mapa anual",
  "Maintenance":"Mantenimiento",
  "Start:":"Iniciar:",
  "No command found.":"No se encontró ningún comando.",
  "Project & dependencies":"Proyecto y dependencias",
  "Link this mission to a project and define prerequisite tasks.":"Vincula esta misión a un proyecto y define tareas prerrequisito.",
  "Depends on":"Depende de",
  "Master's Final Arc":"Arco final de la maestría",
  "Moment":"Momento",
  "First thesis experiment validated":"Primer experimento de tesis validado",
  "Detail":"Detalle",
  "Optional context":"Contexto opcional",
  "Add moment":"Agregar momento",
  "Recent completions":"Completados recientes",
  "No completions in this chapter yet.":"Aún no hay completados en este capítulo.",
  "Completed chapters":"Capítulos completados",
  "CHAPTER":"CAPÍTULO",
  "COMPLETE":"COMPLETO",
  "focus":"enfoque",
  "bosses":"jefes",
  "achievements":"logros",
  "Personal milestone":"Hito personal",
  "Project progress":"Progreso del proyecto",
  "Achievement unlocked":"Logro desbloqueado",
  "Project event":"Evento de proyecto",
  "Boss defeated":"Jefe derrotado",
  "Chapter completed":"Capítulo completado",
  "Affirmation of the moment":"Afirmación del momento",
  "Based on your time, progress and build.":"Basada en tu hora, progreso y build.",
  "Self-worth + execution":"Amor propio + ejecución",
  "New affirmation":"Nueva afirmación",
  "Open bank":"Ver banco",
  "Progress panel":"Panel de progreso",
  "Today, week, month and year with a real reading.":"Hoy, semana, mes y año con lectura real.",
  "Global level":"Nivel global",
  "consecutive active days":"días activos seguidos",
  "Boss quests":"Misiones de jefe",
  "resistances defeated":"resistencias derrotadas",
  "For unique pending tasks or today's missions.":"Para pendientes únicos o misiones del día.",
  "Type":"Tipo",
  "Daily":"Diaria",
  "One-off boss quest":"Misión de jefe única",
  "Active missions today":"Misiones activas hoy",
  "Build state":"Estado de la build",
  "E.g. Send CV to Deacero":"Ej. Mandar CV a Deacero",
  "this month":"este mes",
  "this year":"este año",
  "Compact quest-board view. Each mission is edited independently, including repeat days.":"Vista compacta tipo quest board. Cada misión se edita de forma independiente, incluidos sus días de repetición.",
  "Search":"Buscar",
  "Active":"Activas",
  "No missions match these filters.":"No hay misiones con esos filtros.",
  "visible · compact rows":"visibles · filas compactas",
  "Compact reading of real activity, not decoration.":"Lectura compacta de actividad real, no adornos.",
  "Progress by category":"Progreso por categoría",
  "Most recurring missions":"Misiones más recurrentes",
  "Most neglected missions":"Misiones más olvidadas",
  "Unlocked":"Desbloqueado",
  "In progress":"En progreso",
  "Quick Capture Inbox":"Bandeja de captura rápida",
  "Capture first. Decide what it is later.":"Captura primero. Decide después qué es.",
  "Save to Inbox":"Guardar en bandeja",
  "Unprocessed":"Sin procesar",
  "Inbox zero. Nothing is waiting to be processed.":"Bandeja vacía. No hay nada pendiente de procesar.",
  "Weekly Planner":"Planificador semanal",
  "templates":"plantillas",
  "Add weekly":"Agregar semanal",
  "No weekly templates yet.":"Aún no hay plantillas semanales.",
  "Missed — reschedule":"Perdida — reprogramar",
  "Archived missions":"Misiones archivadas",
  "Tasks you archived. Restore anything you want back in Missions.":"Tareas que archivaste. Restaura lo que quieras devolver a Misiones.",
  "archived":"archivadas",
  "Visible filter:":"Filtro visible:",
  "No archived missions in this view.":"No hay misiones archivadas en esta vista.",
  "Created":"Creada",
  "Safe reference cleanup, difficulty calibration and internal health checks.":"Limpieza segura de referencias, calibración de dificultad y comprobaciones internas.",
  "Run safe cleanup":"Ejecutar limpieza segura",
  "Run self-test":"Ejecutar autoprueba",
  "Open Settings cleanup":"Abrir limpieza en Configuración",
  "Technical note":"Nota técnica",
  "Project linking is handled directly from Dashboard mission cards. The old mission-splitting workflow has been removed.":"La vinculación de proyectos se gestiona directamente desde las tarjetas de misión de Inicio. El flujo antiguo para dividir misiones fue eliminado.",
  "Runtime health":"Salud de ejecución",
  "Difficulty calibration":"Calibración de dificultad",
  "Suggestions are based on the mission’s scheduled completion rate, not on unscheduled rest days.":"Las sugerencias se basan en la tasa de cumplimiento programada de la misión, no en días de descanso no programados.",
  "No missions need calibration right now.":"Ninguna misión necesita calibración ahora.",
  "Make easier":"Hacer más fácil",
  "completion rate over scheduled opportunities":"de cumplimiento sobre oportunidades programadas",
  "duplicate ID detected.":"ID duplicado detectado.",
  "duplicate IDs detected.":"IDs duplicados detectados.",
  "missing mission.":"misión faltante.",
  "Orphan dependencies":"Dependencias huérfanas",
  "missing dependency reference.":"referencia de dependencia faltante.",
  "missing dependency references.":"referencias de dependencia faltantes.",
  "missing task reference.":"referencia de tarea faltante.",
  "missing task references.":"referencias de tarea faltantes.",
  "Runtime references":"Referencias de ejecución",
  "No orphan or duplicate references found.":"No se encontraron referencias huérfanas ni duplicadas.",
  "The mission may be too broad to start easily.":"La misión puede ser demasiado amplia para empezar con facilidad.",
  "Completed only":"Completó sólo",
  "of":"de",
  "scheduled sessions.":"sesiones programadas.",
  "soft":"suave",
  "direct":"directa",
  "intense":"intensa",
  "Total reset":"Reinicio total",
  "Current stage:":"Etapa actual:",
  "Create new mission":"Crear misión nueva",
  "Quick, editable and with its own days":"Rápida, editable y con días propios",
  "E.g. Wash the dishes":"Ej. Lavar los trastes",
  "Priority":"Prioridad",
  "Deadline":"Fecha límite",
  "These days belong only to this mission.":"Estos días pertenecen solo a esta misión.",
  "Do not suggest again":"No volver a sugerir",
  "Each mission has its own calendar. Change the days here and this mission will repeat only on those days, without affecting the others.":"Cada misión tiene calendario propio. Cambia los días aquí y esa misión se repetirá sólo en esos días, sin afectar a las demás.",
  "Internal notes":"Notas internas",
  "Select exactly which days this mission applies. For one-off tasks, the days are kept if you later convert it into a habit.":"Selecciona exactamente qué días aplica esta misión. Para tareas únicas, los días se conservan si después la conviertes en hábito.",
  "Fixed at top":"Fija arriba",
  "Developer · Michel’s Lab":"Desarrollador · Michel’s Lab",
  "Contact:":"Contacto:",
  "APP":"APLICACIÓN",
  "VERSION":"VERSIÓN",
  "LICENSE":"LICENCIA",
  "Midnights default":"Midnights predeterminado",
  "SELECTED":"SELECCIONADA",
  "PREVIEW":"VISTA PREVIA",
  "Pomodoro Focus Timer":"Temporizador de enfoque Pomodoro",
  "Classic Pomodoro":"Pomodoro clásico",
  "Break minutes":"Minutos de descanso",
  "PRESET":"PREAJUSTE",
  "Physical strength":"Fortaleza física",
  "Master’s / science":"Maestría / ciencia",
  "Discipline and order":"Disciplina y orden",
  "Other":"Otra",
  "Low":"Baja",
  "High":"Alta",
  "Critical":"Crítica",
  "Pet":"Mascota",
  "Goals":"Metas",
  "Forge Apprentice":"Aprendiz de Forja",
  "Combat Student":"Estudiante en Combate",
  "Focus Mode Researcher":"Investigador en Modo Foco",
  "Steel Alchemist":"Alquimista del Acero",
  "Industry Candidate":"Candidato a Industria",
  "Thesis Boss":"Boss de Tesis",
  "Deacero Mode":"Modo Deacero",
  "Architect of Your Life":"Arquitecto de su Vida",
  "Legendary Character":"Personaje Legendario",
  "The day does not weigh on you yet. This is where you gain an edge.":"El día todavía no pesa. Aquí es donde se gana ventaja.",
  "Before the world asks anything of you, build something for yourself.":"Antes de que el mundo pida algo, construye algo para ti.",
  "A clean start does not need perfect motivation; it needs a first action.":"Un inicio limpio no necesita motivación perfecta, necesita una primera acción.",
  "Today does not begin with intention; it begins with evidence.":"Hoy no empieza con intención; empieza con evidencia.",
  "Morning belongs to whoever decides before bargaining with themselves.":"La mañana es territorio de quien decide antes de negociar consigo mismo.",
  "This is the time to attack what matters, not decorate your to-do list.":"Esta es la hora de atacar lo importante, no de decorar pendientes.",
  "If you complete one strong mission early, the rest of the day stops feeling lost.":"Si haces una misión fuerte temprano, el resto del día deja de sentirse perdido.",
  "Your future self does not need promises; it needs you to open the first task.":"Tu versión futura no necesita promesas; necesita que abras la primera tarea.",
  "Momentum is built, not found.":"El momentum se fabrica, no aparece.",
  "Today is built before laziness shows up.":"Hoy se construye antes de que dé flojera.",
  "Midday: there is still room to turn it into evidence.":"Mitad del día: todavía hay espacio para convertirlo en evidencia.",
  "Check the board: if a category is at zero, rescue it now.":"Revisa el tablero: si una categoría está en cero, rescátala ahora.",
  "Do not let the day become pure noise. Choose a mission with impact.":"No dejes que el día se vuelva puro ruido. Elige una misión con impacto.",
  "One hard task at midday can change the entire reading of the day.":"Una tarea difícil al mediodía puede cambiar toda la lectura del día.",
  "It is not too late. But it is not early anymore.":"Todavía no es tarde. Pero ya no es temprano.",
  "The afternoon is not defeat; it is a second chance.":"La tarde no es derrota; es segunda oportunidad.",
  "If the morning slipped away, you can still rescue the day with one real action.":"Si la mañana se fue, todavía puedes rescatar el día con una acción real.",
  "You do not need to complete everything. You need to not abandon the board.":"No necesitas completar todo. Necesitas no abandonar el tablero.",
  "Do one mission that gives the day direction again.":"Haz una misión que le devuelva dirección al día.",
  "This is where fantasy separates from discipline: when you are already tired.":"Aquí se separa la fantasía de la disciplina: cuando ya estás cansado.",
  "Night does not ask for perfection; it asks for closure.":"La noche no pide perfección; pide cierre.",
  "Complete something small and leave the day with evidence.":"Completa algo pequeño y deja el día con evidencia.",
  "Putting your space in order also counts as regaining control.":"Ordenar tu espacio también cuenta como recuperar control.",
  "If you cannot move much forward, at least do not end in chaos.":"Si no puedes avanzar mucho, al menos no termines en caos.",
  "Close the day like someone who respects themselves.":"Cierra el día como alguien que se respeta.",
  "Last call: one small mission or real rest.":"Última llamada: una misión pequeña o descanso real.",
  "Do not turn exhaustion into impulses. Close cleanly.":"No conviertas el cansancio en impulsos. Cierra limpio.",
  "If the day was heavy, do not punish it with more disorder.":"Si el día fue pesado, no lo castigues con más desorden.",
  "Finish with one honest action, not an empty promise.":"Termina con una acción honesta, no con una promesa vacía.",
  "This was not symbolic: it was real physical construction.":"Esto no fue simbólico: fue construcción física real.",
  "Every set counts because the body does not believe in plans; it believes in repetition.":"Cada serie cuenta porque el cuerpo no cree en planes, cree en repetición.",
  "Today your physical build got evidence.":"Hoy tu build física recibió evidencia.",
  "You did not train only for aesthetics; you trained presence.":"No entrenaste por estética solamente; entrenaste presencia.",
  "Strength is identity put into action too.":"La fuerza también es identidad ejecutada.",
  "Every academic block shortens the distance between you and finishing your master’s.":"Cada bloque académico reduce la distancia entre tú y el cierre de maestría.",
  "The thesis does not get finished by thinking about it; it gets finished by touching it every day.":"La tesis no se termina pensando en ella; se termina tocándola todos los días.",
  "Today you did not romanticize intelligence; you used it.":"Hoy no romantizaste la inteligencia: la usaste.",
  "Science is also built in uncomfortable blocks.":"La ciencia también se construye en bloques incómodos.",
  "A small thesis advance is still a crack in the resistance.":"Un avance pequeño en tesis sigue siendo una grieta en la resistencia.",
  "This actually moves your future. Career readiness went up.":"Esto sí mueve tu futuro. Carrera profesional subió.",
  "Every application, CV adjustment or technical practice brings your industry version closer.":"Cada aplicación, ajuste de CV o práctica técnica acerca tu versión industria.",
  "Opportunity does not find you the same way if you prepared today.":"La oportunidad no te encuentra igual si hoy te preparaste.",
  "Your career future needs less anxiety and more trackable actions.":"Tu futuro laboral necesita menos ansiedad y más acciones rastreables.",
  "Industry mode is not activated by desire; it is activated by preparation.":"Modo industria no se activa con deseo; se activa con preparación.",
  "This counts too. Discipline is not only gym or thesis; it is also not living in chaos.":"Esto también cuenta. Disciplina no es solo gym o tesis; también es no vivir en caos.",
  "Small, yes. Irrelevant, no. Organizing your space also organizes your day.":"Pequeño, sí. Irrelevante, no. Ordenar tu espacio también ordena tu día.",
  "Doing the dishes is not glamorous, but it is self-governance.":"Lavar trastes no es glamour, pero sí es gobierno personal.",
  "Less chaos in your space means less noise in your mind.":"Un espacio menos caótico es una mente con menos ruido.",
  "Real life also levels up through basic tasks.":"La vida real también se sube de nivel con tareas básicas.",
  "Self-worth is not only saying nice things to yourself; it is not betraying yourself in the basics.":"Amor propio no es solo decirte cosas bonitas; es no traicionarte en lo básico.",
  "Today you chose to treat yourself like someone worth the effort.":"Hoy elegiste tratarte como alguien que vale esfuerzo.",
  "Recognizing your progress is discipline too.":"Reconocer tu avance también es disciplina.",
  "You do not need to destroy yourself to improve.":"No necesitas destruirte para mejorar.",
  "The version you want to become also needs care, not just pressure.":"La versión que quieres ser también necesita cuidado, no solo presión.",
  "That was self-control. It was not visible from the outside, but it counts as real strength.":"Eso fue autocontrol. No se vio desde fuera, pero cuenta como fuerza real.",
  "Not reacting is also an action.":"No reaccionar también es una acción.",
  "Choosing yourself in silence is still choosing yourself.":"Elegirte en silencio sigue siendo elegirse.",
  "Today you did not chase. That also builds identity.":"Hoy no perseguiste. Eso también construye identidad.",
  "Dignity also needs repetition.":"La dignidad también necesita repetición.",
  "Caring for your image is not empty when it is connected to self-respect.":"Cuidar tu imagen no es vacío si está conectado con respeto propio.",
  "Presence is not just a photo; it is coherence between body, style and energy.":"Presencia no es solo foto; es coherencia entre cuerpo, estilo y energía.",
  "Today you refined how you present yourself to the world.":"Hoy puliste cómo te presentas al mundo.",
  "Aesthetics carry more weight when discipline is behind them.":"La estética pesa más cuando hay disciplina detrás.",
  "It is not about looking like someone new; it is about backing it up.":"No se trata de parecer alguien nuevo, sino de respaldarlo.",
  "Today is at zero, but you can still save it with an easy mission.":"Hoy está en cero, pero todavía puedes salvarlo con una misión fácil.",
  "You do not need to fix your whole life today. Just do not leave the board empty.":"No necesitas arreglar toda tu vida hoy. Solo evita que el tablero quede vacío.",
  "One small action breaks the spell of a lost day.":"Una acción pequeña rompe el hechizo del día perdido.",
  "Zero is not a sentence; it is a signal to start small.":"Cero no es sentencia, es señal de empezar mínimo.",
  "Choose a five-minute mission. Identity is rescued in small actions.":"Elige una misión de cinco minutos. La identidad se rescata en pequeño.",
  "Today has evidence. Do not minimize it.":"Hoy sí hay evidencia. No lo minimices.",
  "This was not a day of intention; it was a day of execution.":"Este no fue un día de intención, fue un día de ejecución.",
  "Your character leveled up because your actions supported it.":"Tu personaje subió porque tus acciones lo sostuvieron.",
  "Progress becomes visible when it leaves a trail.":"El progreso se nota cuando deja rastro.",
  "Today you did not talk about discipline; you logged it.":"Hoy no hablaste de disciplina: la registraste.",
  "Yesterday left pending missions. You can recover one today without duplicating your list.":"Ayer quedaron pendientes. Puedes recuperar uno hoy sin duplicar tu lista.",
  "Do not drag guilt forward; drag only the mission that still matters.":"No arrastres culpa; arrastra solo la misión que todavía importa.",
  "Recovering a pending task is not failure; it is closing loops.":"Recuperar un pendiente no es fallar, es cerrar ciclos.",
  "If it already exists today, it will not be duplicated. If it still matters, it gets rescued.":"Si ya existe hoy, no se duplica. Si todavía importa, se rescata.",
  "The system does not punish you; it helps you clean up loose ends.":"El sistema no te castiga: te ayuda a limpiar cabos sueltos.",
  "Boss Quest defeated. This was not just any task: you just broke through resistance.":"Boss Quest derrotada. Esta no era una tarea cualquiera: acabas de romper resistencia.",
  "The hard thing lost power the moment you turned it into action.":"Lo difícil perdió poder en cuanto lo convertiste en acción.",
  "This progress changes the weight of the day.":"Este avance cambia el peso del día.",
  "Defeating a Boss Quest counts twice: for the result and for the courage.":"Derrotar una boss quest cuenta doble: por resultado y por valentía.",
  "Resistance was beaten with evidence.":"La resistencia se venció con evidencia.",
  "Interface rule:":"Regla de interfaz:",
  "Michel’s Life is created and maintained by Michel Duarte under Michel’s Lab. Independent software focused on productivity, life systems and personal tools.":"Michel’s Life es creada y mantenida por Michel Duarte bajo Michel’s Lab. Software independiente enfocado en productividad, sistemas de vida y herramientas personales.",
  "Email":"Correo",
  "Live Preview":"Vista previa en vivo",
  "Sidebar":"Barra lateral",
  "Navigation":"Navegación",
  "Header / Hero":"Encabezado / Portada",
  "Main Panel":"Panel principal",
  "Inner Card":"Tarjeta interna",
  "Mission / KPI / contract":"Misión / KPI / contrato",
  "Dock":"Dock",
  "Panel opacity":"Opacidad de paneles",
  "Header / hero":"Encabezado / portada",
  "Inner card":"Tarjeta interna",
  "Chapter Scene Packs":"Paquetes de escenas de capítulo",
  "Current Chapter only. Artwork and ambient motion stay independent from the general Michel’s Life background.":"Sólo para el Capítulo actual. El arte y el movimiento ambiental se mantienen independientes del fondo general de Michel’s Life.",
  "Your name":"Tu nombre",
  "What should Michel’s Life call you?":"¿Cómo quieres que Michel’s Life te llame?",
  "Choose a starting world":"Elige un mundo inicial",
  "What do you want to build?":"¿Qué quieres construir?",
  "These choices only create a light starter setup. You can add, edit or delete anything later.":"Estas opciones sólo crean una configuración inicial ligera. Puedes agregar, editar o eliminar lo que quieras después.",
  "Starter schedule":"Horario inicial",
  "Weekdays":"Entre semana",
  "Every day":"Todos los días",
  "3× per week":"3× por semana",
  "Create starter missions":"Crear misiones iniciales",
  "One editable mission for each selected focus.":"Una misión editable por cada enfoque seleccionado.",
  "Create Premium Contracts":"Crear Contratos Premium",
  "Add one generic weekly target for each selected focus.":"Agrega una meta semanal genérica por cada enfoque seleccionado.",
  "Open Google setup after onboarding":"Abrir configuración de Google después del inicio",
  "Cloud Sync is optional and can be connected later.":"La sincronización en la nube es opcional y puede conectarse después.",
  "Nothing is locked in":"Nada queda bloqueado",
  "All starter content remains fully editable after setup.":"Todo el contenido inicial sigue siendo editable después de la configuración.",
  "Welcome to Michel’s Life":"Bienvenido a Michel’s Life",
  "Choose your focus":"Elige tu enfoque",
  "Start empty":"Empezar vacío",
  "Back":"Atrás",
  "Finish setup":"Finalizar configuración",
  "Continue":"Continuar",
  "Safe updates":"Actualizaciones seguras",
  "Detected update":"Actualización detectada",
  "None found":"Ninguna encontrada",
  "Local scan":"Escaneo local",
  "App folder + Downloads":"Carpeta de la app + Descargas",
  "Newer Michel’s Life EXE":"EXE más reciente de Michel’s Life",
  "was detected as a newer build.":"se detectó como una compilación más reciente.",
  "Checking…":"Comprobando…",
  "Install detected update":"Instalar actualización detectada",
  "The built-in updater can detect newer Michel’s Life executables already downloaded to this PC. Installing creates a restore point, closes this build, replaces the EXE and relaunches using the same WebView2 profile. An online release feed can be connected later without changing this safety layer.":"El actualizador integrado puede detectar ejecutables más recientes de Michel’s Life ya descargados en esta PC. Al instalar, crea un punto de restauración, cierra esta compilación, reemplaza el EXE y vuelve a iniciar usando el mismo perfil de WebView2. Más adelante se puede conectar un canal de versiones en línea sin cambiar esta capa de seguridad.",
  "Original Dynamic Sky":"Cielo dinámico original",
  "Space Worlds":"Mundos espaciales",
  "Surreal Worlds":"Mundos surrealistas",
  "Fantasy Beasts":"Bestias fantásticas",
  "Naruto World":"Mundo de Naruto",
  "Undersea Giants":"Gigantes submarinos",
  "Deep Ocean":"Océano profundo",
  "Cyberpunk Neon Rain":"Lluvia de neón cyberpunk",
  "Deep Forest Fantasy":"Fantasía de bosque profundo",
  "Arctic Aurora":"Aurora ártica",
  "Bioluminescent Cave World":"Mundo de cuevas bioluminiscentes",
  "Toxic Phosphorescent River":"Río fosforescente tóxico",
  "Obsidian Empire":"Imperio de obsidiana",
  "Celestial Garden":"Jardín celestial",
  "Golden Dunes":"Dunas doradas",
  "Dark Kingdom":"Reino oscuro",
  "Industrial Forge":"Forja industrial",
  "Samurai Storm":"Tormenta samurái",
  "Mesoamerican Empire":"Imperio mesoamericano",
  "Brutalist Megastructures":"Megaestructuras brutalistas",
  "Desert Apocalypse":"Apocalipsis desértico",
  "Gothic Cathedral":"Catedral gótica",
  "Celestial Citadel":"Ciudadela celestial",
  "Frostveil Bastion":"Bastión Velo Helado",
  "Sunken Sanctuary":"Santuario sumergido",
  "Verdant Monoliths":"Monolitos verdes",
  "Connected":"Conectado",
  "Reconnect":"Reconectar",
  "Never":"Nunca",
  "Confirm":"Confirmar",
  "Offline":"Sin conexión",
  "On":"Activado",
  "Off":"Desactivado",
  "press Connect Google, finish authorization in your browser, then return to Michel’s Life. Status and errors stay in this panel.":"presiona Conectar Google, termina la autorización en tu navegador y luego regresa a Michel’s Life. El estado y los errores permanecen en este panel.",
  "Recovery & maintenance":"Recuperación y mantenimiento",
  "Generic safety tools for this installation.":"Herramientas generales de seguridad para esta instalación.",
  "Create restore point now":"Crear punto de restauración ahora",
  "Repair local data":"Reparar datos locales",
  "Automatic restore points are also created before resets, imports and cloud-history restores. Repair local data normalizes saved structures without intentionally deleting missions or progress.":"Los puntos de restauración automáticos también se crean antes de reinicios, importaciones y restauraciones del historial en la nube. Reparar datos locales normaliza las estructuras guardadas sin eliminar intencionalmente misiones ni progreso.",
  "Recent technical activity":"Actividad técnica reciente",
  "Short device-local log for sync and recovery diagnostics.":"Registro local breve del dispositivo para diagnósticos de sincronización y recuperación.",
  "No technical activity recorded yet.":"Aún no hay actividad técnica registrada.",
  "Setup complete":"Configuración completada",
  "Update check":"Comprobación de actualización",
  "Update prepared":"Actualización preparada",
  "New build":"Nueva compilación",
  "is ready. Michel’s Life will restart automatically.":"está lista. Michel’s Life se reiniciará automáticamente.",
  "Automatic cloud safety copy":"Copia de seguridad automática en la nube",
  "Before app reset":"Antes de reiniciar la app",
  "Before app update":"Antes de actualizar la app",
  "Before backup import":"Antes de importar un respaldo",
  "Before cloud restore":"Antes de restaurar desde la nube",
  "Before local data repair":"Antes de reparar los datos locales",
  "Before manual cloud upload":"Antes de la carga manual a la nube",
  "Before newer PC upload":"Antes de cargar desde una PC más reciente",
  "Before progress reset":"Antes de reiniciar el progreso",
  "Before timeline restore":"Antes de restaurar desde la línea de tiempo",
  "Current state":"Estado actual",
  "Current summary unavailable.":"Resumen actual no disponible.",
  "Every restore first saves your current state.":"Cada restauración guarda primero tu estado actual.",
  "Legacy backup · summary unavailable":"Respaldo antiguo · resumen no disponible",
  "Local restore points and Google Drive history in one chronological view.":"Puntos de restauración locales e historial de Google Drive en una sola vista cronológica.",
  "Manual restore point":"Punto de restauración manual",
  "Michel’s Life will create a new restore point of your current state before loading the selected backup.":"Michel’s Life creará un nuevo punto de restauración de tu estado actual antes de cargar el respaldo seleccionado.",
  "No restore points yet. Michel’s Life will add them automatically before risky operations, or you can create one manually below.":"Aún no hay puntos de restauración. Michel’s Life los agregará automáticamente antes de operaciones de riesgo, o puedes crear uno manualmente abajo.",
  "Restore point":"Punto de restauración",
  "Restore this saved state?":"¿Restaurar este estado guardado?",
  "Restoring…":"Restaurando…",
  "Right now":"Ahora mismo",
  "Safety first:":"Seguridad primero:",
  "Selected backup":"Respaldo seleccionado",
  "Unknown date":"Fecha desconocida",
  "Unknown device":"Dispositivo desconocido",
  "Unknown time":"Hora desconocida",
  "Version unavailable":"Versión no disponible",
  "this saved state":"este estado guardado",
  "Refreshing…":"Actualizando…",
  "Refresh":"Actualizar",
  "Backup restored":"Respaldo restaurado",
  "Action needed":"Acción necesaria",
  "Almost done":"Casi listo",
  "Analyze":"Analizar",
  "Analyze all links":"Analizar todos los vínculos",
  "Available missions":"Misiones disponibles",
  "Create and link":"Crear y vincular",
  "Create linked mission":"Crear misión vinculada",
  "Currently linked":"Vinculadas actualmente",
  "Existing links are checked. Review the list and select any additional missions manually.":"Los vínculos existentes están marcados. Revisa la lista y selecciona manualmente cualquier misión adicional.",
  "Linked mission":"Misión vinculada",
  "Mission name":"Nombre de la misión",
  "Mode":"Modo",
  "Monday–Friday":"Lunes–viernes",
  "Mute":"Silenciar",
  "No progress yet":"Aún sin progreso",
  "No regular missions are available. Create one instead.":"No hay misiones regulares disponibles. Crea una en su lugar.",
  "Overdue":"Vencida",
  "Premium Contract at risk":"Contrato Premium en riesgo",
  "Read all":"Marcar todo como leído",
  "Repeat":"Repetición",
  "Reset muted alerts":"Restablecer alertas silenciadas",
  "Review linked missions":"Revisar misiones vinculadas",
  "Review links":"Revisar vínculos",
  "Save links":"Guardar vínculos",
  "Strong matches":"Coincidencias fuertes",
  "Today only":"Sólo hoy",
  "Unread":"No leídas",
  "What exactly counts as progress?":"¿Qué cuenta exactamente como progreso?",
  "You are caught up. No useful alerts right now.":"Estás al día. No hay alertas útiles por ahora.",
  "Suggestions":"Sugerencias",
  "Progress":"Progreso",
  "Review contract":"Revisar contrato",
  "Links added":"Vínculos agregados",
};
const SPANISH_SYSTEM_DEFAULTS={
  "Read 30 minutes at night 3 times":"Leer 30 minutos de noche 3 veces",
  "Use home equipment 2 times":"Usar equipo de casa 2 veces",
  "Prepare food 3 times":"Preparar comida 3 veces",
  "Cardio or walking 2 times":"Cardio o caminata 2 veces",
  "OpenFOAM / CFD 2 sessions":"OpenFOAM / CFD 2 sesiones",
  "Work min":"Min de trabajo",
  "Work on thesis 45 minutes":"Trabajar en la tesis 45 minutos",
  "Real progress on thesis, simulations or writing.":"Progreso real en la tesis, simulaciones o escritura.",
  "Work on thesis 5 blocks":"Trabajar en la tesis 5 bloques",
  "Read all":"Leer todo",
  "Animated decoration on":"Decoración animada activada",
  "Deep work":"Trabajo profundo",
  "Work minutes":"Minutos de trabajo",
  "Work":"Trabajo",
  "Analyze all links":"Analizar todos los vínculos",
  "Monumental walled-city landscapes across six stages.":"Paisajes monumentales de una ciudad amurallada a lo largo de seis etapas.",
  "© 2026 Michel Duarte / Michel’s Lab. All rights reserved.":"© 2026 Michel Duarte / Michel’s Lab. Todos los derechos reservados.",
  "Last 14 days. The gold bar is today.":"Últimos 14 días. La barra dorada es hoy.",
  "Today vs yesterday":"Hoy vs ayer",
  "This month vs last month":"Este mes vs mes pasado",
  "Last 12 months":"Últimos 12 meses",
  "Last 5 years":"Últimos 5 años",
  "Undo last action":"Deshacer última acción",
  "Do not call the day lost while there is still leverage.":"No des el día por perdido mientras todavía haya margen."
};

const REVERSE=Object.fromEntries(Object.entries(PAIRS).map(([en,es])=>[es,en]));

// Long system phrases can appear inside a larger dynamic node (greeting + date +
// message, counters + labels, etc.). Translate those phrases before individual
// word substitutions so we never manufacture mixed-language sentences.
const EMBEDDED_SYSTEM_PAIRS=Object.entries(PAIRS)
  .filter(([en])=>/[.!?]/.test(en)||en.trim().split(/\s+/).length>=4)
  .sort((a,b)=>b[0].length-a[0].length);
const PAIR_KEYS_CASEFOLD=new Map(Object.keys(PAIRS).map(k=>[k.toLocaleLowerCase('en-US'),k]));

function escapeI18nRegExp(value){
  return String(value).replace(/[\\^$.*+?()[\]{}|]/g,'\\$&');
}

// Legacy UI can contain a known system sentence with only a few tokens already
// translated. Reconstruct a candidate English sentence, but accept it ONLY when
// it resolves to a known PAIRS entry. Arbitrary user-authored Spanish is left alone.
function repairLegacyMixedSystemCopy(value){
  const original=String(value);
  const tokenSets=[
    [
      ['misiones','missions'],['misión','mission'],['hoy','today'],['ayer','yesterday'],
      ['mañana','tomorrow'],['semanal','weekly'],['semana','week'],
      ['completadas','completed'],['completada','completed'],
      ['pendientes','pending'],['pendiente','pending']
    ],
    [
      ['misiones','missions'],['misión','mission'],['hoy','today'],['ayer','yesterday'],
      ['mañana','morning'],['semanal','weekly'],['semana','week'],
      ['completadas','completed'],['completada','completed'],
      ['pendientes','pending'],['pendiente','pending']
    ]
  ];
  for(const tokenSet of tokenSets){
    let candidate=original;
    for(const [es,en] of tokenSet){
      candidate=candidate.replace(new RegExp('\\b'+escapeI18nRegExp(es)+'\\b','gi'),en);
    }
    if(candidate===original)continue;
    const trimmed=candidate.trim();
    const canonical=PAIR_KEYS_CASEFOLD.get(trimmed.toLocaleLowerCase('en-US'));
    if(canonical){
      const at=candidate.indexOf(trimmed);
      return candidate.slice(0,at)+PAIRS[canonical]+candidate.slice(at+trimmed.length);
    }
    const lower=candidate.toLocaleLowerCase('en-US');
    for(const [en] of EMBEDDED_SYSTEM_PAIRS){
      const at=lower.indexOf(en.toLocaleLowerCase('en-US'));
      if(at>=0){
        return candidate.slice(0,at)+en+candidate.slice(at+en.length);
      }
    }
  }
  return original;
}

function replaceEmbeddedSystemPhrases(value,targetLanguage){
  let out=String(value);
  const pairs=targetLanguage==='es'
    ? EMBEDDED_SYSTEM_PAIRS
    : EMBEDDED_SYSTEM_PAIRS.map(([en,es])=>[es,en]).sort((a,b)=>b[0].length-a[0].length);
  for(const [from,to] of pairs){
    if(from&&out.includes(from))out=out.split(from).join(to);
  }
  return out;
}

function normalizeDynamicSystemCopy(value,targetLanguage){
  let out=String(value);
  if(targetLanguage==='es'){
    out=out.replace(
      /(?:You have|Tienes)\s+(\d+)\s+(?:(?:pending|pendiente|pendientes)\s+)?(?:mission|missions|misión|misiones)(?:\s+(?:pending|pendiente|pendientes))?\s+(?:from yesterday|de ayer)\.?/gi,
      (_,n)=>`Tienes ${n} ${Number(n)===1?'misión pendiente':'misiones pendientes'} de ayer.`
    );
    out=out.replace(
      /(?:Move them to|Muévelas a)\s+(?:today|hoy)\s+(?:without creating duplicates|without duplicating existing tasks|sin crear duplicados|sin duplicar tareas existentes)\.?/gi,
      'Muévelas a hoy sin crear duplicados.'
    );
    out=out.replace(/(?:Move all|Mover todas)\s+(?:without duplicates|sin duplicados)/gi,'Mover todas sin duplicados');
    out=out.replace(/(?:Do not move anything|No mover nada)/gi,'No mover nada');
    // Repair already-corrupted mixed nodes from earlier translation passes.
    out=out.replace(/One focused action is enough to change the reading of (?:today|hoy)\./gi,'Una acción enfocada basta para cambiar cómo se lee el día.');
    return out;
  }

  out=out.replace(
    /(?:Tienes|You have)\s+(\d+)\s+(?:(?:pending|pendiente|pendientes)\s+)?(?:misión|misiones|mission|missions)(?:\s+(?:pending|pendiente|pendientes))?\s+(?:de ayer|from yesterday)\.?/gi,
    (_,n)=>`You have ${n} pending ${Number(n)===1?'mission':'missions'} from yesterday.`
  );
  out=out.replace(
    /(?:Muévelas a|Move them to)\s+(?:hoy|today)\s+(?:sin crear duplicados|sin duplicar tareas existentes|without creating duplicates|without duplicating existing tasks)\.?/gi,
    'Move them to today without creating duplicates.'
  );
  out=out.replace(/(?:Mover todas|Move all)\s+(?:sin duplicados|without duplicates)/gi,'Move all without duplicates');
  out=out.replace(/(?:No mover nada|Do not move anything)/gi,'Do not move anything');
  out=out.replace(/Una acción enfocada basta para cambiar cómo se lee el día\./gi,'One focused action is enough to change the reading of today.');
  return out;
}

function restoreEnglishDateCopy(value){
  let out=String(value);
  out=out.replace(/\bBuenos días\b/gi,'Good morning');
  out=out.replace(/\bBuenas tardes\b/gi,'Good afternoon');
  out=out.replace(/\bBuenas noches\b/gi,'Good evening');
  out=out.replace(/\bNoche tardía\b/gi,'Late night');

  const fullDays={domingo:'Sunday',lunes:'Monday',martes:'Tuesday','miércoles':'Wednesday',jueves:'Thursday',viernes:'Friday','sábado':'Saturday'};
  const fullMonths={enero:'January',febrero:'February',marzo:'March',abril:'April',mayo:'May',junio:'June',julio:'July',agosto:'August',septiembre:'September',octubre:'October',noviembre:'November',diciembre:'December'};
  const shortDays={dom:'Sun',lun:'Mon',mar:'Tue','mié':'Wed',jue:'Thu',vie:'Fri','sáb':'Sat'};
  const shortMonths={ene:'Jan',feb:'Feb',mar:'Mar',abr:'Apr',may:'May',jun:'Jun',jul:'Jul',ago:'Aug',sep:'Sep',oct:'Oct',nov:'Nov',dic:'Dec'};

  // Replace only actual UI date shapes, not arbitrary Spanish words in user data.
  out=out.replace(/\b(domingo|lunes|martes|miércoles|jueves|viernes|sábado)\s*,\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{1,2})\b/gi,
    (_,d,m,n)=>`${fullDays[d.toLowerCase()]}, ${fullMonths[m.toLowerCase()]} ${n}`);
  out=out.replace(/\b(dom|lun|mar|mié|jue|vie|sáb)\s*,\s*(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+(\d{1,2})\b/gi,
    (_,d,m,n)=>`${shortDays[d.toLowerCase()]}, ${shortMonths[m.toLowerCase()]} ${n}`);

  const trimmed=out.trim().toLowerCase();
  if(fullDays[trimmed])return out.replace(out.trim(),fullDays[trimmed]);
  if(fullMonths[trimmed])return out.replace(out.trim(),fullMonths[trimmed]);
  return out;
}

// Narrow normalization for legacy/default system content that is already
// Spanish in the base bundle. This is intentionally NOT a general reverse
// translator, so user-authored Spanish remains untouched in English mode.
const ENGLISH_EMBEDDED_LEGACY_DEFAULTS={
  "Leer 30 minutos de noche 3 veces":"Read 30 minutes at night 3 times",
  "Read 30 minutos de noche 3 times":"Read 30 minutes at night 3 times",
  "Revisión weekly":"Weekly Review",
  "Usar equipo de casa 2 veces":"Use home equipment 2 times",
  "Usar equipo de casa 2 times":"Use home equipment 2 times",
  "Preparar comida 3 veces":"Prepare food 3 times",
  "Prepare comida 3 times":"Prepare food 3 times",
  "Cardio o caminata 2 veces":"Cardio or walking 2 times",
  "Cardio o caminata 2 times":"Cardio or walking 2 times",
  "OpenFOAM / CFD 2 sesiones":"OpenFOAM / CFD 2 sessions",
  "Min de trabajo":"Work min",
  "Trabajar en la tesis 45 minutos":"Work on thesis 45 minutes",
  "Progreso real en la tesis, simulaciones o escritura.":"Real progress on thesis, simulations or writing.",
  "Trabajar en la tesis 5 bloques":"Work on thesis 5 blocks",
  "Decoración animada activada":"Animated decoration on",
  "Trabajo profundo":"Deep work",
  "Minutos de trabajo":"Work minutes",
  "Analizar todos los vínculos":"Analyze all links"
};

const ENGLISH_SYSTEM_DEFAULTS={
  "Leer 30 minutos de noche 3 veces":"Read 30 minutes at night 3 times",
  "Read 30 minutos de noche 3 times":"Read 30 minutes at night 3 times",
  "Desayuno":"Breakfast",
  "Comida":"Lunch",
  "Trabajo":"Work",
  "Casa":"Home",
  "Cena":"Dinner",
  "Después":"After",
  "Revisión weekly":"Weekly Review",
  "Usar equipo de casa 2 times":"Use home equipment 2 times",
  "Prepare comida 3 times":"Prepare food 3 times",
  "Cardio o caminata 2 times":"Cardio or walking 2 times",
  "OpenFOAM / CFD 2 sesiones":"OpenFOAM / CFD 2 sessions",
  "Min de trabajo":"Work min",
  "Trabajar en la tesis 45 minutos":"Work on thesis 45 minutes",
  "Progreso real en la tesis, simulaciones o escritura.":"Real progress on thesis, simulations or writing.",
  "Trabajar en la tesis 5 bloques":"Work on thesis 5 blocks",
  "Leer todo":"Read all",
  "Decoración animada activada":"Animated decoration on",
  "Trabajo profundo":"Deep work",
  "Minutos de trabajo":"Work minutes",
  "Trabajo":"Work",
  "Analizar todos los vínculos":"Analyze all links",
  "Paisajes monumentales de una ciudad amurallada a lo largo de seis etapas.":"Monumental walled-city landscapes across six stages.",
  "© 2026 Michel Duarte / Michel’s Lab. Todos los derechos reservados.":"© 2026 Michel Duarte / Michel’s Lab. All rights reserved.",
  "Last 14 days. La barra dorada es hoy.":"Last 14 days. The gold bar is today.",
  "Últimos 14 días. La barra dorada es hoy.":"Last 14 days. The gold bar is today.",
  "Today vs ayer":"Today vs yesterday",
  "Hoy vs ayer":"Today vs yesterday",
  "Este mes vs mes pasado":"This month vs last month",
  "Últimos 12 meses":"Last 12 months",
  "Últimos 5 años":"Last 5 years",
  "Deshacer última acción":"Undo last action",
  "Dorado":"Gold",
  "dorado":"gold",
  "No des el día por perdido mientras todavía haya margen.":"Do not call the day lost while there is still leverage."
};

function installedDefault(){
  const native=String(window.__MICHELSLIFE_INSTALL_LANGUAGE__||'').trim().toLowerCase();
  if(native==='es'||native.startsWith('spanish')){
    try{localStorage.setItem(INSTALL_DEFAULT_KEY,'es')}catch(_){}
    return 'es';
  }
  if(native==='en'||native.startsWith('english')){
    try{localStorage.setItem(INSTALL_DEFAULT_KEY,'en')}catch(_){}
    return 'en';
  }
  try{
    const persisted=localStorage.getItem(INSTALL_DEFAULT_KEY);
    if(persisted==='en'||persisted==='es')return persisted;
  }catch(_){}
  const n=String(navigator.language||'').toLowerCase();
  const fallback=n.startsWith('es')?'es':'en';
  try{localStorage.setItem(INSTALL_DEFAULT_KEY,fallback)}catch(_){}
  return fallback;
}
function getLanguage(){
  const installed=installedDefault();
  try{
    const stored=localStorage.getItem(KEY);
    const overrideBase=localStorage.getItem(USER_OVERRIDE_BASE_KEY);
    // A preference is trusted only when it was explicitly chosen by the user
    // against the same installer/browser language. Old/stale localStorage from
    // previous installations must not override a newly selected installer language.
    if((stored==='en'||stored==='es')&&overrideBase===installed)return stored;
    localStorage.setItem(KEY,installed);
    localStorage.removeItem(USER_OVERRIDE_BASE_KEY);
  }catch(_){}
  return installed;
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
  // arbitrary Spanish text, because it may be user-authored data. Only known
  // legacy/default system content is normalized back to its English source.
  if(language==='en'){
    // Recover canonical English even when dynamic UI recreated a fresh node after
    // Spanish mode. Normalize whole system sentences first, then embedded stock
    // phrases, then exact labels and date/greeting vocabulary.
    let out=normalizeDynamicSystemCopy(s,'en');
    out=replaceEmbeddedSystemPhrases(out,'en');
    for(const [legacySpanish,canonicalEnglish] of Object.entries(ENGLISH_EMBEDDED_LEGACY_DEFAULTS).sort((a,b)=>b[0].length-a[0].length)){
      if(out.includes(legacySpanish))out=out.split(legacySpanish).join(canonicalEnglish);
    }
    const trimmed=out.trim();
    const exactReverse=REVERSE[trimmed]||ENGLISH_SYSTEM_DEFAULTS[trimmed];
    if(exactReverse){
      const at=out.indexOf(trimmed);
      out=out.slice(0,at)+exactReverse+out.slice(at+trimmed.length);
    }
    out=restoreEnglishDateCopy(out);
    return out;
  }
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
    out=repairLegacyMixedSystemCopy(out);
    out=normalizeDynamicSystemCopy(out,'es');
    out=replaceEmbeddedSystemPhrases(out,'es');
    for(const [canonicalEnglish,spanishDefault] of Object.entries(SPANISH_SYSTEM_DEFAULTS).sort((a,b)=>b[0].length-a[0].length)){
      if(out.includes(canonicalEnglish))out=out.split(canonicalEnglish).join(spanishDefault);
    }
    out=out.replace(/\bAll\s+(\d+)\b/gi,'Todos $1');
    const catMap={'physical health':'salud física','education / thesis':'educación / tesis','career':'carrera','image / presence':'imagen / presencia','culture / languages':'cultura / idiomas','order / execution':'orden / ejecución','self-worth':'amor propio','emotional autonomy':'autonomía emocional','mental strength':'fortaleza mental'};
    out=out.replace(new RegExp('Complete the weekly (.+?) challenge (\\d+) time(s)?\\.','gi'),(m,cat,n)=>'Completa el reto semanal de '+(catMap[String(cat).toLowerCase()]||cat)+' '+n+' '+(Number(n)===1?'vez':'veces')+'.');
    // Specific templates must run before generic category templates.
    out=out.replace(new RegExp('Complete (\\d+) total missions\\.','gi'),(m,n)=>'Completa '+n+' '+(Number(n)===1?'misión':'misiones')+' en total.');
    out=out.replace(new RegExp('Complete at least one mission per day for (\\d+) consecutive days\\.','gi'),(m,n)=>'Completa al menos una misión por día durante '+n+' días consecutivos.');
    out=out.replace(new RegExp('Complete (\\d+) (.+?) missions\\.','gi'),(m,n,cat)=>'Completa '+n+' '+(Number(n)===1?'misión':'misiones')+' de '+(catMap[String(cat).toLowerCase()]||cat)+'.');
    out=out.replace(new RegExp('(\\d+\\/\\d+) distinctDays this week','gi'),'$1 días distintos esta semana');
    out=out.replace(new RegExp('(\\d+\\/\\d+) count this week','gi'),'$1 conteo esta semana');
    out=out.replace(new RegExp('(\\d+\\/\\d+) times this week','gi'),'$1 veces esta semana');
    out=out.replace(new RegExp('linked tasks count automatically\\.','gi'),'las tareas vinculadas cuentan automáticamente.');
    out=out.replace(new RegExp('“([^”]+)” has no active missions connected to it\\.','gi'),'“$1” no tiene misiones activas vinculadas.');
    out=out.replace(new RegExp('Today \\+(\\d+) XP','gi'),'Hoy +$1 XP');
    out=out.replace(new RegExp('This week ·','gi'),'Esta semana ·');
    out=out.replace(new RegExp('Current week due so far · default','gi'),'Semana actual hasta hoy · predeterminado');
    const fullWeekdays={Sunday:'Domingo',Monday:'Lunes',Tuesday:'Martes',Wednesday:'Miércoles',Thursday:'Jueves',Friday:'Viernes',Saturday:'Sábado'};
    const fullMonths={January:'Enero',February:'Febrero',March:'Marzo',April:'Abril',June:'Junio',July:'Julio',August:'Agosto',September:'Septiembre',October:'Octubre',November:'Noviembre',December:'Diciembre'};
    out=out.replace(/\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/gi,m=>fullWeekdays[Object.keys(fullWeekdays).find(k=>k.toLowerCase()===m.toLowerCase())]||m);
    out=out.replace(/\b(January|February|March|April|June|July|August|September|October|November|December)\b/gi,m=>fullMonths[Object.keys(fullMonths).find(k=>k.toLowerCase()===m.toLowerCase())]||m);
    // English "May" is both the full month and its abbreviation. Compact
    // headers use "may"; standalone/full-date month names use "Mayo".
    out=out.replace(/\bMay\b/g,(m,offset,whole)=>{
      const before=whole.slice(Math.max(0,offset-12),offset);
      return /\b(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*,\s*$/.test(before)?'may':'Mayo';
    });
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
    out=out.replace(/\bPhysical health\b/gi,'Salud física');
    out=out.replace(/\bEmotional Autonomy\b/gi,'Autonomía emocional');
    out=out.replace(/\bTrain arms\b/gi,'Entrenar brazos');
    out=out.replace(/\bNo stalking\s*\/\s*no chasing\b/gi,'No vigilar / no perseguir');
    out=out.replace(/\bClose with intention, not chaos\.\b/gi,'Cierra con intención, no con caos.');
    out=out.replace(/\bPositive affirmation\s+7\s+(?:days|días)\b/gi,'Afirmación positiva 7 días');
    out=out.replace(/\bPlan(?:ear)?\s+(?:the|el)\s+day\s+5\s+times\b/gi,'Planear el día 5 veces');
    out=out.replace(/\bLegs and glutes\s+2\s+times\s+per\s+(?:week|Semana)\b/gi,'Piernas y glúteos 2 veces por semana');
    out=out.replace(/\bMake the bed\s+7\s+(?:days|días)\b/gi,'Tender la cama 7 días');
    out=out.replace(/\b(?:Rest without guilt|Descansar sin culpa)\s+1\s+time\b/gi,'Descansar sin culpa 1 vez');
    out=out.replace(/\b(?:Post or plan content|Subir o planear contenido)\s+1\s+time\b/gi,'Subir o planear contenido 1 vez');
    out=out.replace(/\bReview followers\s*\/\s*following\s+1\s+time\b/gi,'Revisar seguidores / seguidos 1 vez');
    out=out.replace(/\bOrganize the desk\s+3\s+times\b/gi,'Organizar el escritorio 3 veces');
    out=out.replace(/\b(?:Review debt \/ savings|Review deuda \/ ahorro)\s+1\s+time\b/gi,'Revisar deuda / ahorro 1 vez');
    out=out.replace(/\b(?:Take care of the marmot|Cuidar a la marmota)\s+1\s+time\b/gi,'Cuidar a la marmota 1 vez');
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
    const owner=node.parentElement?.closest?.('[data-mlv-i18n-owned="source"]');
    if(owner)return;
    const rec=translatedTextNodes.get(node);
    if(rec){
      if(node.nodeValue===rec.translated)node.nodeValue=rec.original;
      translatedTextNodes.delete(node);
    }
    return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const el=node;
  if(el.closest?.('[data-mlv-i18n-owned="source"]'))return;
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
    if(!p||p.closest?.('[data-mlv-i18n-owned="source"]')||/^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE)$/i.test(p.tagName)||p.isContentEditable)return;
    if(language==='en'){
      const current=node.nodeValue;
      const next=mapText(current);
      if(next!==current)node.nodeValue=next;
      return;
    }

    const current=node.nodeValue;
    const previous=translatedTextNodes.get(node);

    // Some legacy dynamic copy reaches its final Spanish form in more than one
    // translation pass. Keep refining the translated value while preserving the
    // original English value for exact restoration later.
    if(previous&&current===previous.translated){
      const refined=mapText(current);
      if(refined!==current){
        previous.translated=refined;
        node.nodeValue=refined;
      }
      return;
    }

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
  if(el.closest?.('[data-mlv-i18n-owned="source"]')||/^(SCRIPT|STYLE|CODE|PRE)$/i.test(el.tagName)||el.isContentEditable)return;

  for(const attr of ['title','aria-label','placeholder']){
    if(!el.hasAttribute?.(attr))continue;
    const old=el.getAttribute(attr);
    if(language==='en'){
      const next=mapText(old);
      if(next!==old)el.setAttribute(attr,next);
      continue;
    }
    let records=translatedAttributes.get(el);
    const prev=records?.get(attr);
    if(prev&&old===prev.translated){
      const refined=mapText(old);
      if(refined!==old){
        prev.translated=refined;
        el.setAttribute(attr,refined);
      }
      continue;
    }
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
  card.innerHTML='<div class="section-title"><div><h2 data-mlv-lang-title>Interface language</h2><p data-mlv-lang-help>Use the language selected during installation the first time Michel’s Life opens. You can change it here anytime.</p></div></div><div style="display:grid;gap:7px;max-width:320px;font-weight:700"><div>Language</div><div data-mlv-language-switch style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button type="button" data-mlv-language-choice="en" aria-pressed="false" style="min-height:42px">English</button><button type="button" data-mlv-language-choice="es" aria-pressed="false" style="min-height:42px">Español</button></div></div>';
  pane.prepend(card);
  card.querySelectorAll('[data-mlv-language-choice]').forEach(btn=>{
    const choose=event=>{
      event.preventDefault();
      event.stopPropagation();
      const next=btn.getAttribute('data-mlv-language-choice');
      setLanguage(next,{userInitiated:true});
    };
    btn.addEventListener('pointerdown',choose);
    btn.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        choose(event);
      }
    });
  });
  translateNode(card);
  updateLanguageControls();
}
function updateLanguageControls(){
  document.querySelectorAll('[data-mlv-language-choice]').forEach(btn=>{
    const active=btn.getAttribute('data-mlv-language-choice')===language;
    btn.setAttribute('aria-pressed',active?'true':'false');
    btn.style.outline=active?'2px solid currentColor':'';
    btn.style.outlineOffset=active?'2px':'';
  });
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
  updateLanguageControls();
  requestAnimationFrame(()=>fitTranslatedControls(document));
}
function applyInstalledLanguage(next){
  const normalized=String(next||'').trim().toLowerCase();
  const installed=normalized==='es'||normalized.startsWith('spanish')?'es':'en';
  window.__MICHELSLIFE_INSTALL_LANGUAGE__=installed;

  let chosen=installed;
  try{
    localStorage.setItem(INSTALL_DEFAULT_KEY,installed);
    const stored=localStorage.getItem(KEY);
    const overrideBase=localStorage.getItem(USER_OVERRIDE_BASE_KEY);
    if((stored==='en'||stored==='es')&&overrideBase===installed){
      chosen=stored;
    }else{
      localStorage.setItem(KEY,installed);
      localStorage.removeItem(USER_OVERRIDE_BASE_KEY);
    }
  }catch(_){}

  setLanguage(chosen,{userInitiated:false});
}
function setLanguage(next,{userInitiated=false}={}){
  if(next!=='en'&&next!=='es')return;
  language=next;
  try{
    localStorage.setItem(KEY,next);
    if(userInitiated)localStorage.setItem(USER_OVERRIDE_BASE_KEY,installedDefault());
  }catch(_){}

  if(next==='en'){
    // Restore only values previously changed by this translation layer.
    restoreTranslatedNode(document.body);
    restoreEnglishWeekdayInitials();
  }

  document.documentElement.lang=next;
  refresh(document.body);
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
}
window.addEventListener('michelslife:uiupdated',()=>refresh(document.body));
window.MichelsLifeI18n={get language(){return language},setLanguage,getLanguage,applyInstalledLanguage,refresh,mapText};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
