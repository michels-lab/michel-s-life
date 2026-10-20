import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const base=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const out='artifacts/granada-data-health';
const key='vida_rpg_personal_progress_v2';
const browser=await chromium.launch({headless:true});
const seed={
  version:2,activeTab:'dashboard',xp:90,coins:0,totalCoinsEarned:0,
  settings:{characterName:'Granada Synthetic',onboardingRequired:false,
    onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
  missions:[{id:'test-mission-private-id',name:'CONFIDENTIAL MISSION TITLE',
    canonical:'confidential mission title',category:'academic',type:'daily',
    difficulty:'medium',xp:30,coins:0,days:[1,2,3,4,5],
    createdAt:'2026-01-01T12:00:00.000Z',completions:[]}],
  projects:[],goals:[],history:[],achievements:[],affirmations:[],owned:[],equipped:{}
};
try{
  await mkdir(out,{recursive:true});
  for(const width of [360,412]){
    const context=await browser.newContext({
      viewport:{width,height:915},screen:{width,height:915},
      isMobile:true,hasTouch:true,deviceScaleFactor:2.625
    });
    await context.addInitScript(payload=>{
      if(!localStorage.getItem('vida_rpg_personal_progress_v2'))
        localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(payload));
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('michelsLife.language.installDefault.v1','en');
      window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
      window.MichelsLifeAndroid={postMessage(){}};
    },seed);
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>
      !!window.MLVGranadaDataHealth &&
      !!document.getElementById('mlv-android-bottom-nav')&&
      document.documentElement.dataset.mlvPlatform==='android',
      null,{timeout:60000});
    const baseline=await page.evaluate(k=>localStorage.getItem(k),key);
    await page.locator('#mlv-android-bottom-nav [data-mobile-tab="settings"]').tap();
    await page.waitForSelector('#tab-settings.active',{state:'visible',timeout:12000});
    const dataButton=page.locator('#tab-settings [data-v30171-setting="data"]');
    await dataButton.tap();
    await page.waitForSelector('#tab-settings [data-v30171-pane="data"].active',
      {state:'visible',timeout:12000});
    const card=page.locator('#mlvGranadaDataHealth');
    await card.waitFor({state:'visible',timeout:10000});
    // The canonical Settings organizer reruns at +0/90/260/760ms after
    // selecting Data. If the card lacks the owner marker, it moves to General.
    await page.waitForTimeout(900);
    assert(await card.getAttribute('data-v30171-owner')==='data',
      'Data Health was not assigned to the canonical Settings Data section');
    assert(await card.isVisible(),
      'Data Health disappeared after Settings canonical relayout');
    await card.locator('[data-granada-health="saved"]').tap({timeout:12000});
    const status=card.locator('[data-granada-health-status]');
    await status.filter({hasText:'Data health: ok'}).waitFor({state:'visible',timeout:8000});
    const line=await card.locator('[data-granada-health-summary]').innerText();
    assert(line.includes('XP 90')&&line.includes('missions 1'),'Saved progress counts not visible at '+width);
    assert(!line.includes('CONFIDENTIAL')&&!line.includes('test-mission-private-id'),
      'Private content leaked into saved progress summary');
    const widths=await card.evaluate(el=>{
      const r=el.getBoundingClientRect();
      const buttons=[...el.querySelectorAll('button')].map(b=>{
        const x=b.getBoundingClientRect();
        return {width:x.width,height:x.height,left:x.left,right:x.right};
      });
      return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
        left:r.left,right:r.right,buttons};
    });
    assert(widths.right<=width+3 && widths.left>=-3 &&
      widths.documentWidth<=width+3 &&
      widths.buttons.every(x=>x.height>=44&&x.left>=-3&&x.right<=width+3),
      'Data panel buttons are inaccessible on '+width+': '+JSON.stringify(widths));
    await page.screenshot({path:out+'/saved-'+width+'.png',animations:'disabled'});

    const foreign={
      state:{...seed,xp:100},
      localStorage:{'michelsLife.supabase.session.v30216':'NEVER_EXPORT_TOKEN',
        'michelsLife.supabase.device.v30216':'NEVER_EXPORT_DEVICE'}
    };
    await card.locator('[data-granada-health-file]').setInputFiles({
      name:'unsafe-legacy.json',mimeType:'application/json',
      buffer:Buffer.from(JSON.stringify(foreign))
    });
    await status.filter({hasText:'Data health: invalid'}).waitFor({state:'visible',timeout:8000});
    assert((await card.innerText()).includes('device_private_storage_detected'),
      'Unsafe legacy localStorage keys were not flagged');
    assert(!(await card.innerText()).includes('NEVER_EXPORT'),
      'Credential leaked into displayed error');
    assert(!JSON.stringify(await page.evaluate(()=>window.MLVGranadaDataHealth.report()))
      .includes('NEVER_EXPORT'),'Credential leaked into export');
    await page.screenshot({path:out+'/unsafe-'+width+'.png',animations:'disabled'});

    const changed={state:{...seed,xp:120,missions:[]}};
    await card.locator('[data-granada-health-file]').setInputFiles({
      name:'different-backup.json',mimeType:'application/json',
      buffer:Buffer.from(JSON.stringify(changed))
    });
    await status.filter({hasText:'Data health: ok'}).waitFor({state:'visible',timeout:8000});
    await card.locator('[data-granada-health="compare"]').tap();
    const compareLine=await card.locator('[data-granada-health-summary]').innerText();
    assert(compareLine.includes('total_xp_changed')&&
      compareLine.includes('count_changed_missions'),'Comparison missed saved vs file difference');
    assert(!compareLine.includes('CONFIDENTIAL'),'Comparison leaked mission names');
    const exported=await page.evaluate(()=>window.MLVGranadaDataHealth.report());
    assert(exported.comparison?.status==='different'&&
      exported.noPersonalFieldsExported&&exported.cannotGuaranteeRestore,
      'Export incorrectly reports readiness or lost comparison');
    assert(await page.evaluate(k=>localStorage.getItem(k),key)===baseline,
      'Health inspector changed persistent progress');
    await page.screenshot({path:out+'/compared-'+width+'.png',animations:'disabled'});

    for(let i=0;i<2;i++){
      await page.reload({waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForFunction(()=>!!window.MLVGranadaDataHealth &&
        !!document.getElementById('mlv-android-bottom-nav'),null,{timeout:60000});
      assert(await page.evaluate(k=>localStorage.getItem(k),key)===baseline,
        'Read-only tool modified progress across WebView reload');
    }
    assert.equal(errors.length,0,'App page errors: '+errors.join('; '));
    console.log('GRANADA_DATA_HEALTH_ANDROID_PASS '+JSON.stringify({
      width,visible:true,inspect:true,unsafeRejected:true,comparison:true,
      twoReloads:true,storageUntouched:true,pageErrors:0
    }));
    await context.close();
  }
}finally{await browser.close();}
