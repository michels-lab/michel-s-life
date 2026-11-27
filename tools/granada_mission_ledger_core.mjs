/** Canonical daily-mission safety assertions; no state changes, no PII/logs. */
import assert from 'node:assert/strict';

function safeNumber(value,field){
  assert.equal(typeof value,'number',field+' must be numeric');
  assert.ok(Number.isFinite(value),field+' must be finite');
  return value;
}
export function compactLedger(snapshot,expectedIds){
  assert.ok(snapshot&&typeof snapshot==='object','missing state');
  const xp=safeNumber(snapshot.xp,'XP');
  assert.ok(Array.isArray(snapshot.missions),'mission array missing');
  const expected=[...expectedIds];
  assert.equal(new Set(expected).size,expected.length,'duplicate synthetic fixture IDs');
  const selected=expected.map(id=>{
    const matches=snapshot.missions.filter(m=>m?.id===id);
    assert.equal(matches.length,1,'mission record duplicated or missing');
    const m=matches[0];
    assert.equal(m.type,'daily','mission recurrence type changed');
    assert.notEqual(m.archived,true,'synthetic repeatable mission was archived');
    const rewards=safeNumber(m.xp,'mission reward');
    assert.ok(Array.isArray(m.completions),'completion history missing');
    const entries=m.completions.map(c=>{
      assert.ok(c&&typeof c==='object','malformed completion');
      const uid=String(c.id??'');
      assert.ok(uid && uid!=='undefined' && uid!=='null','completion ID missing');
      assert.ok(String(c.date??''),'completion date missing');
      return {id:uid,date:String(c.date),xp:safeNumber(Number(c.xp||0),'completion XP')};
    });
    assert.equal(new Set(entries.map(e=>e.id)).size,entries.length,'duplicate completion ID');
    return {id,type:m.type,reward:rewards,weeklyTarget:m.weeklyTarget??null,
      archived:m.archived===true,completions:entries};
  });
  const allIds=selected.flatMap(m=>m.completions.map(c=>c.id));
  assert.equal(new Set(allIds).size,allIds.length,'completion collision across daily missions');
  return {xp,missions:selected};
}

export function assertExactLedger(actual,expected,label){
  assert.deepEqual(actual,expected,label+' changed XP, mission identity or completion ledger');
}
export function assertUnchangedOtherMission(before,after,otherId){
  const a=before.missions.find(m=>m.id===otherId);
  const b=after.missions.find(m=>m.id===otherId);
  assert.deepEqual(b,a,'Editing a different mission altered untouched mission ledger');
}
export function differenceCode(actual,expected){
  if(!actual||!expected||!Array.isArray(actual.missions)||!Array.isArray(expected.missions))
    return 'snapshot_invalid';
  if(actual.xp!==expected.xp)return 'total_xp_changed';
  if(actual.missions.length!==expected.missions.length)return 'mission_count_changed';
  for(let i=0;i<expected.missions.length;i++){
    const a=actual.missions[i],b=expected.missions[i];
    if(a?.id!==b?.id)return 'mission_identity_changed';
    if(a.type!==b.type)return 'mission_recurrence_changed';
    if(a.reward!==b.reward)return 'reward_amount_changed';
    if(a.archived!==b.archived)return 'archival_state_changed';
    if((a.completions||[]).length!==(b.completions||[]).length)
      return 'completion_count_changed';
    for(let j=0;j<(b.completions||[]).length;j++){
      const x=a.completions[j],y=b.completions[j];
      if(x.id!==y.id)return 'completion_identity_changed';
      if(x.date!==y.date)return 'completion_date_changed';
      if(x.xp!==y.xp)return 'completion_xp_changed';
    }
  }
  return 'other_ledger_mismatch';
}
export function safeDiagnostic(error){
  // No original exception message, local state, title or credential serialized.
  return {test:'daily-mission-ledger',status:'failed',
    category:error?.code==='ERR_ASSERTION'?'ledger_invariant':'runtime_failure',
    difference:differenceCode(error?.actual,error?.expected)};
}
