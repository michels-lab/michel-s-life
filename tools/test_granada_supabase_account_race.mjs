// GRANADA P0 #108: exercise real production sync functions, not a mock implementation.
// All identities and snapshots here are synthetic; no provider or private data is used.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const html=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../src/MichelsLife/frontend/index.html'),'utf8');
const source=html.match(/<script id="mlv-v30216-supabase-sync-script">([\s\S]*?)<\/script>/)?.[1];
assert.ok(source&&source.length>10000,'Canonical production Supabase script missing');
function extract(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a&&source.indexOf(start,a+1)===-1,'Ambiguous production function '+start);
  return source.slice(a,b);
}
const real=[
  extract('function assertOwnedBoard(s){','function capture(){'),
  extract('async function signOut(){','async function remoteState(s){'),
  extract('async function remoteState(s){','async function touchDevice('),
  extract("async function push(reason='manual',opts={}){",'function applySnapshot('),
  extract('async function pull({reload=true}={}){','async function sync('),
  extract("async function sync(mode='auto',opts={}){",'function scheduleAutoSync()'),
  extract('async function initializeAfterAuth(){','function copy(){')
].join('\n')+'\nthis.api={pull,push,sync,initializeAfterAuth,signOut};';
const A='account-a1111', B='account-b2222';
const deferred=()=>{
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
  return {promise,resolve,reject};
};
async function until(predicate,name){
  for(let i=0;i<100;i++){
    if(predicate())return;
    await new Promise(resolve=>setImmediate(resolve));
  }
  throw new Error('Expected async phase absent: '+name);
}
function fixture(){
  let owner=A,token='TOKEN_A';
  const reads=[],posts=[],logouts=[],applied=[],saved=[],prepares=[],signedOut=[];
  const runtime={cloudBusy:false,cloudConflict:null,firstMasterPending:false,cloudError:'',connected:true,revision:0};
  const ctx={
    runtime,BUILD:'3.0.TEST',Date,JSON,Math,Number,String,encodeURIComponent,
    boardOwner:()=>owner,
    session:()=>({access_token:token,user:{id:owner,email:owner+'@invalid.test'}}),
    ensureSession:async()=>({access_token:token,user:{id:owner,email:owner+'@invalid.test'}}),
    request:(path,{method='GET'}={})=>{
      if(path.includes('/rest/v1/ml_state?select=')){const d=deferred();reads.push(d);return d.promise}
      if(path.startsWith('/rest/v1/ml_state')&&(method==='POST'||method==='PATCH')){const d=deferred();posts.push(d);return d.promise}
      if(path==='/auth/v1/logout'){const d=deferred();logouts.push(d);return d.promise}
      return Promise.resolve([]);
    },
    capture:()=>JSON.stringify({state:{missions:[{id:'synthetic-A'}],xp:10}}),
    safeJson:(value,fallback=null)=>{try{return JSON.parse(value)}catch{return fallback}},
    meta:()=>({revision:0}),deviceId:()=> 'synthetic-device',
    platform:()=> 'android',touchDevice:async()=>{},
    writeHistory:async()=>{},applySnapshot:value=>applied.push(value),
    saveMeta:patch=>saved.push({owner,patch}),notify:()=>{},
    scheduleMount:()=>{},syncRuntime:()=>{},refreshOverview:async()=>{},
    prepareAccountBoard:id=>prepares.push(id),es:()=>false,
    signOutLocal:()=>signedOut.push(owner),location:{reload:()=>{}}
  };
  vm.createContext(ctx);
  vm.runInContext(real,ctx,{timeout:3000});
  return {
    ...ctx.api,runtime,reads,posts,logouts,applied,saved,prepares,signedOut,
    switchToB:()=>{owner=B;token='TOKEN_B'},
    rotateA:()=>{token='TOKEN_A_REFRESHED'},
    owner:()=>owner
  };
}
const remoteA={user_id:A,revision:3,snapshot:{state:{missions:[{id:'PRIVATE-A'}],xp:77}},updated_at:'2026-10-27T00:00:00Z'};
const mustReject=async pending=>{
  await assert.rejects(pending,/Authenticated account changed during sync/);
};

