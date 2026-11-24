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
const invariantScriptIds=[
  'v251-weekly-real-fix-script','v3021-dashboard-real-category-filter',
  'v3130-presets-only-settings-script','v217-premium-edit-unified-script'
];
const canonicalById=new Map(inventory.scripts.map(x=>[x.id,x]));
// Canonical generated Android HTML is the exact material parsed in the browser.
// Compare failed runtime sources by structure ONLY (never log source/user data).
const canonicalHtml=await readFile('artifacts/android-story-bundle/index.html','utf8');
function canonicalBody(id){
 if(!id||!/^[A-Za-z0-9_-]{1,100}$/.test(id))return null;
 const at=canonicalHtml.indexOf('id="'+id+'"');
 if(at<0)return null;
 const tag=canonicalHtml.lastIndexOf('<script',at);
 if(tag<0||canonicalHtml.indexOf('>',tag)<at)return null;
 const start=canonicalHtml.indexOf('>',at)+1;
 const end=canonicalHtml.indexOf('</script>',start);
 return end<0?null:canonicalHtml.slice(start,end);
}
function structuralDiff(reference,observed){
 if(typeof reference!=='string'||typeof observed!=='string')return null;
 let prefix=0,suffix=0;
 while(prefix<reference.length&&prefix<observed.length&&
   reference[prefix]===observed[prefix])prefix++;
 while(suffix<reference.length-prefix&&suffix<observed.length-prefix&&
   reference[reference.length-1-suffix]===observed[observed.length-1-suffix])suffix++;
 return {sourceCharacters:reference.length,observedCharacters:observed.length,
   equal:reference===observed,prefixCharacters:prefix,suffixCharacters:suffix,
   firstDifferenceLine:reference.slice(0,prefix).split('\n').length,
   // Never expose source text, URLs, tokens, exception stack or HTML snippets.
   differenceCharacters:reference.length-observed.length};
}
try{
for(const width of [320,360,412])for(const language of ['en','es']){
 const name=String(width)+'-'+language;
 let context=null,page=null,phase='bootstrap',passed=false;
 const errors=[];
 const parseLocations=[];
 const failureSourceHashes=[];
 const sourceRequests=[];
 const executedScriptIntegrity=[];
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
   // Issue #168 evidence: observe SCRIPT text BEFORE the HTML parser starts
   // any app code. Never log source, URLs, user content or script characters.
   // First snapshot distinguishes parse-time normalization from app mutation.
   await context.addInitScript(()=>{
     const ids=new Set([
       'v251-weekly-real-fix-script','v3021-dashboard-real-category-filter',
       'v3130-presets-only-settings-script','v217-premium-edit-unified-script'
     ]);
     const evidence=[];
     window.__mlv168EarlyEvidence=evidence;
     const snapshots=stage=>{
       const scripts=[...ids].map(id=>{
         const el=document.getElementById(id);
         return {id,present:!!el,characters:el?.textContent?.length??null};
       });
       if(evidence.length<48)evidence.push({stage,scripts});
     };
     const record=(kind,node,oldText,detail=null)=>{
       const parent=node?.nodeType===1?node:node?.parentElement;
       const owner=parent?.tagName==='SCRIPT'?parent:parent?.closest?.('script');
       if(!owner||!ids.has(owner.id)||evidence.length>=48)return;
       evidence.push({stage:'text-mutation',id:owner.id,kind,
         beforeCharacters:oldText?.length??null,
         currentCharacters:owner.textContent?.length??null,
         ...(detail||{})});
     };
     // The previous evidence proved that complete SCRIPT text is later
     // REPLACED (childList), not just character-edited. Capture the owning
     // DOM API call stack WITHOUT any source/script/user data. This is
     // diagnosis-only and never suppresses a failing integrity gate.
     const scriptOwner=node=>{
       if(!node)return null;
       const p=node.nodeType===1?node:node.parentElement;
       if(!p)return null;
       const direct=p.tagName==='SCRIPT'?p:p.closest?.('script');
       if(direct&&ids.has(direct.id))return direct;
         return null;
     };
     const traceWrite=(node,kind,value)=>{
       const owner=scriptOwner(node);
       if(!owner||evidence.length>=48)return;
       const lines=String(new Error().stack||'').split('\n').slice(2,7);
       const callers=lines.map(line=>{
         const match=line.match(/(index\.html|i18n\.js|mobile-experience\.js|android-bridge\.js|settings-color-floating-preview\.js):(\d+):(\d+)/);
         if(!match)return null;
         const fn=line.match(/\bat\s+([A-Za-z_$][\w$.-]*)\s*\(/)?.[1]||'anonymous';
         return {script:match[1],line:Number(match[2]),column:Number(match[3]),fn};
       }).filter(Boolean).slice(0,3);
       evidence.push({stage:'script-write',id:owner.id,kind,
         beforeCharacters:owner.textContent?.length??null,
         newCharacters:typeof value==='string'?value.length:null,callers});
     };
     for(const [proto,key] of [
       [Node.prototype,'textContent'],[Node.prototype,'nodeValue'],
       [CharacterData.prototype,'data'],[Element.prototype,'innerHTML']
     ]){
       const descriptor=Object.getOwnPropertyDescriptor(proto,key);
       if(!descriptor?.configurable||!descriptor?.set||!descriptor?.get)continue;
       Object.defineProperty(proto,key,{
         configurable:true,enumerable:descriptor.enumerable,
         get(){return descriptor.get.call(this)},
         set(value){traceWrite(this,key,value);return descriptor.set.call(this,value)}
       });
     }
     for(const key of ['replaceChildren','replaceChild','removeChild','appendChild','insertBefore']){
       const original=Node.prototype[key];
       if(typeof original!=='function')continue;
       Object.defineProperty(Node.prototype,key,{
         configurable:true,writable:true,
         value:function(...args){traceWrite(this,key,null);return original.apply(this,args)}
       });
     }
     const observer=new MutationObserver(entries=>{
       for(const entry of entries){
         if(entry.type==='characterData')
           record('characterData',entry.target,entry.oldValue);
         else if(entry.type==='childList'){
           const node=entry.target;
           if(node?.tagName==='SCRIPT'&&ids.has(node.id))
             record('childList',node,null,{
               addedNodeCount:entry.addedNodes.length,
               removedNodeCount:entry.removedNodes.length,
               addedTextCharacters:[...entry.addedNodes].reduce((n,x)=>n+(x.textContent?.length||0),0),
               removedTextCharacters:[...entry.removedNodes].reduce((n,x)=>n+(x.textContent?.length||0),0)
             });
         }
       }
     });
     observer.observe(document,{subtree:true,characterData:true,
       characterDataOldValue:true,childList:true});
     document.addEventListener('DOMContentLoaded',()=>snapshots('domcontentloaded'),true);
     window.addEventListener('load',()=>snapshots('load'),true);
   });
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
   // #168: an altered DOM node is NOT proof that Chromium executed altered
   // JavaScript. Capture the exact engine-compiled inline source SHA too.
   // Only the four selected historical SCRIPT offsets are fetched; never
   // record source text, arbitrary script URLs or user data.
   cdp.on('Debugger.scriptParsed',event=>{
     if(sourceRequests.length>=100||!event.scriptId)return;
     const line=Number.isSafeInteger(event.startLine)?event.startLine+1:null;
     if(line===null)return;
     const candidate=inventory.scripts.find(x=>
       invariantScriptIds.includes(x.id)&&Math.abs(x.startLine-line)<=2);
     if(!candidate)return;
     sourceRequests.push(cdp.send('Debugger.getScriptSource',
       {scriptId:event.scriptId}).then(reply=>{
       if(typeof reply.scriptSource!=='string')return;
       const code=reply.scriptSource;
       executedScriptIntegrity.push({
         id:candidate.id,engineStartLine:line,
         compiledBytes:Buffer.byteLength(code,'utf8'),
         canonicalBytes:candidate.bytes,
         compiledHashMatchesCanonical:createHash('sha256').update(code).digest('hex')===candidate.digest
       });
     }).catch(()=>{}));
   });
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
             ?sameLine.bytes-Buffer.byteLength(code,'utf8'):0,
           sameLineStructuralDiff:structuralDiff(
             canonicalBody(original?.id||sameLine?.id),code)
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
   // A page may look correct yet have source text rewritten by legacy
   // translation walkers. Verify DOM script bytes AND SHA before navigation,
   // after Settings rerenders, after reload and after chapter submission.
   // No script source or private page text leaves this synthetic browser.
   async function assertInlineIntegrity(stage){
     const observed=await page.evaluate(async ids=>{
       const out=[];
       for(const id of ids){
         const el=document.getElementById(id);
         if(!el){out.push({id,missing:true});continue;}
         const bytes=new TextEncoder().encode(el.textContent||'');
         const hash=await crypto.subtle.digest('SHA-256',bytes);
         const digest=Array.from(new Uint8Array(hash))
           .map(x=>x.toString(16).padStart(2,'0')).join('');
         out.push({id,bytes:bytes.length,digest});
       }
       return out;
     },invariantScriptIds);
     const mismatches=observed.filter(x=>{
       const original=canonicalById.get(x.id);
       return !original||x.missing||x.bytes!==original.bytes||x.digest!==original.digest;
     });
     ok(mismatches.length===0,'inline_script_source_divergence_'+stage+'_'+
       mismatches.map(x=>x.id).join('_'));
   }
   await assertInlineIntegrity('initial');
   let nav=page.locator('#mlv-android-bottom-nav');
   async function storyRoute(){
     // Story is now a primary mobile destination. The legacy drawer can be
     // offscreen/covered while its transitions settle; entering via it was a
     // false negative in all six phones, despite a working Story bottom tab.
     // Use a REAL touchscreen tap on the permanent user-facing destination.
     const target=nav.locator('[data-mobile-tab="story"]');
     ok(await target.count()===1,'story_bottom_navigation_missing');
     await target.tap({timeout:16000});
     await page.waitForSelector('#tab-story.active',{state:'visible',timeout:16000});
     ok(await target.getAttribute('aria-current')==='page',
       'story_bottom_navigation_not_selected');
   }
   phase='story';
   if(!await page.locator('#tab-story.active .v30162-story-form').isVisible().catch(()=>false)) await storyRoute();
   ok(await page.locator('#tab-story.active .v30162-story-form').isVisible(),'story_form_not_visible');
   // Six permanent Android destinations, including Story, must be safely
   // touchable in the 320/360/412px real Chromium device matrix.
   const storyNav=nav.locator('[data-mobile-tab="story"]');
   ok(await storyNav.count()===1,'story_bottom_navigation_missing');
   const navGeometry=await page.evaluate(()=>[...document.querySelectorAll(
     '#mlv-android-bottom-nav [data-mobile-tab]')].map(el=>{
       const box=el.getBoundingClientRect();
       const text=el.lastElementChild;
       return {tab:el.dataset.mobileTab,width:box.width,height:box.height,
         left:box.left,right:box.right,top:box.top,
         translatedLabelClipped:!!text&&text.scrollWidth>text.clientWidth+1};
     }));
   ok(navGeometry.length===6&&navGeometry.every(x=>
     x.width>=44&&x.height>=44&&x.left>=0&&x.right<=width+1&&
     Math.abs(x.top-navGeometry[0].top)<=1&&!x.translatedLabelClipped),
     'Android nav wraps rows or clips translated labels or touch targets: '+JSON.stringify(navGeometry));
   // Navigate away first so an already-active Story cannot fake a PASS.
   await nav.locator('[data-mobile-tab="dashboard"]').tap({timeout:16000});
   await page.waitForSelector('#tab-dashboard.active',{state:'visible',timeout:16000});
   await storyNav.tap({timeout:16000});
   await page.waitForSelector('#tab-story.active .v30162-story-form',{state:'visible',timeout:16000});
   ok(await storyNav.getAttribute('aria-current')==='page',
     'Story bottom destination is not active after a real touch');
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
   await assertInlineIntegrity('settings');
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
   await assertInlineIntegrity('relaunch');
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
   await assertInlineIntegrity('chapter');
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
   const suspectIds=[...new Set(['v251-weekly-real-fix-script',
     'v3021-dashboard-real-category-filter',
     ...failureSourceHashes.map(item=>item.inlineId).filter(Boolean)])];
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
       domMatchesCanonical:!!original&&x.digest===original.digest,missing:!!x.missing,
       // Byte equality is checked against the generated bundle, not just
       // the source tree; this distinguishes packaging from runtime mutation.
       canonicalGeneratedBytes:canonicalBody(x.id)?
         Buffer.byteLength(canonicalBody(x.id),'utf8'):null};
   });
   const earlyScriptEvidence=page?await page.evaluate(
     ()=>window.__mlv168EarlyEvidence?.slice(0,48)||null
   ).catch(()=>null):null;
   console.error('FAIL Android Story/Focus touch '+name+' ['+
     [...new Set(errors.map(e=>e.code))].join(',')+'] '+
     JSON.stringify({errors:errors.slice(0,3),parser:parseLocations,
       failedScriptFingerprints:failureSourceHashes.slice(-12),
       domScriptIntegrity:compared,executedScriptIntegrity,
       earlyScriptEvidence}));
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
