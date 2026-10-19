import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const diagnosticJS=readFileSync('src/MichelsLife/DeveloperDiagnostics.js','utf8');
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const browser=await chromium.launch({headless:true});
try {
 const context=await browser.newContext({viewport:{width:412,height:915},screen:{width:412,height:915},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.addInitScript(()=>{
   localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
     version:2,settings:{characterName:'Test',onboardingCompletedAt:'2026-10-01T00:00:00.000Z',onboardingRequired:false},
     xp:4,coins:0,missions:[],history:[],achievements:[],owned:[],equipped:{}
   }));
   window.MichelsLifeAndroid={postMessage(){}};
   window.__developerSavedReports=[];
   window.MichelsLabDeveloperNative={saveReport:(name,body)=>window.__developerSavedReports.push({name,body}),runtimeSnapshot:()=>JSON.stringify({developerEdition:true,platform:'android',appVersion:'0.2.9-developer',javaHeapUsedKb:4500,javaHeapMaxKb:128000,notificationPermission:true,uptimeMs:9000})};
 });
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>!!document.querySelector('#main>.tab.active')&&document.documentElement.dataset.mlvPlatform==='android',null,{timeout:60000});
 // Public app must not show Developer UI unless the developer script is explicitly injected.
 assert(await page.locator('#ml-dev-twin-host').count()===0,'Production mobile fixture unexpectedly renders developer controls');
 await page.addScriptTag({content:diagnosticJS});
 await page.waitForFunction(()=>!!window.MichelsLabDeveloperTwin);
 const trigger=page.locator('#ml-dev-twin-host #mltrigger');
 await trigger.click();
 assert(await page.locator('#ml-dev-twin-host #mlpanel').isVisible(),'Developer UI is not open');
 await page.getByRole('button',{name:'Run audit'}).click();
 const firstReport=await page.evaluate(()=>window.MichelsLabDeveloperTwin.report());
 assert(firstReport.identity.platform==='android'&&firstReport.auditCoverage.length===1,'Developer audit did not identify Android/current route');

 const activeScreen=firstReport.identity.screen;
 const testLocator='#developer-candidate-button';
 await page.evaluate(()=>{
   const target=document.createElement('button');
   target.id='developer-candidate-button';
   target.style.cssText='position:fixed;left:8px;top:100px;z-index:2147482500;width:180px;height:62px;background:#1c2d3f;color:#fff';
   target.textContent='Annotation fixture';
   target.addEventListener('pointerdown',()=>window.__unsafeSelectionAction=(window.__unsafeSelectionAction||0)+1);
   target.addEventListener('click',()=>window.__unsafeSelectionAction=(window.__unsafeSelectionAction||0)+1);
   document.body.appendChild(target);
 });
 // Mobile inspector must have a touch-accessible cancellation route.
 await page.getByRole('button',{name:'Mark element'}).click();
 await page.locator('#ml-dev-twin-host #mltrigger').tap();
 assert(await page.locator('#ml-dev-twin-host #mlpanel').isVisible(),
   'Inspector trap: TAP badge did not cancel element selection on a phone');
 await page.getByRole('button',{name:'Mark element'}).click();
 await page.locator(testLocator).tap();
 const selected=await page.evaluate(()=>window.__unsafeSelectionAction||0);
 assert(selected===0,'Marking a control triggered its product handler (pointerdown/click)');
 const panel=page.locator('#ml-dev-twin-host #mlpanel');
 assert(await panel.isVisible(),'Developer inspector did not reopen after touching target');
 const comment='Al pulsar este boton, el Chapter PARPADEA.\nNo debe alterar mi sesion ni mis datos.';
 await panel.locator('textarea').fill(comment);
 await panel.getByRole('button',{name:'Save annotation'}).click();
 let saved=await page.evaluate(()=>window.MichelsLabDeveloperTwin.notes());
 assert(saved.length===1&&saved[0].screen===activeScreen&&saved[0].selector===testLocator&&saved[0].comment===comment,
   'Annotation failed to persist exact comment, screen and DOM locator');
 await page.evaluate(()=>document.getElementById('developer-candidate-button')?.remove());

 // Navigate through the real application router, and accumulate diagnostics.
 await page.evaluate(()=>window.__mlvAndroidFastRoute('settings'));
 await page.waitForFunction(()=>!!document.querySelector('#tab-settings.active'),null,{timeout:7000});
 await page.evaluate(()=>{
   const img=document.createElement('img');img.id='developer-broken-image-fixture';
   img.src='data:image/png;base64,not-a-png';
   img.style.cssText='position:fixed;left:10px;top:160px;width:64px;height:64px;z-index:9';
   document.body.appendChild(img);
 });
 await page.waitForTimeout(170);
 await panel.getByRole('button',{name:'Run audit'}).click();
 const combined=await page.evaluate(()=>window.MichelsLabDeveloperTwin.report());
 assert(combined.auditCoverage.length>=2,'Moving to Settings discarded the preceding audited route');
 assert(combined.findings.some(f=>f.code==='BROKEN_IMAGE'),'Developer missed injected broken image fixture');

 // Explicit owner-initiated main-screen sweep must check multiple routes,
 // report any skipped screens and return to the original Settings context.
 const sweep=await page.evaluate(()=>window.MichelsLabDeveloperTwin.auditAll());
 assert(sweep.guidedSweep.attempted.length>=5,
   'Guided audit did not inspect multiple canonical app screens: '+JSON.stringify(sweep.guidedSweep));
 assert(sweep.guidedSweep.restoredScreen==='tab-settings'&&
   !!(await page.locator('#tab-settings.active').count()),
   'Guided audit failed to restore original Settings route');
 assert(sweep.nativeRuntime.developerEdition===true&&sweep.nativeRuntime.javaHeapUsedKb===4500,
   'Redacted native memory/permission diagnostics missing');
 const afterAudit=await page.evaluate(()=>window.MichelsLabDeveloperTwin.notes());
 assert(afterAudit[0].comment===comment,'Guided audit lost or modified owner annotation text');

 await panel.getByRole('button',{name:'Export JSON'}).click();
 await panel.getByRole('button',{name:'Export AI prompt'}).click();
 const reports=await page.evaluate(()=>window.__developerSavedReports);
 assert(reports.length===2,'Both export actions must use native save bridge');
 const exported=JSON.parse(reports[0].body);
 assert(exported.ownerAnnotations[0].comment===comment&&exported.ownerAnnotations[0].screen===activeScreen&&
   exported.ownerAnnotations[0].selector===testLocator,'JSON omitted user comment or exact target screen');
 assert(reports[1].body.includes(comment)&&reports[1].body.includes(testLocator)&&
   reports[1].body.includes(activeScreen),'AI prompt omitted owner observation or locator');
 assert(!reports[1].body.includes('password=')&&!reports[0].body.includes('access_token'),
   'Developer export leaked form/session data');

 // A synthetic error must retain only its class/route across a WebView
 // restart, not any original message, stack trace or owner data.
 await page.evaluate(()=>{
   window.dispatchEvent(new ErrorEvent('error',{error:new TypeError('password=VERY_PRIVATE_FIXTURE'),message:'password=VERY_PRIVATE_FIXTURE'}));
 });
 const errorsBefore=await page.evaluate(()=>window.MichelsLabDeveloperTwin.report().runtimeErrors);
 assert(errorsBefore.some(x=>x.code==='WINDOW_ERROR'&&x.type==='TypeError'),'Developer did not capture bounded error class');
 const redacted=JSON.stringify(errorsBefore);
 assert(!redacted.includes('VERY_PRIVATE_FIXTURE'),'Developer captured a private exception message or stack');

 // Reload with a real storage-backed session; the annotation must survive.
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!document.querySelector('#main>.tab.active'),null,{timeout:60000});
 await page.addScriptTag({content:diagnosticJS});
 const persisted=await page.evaluate(()=>window.MichelsLabDeveloperTwin.notes());
 assert(persisted.length===1&&persisted[0].comment===comment&&persisted[0].screen===activeScreen,
   'Annotation was lost after installed-like WebView page recreation');
 const errorsAfter=await page.evaluate(()=>window.MichelsLabDeveloperTwin.report().runtimeErrors);
 assert(errorsAfter.some(x=>x.code==='WINDOW_ERROR'&&x.type==='TypeError'),
   'Redacted runtime issue disappeared during Developer WebView restart');
 await page.locator('#ml-dev-twin-host #mltrigger').click();
 await page.getByRole('button',{name:'User sign-in'}).click();
 await page.waitForFunction(()=>!!document.querySelector('#tab-settings.active'),null,{timeout:7000});
 // The real Settings is opened; provider authorization still needs a real user.
 assert(await page.locator('#ml-dev-twin-host #mlpanel').isHidden(),'Real sign-in link failed to close diagnostics');
 console.log(JSON.stringify({result:'PASS',platform:'android-browser-fixture',screens:combined.auditCoverage.length,findings:combined.findings.length,notes:persisted.length,exports:reports.length,login:'real Settings route only; OAuth acceptance pending'},null,2));
 await context.close();
}finally{await browser.close();}
