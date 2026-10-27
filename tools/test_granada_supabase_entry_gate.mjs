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

// Test the REAL credential-persistence function with forced account-switch
// failure. New account credentials must never precede the local board change.
{
  const source=extract('function storeSession(data){','async function ensureSession(){');
  const old={access_token:'A-token',refresh_token:'A-refresh',user:{id:'account-a1111'}};
  for(const mustFail of [false,true]){
    const events=[],saved=[];
    let visible='account-a1111';
    const ctx={session:()=>old,boardOwner:()=>visible,
      prepareAccountBoard:id=>{
        events.push('isolate:'+id);
        if(mustFail)throw new Error('synthetic_disk_quota');
        visible=id;
      },
      localStorage:{setItem:(key,value)=>{
        events.push('persist:'+visible);saved.push([key,JSON.parse(value)]);
      }},SESSION_KEY:'device-session',Date,Math,Number,String,
      syncRuntime:()=>events.push('render')
    };
    vm.createContext(ctx);vm.runInContext(source+'\nthis.persist=storeSession;',ctx,{timeout:1500});
    const token={access_token:'B-token',refresh_token:'B-refresh',
      expires_in:3600,user:{id:'account-b2222'}};
    if(mustFail){
      assert.throws(()=>ctx.persist(token),/synthetic_disk_quota/);
      assert.equal(saved.length,0,'Failed board swap must not persist B token');
      assert.deepEqual(events,['isolate:account-b2222']);
    }else{
      ctx.persist(token);
      assert.deepEqual(events,['isolate:account-b2222','persist:account-b2222','render']);
      assert.equal(saved[0][1].user.id,'account-b2222');
      assert.equal(saved[0][1].access_token,'B-token');
    }
    // Credential-less identities cannot bootstrap without a prior session.
    const noPrevious={...ctx,session:()=>null};
    vm.createContext(noPrevious);
    vm.runInContext(source+'\nthis.persist=storeSession;',noPrevious,{timeout:1500});
    assert.throws(()=>noPrevious.persist({access_token:'unowned-token'}),
      /verified account identity/,
      'Unknown auth identity must not be persisted');
  }
}

// Password, sign-up and OTP cannot inherit the previous account ID when the
// provider response omits the verified user. This is a production source gate.
for(const [label,section] of [
  ['password',extract('async function signIn(email,password){','async function signUp(')],
  ['sign-up',extract('async function signUp(email,password){','function authMode(){')],
  ['OTP',extract('async function verifyOtp(email,token){','function signOutLocal(){')]
]) {
  const proof=section.indexOf('!data?.user?.id');
  const stored=section.indexOf('storeSession(data)');
  assert.ok(proof>=0&&stored>proof,label+' must prove returned identity BEFORE local session storage');
}
const initSource=extract('async function initializeAfterAuth(){','function copy(){');
assert.ok(initSource.indexOf('prepareAccountBoard(initial.user.id)')>=0);
assert.ok(initSource.indexOf('prepareAccountBoard(initial.user.id)')<initSource.indexOf('await ensureSession()'),
  'Account board must switch synchronously before the first auth await');
const refreshSource=extract('async function ensureSession(){','function syncRuntime(){');
assert.ok(refreshSource.includes('Session refresh changed the authenticated account'),
  'Refresh must reject token user ID switching');


assert.ok(script.includes("localStorage.removeItem(GUEST_VAULT);location.reload();"),'Guest vault must only be deleted after accepted upload');

function fixture() {
  let active='account-a1111',remoteRows=[],postCount=0,reads=0,prepares=0;
  const calls=[];
  const runtime={cloudBusy:false,cloudConflict:null,firstMasterPending:false,cloudError:'',connected:true};
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
    refreshOverview:async()=>{},prepareAccountBoard:id=>{prepares++;assert.equal(id,active)}
  };
  vm.createContext(ctx);
  vm.runInContext(runtimeSource,ctx,{timeout:3000});
  return {api:ctx.production,runtime,calls,
    get postCount(){return postCount},
    get reads(){return reads},
    get prepares(){return prepares},
    switchAccount:v=>{active=v},
    setRemote:rows=>{remoteRows=rows}
  };
}

