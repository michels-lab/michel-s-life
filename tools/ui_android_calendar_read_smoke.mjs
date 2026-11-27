import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Real 412px browser UI with a synthetic *native bridge* response.
// This does NOT pretend to prove live Google OAuth or provider access.
const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:412,height:915}});
  await page.addInitScript(()=>{
    window.__MICHELSLIFE_PLATFORM__='android';
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.onboardingCompleted.v1','1');
    const listeners=[];
    window.__calendarMockCalls=[];
    const reply=raw=>{
      const msg=typeof raw==='string'?JSON.parse(raw):raw;
      window.__calendarMockCalls.push(msg.action);
      const payload=msg.action==='calendarRead'
        ?{account:'synthetic-calendar@example.test',googleEventCount:1,
            events:[{id:'synthetic-calendar-event',title:'Provider-only test event',
              start:'2026-11-04',end:'2026-11-05',allDay:true,
              htmlLink:'https://calendar.google.com/',managed:false}]}
        :{connected:false,cloudReady:false};
      const response={channel:'michels-life-google-calendar-response',
        requestId:msg.requestId,ok:true,payload};
      queueMicrotask(()=>{
        listeners.forEach(fn=>fn({data:response}));
        window.__mlvAndroidReceive?.(JSON.stringify(response));
      });
    };
    window.MichelsLifeAndroid={calendarReadAvailable:()=>true,
      postMessage:reply};
    window.chrome={webview:{postMessage:reply,
      addEventListener:(event,fn)=>{if(event==='message')listeners.push(fn)},
      removeEventListener:()=>{}}};
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.GoogleCalendarV30190&&window.LeftNavV30171,
    null,{timeout:60000});
  const before=await page.evaluate(()=>{
    state.xp=23;
    const setting=window.GoogleCalendarV30190.settings();
    setting.events=[{id:'private-existing',title:'Unrelated cached event'}];
    state.activeTab='settings';
    window.renderAll();
    window.LeftNavV30171.buildSettings();
    window.LeftNavV30171.activateSetting('google');
    window.GoogleCalendarV30190.mountSettings();
    return {events:JSON.stringify(setting.events),xp:state.xp,
      ids:JSON.stringify(state.missions.map(m=>m.id))};
  });
  const button=page.locator('[data-v30171-pane="google"] [data-mlv190-google="sync"]');
  await button.waitFor({state:'visible',timeout:10000});
  assert.equal(await button.isEnabled(),true,'Native Calendar read action is disabled');
  assert.match((await button.innerText()).trim(),/Read Google Calendar/i);
  await button.click();
  await page.waitForFunction(
    ()=>window.GoogleCalendarV30190?.runtime?.calendarEvents?.length===1,
    null,{timeout:15000});
  const after=await page.evaluate(()=>{
    const api=window.GoogleCalendarV30190;
    return {events:JSON.stringify(api.settings().events),xp:state.xp,
      ids:JSON.stringify(state.missions.map(m=>m.id)),
      view:api.runtime.calendarEvents,
      account:api.runtime.calendarAccount,
      calls:window.__calendarMockCalls};
  });
  assert.equal(after.events,before.events,
    'Google Calendar view data overwrote shared/synced settings');
  assert.equal(after.xp,before.xp);
  assert.equal(after.ids,before.ids);
  assert.equal(after.view[0].title,'Provider-only test event');
  assert.equal(after.account,'synthetic-calendar@example.test');
  assert.equal(after.calls.filter(x=>x==='calendarRead').length,1);
  assert.equal(after.calls.some(x=>/upsert|delete|publish/i.test(x)),false);
  const notice=page.locator('[data-v30171-pane="google"] .mlv190-google-note');
  assert.match(await notice.allInnerTexts().then(xs=>xs.join(' ')),
    /Read-only|synthetic-calendar@example\.test/i);
  console.log('PASS: real 412px Calendar Read button invokes ONLY a synthetic native read, renders provider account and preserves missions/XP/cloud state');
}finally{
  await browser.close();
}
