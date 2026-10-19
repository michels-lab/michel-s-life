import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:412,height:915},screen:{width:412,height:915},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{
   localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
     version:2,settings:{characterName:'Update QA',onboardingRequired:false,
       onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},xp:0,coins:0,
       missions:[],history:[],achievements:[],owned:[],equipped:{}
   }));
   window.__androidUpdateRequests=[];
   window.MichelsLifeAndroid={postMessage(raw){window.__androidUpdateRequests.push(JSON.parse(raw));}};
 });
 const page=await context.newPage();
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>!!window.__mlvAndroidFastRoute&&document.documentElement.dataset.mlvPlatform==='android',null,{timeout:45000});
 await page.evaluate(()=>window.__mlvAndroidFastRoute('settings'));
 await page.waitForSelector('#tab-settings.active #mlv-android-direct-updates',{state:'attached',timeout:15000});
 const card=page.locator('#mlv-android-direct-updates');
 check(await card.getByRole('button',{name:'Check Android updates'}).count()===1,'Native updater not reachable from actual Settings');
 const trigger=async()=>{
   await card.getByRole('button',{name:'Check Android updates'}).click();
   return page.evaluate(()=>window.__androidUpdateRequests.at(-1));
 };
 const respond=async(request,payload)=>{
   await page.evaluate(({request,payload})=>{
     window.__mlvAndroidReceive(JSON.stringify({
       channel:'michels-life-google-calendar-response',
       requestId:request.requestId,ok:true,payload
     }));
   },{request,payload});
 };
 const first=await trigger();
 check(first.action==='updateStatus'&&first.channel==='michels-life-google-calendar'&&first.requestId,
   'Touch update check never reaches real Android bridge action');
 const foreign='https://evil.example/michel-s-life.apk';
 await respond(first,{channel:'android-direct',checkedOfficialRelease:true,updateAvailable:true,status:'An update is available',releasePage:foreign});
 check(await card.locator('a').isHidden(),'Foreign/synthetic release link must not open');
 const second=await trigger();
 const official='https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.221';
 await respond(second,{channel:'android-direct',checkedOfficialRelease:true,updateAvailable:true,
   latestVersion:'0.2.9',status:'Official newer Android release',releasePage:official});
 check(await card.locator('a').isVisible(),'Official release page link missing');
 check(await card.locator('a').getAttribute('href')===official,'Release link was silently rewritten');
 const third=await trigger();
 await respond(third,{channel:'android-direct',checkedOfficialRelease:false,updateAvailable:null,
   status:'Could not check releases (offline)'});
 check(await card.locator('a').isHidden(),'Offline status must not offer a stale download link');
 check((await card.getByRole('status').innerText()).includes('offline'),
   'Offline check incorrectly claimed an up-to-date result');
 const fourth=await trigger();
 await respond(fourth,{channel:'developer',checkedOfficialRelease:false,updateAvailable:null,
   status:'Developer Edition uses internal test builds.'});
 check((await card.getByRole('status').innerText()).includes('Developer Edition'),
   'Developer channel not distinct');
 const oldExe=await page.locator('[data-mlv200-update-action="install-detected"],[data-mlv202-action="install-online"]').evaluateAll(
   nodes=>nodes.every(n=>getComputedStyle(n).display==='none'));
 check(oldExe,'A desktop EXE updater action is exposed inside Android Settings');
 await mkdir('artifacts/android-ui-smoke',{recursive:true});
 await page.screenshot({path:'artifacts/android-ui-smoke/android-direct-updates.png'});
 console.log('PASS: installed-like Android Settings checks official Direct release, suppresses foreign/stale URLs, distinguishes offline/developer, hides desktop install actions');
 await context.close();
}finally{await browser.close();}
