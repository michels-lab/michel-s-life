import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createBrowserScriptFaultTracker} from './browser_script_fault_provenance.mjs';

const platform=process.env.MLV_CLASSICAL_PLATFORM;
assert.ok(['desktop','android'].includes(platform),'explicit platform required');
const url=platform==='desktop'?(process.env.MLV_UI_URL||'http://127.0.0.1:4173'):
  (process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174');
const out='artifacts/'+(platform==='desktop'?'ui-smoke':'android-ui-smoke')+'/classical-music-visible';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext(platform==='android'?{
    viewport:{width:412,height:915},screen:{width:412,height:915},
    isMobile:true,hasTouch:true,deviceScaleFactor:2.625
  }:{viewport:{width:976,height:737}});
  await context.addInitScript(mode=>{
    if(!localStorage.getItem('vida_rpg_personal_progress_v2'))
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
      version:2,activeTab:'dashboard',xp:0,coins:0,totalCoinsEarned:0,
      settings:{characterName:'QA',onboardingRequired:false,
        onboardingCompletedAt:'2026-11-01T12:00:00Z',v30200GenericProfile:true},
      missions:[],goals:[],history:[],achievements:[],affirmations:[],owned:[],equipped:{}
    }));
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','es');
    localStorage.setItem('michelsLife.language.userOverrideBase.v1','es');
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='es';
    if(mode==='android')window.MichelsLifeAndroid={postMessage(){}};
  },platform);
  const page=await context.newPage();
  // #168: capture only CDP script basename/line/length/hash. Never include
  // inline source, full URLs, tokens or owner data in CI logs.
  const cdp=await context.newCDPSession(page);
  const parserFaults=createBrowserScriptFaultTracker(cdp);
  await cdp.send('Runtime.enable');
  await cdp.send('Debugger.enable');
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e?.name||'Error')+':'+String(e?.message||'').slice(0,100)));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.FocusStoryV30162?.focusState &&
    window.MichelsLifeFocusAudio?.classicalOptions?.().length===2,null,{timeout:60000});
  const mobile=platform==='android';
  const root=page.locator(mobile?'#mlv-android-focus-overlay':'#mlv-desktop-focus-immersive');
  if(mobile){
    await page.waitForSelector('#mlv-android-bottom-nav [data-mobile-tab="focus"]',{state:'visible',timeout:60000});
    await page.locator('#mlv-android-bottom-nav [data-mobile-tab="focus"]').tap();
  }else{
    await page.waitForSelector('#mlv-desktop-focus-launcher',{state:'visible',timeout:60000});
    await page.locator('#mlv-desktop-focus-launcher').click();
  }
  assert.equal(await root.isVisible(),true,platform+' immersive focus not opened');
  const completion=root.locator(mobile?'[data-mobile-focus-completion]':'[data-mlv-completion-sound]');
  const preview=root.locator(mobile?'[data-mobile-focus="preview-completion"]':'[data-mlv-audio="preview-completion"]');
  const clock=root.locator(mobile?'#mlv-android-focus-time':'#mlv-desktop-focus-clock');
  const motivation=root.locator(mobile?'#mlv-android-focus-motivation':'#mlv-desktop-focus-motivation');
  await motivation.locator('.mlv-motivation-line').first().waitFor({state:'visible'});
  const first=await root.evaluate((el,mobile)=>{
    const c=el.querySelector(mobile?'#mlv-android-focus-time':'#mlv-desktop-focus-clock');
    const m=el.querySelector(mobile?'#mlv-android-focus-motivation':'#mlv-desktop-focus-motivation');
    const r=c.getBoundingClientRect(),v=m.getBoundingClientRect();
    return {clockTop:r.top,clockBottom:r.bottom,motivationTop:v.top,motivationBottom:v.bottom,height:innerHeight,collapsed:!!m.closest('details:not([open])')};
  },mobile);
  assert.ok(first.clockTop>=0&&first.clockBottom<=first.height&&first.motivationBottom<=first.height&&!first.collapsed,'clock and phrases must be fully visible at first viewport: '+JSON.stringify(first));
  assert.equal(await motivation.locator('.mlv-motivation-line:not([hidden])').count(),2);
  assert.equal(await completion.locator('option').count(),25);
  assert.match(await completion.locator('option[value="mozart_k545"]').innerText(),/Mozart/);
  assert.match(await completion.locator('option[value="tchaikovsky_op39"]').innerText(),/Chaikovski/);
  await page.screenshot({path:out+'/'+platform+'-clock-first.png'});
  for(const id of ['mozart_k545','tchaikovsky_op39']){
    await completion.selectOption(id);
    await preview[mobile?'tap':'click']();
    await page.waitForFunction(id=>window.MichelsLifeFocusAudio.previewingCompletion()===id,id,{timeout:10000});
    await page.waitForFunction(()=>{const x=window.MichelsLifeFocusAudio.recordingPlayback();return x&&!x.paused&&x.currentTime>.1&&x.duration>110;},null,{timeout:15000});
    assert.equal(await page.evaluate(()=>window.MichelsLifeFocusAudio.playing()),false,'classical must not start ambient');
    assert.equal(await page.evaluate(()=>window.FocusStoryV30162.focusState().v30165CompletionSound),id);
    await preview[mobile?'tap':'click']();
    await page.waitForFunction(()=>window.MichelsLifeFocusAudio.previewingCompletion()===null);
  }
  // Test actual packaged MP3 playback in the ambient selector, not only JS mocks.
  const ambient=root.locator(mobile?'[data-mobile-focus-ambience]':'[data-mlv-scene-select]');
  const audioDetails=ambient.locator('xpath=ancestor::details[1]');
  if(await audioDetails.count())await audioDetails.evaluate(el=>el.open=true);
  const ambientToggle=root.locator(mobile?'[data-mobile-focus="toggle-ambient"]':'[data-mlv-audio="toggle-ambient"]');
  for(const id of ['sb_meanwhile','debussy_clair_de_lune']){
    await ambient.selectOption(id);await ambientToggle[mobile?'tap':'click']();
    await page.waitForFunction(id=>{const p=window.MichelsLifeFocusAudio.ambientPlayback();return p&&!p.paused&&p.currentTime>.1&&p.duration>100&&p.src.includes(id+'.mp3');},id,{timeout:15000});
    await ambientToggle[mobile?'tap':'click']();await page.waitForFunction(()=>window.MichelsLifeFocusAudio.ambientPlayback()?.paused===true);
    await ambientToggle[mobile?'tap':'click']();await page.waitForFunction(()=>window.MichelsLifeFocusAudio.ambientPlayback()?.paused===false);
    await root.locator(mobile?'[data-mobile-focus="stop-ambient"]':'[data-mlv-audio="stop-ambient"]')[mobile?'tap':'click']();
    await page.waitForFunction(()=>!window.MichelsLifeFocusAudio.playing());
  }
  // A real timer expiry, not a preview callback: shorten an already running
  // synthetic QA session's canonical deadline and observe its actual finish.
  await page.evaluate(()=>{
    const engine=window.FocusStoryV30162,audio=window.MichelsLifeFocusAudio;
    engine.applyPreset('qa',1,1);
    const original=audio.playCompletion;
    window.__qaCompletionCalls=[];
    audio.playCompletion=function(preview=false){
      const ok=original.call(audio,preview);
      window.__qaCompletionCalls.push({preview,id:audio.completionId(),ok});
      return ok;
    };
    engine.startFocus();
    engine.focusState().deadlineAt=Date.now()+1600;
  });
  await page.waitForFunction(()=>window.__qaCompletionCalls?.some(x=>!x.preview&&x.id==='tchaikovsky_op39'&&x.ok),null,{timeout:12000});
  await page.waitForFunction(()=>{const x=window.MichelsLifeFocusAudio.recordingPlayback();return x&&!x.paused&&x.currentTime>.1&&x.duration>110;},null,{timeout:15000});
  assert.equal(await page.evaluate(()=>window.FocusStoryV30162.focusState().mode),'break');
  await page.evaluate(()=>window.MichelsLifeFocusAudio.stopClassical());
  const scenes=await page.evaluate(()=>window.MichelsLifeFocusAudio.sceneOptions().map(x=>x.id));
  assert.equal(scenes.length,24);assert.ok(!scenes.includes('mozart_k545'));
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.MichelsLifeFocusAudio?.completionId?.()==='tchaikovsky_op39');
  assert.deepEqual(errors,[],
    'real Chromium runtime errors cannot be ignored; sanitized CDP provenance='+
      JSON.stringify(await parserFaults.snapshot()));
  console.log('PASS real '+platform+' clock-first, visible motivation, classical completion preview, stop and reload persistence');
}finally{await browser.close();}
