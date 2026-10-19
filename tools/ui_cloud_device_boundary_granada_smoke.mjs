import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// GRANADA #55: exercise the actual canonical browser runtime in two isolated
// persistent profiles. No real cloud provider, account tokens or private data.
const URL=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const KEY='vida_rpg_personal_progress_v2';
const JOURNAL='michelsLife.journal.v30184';
const THEME='michelsLife.theme.v342';
const DISALLOWED=[
  'michelsLife.supabase.session.v30216',
  'michelsLife.supabase.meta.v30216',
  'michelsLife.supabase.device.v30216',
  'michelsLife.supabase.boardOwner.v30218',
  'michelsLife.supabase.localGuest.v30218',
  'michelsLife.supabase.localAccount.v30218.synthetic',
  'michelsLife.google.auth',
  'michelsLife.google.refreshToken',
  'michelsLife.local.notification.id',
  'michelsLife.internal.transient',
  'michelsLife.unknown.future.privateKey',
  'michelLegacyAuth',
];
const browser=await chromium.launch({headless:true});
let windows=null,android=null;
async function device(platform,label){
  const context=await browser.newContext({viewport:platform==='android'?{width:412,height:915}:{width:1280,height:850}});
  await context.addInitScript(value=>{
    window.__MICHELSLIFE_PLATFORM__=value;
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.onboardingCompleted.v1','1');
  },platform);
  const page=await context.newPage();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>
    window.MLVCloudSharedStorageV30216?.capture &&
    window.MLVCloudSharedStorageV30216?.restore &&
    window.GoogleCloudV30192?.capture &&
    typeof state!=='undefined',null,{timeout:60000});
  return {context,page,platform,label};
}
async function populate(dev,{xp,mission,journal,theme}){
  return dev.page.evaluate(({xp,mission,journal,theme,label,forbidden})=>{
    const ls=localStorage;
    const deviceSecrets={};
    for(const [i,key] of forbidden.entries()){
      const val='SYNTHETIC_'+label+'_PRIVATE_'+i;
      ls.setItem(key,val);deviceSecrets[key]=val;
    }
    const policy=window.MLVCloudSharedStorageV30216;
    for(const key of forbidden){
      if(policy.allowed(key))throw new Error('A device-specific key was mistakenly allowed: '+key);
    }
    if(!policy.allowed('vida_rpg_personal_progress_v2')||
      !policy.allowed('michelsLife.journal.v30184')||
      !policy.allowed('michelsLife.theme.v342'))
      throw new Error('Mission, Journal or theme shareable key lost');
    state.xp=xp;
    state.missions.push({
      id:mission,name:'Granada synthetic board record',
      type:'oneoff',category:'academic',difficulty:'medium',
      xp:50,coins:0,days:[],completions:[],
      createdAt:'2026-10-19T12:00:00Z'
    });
    ls.setItem('vida_rpg_personal_progress_v2',JSON.stringify(state));
    ls.setItem('michelsLife.journal.v30184',journal);
    ls.setItem('michelsLife.theme.v342',theme);
    return deviceSecrets;
  },{xp,mission,journal,theme,label:dev.label,forbidden:DISALLOWED});
}
async function capture(dev){
  return dev.page.evaluate(()=>{
    const shared=window.MLVCloudSharedStorageV30216.capture();
    const backup=JSON.parse(window.GoogleCloudV30192.capture());
    return {shared,backup};
  });
}
function assertSafePayload(packet,expected,{mission,xp,journal,theme}){
  for(const source of [packet.shared,packet.backup.localStorage]){
    assert.ok(source&&typeof source==='object','Canonical shareable key map missing');
    assert.equal(source[JOURNAL],journal,'Journal lost during capture');
    assert.equal(source[THEME],theme,'Theme lost during capture');
    const stateInMap=JSON.parse(source[KEY]);
    assert.equal(stateInMap.xp,xp,'XP lost in shareable localStorage');
    assert.equal(stateInMap.missions.filter(m=>m.id===mission).length,1,'Mission ID lost or doubled in capture');
    for(const key of DISALLOWED)assert.equal(Object.hasOwn(source,key),false,
      'Device-local key escaped shareable capture: '+key);
  }
  assert.equal(packet.backup.state.xp,xp,'Canonical cloud backup lost XP');
  assert.equal(packet.backup.state.missions.filter(m=>m.id===mission).length,1,
    'Canonical cloud backup lost synthetic mission');
  const raw=JSON.stringify(packet);
  for(const value of Object.values(expected))
    assert.ok(!raw.includes(value),'Device-local synthetic secret escaped capture');
  assert.equal(Object.keys(packet.shared).some(k=>/supabase|auth|refreshToken|internal/i.test(k)),false,
    'Unknown auth/device-scoped key escaped strict cloud allowlist');
}
async function adoptSharedOnly(receiver,incoming){
  return receiver.page.evaluate(({incoming,forbidden})=>{
    const ls=localStorage,policy=window.MLVCloudSharedStorageV30216;
    const before=Object.fromEntries(forbidden.map(k=>[k,ls.getItem(k)]));
    // A hostile *legacy* restore may contain another device's auth, owner,
    // revision and provider credentials in its localStorage map.
    const poisoned={...incoming};
    for(const [i,key] of forbidden.entries())poisoned[key]='FOREIGN_DEVICE_'+i;
    policy.restore(poisoned);
    const after=Object.fromEntries(forbidden.map(k=>[k,ls.getItem(k)]));
    const stored=JSON.parse(ls.getItem('vida_rpg_personal_progress_v2')||'{}');
    return {
      before,after,storedXp:stored.xp,
      missionIds:(stored.missions||[]).map(m=>m.id),
      journal:ls.getItem('michelsLife.journal.v30184'),
      theme:ls.getItem('michelsLife.theme.v342'),
      unknown:ls.getItem('michelsLife.unknown.future.privateKey')
    };
  },{incoming,forbidden:DISALLOWED});
}
try{
  windows=await device('windows','WIN');
  android=await device('android','AND');
  const winIdentity=await populate(windows,{
    xp:117,mission:'granada-origin-windows',journal:'SYNTHETIC_WIN_JOURNAL',theme:'granada-win-theme'
  });
  const andIdentity=await populate(android,{
    xp:23,mission:'granada-origin-android',journal:'SYNTHETIC_ANDROID_JOURNAL',theme:'granada-android-theme'
  });
  const winBackup=await capture(windows);
  const andBackup=await capture(android);
  assertSafePayload(winBackup,winIdentity,{
    xp:117,mission:'granada-origin-windows',journal:'SYNTHETIC_WIN_JOURNAL',theme:'granada-win-theme'
  });
  assertSafePayload(andBackup,andIdentity,{
    xp:23,mission:'granada-origin-android',journal:'SYNTHETIC_ANDROID_JOURNAL',theme:'granada-android-theme'
  });

  const androidAdopt=await adoptSharedOnly(android,winBackup.backup.localStorage);
  assert.deepEqual(androidAdopt.after,androidAdopt.before,
    'Windows cloud restore overwrote Android auth, device ID, notifications or local vault');
  assert.equal(androidAdopt.storedXp,117,'Android did not adopt shareable Windows XP');
  assert.equal(androidAdopt.missionIds.filter(id=>id==='granada-origin-windows').length,1,
    'Android lost or duplicated the shareable Windows mission');
  assert.equal(androidAdopt.journal,'SYNTHETIC_WIN_JOURNAL',
    'Android did not adopt the shareable Windows Journal');
  assert.equal(androidAdopt.theme,'granada-win-theme','Android did not adopt theme');
  assert.equal(androidAdopt.unknown,andIdentity['michelsLife.unknown.future.privateKey'],
    'Unknown storage key was modified by hostile legacy cloud restore');

  const windowsAdopt=await adoptSharedOnly(windows,andBackup.backup.localStorage);
  assert.deepEqual(windowsAdopt.after,windowsAdopt.before,
    'Android cloud restore overwrote Windows auth, device ID, notifications or local vault');
  assert.equal(windowsAdopt.storedXp,23,'Windows did not adopt shareable Android XP');
  assert.equal(windowsAdopt.missionIds.filter(id=>id==='granada-origin-android').length,1,
    'Windows lost or duplicated shareable Android mission');
  assert.equal(windowsAdopt.journal,'SYNTHETIC_ANDROID_JOURNAL',
    'Windows did not adopt Android Journal');
  assert.equal(windowsAdopt.theme,'granada-android-theme','Windows did not adopt Android theme');
  assert.equal(windowsAdopt.unknown,winIdentity['michelsLife.unknown.future.privateKey'],
    'Unknown local Windows storage key was modified');

  // Capture after both imports: the receiving devices still must not publish
  // *their own* secrets when using the imported board.
  for(const [dev,localIdentity] of [[windows,winIdentity],[android,andIdentity]]){
    const recaptured=await capture(dev);
    for(const value of Object.values(localIdentity))
      assert.ok(!JSON.stringify(recaptured).includes(value),
        'After restore, a receiver leaked its device-local credentials into cloud backup');
  }
  console.log('PASS: two live Chromium platform contexts exchange missions/XP/Journal/themes while excluding all local auth/device/vault/notification keys in both directions');
}finally{
  await Promise.allSettled([windows?.context?.close(),android?.context?.close()]);
  await browser.close();
}
