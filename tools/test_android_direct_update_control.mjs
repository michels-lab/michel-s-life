import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the ACTUAL Android Settings updater function, without native
// permissions, network, installing packages, or changing user progress.
const source=readFileSync('android/android-bridge.js','utf8');
const start=source.indexOf('  let updateRequestCounter=0;');
const end=source.indexOf('  function observeUi(){',start);
assert.ok(start>=0 && end>start,'production Settings update control not found');

class Element {
  constructor(tag='section'){
    this.tagName=tag;this.children=[];this.style={};this.attributes={};
    this.textContent='';this.hidden=false;this.disabled=false;this.listeners={};
  }
  append(...children){this.children.push(...children);}
  prepend(child){this.children.unshift(child);}
  setAttribute(k,v){this.attributes[k]=v;}
  removeAttribute(k){delete this.attributes[k];if(k==='href')delete this.href;}
  addEventListener(type,callback){this.listeners[type]=callback;}
  fire(type){assert.ok(this.listeners[type],type+' listener missing');this.listeners[type]();}
}
const tab=new Element(),mount=new Element();
mount.className='v30171-settings-content';
tab.children.push(mount);
const document={
  documentElement:{lang:'en'},
  createElement(tag){return new Element(tag);}
};
const localStorage={getItem(){return 'en';}};
function findId(root,id){
  if(root?.id===id)return root;
  for(const c of root?.children||[]){const found=findId(c,id);if(found)return found;}
  return null;
}
const q=(sel,root=document)=>{
  if(sel==='#tab-settings.active')return tab;
  if(sel==='.v30171-settings-content')return mount;
  if(sel==='.v30171-settings-shell')return null;
  if(sel.startsWith('#'))return findId(root===document?tab:root,sel.slice(1));
  return null;
};
let sent=[],listeners=new Set(),timers=new Map(),timeSeq=0;
const chrome={webview:{
  postMessage(message){sent.push(message);},
  addEventListener(event,fn){if(event==='message')listeners.add(fn);},
  removeEventListener(event,fn){if(event==='message')listeners.delete(fn);}
}};
const fakeWindow={chrome};
const context=vm.createContext({
  document,window:fakeWindow,localStorage,q,console,
  setTimeout(fn){const id=++timeSeq;timers.set(id,fn);return id;},
  clearTimeout(id){timers.delete(id);}
});
vm.runInContext(source.slice(start,end)+
  '\nthis.renderUpdates=ensureAndroidUpdateControl;',context);

const get=id=>findId(tab,id);
context.renderUpdates();
context.renderUpdates();
assert.equal(mount.children.length,1,'Settings control must be idempotent');
const button=get('mlv-android-check-updates');
const status=get('mlv-android-update-status');
const link=get('mlv-android-update-release-link');
assert.match(button.textContent,/Check for updates/);
assert.match(status.textContent,/Never installs automatically/);
assert.equal(link.hidden,true,'No automatic release navigation');

button.fire('click');
assert.equal(sent.length,1,'one native request per real button click');
assert.equal(sent[0].action,'updateStatus');
assert.equal(sent[0].channel,'michels-life-google-calendar');
assert.equal(button.disabled,true);
assert.equal(link.hidden,true,'Pending check hides release');
assert.equal(listeners.size,1);
for(const cb of listeners)cb({data:{
  channel:'michels-life-google-calendar-response',
  requestId:'stale-check',ok:true,payload:{checked:true,updateAvailable:true,
    releaseUrl:'https://github.com/michels-lab/michel-s-life-releases/releases/tag/v9.0.0'}
}});
assert.equal(button.disabled,true,'stale response ignored');
assert.equal(link.hidden,true);

const first=sent[0].requestId;
for(const cb of [...listeners])cb({data:{
  channel:'michels-life-google-calendar-response',
  requestId:first,ok:true,payload:{
    checked:true,updateAvailable:false,status:'This Android Direct version is up to date.'}
}});
assert.equal(button.disabled,false);
assert.equal(status.textContent,'This Android Direct version is up to date.');
assert.equal(link.hidden,true,'No release link for current version');
assert.equal(listeners.size,0,'Remove one-shot native response listener');
assert.equal(timers.size,0,'Clear response timeout');

document.documentElement.lang='es';
context.renderUpdates();
assert.match(button.textContent,/Buscar actualizaciones/);
button.fire('click');
assert.equal(sent.length,2);
for(const cb of [...listeners])cb({data:{
  channel:'michels-life-google-calendar-response',
  requestId:sent[1].requestId,ok:true,payload:{checked:true,updateAvailable:true,
    status:'Hay una actualización oficial.',
    releaseUrl:'https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.222'}
}});
assert.match(status.textContent,/Hay una actualización oficial de Android Direct/);
assert.equal(link.hidden,false,'verified newer release exposes manual link');
assert.match(link.href,/github\.com\/michels-lab/);
assert.match(link.textContent,/Ver release oficial/);

button.fire('click');
assert.equal(link.hidden,true,'New attempt hides previous release link');
for(const cb of [...listeners])cb({data:{
  channel:'michels-life-google-calendar-response',
  requestId:sent[2].requestId,ok:true,payload:{checked:true,updateAvailable:true,
    status:'Mismatched link',
    releaseUrl:'https://github.com.attacker.example/michels-lab/michel-s-life-releases/releases/tag/v3.0.223'}
}});
assert.equal(link.hidden,true,'Spoofed GitHub host must never be clickable');
assert.match(status.textContent,/Hay una actualización oficial de Android Direct/);

button.fire('click');
const pending=[...listeners][0];
pending({data:{
  channel:'michels-life-google-calendar-response',
  requestId:sent[3].requestId,ok:false,error:'offline'}});
assert.equal(link.hidden,true);
assert.match(status.textContent,/No se pudo verificar/);
assert.equal(button.disabled,false);
assert.equal(listeners.size,0);

console.log('PASS actual Android Settings control: idempotent, user-triggered, ES/EN, correlated response, current/available/offline/spoofed, no silent install');
