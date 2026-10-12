import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const output='artifacts/android-ui-smoke/sections';
const browser=await chromium.launch({headless:true});
function assert(ok,reason){if(!ok)throw new Error(reason)}

try{
  const context=await browser.newContext({
    viewport:{width:412,height:915},screen:{width:412,height:915},
    isMobile:true,hasTouch:true,deviceScaleFactor:2.625,reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{
    try{
      const old={
        version:2,
        settings:{characterName:'Michel',onboardingRequired:false,onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
        activeTab:'dashboard',xp:0,coins:0,totalCoinsEarned:0,
        missions:[
          {id:'mobile-daily',name:'Design smoke daily',canonical:'design smoke daily',
           description:'',category:'academic',type:'daily',difficulty:'medium',xp:25,
           coins:0,priority:'medium',days:[1,2,3,4,5],archived:false,hidden:false,
           createdAt:'2026-01-01T12:00:00.000Z',completions:[]},
          {id:'mobile-weekly',name:'Design smoke weekly',canonical:'design smoke weekly',
           description:'',category:'physical',type:'weekly',difficulty:'medium',xp:25,
           coins:0,priority:'medium',days:[1,3,5],archived:false,hidden:false,
           createdAt:'2026-01-01T12:00:00.000Z',completions:[]}
        ],
        history:[],achievements:[],goals:[],affirmations:[],owned:[],equipped:{}
      };
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(old));
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('michelsLife.language.installDefault.v1','en');
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement.dataset.mlvPlatform==='android' &&
    !!document.querySelector('#mlv-android-topbar') &&
    !!window.__mlvAndroidFastRoute &&
    !!window.MichelsLifeAndroidSections &&
    !!document.getElementById('mlv-android-section-layout'),null,{timeout:60000});
  await mkdir(output,{recursive:true});

  const screenshots=[];
  async function route(id,width=412){
    await page.setViewportSize({width,height:915});
    const done=await page.evaluate(id=>window.__mlvAndroidFastRoute(id),id);
    assert(done!==false,'Android navigation failed for '+id);
    await page.waitForFunction(id=>{
      const tab=document.getElementById('tab-'+id);
      return tab && tab.classList.contains('active') && tab.getBoundingClientRect().width>0;
    },id,{timeout:12000});
    // The screenshot represents a settled page; animation is probed separately.
    await page.waitForTimeout(280);
    const state=await page.evaluate(id=>{
      const tab=document.getElementById('tab-'+id);
      const vw=innerWidth,active=document.getElementById('main');
      const bb=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height}};
      const card=[...tab.querySelectorAll('.card, .v216-contract-card, .v156-ach-card, .v133-ach')]
        .filter(e=>e.getClientRects().length && getComputedStyle(e).display!=='none').slice(0,30);
      const escaped=card.filter(e=>{
        const r=e.getBoundingClientRect();
        return r.width>0 && (r.left< -3 || r.right>vw+3);
      }).map(e=>({cls:String(e.className).slice(0,80),...bb(e)}));
      const section=getComputedStyle(tab);
      const settingsButtons=[...tab.querySelectorAll('.v30171-settings-nav [data-v30171-setting]')]
        .filter(e=>e.getClientRects().length).slice(0,6).map(e=>bb(e).height);
      const contractBtns=[...tab.querySelectorAll('.v216-filter-chip')]
        .filter(e=>e.getClientRects().length).slice(0,6).map(e=>bb(e).height);
      return {
        id,viewport:vw,documentWidth:document.documentElement.scrollWidth,
        main:bb(active),tab:bb(tab),cardCount:card.length,escaped,
        display:section.display,settingsButtons,contractBtns,
        contractGrid:getComputedStyle(tab.querySelector('.v216-contract-grid')||tab).gridTemplateColumns,
        achievementGrid:getComputedStyle(tab.querySelector('.v156-ach-grid, .v133-ach-grid')||tab).gridTemplateColumns,
      };
    },id);
    assert(state.documentWidth<=width+3,'Android '+id+' causes horizontal document overflow: '+JSON.stringify(state));
    assert(state.tab.width<=width+3 && state.tab.left>=-3,'Android '+id+' tab geometry escapes viewport: '+JSON.stringify(state));
    assert(!state.escaped.length,'Android '+id+' clips cards: '+JSON.stringify(state));
    assert(state.settingsButtons.every(x=>x>=43.5),'Android Settings touch targets too small: '+JSON.stringify(state));
    assert(state.contractBtns.every(x=>x>=43.5),'Android Contracts category targets too small: '+JSON.stringify(state));
    const filename=output+'/'+id+'-'+width+'.png';
    await page.screenshot({path:filename});
    screenshots.push(filename);
    return state;
  }

  // Verify actual computed layout across sections, not just stylesheet text.
  const audit=[];
  for(const id of ['dashboard','contracts','stats','achievements','affirmations','settings']){
    audit.push(await route(id));
  }
  for(const id of ['contracts','stats','settings']){
    audit.push(await route(id,360));
  }
  // Story has a separate legacy-compatible router. When present, confirm it
  // can be reached without invoking desktop-only transitions or clipping.
  const storyAvailable=await page.evaluate(()=>
    !!document.querySelector('#v30171PrimaryNav [data-tab="story"]'));
  if(storyAvailable){
    audit.push(await route('story'));
  }

  // A real visual animation needs different computed positions at two
  // moments; CSS declaring an animation is not sufficient.
  await page.setViewportSize({width:412,height:915});
  await page.evaluate(()=>window.__mlvAndroidFastRoute('stats'));
  await page.waitForTimeout(280);
  await page.evaluate(()=>window.__mlvAndroidFastRoute('achievements'));
  const motion=await page.evaluate(async()=>{
    const card=document.querySelector('#tab-achievements.active > .card');
    if(!card)return null;
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const first={translate:getComputedStyle(card).translate,opacity:getComputedStyle(card).opacity};
    await new Promise(resolve=>setTimeout(resolve,95));
    const second={translate:getComputedStyle(card).translate,opacity:getComputedStyle(card).opacity};
    return {name:getComputedStyle(card).animationName,first,second};
  });
  assert(motion && motion.name==='mlvAndroidSectionEnter',
    'Android section transition is not applied to a real active card: '+JSON.stringify(motion));
  assert(motion.first.translate!==motion.second.translate ||
    motion.first.opacity!==motion.second.opacity,
    'Android entrance animation did not change computed visual state across frames: '+JSON.stringify(motion));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>window.__mlvAndroidFastRoute('stats'));
  const reduced=await page.evaluate(()=>getComputedStyle(
    document.querySelector('#tab-stats.active > .card')).animationName);
  assert(reduced==='none','Android ignores reduced-motion accessibility preference: '+reduced);
  await page.emulateMedia({reducedMotion:'no-preference'});
  console.log(JSON.stringify({ok:true,audit,motion,reduced,screenshots},null,2));
  await context.close();
}finally{
  await browser.close();
}
