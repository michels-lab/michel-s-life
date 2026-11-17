import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const assert=(condition,reason)=>{if(!condition)throw new Error(reason);};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1536,height:880},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.addInitScript(()=>{
   localStorage.setItem('michelsLife.onboarding.v30200','done');
   localStorage.setItem('michelsLife.language.v1','es');
   localStorage.setItem('michelsLife.language.userOverrideBase.v1','es');
   localStorage.setItem('michelsLife.language.installDefault.v1','es');
   window.__MICHELSLIFE_INSTALL_LANGUAGE__='es';
 });
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>!!window.FocusStoryV30162?.focusState&&
   !!window.MichelsLifeFocusImmersive?.open&&
   !!window.MichelsLifeAlarms?.open&&
   !!document.getElementById('mlv184ChapterRecovery'),null,{timeout:60000});
 const chapter=await page.evaluate(()=>{
   const hero=document.querySelector('#v176StatusPanel>.v30165-rpg-chapter-hero');
   const recovery=hero?.querySelector('#mlv184ChapterRecovery');
   const shade=hero?.querySelector('#mlv184ChapterShade');
   const a=hero?.getBoundingClientRect(),b=recovery?.getBoundingClientRect();
   return {hero:!!hero,recovery:!!recovery,size:[a?.width,a?.height],
     recoveredSize:[b?.width,b?.height],
     background:recovery?getComputedStyle(recovery).backgroundImage:'',
     position:recovery?getComputedStyle(recovery).position:'',
     shade:shade?.style.background||''};
 });
 assert(chapter.hero&&chapter.recovery&&chapter.size[0]>300&&chapter.recoveredSize[0]>300&&
   chapter.position==='absolute'&&chapter.background!=='none'&&chapter.background.length>30,
   'Chapter art recovery absent / black: '+JSON.stringify(chapter));

 // Reject real image requests during this failure scenario. Otherwise the
 // normal chapter refresh can replace the deliberately broken preview with
 // a previously cached successful image, making the test nondeterministic.
 // Routing disables HTTP caching, so both original art and fallback fail.
 const failImages=route=>route.request().resourceType()==='image'
   ?route.abort('failed'):route.continue();
 await page.route('**/*',failImages);
 // Force the exact regression (both pack image and preview fail) and require
 // the app's actual theme/ambient fallback to remain visible, not black.
 await page.evaluate(()=>{
   const hero=document.querySelector('#v176StatusPanel>.v30165-rpg-chapter-hero');
   const art=hero.querySelector('#mlv184ChapterArt');
   art.dataset.mlv189Fallback='/granada-missing-preview-42.jpg';
   art.src='/granada-missing-scene-42.jpg';
 });
 await page.waitForFunction(()=>{
   const h=document.querySelector('#v176StatusPanel>.v30165-rpg-chapter-hero');
   return h?.dataset.mlv189Art==='recovery';
 },null,{timeout:12000});
 assert(await page.evaluate(()=>{
   const hero=document.querySelector('#v176StatusPanel>.v30165-rpg-chapter-hero');
   const fallback=hero?.querySelector('#mlv184ChapterRecovery');
   return hero?.dataset.mlv189Art==='recovery'&&
     getComputedStyle(fallback).backgroundImage!=='none'&&
     getComputedStyle(fallback).position==='absolute';
 }), 'Broken chapter image should retain immersive fallback.');
 await page.unroute('**/*',failImages);
 await mkdir('artifacts/ui-smoke',{recursive:true});
 await page.screenshot({path:'artifacts/ui-smoke/chapter-recovery-granada.png'});

 // Simulate a REAL pointer click, not a direct API call: the old 3.x capture
 // handlers previously swallowed this action leaving a dead-looking button.
 await page.locator('#mlv-desktop-focus-launcher').click({timeout:12000});
 await page.waitForFunction(()=>!document.getElementById('mlv-desktop-focus-immersive')?.hidden);
 await page.locator('#mlv-desktop-focus-immersive [data-focus-action="toggle"]').click();
 await page.waitForFunction(()=>window.FocusStoryV30162.focusState().status==='running');
 assert(await page.locator('#mlv-desktop-focus-clock').innerText()!=='25:00'||
   (await page.evaluate(()=>window.FocusStoryV30162.focusState().status))==='running',
   'Clicking Pomodoro must start the real shared timer.');
 await page.locator('#mlv-desktop-focus-immersive [data-focus-action="minimize"]').first().click();
 await page.waitForFunction(()=>document.getElementById('mlv-desktop-focus-immersive').hidden);
 const minimized=await page.evaluate(()=>({
   stillRunning:window.FocusStoryV30162.focusState().status==='running',
   miniVisible:!document.querySelector('#mlv-desktop-mini-focus').hidden
 }));
 assert(minimized.stillRunning&&minimized.miniVisible,
   'Minimized Pomodoro lost session: '+JSON.stringify(minimized));

 // Open the ALARM UI with a real pointer click and save a recurring alarm.
 await page.locator('#mlv-alarm-launcher').click({timeout:12000});
 await page.waitForFunction(()=>!document.getElementById('mlv-alarm-screen')?.hidden);
 await page.locator('#mlv-alarm-name').fill('Granada: prueba de alarma');
 await page.locator('#mlv-alarm-repeat').selectOption('daily');
 await page.locator('#mlv-alarm-time').fill('22:15');
 await page.locator('#mlv-alarm-save').click();
 const saved=await page.evaluate(()=>{
   const r=window.MichelsLifeAlarms.records();
   return {count:r.length,alarm:r.find(x=>x.label==='Granada: prueba de alarma')};
 });
 assert(saved.alarm?.repeat==='daily'&&saved.alarm.enabled,
  'Alarm button did not save a daily recurring alarm: '+JSON.stringify(saved));
 await page.screenshot({path:'artifacts/ui-smoke/alarms-saved-granada.png'});
 await page.locator('#mlv-alarm-close').click();
 await page.locator('#mlv-alarm-launcher').click();
 assert(await page.locator('#mlv-alarm-list').innerText().then(x=>x.includes('Granada: prueba de alarma')),
  'Alarm disappeared after closing and reopening.');

 const fired=await page.evaluate(()=>{
   const a=window.MichelsLifeAlarms.records().find(x=>x.label==='Granada: prueba de alarma');
   const ok=window.MichelsLifeAlarms.ringAlarm(a.id);
   const first=window.MichelsLifeAlarms.takeWindowsNotification();
   const second=window.MichelsLifeAlarms.takeWindowsNotification();
   return {ok,first,second,ringHidden:document.getElementById('mlv-alarm-ring').hidden};
 });
 assert(fired.ok&&fired.ringHidden===false&&fired.first?.label==='Granada: prueba de alarma'&&!fired.second,
  'Alarm failed full-screen delivery or exactly-once native notification: '+JSON.stringify(fired));
 await page.locator('[data-ring-dismiss]').click();
 assert(await page.evaluate(()=>document.getElementById('mlv-alarm-ring').hidden),
  'Dismiss failed to close ringing alarm.');
 await page.evaluate(()=>window.FocusStoryV30162.resetFocus?.());
 assert(!errors.some(e=>/Uncaught|SyntaxError|TypeError/i.test(e)),
  'Browser runtime exception: '+errors.join('; '));
 console.log('PASS: chapter art survives missing scenes; actual click launches Pomodoro and alarms; timer runs/minimizes; daily alarm persists/rings/dismisses and native notification is exactly once');
}finally{await browser.close();}
