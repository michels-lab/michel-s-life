import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// A real Android-touch browser regression for the Current Mission pointerup
// handler. The native APK / physical Galaxy gate is tracked separately.
const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const first='granada-chain-first',second='granada-chain-second';
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({
    viewport:{width:412,height:915},screen:{width:412,height:915},
    deviceScaleFactor:2.625,isMobile:true,hasTouch:true
  });
  await context.addInitScript(({first,second})=>{
    window.__MICHELSLIFE_PLATFORM__='android';
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
    const make=(id,name)=>({
      id,name,canonical:name.toLowerCase(),description:'Synthetic Quest Chain regression',
      category:'physical',type:'daily',difficulty:'medium',
      xp:20,coins:0,priority:'media',days:[0,1,2,3,4,5,6],
      deadline:'',fixed:false,boss:false,archived:false,hidden:false,
      noSuggest:false,createdAt:'2026-10-01T12:00:00.000Z',completions:[]
    });
    localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
      version:2,activeTab:'missions',xp:41,coins:0,totalCoinsEarned:0,
      settings:{
        characterName:'Michel',onboardingRequired:false,
        onboardingCompletedAt:'2026-10-01T12:00:00.000Z',
        v30200GenericProfile:true,
        v30106Projects:[{
          id:'granada-chain-project',name:'Synthetic chain',status:'active',
          missionIds:[first,second],v30165Chain:true,
          v30165ChainOrder:[first,second]
        }]
      },
      missions:[make(first,'First phase'),make(second,'Locked second phase')],
      history:[],owned:[],equipped:{},achievements:[],goals:[],affirmations:[]
    }));
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','en');
    localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
    localStorage.setItem('michelsLife.language.installDefault.v1','en');
  },{first,second});

  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error.message).slice(0,220)));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(({second})=>
    !!window.CurrentMissionV131?.start &&
    !!window.RPGSystemsV30165?.chainLocked &&
    window.RPGSystemsV30165.chainLocked(second)?.prev?.id==='granada-chain-first',
    {second},{timeout:60000});
  await page.evaluate(()=>window.__mlvAndroidFastRoute?.('missions'));
  const button=page.locator('[data-cm131-action="start"][data-id="'+second+'"]:visible').first();
  await button.waitFor({state:'visible',timeout:15000});

  // Real Playwright touch emits pointerup BEFORE click. The former must not
  // bypass the later document click-based Quest Chain guard.
  await button.tap();
  const afterTouch=await page.evaluate(({second})=>({
    currentId:window.CurrentMissionV131.getState()?.id||null,
    completions:state.missions.find(x=>x.id===second)?.completions.length,
    xp:Number(state.xp)
  }),{second});
  assert.equal(afterTouch.currentId,null,'Android touch started a locked phase');
  assert.equal(afterTouch.completions,0,'Android touch completed a locked phase');
  assert.equal(afterTouch.xp,41,'Android touch awarded XP to locked phase');

  const protectedComplete=await page.evaluate(({second})=>{
    const api=window.CurrentMissionV131;
    // Simulates pre-existing stale Current Mission state from before the fix.
    state.settings.cm131CurrentMission={
      id:second,status:'paused',startedAt:null,elapsedMs:12000,
      sessionStartedAt:Date.now()-12000
    };
    api.render();
    const result=api.complete();
    const snapshot={
      result,completions:state.missions.find(x=>x.id===second).completions.length,
      xp:Number(state.xp)
    };
    api.stop('Synthetic Quest Chain test cleanup');
    return snapshot;
  },{second});
  assert.equal(protectedComplete.result,false,'Current Mission complete bypassed Quest Chain');
  assert.equal(protectedComplete.completions,0,'Blocked complete created a completion');
  assert.equal(protectedComplete.xp,41,'Blocked complete awarded XP');

  const afterUnlock=await page.evaluate(({first,second})=>{
    const prev=state.missions.find(x=>x.id===first);
    prev.completions.push({id:'synthetic-first-completion',date:'2026-11-09',xp:20});
    const lock=window.RPGSystemsV30165.chainLocked(second);
    const started=window.CurrentMissionV131.start(second);
    const id=window.CurrentMissionV131.getState()?.id;
    window.CurrentMissionV131.stop('Synthetic Quest Chain test cleanup');
    return {locked:!!lock,started,id};
  },{first,second});
  assert.equal(afterUnlock.locked,false,'Completed preceding phase remained locked');
  assert.equal(afterUnlock.started,true,'Unlocked phase cannot start');
  assert.equal(afterUnlock.id,second,'Unlocked phase started the wrong mission');
  assert.deepEqual(errors,[],'Uncaught page runtime errors');
  console.log('PASS Current Mission Quest Chain: real Android tap blocked; stale completion blocked; valid unlock starts');
}finally{
  await browser.close();
}
