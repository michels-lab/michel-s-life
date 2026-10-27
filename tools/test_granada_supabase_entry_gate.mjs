import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'src/MichelsLife/frontend/index.html'),'utf8');
const script=html.match(/<script id="mlv-v30216-supabase-sync-script">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script&&script.length>10000,'Production Supabase script must be present');
function extract(start,end) {
  const a=script.indexOf(start),b=script.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a&&script.indexOf(start,a+1)===-1,'Missing or ambiguous production function '+start);
  return script.slice(a,b);
}
const chunks=[
  extract('async function remoteState(s){','async function touchDevice('),
  extract("async function push(reason='manual',opts={}){",'function applySnapshot('),
  extract("async function sync(mode='auto',opts={}){",'function scheduleAutoSync()'),
  extract('async function initializeAfterAuth(){','function copy(){')
];
const runtimeSource=chunks.join('\n')+
  '\nthis.production={remoteState,push,sync,initializeAfterAuth};';
assert.ok(!script.includes("await push('first_upload')"),'Old automatic first upload remains');
assert.ok(script.includes("const remote=await remoteState(s);\n   if(remote)throw new Error('Guest import is blocked:"),'Guest import must reject existing remote before confirmation');
assert.ok(!script.includes("push('explicit_guest_import',{force:true})"),'Guest import must never force overwrite');
assert.ok(script.includes("applySnapshot(original);"),'Guest import must retain rollback');
assert.ok(script.includes("localStorage.removeItem(GUEST_VAULT);location.reload();"),'Guest vault must only be deleted after accepted upload');

function fixture() {
  let active='account-a1111',remoteRows=[],postCount=0,reads=0;
  const calls=[];
  const runtime={cloudBusy:false,cloudConflict:null,cloudError:'',connected:true};
  const ctx={
    runtime,BUILD:'3.0.TEST',applying:false,
    encodeURIComponent,Date,JSON,Number,String,Math,
    session:()=>({access_token:'SYNTHETIC',user:{id:active,email:active+'@invalid.test'}}),
    ensureSession:async()=>({access_token:'SYNTHETIC',user:{id:active,email:active+'@invalid.test'}}),
    assertOwnedBoard:s=>{assert.equal(s.user.id,active)},
    request:async(path,opts={})=>{
      calls.push({path,method:opts.method||'GET',body:opts.body});
      if(path.startsWith('/rest/v1/ml_state?select=')){reads++;return remoteRows;}
      if(path.startsWith('/rest/v1/ml_state')&&opts.method==='POST'){postCount++;return [opts.body]}
      if(path.startsWith('/rest/v1/ml_state')&&opts.method==='PATCH')return [];
      return [];
    },
    capture:()=>JSON.stringify({state:{missions:[{id:'account-owned-synthetic'}],xp:20}}),
    safeJson:(s,defaultValue)=>{try{return JSON.parse(s)}catch{return defaultValue}},
    meta:()=>({revision:0}),deviceId:()=> 'local-device-only',platform:()=> 'android',
    touchDevice:async()=>{},saveMeta:()=>{},writeHistory:async()=>{},
    es:()=>false,notify:()=>{},scheduleMount:()=>{},syncRuntime:()=>{},
    refreshOverview:async()=>{},prepareAccountBoard:id=>assert.equal(id,active)
  };
  vm.createContext(ctx);
  vm.runInContext(runtimeSource,ctx,{timeout:3000});
  return {api:ctx.production,runtime,calls,
    get postCount(){return postCount},
    get reads(){return reads},
    switchAccount:v=>{active=v},
    setRemote:rows=>{remoteRows=rows}
  };
}

{
  const x=fixture();
  await x.api.initializeAfterAuth();
  assert.equal(x.postCount,0,'Signing in must never auto-upload a first board');
  assert.equal(x.runtime.cloudConflict.remoteRevision,0);
  x.switchAccount('account-b2222');
  await x.api.initializeAfterAuth();
  assert.equal(x.postCount,0,'A to empty B must never upload A automatically');
  const output=await x.api.sync('auto',{silent:true});
  assert.equal(output.requiresOwnerConfirmation,true);
  assert.equal(x.postCount,0,'Background sync must not create empty B master');
  await assert.rejects(x.api.push('first_upload'),/explicit account-owner action/);
  assert.equal(x.postCount,0);
  const allowed=await x.api.sync('upload',{silent:true});
  assert.equal(x.postCount,1,'Owner-action upload to verified empty B can create master');
  assert.equal(allowed.user_id,'account-b2222');
  assert.ok(x.reads>=4);
  assert.ok(x.calls.some(c=>c.path.includes('user_id=eq.account-b2222&limit=1')),
    'Remote state queries must be scoped to authenticated account');
}
{
  const x=fixture();
  x.setRemote([{user_id:'different-person',revision:5,snapshot:{state:{xp:9}}}]);
  await assert.rejects(x.api.initializeAfterAuth(),/remote ownership mismatch/);
  await assert.rejects(x.api.sync('auto'),/remote ownership mismatch/);
  assert.equal(x.postCount,0,'A foreign remote must never be written');
}
{
  const x=fixture();
  x.setRemote(null);
  await assert.rejects(x.api.remoteState({user:{id:'account-a1111'},access_token:'SYNTHETIC'}),
    /verifiable account-scoped response/);
  await assert.rejects(x.api.remoteState({user:{id:''},access_token:'SYNTHETIC'}),
    /account ID is required/);
}
{
  const x=fixture();
  x.setRemote([{user_id:'account-a1111',revision:9,snapshot:{state:{missions:[{id:'a'}]}}}]);
  await x.api.initializeAfterAuth();
  assert.equal(x.postCount,0);
  assert.equal(x.runtime.cloudConflict.remoteRevision,9,'Existing remote requires choice');
  const val=await x.api.sync('auto',{silent:true});
  assert.equal(val.revision,9);
  assert.equal(x.postCount,0,'Existing cloud data must never be overwritten by automatic sync');
}
console.log('PASS: production Supabase first-login, A/B, guest, remote-ownership and explicit-write gates (synthetic provider)');
