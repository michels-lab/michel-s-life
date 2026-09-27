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
  "Background sets, wallpapers and visual worlds.":"Conjuntos de fondos, wallpapers y mundos visuales.",
  "Color presets, window palette, accents, Gold and text colors.":"Preajustes de color, paleta de ventana, acentos, dorado y colores de texto.",
  "Choose the type style used across the interface.":"Elige la tipografía usada en toda la interfaz.",
  "Glass, transparency, density and interface surfaces.":"Cristal, transparencia, densidad y superficies de la interfaz.",
  "Pomodoro, focus sessions and timer behavior.":"Pomodoro, sesiones de enfoque y comportamiento del temporizador.",
  "Alerts and notification behavior.":"Alertas y comportamiento de las notificaciones.",
  "Day planning, Next Up and mission time-of-day rules.":"Planificación diaria, Siguientes y reglas horarias de misiones.",
  "Cloud-sync all Michel’s Life data and optionally connect Calendar.":"Sincroniza en la nube todos los datos de Michel’s Life y conecta Calendar opcionalmente.",
  "Export, import, recovery and maintenance tools.":"Herramientas de exportación, importación, recuperación y mantenimiento.",
  "Cinematic worlds used only by Current Chapter.":"Mundos cinematográficos usados solo por Current Chapter.",
  "Developer, license and build information.":"Información del desarrollador, licencia y versión.",
  "Personal Progress System":"Sistema de progreso personal",
  "Current Mission":"Misión actual","Start mission":"Iniciar misión","Start as Current Mission":"Iniciar como misión actual",
  "Delete mission":"Eliminar misión","Edit":"Editar","Add today":"Agregar hoy","Tomorrow":"Mañana",
  "Not today":"Hoy no","Duplicate":"Duplicar","Archive":"Archivar","Completed":"Completada",
  "Save":"Guardar","Cancel":"Cancelar","Delete":"Eliminar","Close":"Cerrar","Reset":"Restablecer",
  "Save settings":"Guardar configuración","Save configuration":"Guardar configuración",
  "Language":"Idioma","Interface language":"Idioma de la interfaz","English":"English","Spanish":"Español",
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
  "Project unlinked":"Proyecto desvinculado","No pending items":"Sin pendientes"
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
  "Choose Main, Important and Optional missions":"Elige misiones Principal, Importantes y Opcionales",
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
  "Private Google Drive app data":"Datos privados de la app en Google Drive",
  "Sync Michel’s Life now":"Sincronizar Michel’s Life ahora",
  "Keep this PC → Cloud":"Conservar esta PC → Nube",
  "Use Cloud → This PC":"Usar nube → Esta PC",
  "Keep all Michel’s Life data synced automatically":"Mantener todos los datos de Michel’s Life sincronizados automáticamente",
  "Uploads about 30 seconds after you stop making changes, checks Drive every 10 minutes, and checks again after returning to the app.":"Sube los cambios unos 30 segundos después de que dejas de editar, revisa Drive cada 10 minutos y vuelve a revisar al regresar a la app.",
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
  "This action requires the Windows app.":"Esta acción requiere la app de Windows.",
  "Could not create the required pre-update restore point. Update cancelled.":"No se pudo crear el punto de restauración previo a la actualización. Actualización cancelada.",
  "Install a newer Michel’s Life build? A restore point will be created before the current EXE is replaced.":"¿Instalar una versión más reciente de Michel’s Life? Se creará un punto de restauración antes de reemplazar el EXE actual.",
  "App reset":"App restablecida",
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
  "Build inicial":"Build inicial",
  "Build radar":"Radar de build",
  "Build balanceada":"Build balanceada",
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

function mapText(raw){
  const s=String(raw);
  const t=s.trim();
  if(!t)return s;
  const dict=language==='es'?PAIRS:REVERSE;
  if(dict[t]){
    const lead=s.slice(0,s.indexOf(t)),tail=s.slice(s.indexOf(t)+t.length);
    return lead+dict[t]+tail;
  }
  let out=s;
  const partial=language==='es'?[
    [/\bDelete mission\b/g,'Eliminar misión'],[/\bCurrent Mission\b/g,'Misión actual'],
    [/\bCompleted\b/g,'Completada'],[/\bToday\b/g,'Hoy'],[/\bTomorrow\b/g,'Mañana'],
    [/\bYesterday\b/g,'Ayer'],[/\bWeek\b/g,'Semana'],[/\bCoins\b/g,'Monedas'],
    [/\bStreak\b/g,'Racha'],[/\bLevel\b/g,'Nivel'],
    [/\bmissions today\b/gi,'misiones hoy'],[/\bWeek\b/g,'Semana'],[/\bReset\b/g,'Reinicio'],
    [/\bNew phrase\b/g,'Nueva frase'],[/\bOpen affirmations\b/g,'Abrir afirmaciones'],
    [/\bAdded to Next Up\b/g,'Agregada a Siguientes'],[/\bAdded to today\b/g,'Agregada a hoy'],
    [/\bDone today\b/g,'Hecho hoy'],[/\bDone this week\b/g,'Hecho esta semana'],
    [/\bDue today\b/g,'Vence hoy'],[/\bPending today\b/g,'Pendientes de hoy']
  ]:[
    [/\bMisión actual\b/g,'Current Mission'],[/\bEliminar misión\b/g,'Delete mission'],
    [/\bCompletada\b/g,'Completed'],[/\bHoy\b/g,'Today'],[/\bMañana\b/g,'Tomorrow'],
    [/\bAyer\b/g,'Yesterday'],[/\bSemana\b/g,'Week'],[/\bMonedas\b/g,'Coins'],
    [/\bRacha\b/g,'Streak'],[/\bNivel\b/g,'Level']
  ];
  for(const [re,v] of partial)out=out.replace(re,v);
  return out;
}
function translateNode(node){
  if(!node)return;
  if(node.nodeType===Node.TEXT_NODE){
    const p=node.parentElement;
    if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE)$/i.test(p.tagName)||p.isContentEditable)return;
    const next=mapText(node.nodeValue);
    if(next!==node.nodeValue)node.nodeValue=next;
    return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const el=node;
  if(/^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE)$/i.test(el.tagName)||el.isContentEditable)return;
  for(const attr of ['title','aria-label','placeholder']){
    if(el.hasAttribute?.(attr)){
      const old=el.getAttribute(attr),next=mapText(old);
      if(next!==old)el.setAttribute(attr,next);
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
function setLanguage(next){
  if(next!=='en'&&next!=='es')return;
  language=next;
  try{localStorage.setItem(KEY,next)}catch(_){}
  document.documentElement.lang=next;
  translateNode(document.body);
  ensureLanguageControl();
  document.querySelectorAll('[data-mlv-language-select]').forEach(s=>s.value=next);
  window.dispatchEvent(new CustomEvent('michelslife:languagechange',{detail:{language:next}}));
}
let queued=false;
const mo=new MutationObserver(records=>{
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    for(const r of records){
      if(r.type==='characterData')translateNode(r.target);
      for(const n of r.addedNodes)translateNode(n);
    }
    ensureLanguageControl();
  });
});
function init(){
  document.documentElement.lang=language;
  translateNode(document.body);
  ensureLanguageControl();
  mo.observe(document.body,{childList:true,subtree:true,characterData:true});
}
window.MichelsLifeI18n={get language(){return language},setLanguage,getLanguage};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
