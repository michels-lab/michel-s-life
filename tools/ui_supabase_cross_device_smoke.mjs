import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const SUPA='https://lqnkcqredlxrykynacwr.supabase.co';
const USER_ID='00000000-0000-0000-0000-000000000216';
function ok(v,m){if(!v)throw new Error(m)}

const backend={remote:null,devices:new Map(),history:[],writes:0};

function json(route,value,status=200){
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
}

async function installSupabaseMock(context){
  await context.route(SUPA+'/**',async route=>{
    const req=route.request();
    const u=new URL(req.url());
    const path=u.pathname+u.search;
    const method=req.method().toUpperCase();
    let body=null;
    try{body=req.postData()?JSON.parse(req.postData()):null}catch(_){body=null}

    if(path.startsWith('/auth/v1/token?grant_type=password')){
      return json(route,{access_token:'access_shared',refresh_token:'refresh_shared',expires_in:3600,user:{id:USER_ID,email:'cross-device@example.com'}});
    }
    if(path.startsWith('/auth/v1/token?grant_type=refresh_token')){
      return json(route,{access_token:'access_shared_2',refresh_token:'refresh_shared_2',expires_in:3600,user:{id:USER_ID,email:'cross-device@example.com'}});
    }
    if(path.startsWith('/auth/v1/logout'))return json(route,{});

    if(path.startsWith('/rest/v1/ml_state?select='))return json(route,backend.remote?[structuredClone(backend.remote)]:[]);

    if(path==='/rest/v1/ml_state'&&method==='POST'){
      if(backend.remote)return json(route,{message:'duplicate key'},409);
      backend.remote=structuredClone(body);backend.writes++;
      return json(route,[structuredClone(backend.remote)]);
    }

    if(path.startsWith('/rest/v1/ml_state?user_id=eq.')&&method==='PATCH'){
      const expected=Number(String(u.searchParams.get('revision')||'').replace(/^eq\./,''));
      if(!backend.remote||Number(backend.remote.revision)!==expected)return json(route,[]);
      backend.remote={...backend.remote,...structuredClone(body)};backend.writes++;
      return json(route,[structuredClone(backend.remote)]);
    }

    if(path.startsWith('/rest/v1/ml_state?on_conflict=')&&method==='POST'){
      backend.remote=structuredClone(body);backend.writes++;
      return json(route,[structuredClone(backend.remote)]);
    }

    if(path==='/rest/v1/ml_state_history'&&method==='POST'){
      backend.history.push({...structuredClone(body),id:'h_'+(backend.history.length+1),created_at:new Date().toISOString()});
      return json(route,{});
    }

    if(path.startsWith('/rest/v1/ml_state_history?select=')){
      const rows=backend.history.slice().reverse().slice(0,10).map(x=>({
        id:x.id,revision:x.revision,source_device_id:x.source_device_id,source_platform:x.source_platform,
        app_version:x.app_version,reason:x.reason,created_at:x.created_at
      }));
      return json(route,rows);
    }

    if(path.startsWith('/rest/v1/ml_devices?on_conflict=')&&method==='POST'){
      backend.devices.set(body.device_id,structuredClone(body));
      return json(route,{});
    }

    if(path.startsWith('/rest/v1/ml_devices?select=')){
      return json(route,[...backend.devices.values()].sort((a,b)=>Date.parse(b.last_seen_at)-Date.parse(a.last_seen_at)));
    }

    return json(route,{message:'Unhandled shared Supabase mock '+method+' '+path},500);
  });
}

async function newDevice(browser,platform){
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await installSupabaseMock(context);
  await context.addInitScript(p=>{
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.onboardingCompleted.v1','1');
    window.__MICHELSLIFE_PLATFORM__=p;
  },platform);
  const page=await context.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.SupabaseSyncV30216,null,{timeout:60000});
  return {context,page};
}

