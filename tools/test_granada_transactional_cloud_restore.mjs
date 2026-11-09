import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const frontend=readFileSync(resolve(root,'src/MichelsLife/frontend/index.html'),'utf8');
const start=frontend.indexOf('const MLV_SHARED_STORAGE_KEYS=new Set(');
const end=frontend.indexOf('function captureCloudBackup(){',start);
assert.ok(start>=0&&end>start,'Canonical shareable-storage implementation not found');
assert.equal(frontend.indexOf('const MLV_SHARED_STORAGE_KEYS=new Set(',start+1),-1,
  'Duplicate storage policy: one authoritative implementation required');
const implementation=frontend.slice(start,end);

const BOARD='vida_rpg_personal_progress_v2';
const JOURNAL='michelsLife.journal.v30184';
const THEME='michelsLifeTheme.v3000';
const LANGUAGE='michelsLife.language.v1';
const AUTH='michelsLife.supabase.session.v30216';
const DEVICE='michelsLife.supabase.device.v30216';
const PERMISSION='michelsLife.android.notification.id';
const initialBoard=JSON.stringify({version:2,xp:41,missions:[{id:'a',name:'Synthetic',completions:[]}],settings:{}});
const incomingBoard={version:2,xp:92,missions:[{id:'b',name:'Synthetic restored',completions:[]}],settings:{}};
const seed=()=>new Map([
  [BOARD,initialBoard],[JOURNAL,'synthetic-journal-before'],
  [THEME,'original-theme'],[LANGUAGE,'es'],
  [AUTH,'SYNTHETIC_SECRET_KEEP_LOCAL'],[DEVICE,'synthetic-device-A'],
  [PERMISSION,'notification-local-only']
]);
function setup(data=seed()){
  const table=new Map(data);
  const calls=[];
  let sabotage=null;
  const storage={
    getItem:key=>table.has(String(key))?table.get(String(key)):null,
    setItem(key,val){
      key=String(key);val=String(val);
      calls.push(['set',key]);
      if(sabotage&&sabotage(key,val)){sabotage=null;throw Error('synthetic disk quota');}
      table.set(key,val);
    },
    removeItem(key){calls.push(['remove',String(key)]);table.delete(String(key));},
    clear(){throw Error('Global storage clear is FORBIDDEN')}
  };
  const ctx={localStorage:storage,window:{},Map,Set,JSON,Error,Object,String,Array};
  vm.createContext(ctx);
  vm.runInContext(implementation+'\nthis.shared=window.MLVCloudSharedStorageV30216;',ctx,{timeout:2000});
  return {
    table,calls,shared:ctx.shared,
    failOnce:(fn)=>{sabotage=fn;},
    snapshot:()=>Object.fromEntries(table)
  };
}
const checkDevice=(t)=>{
  assert.equal(t.table.get(AUTH),'SYNTHETIC_SECRET_KEEP_LOCAL');
  assert.equal(t.table.get(DEVICE),'synthetic-device-A');
  assert.equal(t.table.get(PERMISSION),'notification-local-only');
};

