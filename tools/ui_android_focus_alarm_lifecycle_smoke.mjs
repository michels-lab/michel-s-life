import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// GRANADA #53 — canonical Focus lifecycle -> one native alarm per phase.
// Chromium's synthetic bridge is NOT evidence of real OS notification delivery.
const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:412,height:915}});
  await context.addInitScript(()=>{
    window.__MICHELSLIFE_PLATFORM__='android';
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.onboardingCompleted.v1','1');
    localStorage.setItem('michelsLife.language.v1','en');
  });
  const page=await context.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.FocusStoryV30162?.startFocus&&
    window.MichelsLifeMobileExperience?.resyncNativeNotification,
    null,{timeout:60000});
  const result=await page.evaluate(()=>{
    const api=window.FocusStoryV30162;
    const mobile=window.MichelsLifeMobileExperience;
    const activity=[];
    let failNext=false;
    window.MichelsLifeAndroid={
      postMessage(){},
      getFocusAlarmStatus(){return JSON.stringify({
        notificationsGranted:false,precision:'battery-optimized-inexact',
        backgroundDelivery:false
      });},
      syncFocusAlarm(raw){
        const packet=JSON.parse(raw);
        const key=packet.status+':'+packet.mode+':'+packet.deadlineAt;
        activity.push({status:packet.status,mode:packet.mode,
          deadline:packet.deadlineAt,key,failed:failNext});
        if(failNext){failNext=false;return JSON.stringify({error:'synthetic alarm transport outage'});}
        return JSON.stringify({scheduled:packet.status==='running',
          notificationsGranted:false,precision:'battery-optimized-inexact'});
      }
    };
    const before={xp:state.xp,missionIds:state.missions.map(m=>m.id),
      canonicalFocus:api.focusState()};
    const take=(label,action,forced=false)=>{
      if(action)action();
      if(forced)mobile.resyncNativeNotification();
      else mobile.updateFocus();
      return {label,state:api.focusState().status,mode:api.focusState().mode,
        deadline:api.focusState().deadlineAt,attempts:activity.length,
        recent:activity.at(-1)};
    };
    const samples=[];
    samples.push(take('reset',()=>api.resetFocus(),true));
    const idleCalls=activity.length;
    for(let i=0;i<4;i++)mobile.updateFocus();
    const afterIdleTicks=activity.length;
    samples.push(take('work-start',()=>api.startFocus()));
    const startCalls=activity.length;
    for(let i=0;i<5;i++)mobile.updateFocus();
    const afterWorkTicks=activity.length;
    samples.push(take('pause',()=>api.pauseFocus()));
    const pauseCalls=activity.length;
    for(let i=0;i<3;i++)mobile.updateFocus();
    const afterPauseTicks=activity.length;
    samples.push(take('resume',()=>api.startFocus()));
    samples.push(take('skip-to-break',()=>api.skipFocus()));
    samples.push(take('break-start',()=>api.startFocus()));
    samples.push(take('reset-break',()=>api.resetFocus()));
    failNext=true;
    samples.push(take('work-prepare-retry',()=>api.skipFocus()));
    // The current phase is now ready for work. First native arm fails, the
    // next canonical tick must retry rather than caching a false success.
    samples.push(take('work-failed-arm',()=>api.startFocus()));
    const failedArms=activity.filter(x=>x.failed).length;
    const attemptsBeforeRetry=activity.length;
    mobile.updateFocus();
    const attemptsAfterRetry=activity.length;
    for(let i=0;i<4;i++)mobile.updateFocus();
    const attemptsAfterRetryTicks=activity.length;
    samples.push(take('final-reset',()=>api.resetFocus()));
    const after={xp:state.xp,missionIds:state.missions.map(m=>m.id),
      canonicalFocus:api.focusState()};
    return {samples,activity,before,after,
      idleCalls,afterIdleTicks,startCalls,afterWorkTicks,
      pauseCalls,afterPauseTicks,failedArms,attemptsBeforeRetry,
      attemptsAfterRetry,attemptsAfterRetryTicks};
  });
  const {samples,activity}=result;
  const steps=Object.fromEntries(samples.map(item=>[item.label,item]));
  const assertPhase=(label,status,mode)=>{
    assert.equal(steps[label].state,status,label+' changed canonical state unexpectedly');
    assert.equal(steps[label].mode,mode,label+' changed Focus phase');
    assert.equal(steps[label].recent.status,status==='running'?'running':'paused',
      label+' mirrored wrong native alarm state');
    if(status==='running'){
      assert.ok(steps[label].recent.deadline>Date.now() && steps[label].recent.deadline<Date.now()+4*3600_000,
        label+' forwarded an invalid alarm deadline');
    }else{
      assert.equal(steps[label].recent.deadline,0,label+' left stale native scheduled deadline');
    }
  };
  assertPhase('reset','ready','work');
  assert.equal(result.idleCalls,result.afterIdleTicks,'Idle Focus posts duplicate native cancels every tick');
  assertPhase('work-start','running','work');
  assert.equal(result.startCalls,result.afterWorkTicks,'Running Focus repeatedly schedules same alarm');
  assertPhase('pause','paused','work');
  assert.equal(result.pauseCalls,result.afterPauseTicks,'Paused Focus re-cancels every tick');
  assertPhase('resume','running','work');
  assertPhase('skip-to-break','ready','break');
  assertPhase('break-start','running','break');
  assertPhase('reset-break','ready','break');
  assertPhase('work-prepare-retry','ready','work');
  assertPhase('work-failed-arm','running','work');
  assert.equal(result.failedArms,1,'Synthetic native arm failure not exercised exactly once');
  assert.equal(result.attemptsAfterRetry,result.attemptsBeforeRetry+1,
    'Failed native alarm transport did not retry on the next live Focus tick');
  assert.equal(result.attemptsAfterRetryTicks,result.attemptsAfterRetry,
    'Successful retry left native alarm continuously re-arming');
  assertPhase('final-reset','ready','work');
  assert.equal(result.before.xp,result.after.xp,'Focus native bridge changed canonical XP');
  assert.deepEqual(result.before.missionIds,result.after.missionIds,
    'Focus native bridge changed canonical missions');
  assert.ok(activity.filter(x=>x.status==='running').every(x=>x.deadline>0),
    'Alarm bridge sent running with empty deadline');
  assert.ok(activity.filter(x=>x.status!=='running').every(x=>x.deadline===0),
    'Alarm bridge sent a cancel containing an old deadline');
  assert.ok(activity.every((event,i)=>i===0||
      event.key!==activity[i-1].key||event.failed||activity[i-1].failed),
    'Focus native bridge sent duplicate consecutive alarm updates');
  console.log('PASS: Focus uses canonical deadline for native work/break, cancels on pause/skip/reset, de-duplicates ticks and retries transient failure');
  await context.close();
}finally{
  await browser.close();
}
