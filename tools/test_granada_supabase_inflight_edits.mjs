// Regression for P0 #108/#55: real production Supabase push must not forget
// local edits that arrive during remote reads, PATCH ACK or device-touch I/O.
// All account IDs and content are synthetic. No provider or phone required.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const html=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),
 '../src/MichelsLife/frontend/index.html'),'utf8');
const script=html.match(/<script id="mlv-v30216-supabase-sync-script">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Production Supabase script is missing');
const start=script.indexOf("async function push(reason='manual',opts={}){");
const end=script.indexOf('function applySnapshot(',start);
assert.ok(start>=0&&end>start,'Production Supabase upload function is missing');
const productionPush=script.slice(start,end);
const A='account-a1111',B='account-b2222';
const deferred=()=>{let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no});return {promise,resolve,reject}};
async function until(condition,label){
 for(let n=0;n<100;n++){if(condition())return;await new Promise(ok=>setImmediate(ok))}
 throw Error('Provider operation did not reach expected stage: '+label);
}
function fixture(){
 let id=A,content='alpha',metaState={revision:5,dirty:true},captureFailure=false;
 const remote=deferred(),patch=deferred(),touch=deferred();
 const writes=[],scheduled=[],cancelled=[],metaWrites=[];
 let remoteReads=0,touchCalls=0;
 const session={user:{id:A},access_token:'SYNTHETIC_ACCESS'};
 const capture=()=>captureFailure?'':JSON.stringify({state:{xp:1,missions:[{id:content}]}});
 const ctx={
  JSON,Date,Math,Number,String,
  RESTORE_REVIEW_KEY:'synthetic-review',
  localStorage:{getItem:()=>null,removeItem:()=>{}},
  ensureSession:async()=>session,es:()=>false,
  assertOwnedBoard:s=>{
   if(id!==s.user.id)throw Error('Authenticated account changed during sync.');
  },
  pendingRestoreReview:()=>null,
  capture,safeJson:(raw,otherwise)=>{try{return JSON.parse(raw)}catch{return otherwise}},
  meta:()=>metaState,saveMeta:patchMeta=>{metaState={...metaState,...patchMeta};metaWrites.push({...metaState})},
  remoteState:()=>{remoteReads++;return remote.promise},
  request:async(path,opts)=>{writes.push({path,body:opts.body});return patch.promise},
  deviceId:()=> 'local-device',platform:()=> 'android',
  BUILD:'synthetic-version',
  runtime:{cloudConflict:null,firstMasterPending:false},
  writeHistory:async()=>{},
  touchDevice:()=>{touchCalls++;return touch.promise},
  clearTimeout:handle=>cancelled.push(handle),
  setTimeout:(callback,delay)=>{scheduled.push({callback,delay});return scheduled.length},
  sync:async()=>{},syncTimer:0
 };
 vm.createContext(ctx);
 vm.runInContext(productionPush+'\nthis.pushFromProduction=push;',ctx,{timeout:3000});
 return {
  start:()=>ctx.pushFromProduction('auto'),
  remote,patch,touch,writes,scheduled,cancelled,metaWrites,
  read:()=>({...metaState}),local:()=>content,
  edit:next=>{content=next},
  failCapture:()=>{captureFailure=true},
  switchToB:()=>{id=B},
  markDirty:()=>ctx.saveMeta({dirty:true}),
  get remoteReads(){return remoteReads},
  get touchCalls(){return touchCalls}
 };
}
async function reachPatch(x){
 const task=x.start();
 await until(()=>x.remoteReads===1,'remote state read');
 x.remote.resolve({user_id:A,revision:5});
 await until(()=>x.writes.length===1,'revision-checked PATCH');
 assert.match(x.writes[0].path,/revision=eq.5/);
 return {task};
}
async function finish(x,task){
 x.patch.resolve([{user_id:A,revision:6}]);
 await until(()=>x.touchCalls===1,'device receipt');
 x.touch.resolve();
 return task;
}
// Positive control: no intervening changes means the exact uploaded snapshot is clean.
{
 const x=fixture(),{task}=await reachPatch(x);
 assert.equal(x.writes[0].body.snapshot.state.missions[0].id,'alpha');
 await finish(x,task);
 assert.equal(x.read().dirty,false);
 assert.equal(x.scheduled.length,0);
}
// Original defect: two same-length mission IDs can change during an ACK wait.
// Previously saveMeta({dirty:false}) hid the unuploaded "bravo" forever.
{
 const x=fixture(),{task}=await reachPatch(x);
 x.edit('bravo'); // Same JSON length as alpha, but different user data.
 await finish(x,task);
 assert.equal(x.writes[0].body.snapshot.state.missions[0].id,'alpha');
 assert.equal(x.local(),'bravo');
 assert.equal(x.read().dirty,true,'Post-capture mission edit must remain unsynced');
 assert.equal(x.scheduled.length,1,'A follow-up sync must be rearmed after ACK');
 assert.equal(x.scheduled[0].delay,2500);
}
// A change while the initial provider read is pending is equally unsent.
{
 const x=fixture(),task=x.start();
 await until(()=>x.remoteReads===1,'remote state before edit');
 x.edit('bravo');
 x.remote.resolve({user_id:A,revision:5});
 await until(()=>x.writes.length===1,'delayed upload');
 await finish(x,task);
 assert.equal(x.writes[0].body.snapshot.state.missions[0].id,'alpha');
 assert.equal(x.read().dirty,true,'Edits while reading remote must not become falsely synced');
 assert.equal(x.scheduled.length,1);
}
// An edit may occur after saveMeta(), while touchDevice() is still awaiting a
// server response. The original 2500ms timer may have run while cloudBusy.
// Ensure the successful upload's tail explicitly re-arms the pending work.
{
 const x=fixture(),{task}=await reachPatch(x);
 x.patch.resolve([{user_id:A,revision:6}]);
 await until(()=>x.touchCalls===1,'delayed touchDevice');
 assert.equal(x.read().dirty,false);
 x.edit('bravo');x.markDirty();
 await finish(x,task);
 assert.equal(x.read().dirty,true);
 assert.equal(x.scheduled.length,1,'In-flight device-touch edit needs a fresh retry');
}
// Fail-closed: if a changed payload cannot be captured after the server ACK,
// do not advertise this device's local snapshot as fully synchronized.
{
 const x=fixture(),{task}=await reachPatch(x);
 x.failCapture();
 await finish(x,task);
 assert.equal(x.read().dirty,true);
 assert.equal(x.scheduled.length,1);
}
// A login switch during the final provider touch must not queue A's retry on B.
{
 const x=fixture(),{task}=await reachPatch(x);
 x.patch.resolve([{user_id:A,revision:6}]);
 await until(()=>x.touchCalls===1,'account-switch tail');
 x.switchToB();x.touch.resolve();
 await assert.rejects(task,/Authenticated account changed/);
 assert.equal(x.scheduled.length,0,'Do not retry A upload under B credentials');
}
console.log('PASS: 6/6 production Supabase in-flight edit preservation and account boundaries (synthetic)');
