import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {normalizeError,evidenceReport} from './granada_story_diagnostic_core.mjs';
// Android browser model: ONLY synthetic data. Native APK / provider is not tested.
const base=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const sha=process.env.MLV_SOURCE_SHA||process.env.GITHUB_SHA;
const output='artifacts/granada-story-focus/production';
const cases=[];
const browser=await chromium.launch({headless:true});
const ok=(x,code)=>{if(!x)throw Error(code);};
await mkdir(output,{recursive:true});
const inventory=JSON.parse(await readFile('artifacts/granada-story-focus/inline-js-inventory.json','utf8'));
if(inventory.mode!=='canonical_generated_android_html'||
   inventory.scriptCount<100||inventory.parseFailureCount!==0)
  throw Error('canonical_inline_js_audit_missing_or_failed');
const staticInline=new Map(inventory.scripts.filter(x=>x.syntax==='valid').map(x=>[x.digest,x]));
try{
for(const width of [320,360,412])for(const language of ['en','es']){
 const name=String(width)+'-'+language;
 let context=null,page=null,phase='bootstrap',passed=false;
 const errors=[];
 const parseLocations=[];
 const failureSourceHashes=[];
 const sourceRequests=[];
 try{
   context=await browser.newContext({viewport:{width,height:915},screen:{width,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:2.625});
   await context.addInitScript(locale=>{
     if(!localStorage.getItem('vida_rpg_personal_progress_v2')){
       localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
         version:2,activeTab:'story',xp:37,coins:0,totalCoinsEarned:0,
         settings:{characterName:'QA',onboardingRequired:false,
           onboardingCompletedAt:'2026-10-01T12:00:00.000Z',v30200GenericProfile:true},
         missions:[{id:'granada-story-qa',name:'Synthetic mission',canonical:'synthetic mission',
           description:'',category:'academic',type:'daily',difficulty:'medium',xp:25,coins:0,
           days:[1,2,3,4,5],archived:false,hidden:false,
           createdAt:'2026-01-01T12:00:00.000Z',completions:[]}],
         goals:[],history:[],achievements:[],affirmations:[],owned:[],equipped:{}
       }));
     }
     localStorage.setItem('michelsLife.onboarding.v30200','done');
     localStorage.setItem('michelsLife.language.v1',locale);
     localStorage.setItem('michelsLife.language.userOverrideBase.v1',locale);
     window.__MICHELSLIFE_INSTALL_LANGUAGE__=locale;
     window.MichelsLifeAndroid={postMessage(){}};
   },language);
   page=await context.newPage();
   // Chrome DevTools reports script parse locations even when Playwright
   // pageerror SyntaxError.stack is empty/unlocated. Never retain source
   // contents, URLs, tokens, script text or user data.
   const safePlace=(url,line,column,origin)=>{
     let source='unlocated';
     try {
       const basename=new URL(String(url||''),'https://invalid.local/').pathname.split('/').pop();
       if(/^[A-Za-z0-9_.-]+\.(?:html|js|mjs)$/.test(basename||''))
         source=basename;
     }catch{}
     return {origin,source,
       line:Number.isSafeInteger(line)&&line>=0?line+1:null,
       column:Number.isSafeInteger(column)&&column>=0?column+1:null};
   };
   const record=(detail)=>{
     if(parseLocations.length>=16)parseLocations.shift();
     parseLocations.push(detail);
   };
   const cdp=await context.newCDPSession(page);
   cdp.on('Debugger.scriptFailedToParse',event=>{
     record(safePlace(event.url,event.startLine,event.startColumn,'parser'));
     // Collect a digest of the failed script, NOT its contents. For an
     // intermittent SyntaxError, this distinguishes a stable static inline
     // script from an unexpectedly generated/truncated runtime script.
     if(sourceRequests.length>=80||!event.scriptId)return;
     sourceRequests.push(cdp.send('Debugger.getScriptSource',
       {scriptId:event.scriptId}).then(reply=>{
       const code=reply.scriptSource;
       if(typeof code==='string'&&code.length>0){
         const digest=createHash('sha256').update(code).digest('hex');
         const original=staticInline.get(digest);
         const startLine=Number.isSafeInteger(event.startLine)?event.startLine+1:null;
         const sameLine=inventory.scripts.find(x=>x.startLine===startLine)||null;
         if(failureSourceHashes.length>=16)failureSourceHashes.shift();
         failureSourceHashes.push({
           digest,bytes:Buffer.byteLength(code,'utf8'),startLine,
           inlineId:original?.id||sameLine?.id||null,
           canonicalInlineMatch:!!original,
           sameLineOriginalBytes:sameLine?.bytes??null,
           truncatedRelativeToStatic:sameLine?.bytes>Buffer.byteLength(code,'utf8')
             ?sameLine.bytes-Buffer.byteLength(code,'utf8'):0
         });
       }
     }).catch(()=>{}));
   });
   cdp.on('Runtime.exceptionThrown',event=>{
     const detail=event.exceptionDetails;
     if(detail?.exception?.className==='SyntaxError')
       record(safePlace(detail.url,detail.lineNumber,detail.columnNumber,'exception'));
   });
   await cdp.send('Debugger.enable');
   await cdp.send('Runtime.enable');
   page.on('pageerror',err=>errors.push(normalizeError(err,phase)));
   await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
   // Validate the same Android-owned JS injected into the actual bundle,
   // never a test-only opt-in module or imperative scroll helper.
   await page.waitForFunction(()=>window.__mlvStoryFocusClearance?.installed===true,
     null,{timeout:16000});
   await page.waitForFunction(()=>!!window.__mlvAndroidFastRoute &&
     !!document.getElementById('mlv-android-bottom-nav') &&
     !!document.getElementById('mlv-android-menu-button'),null,{timeout:60000});
   let nav=page.locator('#mlv-android-bottom-nav');
   async function storyRoute(){
     await page.locator('#mlv-android-menu-button').tap({timeout:16000});
     const target=page.locator('#v30171PrimaryNav [data-tab="story"]');
     ok(await target.count()===1,'story_drawer_target_missing');
     await target.tap({timeout:16000});
     await page.waitForSelector('#tab-story.active',{state:'visible',timeout:16000});
   }
   phase='story';
   if(!await page.locator('#tab-story.active .v30162-story-form').isVisible().catch(()=>false)) await storyRoute();
   ok(await page.locator('#tab-story.active .v30162-story-form').isVisible(),'story_form_not_visible');
   if(width!==360)await page.screenshot({path:output+'/'+name+'-story.png'});
   const snapshot=async()=>page.evaluate(()=>{
     const p=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
     return {xp:p.xp,missions:(p.missions||[]).map(x=>String(x.id)).sort(),
       goals:(p.goals||[]).map(x=>String(x.id)).sort()};
   });
   const initial=await snapshot();
   phase='settings';
   await nav.locator('[data-mobile-tab="settings"]').tap({timeout:16000});
   await page.waitForSelector('#tab-settings.active .v30171-settings-shell',{state:'visible',timeout:16000});
   phase='focus';
   const focusButton=nav.locator('[data-mobile-tab="focus"]');
   ok(await focusButton.count()===1 && await focusButton.isVisible(),'pomodoro_hidden');
   await focusButton.tap({timeout:16000});
   await page.waitForSelector('#mlv-android-focus-overlay:not([hidden])',{state:'visible',timeout:16000});
   const sheet=page.locator('#mlv-android-focus-sheet');
   let timer=await page.evaluate(()=>window.FocusStoryV30162?.focusState?.());
   if(timer?.status!=='running')await sheet.locator('[data-mobile-focus="toggle"]').tap({timeout:16000});
   await page.waitForFunction(()=>window.FocusStoryV30162?.focusState?.().status==='running',null,{timeout:16000});
   const before=await page.evaluate(()=>({status:window.FocusStoryV30162?.focusState?.().status,
     deadline:window.FocusStoryV30162?.focusState?.().deadlineAt}));
   ok(Number.isFinite(Number(before.deadline)),'focus_no_deadline');
   if(width!==360)await page.screenshot({path:output+'/'+name+'-focus.png'});
   await sheet.locator('[data-mobile-focus="close"]').tap({timeout:16000});
   await page.waitForSelector('#mlv-android-focus-overlay:not([hidden])',{state:'hidden',timeout:16000});
   phase='resume';
   await focusButton.tap({timeout:16000});
   await page.waitForSelector('#mlv-android-focus-overlay:not([hidden])',{state:'visible',timeout:16000});
   const again=await page.evaluate(()=>({status:window.FocusStoryV30162?.focusState?.().status,
     deadline:window.FocusStoryV30162?.focusState?.().deadlineAt}));
   ok(again.status==='running'&&again.deadline===before.deadline,'focus_reset_on_navigation');
   await sheet.locator('[data-mobile-focus="close"]').tap({timeout:16000});
   phase='relaunch';
   await page.reload({waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.__mlvStoryFocusClearance?.installed===true&&
     !!window.FocusStoryV30162?.focusState&&
     !!document.getElementById('mlv-android-bottom-nav'),null,{timeout:60000});
   const persisted=await page.evaluate(()=>({status:window.FocusStoryV30162?.focusState?.().status,
     deadline:window.FocusStoryV30162?.focusState?.().deadlineAt}));
   ok(persisted.status==='running'&&persisted.deadline===before.deadline,
     'focus_not_persisted_after_browser_relaunch');
   phase='chapter';
   await storyRoute();
   const finalState=await snapshot();
   ok(initial.xp===finalState.xp&&JSON.stringify(initial.missions)===JSON.stringify(finalState.missions)&&
     JSON.stringify(initial.goals)===JSON.stringify(finalState.goals),'progress_mutated_by_navigation');
   const nameInput=page.locator('#tab-story .v30162-story-form input').first();
   const mottoInput=page.locator('#tab-story .v30162-story-form input[name="motto"]');
   const syntheticTitle='Granada QA '+name;
   await nameInput.fill(syntheticTitle);
   await mottoInput.fill('Synthetic draft persistence');
   await mottoInput.evaluate(el=>el.blur());
   await nav.locator('[data-mobile-tab="settings"]').tap({timeout:16000});
   await page.waitForSelector('#tab-settings.active',{state:'visible',timeout:16000});
   await storyRoute();
   ok(await nameInput.inputValue()===syntheticTitle,'chapter_draft_lost');
   ok(await mottoInput.inputValue()==='Synthetic draft persistence','chapter_motto_lost');
   await nameInput.evaluate(el=>el.blur());
   const submit=page.locator('#tab-story .v30162-story-form button')
     .filter({hasText:/start chapter|iniciar cap[ií]tulo/i}).first();
   ok(await submit.count()===1,'start_chapter_missing');
   await submit.scrollIntoViewIfNeeded();
   // No test-only scrolling or helper calls; the normal focusout/navigation
   // lifecycle must leave the real chapter CTA unobstructed.
   await page.waitForTimeout(160);
   const hit=await submit.evaluate(el=>{
      const box=el.getBoundingClientRect(),x=box.left+box.width/2,y=box.top+box.height/2;
      const target=document.elementFromPoint(x,y);
      return !!(target&&(target===el||el.contains(target)));
   });
   ok(hit,'chapter_submit_covered');
   await submit.tap({timeout:16000});
   await page.waitForFunction(s=>document.getElementById('tab-story')?.textContent?.includes(s),
     syntheticTitle,{timeout:16000});
   // Final screenshot proves the actual tapped chapter is visible, with
   // running Focus still present, using only synthetic QA data.
   if(width===412)await page.screenshot({path:output+'/'+name+'-chapter-saved.png'});
   phase='final';
   ok(errors.length===0,'unexpected_javascript_pageerror');
   passed=true;
   console.log('PASS Android Story/Focus touch '+name);
 }catch(error){
   errors.push(normalizeError(error,phase));
   // The evidence schema already allows only sanitized category and source
   // basename/line. Surface a small bounded sample for diagnosing the
   // intermittent parser error without ever printing raw error text.
   await Promise.race([Promise.allSettled(sourceRequests),
     new Promise(resolve=>setTimeout(resolve,1800))]);
   // Compare the browser's ACTUAL DOM text for the two suspect script tags
   // with the frozen canonical bundle inventory. Hashes/sizes ONLY, never JS
   // source, account data, journal content or arbitrary URLs.
   const suspectIds=['v251-weekly-real-fix-script','v3021-dashboard-real-category-filter'];
   const domIntegrity=page?await page.evaluate(async ids=>{
     const result=[];
     for(const id of ids){
       const el=document.getElementById(id);
       if(!el){result.push({id,missing:true});continue;}
       const source=el.textContent||'';
       const bytes=new TextEncoder().encode(source);
       const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)))
         .map(x=>x.toString(16).padStart(2,'0')).join('');
       result.push({id,bytes:bytes.length,digest});
     }
     return result;
   },suspectIds).catch(()=>[]):[];
   const compared=domIntegrity.map(x=>{
     const original=inventory.scripts.find(s=>s.id===x.id);
     return {id:x.id,domBytes:x.bytes??null,expectedBytes:original?.bytes??null,
       domMatchesCanonical:!!original&&x.digest===original.digest,missing:!!x.missing};
   });
   console.error('FAIL Android Story/Focus touch '+name+' ['+
     [...new Set(errors.map(e=>e.code))].join(',')+'] '+
     JSON.stringify({errors:errors.slice(0,3),parser:parseLocations,
       failedScriptFingerprints:failureSourceHashes.slice(-12),domScriptIntegrity:compared}));
   if(page)try{await page.screenshot({path:output+'/'+name+'-failure.png',timeout:6000});}catch{}
 }finally{
   cases.push({width,language,passed,phase,errors});
   if(context)await context.close();
 }
}
}finally{await browser.close();}
let report;
try{report=evidenceReport({sourceSha:sha,cases});}
catch(e){console.error('FAIL invalid provenance report:',e.message);process.exitCode=1;}
if(report){
 await writeFile(output+'/evidence.json',JSON.stringify(report,null,2)+'\n');
 console.log('PRODUCTION Android Story/Focus exact-commit browser touch matrix '+report.status+': '+report.passed+'/6; native signed Galaxy QA remains separate.');
 if(report.status!=='PASS')process.exitCode=1;
}
