import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const page=readFileSync(resolve(repo,'src/MichelsLife/frontend/index.html'),'utf8');
const match=page.match(/<script id="mlv-granada-data-health">([\s\S]*?)<\/script>/);
assert(match&&match[1].includes('window.MLVGranadaDataHealth'),
  'Data-health script must be installed in the REAL canonical frontend');
const values=new Map();
const ctx={
  window:{},
  localStorage:{getItem:key=>values.get(key)??null},
  // Deliberately NO document/DOM: the complete production health inspector
  // must also run as pure read-only logic without browser globals.
};
vm.createContext(ctx);
vm.runInContext(match[1],ctx,{timeout:3000});
const api=ctx.window.MLVGranadaDataHealth;
const fixture=()=>({
  version:2,xp:35,
  missions:[{id:'private-mission-01',name:'TOP SECRET mission name',xp:20,
    completions:['2026-10-19']}],
  projects:[{id:'private-project-01',name:'SECRET client project'}],
  goals:[],history:[],achievements:[],affirmations:[]
});
const code=(r,c)=>r.findings.some(x=>x.code===c);
const JSONdata=o=>JSON.stringify(o);

test('valid local record has bounded summary with no private strings',()=>{
  const r=api.inspect(JSONdata(fixture()),'saved-progress');
  assert.equal(r.status,'ok');
  assert.equal(r.source,'saved-progress');
  assert.equal(r.counts.missions,1);
  assert.equal(r.counts.projects,1);
  assert.equal(r.xp,35);
  assert.equal(r.completionCount,1);
  assert.equal(r.safeToAutoRestore,false);
  assert.equal(r.readOnly,true);
  assert(!JSON.stringify(r).includes('TOP SECRET'));
  assert(!JSON.stringify(r).includes('private-mission-01'));
});

test('does not change stored state while inspecting and comparing',()=>{
  const data=JSONdata(fixture());
  values.set('vida_rpg_personal_progress_v2',data);
  const before=new Map(values);
  const a=api.getSaved();
  const b=api.inspect(JSONdata({state:fixture()}));
  assert.equal(api.compare(a,b).status,'same_summary');
  assert.deepEqual([...values],[...before]);
});

test('detects invalid/truncated JSON and arrays as root',()=>{
  assert.equal(api.inspect('{broken').status,'invalid');
  assert(code(api.inspect('{broken'),'invalid_or_oversized_json'));
  assert(code(api.inspect('[]'),'invalid_snapshot_root'));
});

test('enforces 10MiB read safety limit for direct API',()=>{
  const report=api.inspect(' '.repeat(10*1024*1024+1));
  assert(code(report,'invalid_or_oversized_json'));
});

test('missing canonical progress is rejected',()=>{
  const report=api.inspect(JSONdata({app:"Michel's Life",localStorage:{other:'value'}}));
  assert(code(report,'missing_canonical_progress'));
  assert.equal(report.status,'invalid');
});

test('supports actual cloud and portable saved-state envelope',()=>{
  const state=fixture();
  const raw={app:"Michel's Life",state,localStorage:{
    'vida_rpg_personal_progress_v2':JSONdata(state),'michelsLife.theme.v342':'theme'}};
  const result=api.inspect(JSONdata(raw));
  assert.equal(result.status,'ok');
  assert.equal(result.counts.missions,1);
});

test('flags private auth/device storage in a legacy backup',()=>{
  const r=api.inspect(JSONdata({state:fixture(),localStorage:{
    'michelsLife.supabase.session.v30216':'PRIVATE_REFRESH_TOKEN',
    'michelsLife.supabase.device.v30216':'DEVICE_ID_SECRET'
  }}));
  assert.equal(r.status,'invalid');
  assert(code(r,'device_private_storage_detected'));
  assert(!JSON.stringify(r).includes('PRIVATE_REFRESH_TOKEN'));
  assert(!JSON.stringify(r).includes('DEVICE_ID_SECRET'));
});

test('finds nested credential fields without leaking their values',()=>{
  const r=api.inspect(JSONdata({state:fixture(),provider:{
    deep:{access_token:'HIGHLY_PRIVATE_ACCESS_TOKEN'}}}));
  assert(code(r,'credential_field_detected'));
  assert.equal(r.status,'invalid');
  assert(!JSON.stringify(r).includes('HIGHLY_PRIVATE'));
});

test('flags duplicate mission IDs without revealing ID',()=>{
  const s=fixture();s.missions.push({...s.missions[0]});
  const r=api.inspect(s);
  assert(code(r,'duplicate_record_id'));
  assert(!JSON.stringify(r).includes('private-mission-01'));
});

test('missing record identity is reported with warning only',()=>{
  const s=fixture();delete s.missions[0].id;
  const r=api.inspect(s);
  assert(code(r,'missing_record_id'));
  assert.equal(r.status,'review');
});

test('rejects negative and nonfinite XP',()=>{
  const s=fixture();s.xp=-1;s.missions[0].xp=-50;
  const r=api.inspect(s);
  assert(code(r,'invalid_total_xp'));
  assert(code(r,'invalid_record_xp'));
});

test('rejects malformed collection and completion shapes',()=>{
  const s=fixture();s.projects={};s.missions[0].completions='fake';
  const r=api.inspect(s);
  assert(code(r,'invalid_collection_shape'));
  assert(code(r,'invalid_completion_shape'));
});

test('detects diverging localStorage copy without returning data',()=>{
  const data=fixture();const stale=fixture();stale.xp=777;
  const r=api.inspect({state:data,localStorage:{
    vida_rpg_personal_progress_v2:JSONdata(stale)}});
  assert(code(r,'canonical_and_saved_state_disagree'));
  assert.equal(r.status,'review');
});

test('detects invalid nested core state JSON',()=>{
  const r=api.inspect({localStorage:{vida_rpg_personal_progress_v2:'{broken'}});
  assert.equal(r.status,'invalid');
  assert(code(r,'stored_state_invalid_json'));
});

test('comparison reports changes but no mission names or identifiers',()=>{
  const before=api.inspect(JSONdata(fixture()));
  const after=fixture();after.xp=50;after.missions.push({
    id:'SECRET_NEW_MISSION_ID',name:'PRIVATE HEALTH MATTER',completions:[]
  });
  const diff=api.compare(before,api.inspect(JSONdata(after)));
  assert.equal(diff.status,'different');
  assert(diff.differences.includes('total_xp_changed'));
  assert(diff.differences.includes('count_changed_missions'));
  assert.equal(diff.identityAndContentNotCompared,true);
  assert(!JSON.stringify(diff).includes('PRIVATE'));
  assert(!JSON.stringify(diff).includes('SECRET_NEW_MISSION_ID'));
});

test('invalid snapshot comparison fails closed',()=>{
  const r=api.compare(api.inspect('{no'),api.inspect(JSONdata(fixture())));
  assert.equal(r.status,'not_comparable');
});

test('redacted report API never exports raw state',()=>{
  const r=api.report();
  assert.equal(r.noPersonalFieldsExported,true);
  assert.equal(r.cannotGuaranteeRestore,true);
  assert(!JSON.stringify(r).includes('TOP SECRET'));
});
