import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// The real canonical frontend runs in Android-touch Chromium. Provider/device
// names and credentials below are synthetic; no live Supabase/Drive calls.
const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({
    viewport:{width:412,height:915},screen:{width:412,height:915},
    deviceScaleFactor:2.625,isMobile:true,hasTouch:true
  });
  await context.addInitScript(()=>{
    window.__MICHELSLIFE_PLATFORM__='android';
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','en');
    localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
    localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
      version:2,activeTab:'dashboard',xp:33,coins:0,totalCoinsEarned:0,
      settings:{characterName:'Synthetic',onboardingRequired:false,
        onboardingCompletedAt:'2026-10-01T12:00:00.000Z',v30200GenericProfile:true},
      missions:[],goals:[],history:[],achievements:[],affirmations:[],owned:[],equipped:{}
    }));
  });
  const page=await context.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.MLVCloudSharedStorageV30216?.restore,
    null,{timeout:60000});
  const result=await page.evaluate(()=>{
    const storage=localStorage,shared=window.MLVCloudSharedStorageV30216;
    const BOARD='vida_rpg_personal_progress_v2';
    const JOURNAL='michelsLife.journal.v30184';
    const THEME='michelsLifeTheme.v3000';
    const AUTH='michelsLife.supabase.session.v30216';
    const DEVICE='michelsLife.supabase.device.v30216';
    const read=()=>[BOARD,JOURNAL,THEME,AUTH,DEVICE].map(k=>storage.getItem(k));
    storage.setItem(JOURNAL,'synthetic journal A');
    storage.setItem(THEME,'old theme');
    storage.setItem(AUTH,'synthetic owner-A session');
    storage.setItem(DEVICE,'synthetic device-A');
    const before=read();
    shared.restore({[THEME]:'new-theme',[AUTH]:'synthetic owner-B token',
      [DEVICE]:'synthetic device-B'});
    const partial=read();
    const setter=Storage.prototype.setItem;
    let failed=false,error='';
    try{
      Storage.prototype.setItem=function(k,v){
        if(!failed&&String(k)===JOURNAL){
          failed=true;throw Error('SYNTHETIC_QUOTA');
        }
        return setter.call(this,k,v);
      };
      const prior=read();
      try{shared.restore({[THEME]:'third-theme',[JOURNAL]:'new journal'})}
      catch(e){error=String(e.message||e)}
      return {before,partial,prior,after:read(),failed,error,
        boardXp:JSON.parse(storage.getItem(BOARD)).xp,
        allowedAuth:shared.allowed(AUTH)};
    }finally{
      Storage.prototype.setItem=setter;
    }
  });
  assert.equal(result.partial[0],result.before[0],'Partial legacy import altered canonical board');
  assert.equal(result.partial[1],result.before[1],'Partial legacy import erased Journal');
  assert.equal(result.partial[2],'new-theme','Theme was not imported');
  assert.equal(result.partial[3],result.before[3],'Restore changed session token');
  assert.equal(result.partial[4],result.before[4],'Restore changed device identity');
  assert.equal(result.failed,true,'Synthetic storage failure did not run');
  assert.match(result.error,/previous local progress was restored/);
  assert.deepEqual(result.after,result.prior,'Failed restore left a partially changed board');
  assert.equal(result.boardXp,33,'Restore modified unrelated XP');
  assert.equal(result.allowedAuth,false,'Provider credential became shareable');
  console.log('PASS real Android browser: partial legacy import + failed transaction rollback + account/device isolation');
}finally{
  await browser.close();
}
