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
    storedXp:Number((JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}')||{}).xp||0),\n    onboard:localStorage.getItem('michelsLife.onboarding.v30200'),\n    onboardingRequired:state?.settings?.onboardingRequired===true
  }));
}

const browser=await chromium.launch({headless:true});
let desktop,android;
try{
  desktop=await newDevice(browser,'windows');
  android=await newDevice(browser,'android');

  await desktop.page.evaluate(async()=>window.SupabaseSyncV30216.signIn('cross-device@example.com','testpass123'));
  await desktop.page.waitForTimeout(120);
  const first=await sessionSnapshot(desktop.page);
  ok(first.platform==='windows','Desktop context did not identify as Windows');
  ok(first.runtime.connected,'Desktop did not establish Supabase session');
  ok(backend.remote&&Number(backend.remote.revision)>=1,'Desktop did not create first Supabase master');
  ok(backend.remote.source_platform==='windows','First master was not attributed to Windows');
  const firstRevision=Number(backend.remote.revision);

  await desktop.page.evaluate(()=>{state.xp=Number(state.xp||0)+17;window.save();});
  await desktop.page.waitForTimeout(2900);
  const desktopAfter=await sessionSnapshot(desktop.page);
  ok(Number(backend.remote.revision)===firstRevision+1,'Desktop dirty save did not advance master exactly once');
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

  await android.page.evaluate(async()=>window.SupabaseSyncV30216.pull({reload:false}));
  const androidStoredBeforeReload=await sessionSnapshot(android.page);
  ok(androidStoredBeforeReload.storedXp===desktopXp,'Android pull did not persist Windows master before reload: '+JSON.stringify({desktopXp,androidStoredBeforeReload,remoteXp:backend.remote?.snapshot?.state?.xp}));
  await android.page.reload({waitUntil:'domcontentloaded'});
  await android.page.waitForFunction(()=>window.SupabaseSyncV30216,null,{timeout:60000});
  const androidAdopted=await sessionSnapshot(android.page);
  ok(Number(androidAdopted.meta.revision)===desktopRevision,'Android explicit cloud choice did not adopt desktop revision');
  ok(androidAdopted.xp===desktopXp&&androidAdopted.storedXp===desktopXp,'Android startup changed the restored Windows master state: '+JSON.stringify({desktopXp,androidAdopted,remoteXp:backend.remote?.snapshot?.state?.xp}));

  await android.page.evaluate(()=>{state.xp=Number(state.xp||0)+23;window.save();});
  await android.page.waitForTimeout(2900);
  const androidRevision=Number(backend.remote.revision);
  const androidXp=Number(backend.remote.snapshot?.state?.xp);
  ok(androidRevision===desktopRevision+1,'Android dirty save did not advance master exactly once');
  ok(backend.remote.source_platform==='android','Android update did not carry Android source attribution');
  ok(androidXp===desktopXp+23,'Android master snapshot does not contain Android edit');

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
