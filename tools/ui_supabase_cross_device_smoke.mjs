import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const SUPA='https://lqnkcqredlxrykynacwr.supabase.co';
const USER_ID='00000000-0000-0000-0000-000000000216';
const MISSION_ID='granada-cross-device-canonical-mission';
const MISSION_XP=23;
function ok(v,m){if(!v)throw new Error(m)}

const backend={remote:null,devices:new Map(),history:[],writes:0,offline:new Set()};

function json(route,value,status=200){
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
}

async function installSupabaseMock(context,platform){
  await context.route(SUPA+'/**',async route=>{
    if(backend.offline.has(platform))return json(route,{message:'Synthetic network outage'},503);
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
  await installSupabaseMock(context,platform);
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

  // Use ONE real canonical mission ID across Windows and Android. The prior
  // happy-path test only synchronized a number (XP), so duplicate mission
  // rows/completions could pass while actual user progress was corrupted.
  await desktop.page.evaluate(({id,xp})=>{
    const existing=(state.missions||[]).find(m=>m.id===id);
    if(existing)throw new Error('Synthetic mission ID collision');
    state.missions.push({
      id,name:'Granada shared mission QA',canonical:'granada shared mission qa',
      description:'Synthetic sync regression only',category:'academic',
      type:'oneoff',difficulty:'medium',xp,coins:0,priority:'medium',
      days:[],archived:false,hidden:false,
      createdAt:'2026-01-01T12:00:00.000Z',completions:[]
    });
    state.xp=Number(state.xp||0)+17;
    window.save();
  },{id:MISSION_ID,xp:MISSION_XP});
  await waitForExactlyOneRevision(firstRevision,'Desktop dirty save');
  const desktopAfter=await sessionSnapshot(desktop.page);
  ok(backend.remote.source_platform==='windows','Desktop update lost Windows attribution');
  const desktopRevision=Number(backend.remote.revision);
  const desktopXp=Number(backend.remote.snapshot?.state?.xp);
  ok(Number.isFinite(desktopXp),'Desktop master snapshot has no XP state');
  const masterMissions=backend.remote.snapshot?.state?.missions||[];
  ok(masterMissions.filter(m=>m.id===MISSION_ID).length===1&&
    masterMissions.find(m=>m.id===MISSION_ID)?.completions?.length===0,
    'Windows master did not preserve exactly one new canonical mission');

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
  const androidAdoptedMission=await android.page.evaluate(id=>({
    runtimeIds:state.missions.filter(m=>m.id===id).map(m=>m.id),
    storedIds:(JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}').missions||[])
      .filter(m=>m.id===id).map(m=>m.id),
    completed:state.missions.find(m=>m.id===id)?.completions?.length||0
  }),MISSION_ID);
  ok(androidAdoptedMission.runtimeIds.length===1&&
    androidAdoptedMission.storedIds.length===1&&androidAdoptedMission.completed===0,
    'Android duplicated/dropped the canonical Windows mission during cloud adoption: '+
      JSON.stringify(androidAdoptedMission));

  // Exercise the real shared completion entrypoint twice. A second tap must
  // not duplicate completion IDs or award XP again on either device.
  const completedOnce=await android.page.evaluate(id=>{
    if(typeof window.completeMission!=='function')
      throw new Error('Canonical completeMission entrypoint missing');
    const before=Number(state.xp||0);
    // The canonical migration/domain layer owns the XP reward. A fixture
    // seeded at 23 may be normalized to 50 after reload; do not hard-code
    // a reward that no longer matches the actual canonical mission.
    const missionXp=Number(state.missions.find(m=>m.id===id)?.xp||0);
    window.completeMission(id);
    const afterFirst=Number(state.xp||0);
    window.completeMission(id);
    const afterSecond=Number(state.xp||0);
    const entries=state.missions.find(m=>m.id===id)?.completions||[];
    return {before,missionXp,afterFirst,afterSecond,count:entries.length,
      completionXp:Number(entries[0]?.xp||0),
      uniqueIds:new Set(entries.map(c=>c.id)).size};
  },MISSION_ID);
  ok(completedOnce.before===desktopXp&&
    completedOnce.missionXp>0&&completedOnce.completionXp===completedOnce.missionXp&&
    completedOnce.afterFirst===desktopXp+completedOnce.missionXp&&
    completedOnce.afterSecond===completedOnce.afterFirst&&
    completedOnce.count===1&&completedOnce.uniqueIds===1,
    'Double completion created duplicate XP/records in canonical Android state: '+
      JSON.stringify(completedOnce));
  await waitForExactlyOneRevision(desktopRevision,'Android dirty save');
  const androidRevision=Number(backend.remote.revision);
  const androidXp=Number(backend.remote.snapshot?.state?.xp);
  ok(backend.remote.source_platform==='android','Android update did not carry Android source attribution');
  ok(androidXp===completedOnce.afterFirst,
    'Android master snapshot does not contain exactly one canonical mission completion reward');
  const cloudMission=backend.remote.snapshot?.state?.missions||[];
  const completedCloud=cloudMission.filter(m=>m.id===MISSION_ID);
  ok(completedCloud.length===1&&completedCloud[0].completions?.length===1&&
    new Set(completedCloud[0].completions.map(c=>c.id)).size===1,
    'Android upload duplicated or lost the shared mission/completion ID');
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
  const winRestoredMission=await desktop.page.evaluate(id=>{
    const matches=state.missions.filter(m=>m.id===id);
    const stored=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
    return {count:matches.length,completed:matches[0]?.completions?.length||0,
      persisted:(stored.missions||[]).filter(m=>m.id===id).length};
  },MISSION_ID);
  ok(winRestoredMission.count===1&&winRestoredMission.completed===1&&
    winRestoredMission.persisted===1,
    'Windows rehydration lost or duplicated the Android completion: '+
      JSON.stringify(winRestoredMission));

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

  // GRANADA offline/reconnect conflict drill, independent of real-provider
  // credentials. Device A makes an offline edit while device B advances the
  // cloud. Recovery must preserve the local backup and never silently clobber
  // B's newer canonical mission/XP state.
  const beforeOutageRevision=Number(backend.remote.revision);
  const beforeOutageWrites=backend.writes;
  backend.offline.add('windows');
  await desktop.page.evaluate(()=>{
    state.xp=Number(state.xp||0)+5;
    window.save();
  });
  await desktop.page.waitForTimeout(3200); // allow auto-sync to attempt and fail
  const offlineLocal=await sessionSnapshot(desktop.page);
  ok(offlineLocal.xp===androidXp+5&&
    offlineLocal.meta.dirty===true&&
    Number(backend.remote.revision)===beforeOutageRevision&&
    backend.writes===beforeOutageWrites,
    'Offline Windows edit modified Supabase or silently lost its dirty state: '+
      JSON.stringify({localXp:offlineLocal.xp,dirty:offlineLocal.meta.dirty,
        remoteRevision:backend.remote.revision,writes:backend.writes}));
  backend.offline.delete('windows');

  await android.page.evaluate(()=>{state.xp=Number(state.xp||0)+7;window.save();});
  await waitForExactlyOneRevision(beforeOutageRevision,'Android edit during Windows outage');
  const onlineWinnerRev=Number(backend.remote.revision);
  const onlineWinnerXp=Number(backend.remote.snapshot?.state?.xp);
  const writesBeforeReconnect=backend.writes;
  ok(onlineWinnerXp===androidXp+7,
    'Second device failed to advance independently while Windows was offline');
  await desktop.page.evaluate(async()=>window.SupabaseSyncV30216.sync('auto',{silent:true}));
  const reconnect=await sessionSnapshot(desktop.page);
  ok(reconnect.runtime.cloudConflict?.remoteRevision===onlineWinnerRev&&
    reconnect.meta.dirty===true&&reconnect.xp===androidXp+5&&
    backend.writes===writesBeforeReconnect&&
    Number(backend.remote.revision)===onlineWinnerRev,
    'Reconnect silently overwrote cloud/newer account state or lost offline edit: '+
      JSON.stringify({conflict:reconnect.runtime.cloudConflict,dirty:reconnect.meta.dirty,
        localXp:reconnect.xp,remoteRev:backend.remote.revision,writes:backend.writes}));

  await desktop.page.evaluate(async()=>window.SupabaseSyncV30216.pull({reload:false}));
  const offlineSafety=backend.history.filter(h=>
    h.reason==='before_download_local'&&h.source_platform==='windows'&&
    Number(h.snapshot?.state?.xp)===androidXp+5);
  ok(offlineSafety.length>=1,
    'Explicit Use Cloud did not create a reversible backup of the offline edit');
  await desktop.page.reload({waitUntil:'domcontentloaded'});
  await desktop.page.waitForFunction(()=>window.SupabaseSyncV30216,null,{timeout:60000});
  const afterRecovery=await sessionSnapshot(desktop.page);
  const recoveredMission=await desktop.page.evaluate(id=>{
    const matches=state.missions.filter(m=>m.id===id);
    return {count:matches.length,completions:matches[0]?.completions?.length||0,
      distinctCompletions:new Set((matches[0]?.completions||[]).map(c=>c.id)).size};
  },MISSION_ID);
  ok(afterRecovery.xp===onlineWinnerXp&&afterRecovery.storedXp===onlineWinnerXp&&
    Number(afterRecovery.meta.revision)===onlineWinnerRev&&
    recoveredMission.count===1&&recoveredMission.completions===1&&
    recoveredMission.distinctCompletions===1,
    'Cloud recovery lost the newer Android winner or duplicated mission progress: '+
      JSON.stringify({recoveredXp:afterRecovery.xp,remoteXp:onlineWinnerXp,
        revision:afterRecovery.meta.revision,mission:recoveredMission}));

  // GRANADA — concurrent Journal conflict. Unlike numeric XP, a private day
  // entry could be silently overwritten across devices while mission counts
  // and revision comparisons still pass. Use the REAL canonical Journal API
  // and the already-authenticated same-account Supabase clients.
  const journalDate='2026-10-20';
  const journalCloudBody='SYNTHETIC_WINDOWS_JOURNAL_NEWER_AUTHORITY';
  const journalOfflineBody='SYNTHETIC_ANDROID_JOURNAL_STALE_PRIVATE_EDIT';
  const startJournalRevision=Number(backend.remote.revision);
  const journalWin=await desktop.page.evaluate(async({date,body})=>{
    const api=window.JournalV30189;
    if(!api?.save||!api?.entry)throw new Error('Canonical Journal save/entry API missing');
    api.save(date,'Windows diary authority',body);
    await window.SupabaseSyncV30216.push('journal_windows_edit');
    return {body:api.entry(date).body,
      local:JSON.parse(localStorage.getItem('michelsLife.journal.v30184')||'{}')[date]?.body};
  },{date:journalDate,body:journalCloudBody});
  ok(journalWin.body===journalCloudBody&&journalWin.local===journalCloudBody,
    'Canonical Windows Journal edit was not saved locally');
  const journalWinnerRevision=Number(backend.remote.revision);
  ok(journalWinnerRevision===startJournalRevision+1&&
    backend.remote.snapshot?.localStorage?.['michelsLife.journal.v30184'] &&
    JSON.parse(backend.remote.snapshot.localStorage['michelsLife.journal.v30184'])[journalDate]?.body===journalCloudBody,
    'Windows Journal was not uploaded as one versioned master');
  const writesBeforeJournalConflict=backend.writes;

  const journalAnd=await android.page.evaluate(async({date,body})=>{
    const api=window.JournalV30189;
    api.save(date,'Android offline private journal',body);
    window.save(); // record journal change through the canonical sync dirty gate
    await window.SupabaseSyncV30216.sync('auto',{silent:true});
    return {body:api.entry(date).body,
      conflict:window.SupabaseSyncV30216.runtime.cloudConflict,
      meta:JSON.parse(localStorage.getItem('michelsLife.supabase.meta.v30216')||'{}')};
  },{date:journalDate,body:journalOfflineBody});
  ok(journalAnd.body===journalOfflineBody&&journalAnd.meta.dirty===true&&
    journalAnd.conflict?.remoteRevision===journalWinnerRevision&&
    Number(backend.remote.revision)===journalWinnerRevision&&
    backend.writes===writesBeforeJournalConflict,
    'Stale Android Journal silently replaced newer Windows entry or lost its private edit: '+
      JSON.stringify({local:journalAnd.body,dirty:journalAnd.meta.dirty,
        conflictRev:journalAnd.conflict?.remoteRevision,masterRev:backend.remote.revision,
        writes:backend.writes}));
  const journalWinner=JSON.parse(backend.remote.snapshot.localStorage['michelsLife.journal.v30184']);
  ok(journalWinner[journalDate]?.body===journalCloudBody,
    'Journal conflict clobbered most recent cloud entry');

  await android.page.evaluate(async()=>window.SupabaseSyncV30216.pull({reload:false}));
  const journalSafety=backend.history.filter(h=>
    h.reason==='before_download_local'&&h.source_platform==='android'&&
    (()=>{try{return JSON.parse(h.snapshot?.localStorage?.['michelsLife.journal.v30184']||'{}')
      [journalDate]?.body===journalOfflineBody}catch(_){return false}})());
  ok(journalSafety.length>=1,
    'Choosing newer cloud Journal discarded stale phone writing without a recovery snapshot');
  await android.page.reload({waitUntil:'domcontentloaded'});
  await android.page.waitForFunction(()=>window.SupabaseSyncV30216&&window.JournalV30189,
    null,{timeout:60000});
  const adoptedJournal=await android.page.evaluate(date=>({
    body:window.JournalV30189.entry(date)?.body,
    stored:JSON.parse(localStorage.getItem('michelsLife.journal.v30184')||'{}')[date]?.body,
    revision:JSON.parse(localStorage.getItem('michelsLife.supabase.meta.v30216')||'{}').revision
  }),journalDate);
  ok(adoptedJournal.body===journalCloudBody&&adoptedJournal.stored===journalCloudBody&&
    Number(adoptedJournal.revision)===journalWinnerRevision,
    'Android explicit Journal recovery failed to adopt the cloud authority');
  ok(backend.writes===writesBeforeJournalConflict,
    'Journal recovery should not silently upload or overwrite the authoritative snapshot');

  console.log('OK: isolated Windows + Android contexts share one Supabase master safely',JSON.stringify({
    firstRevision,desktopRevision,androidRevision,offlineRecoveryRevision:onlineWinnerRev,offlineSafetyBackups:offlineSafety.length,journalWinnerRevision,journalRecoveredBackups:journalSafety.length,missionCount:recoveredMission.count,completionCount:recoveredMission.completions,devices:devices.map(x=>({platform:x.platform,id:x.device_id,last_action:x.last_action})),history:backend.history.length,writes:backend.writes
  }));
} finally {
  await desktop?.context?.close().catch(()=>{});
  await android?.context?.close().catch(()=>{});
  await browser.close();
}
