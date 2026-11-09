import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'src/MichelsLife/frontend/index.html'),'utf8');
function extract(a,b){
  const i=html.indexOf(a),j=html.indexOf(b,i+a.length);
  assert.ok(i>=0&&j>i, 'Missing actual production code span '+a);
  return html.slice(i,j);
}
const shared=extract('const MLV_SHARED_STORAGE_KEYS=new Set(', 'function captureCloudBackup(){');
const drive=extract('async function applyCloudRestore(res){','function cloudActionLabel(');
const portable=extract('function applyBackupJson(raw){','function diagCard(){');
const REVIEW='michelsLife.restoreReview.v1';
const OWNER='michelsLife.supabase.boardOwner.v30218';
const BOARD='vida_rpg_personal_progress_v2';
const JOURNAL='michelsLife.journal.v30184';
const TOKEN='michelsLife.supabase.session.v30216';
const DEVICE='michelsLife.supabase.device.v30216';
const A={version:2,xp:33,missions:[{id:'A'}],settings:{}};
const B={version:2,xp:67,missions:[{id:'B'}],settings:{}};
class Storage {
  constructor(values={}){this.data=new Map(Object.entries(values));this.writes=[];}
  getItem(key){return this.data.has(key)?this.data.get(key):null;}
  setItem(key,value){this.writes.push(['set',String(key)]);this.data.set(String(key),String(value));}
  removeItem(key){this.writes.push(['remove',String(key)]);this.data.delete(String(key));}
  clear(){throw Error('Global clear() is forbidden during cloud restore');}
}
function fixture(){
  const localStorage=new Storage({
    [OWNER]:'account-A',[TOKEN]:'SYNTHETIC_A_TOKEN',[DEVICE]:'SYNTHETIC_A_DEVICE',
    [BOARD]:JSON.stringify(A),[JOURNAL]:'A JOURNAL',
  });
  const sessionStorage=new Storage();
  const events=[];
  const context={
    window:{},localStorage,sessionStorage,JSON,Map,Set,Date,Object,String,
    Error,Array,clearTimeout:()=>{},cloudSaveTimer:0,
    runtime:{restoring:false},
    bridge:async()=>{events.push('ack');return {};},
    location:{reload:()=>events.push('reload')},
  };
  vm.createContext(context);
  vm.runInContext(shared+'\n'+drive+'\n'+portable+
    '\nthis.actions={drive:applyCloudRestore,portable:applyBackupJson};',
    context,{timeout:2000});
  return {ctx:context,local:localStorage,session:sessionStorage,events,actions:context.actions};
}
test('Drive adoption saves cross-provider review BEFORE writing and never copies B auth to A',async()=>{
  const f=fixture();
  const backup={cloudPayloadVersion:2,state:B,localStorage:{
    [BOARD]:JSON.stringify({xp:1}),[JOURNAL]:'B JOURNAL',[TOKEN]:'B DANGER',
    [DEVICE]:'device-B'
  }};
  await f.actions.drive({backupJson:JSON.stringify(backup),remoteHash:'synthetic-hash'});
  const review=JSON.parse(f.local.getItem(REVIEW));
  assert.equal(review.ownerId,'account-A');
  assert.equal(review.source,'google-drive-download');
  assert.equal(JSON.parse(f.local.getItem(BOARD)).xp,67);
  assert.equal(f.local.getItem(JOURNAL),'B JOURNAL');
  assert.equal(f.local.getItem(TOKEN),'SYNTHETIC_A_TOKEN');
  assert.equal(f.local.getItem(DEVICE),'SYNTHETIC_A_DEVICE');
  assert.equal(f.local.writes[0][1],REVIEW,
    'Review marker was not persisted before the first restore mutation');
  assert.deepEqual(f.events,['ack','reload']);
  assert.equal(f.ctx.runtime.restoring,false);
});
test('Drive metadata rejection rolls back local board/Journal without clearing account-review gate',async()=>{
  const f=fixture(),before=[f.local.getItem(BOARD),f.local.getItem(JOURNAL)];
  f.ctx.bridge=async()=>{throw Error('synthetic provider ACK rejected');};
  const payload={cloudPayloadVersion:2,state:B,localStorage:{
    [BOARD]:JSON.stringify(B),[JOURNAL]:'B JOURNAL'
  }};
  await assert.rejects(f.actions.drive({backupJson:JSON.stringify(payload)}),/synthetic provider ACK rejected/);
  assert.deepEqual([f.local.getItem(BOARD),f.local.getItem(JOURNAL)],before,
    'Unacknowledged Drive restore changed local user progress');
  assert.ok(f.local.getItem(REVIEW),'Cloud review gate cleared despite failed ACK');
  assert.equal(f.local.getItem(TOKEN),'SYNTHETIC_A_TOKEN');
  assert.deepEqual(f.events,[]);
  assert.equal(f.ctx.runtime.restoring,false);
});
test('Portable import preserves device identity and requires review before any provider upload',()=>{
  const f=fixture();
  f.actions.portable(JSON.stringify({state:B,localStorage:{
    [BOARD]:JSON.stringify(A),[JOURNAL]:'IMPORTED JOURNAL',
    [TOKEN]:'SYNTHETIC_B_CREDENTIAL'
  }}));
  const review=JSON.parse(f.local.getItem(REVIEW));
  assert.equal(review.source,'portable-import');
  assert.equal(review.ownerId,'account-A');
  assert.equal(JSON.parse(f.local.getItem(BOARD)).xp,67);
  assert.equal(f.local.getItem(JOURNAL),'IMPORTED JOURNAL');
  assert.equal(f.local.getItem(TOKEN),'SYNTHETIC_A_TOKEN');
  assert.equal(f.local.getItem(DEVICE),'SYNTHETIC_A_DEVICE');
  assert.equal(f.local.writes[0][1],REVIEW);
  assert.equal(f.session.getItem('mlv202Imported'),'1');
  assert.deepEqual(f.events,['reload']);
});
test('Portable foreign-only invalid backup refuses before writing review or data',()=>{
  const f=fixture();
  assert.throws(()=>f.actions.portable(JSON.stringify({localStorage:{
    [TOKEN]:'SYNTHETIC_FOREIGN_TOKEN'
  }})),/does not contain a restorable/);
  assert.equal(f.local.getItem(REVIEW),null);
  assert.equal(f.local.getItem(TOKEN),'SYNTHETIC_A_TOKEN');
  assert.deepEqual(f.events,[]);
});

