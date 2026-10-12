import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const out='artifacts/android-ui-smoke/quick-capture-keyboard';
const ok=(truth,detail)=>{if(!truth)throw Error(detail)};
const browser=await chromium.launch({headless:true});
try{
  await mkdir(out,{recursive:true});
  for(const width of [360,412]){
    const context=await browser.newContext({
      viewport:{width,height:915},screen:{width,height:915},
      isMobile:true,hasTouch:true,deviceScaleFactor:2.625
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
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('michelsLife.language.installDefault.v1','en');
      window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
      window.MichelsLifeAndroid={postMessage(){}};
    });
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement.dataset.mlvPlatform==='android' &&
      !!window.__mlvAndroidFastRoute && !!document.getElementById('mlv-android-capture-button'),
      null,{timeout:60000});
    ok(await page.evaluate(()=>window.__mlvAndroidFastRoute('missions'))!==false,
      'Could not open canonical Missions before Quick Capture');
    await page.locator('#mlv-android-capture-button').click();
    const sheet=page.locator('[data-mlv216-qc]:not([hidden])');
    await sheet.waitFor({state:'visible',timeout:9000});
    await sheet.locator('[data-mlv216-qc-type]').selectOption('mission');
    await page.setViewportSize({width,height:620});
    const input=sheet.locator('[data-mlv216-qc-input]');
    const missionName='Keyboard-safe Android capture QA '+width;
    await input.focus();
    await input.fill(missionName);
    const probe=await sheet.evaluate(root=>{
      const box=el=>{const r=el?.getBoundingClientRect();return r?{
        left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        width:r.width,height:r.height}:null};
      const card=root.querySelector('.mlv216-qc-card');
      const field=root.querySelector('[data-mlv216-qc-input]');
      const save=root.querySelector('[data-mlv216-qc-save]');
      return {card:box(card),input:box(field),save:box(save),
        fontSize:parseFloat(getComputedStyle(field).fontSize),
        focus:document.activeElement===field,viewportWidth:innerWidth,
        viewportHeight:innerHeight};
    });
    ok(probe.focus&&probe.fontSize>=16&&probe.input?.height>=48 &&
      probe.card?.left>=-3&&probe.card?.right<=width+3&&
      probe.card?.top>=-3&&probe.card?.bottom<=623 &&
      probe.save?.height>=44&&probe.save?.top>=0&&probe.save?.bottom<=623,
      'Quick Capture is obscured or clipped by short keyboard viewport: '+JSON.stringify({width,probe}));
    await page.screenshot({path:out+'/capture-'+width+'-620-focused.png'});
    await sheet.locator('[data-mlv216-qc-save]').click();
    await page.waitForFunction(name=>JSON.parse(
      localStorage.getItem('vida_rpg_personal_progress_v2')||'{}')
      .missions?.some(m=>m.name===name),missionName,{timeout:9000});
    ok(await page.locator('[data-mlv216-qc]:not([hidden])').count()===0,
      'Quick Capture did not close after canonical save at '+width);
    await page.screenshot({path:out+'/capture-'+width+'-saved.png'});
    console.log('ANDROID_CAPTURE_KEYBOARD_PASS '+JSON.stringify({width,probe,saved:true}));
    await context.close();
  }
}finally{
  await browser.close();
}
