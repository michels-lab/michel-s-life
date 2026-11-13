/* Shared affirmative copy, from Michel's Life's real board and phrase engine. */
(function(){
'use strict';
if(window.MichelsLifeMotivation)return;
const STORE='vida_rpg_personal_progress_v2';
const OWNER='michelsLife.supabase.boardOwner.v30218';
let lastNative='',nativeTick=0,sceneMemo=new WeakMap();
const tr=(en,es)=>window.MichelsLifeI18n?.language==='es'?es:en;
function clean(x){return typeof x==='string'?x.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,180):'';}
function unique(items,max){
 const done=[],seen=new Set();
 for(const raw of items){const x=clean(raw),key=x.toLocaleLowerCase();if(!x||seen.has(key))continue;
  seen.add(key);done.push(x);if(done.length>=max)break;}
 return done;
}
function board(){
 try{
  const owner=localStorage.getItem(OWNER),signed=window.SupabaseSyncV30216?.session?.()?.user?.id||null;
  if(owner!==null&&owner!==signed)return null;
  if(owner===null&&signed!==null)return null;
  const state=JSON.parse(localStorage.getItem(STORE)||'null');
  return state&&typeof state==='object'&&!Array.isArray(state)?state:null;
 }catch(_){return null;}
}
function read(){
 const state=board(),favorites=[],normal=[];
 for(const item of Array.isArray(state?.affirmations)?state.affirmations:[]){
  if(!item||typeof item!=='object'||item.hidden===true)continue;
  const value=clean(item.text);if(value)(item.favorite===true?favorites:normal).push(value);
 }
 const phrases=[];
 try{const live=window.getSmartMessage?.();if(typeof live==='string')phrases.push(live);}catch(_){}
 const status=document.querySelector?.('#fixedStatusBar .status-stage b, .v144-status-stage b');
 if(status?.textContent)phrases.push(status.textContent);
 if(Array.isArray(state?.lastPhrases))phrases.push(...state.lastPhrases.slice(0,20));
 return {affirmations:unique([...favorites,...normal],24),phrases:unique(phrases,20)};
}
function hash(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function choose(values,key,type){return values.length?values[hash(key+':'+type)%values.length]:'';}
function select(key){
 const content=read(),seed=new Date().toDateString()+':'+String(key||'focus');
 return {affirmation:choose(content.affirmations,seed,'affirmation'),phrase:choose(content.phrases,seed,'phrase')};
}
function styles(){
 if(document.getElementById('mlv-motivation-style'))return;
 const css=document.createElement('style');css.id='mlv-motivation-style';
 css.textContent=[
  '.mlv-motivation{width:min(100%,670px);margin:8px auto 0;display:grid;gap:10px;text-align:center;align-content:start;color:#f7fbff;font-family:system-ui,sans-serif;pointer-events:none;box-sizing:border-box}',
  '.mlv-motivation[hidden],.mlv-motivation-line[hidden]{display:none!important}',
  '.mlv-motivation-line{display:flex;flex-direction:column;align-items:center;gap:5px;border:1px solid #ffffff24;border-radius:15px;background:#07111d75;padding:10px 16px;max-width:100%;box-sizing:border-box;backdrop-filter:blur(3px)}',
  '.mlv-motivation-kicker{font-size:10px;font-weight:850;letter-spacing:.14em;color:#bde6ff;text-transform:uppercase;line-height:1.3}',
  '.mlv-motivation-copy{font-size:clamp(14px,1.7vw,19px);font-weight:650;line-height:1.42;overflow-wrap:anywhere;hyphens:auto;max-width:100%;white-space:normal}',
  '.mlv-motivation-phrase .mlv-motivation-copy{font-weight:510;font-style:italic}',
  '#mlv-android-focus-sheet .mlv-motivation{gap:6px;margin:3px auto 0}',
  '#mlv-android-focus-sheet .mlv-motivation-line,#mlv-alarm-ring .mlv-motivation-line{padding:8px 11px;border-radius:12px}',
  '#mlv-android-focus-sheet .mlv-motivation-copy,#mlv-alarm-ring .mlv-motivation-copy{font-size:clamp(13px,3.65vw,17px);line-height:1.34}',
  '#mlv-android-focus-sheet .mlv-motivation-kicker,#mlv-alarm-ring .mlv-motivation-kicker{font-size:9px}',
  '#mlv-alarm-ring .mlv-motivation{margin:1px auto 4px}',
  '@media(max-height:700px){#mlv-android-focus-sheet .mlv-motivation-copy{font-size:13px}#mlv-android-focus-sheet .mlv-motivation{gap:5px}}'
 ].join('\n');
 document.head.appendChild(css);
}
function mount(parent){
 if(!parent)return null;
 styles();
 let host=parent.querySelector(':scope > .mlv-motivation');
 if(host)return host;
 host=document.createElement('div');host.className='mlv-motivation';host.dataset.mlvMotivation='v1';host.setAttribute('aria-live','off');
 for(const type of ['affirmation','phrase']){
  const line=document.createElement('div');line.className='mlv-motivation-line mlv-motivation-'+type;
  const head=document.createElement('span');head.className='mlv-motivation-kicker';
  const copy=document.createElement('span');copy.className='mlv-motivation-copy';
  line.append(head,copy);host.appendChild(line);
 }
 parent.appendChild(host);return host;
}
function render(parent,key){
 const host=mount(parent);if(!host)return false;
 const locale=window.MichelsLifeI18n?.language||'en';
 const prior=sceneMemo.get(host);
 if(prior?.key===key&&prior?.locale===locale&&Date.now()-prior.at<30000)return true;
 const result=select(key);
 for(const type of ['affirmation','phrase']){
  const line=host.querySelector('.mlv-motivation-'+type);if(!line)continue;
  const value=result[type];line.hidden=!value;
  line.querySelector('.mlv-motivation-kicker').textContent=type==='affirmation'?tr('AFFIRMATION','AFIRMACIÓN'):tr('MOTIVATIONAL PHRASE','FRASE');
  line.querySelector('.mlv-motivation-copy').textContent=value;
 }
 host.hidden=!result.affirmation&&!result.phrase;
 sceneMemo.set(host,{key,locale,at:Date.now()});
 return true;
}
function syncNative(){
 const native=window.MichelsLifeAndroid;
 if(typeof native?.rememberAlarmMotivation!=='function')return false;
 const payload=JSON.stringify(read());
 if(payload===lastNative)return true;
 try{
  if(native.rememberAlarmMotivation(payload)!==true)return false;
  lastNative=payload;return true;
 }catch(_){return false;}
}
window.MichelsLifeMotivation={read,select,render,syncNative};
function boot(){
 syncNative();
 const refresh=()=>{if(Date.now()-nativeTick<3500)return;nativeTick=Date.now();syncNative();};
 window.addEventListener('michelslife:uiupdated',refresh);
 window.addEventListener('michelslife:languagechange',refresh);
 window.addEventListener('focus',syncNative);
 document.addEventListener('visibilitychange',syncNative);
 window.setInterval(refresh,30000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();