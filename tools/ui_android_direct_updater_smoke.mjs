import {chromium} from 'playwright';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const browser=await chromium.launch({headless:true});
function check(value,message){if(!value)throw Error(message);}

try{
  const context=await browser.newContext({
    viewport:{width:412,height:915},isMobile:true,hasTouch:true,deviceScaleFactor:2.625
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{
    window.__directCheckCalls=[];
    window.MichelsLifeAndroid={
      postMessage(json){
        const req=JSON.parse(json);
        if(req.action==='updateStatus')window.__directCheckCalls.push(req);
      }
    };
    try{
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
        version:2,settings:{characterName:'Michel',onboardingRequired:false,
          onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
        xp:77,coins:10,totalCoinsEarned:10,activeTab:'dashboard',
        missions:[],history:[],goals:[],owned:[],equipped:{},achievements:[],affirmations:[]
      }));
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.__mlvAndroidFastRoute&&
    document.documentElement.dataset.mlvPlatform==='android',null,{timeout:60000});
  check(await page.evaluate(()=>window.__mlvAndroidFastRoute('settings'))!==false,
    'Could not navigate to canonical Settings');
  await page.waitForFunction(()=>!!document.querySelector(
    '#tab-settings [data-v30171-pane="about"]'),null,{timeout:15000});
  await page.evaluate(()=>{
    if(typeof window.LeftNavV30171?.activateSetting==='function')
      window.LeftNavV30171.activateSetting('about');
  });
  await page.waitForSelector('#mlv-android-check-updates',{timeout:8000});
  check(await page.locator('#mlv-android-direct-updater').count()===1,
    'Android must add exactly one updater to canonical About');
  check(await page.locator('#mlv-android-update-official-link').isHidden(),
    'Unchecked state must never show a link');
  const initial=await page.evaluate(()=>JSON.parse(
    localStorage.getItem('vida_rpg_personal_progress_v2')||'{}'));
  await page.locator('#mlv-android-check-updates').click();
  await page.waitForFunction(()=>window.__directCheckCalls.length===1);
  const req=await page.evaluate(()=>window.__directCheckCalls[0]);
  check(req.channel==='michels-life-google-calendar'&&req.action==='updateStatus'&&
    typeof req.requestId==='string'&&req.requestId.startsWith('mlv-direct-updates-'),
    'Native release query bridge contract mismatch');
  check(await page.locator('#mlv-android-check-updates').isDisabled(),
    'Duplicate queries must be prevented while checking');

  // A response for a different request must not alter the pending state.
  await page.evaluate(req=>window.__mlvAndroidReceive(JSON.stringify({
    channel:'michels-life-google-calendar-response',
    requestId:req.requestId+'-wrong',ok:true,
    payload:{status:'up_to_date',updateCheckPerformed:true}
  })),req);
  check(await page.locator('#mlv-android-check-updates').isDisabled(),
    'Stale/wrong native response must be ignored');

  const official='https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.222';
  await page.evaluate(({req,official})=>window.__mlvAndroidReceive(JSON.stringify({
    channel:'michels-life-google-calendar-response',requestId:req.requestId,ok:true,
    payload:{status:'update_available',updateCheckPerformed:true,updateAvailable:true,
      channel:'direct',version:'0.2.9',latestVersion:'0.2.10',releasePageUrl:official}
  })),{req,official});
  await page.waitForFunction(()=>!document.querySelector('#mlv-android-check-updates')?.disabled);
  check((await page.locator('#mlv-android-update-result').textContent()).includes('0.2.10'),
    'Real update must show correct Android version');
  check(await page.locator('#mlv-android-update-official-link').getAttribute('href')===official,
    'Only exact official release link should render');
  const tab=await page.locator('#mlv-android-update-official-link').getAttribute('target');
  check(tab==='_self','Official link must use MainActivity external URL handler (popups disabled)');

  // A second query must create a distinct request and reject an off-site link.
  await page.locator('#mlv-android-check-updates').click();
  await page.waitForFunction(()=>window.__directCheckCalls.length===2);
  const req2=await page.evaluate(()=>window.__directCheckCalls[1]);
  check(req2.requestId!==req.requestId,'Repeated checks must use unique request IDs');
  await page.evaluate(req=>window.__mlvAndroidReceive(JSON.stringify({
    channel:'michels-life-google-calendar-response',requestId:req.requestId,ok:true,
    payload:{status:'update_available',updateCheckPerformed:true,channel:'direct',
      version:'0.2.9',latestVersion:'0.2.10',
      releasePageUrl:'https://malicious.example.invalid/update'}
  })),req2);
  await page.waitForFunction(()=>!document.querySelector('#mlv-android-check-updates')?.disabled);
  check(await page.locator('#mlv-android-update-official-link').isHidden(),
    'Untrusted update link must never be clickable');

  // Unknown signer must be surfaced as a warning, never latest/up-to-date.
  await page.locator('#mlv-android-check-updates').click();
  await page.waitForFunction(()=>window.__directCheckCalls.length===3);
  const req3=await page.evaluate(()=>window.__directCheckCalls[2]);
  await page.evaluate(req=>window.__mlvAndroidReceive(JSON.stringify({
    channel:'michels-life-google-calendar-response',requestId:req.requestId,ok:true,
    payload:{status:'unchecked',updateCheckPerformed:false,channel:'untrusted',
      version:'0.2.9',updateAvailable:null}
  })),req3);
  await page.waitForFunction(()=>!document.querySelector('#mlv-android-check-updates')?.disabled);
  check(/not signed/i.test(await page.locator('#mlv-android-update-result').textContent()),
    'An untrusted installed APK must not be labelled as current');
  check(await page.locator('#mlv-android-update-official-link').isHidden(),
    'Untrusted installed APK must not receive an official update link');
  const state=await page.evaluate(()=>JSON.parse(
    localStorage.getItem('vida_rpg_personal_progress_v2')||'{}'));
  check(state.xp===initial.xp&&state.coins===initial.coins,
    'Checking releases must not change canonical XP or coins');
  await context.close();
  console.log('PASS: real Android About updater query, async bridge, pending guard, stale reply rejection, trusted link and untrusted signature, no XP drift');
} finally {
  await browser.close();
}
