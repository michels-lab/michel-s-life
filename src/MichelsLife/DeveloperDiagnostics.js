/* Michel's Lab Developer Edition: only inject in an explicitly developer-scoped runtime. */
(function(){
'use strict';
if(window.MichelsLabDeveloperTwin)return;
const KEY='michelslab.developer.notes.v1',ERROR_KEY='michelslab.developer.errors.v1',maxErrors=80;
const errors=[],findings=[];let notes=[],inspect=false,selected=null,host,shadow,panel,notice,comments,items,hilite,trigger;
const checkedScreens=new Map();let lastAuditAt=null;let consumePointerClick=false,fullAuditBusy=false;
let lastSweep={attempted:[],skipped:[],restoredScreen:null,finishedAt:null};
const iso=()=>new Date().toISOString();
try{const s=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(s))notes=s.slice(0,400);}catch(_){}
try{
 const persisted=JSON.parse(localStorage.getItem(ERROR_KEY)||'[]');
 if(Array.isArray(persisted))for(const item of persisted.slice(-maxErrors)){
  if(item&&['WINDOW_ERROR','UNHANDLED_REJECTION'].includes(item.code) &&
     typeof item.time==='string'&&typeof item.screen==='string'&&
     /^[A-Za-z]{1,35}$/.test(item.type||'')){
    errors.push({code:item.code,time:item.time.slice(0,35),screen:item.screen.slice(0,95),type:item.type});
  }
 }
}catch(_){}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(notes));return true;}catch(_){return false;}};
const screen=()=>document.querySelector('#main .tab.active')?.id||document.body?.dataset?.mlvAndroidTab||window.state?.activeTab||'unknown';
const cssEscape=s=>window.CSS?.escape?.(s)||String(s).replace(/[^a-z0-9_-]/gi,x=>'\\'+x);
const locator=e=>{
 if(e.id)return '#'+cssEscape(e.id);
 for(const key of ['data-v30171-setting','data-mlv184-chapter','data-tab','data-action','data-mobile-tab','data-mobile-focus','data-v30171-pane']){
  const value=e.getAttribute(key);
  if(value)return e.tagName.toLowerCase()+'['+key+'="'+value.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"]';
 }
 const parts=[];let node=e;
 for(let i=0;node&&node!==document.body&&i<7;i++,node=node.parentElement){
  if(node.id){parts.unshift('#'+cssEscape(node.id));break;}
  const siblings=Array.from(node.parentElement?.children||[]).filter(x=>x.tagName===node.tagName);
  parts.unshift(node.tagName.toLowerCase()+(siblings.length>1?':nth-of-type('+(siblings.indexOf(node)+1)+')':''));
 }
 return parts.join(' > ')||'body';
};
const present=e=>{if(!e)return false;const c=getComputedStyle(e),r=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0;};
function record(code,event){
 errors.push({code,time:iso(),screen:screen(),type:String(event?.error?.name||event?.reason?.name||'unknown').replace(/[^A-Za-z]/g,'').slice(0,35)});
 if(errors.length>maxErrors)errors.shift();
 // The developer's failed run may disappear after a WebView process restart.
 // Retain only bounded, redacted error CLASS codes, never stack/message/data.
 try{localStorage.setItem(ERROR_KEY,JSON.stringify(errors));}catch(_){}
 if(trigger)trigger.textContent='DEV '+errors.length;
}
window.addEventListener('error',e=>record('WINDOW_ERROR',e),true);
window.addEventListener('unhandledrejection',e=>record('UNHANDLED_REJECTION',e),true);
function node(tag,txt,parent){const n=document.createElement(tag);if(txt!==null)n.textContent=txt;if(parent)parent.appendChild(n);return n;}
function button(label,fn,parent){const b=node('button',label,parent);b.type='button';b.onclick=fn;return b;}
function identity(){return {product:"Michel's Life",platform:(document.documentElement.dataset.mlvPlatform==='android'||/Android/i.test(navigator.userAgent))?'android':'windows',build:String(window.__MICHELS_LIFE_BUILD__||'unknown').slice(0,80),screen:screen()};}
function create(){
 if(host)return;
 host=document.createElement('div');host.id='ml-dev-twin-host';host.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147483600';
 shadow=host.attachShadow({mode:'open'});
 const style=node('style',null,shadow);
 style.textContent=':host{all:initial;color:#e7f8ff;font:13px system-ui}*{box-sizing:border-box}button,select,textarea{font:inherit}button{background:#16374d;color:#effcff;border:1px solid #6bacc9;border-radius:10px;padding:9px;min-height:42px;cursor:pointer}button:focus-visible,textarea:focus-visible{outline:2px solid #ffe69b}#mltrigger{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom));right:12px;min-width:64px;height:50px;z-index:2147483620;font-weight:900;box-shadow:0 5px 20px #0009}#mlpanel{position:fixed;right:8px;top:calc(8px + env(safe-area-inset-top));bottom:calc(8px + env(safe-area-inset-bottom));width:min(410px,calc(100vw - 16px));padding:14px;overflow:auto;background:#0a1827;color:#e9f6ff;border:1px solid #5fa5bc;border-radius:16px;box-shadow:0 6px 30px #000a;z-index:2147483630}#mlpanel[hidden],#mlhighlight[hidden]{display:none!important}.row{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:8px 0}h2{font:800 18px system-ui;margin:0}h3{font:750 13px system-ui;margin:14px 0 5px}p,small{line-height:1.5;overflow-wrap:anywhere}small{color:#b1c8d5}textarea{background:#132e41;color:#fff;border:1px solid #608b9c;border-radius:8px;padding:9px;resize:vertical;width:100%;min-height:90px}select{color:#fff;background:#19374d;border:1px solid #608b9c;padding:8px;width:100%}#mlstatus{white-space:pre-wrap;max-height:180px;overflow:auto;background:#102c3c;border-radius:9px;padding:10px}section{margin:7px 0;padding:8px;border:1px solid #375668;border-radius:9px;overflow-wrap:anywhere}section button{min-height:36px;margin-right:6px}#mlhighlight{position:fixed;pointer-events:none;z-index:2147483610;border:3px solid #ffe39a;border-radius:7px;box-shadow:0 0 0 9999px #0004}';
 trigger=button('DEV',()=>{panel.hidden=!panel.hidden;stopInspect();showNotes();},shadow);trigger.id='mltrigger';trigger.style.pointerEvents='auto';
 panel=node('div',null,shadow);panel.id='mlpanel';panel.hidden=true;panel.style.pointerEvents='auto';
 node('h2',"Michel's Lab · Developer",panel);
 node('small','Isolated edition · real app engine · local audit · same user account login',panel);
 const top=node('div',null,panel);top.className='row';
 button('Run audit',audit,top);button('Mark element',beginInspect,top);
 button('Audit main sections',auditAll,panel).style.width='100%';
 node('small','A guided, read-only layout sweep visits available app screens and restores the original screen. Save unfinished forms before running.',panel);
 const second=node('div',null,panel);second.className='row';
 button('User sign-in',openLogin,second);button('Close',()=>{panel.hidden=true;stopInspect();},second);
 button('Clear error history',()=>{
   errors.length=0;try{localStorage.removeItem(ERROR_KEY);}catch(_){}
   if(trigger)trigger.textContent='DEV';notice.textContent='Redacted Developer runtime error history cleared; your section notes were preserved.';
 },panel);
 notice=node('pre','Run an audit or tap Mark element and select a control.',panel);notice.id='mlstatus';
 node('h3','Selected screen / section',panel);
 const target=node('p','No element selected.',panel);target.id='mlselected';
 comments=node('textarea',null,panel);comments.placeholder='Tu comentario: describe el glitch y cómo debería funcionar.';
 const severity=node('select',null,panel);severity.id='mlseverity';
 for(const value of ['P1','P0','P2']){const option=node('option',value,severity);option.value=value;}
 const noteButtons=node('div',null,panel);noteButtons.className='row';
 button('Save annotation',saveAnnotation,noteButtons);button('Cancel',()=>stopInspect(),noteButtons);
 node('h3','Anchored notes',panel);
 items=node('div',null,panel);
 node('h3','Export findings',panel);
 node('small','Manual exports include your EXACT comments; review before sharing. No passwords, cookies, user input values or raw stack traces are gathered.',panel);
 const exports=node('div',null,panel);exports.className='row';
 button('Export JSON',()=>exportReport('json'),exports);
 button('Export AI prompt',()=>exportReport('prompt'),exports);
 button('Copy AI prompt',copyPrompt,panel).style.width='100%';
 hilite=node('div',null,shadow);hilite.id='mlhighlight';hilite.hidden=true;
 document.documentElement.appendChild(host);showNotes();if(errors.length)trigger.textContent='DEV '+errors.length;
}
function stopInspect(){inspect=false;hilite.hidden=true;document.removeEventListener('pointerdown',mark,true);document.removeEventListener('touchstart',blockInspectionTouch,true);document.removeEventListener('pointermove',hover,true);document.removeEventListener('keydown',inspectKeyboard,true);if(!consumePointerClick)document.removeEventListener('click',blockInspectionClick,true);trigger.textContent='DEV'+(errors.length?' '+errors.length:'');}
function candidate(e){if(!(e instanceof Element)||host.contains(e))return null;return e.closest('button,a,input,textarea,select,summary,[role="button"],[data-tab],.card,section,article,.v30165-rpg-chapter-hero')||e;}
function hover(event){if(!inspect)return;const e=candidate(event.target);if(!e)return;const r=e.getBoundingClientRect();hilite.hidden=false;hilite.style.cssText='left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px';}
function beginInspect(){
 panel.hidden=true;inspect=true;trigger.textContent='TAP';
 // Intercept DOWN, not just click: native touch/mouse handlers can already
 // mutate canonical state before the click event is emitted.
 document.addEventListener('pointerdown',mark,true);
 document.addEventListener('touchstart',blockInspectionTouch,true);
 document.addEventListener('click',blockInspectionClick,true);
 document.addEventListener('pointermove',hover,true);
 document.addEventListener('keydown',inspectKeyboard,true);
}
function blockInspectionTouch(event){if(inspect&&!host.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();}}
function blockInspectionClick(event){
 // The floating DEV/TAP control must remain tappable so inspection can be
 // canceled on a phone without a hardware Escape key.
 if(host?.contains(event.target))return;
 if(inspect||consumePointerClick){
  const completed=consumePointerClick;
  event.preventDefault();event.stopImmediatePropagation();
  consumePointerClick=false;
  if(completed)document.removeEventListener('click',blockInspectionClick,true);
 }
}
function inspectKeyboard(event){if(inspect&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();stopInspect();panel.hidden=false;}}

