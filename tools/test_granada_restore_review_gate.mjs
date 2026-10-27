// GRANADA #108/#55: production-sourced backup restore review and sync guard.
// No real provider, user data, or credentials. Local-only deterministic VM tests.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const html=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../src/MichelsLife/frontend/index.html'),'utf8');
function script(id) {
 const body=html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))?.[1];
 assert.ok(body&&body.length>1000,'Missing canonical script '+id);
 return body;
}
const timeline=script('mlv-v30201-backup-timeline-script'),supa=script('mlv-v30216-supabase-sync-script');
function extract(source,a,b){
 const i=source.indexOf(a),j=source.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i&&source.indexOf(a,i+1)<0,'Production extraction failed: '+a);
 return source.slice(i,j);
}
const key='michelsLife.restoreReview.v1',ownerKey='michelsLife.supabase.boardOwner.v30218',A='account-a1111',B='account-b2222';
const board='vida_rpg_personal_progress_v2';
class Storage{
 constructor(entries={}){this.map=new Map(Object.entries(entries));this.writes=[]}
 getItem(k){return this.map.has(k)?this.map.get(k):null}
 setItem(k,v){this.writes.push(['set',k]);this.map.set(k,String(v))}
 removeItem(k){this.writes.push(['remove',k]);this.map.delete(k)}
}
const review=owner=>JSON.stringify({version:1,ownerId:owner,source:'backup-timeline'});
const localBackup=JSON.stringify({state:{xp:49,missions:[{id:'RESTORED-SYNTHETIC'}]},localStorage:{[board]:'{"xp":49}'}});

const timelineApply=extract(timeline,'function applyBackupJson(backupJson,cloudMeta=null,uploadAfter=false){','async function doRestore(){');
function restoreFixture(){
 const store=new Storage({[ownerKey]:A,[board]:'{"xp":1}'}),session=new Storage();
 const events=[],ctx={
  localStorage:store,sessionStorage:session,window:{MLVCloudSharedStorageV30216:{
   allowed:k=>k===board,restore:values=>{events.push('restore-share');store.setItem(board,values[board])}
  }},Date,JSON,Object,String,
  location:{reload:()=>events.push('reload')},
  bridge:async()=>({}),uploadAfter:false
 };
 vm.createContext(ctx);
 vm.runInContext(timelineApply+'\nthis.runRestore=applyBackupJson;',ctx,{timeout:3000});
 return {store,session,events,run:ctx.runRestore};
}
// Even the previous uploadAfter=true and connected Supabase cannot auto-upload.
{
 const x=restoreFixture();await x.run(localBackup,null,true);
 assert.ok(x.store.getItem(key),'Restore review survives reload');
 assert.equal(JSON.parse(x.store.getItem(key)).ownerId,A);
 assert.equal(x.session.getItem('mlv201UploadRestoredLocal'),null,'Old automatic upload flag must not be set');
 assert.equal(x.store.writes[0][1],key,'Review marker must be committed BEFORE board writes');
 assert.equal(x.events.includes('reload'),true);
}
{
 const x=restoreFixture();
 assert.throws(()=>x.run(JSON.stringify({localStorage:{'supabase.session':'secret'}})),/no restorable Michel’s Life state/);
 assert.equal(x.store.getItem(key),null,'Invalid restore never arms an upload');
}

const restoreAction=extract(timeline,'async function doRestore(){','function mount(){');
function asyncRestoreFixture(){
 let active=A;const pending=[];
 const events=[],backup={backupJson:localBackup},ctx={
  selected:{source:'local',fileName:'safe.json'},
  document:{querySelector:()=>null},
  localStorage:new Storage({[ownerKey]:A}),
  window:{SupabaseSyncV30216:{session:()=>({user:{id:active}})}},
  capture:()=>localBackup,
  bridge:()=>new Promise((yes,no)=>pending.push({yes,no})),
  applyBackupJson:()=>events.push('applied'),notify:()=>events.push('notification'),
  Error,String
 };
 vm.createContext(ctx);
 vm.runInContext(restoreAction+'\nthis.runRestore=doRestore;',ctx,{timeout:3000});
 return {run:ctx.runRestore,pending,events,switchToB:()=>{active=B;ctx.localStorage.setItem(ownerKey,B)}};
}
const tick=async()=>{for(let j=0;j<6;j++)await Promise.resolve()};
{
 const x=asyncRestoreFixture(),op=x.run();
 await tick();assert.equal(x.pending.length,1);
 x.switchToB();x.pending[0].yes({backupJson:localBackup});
 await op;
 assert.equal(x.events.includes('applied'),false,'Delayed A restore must not overwrite B local board');
}
{
 const x=asyncRestoreFixture(),op=x.run();
 await tick();x.pending[0].yes({backupJson:localBackup});await op;
 assert.deepEqual(x.events,['applied'],'Valid same-account restore remains functional');
}
assert.ok(!timeline.includes("setTimeout(async()=>{try{const supa=window.SupabaseSyncV30216"),'No delayed forced cloud sync');
assert.ok(html.includes("if(mode==='auto'&&localStorage.getItem('michelsLife.restoreReview.v1'))return null;"),
 'Google Drive automatic sync must stop after local restore');
assert.ok(supa.includes("if(!confirm(es()?'¿Subir el respaldo restaurado"),
 'Restored Supabase upload requires explicit UI confirmation');

