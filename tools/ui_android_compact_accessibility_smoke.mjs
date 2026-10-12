import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const base=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const output='artifacts/android-ui-smoke/compact-accessibility';
const requireOk=(yes,detail)=>{if(!yes)throw Error(detail)};
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({
    viewport:{width:360,height:915},screen:{width:360,height:915},
    isMobile:true,hasTouch:true,deviceScaleFactor:2.625,reducedMotion:'reduce'
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{
    try{
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
        version:2,activeTab:'dashboard',xp:0,coins:0,totalCoinsEarned:0,
        settings:{characterName:'Michel',onboardingRequired:false,
          onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
        missions:[{id:'compact-qa-mission',name:'Compact accessibility QA',
          canonical:'compact accessibility qa',description:'',category:'academic',
          type:'daily',difficulty:'medium',xp:25,coins:0,days:[1,2,3,4,5],
          archived:false,hidden:false,createdAt:'2026-01-01T12:00:00.000Z',
          completions:[]}],
        history:[],achievements:[],goals:[],affirmations:[],owned:[],equipped:{}
      }));
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('michelsLife.language.installDefault.v1','en');
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
  });
  await mkdir(output,{recursive:true});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement.dataset.mlvPlatform==='android'
    && !!window.__mlvAndroidFastRoute
    && !!document.getElementById('mlv-android-bottom-nav'),null,{timeout:60000});
  requireOk(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),
    'Chromium did not enable reduced-motion preference');
  const audit=[];
  async function route(id,width){
    await page.setViewportSize({width,height:915});
    const navigated=await page.evaluate(tab=>window.__mlvAndroidFastRoute(tab),id);
    requireOk(navigated!==false,'Android route rejected '+id);
    await page.waitForFunction(tab=>document.getElementById('tab-'+tab)
      ?.classList.contains('active'),id,{timeout:10000});
    await page.waitForTimeout(250);
    const result=await page.evaluate(id=>{
      const bounds=el=>{const r=el.getBoundingClientRect();return {
        left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        width:r.width,height:r.height};};
      const tab=document.getElementById('tab-'+id);
      const nav=document.getElementById('mlv-android-bottom-nav');
      return {
        id,viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
        tab:bounds(tab),nav:bounds(nav),
        navButtons:[...nav.querySelectorAll('button')].filter(e=>e.getClientRects().length)
          .map(e=>bounds(e)),
        sectionCardAnimations:[...tab.querySelectorAll(':scope > .card')]
          .filter(e=>e.getClientRects().length).map(e=>getComputedStyle(e).animationName)
      };
    },id);
    requireOk(result.documentWidth<=width+3
      &&result.tab.left>=-3&&result.tab.right<=width+3,
      'Compact Android page overflows: '+JSON.stringify(result));
    requireOk(result.navButtons.length>=5 && result.navButtons.every(x=>
      x.width>=42&&x.height>=44&&x.left>=-3&&x.right<=width+3),
      'Compact Android primary navigation too small or clipped: '+JSON.stringify(result));
    requireOk(result.sectionCardAnimations.every(x=>x==='none'),
      'Reduced-motion Android still animates primary cards: '+JSON.stringify(result));
    const file=output+'/'+id+'-'+width+'-reduced.png';
    await page.screenshot({path:file});
    audit.push(result);
  }
  for(const width of [360,320]){
    await route('dashboard',width);
    await route('missions',width);
    await route('story',width);
  }
  await route('settings',360);
  await route('settings',320);
  await page.setViewportSize({width:360,height:915});
  await page.locator('#tab-settings .v30171-settings-nav [data-v30171-setting="about"]').click();
  await page.waitForFunction(()=>document.querySelector(
    '#tab-settings [data-v30171-pane="about"].active [data-mlv-about-core]')
    ?.getClientRects().length>0,null,{timeout:10000});
  const about=await page.evaluate(()=>{
    const core=document.querySelector('[data-v30171-pane="about"] [data-mlv-about-core]');
    const links=[...core.querySelectorAll('.mlvdev-social')];
    return {links:links.length,visibility:links.every(x=>{
      const r=x.getBoundingClientRect();
      return r.height>=44&&r.width>100&&r.left>=-3&&r.right<=innerWidth+3;
    }),overflow:document.documentElement.scrollWidth-innerWidth};
  });
  requireOk(about.links===5&&about.visibility&&about.overflow<=3,
    'Compact About network links not accessible: '+JSON.stringify(about));
  // Send an actual Chromium touchscreen input sequence (one contact, not
  // JS scrollTo or a synthetic DOM TouchEvent). This catches touchmove
  // preventDefault/scroll-chain regressions in the Android WebView layout.
  // It is browser input evidence, NOT a physical Galaxy/Android IME test.
  const touch=await context.newCDPSession(page);
  const touchResults=[];
  for(const width of [360,320]){
    await page.setViewportSize({width,height:915});
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(100);
    const initial=await page.evaluate(()=>{
      const e=document.scrollingElement;
      return {height:e.scrollHeight,viewport:e.clientHeight,top:e.scrollTop};
    });
    requireOk(initial.height>initial.viewport+80,
      'Android Settings has no reachable document scroll at '+width+': '+JSON.stringify(initial));
    const x=Math.round(width*0.55);
    await touch.send('Input.dispatchTouchEvent',{
      type:'touchStart',touchPoints:[{x,y:690}]
    });
    for(let y=665;y>=270;y-=25){
      await touch.send('Input.dispatchTouchEvent',{
        type:'touchMove',touchPoints:[{x,y}]
      });
      await page.waitForTimeout(12);
    }
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(220);
    const after=await page.evaluate(()=>document.scrollingElement.scrollTop);
    requireOk(after>initial.top+45,
      'One-finger Settings swipe was blocked at '+width+'px: '+JSON.stringify({initial,after}));
    const screenshot=output+'/settings-'+width+'-after-real-touch-swipe.png';
    await page.screenshot({path:screenshot});
    touchResults.push({width,initial,after,screenshot});
  }
  await touch.detach();
  await page.evaluate(()=>window.scrollTo({top:document.scrollingElement.scrollHeight,behavior:'instant'}));
  await page.waitForTimeout(90);
  const scrollEnd=await page.evaluate(()=>document.scrollingElement.scrollTop);
  requireOk(scrollEnd>80,
    'Android Settings traps content in a non-scrollable document: '+scrollEnd);
  console.log('ANDROID_COMPACT_ACCESSIBILITY_PASS '+JSON.stringify({
    reducedMotion:true,audits:audit,about,touchResults,scrollEnd}));
}finally{
  await browser.close();
}
