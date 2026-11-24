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
 const focusLayout=await page.evaluate(()=>{
   const motivation=document.querySelector('#mlv-desktop-focus-motivation');
   const clock=document.getElementById('mlv-desktop-focus-clock')?.getBoundingClientRect();
   const start=document.querySelector('#mlv-desktop-focus-immersive [data-focus-action="toggle"]')?.getBoundingClientRect();
   return {visible:!!motivation&&motivation.querySelectorAll('.mlv-motivation-line:not([hidden])').length===2&&!motivation.closest('details:not([open])'),clock:clock?.toJSON(),start:start?.toJSON(),height:innerHeight,
     inertSidebar:!!document.querySelector('#v30171Sidebar #v30162FocusDock:not([hidden])')};
 });
 assert(focusLayout.visible&&focusLayout.clock?.height>40&&focusLayout.start?.height>35&&
   focusLayout.start.y+focusLayout.start.height<=focusLayout.height+2&&!focusLayout.inertSidebar,
   'Pomodoro clock or buttons obscured by motivational quotes/legacy sidebar: '+JSON.stringify(focusLayout));
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
 await page.locator('#mlv-alarm-sound').selectOption('soft');
 const beforeQuick=Date.now();
 await page.locator('[data-quick-minutes="5"]').click();
 const quick=await page.evaluate(()=>{
   const r=window.MichelsLifeAlarms.records();
   return r.find(x=>x.id.startsWith('q'));
 });
 assert(quick?.repeat==='once'&&quick?.sound==='soft'&&
   quick.dueAt-beforeQuick>=5*60000&&quick.dueAt-beforeQuick<5*60000+5000,
   'Quick Alarm did not persist accurate five minute reminder and selected tone: '+JSON.stringify(quick));
 // Real, original 1-second PCM WAV so playback/cleanup is exercised,
 // rather than accepting an invalid RIFF header with no audio frames.
 const rate=8000,frames=8000,wav=Buffer.alloc(44+frames*2);
 wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);
 wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);
 wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
 wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);
 wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
 wav.write('data',36);wav.writeUInt32LE(frames*2,40);
 for(let i=0;i<frames;i++)wav.writeInt16LE(Math.round(Math.sin(2*Math.PI*440*i/rate)*5000),44+i*2);
 await page.locator('#mlv-alarm-custom-file').setInputFiles({name:'granada-sound.wav',mimeType:'audio/wav',buffer:wav});
 await page.waitForFunction(()=>document.querySelector('#mlv-alarm-sound')?.value==='custom');
 assert(await page.locator('#mlv-alarm-custom-name').innerText()==='granada-sound.wav',
   'Custom audio import not visible in UI');
 await page.evaluate(()=>{
   const oldCreate=URL.createObjectURL.bind(URL),oldRevoke=URL.revokeObjectURL.bind(URL);
   window.__granadaAlarmUrls={created:[],revoked:[]};
   URL.createObjectURL=blob=>{
     const url=oldCreate(blob);window.__granadaAlarmUrls.created.push(url);return url;
   };
   URL.revokeObjectURL=url=>{
     window.__granadaAlarmUrls.revoked.push(url);oldRevoke(url);
   };
 });
 await page.locator('#mlv-alarm-preview').click();
 await page.waitForFunction(()=>window.__granadaAlarmUrls.created.length>0,null,{timeout:7000});
 await page.locator('#mlv-alarm-sound').selectOption('soft');
 await page.locator('#mlv-alarm-preview').click();
 assert(await page.evaluate(()=>{
   const {created,revoked}=window.__granadaAlarmUrls;
   return created.every(url=>revoked.includes(url));
 }), 'Replacing custom preview leaked its object URL');
 await page.locator('#mlv-alarm-sound').selectOption('custom');
 await page.locator('#mlv-alarm-name').fill('Granada: prueba de alarma');
 await page.locator('#mlv-alarm-repeat').selectOption('daily');
 await page.locator('#mlv-alarm-time').fill('22:15');
 await page.locator('#mlv-alarm-save').click();
 const saved=await page.evaluate(()=>{
   const r=window.MichelsLifeAlarms.records();
   return {count:r.length,alarm:r.find(x=>x.label==='Granada: prueba de alarma')};
 });
 assert(saved.alarm?.repeat==='daily'&&saved.alarm.sound==='custom'&&saved.alarm.enabled,
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

 // Regression: old tick() used break after the first alarm, then advanced
 // lastTick, irretrievably losing the second alarm due in the same second.
 const paired=await page.evaluate(()=>{
   const dueAt=Date.now()+1700,dateTime=new Date(dueAt);
   const date=dateTime.getFullYear()+'-'+String(dateTime.getMonth()+1).padStart(2,'0')+'-'+
     String(dateTime.getDate()).padStart(2,'0');
   const time=String(dateTime.getHours()).padStart(2,'0')+':'+
     String(dateTime.getMinutes()).padStart(2,'0');
   const pair=['Parallel A','Parallel B'].map((label,i)=>({
     id:'granada-parallel-'+i,label,time,date,dueAt,
     repeat:'once',days:[],sound:'soft',enabled:true
   }));
   localStorage.setItem('michelsLife.alarms.v1',JSON.stringify(pair));
   window.MichelsLifeAlarms.read();
   return {dueAt,ids:pair.map(x=>x.id)};
 });
 await page.waitForTimeout(2650);
 const dispatched=await page.evaluate(()=>{
   const first=window.MichelsLifeAlarms.takeWindowsNotification();
   const second=window.MichelsLifeAlarms.takeWindowsNotification();
   const third=window.MichelsLifeAlarms.takeWindowsNotification();
   return {first:first?.label,second:second?.label,third:third?.label,
     active:document.querySelector('#mlv-alarm-ring-label')?.textContent,
     visible:!document.getElementById('mlv-alarm-ring').hidden};
 });
 assert(dispatched.visible&&dispatched.active==='Parallel A'&&
   dispatched.first==='Parallel A'&&dispatched.second==='Parallel B'&&!dispatched.third,
   'Simultaneous reminders must both reach Windows notifications, even while first rings: '+
   JSON.stringify({paired,dispatched}));
 await page.locator('[data-ring-dismiss]').click();
 assert(await page.evaluate(()=>!document.getElementById('mlv-alarm-ring').hidden&&
   document.querySelector('#mlv-alarm-ring-label')?.textContent==='Parallel B'),
   'Dismiss of first simultaneous alarm did not open the second ring');
 const snoozeStart=Date.now();
 await page.locator('[data-ring-snooze]').click();
 const snoozed=await page.evaluate(()=>{
   const r=window.MichelsLifeAlarms.records();
   const item=r.find(x=>x.id.startsWith('s'));
   return {item,ringHidden:document.getElementById('mlv-alarm-ring').hidden,
     third:window.MichelsLifeAlarms.takeWindowsNotification()};
 });
 assert(snoozed.ringHidden&&snoozed.item?.label==='Parallel B'&&
   snoozed.item.dueAt-snoozeStart>=300000&&snoozed.item.dueAt-snoozeStart<305000&&
   !snoozed.third,
   'Snooze must retain the exact five-minute dueAt without rounding or duplicate alerts: '+
   JSON.stringify(snoozed));
 assert(await page.evaluate(()=>{
   const {created,revoked}=window.__granadaAlarmUrls;
   return created.every(url=>revoked.includes(url));
 }), 'Custom alarm playback or preview retained an unreleased object URL');

 await page.evaluate(()=>window.FocusStoryV30162.resetFocus?.());
 assert(!errors.some(e=>/Uncaught|SyntaxError|TypeError/i.test(e)),
  'Browser runtime exception: '+errors.join('; '));
 console.log('PASS: Chapter/Focus, 5min Quick Alarm, valid WAV preview cleanup, recurring alarm, two simultaneous Windows notifications/rings and exact 5min snooze');
}finally{await browser.close();}
