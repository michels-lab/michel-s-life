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
    [/\bStreak\b/g,'Racha'],[/\bLevel\b/g,'Nivel']
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
    if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|CODE|PRE)$/i.test(p.tagName)||p.isContentEditable)return;
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
    for(const r of records)for(const n of r.addedNodes)translateNode(n);
    ensureLanguageControl();
  });
});
function init(){
  document.documentElement.lang=language;
  translateNode(document.body);
  ensureLanguageControl();
  mo.observe(document.body,{childList:true,subtree:true});
}
window.MichelsLifeI18n={get language(){return language},setLanguage,getLanguage};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
