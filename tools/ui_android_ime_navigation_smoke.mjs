import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const output='artifacts/android-ui-smoke/ime-navigation';
const assert=(ok,message)=>{if(!ok)throw Error(message)};
const browser=await chromium.launch({headless:true});
try{
  await mkdir(output,{recursive:true});
  for(const width of [360,412]){
    const context=await browser.newContext({
      viewport:{width,height:915},screen:{width,height:915},
      deviceScaleFactor:2.625,isMobile:true,hasTouch:true
    });
    const page=await context.newPage();
    await page.addInitScript(()=>{
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
        version:2,activeTab:'dashboard',xp:0,coins:0,totalCoinsEarned:0,
        settings:{characterName:'Michel',onboardingRequired:false,
          onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
        missions:[],history:[],achievements:[],goals:[],affirmations:[],
        owned:[],equipped:{}
      }));
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
      window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
      window.MichelsLifeAndroid={postMessage(){}};
    });
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement.dataset.mlvPlatform==='android' &&
      !!window.__mlvAndroidFastRoute && !!document.getElementById('mlv-android-bottom-nav'),
      null,{timeout:60000});
    assert(await page.evaluate(()=>window.__mlvAndroidFastRoute('journal'))!==false,
      'Cannot open canonical Android Journal');
    const editor=page.locator('#mlv184JournalBody');
    await editor.waitFor({state:'visible',timeout:12000});
    await page.evaluate(()=>document.activeElement?.blur());
    await page.waitForTimeout(50);
    const nav=page.locator('#mlv-android-bottom-nav');
    const before=await nav.evaluate(el=>getComputedStyle(el).display);
    assert(before!=='none','Bottom navigation is missing before typing at '+width);

    // This is a browser viewport simulation, not a physical Samsung IME test.
    await page.setViewportSize({width,height:620});
    await editor.focus();
    await page.waitForFunction(()=>document.body.classList.contains('mlv-android-keyboard-editing'));
    await editor.scrollIntoViewIfNeeded();
    await editor.fill('Android viewport and text input smoke '+width);
    const during=await page.evaluate(()=>{
      const input=document.getElementById('mlv184JournalBody');
      const nav=document.getElementById('mlv-android-bottom-nav');
      const r=input.getBoundingClientRect();
      return {nav:getComputedStyle(nav).display,focused:document.activeElement===input,
        font:parseFloat(getComputedStyle(input).fontSize),left:r.left,right:r.right,
        top:r.top,bottom:r.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight,
        horizontalOverflow:document.documentElement.scrollWidth-innerWidth};
    });
    assert(during.nav==='none'&&during.focused&&during.font>=16 &&
      during.left>=-3&&during.right<=width+3&&during.horizontalOverflow<=3 &&
      during.top<during.viewportHeight-90 && during.bottom>100,
      'Focused Journal editor is obstructed or clipped: '+JSON.stringify(during));
    await page.screenshot({path:output+'/journal-'+width+'-focused-short-viewport.png'});

    await page.evaluate(()=>document.activeElement?.blur());
    await page.waitForFunction(()=>!document.body.classList.contains('mlv-android-keyboard-editing'));
    const after=await nav.evaluate(el=>getComputedStyle(el).display);
    assert(after!=='none','Bottom navigation did not return after blur at '+width);
    await page.screenshot({path:output+'/journal-'+width+'-restored.png'});
    console.log('ANDROID_IME_NAV_PASS '+JSON.stringify({width,before,during,after}));
    await context.close();
  }
}finally{await browser.close();}
