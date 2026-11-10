import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the REAL production Android Settings function, not a reimplementation.
// No actual network, file system writes, app install or account data mutation.
const source=readFileSync('android/android-bridge.js','utf8');
const start=source.indexOf('  let updateRequestCounter=0;');
const end=source.indexOf('  function observeUi(){',start);
assert.ok(start>=0 && end>start,'production Android Settings updater missing');

class Element {
  constructor(tag='section'){
    this.tagName=tag;this.children=[];this.style={};this.attributes={};
    this.hidden=false;this.disabled=false;this.textContent='';this.listeners={};
  }
  append(...items){this.children.push(...items);}
  prepend(item){this.children.unshift(item);}
  setAttribute(key,value){this.attributes[key]=value;}
  removeAttribute(key){delete this.attributes[key];if(key==='href')delete this.href;}
  addEventListener(type,cb){this.listeners[type]=cb;}
  fire(type='click'){assert.ok(this.listeners[type],type+' listener missing');this.listeners[type]();}
}
let tab,mount;
function freshSettings(){
  tab=new Element();mount=new Element();tab.children.push(mount);
}
freshSettings();
const document={documentElement:{lang:'en'},createElement(tag){return new Element(tag);}};
const localStorage={getItem(){return 'en';}};
function findId(el,id){
  if(el?.id===id)return el;
  for(const item of el?.children||[]){const found=findId(item,id);if(found)return found;}
  return null;
}
const q=(selector,root=document)=>{
  if(selector==='#tab-settings.active')return tab;
  if(selector==='.v30171-settings-content')return mount;
  if(selector==='.v30171-settings-shell')return null;
  if(selector.startsWith('#'))return findId(root===document?tab:root,selector.slice(1));
  return null;
};
let sent=[],listeners=new Set(),timers=new Map(),nextTimer=0;
const chrome={webview:{
  postMessage(payload){sent.push(payload);},
  addEventListener(event,callback){if(event==='message')listeners.add(callback);},
  removeEventListener(event,callback){if(event==='message')listeners.delete(callback);}
}};
const context=vm.createContext({document,window:{chrome},localStorage,q,console,
  setTimeout(fn){const id=++nextTimer;timers.set(id,fn);return id;},
  clearTimeout(id){timers.delete(id);}
});
vm.runInContext(source.slice(start,end)+
  '\nthis.renderUpdates=ensureAndroidUpdateControl;',context);
const get=(name)=>findId(tab,'mlv-android-'+name);
const latest=()=>sent.at(-1);
function respond(payload,ok=true,request=latest()){
  assert.ok(request,'Expected a native action to reply to');
  for(const listener of [...listeners])listener({data:{
    channel:'michels-life-google-calendar-response',
    requestId:request.requestId,ok,payload
  }});
}
function request(action){
  assert.equal(latest().action,action,'Expected Android native command '+action);
  return latest();
}

context.renderUpdates();
context.renderUpdates();
assert.equal(mount.children.length,1,'Settings panel must be unique');
assert.equal(sent.length,1,'One local resume check per Settings mount');
request('updateReady');
const check=get('check-updates'),stage=get('stage-update'),
  install=get('install-update'),permission=get('permission-update'),
  discard=get('discard-update'),status=get('update-status'),
  link=get('update-release-link');
assert.ok(check.disabled,'Local APK rehash must disable duplicate concurrent check');
assert.ok(install.hidden,'Never show installer before local APK verification');
respond({ready:false,hasCached:false});
assert.equal(check.disabled,false);
assert.equal(install.hidden,true);
assert.equal(discard.hidden,true);
assert.match(check.textContent,/Check for updates/);
assert.match(status.textContent,/Never installs automatically/);
assert.equal(listeners.size,0);
assert.equal(timers.size,0);

check.fire();request('updateStatus');
assert.equal(check.disabled,true);
assert.equal(link.hidden,true);
const oldRequest=latest();
respond({checked:true,updateAvailable:true,
  releaseUrl:'https://github.com/michels-lab/michel-s-life-releases/releases/tag/v9.0.0'},
  true,{requestId:'stale-check'});
