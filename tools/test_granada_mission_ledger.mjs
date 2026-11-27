import test from 'node:test';
import assert from 'node:assert/strict';
import {compactLedger,assertExactLedger,assertUnchangedOtherMission,safeDiagnostic,differenceCode} from './granada_mission_ledger_core.mjs';

const ids=['daily-a','daily-b'];
function input(){
  return {xp:28,missions:[
    {id:'daily-a',type:'daily',archived:false,xp:11,completions:[
      {id:'completion-a',date:'2026-10-21',xp:11}]},
    {id:'daily-b',type:'daily',archived:false,xp:17,completions:[
      {id:'completion-b',date:'2026-10-21',xp:17}]}
  ]};
}
test('valid unique daily ledger normalizes without user content',()=>{
  const v=compactLedger(input(),ids);
  assert.equal(v.xp,28);
  assert.equal(v.missions[0].completions.length,1);
});
test('missing, duplicate and changed mission records fail closed',()=>{
  for(const mutate of [
    d=>d.missions.splice(0,1),
    d=>d.missions.push({...d.missions[0]}),
    d=>d.missions[0].type='weekly',
    d=>d.missions[0].archived=true,
    d=>d.missions[0].completions=null,
  ]){
    const d=input();mutate(d);
    assert.throws(()=>compactLedger(d,ids));
  }
});
test('rejects XP invalidity, completion duplicates and cross-mission ID collision',()=>{
  for(const mutate of [
    d=>d.xp=NaN,
    d=>d.xp='28',
    d=>d.missions[0].xp=Infinity,
    d=>d.missions[0].completions.push({...d.missions[0].completions[0]}),
    d=>d.missions[1].completions[0].id='completion-a',
    d=>delete d.missions[0].completions[0].id,
    d=>delete d.missions[0].completions[0].date,
  ]){
    const d=input();mutate(d);assert.throws(()=>compactLedger(d,ids));
  }
});
test('compares complete canonical ledger and protects unrelated missions',()=>{
  const a=compactLedger(input(),ids);
  assertExactLedger(structuredClone(a),a,'same state');
  const b=structuredClone(a);b.missions[0].completions[0].id='unexpected';
  assert.throws(()=>assertExactLedger(b,a,'changed id'));
  assertUnchangedOtherMission(a,b,'daily-b');
  assert.throws(()=>assertUnchangedOtherMission(a,{...b,missions:[...b.missions.slice(0,1),{
    ...b.missions[1],reward:99}]},'daily-b'));
});
test('CI diagnostics never serialize user source error messages',()=>{
  const x=safeDiagnostic({code:'ERR_ASSERTION',message:'PRIVATE_ACCESS_TOKEN PRIVATE_JOURNAL'});
  assert.equal(x.category,'ledger_invariant');
  assert.ok(!JSON.stringify(x).includes('PRIVATE_'));
});

test('diagnostic difference classification reports field not mission contents',()=>{
  const expected=compactLedger(input(),ids);
  const actual=structuredClone(expected);
  actual.xp+=1;
  assert.equal(differenceCode(actual,expected),'total_xp_changed');
  actual.xp=expected.xp;
  actual.missions[0].completions.push({id:'PRIVATE_ID',date:'2026-10-21',xp:0});
  assert.equal(differenceCode(actual,expected),'completion_count_changed');
  assert.equal(differenceCode(null,expected),'snapshot_invalid');
  const e={code:'ERR_ASSERTION',message:'PRIVATE_ACCOUNT',actual,expected};
  const d=safeDiagnostic(e);
  assert.equal(d.difference,'completion_count_changed');
  assert.ok(!JSON.stringify(d).includes('PRIVATE'));
});
