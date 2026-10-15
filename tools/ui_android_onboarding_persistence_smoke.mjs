import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const output='artifacts/android-ui-smoke/onboarding-persistence';
const check=(value,reason)=>{if(!value)throw new Error(reason);};
const browser=await chromium.launch({headless:true});

try {
  const context=await browser.newContext({
    viewport:{width:412,height:915},screen:{width:412,height:915},
    deviceScaleFactor:2.625,isMobile:true,hasTouch:true
  });
  const page=await context.newPage();
  // Deliberately do NOT seed or clear localStorage in an init script:
  // that would reset state on reload and make this regression test meaningless.
  await page.addInitScript(()=>{
    localStorage.setItem('michelsLife.language.v1','en');
    localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#mlv200Onboarding',{state:'visible',timeout:60000});
  await mkdir(output,{recursive:true});

  // Drive the actual canonical first-run wizard, including its final options.
  // Do not infer success from an arbitrary screen-coordinate tap.
  for(let step=0;step<4;step++){
    const finish=page.locator('#mlv200Onboarding [data-mlv200-onboard="finish"]');
    if(await finish.isVisible().catch(()=>false))break;
    const next=page.locator('#mlv200Onboarding [data-mlv200-onboard="next"]');
    check(await next.isVisible(),'First-run wizard has no visible Continue/Finish action at step '+step);
    await next.click();
  }
  const choices=await page.evaluate(()=>[...document.querySelectorAll('#mlv200Onboarding input[type="checkbox"]')]
    .map(input=>({label:String(input.closest('label')?.textContent||
      input.parentElement?.textContent||'').trim().replace(/\s+/g,' ').slice(0,100),
      checked:input.checked})));
  // Respect the exact reproduced case where Premium starter creation is disabled.
  const premium=choices.find(choice=>/create premium contracts/i.test(choice.label));
  check(!premium||!premium.checked,
    'Premium starter creation must remain unchecked in this persistence fixture: '+JSON.stringify(choices));
  await page.screenshot({path:output+'/before-finish.png'});
  const finish=page.locator('#mlv200Onboarding [data-mlv200-onboard="finish"]');
  check(await finish.isVisible(),'First-run wizard never reached Finish');
  await finish.click();
  await page.waitForFunction(()=>
    !document.querySelector('#mlv200Onboarding') &&
    localStorage.getItem('michelsLife.onboarding.v30200')==='done',null,{timeout:15000});
  await page.waitForTimeout(20000);

  async function readSnapshot(){
    return page.evaluate(()=>{
      const raw=localStorage.getItem('vida_rpg_personal_progress_v2');
      const saved=JSON.parse(raw||'null');
      if(!saved||!Array.isArray(saved.missions))throw Error('Missing canonical saved mission list');
      const arrays={};
      // Record actual persisted objects without leaking personal content.
      for(const [key,value] of Object.entries(saved)){
        if(!Array.isArray(value)||!/mission|contract|premium|goal/i.test(key))continue;
        arrays[key]=value.map((item,index)=>String(item?.id??item?.contractId??'index:'+index)).sort();
      }
      const kpis=[...document.querySelectorAll('#tab-dashboard .v131-kpi')]
        .map(el=>String(el.textContent||'').replace(/\s+/g,' ').trim())
        .filter(t=>/mission|contract/i.test(t));
      return {
        onboardingComplete:localStorage.getItem('michelsLife.onboarding.v30200')==='done',
        arrays,kpis,
        missionCount:saved.missions.length,
        missionIds:saved.missions.map(m=>String(m.id)).sort(),
        activeTab:saved.activeTab||''
      };
    });
  }
  const before=await readSnapshot();
  check(before.onboardingComplete,'Onboarding completion flag lost after Finish');
  check(before.missionCount>0,
    'Starter missions were not saved after selecting the default starter setup: '+JSON.stringify({choices,before}));
  check(new Set(before.missionIds).size===before.missionIds.length,
    'Duplicate mission IDs immediately after onboarding: '+JSON.stringify(before.missionIds));
  await page.screenshot({path:output+'/before-relaunch.png'});

  // Same browser origin and storage, actual new document/bootstrap, NO fresh
  // fixture injection. This is a browser WebView-model test; native force-stop
  // and physical Samsung still require the separate installed-APK gate.
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>
    document.documentElement.dataset.mlvPlatform==='android' &&
    !!document.querySelector('#tab-dashboard'),null,{timeout:60000});
  await page.waitForTimeout(20000);
  const after=await readSnapshot();
  await page.screenshot({path:output+'/after-relaunch.png'});
  const stableIds=JSON.stringify(before.missionIds)===JSON.stringify(after.missionIds);
  const stableCollections=JSON.stringify(before.arrays)===JSON.stringify(after.arrays);
  const stableKpis=JSON.stringify(before.kpis)===JSON.stringify(after.kpis);
  console.log('ANDROID_ONBOARDING_RELAUNCH_STATE',JSON.stringify({
    choices,before,after,stableIds,stableCollections,stableKpis
  },null,2));
  check(after.onboardingComplete,'Onboarding unexpectedly reappears after reload');
  check(stableIds,'Persisted mission identities changed just by reloading Android WebView');
  check(stableCollections,'Persisted mission/contract identities changed just by reloading Android WebView');
  check(stableKpis,'Dashboard mission/contract totals drift across Android reload');
  check(new Set(after.missionIds).size===after.missionIds.length,
    'Duplicate mission IDs created on Android reload');

  // A second independent bootstrap catches delayed legacy seeding/migration
  // that only starts after the first persistence round-trip.
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>
    document.documentElement.dataset.mlvPlatform==='android' &&
    !!document.querySelector('#tab-dashboard'),null,{timeout:60000});
  await page.waitForTimeout(20000);
  const second=await readSnapshot();
  await page.screenshot({path:output+'/after-second-relaunch.png'});
  console.log('ANDROID_ONBOARDING_SECOND_RELAUNCH_STATE',JSON.stringify(second,null,2));
  check(second.onboardingComplete,'Onboarding reappeared after second reload');
  check(JSON.stringify(before.missionIds)===JSON.stringify(second.missionIds),
    'Mission IDs drifted on second Android reload');
  check(JSON.stringify(before.arrays)===JSON.stringify(second.arrays),
    'Mission/contract collections drifted on second Android reload');
  check(JSON.stringify(before.kpis)===JSON.stringify(second.kpis),
    'Dashboard mission/contract KPIs drifted on second Android reload');
  check(new Set(second.missionIds).size===second.missionIds.length,
    'Duplicate mission IDs created on second Android reload');
  await context.close();
}finally{
  await browser.close();
}
