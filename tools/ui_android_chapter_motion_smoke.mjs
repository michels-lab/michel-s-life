import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const output='artifacts/android-ui-smoke';
const check=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({
    viewport:{width:412,height:915},screen:{width:412,height:915},
    deviceScaleFactor:2.625,isMobile:true,hasTouch:true
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{
    const state={
      version:2,settings:{characterName:'Michel',onboardingRequired:true,
        onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
      xp:10,coins:0,totalCoinsEarned:0,activeTab:'dashboard',
      missions:[],history:[],owned:[],equipped:{},achievements:[],goals:[],affirmations:[],
      v30162StoryChapters:[{
        id:'chapter-motion-regression',name:'The Animated Chapter',
        motto:'Keep the original cinematic artwork',
        startDate:'2026-10-01',createdAt:'2026-10-01T12:00:00.000Z',
        endDate:'',status:'active',moments:[],scenePack:'dark_kingdom'
      }]
    };
    localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(state));
    localStorage.setItem('michelsLife.language.v1','en');
    localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
    localStorage.setItem('michelsLife.language.installDefault.v1','en');
    localStorage.removeItem('michelsLife.onboarding.v30200');
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement.dataset.mlvPlatform==='android' &&
    !!document.querySelector('#v176StatusPanel>.v30165-rpg-chapter-hero') &&
    !!window.VisualSystemV30189,null,{timeout:60000});
  await page.evaluate(()=>{
    window.__mlvAndroidFastRoute?.('dashboard');
    window.VisualSystemV30189?.applyChapter?.(true);
  });
  await page.waitForFunction(()=>{
    const art=document.getElementById('mlv184ChapterArt');
    return !!art && art.complete && art.naturalWidth>0;
  },null,{timeout:25000});
  const state=await page.evaluate(async()=>{
    const status=document.getElementById('v176StatusPanel');
    const hero=status?.querySelector(':scope>.v30165-rpg-chapter-hero');
    const art=hero?.querySelector('#mlv184ChapterArt');
    const fog=hero?.querySelector('#mlv184FogA');
    const beam=hero?.querySelector('#mlv184Beam');
    const summary=status?.querySelector('#mlv-android-time-summary');
    const rect=el=>{const r=el?.getBoundingClientRect();return r?{
      top:r.top,bottom:r.bottom,left:r.left,right:r.right,
      width:r.width,height:r.height}:null};
    const snap=()=>({transform:getComputedStyle(art).transform,
      fogTransform:getComputedStyle(fog).transform,
      beamTransform:getComputedStyle(beam).transform});
    const first=snap();
    await new Promise(resolve=>setTimeout(resolve,1100));
    const second=snap();
    return {
      status:rect(status),summary:rect(summary),hero:rect(hero),
      heroDisplay:getComputedStyle(hero).display,
      heroVisibility:getComputedStyle(hero).visibility,
      artLoaded:art.naturalWidth,
      animation:getComputedStyle(art).animationName,
      animationState:getComputedStyle(art).animationPlayState,
      fogAnimation:getComputedStyle(fog).animationName,
      beamAnimation:getComputedStyle(beam).animationName,
      first,second
    };
  });
  check(state.status&&state.hero&&state.summary&&state.hero.height>=235,
    'Original Chapter must occupy its full hero instead of a hidden 64/88px tile: '+JSON.stringify(state));
  check(state.hero.top>=state.summary.bottom-3 &&
    state.hero.bottom<=state.status.bottom+4 &&
    state.heroDisplay!=='none' && state.heroVisibility==='visible' &&
    state.hero.width>280,
    'Chapter is clipped, collapsed or underneath the compact Android clock: '+JSON.stringify(state));
  check(state.artLoaded>0 && state.animation==='mlv189ChapterCamera' &&
    state.animationState==='running' &&
    state.fogAnimation==='mlv186FogLeft' &&
    state.beamAnimation==='mlv186LightSweep',
    'Canonical Chapter artwork/fog/light animation was replaced or stopped: '+JSON.stringify(state));
  check(state.first.transform!==state.second.transform &&
    (state.first.fogTransform!==state.second.fogTransform ||
     state.first.beamTransform!==state.second.beamTransform),
    'Chapter artwork and atmosphere did not actually move across 1100ms: '+JSON.stringify(state));

  // Selecting a different scene must update the exact SAME canonical image
  // rather than inserting a new Android clone that flashes over it.
  const changed=await page.evaluate(async()=>{
    const visual=window.VisualSystemV30189;
    const previous=document.getElementById('mlv184ChapterArt');
    const oldSrc=previous?.getAttribute('src')||'';
    const choices=Object.keys(visual.CHAPTERS);
    const other=choices.find(k=>k!==visual.chapter());
    if(!other)return {error:'No second Chapter scene available'};
    const ok=visual.setChapter(other);
    await new Promise(resolve=>setTimeout(resolve,300));
    const current=document.getElementById('mlv184ChapterArt');
    return {ok,sameNode:previous===current,oldSrc,
      newSrc:current?.getAttribute('src'),animation:getComputedStyle(current).animationName,
      statusHeight:document.getElementById('v176StatusPanel')?.getBoundingClientRect().height};
  });
  check(changed.ok && changed.sameNode && changed.newSrc!==changed.oldSrc &&
    changed.animation==='mlv189ChapterCamera' && changed.statusHeight>=235,
    'Chapter scene selection swapped out the canonical art or collapsed its animation: '+JSON.stringify(changed));
  await mkdir(output,{recursive:true});
  await page.screenshot({path:output+'/chapter-motion-restored.png',fullPage:true});
  console.log(JSON.stringify({pass:true,chapter:state,selectedScene:changed},null,2));
  await context.close();
}finally{
  await browser.close();
}
