import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {
  compactLedger,assertExactLedger,assertUnchangedOtherMission,safeDiagnostic
} from './granada_mission_ledger_core.mjs';

// Executes real canonical JS state, save(), completeMission() and undoMission()
// in separately booted Android/Windows browser runtimes. Only synthetic data.
const URL=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const KEY='vida_rpg_personal_progress_v2';
const IDS=['granada-daily-ledger-a','granada-daily-ledger-b'];
const REWARDS=[11,17];
const browser=await chromium.launch({headless:true});
const opened=[];
async function open(platform,shared=null){
  const context=await browser.newContext({
    viewport:platform==='android'?{width:360,height:915}:{width:1280,height:850},
    isMobile:platform==='android',hasTouch:platform==='android'
  });
  opened.push(context);
  await context.addInitScript(({mode,portable})=>{
    window.__MICHELSLIFE_PLATFORM__=mode;
    if(portable&&!sessionStorage.getItem('granadaDailyImported')){
      for(const [key,value] of Object.entries(portable)){
        if(typeof value==='string')localStorage.setItem(key,value);
      }
      sessionStorage.setItem('granadaDailyImported','1');
    }
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.onboardingCompleted.v1','1');
  },{mode:platform,portable:shared});
  const page=await context.newPage();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
  await ready(page);
  return page;
}
async function ready(page){
  await page.waitForFunction(()=>typeof window.completeMission==='function'&&
    typeof window.undoMission==='function'&&
    typeof window.save==='function'&&
    window.MLVCloudSharedStorageV30216?.capture&&typeof state!=='undefined',
    null,{timeout:60000});
}
async function extract(page){
  const payload=await page.evaluate(ids=>{
    const idsSet=new Set(ids);
    const project=source=>({
      xp:source?.xp,
      missions:(source?.missions||[]).filter(m=>idsSet.has(m.id)).map(m=>({
        id:m.id,type:m.type,archived:m.archived,xp:m.xp,
        weeklyTarget:m.weeklyTarget,completions:m.completions
      }))
    });
    const saved=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'null');
    if(!saved)throw Error('Missing persisted state');
    return {live:project(state),saved:project(saved)};
  },IDS);
  const live=compactLedger(payload.live,IDS);
  const saved=compactLedger(payload.saved,IDS);
  assertExactLedger(saved,live,'persisted state');
  return live;
}
async function act(page,name,id){
  await page.evaluate(({action,missionId})=>{
    if(action==='complete')window.completeMission(missionId);
    else if(action==='undo')window.undoMission(missionId);
    else throw Error('Invalid test action');
  },{action:name,missionId:id});
  return extract(page);
}
function completions(s,index){return s.missions[index].completions;}
function equalXp(s,num,label){assert.equal(s.xp,num,label+' XP is incorrect');}
let steps=0;
let progressStage='bootstrap';
async function run(){
  progressStage='desktop_open';
  const desktop=await open('windows');
  progressStage='fixture_seed';
  const initialXp=await desktop.evaluate(({ids,rewards})=>{
    const before=Number(state.xp||0);
    for(let n=0;n<ids.length;n++){
      if(state.missions.some(m=>m.id===ids[n]))throw Error('Synthetic ID already exists');
      state.missions.push({
        id:ids[n],name:'Synthetic Android daily ledger '+n,
        canonical:'synthetic android daily ledger '+n,
        description:'Test-only task',type:'daily',category:'academic',
        priority:'medium',difficulty:'medium',xp:rewards[n],coins:0,
        days:[0,1,2,3,4,5,6],archived:false,hidden:false,
        createdAt:'2026-01-01T00:00:00.000Z',completions:[]
      });
    }
    window.save();
    return before;
  },{ids:IDS,rewards:REWARDS});
  progressStage='initial_snapshot';
  let state0=await extract(desktop); steps++;
  equalXp(state0,initialXp,'baseline');
  assert.deepEqual(state0.missions.map(m=>m.completions.length),[0,0]);
  progressStage='complete_a';
  const first=await act(desktop,'complete',IDS[0]);steps++;
  equalXp(first,initialXp+11,'first daily');
  assert.equal(completions(first,0).length,1);
  assert.equal(completions(first,0)[0].xp,11);
  assertUnchangedOtherMission(state0,first,IDS[1]);
  progressStage='double_a';
  const double=await act(desktop,'complete',IDS[0]);steps++;
  assertExactLedger(double,first,'double complete');
  progressStage='complete_b';
  const both=await act(desktop,'complete',IDS[1]);steps++;
  equalXp(both,initialXp+28,'two independent daily missions');
  assert.equal(completions(both,1)[0].xp,17);
  progressStage='undo_a';
  const undone=await act(desktop,'undo',IDS[0]);steps++;
  equalXp(undone,initialXp+17,'undo first');
  assert.equal(completions(undone,0).length,0);
  assertUnchangedOtherMission(both,undone,IDS[1]);
  progressStage='recomplete_a';
  const recompleted=await act(desktop,'complete',IDS[0]);steps++;
  equalXp(recompleted,initialXp+28,'recomplete first');
  assert.notEqual(completions(recompleted,0)[0].id,completions(first,0)[0].id,
    'Undo+recomplete reused completion history ID');
  assertUnchangedOtherMission(undone,recompleted,IDS[1]);
  progressStage='desktop_reload';
  await desktop.reload({waitUntil:'domcontentloaded'});await ready(desktop);
  assertExactLedger(await extract(desktop),recompleted,'desktop reload');steps++;

  // Explicitly verify the portable capture excludes device-only/unknown keys.
  progressStage='portable_capture';
  const shared=await desktop.evaluate(()=>{
    localStorage.setItem('mlvSyntheticDeviceLocalSentinel','LOCAL_ONLY_DEVICE_SECRET');
    return window.MLVCloudSharedStorageV30216.capture();
  });
  assert.equal(typeof shared?.[KEY],'string','portable state omitted canonical missions');
  assert.equal('mlvSyntheticDeviceLocalSentinel' in shared,false,
    'cloud capture exported unknown device-local storage');
  assert.equal('michelsLife.supabase.session.v30216' in shared,false,
    'cloud capture exported account session');
  assert.equal('michelsLife.supabase.device.v30216' in shared,false,
    'cloud capture exported device ID');
  assert.deepEqual(compactLedger({
    ...JSON.parse(shared[KEY]),
    missions:JSON.parse(shared[KEY]).missions.filter(m=>IDS.includes(m.id))
  },IDS),recompleted,'Portable state does not match original progress');
  steps++;

  progressStage='android_first_open';
  const android=await open('android',shared);
  assertExactLedger(await extract(android),recompleted,'Android cold bootstrap');steps++;
  progressStage='android_double_a';
  await act(android,'complete',IDS[0]);
  assertExactLedger(await extract(android),recompleted,'Android repeat-tap');steps++;
  progressStage='android_reloads';
  for(const width of [360,412]){
    await android.setViewportSize({width,height:915});
    await android.reload({waitUntil:'domcontentloaded'});await ready(android);
    assertExactLedger(await extract(android),recompleted,'Android relaunch '+width);
    steps++;
  }
  progressStage='android_undo_b';
  const androidUndo=await act(android,'undo',IDS[1]);steps++;
  equalXp(androidUndo,initialXp+11,'Android undo second');
  assertUnchangedOtherMission(recompleted,androidUndo,IDS[0]);
  progressStage='android_recomplete_b';
  const androidRecomplete=await act(android,'complete',IDS[1]);steps++;
  equalXp(androidRecomplete,initialXp+28,'Android recomplete second');
  assert.notEqual(completions(androidRecomplete,1)[0].id,completions(recompleted,1)[0].id);
  assertUnchangedOtherMission(androidUndo,androidRecomplete,IDS[0]);

  progressStage='reverse_capture';
  const reverse=await android.evaluate(()=>window.MLVCloudSharedStorageV30216.capture());
  progressStage='reverse_desktop_open';
  const restoredDesktop=await open('windows',reverse);
  assertExactLedger(await extract(restoredDesktop),androidRecomplete,'Android to desktop');
  steps++;
  progressStage='reverse_desktop_reload';
  await restoredDesktop.reload({waitUntil:'domcontentloaded'});await ready(restoredDesktop);
  assertExactLedger(await extract(restoredDesktop),androidRecomplete,'reverse desktop reload');
  steps++;
  console.log('GRANADA_DAILY_LEDGER_PASS '+JSON.stringify({
    scenarios:steps,portableRoundtrips:2,androidRelauchWidths:[360,412],
    realProviderTested:false,nativeGalaxyTested:false,
    accountData:'synthetic-only',audit:'mission XP, undo, IDs, persistence'
  }));
}
try{
  await run();
}catch(error){
  console.error('GRANADA_DAILY_LEDGER_FAIL '+JSON.stringify({...safeDiagnostic(error),phase:progressStage}));
  process.exitCode=1;
}finally{
  await Promise.allSettled(opened.map(x=>x.close()));
  await browser.close();
}
