import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// GRANADA #54/#104: weekly Premium is canonical mission data; its unique
// completion, weekly target and earned XP must survive repeated Android boots.
const URL=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const ID='granada-weekly-premium-cross-platform';
const KEY='vida_rpg_personal_progress_v2';
const browser=await chromium.launch({headless:true});
async function open(platform){
  const context=await browser.newContext({viewport:platform==='android'?
    {width:412,height:915}:{width:1280,height:850}});
  await context.addInitScript(value=>{
    window.__MICHELSLIFE_PLATFORM__=value;
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.onboardingCompleted.v1','1');
  },platform);
  const page=await context.newPage();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.MLVCloudSharedStorageV30216?.capture&&
    window.MLVCloudSharedStorageV30216?.restore&&
    typeof window.completeMission==='function'&&
    typeof window.undoMission==='function'&&typeof state!=='undefined',
    null,{timeout:60000});
  return {context,page};
}
async function snapshot(page){
  return page.evaluate(id=>{
    const item=state.missions.filter(m=>m.id===id);
    const persisted=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
    const saved=(persisted.missions||[]).filter(m=>m.id===id);
    const comps=x=>(x?.completions||[]).map(c=>({
      id:String(c.id),date:String(c.date),xp:Number(c.xp||0)
    }));
    return {
      xp:Number(state.xp||0),savedXp:Number(persisted.xp||0),
      count:item.length,savedCount:saved.length,
      target:item[0]?.weeklyTarget,savedTarget:saved[0]?.weeklyTarget,
      archived:item[0]?.archived===true,
      completions:comps(item[0]),savedCompletions:comps(saved[0])
    };
  },ID);
}
function verify(s,label){
  assert.equal(s.count,1,label+' changed mission identity or duplicated the record');
  assert.equal(s.savedCount,1,label+' lost saved recurring mission');
  assert.equal(s.target,4,label+' changed weekly target');
  assert.equal(s.savedTarget,4,label+' changed stored target');
  assert.equal(s.archived,false,label+' archived a repeatable mission');
  assert.equal(s.xp,s.savedXp,label+' lost runtime/store XP equality');
  assert.deepEqual(s.completions,s.savedCompletions,label+' lost completion ID consistency');
}
let windows,android;
try{
  windows=await open('windows');android=await open('android');
  const seeded=await windows.page.evaluate(id=>{
    if(state.missions.some(m=>m.id===id))throw Error('Synthetic test ID collision');
    const before=Number(state.xp||0);
    state.missions.push({id,name:'Synthetic weekly Premium GRANADA',
      type:'weekly',description:'Automated test only',category:'academic',
      difficulty:'medium',xp:50,coins:0,days:[1,3,5],weeklyTarget:4,
      archived:false,hidden:false,createdAt:'2026-10-20T00:00:00Z',
      completions:[]});
    window.save();
    return {before,reward:Number(state.missions.find(m=>m.id===id).xp||0)};
  },ID);
  const baseline=await snapshot(windows.page);verify(baseline,'baseline');
  assert.equal(baseline.xp,seeded.before);
  assert.equal(baseline.completions.length,0);
  await windows.page.evaluate(id=>window.completeMission(id),ID);
  const first=await snapshot(windows.page);verify(first,'first completion');
  assert.equal(first.completions.length,1);
  assert.equal(first.xp,seeded.before+seeded.reward);
  assert.equal(first.completions[0].xp,seeded.reward);
  await windows.page.evaluate(id=>window.completeMission(id),ID);
  assert.deepEqual(await snapshot(windows.page),first,
    'Double tapping a weekly contract doubled reward/history');
  await windows.page.evaluate(id=>window.undoMission(id),ID);
  const undone=await snapshot(windows.page);verify(undone,'undo');
  assert.equal(undone.xp,seeded.before);
  assert.equal(undone.completions.length,0);
  await windows.page.evaluate(id=>window.completeMission(id),ID);
  const final=await snapshot(windows.page);verify(final,'recompletion');
  assert.equal(final.xp,first.xp);
  assert.equal(final.completions.length,1);
  assert.notEqual(final.completions[0].id,first.completions[0].id,
    'Recompletion reused a deleted history ID');
  await windows.page.reload({waitUntil:'domcontentloaded'});
  await windows.page.waitForFunction(()=>window.MLVCloudSharedStorageV30216&&
    typeof window.completeMission==='function',null,{timeout:60000});
  assert.deepEqual(await snapshot(windows.page),final,
    'Desktop restart mutated weekly completion, target or XP');
  const shared=await windows.page.evaluate(()=>window.MLVCloudSharedStorageV30216.capture());
  assert.ok(shared?.[KEY],'Cloud allowlist omitted canonical mission storage');
  const portable=JSON.parse(shared[KEY]);
  assert.equal(portable.missions?.filter(m=>m.id===ID).length,1);
  assert.equal(portable.missions.find(m=>m.id===ID)?.weeklyTarget,4);
  await android.page.evaluate(data=>window.MLVCloudSharedStorageV30216.restore(data),shared);
  for(let n=0;n<2;n++){
    await android.page.reload({waitUntil:'domcontentloaded'});
    await android.page.waitForFunction(()=>window.MLVCloudSharedStorageV30216&&
      typeof window.completeMission==='function',null,{timeout:60000});
    const got=await snapshot(android.page);verify(got,'Android restart '+(n+1));
    assert.deepEqual(got,final,
      'Android hydration mutated synced recurring mission or completion IDs');
  }
  await android.page.evaluate(id=>window.completeMission(id),ID);
  assert.deepEqual(await snapshot(android.page),final,
    'Android repeat completion after transfer duplicated earned XP');
  console.log('PASS: weekly Premium target, exact-once XP and unique completion IDs survive Windows+two Android restarts and undo/recompletion');
}finally{
  await Promise.allSettled([windows?.context?.close(),android?.context?.close()]);
  await browser.close();
}