const real=[
 extract(supa,'function pendingRestoreReview(){','function assertOwnedBoard(s){'),
 extract(supa,'function assertOwnedBoard(s){','function capture(){'),
 extract(supa,'async function remoteState(s){','async function touchDevice('),
 extract(supa,"async function push(reason='manual',opts={}){",'function applySnapshot('),
 extract(supa,'async function pull({reload=true}={}){','async function sync('),
 extract(supa,"async function sync(mode='auto',opts={}){",'function scheduleAutoSync()')
].join('\n')+'\nthis.production={pendingRestoreReview,push,sync,pull};';
const deferred=()=>{let resolve;const promise=new Promise(yes=>resolve=yes);return {promise,resolve}};
function syncFixture(owner=A,reviewRaw=review(A),remote=null){
 let active=owner,reads=0,uploads=0,applied=0;
 const pending=[],store=new Storage({[key]:reviewRaw});
 const runtime={cloudBusy:false,cloudAction:'',cloudError:'',cloudConflict:null,firstMasterPending:false};
 const ctx={
  RESTORE_REVIEW_KEY:key,localStorage:store,JSON,Date,Math,String,Number,encodeURIComponent,
  session:()=>({access_token:'TOKEN_'+active,user:{id:active}}),
  boardOwner:()=>active,
  ensureSession:async()=>({access_token:'TOKEN_'+active,user:{id:active}}),
  runtime,meta:()=>({revision:0}),safeJson:(v,d=null)=>{try{return JSON.parse(v)}catch{return d}},
  request:async(path,{method='GET'}={})=>{
   if(path.includes('/ml_state?select=')){reads++;return remote===null?[]:remote}
   if(method==='POST'||method==='PATCH'){uploads++;const d=deferred();pending.push(d);return d.promise}
   return []
  },
  capture:()=>localBackup,deviceId:()=> 'synthetic-device',platform:()=> 'android',
  saveMeta:()=>{},touchDevice:async()=>{},writeHistory:async()=>{},
  notify:()=>{},scheduleMount:()=>{},es:()=>false,
  applySnapshot:()=>applied++,location:{reload:()=>{}}
 };
 vm.createContext(ctx);vm.runInContext(real,ctx,{timeout:3000});
 return {api:ctx.production,store,runtime,pending,get reads(){return reads},get uploads(){return uploads},get applied(){return applied},switchToB:()=>{active=B}};
}
{
 const x=syncFixture(),out=await x.api.sync('auto',{silent:true});
 assert.equal(out.restorePendingReview,true,'Background sync cannot upload a restored board');
 assert.equal(x.reads,0);assert.equal(x.uploads,0);
 assert.ok(x.store.getItem(key));
}
{
 const x=syncFixture();
 await assert.rejects(x.api.push('explicit_empty_remote_upload'),/explicit cloud review/);
 assert.equal(x.reads,0);assert.equal(x.uploads,0);
}
{
 const x=syncFixture();
 const op=x.api.sync('upload',{silent:true,restoreReviewed:true});
 for(let n=0;n<12&&x.pending.length===0;n++)await tick();
 assert.equal(x.pending.length,1,'Explicit owner-approved upload reaches provider');
 assert.ok(x.store.getItem(key),'Pending review must persist until server ACK');
 x.pending[0].resolve([]);
 await op;
 assert.equal(x.store.getItem(key),null,'Only accepted upload clears marker');
}
{
 const x=syncFixture();
 x.switchToB();
 await assert.rejects(x.api.sync('upload',{restoreReviewed:true}),/original account/);
 assert.equal(x.uploads,0,'Restored account A data cannot be uploaded to B');
 assert.ok(x.store.getItem(key));
}
{
 const x=syncFixture(A,'not-json');
 await assert.rejects(x.api.sync('auto'),/manual cloud review/);
 assert.equal(x.uploads,0,'Malformed restore marker fails closed');
}
{
 const x=syncFixture(A,review(A),[{user_id:A,revision:4,snapshot:{state:{xp:9}}}]);
 // Explicit cloud download may supersede a local restore.
 const result=await x.api.pull({reload:false});
 assert.equal(result.revision,4);assert.equal(x.applied,1);
 assert.equal(x.store.getItem(key),null);
}

// Guest restoration has an explicit, distinct migration path: background/normal
// upload stays blocked while a confirmed guest import may create the empty cloud.
assert.ok(supa.includes("if(!confirm('Import '+count+"),
 'Guest migration must retain affirmative destination consent');
{
 const x=syncFixture(A,review(''));
 await assert.rejects(x.api.push('manual_upload',{restoreReviewed:true}),/original account/);
 assert.equal(x.reads,0,'Unclaimed guest board must not authorize ordinary account upload');
}
{
 const x=syncFixture(A,review(''));
 const op=x.api.push('explicit_guest_import',{restoreReviewed:true});
 for(let n=0;n<12&&x.pending.length===0;n++)await tick();
 assert.equal(x.pending.length,1,'Confirmed guest migration reaches empty cloud');
 assert.ok(x.store.getItem(key),'Guest source review must remain until cloud ACK');
 x.pending[0].resolve([]);
 await op;
 assert.equal(x.store.getItem(key),null,'Accepted guest migration clears review marker');
}

console.log('PASS: 12/12 production-sourced local restore review and Supabase/Drive overwrite guards');
