// GRANADA #108: verify the real production Supabase device-list and guest-import
// async account ownership gates with two synthetic users and no live provider.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const html=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../src/MichelsLife/frontend/index.html'),'utf8');
const source=html.match(/<script id="mlv-v30216-supabase-sync-script">([\s\S]*?)<\/script>/)?.[1];
assert.ok(source&&source.length>10000,'Production Supabase script missing');
function extract(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a&&source.indexOf(start,a+1)<0,'Missing or ambiguous production code: '+start);
 return source.slice(a,b);
}
const ownership=extract('function assertOwnedBoard(s){','function capture(){');
const overviewSource=extract('async function refreshOverview(){','function getOverview(){');
const guestSource=extract("else if(a==='import-guest'){","else if(a==='logout')")
 .replace("else if(a==='import-guest'){",'async function guestImport(){');
const deferred=()=>{
 let resolve,reject;
 const promise=new Promise((ok,fail)=>{resolve=ok;reject=fail});
 return {promise,resolve,reject};
};
async function until(ok,label){
 for(let i=0;i<100;i++){
  if(ok())return;
  await new Promise(resolve=>setImmediate(resolve));
 }
 throw Error('Deferred production operation never reached: '+label);
}
const A='account-a1111',B='account-b2222';
function overviewFixture(){
 let id=A,token='A_ACCESS';
 const pending=[],touches=[],runtime={cloudError:''},mounts=[];
 const overview={devices:[],backups:[],currentDeviceId:'device-local',currentDeviceName:'Synthetic Device'};
 const ctx={
  overview,runtime,lastOverviewAt:0,Date,String,encodeURIComponent,
  session:()=>({access_token:token,user:{id}}),
  ensureSession:async()=>({access_token:token,user:{id}}),
  boardOwner:()=>id,
  request:(path)=>{
   const d=deferred();pending.push({path,deferred:d});return d.promise
  },
  deviceId:()=> 'device-local',deviceName:()=> 'Synthetic Device',
  touchDevice:async(s)=>{touches.push(s.user.id)},
  scheduleMount:()=>mounts.push(id)
 };
 vm.createContext(ctx);
 vm.runInContext(ownership+'\n'+overviewSource+
  '\nthis.run=refreshOverview;this.view=()=>overview;',ctx,{timeout:3000});
 return {run:ctx.run,view:ctx.view,pending,touches,runtime,mounts,
  switchToB:()=>{id=B;token='B_ACCESS';ctx.overview={devices:[],backups:[],currentDeviceId:'device-local',currentDeviceName:'Synthetic Device'}},
  resolvePair:(start,who)=>{
   const rows=pending.slice(start,start+2);
   assert.equal(rows.length,2,'Expected both device and history provider requests');
   assert.ok(rows.every(row=>row.path.includes('&user_id=eq.'+who)),
    'Every device/history query must be filtered by authenticated owner');
   for(const row of rows){
    if(row.path.includes('/ml_devices?'))row.deferred.resolve([{user_id:who,device_id:who+'-device',label:who+' private device',platform:'android'}]);
    else if(row.path.includes('/ml_state_history?'))row.deferred.resolve([{user_id:who,id:who+'-history',revision:1,source_device_id:who+'-device'}]);
    else throw Error('Unexpected provider request');
   }
  }
 };
}
// A's late response must never display A devices/history under B.
{
 const x=overviewFixture(),a=x.run();
 await until(()=>x.pending.length===2,'A overview');
 x.switchToB();x.resolvePair(0,A);
 await a;
 assert.equal(x.view().devices.length,0,'B must not show stale A devices');
 assert.equal(x.view().backups.length,0,'B must not show stale A history');
 assert.equal(x.runtime.cloudError,'','Stale A errors must not reach B');
 assert.equal(x.touches.length,0,'Do not mark A online after switching to B');
}
// A request finishing after the B response must not replace B.
{
 const x=overviewFixture(),a=x.run();
 await until(()=>x.pending.length===2,'A overview before B');
 x.switchToB();const b=x.run();
 await until(()=>x.pending.length===4,'B overview');
 x.resolvePair(2,B);await b;
 x.resolvePair(0,A);await a;
 assert.equal(x.view().devices[0].deviceId,B+'-device');
 assert.equal(x.view().backups[0].fileId,B+'-history');
 assert.deepEqual(x.touches,[B]);
}
// A broken provider/RLS response for A containing B rows must fail closed.
{
 const x=overviewFixture(),a=x.run();
 await until(()=>x.pending.length===2,'foreign device-history rows');
 for(const row of x.pending){
  row.deferred.resolve(row.path.includes('/ml_devices?')
   ?[{user_id:B,device_id:B+'-device',label:'PRIVATE B DEVICE'}]
   :[{user_id:B,id:B+'-history',reason:'PRIVATE B HISTORY'}]);
 }
 await a;
 assert.equal(x.view().devices.length,0,'Foreign devices must never render');
 assert.equal(x.view().backups.length,0,'Foreign history must never render');
 assert.match(x.runtime.cloudError,/ownership mismatch/);
 assert.equal(x.touches.length,0);
}
// Positive control: current A's own rows must render normally.
{
 const x=overviewFixture(),a=x.run();
 await until(()=>x.pending.length===2,'normal account overview');
 x.resolvePair(0,A);await a;
 assert.equal(x.view().devices[0].deviceId,A+'-device');
 assert.equal(x.view().backups[0].fileId,A+'-history');
 assert.deepEqual(x.touches,[A]);
}

