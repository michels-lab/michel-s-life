import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Issue #110 — fail closed when the native Calendar read provider is absent.
// Real native Calendar reads require explicit consent and a separate bridge;
// without one the UI must refuse fake success, leave user data unchanged.
const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:412,height:915}});
  await page.addInitScript(()=>{
    window.__MICHELSLIFE_PLATFORM__='android';
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.onboardingCompleted.v1','1');
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.GoogleCalendarV30190&&window.LeftNavV30171,
    null,{timeout:60000});

  const result=await page.evaluate(async()=>{
    const api=window.GoogleCalendarV30190;
    const setting=api.settings();
    setting.events=[{id:'existing-private-calendar-example',summary:'Synthetic prior event'}];
    setting.lastSync='2026-09-01T00:00:00.000Z';
    setting.lastSyncStats={googleEventCount:1,managedEventCount:0,
      pushedMissionCount:0};
    state.xp=23;
    const before=JSON.stringify({
      events:setting.events,lastSync:setting.lastSync,stats:setting.lastSyncStats,
      xp:state.xp,missionIds:state.missions.map(m=>m.id)
    });
    const bridgeCalls=[];
    const oldChrome=window.chrome;
    // A browser fixture has NO native Calendar Java interface. The app must
    // not manufacture a successful read because Drive is connected.
    try{
      window.chrome={webview:{postMessage(message){bridgeCalls.push(message)}}};
    }catch(_){}
    api.runtime.connected=true;
    api.runtime.account='synthetic-google@example.test';
    api.runtime.cloudReady=true;

    const answer=await api.sync({silent:false});
    const after=JSON.stringify({
      events:setting.events,lastSync:setting.lastSync,stats:setting.lastSyncStats,
      xp:state.xp,missionIds:state.missions.map(m=>m.id)
    });
    // Test the render contract at the most permissive Google-login status:
    // Calendar reading must stay unavailable in this browser-only fixture;
    // a Drive session does not supply native Calendar consent.
    state.activeTab='settings';window.renderAll();
    window.LeftNavV30171.buildSettings();
    window.LeftNavV30171.activateSetting('google');
    api.mountSettings();
    const bridgeSyncCalls=bridgeCalls.filter(x=>{
      const action=typeof x==='object'?x.action||x.type:'';
      return /sync/i.test(String(action))&&!/cloud/i.test(String(action));
    });
    if(oldChrome===undefined){try{delete window.chrome}catch(_){}}
    else try{window.chrome=oldChrome}catch(_){}
    return {
      platform:window.__MICHELSLIFE_PLATFORM__,answer,before,after,
      bridgeSyncCalls:bridgeSyncCalls.length,
      error:api.runtime.error,notice:api.runtime.notice,
      lastResult:api.runtime.lastResult
    };
  });
  assert.equal(result.platform,'android','Android platform identity lost');
  assert.equal(result.answer,null,'Android Calendar returned fictitious successful provider data');
  assert.equal(result.before,result.after,'Unsupported sync changed event/XP/progress state');
  assert.equal(result.bridgeSyncCalls,0,'Unsupported Calendar sync invoked fake native provider');
  assert.match(result.error,/does not support Google Calendar reading/i,
    'Android Calendar did not disclose lack of provider read/write');
  assert.equal(result.lastResult,null,'Unavailable bridge manufactured a successful result');

  const button=page.locator('[data-v30171-pane="google"] [data-mlv190-google="sync"]');
  await button.waitFor({state:'visible',timeout:10000});
  assert.equal(await button.isDisabled(),true,
    'Android Calendar Read is enabled despite missing native provider');
  assert.match((await button.innerText()).trim(),/unavailable/i,
    'Android Google Calendar button appears to promise working sync');
  const warning=page.locator('[data-v30171-pane="google"] .mlv190-google-error[role="status"]');
  await warning.waitFor({state:'visible',timeout:10000});
  assert.match(await warning.innerText(),/cannot access Google Calendar/i,
    'Android Settings does not visibly disclose unsupported provider');
  console.log('PASS: Android browser fallback refuses fake Calendar reads without a real native provider and preserves XP/missions');
}finally{
  await browser.close();
}