{
  const x=fixture(),op=x.pull({reload:false});
  await until(()=>x.reads.length===1,'pull read');
  x.switchToB();x.reads[0].resolve([remoteA]);
  await mustReject(op);
  assert.equal(x.applied.length,0,'Late A download must never be applied to B');
  assert.equal(x.saved.length,0,'Late A download must not change B metadata');
}
{
  const x=fixture(),op=x.push('explicit_empty_remote_upload');
  await until(()=>x.reads.length===1,'push read');
  x.switchToB();x.reads[0].resolve([]);
  await mustReject(op);
  assert.equal(x.posts.length,0,'Late A remote read must not start an upload');
  assert.equal(x.saved.length,0);
}
{
  const x=fixture(),op=x.push('explicit_empty_remote_upload');
  await until(()=>x.reads.length===1,'push read before post');
  x.reads[0].resolve([]);
  await until(()=>x.posts.length===1,'cloud upload in flight');
  x.switchToB();x.posts[0].resolve([{user_id:A}]);
  await mustReject(op);
  assert.equal(x.saved.length,0,'Completed A upload must not write B metadata');
}
{
  const x=fixture(),op=x.initializeAfterAuth();
  assert.deepEqual(x.prepares,[A],'Board must switch before auth awaits');
  await until(()=>x.reads.length===1,'login remote read');
  x.switchToB();x.reads[0].resolve([]);
  await mustReject(op);
  assert.equal(x.runtime.firstMasterPending,false,'A must not change B first-master UI');
}
{
  const x=fixture(),op=x.sync('auto',{silent:true});
  await until(()=>x.reads.length===1,'auto sync read');
  x.switchToB();x.reads[0].resolve([]);
  await mustReject(op);
  assert.equal(x.runtime.firstMasterPending,false);
  assert.equal(x.posts.length,0);
  assert.equal(x.runtime.cloudBusy,false,'Busy flag must clear even on rejection');
}
{
  const x=fixture(),op=x.signOut();
  await until(()=>x.logouts.length===1,'provider logout');
  x.switchToB();x.logouts[0].resolve({});
  await mustReject(op);
  assert.deepEqual(x.signedOut,[],'Late A logout must not sign out B locally');
}
{
  const x=fixture(),op=x.pull({reload:false});
  await until(()=>x.reads.length===1,'token rotation');
  x.rotateA();x.reads[0].resolve([remoteA]);
  await mustReject(op);
  assert.equal(x.applied.length,0,'Old-token cloud response must not replace new-token board');
}
{
  const x=fixture(),op=x.pull({reload:false});
  await until(()=>x.reads.length===1,'normal pull');
  x.reads[0].resolve([remoteA]);
  await op;
  assert.equal(x.applied.length,1,'Normal same-account download still functions');
  assert.equal(x.saved.length,1,'Normal download still updates its own revision');
}
{
  const x=fixture(),op=x.push('explicit_empty_remote_upload');
  await until(()=>x.reads.length===1,'normal push read');
  x.reads[0].resolve([]);
  await until(()=>x.posts.length===1,'normal cloud upload');
  x.posts[0].resolve([{user_id:A}]);
  await op;
  assert.equal(x.saved.length,1,'Normal explicit upload still completes');
}
console.log('PASS: 9/9 production Supabase async account-switch and same-account regressions');


// The refresh branch is production code too: refresh and logout must not
// resurrect an old identity or wipe a newly authenticated account.
const refreshSource=extract('async function ensureSession(){','function syncRuntime(){');
function refreshFixture(){
  let live={access_token:'A_ACCESS',refresh_token:'A_REFRESH',expires_at:0,user:{id:A}};
  const refreshRequests=[],persisted=[],localSignOut=[];
  const ctx={
    session:()=>live,Date,Number,String,
    request:(path)=>{
      assert.equal(path,'/auth/v1/token?grant_type=refresh_token');
      const deferredRequest=deferred();refreshRequests.push(deferredRequest);return deferredRequest.promise;
    },
    storeSession:data=>{persisted.push(data);return data},
    signOutLocal:()=>localSignOut.push(live.user.id)
  };
  vm.createContext(ctx);
  vm.runInContext(refreshSource+'\nthis.refresh=ensureSession;',ctx,{timeout:3000});
  return {
    refresh:ctx.refresh,refreshRequests,persisted,localSignOut,
    switchToB:()=>{live={access_token:'B_ACCESS',refresh_token:'B_REFRESH',expires_at:0,user:{id:B}}}
  };
}
{
  const x=refreshFixture(),op=x.refresh();
  await until(()=>x.refreshRequests.length===1,'in-flight successful refresh');
  x.switchToB();
  x.refreshRequests[0].resolve({access_token:'LATE_A_TOKEN',user:{id:A}});
  await assert.rejects(op,/Session changed during refresh/);
  assert.equal(x.persisted.length,0,'Old refresh must not persist an A token after B login');
  assert.equal(x.localSignOut.length,0,'Old refresh must not sign out B');
}
{
  const x=refreshFixture(),op=x.refresh();
  await until(()=>x.refreshRequests.length===1,'in-flight failing refresh');
  x.switchToB();
  x.refreshRequests[0].reject(new Error('synthetic provider offline'));
  await assert.rejects(op,/synthetic provider offline/);
  assert.equal(x.localSignOut.length,0,'Old failed refresh must not sign out B');
}
{
  const x=refreshFixture(),op=x.refresh();
  await until(()=>x.refreshRequests.length===1,'same-account refresh');
  x.refreshRequests[0].resolve({access_token:'NEW_A_TOKEN',user:{id:A}});
  await op;
  assert.equal(x.persisted.length,1,'Current account may refresh normally');
  assert.equal(x.localSignOut.length,0);
}
{
  const x=refreshFixture(),op=x.refresh();
  await until(()=>x.refreshRequests.length===1,'wrong identity refresh');
  x.refreshRequests[0].resolve({access_token:'UNEXPECTED_B_TOKEN',user:{id:B}});
  await assert.rejects(op,/Session refresh changed the authenticated account/);
  assert.equal(x.persisted.length,0,'Mismatched token is never stored');
  assert.equal(x.localSignOut.length,1,'Invalid current refresh invalidates only current A');
}
console.log('PASS: 4/4 production token refresh A/B concurrency regressions');
