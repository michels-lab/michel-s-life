// P0 #55/#108: test the actual production pull(), not a reimplementation.
// A delayed recovery-history POST must not overwrite later Journal/mission edits.
// Synthetic users only: no external Supabase connection or personal content.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const html=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),
 '../src/MichelsLife/frontend/index.html'),'utf8');
const script=html.match(/<script id="mlv-v30216-supabase-sync-script">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Production Supabase script missing');
const start=script.indexOf('async function pull({reload=true}={}){');
const end=script.indexOf("async function sync(mode='auto',opts={}){",start);
assert.ok(start>=0&&end>start,'Production Supabase download path missing');
const realPull=script.slice(start,end),A='account-a1111',B='account-b2222';
const deferred=()=>{let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no});return {promise,resolve,reject}};
async function until(test,label){
 for(let i=0;i<100;i++){if(test())return;await new Promise(ok=>setImmediate(ok))}
 throw Error('Did not reach expected async phase: '+label);
}
function fixture(){
 let account=A,localId='alpha',historyCalls=0,applied=0,removed=0,
  saved=0,reloads=0,invalid=false,remoteReads=0;
 const remote=deferred(),history=deferred();
 const historySnapshots=[],current=()=>({state:{xp:1,missions:[{id:localId}]}});
 const currentSession=()=>({user:{id:account},access_token:'SYNTHETIC'});
 const ctx={
  Date,Math,Number,String,JSON,
  ensureSession:async()=>currentSession(),
  es:()=>false,
  assertOwnedBoard:s=>{
   if(s.user.id!==account)throw Error('Authenticated account changed during sync.');
  },
  remoteState:()=>{remoteReads++;return remote.promise},
  capture:()=>invalid?'':JSON.stringify(current()),
  safeJson:(raw,otherwise)=>{try{return JSON.parse(raw)}catch{return otherwise}},
  writeHistory:(_s,row)=>{historyCalls++;historySnapshots.push(row.snapshot);return history.promise},
  meta:()=>({revision:5}),deviceId:()=> 'synthetic-device',
  platform:()=> 'android',BUILD:'synthetic-version',
  applySnapshot:snapshot=>{applied++;localId=snapshot.state.missions[0].id},
  RESTORE_REVIEW_KEY:'review',
  localStorage:{removeItem:()=>{removed++}},
  saveMeta:()=>{saved++},runtime:{cloudConflict:null},
  touchDevice:async()=>{},location:{reload:()=>{reloads++}}
 };
 vm.createContext(ctx);
 vm.runInContext(realPull+'\nthis.pullFromProduction=pull;',ctx,{timeout:3000});
 return {
  start:()=>ctx.pullFromProduction({reload:false}),remote,history,
  edit:id=>{localId=id},failCapture:()=>{invalid=true},
  changeAccount:()=>{account=B},get local(){return localId},
  get historyCalls(){return historyCalls},get historySnapshots(){return historySnapshots},
  get remoteReads(){return remoteReads},get applied(){return applied},
  get removed(){return removed},get saved(){return saved},get reloads(){return reloads}
 };
}
const remoteRow={user_id:A,revision:6,updated_at:'2026-10-21T00:00:00Z',
 snapshot:{state:{missions:[{id:'remote'}]}}};
async function reachHistory(x){
 const task=x.start();
 await until(()=>x.remoteReads===1,'cloud read');
 x.remote.resolve(remoteRow);
 await until(()=>x.historyCalls===1,'recovery-history request');
 return {task};
}
// Control: real recovery history is saved BEFORE an unchanged local state is replaced.
{
 const x=fixture(),{task}=await reachHistory(x);
 assert.equal(x.local,'alpha');
 assert.equal(x.historySnapshots[0].state.missions[0].id,'alpha');
 x.history.resolve();
 await task;
 assert.equal(x.local,'remote');
 assert.equal(x.applied,1);assert.equal(x.saved,1);assert.equal(x.removed,1);
}
// The previously broken path overwrote bravo with remote while its only
// recovery point still held alpha. These same-length IDs detect weak hash tests.
{
 const x=fixture(),{task}=await reachHistory(x);
 x.edit('bravo');
 x.history.resolve();
 await assert.rejects(task,/Local data changed during cloud download/);
 assert.equal(x.historySnapshots[0].state.missions[0].id,'alpha');
 assert.equal(x.local,'bravo','New in-flight mission must remain on device');
 assert.equal(x.applied,0);assert.equal(x.removed,0);assert.equal(x.saved,0);
}
// If capture fails, a download must not proceed without a recoverable local copy.
{
 const x=fixture();x.failCapture();
 const task=x.start();
 await until(()=>x.remoteReads===1,'invalid local recovery');
 x.remote.resolve(remoteRow);
 await assert.rejects(task,/Cannot verify a local recovery snapshot/);
 assert.equal(x.historyCalls,0);assert.equal(x.applied,0);
 assert.equal(x.local,'alpha');assert.equal(x.saved,0);
}
// A rejected provider recovery POST must not allow local state destruction.
{
 const x=fixture(),{task}=await reachHistory(x);
 x.history.reject(new Error('synthetic history provider unavailable'));
 await assert.rejects(task,/synthetic history provider unavailable/);
 assert.equal(x.local,'alpha');assert.equal(x.applied,0);assert.equal(x.saved,0);
}
// A-to-B switch during recovery POST must not apply A's download into B.
{
 const x=fixture(),{task}=await reachHistory(x);
 x.changeAccount();x.edit('bravo');x.history.resolve();
 await assert.rejects(task,/Authenticated account changed during sync/);
 assert.equal(x.local,'bravo');assert.equal(x.applied,0);assert.equal(x.saved,0);
}
// If the local user changes data while remoteState is resolving (before the
// recovery point), capture the fresh state and then permit the download.
{
 const x=fixture(),task=x.start();
 await until(()=>x.remoteReads===1,'pre-capture edit');
 x.edit('bravo');x.remote.resolve(remoteRow);
 await until(()=>x.historyCalls===1,'fresh backup');
 assert.equal(x.historySnapshots[0].state.missions[0].id,'bravo');
 x.history.resolve();await task;
 assert.equal(x.local,'remote');assert.equal(x.applied,1);
}
console.log('PASS: 6/6 production Supabase download recovery integrity regressions (synthetic)');