function guestFixture(){
 let id=A,token='A_ACCESS',removed=0,downloads=0,confirmCount=0;
 const remote=deferred(),push=deferred(),applied=[],stash=[],original='{"state":{"missions":[]}}';
 const guest={snapshot:{state:{missions:[{id:'GUEST_ONLY'}],xp:10}}};
 const storage=new Map([['guest-vault',JSON.stringify(guest)]]);
 const localStorage={
  getItem:key=>storage.has(key)?storage.get(key):null,
  setItem:(key,v)=>storage.set(key,String(v)),
  removeItem:key=>{removed++;storage.delete(key)}
 };
 const ctx={
  String,JSON,Number,
  localStorage,GUEST_VAULT:'guest-vault',META_KEY:'account-meta',
  session:()=>({access_token:token,user:{id,email:id+'@invalid.test'}}),
  boardOwner:()=>id,
  ensureSession:async()=>({access_token:token,user:{id,email:id+'@invalid.test'}}),
  safeJson:(v,def=null)=>{try{return JSON.parse(v)}catch{return def}},
  remoteState:()=>remote.promise,
  meta:()=>({revision:0}),hasPersonalBoard:()=>false,
  confirm:()=>{confirmCount++;return true},
  capture:()=>original,
  accountVaultKey:who=>'vault-'+who,
  stashLocalBoard:key=>stash.push(key),
  applySnapshot:snap=>applied.push({id,state:snap.state}),
  push:()=>push.promise,
  location:{reload:()=>downloads++}
 };
 vm.createContext(ctx);
 vm.runInContext(ownership+'\n'+guestSource+'\nthis.runGuest=guestImport;',ctx,{timeout:3000});
 return {
  runGuest:ctx.runGuest,remote,push,applied,stash,storage,localStorage,
  get removed(){return removed},get downloads(){return downloads},get confirmCount(){return confirmCount},
  switchToB:()=>{id=B;token='B_ACCESS'}
 };
}
// A's eligibility read is stale: do not request consent or apply guest data.
{
 const x=guestFixture(),task=x.runGuest();
 x.switchToB();x.remote.resolve(null);
 await assert.rejects(task,/Authenticated account changed during sync/);
 assert.equal(x.applied.length,0);assert.equal(x.confirmCount,0);
 assert.equal(x.removed,0);
}
// A's upload completes after B becomes active: no B rollback, no guest deletion.
{
 const x=guestFixture(),task=x.runGuest();
 x.remote.resolve(null);
 await until(()=>x.stash.length===1,'guest import in-flight');
 assert.equal(x.applied.length,1,'Guest must be applied only while A is active');
 x.switchToB();x.push.resolve({revision:1});
 await assert.rejects(task,/Account changed during guest import/);
 assert.equal(x.applied.length,1,'A rollback must not overwrite B after account change');
 assert.equal(x.removed,0,'Guest source remains recoverable after interrupted import');
 assert.equal(x.downloads,0,'No reload after stale import');
}
// Same account path succeeds and removes guest ONLY after confirmed upload.
{
 const x=guestFixture(),task=x.runGuest();
 x.remote.resolve(null);await until(()=>x.stash.length===1,'normal guest import');
 assert.equal(x.removed,0,'Guest source must survive until provider acceptance');
 x.push.resolve({revision:1});await task;
 assert.equal(x.applied.length,1);
 assert.equal(x.removed,1);
 assert.equal(x.downloads,1);
}
console.log('PASS: 7/7 production Supabase stale device/history and guest import ownership regressions');
