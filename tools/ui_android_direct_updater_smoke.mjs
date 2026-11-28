import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

// Convergence of historical #166: actual current Settings DOM, real touch,
// synthetic native replies only. Never request or install a real APK.
const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const browser=await chromium.launch({headless:true});
const official='https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.235-android-v0.2.24';
const out='artifacts/android-ui-smoke/direct-updater';
try{
  await mkdir(out,{recursive:true});
  for(const [width,language] of [[412,'en'],[360,'es']]){
    const context=await browser.newContext({viewport:{width,height:915},screen:{width,height:915},
      isMobile:true,hasTouch:true,deviceScaleFactor:2.625});
    try{
      await context.addInitScript(lang=>{
        localStorage.setItem('michelsLife.onboarding.v30200','done');
        localStorage.setItem('michelsLife.language.v1',lang);
        localStorage.setItem('michelsLife.language.userOverrideBase.v1',lang);
        localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
          version:2,activeTab:'dashboard',xp:77,coins:10,totalCoinsEarned:10,
          settings:{characterName:'QA',onboardingRequired:false,
            onboardingCompletedAt:'2026-10-01T12:00:00.000Z',v30200GenericProfile:true},
          missions:[],goals:[],history:[],owned:[],equipped:{},achievements:[],affirmations:[]
        }));
        window.__MICHELSLIFE_INSTALL_LANGUAGE__=lang;
        window.__directRequests=[];
        window.MichelsLifeAndroid={postMessage(json){
          const req=typeof json==='string'?JSON.parse(json):json;
          if(String(req?.requestId||'').startsWith('android-direct-'))window.__directRequests.push(req);
        }};
      },language);
      const page=await context.newPage();
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForSelector('#mlv-android-bottom-nav [data-mobile-tab="settings"]',{timeout:60000});
      await page.locator('#mlv-android-bottom-nav [data-mobile-tab="settings"]').tap();
      await page.waitForSelector('#tab-settings.active #mlv-android-direct-updates',{state:'visible',timeout:15000});
      const panel=page.locator('#mlv-android-direct-updates');
      const check=panel.locator('#mlv-android-check-updates');
      const stage=panel.locator('#mlv-android-stage-update');
      const install=panel.locator('#mlv-android-install-update');
      const link=panel.locator('#mlv-android-update-release-link');
      const status=panel.locator('#mlv-android-update-status');
      assert.equal(await panel.count(),1);
      const request=async action=>{
        await page.waitForFunction(action=>window.__directRequests.some(x=>x.action===action),action,{timeout:10000});
        return page.evaluate(action=>window.__directRequests.filter(x=>x.action===action).at(-1),action);
      };
      const reply=(req,payload)=>page.evaluate(({req,payload})=>window.__mlvAndroidReceive(JSON.stringify({
        channel:'michels-life-google-calendar-response',requestId:req.requestId,ok:true,payload
      })),{req,payload});
      await reply(await request('updateReady'),{ready:false,hasCached:false});
      assert.equal(await link.isHidden(),true);
      assert.equal(await install.isHidden(),true);
      const snapshot=()=>page.evaluate(()=>{
        const x=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
        return {xp:x.xp,coins:x.coins,missions:(x.missions||[]).map(m=>m.id),goals:(x.goals||[]).map(g=>g.id)};
      });
      const before=await snapshot();
      await check.tap();
      const first=await request('updateStatus');
      assert.equal(await check.isDisabled(),true);
      const valid={checked:true,updateAvailable:true,channel:'android-direct',latestAndroidVersion:'0.2.24',releaseUrl:official};
      await reply({...first,requestId:first.requestId+'-wrong'},valid);
      assert.equal(await check.isDisabled(),true);
      await reply(first,valid);
      await stage.waitFor({state:'visible',timeout:10000});
      assert.equal(await link.getAttribute('href'),official);
      assert.equal(await install.isHidden(),true);
      assert.match(await status.textContent(),language==='es'?/Hay una actualización oficial/:/official Android Direct update is available/);
      const geometry=await check.evaluate(el=>({height:el.getBoundingClientRect().height,
        panel:el.closest('#mlv-android-direct-updates').getBoundingClientRect().width,viewport:innerWidth}));
      assert.ok(geometry.height>=44&&geometry.panel<=geometry.viewport+2,JSON.stringify(geometry));
      await panel.screenshot({path:out+'/'+language+'-'+width+'.png'});
      await check.tap();
      const second=await request('updateStatus');
      assert.notEqual(second.requestId,first.requestId);
      await reply(second,{...valid,latestAndroidVersion:'0.2.25'});
      await page.waitForFunction(()=>!document.querySelector('#mlv-android-check-updates')?.disabled);
      assert.equal(await stage.isHidden(),true);
      assert.equal(await link.isHidden(),true);
      assert.match(await status.textContent(),language==='es'?/no coincide/:/does not match/);
      assert.deepEqual(await snapshot(),before);
      assert.equal(await page.evaluate(()=>window.__directRequests.filter(x=>x.action==='updateStatus').length),2);
      assert.equal(await page.evaluate(()=>window.__directRequests.some(x=>['updateStage','updateInstall','updatePermissionSettings'].includes(x.action))),false);
      console.log('PASS current Android browser updater '+language+' '+width+'px: paired tag, touch, stale and mismatched replies, no XP drift');
    }finally{await context.close();}
  }
}finally{await browser.close();}