const deferred=()=>{
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
  return {promise,resolve,reject};
};
test('Drive ACK from account A cannot roll back newer account C after a real session switch',async()=>{
  const f=fixture(),request=deferred();
  f.ctx.bridge=()=>request.promise;
  const restore=f.actions.drive({backupJson:JSON.stringify({
    cloudPayloadVersion:2,state:B,localStorage:{[BOARD]:JSON.stringify(B),[JOURNAL]:'B JOURNAL'}
  })});
  assert.equal(JSON.parse(f.local.getItem(BOARD)).xp,67,'Drive data was not applied before ACK');
  f.local.setItem(OWNER,'account-C');
  f.ctx.window.SupabaseSyncV30216={session:()=>({user:{id:'account-C'}})};
  const C={version:2,xp:101,missions:[{id:'C PRIVATE'}],settings:{}};
  f.local.setItem(BOARD,JSON.stringify(C));
  f.local.setItem(JOURNAL,'C PRIVATE JOURNAL');
  f.local.setItem(TOKEN,'SYNTHETIC_C_TOKEN');
  request.reject(Error('synthetic account-A ACK failed'));
  await assert.rejects(restore,/Account changed during Drive restore acknowledgement/);
  assert.equal(f.local.getItem(BOARD),JSON.stringify(C),'A rollback overwrote C current board');
  assert.equal(f.local.getItem(JOURNAL),'C PRIVATE JOURNAL');
  assert.equal(f.local.getItem(TOKEN),'SYNTHETIC_C_TOKEN');
  assert.deepEqual(f.events,[],'A callback navigated or reloaded C');
  assert.equal(f.ctx.runtime.restoring,false);
});
test('Drive ACK success from previous user never reloads the newly active account',async()=>{
  const f=fixture(),request=deferred();
  f.ctx.bridge=()=>request.promise;
  const restore=f.actions.drive({backupJson:JSON.stringify({
    cloudPayloadVersion:2,state:B,localStorage:{[BOARD]:JSON.stringify(B)}
  })});
  f.local.setItem(OWNER,'account-C');
  f.local.setItem(BOARD,JSON.stringify(A));
  request.resolve({});
  await assert.rejects(restore,/Stale response ignored/);
  assert.equal(f.local.getItem(BOARD),JSON.stringify(A));
  assert.equal(f.session.getItem('mlv191CloudRestored'),null);
  assert.deepEqual(f.events,[]);
});
test('Drive ACK failure never reverts fresh edits made under the same account while waiting',async()=>{
  const f=fixture(),request=deferred();
  f.ctx.bridge=()=>request.promise;
  const restore=f.actions.drive({backupJson:JSON.stringify({
    cloudPayloadVersion:2,state:B,localStorage:{[BOARD]:JSON.stringify(B),[JOURNAL]:'B JOURNAL'}
  })});
  const revised={version:2,xp:70,missions:[{id:'new-user-edit'}],settings:{}};
  f.local.setItem(BOARD,JSON.stringify(revised));
  request.reject(Error('synthetic-timeout'));
  await assert.rejects(restore,/Local progress changed during Drive restore acknowledgement/);
  assert.equal(f.local.getItem(BOARD),JSON.stringify(revised),'Async rollback erased new work');
  assert.equal(f.local.getItem(TOKEN),'SYNTHETIC_A_TOKEN');
  assert.equal(f.ctx.runtime.restoring,false);
});