{
  const x=fixture();
  const loginA=x.api.initializeAfterAuth();
  assert.equal(x.prepares,1,'Account A board must switch before auth yields');
  await loginA;
  assert.equal(x.postCount,0,'Signing in must never auto-upload a first board');
  assert.equal(x.runtime.firstMasterPending,true,'Empty cloud must show owner setup, not a conflict');
  assert.equal(x.runtime.cloudConflict,null,'No cloud account must not open the conflict overlay');
  x.switchAccount('account-b2222');
  const loginB=x.api.initializeAfterAuth();
  assert.equal(x.prepares,2,'Account B board must switch before auth yields');
  await loginB;
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

// Exercise the production board-owner / vault functions (not a mock boundary).
// A and B must retain independent Journal and board data, with credentials and
// device identity staying outside account-owned shareable snapshots.
{
  const board='vida_rpg_personal_progress_v2',
        ownerKey='michelsLife.supabase.boardOwner.v30218',
        sessionKey='michelsLife.supabase.session.v30216',
        deviceKey='michelsLife.supabase.device.v30216',
        metaKey='michelsLife.supabase.meta.v30216',
        journal='michelsLife.journal.v30184';
  const entries=new Map([
    [board,JSON.stringify({xp:81,missions:[{id:'A-only'}],settings:{characterName:'A'}})],
    [ownerKey,'account-a1111'],[journal,JSON.stringify({records:['A PRIVATE JOURNAL']})],
    [sessionKey,'SYNTHETIC_SESSION_LOCAL'],[deviceKey,'SYNTHETIC_DEVICE_LOCAL'],
    [metaKey,JSON.stringify({revision:12})]
  ]);
  const storage={
    getItem:k=>entries.has(k)?entries.get(k):null,
    setItem:(k,v)=>entries.set(k,String(v)),
    removeItem:k=>entries.delete(k)
  };
  const ctx={localStorage:storage,JSON,String,Number,Object,Date,encodeURIComponent,
    applying:false,safeJson:(value,defaultValue=null)=>{try{return JSON.parse(value)}catch{return defaultValue}},
    meta:()=>JSON.parse(storage.getItem(metaKey)||'{}'),
    state:JSON.parse(storage.getItem(board)),
    defaultState:()=>({xp:0,missions:[],settings:{}}),
    renderAll:()=>{},
    window:{MLVCloudSharedStorageV30216:{
      capture:()=>({[journal]:storage.getItem(journal)}),
      restore:source=>{if(source&&source[journal]!==undefined&&source[journal]!==null)
        storage.setItem(journal,source[journal]);else storage.removeItem(journal)}
    }}
  };
  ctx.capture=()=>JSON.stringify({state:ctx.state,localStorage:ctx.window.MLVCloudSharedStorageV30216.capture()});
  vm.createContext(ctx);
  const realOwnership=extract('function boardOwner(){','function capture(){');
  const realRestore=extract('function applySnapshot(snapshot){','async function pull(');
  const accountStorageConstants=[
    "const BOARD_OWNER_KEY='michelsLife.supabase.boardOwner.v30218';",
    "const ACCOUNT_VAULT='michelsLife.supabase.localAccount.v30218.';",
    "const GUEST_VAULT='michelsLife.supabase.localGuest.v30218';",
    "const META_KEY='michelsLife.supabase.meta.v30216';"
  ].join('\n');
  vm.runInContext(accountStorageConstants+'\n'+realOwnership+'\n'+realRestore+
    '\nthis.board={prepareAccountBoard,boardOwner};',ctx,{timeout:3000});
  ctx.board.prepareAccountBoard('account-b2222');
  assert.equal(ctx.board.boardOwner(),'account-b2222');
  assert.equal(JSON.parse(storage.getItem(board)).missions.length,0);
  assert.equal(storage.getItem(journal),null,'Account A journal must not be visible under B');
  assert.equal(storage.getItem(sessionKey),'SYNTHETIC_SESSION_LOCAL');
  assert.equal(storage.getItem(deviceKey),'SYNTHETIC_DEVICE_LOCAL');
  const aVault=JSON.parse(storage.getItem('michelsLife.supabase.localAccount.v30218.account-a1111'));
  assert.equal(aVault.snapshot.state.missions[0].id,'A-only');
  ctx.state={xp:25,missions:[{id:'B-only'}],settings:{characterName:'B'}};
  storage.setItem(board,JSON.stringify(ctx.state));
  storage.setItem(journal,JSON.stringify({records:['B PRIVATE JOURNAL']}));
  ctx.board.prepareAccountBoard('account-a1111');
  assert.equal(JSON.parse(storage.getItem(board)).missions[0].id,'A-only');
  assert.equal(JSON.parse(storage.getItem(journal)).records[0],'A PRIVATE JOURNAL');
  ctx.board.prepareAccountBoard('account-b2222');
  assert.equal(JSON.parse(storage.getItem(board)).missions[0].id,'B-only');
  assert.equal(JSON.parse(storage.getItem(journal)).records[0],'B PRIVATE JOURNAL');
  assert.equal(storage.getItem(sessionKey),'SYNTHETIC_SESSION_LOCAL');
  assert.equal(storage.getItem(deviceKey),'SYNTHETIC_DEVICE_LOCAL');
}

console.log('PASS: production Supabase first-login, A/B, guest, remote-ownership and explicit-write gates (synthetic provider)');