function mark(event){
 if(!inspect)return;
 const e=candidate(event.target);if(!e)return;
 event.preventDefault();event.stopImmediatePropagation();
 selected={screen:screen(),selector:locator(e),element:e.tagName.toLowerCase()};
 consumePointerClick=true;
 stopInspect();panel.hidden=false;
 shadow.getElementById('mlselected').textContent=selected.screen+' → '+selected.selector;
 comments.value='';comments.focus();
 // A canceled pointerdown may suppress click entirely. Remove the one-shot
 // guard after this gesture, not at some later unrelated user interaction.
 setTimeout(()=>{consumePointerClick=false;document.removeEventListener('click',blockInspectionClick,true);},650);
}
function saveAnnotation(){
 const comment=comments.value.trim();
 if(!selected||!comment){notice.textContent='Select an element and enter your comment first.';return;}
 const prior=notes.find(n=>n.id===selected.id);
 const note={...selected,id:prior?.id||'note-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),comment:comment.slice(0,7000),severity:shadow.getElementById('mlseverity').value,status:'open',createdAt:prior?.createdAt||iso(),updatedAt:iso()};
 if(prior)Object.assign(prior,note);else notes.push(note);
 notice.textContent=persist()?'Saved with screen + exact DOM selector.':'Storage failed; export your note immediately.';
 selected=null;comments.value='';showNotes();
}
function showNotes(){
 if(!items)return;items.replaceChildren();
 for(const n of notes.slice().reverse()){
  const section=node('section',null,items);
  node('b',n.screen+' → '+n.selector,section);
  node('p','['+n.severity+'] '+n.comment,section);
  const actions=node('div',null,section);
  button('Edit',()=>{selected={...n};comments.value=n.comment;shadow.getElementById('mlseverity').value=n.severity;shadow.getElementById('mlselected').textContent=n.screen+' → '+n.selector;comments.focus();},actions);
  button('Remove',()=>{notes=notes.filter(x=>x.id!==n.id);persist();showNotes();},actions);
 }
 if(!notes.length)node('small','No annotations yet.',items);
}
function add(code,severity,description,selector){
 if(findings.length<140)findings.push({code,severity,description,selector,screen:screen(),evidence:'runtime DOM'});
}
function audit(){
 findings.length=0;const ids=new Set();
 for(const e of document.querySelectorAll('[id]')){
  if(ids.has(e.id))add('DUPLICATE_ID','P1','Duplicate DOM ID','#'+e.id);ids.add(e.id);
 }
 const active=document.querySelector('#main .tab.active');
 if(!active)add('NO_ACTIVE_SCREEN','P1','No active canonical screen','#main');
 for(const image of Array.from(document.images).filter(present)){
  if(image.complete&&image.naturalWidth===0)add('BROKEN_IMAGE','P1','Visible image did not load',locator(image));
 }
 for(const e of Array.from(document.querySelectorAll('button,[role="button"],input,select')).filter(present).slice(0,450)){
  const r=e.getBoundingClientRect();
  if(r.width<24||r.height<24)add('SMALL_TAP_TARGET','P2','Interactive control smaller than 24px',locator(e));
 }
 for(const n of notes.filter(x=>x.screen===screen())){
  let count=0;try{count=document.querySelectorAll(n.selector).length;}catch(_){}
  if(count!==1)add('ANNOTATION_TARGET_AMBIGUOUS','P2',count===0?'Marked element disappeared':'Marked selector no longer uniquely identifies the element',n.selector);
 }
 for(const e of errors)add(e.code,'P1','Captured '+e.type+' event at '+e.time,e.screen);
 for(const e of Array.from(document.querySelectorAll('button,input,select,[role="button"]')).filter(present).slice(0,450)){
   const bounds=e.getBoundingClientRect();
   if(bounds.right>innerWidth+3||bounds.left< -3)
     add('OFFSCREEN_INTERACTIVE_TARGET','P1','Visible action extends outside the horizontal viewport',locator(e));
 }
 // Include previous routes' findings in the export; never silently replace
 // a Story observation when the developer moves to Settings or Contracts.
 const auditedScreen=screen();
 const snapshot=findings.slice();
 const prior=Array.from(checkedScreens.entries()).filter(([key])=>key!==auditedScreen);
 checkedScreens.clear();
 for(const [key,val] of prior)checkedScreens.set(key,val);
 checkedScreens.set(auditedScreen,{time:iso(),findings:snapshot});
 findings.length=0;
 const keys=new Set();
 for(const entry of checkedScreens.values()){
   for(const f of entry.findings){const key=f.screen+'|'+f.code+'|'+f.selector;
     if(!keys.has(key)){keys.add(key);findings.push(f);}
   }
 }
 lastAuditAt=iso();
 const totals={P0:0,P1:0,P2:0};for(const f of findings)totals[f.severity]++;
 notice.textContent='Read-only audit · '+iso()+'\n'+JSON.stringify(identity())+'\nScreens audited: '+checkedScreens.size+'\nFindings: '+findings.length+' ('+JSON.stringify(totals)+')\nOwner annotations: '+notes.length+'\n'+findings.slice(0,12).map(f=>'['+f.severity+'] '+f.code+' · '+f.selector).join('\n');
 return findings.slice();
}
async function auditAll(){
 if(fullAuditBusy){notice.textContent='A navigation audit is already running.';return report();}
 const route=window.__mlvAndroidFastRoute;
 if(typeof route!=='function'){
   notice.textContent='Multi-section scan needs the original Android route. Use Run audit for this screen.';
   return report();
 }
 const original=screen().replace(/^tab-/,'');
 const initialScroll=window.scrollY;
 const safeRoutes=['dashboard','missions','contracts','calendar','journal','projects',
   'stats','achievements','story','settings','affirmations'];
 fullAuditBusy=true;
 const attempted=[],skipped=[];
 try{
   for(const name of safeRoutes){
     // Audit never activates a mission, submits a form, signs in or invokes
     // provider buttons. It only navigates the app's built-in tabs.
     let ok=false;
     try{ok=route(name)===true;}catch(_){ok=false;}
     await new Promise(resolve=>setTimeout(resolve,95));
     const active=screen();
     if(!ok||active!=='tab-'+name){
       skipped.push({screen:name,reason:'route was not safely mounted'});
       continue;
     }
     audit();attempted.push(name);
     notice.textContent='Read-only screen scan: '+attempted.length+' sections checked; '+skipped.length+' unavailable.';
   }
 }finally{
   try{route(original);}catch(_){}
   await new Promise(resolve=>setTimeout(resolve,110));
   window.scrollTo(0,initialScroll);
   fullAuditBusy=false;
   lastSweep={attempted,skipped,restoredScreen:screen(),finishedAt:iso()};
   notice.textContent='App section audit finished. '+attempted.length+
     ' routes checked, '+skipped.length+' unavailable; '+findings.length+
     ' distinct findings. Original screen restored: '+lastSweep.restoredScreen+
     '. Review exports for screen-level evidence.';
 }
 return report();
}
function nativeSnapshot(){
 try{
   const api=window.MichelsLabDeveloperNative;
   if(typeof api?.runtimeSnapshot!=='function')return {available:false};
   const result=JSON.parse(api.runtimeSnapshot());
   if(!result || typeof result!=='object'|| result.developerEdition!==true)return {available:false};
   const allow=['developerEdition','platform','appVersion','notificationPermission','javaHeapUsedKb','javaHeapMaxKb','nativeHeapAllocatedKb','uptimeMs'];
   const safe={};
   for(const key of allow)if(typeof result[key]==='string'||typeof result[key]==='number'||typeof result[key]==='boolean')
     safe[key]=result[key];
   return safe;
 }catch(_){return {available:false,errorCode:'NATIVE_SNAPSHOT_UNAVAILABLE'};}
}
function report(){return {schema:'michelslab-developer-audit/v1',createdAt:iso(),identity:identity(),
 evidence:'DOM and redacted error codes; not a live-provider certification',
 findings:findings.slice(),runtimeErrors:errors.slice(),nativeRuntime:nativeSnapshot(),guidedSweep:{...lastSweep},auditCoverage:Array.from(checkedScreens.entries()).map(([name,v])=>({screen:name,auditedAt:v.time,findings:v.findings.length})),lastAuditAt,
 ownerAnnotations:notes.map(n=>({...n,evidence:'owner observation, not automatically verified'})),
 limitations:['Read-only bounded audit','No automatic external data upload','Native OAuth may need separate developer package/signature registration','User-authored comment text deliberately included in manual export']};}
function prompt(){const r=report();return [
 '# Michel\'s Lab — AI repair request',JSON.stringify(r.identity),
 '## Automated findings',...r.findings.map(f=>'['+f.severity+'] '+f.code+' | '+f.screen+' | '+f.selector+' | '+f.description),
 '## Owner comments — EXACT text and screen anchors',...r.ownerAnnotations.map(n=>'['+n.severity+'] '+n.screen+' | '+n.selector+' | '+n.updatedAt+'\nOwner comment: '+n.comment),
 '## Redacted runtime error codes',...r.runtimeErrors.map(e=>e.code+' / '+e.type+' / '+e.screen),
 '## Native runtime summary (non-personal)',JSON.stringify(r.nativeRuntime),
 '## Guided scan coverage',JSON.stringify(r.guidedSweep),...r.auditCoverage.map(a=>a.screen+' | audited '+a.auditedAt+' | findings '+a.findings),
 '## Invariants','Preserve original artwork, user state, auth and other platforms. Reproduce, fix underlying cause, add regression tests, validate installed release. Do not infer findings without evidence.',
 '## Limitations',...r.limitations].join('\n');}
function exportReport(type){
 const data=type==='json'?JSON.stringify(report(),null,2):prompt();
 const name='michels-life-developer-'+type+'-'+iso().replace(/[:.]/g,'-')+(type==='json'?'.json':'.txt');
 if(window.MichelsLabDeveloperNative?.saveReport){try{window.MichelsLabDeveloperNative.saveReport(name,data);notice.textContent='Native Save As dialog requested.';return;}catch(_){}}
 try{const url=URL.createObjectURL(new Blob([data],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice.textContent='Download requested: '+name;}catch(_){notice.textContent='Save failed. Copy AI prompt instead.';}
}
async function copyPrompt(){try{await navigator.clipboard.writeText(prompt());notice.textContent='AI prompt copied.';}catch(_){comments.value=prompt();comments.select();notice.textContent='Copy selected prompt text manually.';}}
function openLogin(){
 panel.hidden=true;stopInspect();
 try {
   // Navigate with the real app's existing Settings router. No account
   // assignment or fake token: user signs in using their own provider.
   if(typeof window.__mlvAndroidFastRoute==='function')
     window.__mlvAndroidFastRoute('settings');
   else if(typeof window.LeftNavV30171?.route==='function')
     window.LeftNavV30171.route('settings');
   else document.querySelector('[data-tab="settings"]')?.click();
   setTimeout(()=>{
     const button=document.querySelector('.v30171-settings-nav [data-v30171-setting="sync"]')||
       document.querySelector('#tab-settings [data-v30171-setting="sync"]');
     if(button)button.click();
     else{panel.hidden=false;notice.textContent='Settings loaded, but Sync/Account is unavailable. Please inspect this route; no login was simulated.';}
   },360);
 }catch(_){notice.textContent='Open real Settings → Sync / User account. No mock login is allowed.';panel.hidden=false;}
}
window.MichelsLabDeveloperTwin={version:'1.0.0',audit,auditAll,report,prompt,notes:()=>notes.slice(),open:()=>{create();panel.hidden=false;}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create,{once:true});else create();
})();