async function sessionSnapshot(page){
  return page.evaluate(()=>({
    platform:window.SupabaseSyncV30216.platform(),
    deviceId:window.SupabaseSyncV30216.deviceId(),
    runtime:{...window.SupabaseSyncV30216.runtime},
    meta:JSON.parse(localStorage.getItem('michelsLife.supabase.meta.v30216')||'{}'),
    xp:Number(state?.xp||0),
    storedXp:Number((JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}')||{}).xp||0),
    onboard:localStorage.getItem('michelsLife.onboarding.v30200'),
    onboardingRequired:state?.settings?.onboardingRequired===true
  }));
}

// Observe the asynchronous save contract rather than assuming GitHub runner
// scheduling always completes within exactly 2900 ms. Still require *exactly*
// one revision, and observe for at least the original 2.9 s to catch duplicates.
async function waitForExactlyOneRevision(base,label,{timeoutMs=15000,minObservationMs=2900}={}){
  const started=Date.now();
  const expected=Number(base)+1;
  while(Date.now()-started<timeoutMs){
    const revision=Number(backend.remote?.revision||0);
    if(revision>expected)throw new Error(label+' advanced more than once: '+JSON.stringify({expected,revision,writes:backend.writes}));
    if(revision===expected && Date.now()-started>=minObservationMs)return;
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  throw new Error(label+' did not advance master exactly once within '+timeoutMs+'ms: '+JSON.stringify({
    expected,actual:backend.remote?.revision,writes:backend.writes,source:backend.remote?.source_platform
  }));
}

const browser=await chromium.launch({headless:true});
let desktop,android;
try{
  desktop=await newDevice(browser,'windows');
  android=await newDevice(browser,'android');

  // Synthetic user preference. Auth and device identity must stay local even
  // though the theme selection is captured in the same master state.
  await desktop.page.evaluate(()=>localStorage.setItem('michelsLife.themePreset.v343','parity-theme-20261011'));
  await desktop.page.evaluate(async()=>window.SupabaseSyncV30216.signIn('cross-device@example.com','testpass123'));
  await desktop.page.waitForTimeout(120);
  const first=await sessionSnapshot(desktop.page);
  ok(first.platform==='windows','Desktop context did not identify as Windows');
  ok(first.runtime.connected,'Desktop did not establish Supabase session');
  ok(backend.remote&&Number(backend.remote.revision)>=1,'Desktop did not create first Supabase master');
  const shareableStorage=backend.remote.snapshot?.localStorage||{};
  const sharedKeys=Object.keys(shareableStorage);
  ok(shareableStorage['michelsLife.themePreset.v343']==='parity-theme-20261011',
    'Synced snapshot omitted intentional visual/theme user preference');
  ok(!sharedKeys.some(k=>/session|device|oauth|token|credential|otpEmail|\.supabase\.meta/i.test(k)),
    'Supabase snapshot contains forbidden device-specific auth/identity storage keys: '+sharedKeys.join(','));
  const allowlist=await desktop.page.evaluate(()=>Object.keys(window.MLVCloudSharedStorageV30216.capture()));
  ok(sharedKeys.every(k=>allowlist.includes(k)),'Supabase snapshot contained an unknown localStorage key');

  ok(backend.remote.source_platform==='windows','First master was not attributed to Windows');
  const firstRevision=Number(backend.remote.revision);

  await desktop.page.evaluate(()=>{state.xp=Number(state.xp||0)+17;window.save();});
  await waitForExactlyOneRevision(firstRevision,'Desktop dirty save');
  const desktopAfter=await sessionSnapshot(desktop.page);
  ok(backend.remote.source_platform==='windows','Desktop update lost Windows attribution');
  const desktopRevision=Number(backend.remote.revision);
  const desktopXp=Number(backend.remote.snapshot?.state?.xp);
  ok(Number.isFinite(desktopXp),'Desktop master snapshot has no XP state');

  await android.page.evaluate(async()=>window.SupabaseSyncV30216.signIn('cross-device@example.com','testpass123'));
  await android.page.waitForTimeout(120);
  const androidFirst=await sessionSnapshot(android.page);
  ok(androidFirst.platform==='android','Android context did not identify as Android');
  ok(androidFirst.deviceId.startsWith('and_'),'Android device ID does not use Android namespace');
  ok(androidFirst.runtime.cloudConflict?.remoteRevision===desktopRevision,'Second device did not require explicit first-device authority choice');
  ok(Number(androidFirst.meta.revision||0)===0,'Second device silently adopted remote revision before user choice');
  ok(Number(backend.remote.revision)===desktopRevision&&backend.remote.source_platform==='windows','Android sign-in overwrote existing Windows master');
  // Simulate a legacy/compromised snapshot from an older release. It must NOT
  // transplant an old Supabase token, source device ID or navigation state.
  const fakeRemoteSession=JSON.stringify({access_token:'legacy-secret-do-not-copy',
    refresh_token:'legacy-refresh-do-not-copy',user:{id:'wrong-user'}});
  backend.remote.snapshot.localStorage={
    ...(backend.remote.snapshot.localStorage||{}),
    'michelsLife.supabase.session.v30216':fakeRemoteSession,
    'michelsLife.supabase.device.v30216':'win_legacy_poison_device',
    'michelsLife.settingsSection.v30171':'legacy_remote_navigation'
  };


  await android.page.evaluate(async()=>window.SupabaseSyncV30216.pull({reload:false}));
  const androidStoredBeforeReload=await sessionSnapshot(android.page);
  const androidIdentityAfterPull=await android.page.evaluate(()=>({
    deviceId:window.SupabaseSyncV30216.deviceId(),
    token:(JSON.parse(localStorage.getItem('michelsLife.supabase.session.v30216')||'{}')).access_token,
    theme:localStorage.getItem('michelsLife.themePreset.v343'),
    navigation:localStorage.getItem('michelsLife.settingsSection.v30171')
  }));
  ok(androidIdentityAfterPull.deviceId===androidFirst.deviceId &&
    androidIdentityAfterPull.token==='access_shared' &&
    androidIdentityAfterPull.theme==='parity-theme-20261011' &&
    androidIdentityAfterPull.navigation!=='legacy_remote_navigation',
    'Remote restore overwrote device login or local navigation, or lost user theme preference: '+
      JSON.stringify({...androidIdentityAfterPull,token:'[redacted]'}));

  ok(androidStoredBeforeReload.storedXp===desktopXp,'Android pull did not persist Windows master before reload: '+JSON.stringify({desktopXp,androidStoredBeforeReload,remoteXp:backend.remote?.snapshot?.state?.xp}));
  await android.page.reload({waitUntil:'domcontentloaded'});
  await android.page.waitForFunction(()=>window.SupabaseSyncV30216,null,{timeout:60000});
  const androidAdopted=await sessionSnapshot(android.page);
  ok(Number(androidAdopted.meta.revision)===desktopRevision,'Android explicit cloud choice did not adopt desktop revision');
  ok(androidAdopted.xp===desktopXp&&androidAdopted.storedXp===desktopXp,'Android startup changed the restored Windows master state: '+JSON.stringify({desktopXp,androidAdopted,remoteXp:backend.remote?.snapshot?.state?.xp}));

  await android.page.evaluate(()=>{state.xp=Number(state.xp||0)+23;window.save();});
  await waitForExactlyOneRevision(desktopRevision,'Android dirty save');
  const androidRevision=Number(backend.remote.revision);
  const androidXp=Number(backend.remote.snapshot?.state?.xp);
  ok(backend.remote.source_platform==='android','Android update did not carry Android source attribution');
  ok(androidXp===desktopXp+23,'Android master snapshot does not contain Android edit');
  ok(!Object.keys(backend.remote.snapshot?.localStorage||{}).some(k=>/session|device|oauth|token|credential|otpEmail|\.supabase\.meta/i.test(k)),
    'Android upload reintroduced a forbidden credential/device key');


  const writesBeforeDesktopConflict=backend.writes;
  await desktop.page.evaluate(async()=>window.SupabaseSyncV30216.sync('auto',{silent:true}));
  const desktopConflict=await sessionSnapshot(desktop.page);
  ok(desktopConflict.runtime.cloudConflict?.remoteRevision===androidRevision,'Windows did not detect newer Android revision');
  ok(backend.writes===writesBeforeDesktopConflict,'Windows conflict path overwrote newer Android data');
  ok(Number(backend.remote.revision)===androidRevision&&backend.remote.source_platform==='android','Android winner was not preserved');

  await desktop.page.evaluate(async()=>window.SupabaseSyncV30216.pull({reload:false}));
  await desktop.page.reload({waitUntil:'domcontentloaded'});
  await desktop.page.waitForFunction(()=>window.SupabaseSyncV30216,null,{timeout:60000});
  const desktopRestored=await sessionSnapshot(desktop.page);
  ok(Number(desktopRestored.meta.revision)===androidRevision,'Windows explicit cloud restore did not adopt Android revision');
  ok(desktopRestored.xp===androidXp&&desktopRestored.storedXp===androidXp,'Windows did not restore Android state: '+JSON.stringify({androidXp,desktopRestored,remoteXp:backend.remote?.snapshot?.state?.xp}));

  await Promise.all([
    desktop.page.evaluate(()=>window.SupabaseSyncV30216.refreshOverview()),
    android.page.evaluate(()=>window.SupabaseSyncV30216.refreshOverview())
  ]);
  const devices=[...backend.devices.values()];
  ok(devices.some(x=>x.platform==='windows'&&String(x.device_id).startsWith('win_')),'Shared backend never registered Windows device');
  ok(devices.some(x=>x.platform==='android'&&String(x.device_id).startsWith('and_')),'Shared backend never registered Android device');
  ok(new Set(devices.map(x=>x.device_id)).size>=2,'Desktop and Android accidentally shared device identity');
  ok(backend.history.some(x=>x.reason==='before_download_local'&&x.source_platform==='android'),'Android first cloud adoption did not preserve its local pre-download state');
  ok(backend.history.some(x=>x.reason==='before_download_local'&&x.source_platform==='windows'),'Windows cloud restore did not preserve its local pre-download state');

  console.log('OK: isolated Windows + Android contexts share one Supabase master safely',JSON.stringify({
    firstRevision,desktopRevision,androidRevision,devices:devices.map(x=>({platform:x.platform,id:x.device_id,last_action:x.last_action})),history:backend.history.length,writes:backend.writes
  }));
} finally {
  await desktop?.context?.close().catch(()=>{});
  await android?.context?.close().catch(()=>{});
  await browser.close();
}
