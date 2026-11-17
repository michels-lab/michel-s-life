import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync('src/MichelsLife/frontend/index.html','utf8');
const anchor=html.indexOf('<script id="v30190-google-calendar-script">');
const p=html.indexOf('function settings(){',anchor);
const q=html.indexOf('function saveSafe(){',p);
const r=html.indexOf('function captureCloudBackup(){',q);
const t=html.indexOf('async function applyCloudRestore(res){',r);
assert.ok(anchor>0&&p>anchor&&q>p&&r>q&&t>r,'original production Google Calendar capture not found');
const code=html.slice(p,q)+'\n'+html.slice(r,t)+
  '\nthis.capture=()=>captureCloudBackup();this.getCalendarSettings=()=>settings()';
let passed=0;
function harness(state){
 const shared={};
 const ctx=vm.createContext({state,BUILD:'3.0.224',JSON,Object,Array,
   mlvSharedStorageSnapshot:()=>({...shared})});
 vm.runInContext(code,ctx,{timeout:1000});
 return ctx;
}
const c=harness({xp:88,missions:[],settings:{v30200GenericProfile:true}});
const before=c.capture();
c.getCalendarSettings(); // A Settings repaint during simulated asynchronous provider POST.
assert.equal(c.capture(),before,'background Settings render changed the protected snapshot during pull');
assert.equal(JSON.parse(before).state.xp,88);
assert.equal(JSON.parse(before).state.settings.v30190Google.pushMissions,false);
passed++;

c.state.xp=89;
assert.notEqual(c.capture(),before,'a genuine mission/XP edit must still abort concurrent cloud download');
passed++;

c.state.settings.v30190Google.showEvents=false;
assert.notEqual(c.capture(),before,'a genuine user Google Calendar preference edit must still abort unsafe restore');
passed++;

const d=harness({xp:9,missions:[],settings:{v30190Google:{showEvents:false,pushMissions:true,autoSync:false}}});
const original=d.capture();
d.getCalendarSettings();
assert.equal(d.capture(),original,'existing owner preferences must never be silently replaced');
assert.equal(JSON.parse(original).state.settings.v30190Google.pushMissions,true);
assert.equal(JSON.parse(original).state.settings.v30190Google.showEvents,false);
passed++;

const a=harness({xp:777,missions:[{id:'A'}],settings:{}});
const b=harness({xp:55,missions:[{id:'B'}],settings:{}});
assert.notEqual(a.capture(),b.capture(),'different accounts must keep separate boards');
assert.equal(JSON.parse(a.capture()).state.missions[0].id,'A');
assert.equal(JSON.parse(b.capture()).state.missions[0].id,'B');
passed++;

console.log('PASS '+passed+'/'+passed+' production cloud snapshot stability and true-edit rollback guards');