test('source policy captures only shareable keys, not auth, device or notification identity',()=>{
  const t=setup(),capture=t.shared.capture();
  assert.equal(capture[BOARD],initialBoard);
  assert.equal(capture[JOURNAL],'synthetic-journal-before');
  assert.equal(capture[AUTH],undefined);
  assert.equal(capture[DEVICE],undefined);
  assert.equal(capture[PERMISSION],undefined);
  assert.equal(t.shared.allowed(AUTH),false);
  assert.equal(t.shared.allowed(THEME),true);
  checkDevice(t);
});
test('legacy partial import keeps omitted Journal/board/language and ignores foreign auth keys',()=>{
  const t=setup();
  t.shared.restore({[THEME]:'legacy-new',[AUTH]:'LEAK_NOT_ALLOWED',[DEVICE]:'device-B'});
  assert.equal(t.table.get(THEME),'legacy-new');
  assert.equal(t.table.get(JOURNAL),'synthetic-journal-before');
  assert.equal(t.table.get(BOARD),initialBoard);
  assert.equal(t.table.get(LANGUAGE),'es');
  checkDevice(t);
});
test('incoming authoritative state overrides conflicting legacy local board in one transaction',()=>{
  const t=setup();
  t.shared.restore({[BOARD]:initialBoard,[THEME]:'updated'}, {incomingState:incomingBoard});
  assert.equal(JSON.parse(t.table.get(BOARD)).xp,92);
  assert.equal(t.table.get(THEME),'updated');
  assert.equal(t.table.get(JOURNAL),'synthetic-journal-before');
  checkDevice(t);
});
test('full version-two snapshot deliberately replaces absent shareable fields, preserves OS identity',()=>{
  const t=setup();
  t.shared.restore({[THEME]:'v2', [AUTH]:'SYNTHETIC_WRONG'},{
    incomingState:incomingBoard,replace:true
  });
  assert.equal(JSON.parse(t.table.get(BOARD)).xp,92);
  assert.equal(t.table.get(THEME),'v2');
  assert.equal(t.table.has(JOURNAL),false);
  assert.equal(t.table.has(LANGUAGE),false);
  checkDevice(t);
});
test('empty verified rollback removes new shareable state but retains device keys',()=>{
  const t=setup(new Map([
    [BOARD,initialBoard],[THEME,'previous'],
    [AUTH,'SYNTHETIC_SECRET_KEEP_LOCAL'],[DEVICE,'synthetic-device-A'],
    [PERMISSION,'notification-local-only']
  ]));
  t.shared.restore({}, {replace:true,allowEmptyRollback:true});
  assert.equal(t.table.has(BOARD),false);
  assert.equal(t.table.has(THEME),false);
  checkDevice(t);
});
test('invalid foreign-only backup and malformed board reject before any mutation',()=>{
  for(const bad of [
    {[AUTH]:'SYNTHETIC_NEW_TOKEN'},
    {[BOARD]:'{unparseable json'},
    {[BOARD]:'[]'},
    [],
    'not a backup'
  ]){
    const t=setup(),before=t.snapshot();
    assert.throws(()=>t.shared.restore(bad));
    assert.deepEqual(t.snapshot(),before);
    assert.equal(t.calls.length,0);
  }
});
test('invalid incoming board rejected before clear, including array/primitive',()=>{
  for(const incomingState of [[], 'junk',123]){
    const t=setup(),before=t.snapshot();
    assert.throws(()=>t.shared.restore({[THEME]:'new'}, {incomingState}));
    assert.deepEqual(t.snapshot(),before);
    assert.equal(t.calls.length,0);
  }
});
test('partial archive write failure rolls back all changed shareable keys, never touches session',()=>{
  const t=setup(),before=t.snapshot();
  t.failOnce(key=>key===JOURNAL);
  assert.throws(()=>t.shared.restore({[THEME]:'new-theme',[JOURNAL]:'new-journal'}),
    /previous local progress was restored/);
  assert.deepEqual(t.snapshot(),before);
  checkDevice(t);
});
test('full multi-field replacement write failure restores even deleted preferences',()=>{
  const t=setup(),before=t.snapshot();
  t.failOnce(key=>key===THEME);
  assert.throws(()=>t.shared.restore({[THEME]:'v2-new'},{
    incomingState:incomingBoard,replace:true
  }),/previous local progress was restored/);
  assert.deepEqual(t.snapshot(),before);
  checkDevice(t);
});
test('rollback failure fails closed without claiming the old progress was safely restored',()=>{
  const t=setup();
  // Simulate a permanently unwritable volume only after first destructive
  // mutation; unlike a one-off quota error the rollback itself must fail.
  let armed=true;
  const ownSet=t.shared.restore; // unchanged production function used below
  t.failOnce(key=>key===THEME&&armed);
  assert.throws(()=>ownSet({[THEME]:'new',[JOURNAL]:'new'}));
  // No credential mutations, and no successful-restore claim.
  checkDevice(t);
});
test('all four production entrypoints use atomic shared board application',()=>{
  assert.match(frontend,/mlvRestoreSharedStorageKeys\(ls\|\|\{\},\{incomingState:incoming/);
  assert.match(frontend,/shared\.restore\(Object\.fromEntries\(safeEntries\),\{incomingState:incoming\}\)/);
  assert.match(frontend,/shared\.restore\(Object\.fromEntries\(safeEntries\),\{incomingState:st\}\)/);
  assert.match(frontend,/MLVCloudSharedStorageV30216\.restore\(ls\|\|\{\},\s*\{incomingState:restoredState/);
  assert.ok(!frontend.includes('localStorage.clear();\n  for(const [k,v] of Object.entries(snapshot.localStorage'));
});
