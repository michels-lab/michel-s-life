/* Michel's Life — personal alarms. Recurrence is independent of Pomodoro.
 * Android OS schedules notifications; Windows rings while the app is open.
 */
(function(){
'use strict';
if(window.MichelsLifeAlarms)return;
const KEY='michelsLife.alarms.v1';
const q=(s,r=document)=>r.querySelector(s);
const android=()=>document.documentElement.dataset.mlvPlatform==='android'||!!window.MichelsLifeAndroid;
const tr=(en,es)=>window.MichelsLifeI18n?.language==='es'?es:en;
const hhmm=x=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(x);
const validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(new Date(x+'T12:00:00').getTime());
const days=['Su','Mo','Tu','We','Th','Fr','Sa'];
let records=[],screen=null,ring=null,launcher=null,editing=null,lastTick=Date.now(),shown=new Set(),nativeError='',nativeCache='',ready=false;
function normal(item){
  if(!item||! /^[a-zA-Z0-9_-]{1,64}$/.test(item.id)||!hhmm(item.time))return null;
  const repeat=['once','daily','weekly'].includes(item.repeat)?item.repeat:'once';
  const date=validDate(item.date)?item.date:'';
  const selected=Array.isArray(item.days)?[...new Set(item.days.map(Number).filter(x=>Number.isInteger(x)&&x>=0&&x<=6))].sort():[];
  if(repeat==='weekly'&&!selected.length)return null;
  if(repeat==='once'&&!date)return null;
  return {id:item.id,label:String(item.label||'').slice(0,60),time:item.time,repeat,date,days:selected,enabled:!!item.enabled};
}
function localRead(){
  try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(data)?data.slice(0,80).map(normal).filter(Boolean):[];}catch(_){return [];}
}
function store(){
  try{localStorage.setItem(KEY,JSON.stringify(records));}catch(e){console.warn('Alarm save unavailable',e);}
  nativeCache='';
  syncNative();
  renderList();
}
function read(){
  const native=window.MichelsLifeAndroid;
  if(android()&&typeof native?.getPersonalAlarms==='function'){
    try{
      const result=JSON.parse(native.getPersonalAlarms()||'[]');
      if(Array.isArray(result)){
        const saved=result.map(normal).filter(Boolean);
        // Android's OS alarm registry is the authoritative source after an alarm rings.
        // It must not be silently rearmed from stale WebView storage on restart.
        records=saved;
        try{localStorage.setItem(KEY,JSON.stringify(records));}catch(_){}
        nativeCache=JSON.stringify(records);
        return;
      }
    }catch(e){nativeError=String(e);}
  }
  records=localRead();
  syncNative();
}
function syncNative(){
  const native=window.MichelsLifeAndroid;
  if(typeof native?.syncPersonalAlarms!=='function')return;
  const raw=JSON.stringify(records);
  if(nativeCache===raw)return;
  try{
    const result=JSON.parse(native.syncPersonalAlarms(raw)||'{}');
    if(result.error)throw Error(result.error);
    nativeCache=raw;nativeError='';
  }catch(e){nativeError=String(e);nativeCache='';console.warn('Android alarms unavailable',e);}
}
function localAt(item){
  const due=new Date(item.date+'T'+item.time+':00').getTime();
  return Number.isFinite(due)?due:0;
}
function next(item,at=Date.now()){
  if(!item.enabled)return 0;
  if(item.repeat==='once'){
    const when=localAt(item);return when>at?when:0;
  }
  const [hour,min]=item.time.split(':').map(Number);
  for(let i=0;i<=7;i++){
    const day=new Date(at);day.setHours(hour,min,0,0);day.setDate(day.getDate()+i);
    if(day.getTime()<=at)continue;
    if(item.repeat==='daily'||item.days.includes(day.getDay()))return day.getTime();
  }
  return 0;
}
function rememberWallpaper(){
  if(!android())return;
  const raw=window.MichelsLifeFocusImmersive?.wallpaper?.()||'';
  const match=raw.match(/url\(\s*["']?([^)"']+)/i);
  if(!match)return;
  const path=match[1].replace(/^\.?\//,'').replace(/^app\//,'');
  if(/^assets\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp)$/i.test(path)&&!path.includes('..')){
    try{window.MichelsLifeAndroid?.rememberAlarmWallpaper?.(path);}catch(_){}
  }
}
function useWallpaper(element){
  window.MichelsLifeFocusImmersive?.applyWallpaper?.(element);
  rememberWallpaper();
}
function dateInput(){
  const d=new Date(),today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  return today;
}
function initialTime(){
  const d=new Date(Date.now()+3600000);
  return {time:String(d.getHours()).padStart(2,'0')+':00',
    date:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
}
function styles(){
 if(q('#mlv-personal-alarms-style'))return;
 const style=document.createElement('style');style.id='mlv-personal-alarms-style';
 style.textContent=`
#mlv-alarm-screen[hidden],#mlv-alarm-ring[hidden],#mlv-alarm-launcher[hidden]{display:none!important}
#mlv-alarm-screen,#mlv-alarm-ring{
 position:fixed!important;inset:0!important;z-index:2147483580!important;box-sizing:border-box!important;
 overflow:auto!important;color:#f5f9ff!important;
 background-color:#08101c!important;
 background-image:linear-gradient(125deg,#050a14ab,#050a1488,#050a14c9),var(--mlv-focus-wallpaper,none)!important;
 background-position:center!important;background-repeat:no-repeat!important;background-size:cover!important;
 display:flex!important;align-items:center!important;justify-content:center!important;
 padding:clamp(12px,3vw,35px)!important
}
#mlv-alarm-screen .mlv-alarm-panel{
 width:min(100%,780px);max-height:calc(100dvh - 25px);overflow:auto;padding:clamp(18px,3.5vw,34px);
 border:1px solid #ffffff55;border-radius:24px;background:#07101f99;backdrop-filter:blur(11px);
 box-shadow:0 18px 85px #0008;box-sizing:border-box
}
.mlv-alarm-heading{display:flex;align-items:start;justify-content:space-between;gap:12px}
.mlv-alarm-heading h2{font:850 clamp(25px,4vw,38px) system-ui,sans-serif;margin:3px 0 2px}
.mlv-alarm-heading p{font:400 13px system-ui,sans-serif;color:#d2dcf0;margin:4px 0 0}
.mlv-alarm-eyebrow{font:800 11px system-ui,sans-serif;letter-spacing:.16em;color:#a9dcff}
#mlv-alarm-screen button,#mlv-alarm-ring button,#mlv-alarm-launcher{
 min-height:45px;border:1px solid #ffffff50;border-radius:13px;background:#111c30e6;
 color:#fff;cursor:pointer;padding:9px 13px;font:700 14px system-ui,sans-serif
}
#mlv-alarm-screen button.primary,#mlv-alarm-ring button.primary{
 background:linear-gradient(125deg,#65d7ff,#ac84ff);border-color:transparent;color:#061224
}
#mlv-alarm-screen button:focus-visible,#mlv-alarm-ring button:focus-visible,#mlv-alarm-launcher:focus-visible{
 outline:3px solid #b9e6ff;outline-offset:2px
}
.mlv-alarm-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:18px 0;margin-top:9px;border-bottom:1px solid #ffffff35}
.mlv-alarm-form label{display:flex;flex-direction:column;gap:6px;font:700 13px system-ui,sans-serif}
.mlv-alarm-form input,.mlv-alarm-form select{min-width:0;min-height:46px;border:1px solid #ffffff54;border-radius:11px;
 background:#111d30;color:#fff;padding:8px 10px;font:600 16px system-ui,sans-serif;box-sizing:border-box}
.mlv-alarm-form input[type=date]{color-scheme:dark}
.mlv-alarm-form .full{grid-column:1/-1}
.mlv-alarm-days{display:flex;gap:6px;flex-wrap:wrap}
.mlv-alarm-days label{display:flex;flex-direction:row;align-items:center;gap:4px;padding:7px 9px;border-radius:9px;
 background:#ffffff16;cursor:pointer}
.mlv-alarm-days input{min-height:18px;height:18px;width:18px;accent-color:#87dbff}
.mlv-alarm-form .mlv-alarm-buttons{display:flex;gap:9px;flex-wrap:wrap}
.mlv-alarm-count{font:750 14px system-ui,sans-serif;margin:18px 0 11px}
.mlv-alarm-list{display:grid;gap:10px}
.mlv-alarm-item{display:flex;gap:10px;align-items:center;padding:12px;border:1px solid #ffffff2f;
 border-radius:15px;background:#040a14a6}
.mlv-alarm-item .info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.mlv-alarm-item strong{font:800 18px system-ui,sans-serif;overflow-wrap:anywhere}
.mlv-alarm-item span,.mlv-alarm-item small{font:500 12px system-ui,sans-serif;color:#d7e0f1}
.mlv-alarm-item input[type=checkbox]{height:25px;width:25px;accent-color:#75e6ff;cursor:pointer}
.mlv-alarm-item .edit,.mlv-alarm-item .remove{min-width:45px}
.mlv-alarm-note{font:500 12px/1.45 system-ui,sans-serif;color:#c5d1e4;margin-top:14px}
#mlv-alarm-ring{text-align:center}
#mlv-alarm-ring .scene{display:flex;flex-direction:column;gap:23px;align-items:center;justify-content:center;
 padding:25px;min-height:75dvh;max-width:780px;text-shadow:0 6px 25px #000}
#mlv-alarm-ring .bell{font-size:clamp(50px,9vw,100px);animation:mlv-alarm-pulse 1.3s ease-in-out infinite}
#mlv-alarm-ring h2{font:850 clamp(35px,7vw,72px) system-ui,sans-serif;margin:0}
#mlv-alarm-ring strong{font:850 clamp(65px,12vw,136px)/1 system-ui,sans-serif;letter-spacing:-.045em}
#mlv-alarm-ring p{font:600 clamp(18px,3vw,28px) system-ui,sans-serif;margin:0}
#mlv-alarm-ring .actions{display:flex;gap:13px;justify-content:center;flex-wrap:wrap}
#mlv-alarm-launcher{
 position:fixed;right:104px;bottom:22px;z-index:2147483200;border-radius:16px;
 padding:10px 13px;box-shadow:0 10px 35px #0008;background:#091424ee;white-space:nowrap
}
html[data-mlv-platform=android] #mlv-alarm-launcher{right:15px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:2147483000}
html[data-mlv-platform=android] #mlv-alarm-screen,html[data-mlv-platform=android] #mlv-alarm-ring{
 padding:calc(10px + env(safe-area-inset-top,0px)) 10px calc(13px + env(safe-area-inset-bottom,0px))!important
}
html[data-mlv-platform=android] .mlv-alarm-form{grid-template-columns:1fr 1fr}
html[data-mlv-platform=android] #mlv-alarm-screen .mlv-alarm-panel{max-height:100dvh}
body.mlv-alarm-visible{overflow:hidden!important}
@keyframes mlv-alarm-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.17)}}
@media(max-width:420px){.mlv-alarm-form{grid-template-columns:1fr}.mlv-alarm-item{flex-wrap:wrap}}
@media(prefers-reduced-motion:reduce){#mlv-alarm-ring .bell{animation:none}}
`;
 document.head.appendChild(style);
}
function create(){
 if(!document.body||screen)return;
 styles();
 screen=document.createElement('section');screen.id='mlv-alarm-screen';screen.hidden=true;
 screen.innerHTML=`
 <div class="mlv-alarm-panel" role="dialog" aria-modal="true" aria-labelledby="mlv-alarm-title">
 <header class="mlv-alarm-heading"><div><span class="mlv-alarm-eyebrow">MICHEL'S LIFE / ALARMS</span>
 <h2 id="mlv-alarm-title">Alarms</h2><p id="mlv-alarm-subtitle"></p></div>
 <button type="button" id="mlv-alarm-close" data-alarm-close>×</button></header>
 <form id="mlv-alarm-form" class="mlv-alarm-form">
 <label class="full"><span data-alarm-t="name">Name</span><input id="mlv-alarm-name" maxlength="60" autocomplete="off" /></label>
 <label><span data-alarm-t="time">Time</span><input id="mlv-alarm-time" type="time" required /></label>
 <label><span data-alarm-t="repeat">Repeat</span><select id="mlv-alarm-repeat">
  <option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly / selected days</option>
 </select></label>
 <label id="mlv-alarm-date-wrap"><span data-alarm-t="date">Date</span><input id="mlv-alarm-date" type="date" required /></label>
 <fieldset id="mlv-alarm-days-wrap" class="full" hidden><legend data-alarm-t="days">Days of the week</legend>
 <div class="mlv-alarm-days"></div></fieldset>
 <div class="mlv-alarm-buttons full"><button type="submit" class="primary" id="mlv-alarm-save">Create alarm</button>
 <button type="button" id="mlv-alarm-cancel-edit" hidden>Cancel edit</button></div></form>
 <div class="mlv-alarm-count" id="mlv-alarm-count"></div><div id="mlv-alarm-list" class="mlv-alarm-list"></div>
 <p id="mlv-alarm-note" class="mlv-alarm-note"></p>
 <button type="button" id="mlv-alarm-permissions" hidden>Enable full-screen alarms over other apps</button>
 </div>`;
 ring=document.createElement('section');ring.id='mlv-alarm-ring';ring.hidden=true;
 ring.innerHTML=`
 <div class="scene" role="alertdialog" aria-modal="true" aria-labelledby="mlv-alarm-ring-title">
 <span class="bell" aria-hidden="true">⏰</span>
 <h2 id="mlv-alarm-ring-title"></h2><strong id="mlv-alarm-ring-clock"></strong>
 <p id="mlv-alarm-ring-label"></p><div class="actions">
 <button type="button" class="primary" data-ring-dismiss>Dismiss alarm</button>
 <button type="button" data-ring-snooze>Snooze 5 minutes</button></div></div>`;
 launcher=document.createElement('button');launcher.type='button';launcher.id='mlv-alarm-launcher';
 launcher.setAttribute('aria-label','Open alarms');launcher.textContent='⏰ Alarmas';
 launcher.addEventListener('click',open);
 for(let i=0;i<7;i++){
  const label=document.createElement('label'),check=document.createElement('input'),span=document.createElement('span');
  check.type='checkbox';check.value=String(i);if(i>=1&&i<=5)check.checked=true;
  span.dataset.alarmWeekday=String(i);span.textContent=days[i];label.append(check,span);
  q('.mlv-alarm-days',screen).appendChild(label);
 }
 q('#mlv-alarm-repeat',screen).addEventListener('change',updateForm);
 q('#mlv-alarm-permissions',screen).addEventListener('click',()=>{
  try{window.MichelsLifeAndroid?.openPersonalAlarmPermissionSettings?.();}catch(_){}
 });
 screen.addEventListener('click',e=>{
  const target=e.target.closest('button');if(!target)return;
  if(target.hasAttribute('data-alarm-close'))close();
  if(target.id==='mlv-alarm-cancel-edit')resetForm();
  const id=target.closest('[data-alarm-id]')?.dataset.alarmId;
  if(!id)return;
  if(target.classList.contains('remove')){
    records=records.filter(x=>x.id!==id);store();
  }
  if(target.classList.contains('edit')){const item=records.find(x=>x.id===id);if(item)fillForm(item);}
 });
 screen.addEventListener('change',e=>{
  if(!e.target.matches('[data-alarm-enabled]'))return;
  const item=records.find(x=>x.id===e.target.closest('[data-alarm-id]')?.dataset.alarmId);
  if(!item)return;
  item.enabled=e.target.checked;
  if(item.enabled&&item.repeat==='once'&&localAt(item)<=Date.now()){
    item.enabled=false;window.alert(tr('This one-time alarm is in the past. Edit its date and time.','Esta alarma ya pasó. Edita la fecha y hora.'));
  }
  store();
 });
 q('#mlv-alarm-form',screen).addEventListener('submit',e=>{
  e.preventDefault();
  const time=q('#mlv-alarm-time',screen).value;
  const date=q('#mlv-alarm-date',screen).value;
  const repeat=q('#mlv-alarm-repeat',screen).value;
  const selected=[...screen.querySelectorAll('.mlv-alarm-days input:checked')].map(x=>Number(x.value));
  if(!hhmm(time)||repeat==='once'&&!validDate(date)||repeat==='weekly'&&!selected.length){
    window.alert(tr('Select a valid date, time and weekdays.','Selecciona fecha, hora y días válidos.'));return;
  }
  const base=editing?records.find(a=>a.id===editing):null;
  const item=normal({id:base?.id||'a'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
   label:q('#mlv-alarm-name',screen).value,time,date,repeat,days:selected,enabled:true});
  if(!item)return;
  if(item.repeat==='once'&&localAt(item)<=Date.now()){
    window.alert(tr('Choose a future date and time.','Selecciona una fecha y hora futuras.'));return;
  }
  if(base)records=records.map(x=>x.id===base.id?item:x);
  else if(records.length<80)records.push(item);
  else{window.alert(tr('Maximum 80 alarms.','Máximo 80 alarmas.'));return;}
  store();resetForm();
 });
 q('[data-ring-dismiss]',ring).addEventListener('click',()=>dismissRing(false));
 q('[data-ring-snooze]',ring).addEventListener('click',()=>dismissRing(true));
 document.body.append(screen,ring,launcher);
 resetForm();renderList();
}
function updateForm(){
 const repeat=q('#mlv-alarm-repeat',screen).value;
 q('#mlv-alarm-date-wrap',screen).hidden=repeat!=='once';
 q('#mlv-alarm-date',screen).required=repeat==='once';
 q('#mlv-alarm-days-wrap',screen).hidden=repeat!=='weekly';
}
function resetForm(){
 if(!screen)return;
 editing=null;q('#mlv-alarm-form',screen).reset();
 const d=initialTime();
 q('#mlv-alarm-date',screen).value=d.date;q('#mlv-alarm-time',screen).value=d.time;
 q('#mlv-alarm-cancel-edit',screen).hidden=true;
 updateForm();localize();
}
function fillForm(item){
 editing=item.id;
 q('#mlv-alarm-name',screen).value=item.label;
 q('#mlv-alarm-time',screen).value=item.time;
 q('#mlv-alarm-repeat',screen).value=item.repeat;
 q('#mlv-alarm-date',screen).value=item.date||dateInput();
 screen.querySelectorAll('.mlv-alarm-days input').forEach(c=>c.checked=item.days.includes(Number(c.value)));
 q('#mlv-alarm-cancel-edit',screen).hidden=false;
 updateForm();localize();
 q('#mlv-alarm-name',screen).focus();
}
function localize(){
 if(!screen)return;
 const labels={name:['Name (optional)','Nombre (opcional)'],time:['Time','Hora'],repeat:['Repeat','Repetir'],date:['Date','Fecha'],days:['Days of the week','Días de la semana']};
 for(const [key,translation] of Object.entries(labels)){
  const node=q('[data-alarm-t="'+key+'"]',screen);if(node)node.textContent=tr(...translation);
 }
 const options=q('#mlv-alarm-repeat',screen).options;
 options[0].textContent=tr('Once','Una sola vez');
 options[1].textContent=tr('Daily','Todos los días');
 options[2].textContent=tr('Weekly / selected days','Semanal / elegir días');
 const esDays=['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
 screen.querySelectorAll('[data-alarm-weekday]').forEach(el=>el.textContent=
   window.MichelsLifeI18n?.language==='es'?esDays[Number(el.dataset.alarmWeekday)]:days[Number(el.dataset.alarmWeekday)]);
 q('#mlv-alarm-title',screen).textContent=tr('Alarms','Alarmas');
 q('#mlv-alarm-subtitle',screen).textContent=tr('Schedule one-time, daily or weekly reminders.','Programa alarmas únicas, diarias o semanales.');
 q('#mlv-alarm-close',screen).textContent=tr('Close','Cerrar');
 q('#mlv-alarm-save',screen).textContent=editing?tr('Save changes','Guardar cambios'):tr('Create alarm','Crear alarma');
 q('#mlv-alarm-cancel-edit',screen).textContent=tr('Cancel edit','Cancelar edición');
 const permission=q('#mlv-alarm-permissions',screen);
 permission.hidden=!android();
 permission.textContent=tr('Allow alarms over other apps / screen lock','Permitir alarmas sobre otras apps / pantalla bloqueada');
 if(android()){
  try{
   const status=JSON.parse(window.MichelsLifeAndroid?.personalAlarmStatus?.()||'{}');
   permission.hidden=status.notificationsGranted!==false&&status.overlayGranted===true&&status.fullScreen!==false;
  }catch(_){}
 }
 q('#mlv-alarm-count',screen).textContent=tr('Alarms','Alarmas')+' · '+records.length;
 launcher.textContent=tr('⏰ Alarms','⏰ Alarmas');
 q('#mlv-alarm-note',screen).textContent=(android()?
  tr('Android uses system sound and vibration, including when Michel’s Life is closed. Battery optimization or notification permissions may affect delivery.',
  'Android utiliza sonido y vibración del sistema, incluso con Michel’s Life cerrada. El ahorro de batería o los permisos pueden afectar el aviso.'):
  tr('On Windows, sound and the full-screen scene work while Michel’s Life is open. A closed app cannot ring.',
  'En Windows, el sonido y la pantalla inmersiva funcionan con Michel’s Life abierta. Cerrada no puede sonar.'))+
  (nativeError?' · '+nativeError:'');
}
function renderList(){
 if(!screen)return;localize();
 const root=q('#mlv-alarm-list',screen);root.replaceChildren();
 if(!records.length){
  const p=document.createElement('p');p.textContent=tr('You have no alarms yet.','Todavía no tienes alarmas.');root.append(p);return;
 }
 for(const item of [...records].sort((a,b)=>Number(b.enabled)-Number(a.enabled)||a.time.localeCompare(b.time))){
  const card=document.createElement('div');card.className='mlv-alarm-item';card.dataset.alarmId=item.id;
  card.innerHTML='<div class="info"><strong></strong><span></span><small></small></div>'+
    '<input type="checkbox" data-alarm-enabled aria-label="Enable alarm" />'+
    '<button type="button" class="edit"></button><button type="button" class="remove"></button>';
  q('strong',card).textContent=item.time+' · '+(item.label||tr('Alarm','Alarma'));
  q('span',card).textContent=item.repeat==='once'?tr('One time','Una vez'):
    item.repeat==='daily'?tr('Every day','Todos los días'):
    tr('Weekly','Semanal')+' · '+item.days.map(d=>tr(days[d],['Do','Lu','Ma','Mi','Ju','Vi','Sá'][d])).join(' ');
  const due=next(item);
  q('small',card).textContent=!item.enabled?tr('Off','Desactivada'):
    due?new Date(due).toLocaleString(window.MichelsLifeI18n?.language==='es'?'es-MX':'en-US',
      {weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):
      tr('Needs a new date','Requiere otra fecha');
  q('input',card).checked=item.enabled;
  q('.edit',card).textContent=tr('Edit','Editar');
  q('.remove',card).textContent=tr('Delete','Eliminar');
  root.append(card);
 }
}
function open(){
 create();if(!screen)return false;
 useWallpaper(screen);screen.hidden=false;document.body.classList.add('mlv-alarm-visible');
 renderList();q('#mlv-alarm-close',screen).focus();return true;
}
function close(){
 if(!screen||screen.hidden)return false;
 screen.hidden=true;if(ring?.hidden)document.body.classList.remove('mlv-alarm-visible');
 return true;
}
let ringingId=null;
function ringAlarm(id){
 create();
 const item=records.find(x=>x.id===id);
 if(!item)return false;
 ringingId=id;
 if(item.repeat==='once'&&item.enabled){item.enabled=false;store();}
 screen.hidden=true;ring.hidden=false;useWallpaper(ring);
 document.body.classList.add('mlv-alarm-visible');
 q('#mlv-alarm-ring-title',ring).textContent=tr('ALARM','ALARMA');
 q('#mlv-alarm-ring-clock',ring).textContent=item.time;
 q('#mlv-alarm-ring-label',ring).textContent=item.label||tr('Time to go','Es la hora');
 q('[data-ring-dismiss]',ring).textContent=tr('Dismiss','Descartar');
 q('[data-ring-snooze]',ring).textContent=tr('Snooze 5 min','Posponer 5 min');
 q('[data-ring-dismiss]',ring).focus();
 if(!android()){
   if('Notification' in window&&Notification.permission==='granted'){
     try{new Notification('Michel’s Life · '+(item.label||tr('Alarm','Alarma')));}catch(_){}
   }
   try{
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(Audio){const ctx=new Audio(),osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);osc.type='sine';osc.frequency.value=880;
      gain.gain.setValueAtTime(.11,ctx.currentTime);osc.start();
      osc.stop(ctx.currentTime+.55);osc.onended=()=>ctx.close();
    }
   }catch(_){}
 }
 return true;
}
function dismissRing(snooze){
 if(!ring||ring.hidden)return;
 if(snooze&&ringingId){
  const item=records.find(x=>x.id===ringingId);
  if(item){
   const when=new Date(Date.now()+5*60000);
   const date=when.getFullYear()+'-'+String(when.getMonth()+1).padStart(2,'0')+'-'+String(when.getDate()).padStart(2,'0');
   const time=String(when.getHours()).padStart(2,'0')+':'+String(when.getMinutes()).padStart(2,'0');
   const snoozed={id:'s'+Date.now().toString(36),label:item.label||tr('Snoozed alarm','Alarma pospuesta'),
     date,time,repeat:'once',days:[],enabled:true};
   // Round the native due forward to the next minute so it cannot already be past.
   if(when.getSeconds()>0){const next=new Date(when);next.setMinutes(next.getMinutes()+1,0,0);
     snoozed.date=next.getFullYear()+'-'+String(next.getMonth()+1).padStart(2,'0')+'-'+String(next.getDate()).padStart(2,'0');
     snoozed.time=String(next.getHours()).padStart(2,'0')+':'+String(next.getMinutes()).padStart(2,'0');
   }
   if(records.length<80)records.push(snoozed);store();
  }
 }
 try{window.MichelsLifeAndroid?.dismissPersonalAlarm?.(ringingId||'');}catch(_){}
 ring.hidden=true;ringingId=null;document.body.classList.remove('mlv-alarm-visible');
}
function tick(){
 if(!screen||android())return;
 const now=Date.now();
 if(now<lastTick){lastTick=now;return;}
 if(now-lastTick>1000*65){lastTick=now;return;} // No flood after a sleeping laptop awakens.
 for(const item of records){
  if(!item.enabled)continue;
  let due=0;
  if(item.repeat==='once')due=localAt(item);
  else{
   const [hh,mm]=item.time.split(':').map(Number);
   const date=new Date(now);date.setHours(hh,mm,0,0);
   if(date.getTime()<=lastTick)date.setDate(date.getDate()+1);
   due=date.getTime();
   if(item.repeat==='weekly'&&!item.days.includes(new Date(due).getDay()))continue;
  }
  const unique=item.id+':'+due;
  if(due>lastTick&&due<=now&&!shown.has(unique)){
   shown.add(unique);ringAlarm(item.id);break;
  }
 }
 lastTick=now;
 if(shown.size>100)shown.clear();
}
function boot(){
 if(ready)return;ready=true;
 read();create();
 rememberWallpaper();window.addEventListener('load',rememberWallpaper,{once:true});
 // Android receives a system notification; the page timer is only a foreground mirror.
 window.setInterval(tick,900);
 window.addEventListener('focus',()=>{syncNative();renderList();});
 document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(ring&&!ring.hidden){e.preventDefault();dismissRing(false);}
  else if(screen&&!screen.hidden){e.preventDefault();close();}
 });
}
window.MichelsLifeAlarms={open,close,ringAlarm,read,records:()=>records.slice(),next,localAt,dismissRing};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();