assert.equal(check.disabled,true,'Stale request must not unlock controls');
assert.equal(link.hidden,true);
respond({checked:true,updateAvailable:false,
  channel:'android-direct',status:'This Android Direct version is up to date.'},
  true,oldRequest);
assert.equal(check.disabled,false);
assert.equal(link.hidden,true);
assert.match(status.textContent,/up to date/);

document.documentElement.lang='es';
context.renderUpdates();
assert.match(check.textContent,/Buscar actualizaciones/);
check.fire();request('updateStatus');
respond({checked:true,updateAvailable:true,
  releaseUrl:'https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.222'});
assert.equal(stage.hidden,false);
assert.equal(install.hidden,true);
assert.equal(permission.hidden,true);
assert.equal(link.hidden,false);
assert.match(status.textContent,/Hay una actualización oficial/);

stage.fire();request('updateStage');
assert.equal(stage.disabled,true);
assert.equal(install.hidden,true,'Download must not silently start installer');
respond({staged:true,version:'0.2.10'});
assert.equal(stage.disabled,false);
assert.equal(install.hidden,false);
assert.equal(discard.hidden,false);
assert.match(status.textContent,/APK verificada/);

install.fire();request('updateInstall');
respond({opened:false,needsPermission:true});
assert.equal(permission.hidden,false);
assert.match(status.textContent,/requiere permiso/);
permission.fire();request('updatePermissionSettings');
respond({opened:true});
assert.match(status.textContent,/Ajustes de Android abiertos/);
assert.equal(install.disabled,false);
install.fire();request('updateInstall');
respond({opened:true});
assert.match(status.textContent,/aún no está instalada/,
  'Opening the OS installer is NOT proof of installation');

// When the app/WebView restarts, it must re-hash the cached APK without
// downloading again or automatically opening the OS installer.
freshSettings();
context.renderUpdates();
request('updateReady');
assert.equal(get('install-update').hidden,true,'Never trust last session UI state');
respond({ready:true,hasCached:true,version:'0.2.10'});
assert.equal(get('install-update').hidden,false,'Verified local APK recovers after restart');
assert.equal(get('discard-update').hidden,false);
assert.equal(get('stage-update').hidden,true);
assert.match(get('update-status').textContent,/APK guardada verificada/);
assert.equal(latest().action,'updateReady','Reopen must not poll GitHub release');
assert.equal(listeners.size,0);

// A previously signed package can be revoked: do NOT install if the current
// official release does not match the cached receipt.
get('install-update').fire();
request('updateInstall');
respond({opened:false,stale:true});
assert.equal(get('install-update').hidden,true);
assert.match(get('update-status').textContent,/ya no coincide/);
assert.equal(get('discard-update').hidden,false);

// User explicitly removes ONLY the updater cache.
get('discard-update').fire();
request('updateDiscard');
respond({discarded:true});
assert.equal(get('install-update').hidden,true);
assert.equal(get('discard-update').hidden,true);
assert.match(get('update-status').textContent,/misiones y datos personales siguen intactos/);

// A broken or abandoned download must never be offered for installation.
freshSettings();
context.renderUpdates();
request('updateReady');
respond({ready:false,hasCached:true});
assert.equal(get('install-update').hidden,true);
assert.equal(get('discard-update').hidden,false);
assert.match(get('update-status').textContent,/incompleta/);
get('discard-update').fire();request('updateDiscard');
respond({discarded:true});
assert.equal(get('discard-update').hidden,true);

// Spoofed GitHub hosts never produce a clickable release or an APK download.
get('check-updates').fire();request('updateStatus');
respond({checked:true,updateAvailable:true,
  releaseUrl:'https://github.com.attacker.example/michels-lab/michel-s-life-releases/releases/tag/v3.0.223'});
assert.equal(get('update-release-link').hidden,true);
assert.equal(get('stage-update').hidden,true);
get('check-updates').fire();request('updateStatus');
respond({status:'offline'},false);
assert.match(get('update-status').textContent,/No se pudo verificar/);
assert.equal(get('check-updates').disabled,false);
assert.equal(listeners.size,0);
assert.equal(timers.size,0);

console.log('PASS real Android update UI: ES/EN, cold/restart rehash, user consent, permission, withdrawn/stale/partial cache, safe discard, forged link, offline, no auto-installs');
