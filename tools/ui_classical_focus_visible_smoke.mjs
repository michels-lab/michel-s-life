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
  const card=root.locator(mobile?'.mlv-android-classical':'.mlv-focus-classical');
  const mozart=card.locator(mobile?'[data-mobile-classical="mozart_k545"]':'[data-mlv-classical="mozart_k545"]');
  const tchaikovsky=card.locator(mobile?'[data-mobile-classical="tchaikovsky_op39"]':'[data-mlv-classical="tchaikovsky_op39"]');
  assert.equal(await card.isVisible(),true,'classical section must be visible by default');
  const firstViewport=await card.evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {top:r.top,bottom:r.bottom,height:window.innerHeight,
      display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility};
  });
  assert.ok(firstViewport.top>=0 && firstViewport.top < firstViewport.height-50,
    'classical songs must appear near top of Focus WITHOUT scrolling: '+JSON.stringify(firstViewport));
  assert.equal(await mozart.count(),1);
  assert.equal(await tchaikovsky.count(),1);
  assert.equal(await mozart.getAttribute('aria-pressed'),'false','music must not autoplay');
  const details=root.locator(mobile?'.mlv-android-focus-sounds':'.mlv-focus-sound-details');
  assert.equal(await details.getAttribute('open'),null,'hidden audio drawer should stay closed');
  const title=await card.innerText();
  assert.match(title,/Música clásica/);
  assert.match(title,/Mozart/);
  assert.match(title,/Chaikovski/);
  await mozart.scrollIntoViewIfNeeded();
  await page.screenshot({path:out+'/'+platform+'-music-visible.png'});
  await mozart[mobile?'tap':'click']();
  await page.waitForFunction(()=>window.MichelsLifeFocusAudio?.playing?.()&&
    window.MichelsLifeFocusAudio?.playingScene?.()==='mozart_k545',null,{timeout:8000});
  assert.equal(await mozart.getAttribute('aria-pressed'),'true','Mozart must be indicated playing');
  await tchaikovsky[mobile?'tap':'click']();
  await page.waitForFunction(()=>window.MichelsLifeFocusAudio?.playingScene?.()==='tchaikovsky_op39',null,{timeout:8000});
  assert.equal(await tchaikovsky.getAttribute('aria-pressed'),'true','Tchaikovsky must be indicated playing');
  const saved=await page.evaluate(()=>{
    const a=window.MichelsLifeFocusAudio,s=window.FocusStoryV30162.focusState();
    return {selected:a.sceneId(),persisted:s.v30165Soundscape,
      oldMozart:a.classicalOptions().length,allScenes:a.sceneOptions().length};
  });
  assert.equal(saved.selected,'tchaikovsky_op39');
  assert.equal(saved.persisted,'tchaikovsky_op39');
  assert.equal(saved.allScenes,10,'eight original scenes must be preserved');
  await tchaikovsky[mobile?'tap':'click']();
  assert.equal(await page.evaluate(()=>window.MichelsLifeFocusAudio.playing()),false,
    'second press must stop, not leave an ambient interval');
  assert.equal(await tchaikovsky.getAttribute('aria-pressed'),'false');
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.MichelsLifeFocusAudio?.sceneId,null,{timeout:60000});
  assert.equal(await page.evaluate(()=>window.MichelsLifeFocusAudio.sceneId()),
    'tchaikovsky_op39','classical choice not persisted across reload');
  assert.deepEqual(errors,[],
    'real Chromium runtime errors cannot be ignored; sanitized CDP provenance='+
      JSON.stringify(await parserFaults.snapshot()));
  console.log('PASS real '+platform+' visible classical Mozart/Chaikovski, direct taps, Web Audio state, stop and reload persistence');
}finally{await browser.close();}
