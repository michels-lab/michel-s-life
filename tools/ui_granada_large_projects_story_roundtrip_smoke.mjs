import assert from 'node:assert/strict';
import { chromium } from 'playwright';

/**
 * GRANADA GRANDE: REAL canonical Android Project+Chapter form -> authenticated
 * (MOCK Supabase) Android/Windows account -> cloud versioned CAS -> reload ->
 * reverse Journal/XP and conflict-safe recovery.
 *
 * Browser runtime and UI are real; provider responses, accounts, and content
 * are synthetic. This does not prove Galaxy/signed APK/live cloud acceptance.
 */
const APP_URL=process.env.MLV_UI_URL||'http://127.0.0.1:4174';
const SUPA='https://lqnkcqredlxrykynacwr.supabase.co';
const USER='00000000-0000-0000-0000-000000000653';
const DAY='2026-10-20';
const PROJECT='GRANADA Project linked to canonical mission';
const CHAPTER='GRANADA Chapter stored across devices';
const MOTTO='Canonical multi-device chapter persistence';
const MISSION_ID='granada-project-linked-mission';
const WIN_JOURNAL='SYNTHETIC_WINDOWS_JOURNAL_AUTHORITY';
const AND_JOURNAL='SYNTHETIC_ANDROID_JOURNAL_FIRST';
const OFFLINE_JOURNAL='SYNTHETIC_ANDROID_OFFLINE_RECOVERY';
const PRIVATE_PATTERN=/supabase\.session|supabase\.meta|supabase\.device|\.oauth|refreshToken|credential|\.internal\.|notification\.id/i;
const browser=await chromium.launch({headless:true});
let android,desktop;
const backend={remote:null,history:[],devices:new Map(),writes:0};

const ok=(v,msg)=>assert.ok(v,msg);
const fulfilled=(route,data,status=200)=>
  route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});

async function installMock(context){
  await context.route(SUPA+'/**',async route=>{
    const request=route.request(),u=new URL(request.url());
    const path=u.pathname+u.search,method=request.method().toUpperCase();
    let body=null;
    try{body=request.postData()?JSON.parse(request.postData()):null}catch(_){}
    if(path.startsWith('/auth/v1/token?grant_type=password')||
       path.startsWith('/auth/v1/token?grant_type=refresh_token')){
      return fulfilled(route,{access_token:'synthetic_same_account',
        refresh_token:'synthetic_refresh',expires_in:3600,
        user:{id:USER,email:'granada@example.com'}});
    }
    if(path.startsWith('/auth/v1/logout'))return fulfilled(route,{});
    if(path.startsWith('/rest/v1/ml_state?select='))
      return fulfilled(route,backend.remote?[structuredClone(backend.remote)]:[]);
    if(path==='/rest/v1/ml_state'&&method==='POST'){
      if(backend.remote)return fulfilled(route,{message:'duplicate key'},409);
      backend.remote=structuredClone(body);backend.writes++;
      return fulfilled(route,[structuredClone(backend.remote)]);
    }
    if(path.startsWith('/rest/v1/ml_state?user_id=eq.')&&method==='PATCH'){
      const expected=Number(String(u.searchParams.get('revision')||'').replace(/^eq\./,''));
      if(!backend.remote||Number(backend.remote.revision)!==expected)
        return fulfilled(route,[]);
      backend.remote={...backend.remote,...structuredClone(body)};
      backend.writes++;return fulfilled(route,[structuredClone(backend.remote)]);
    }
    if(path.startsWith('/rest/v1/ml_state?on_conflict=')&&method==='POST'){
      backend.remote=structuredClone(body);backend.writes++;
      return fulfilled(route,[structuredClone(backend.remote)]);
    }
    if(path==='/rest/v1/ml_state_history'&&method==='POST'){
      backend.history.push({...structuredClone(body),id:'h_'+(backend.history.length+1),
        created_at:new Date().toISOString()});
      return fulfilled(route,{});
    }
    if(path.startsWith('/rest/v1/ml_state_history?select=')){
      return fulfilled(route,backend.history.slice().reverse().slice(0,10).map(x=>({
        id:x.id,revision:x.revision,source_device_id:x.source_device_id,
        source_platform:x.source_platform,app_version:x.app_version,
        reason:x.reason,created_at:x.created_at
      })));
    }
    if(path.startsWith('/rest/v1/ml_devices?on_conflict=')&&method==='POST'){
      backend.devices.set(body.device_id,structuredClone(body));return fulfilled(route,{});
    }
    if(path.startsWith('/rest/v1/ml_devices?select='))
      return fulfilled(route,[...backend.devices.values()]);
    return fulfilled(route,{message:'Unhandled mock request '+method+' '+path},500);
  });
}

async function device(platform){
  const context=await browser.newContext({
    viewport:platform==='android'?{width:412,height:915}:{width:1280,height:850},
    isMobile:platform==='android',hasTouch:platform==='android'
  });
  await installMock(context);
  await context.addInitScript(p=>{
    window.__MICHELSLIFE_PLATFORM__=p;
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    if(p==='android')window.MichelsLifeAndroid={postMessage(){}};
    if(!localStorage.getItem('vida_rpg_personal_progress_v2')){
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
        version:2,activeTab:'dashboard',xp:0,coins:0,totalCoinsEarned:0,
        settings:{characterName:'Michel',onboardingRequired:false,
          onboardingCompletedAt:'2026-10-01T12:00:00.000Z',v30200GenericProfile:true},
        missions:p==='android'?[{
          id:'granada-project-linked-mission',name:'GRANADA canonical link',
          canonical:'granada canonical link',description:'Synthetic test only',
          category:'academic',type:'oneoff',difficulty:'medium',
          xp:25,coins:0,days:[],archived:false,hidden:false,
          createdAt:'2026-10-01T00:00:00.000Z',completions:[]
        }]:[],
        goals:[],history:[],achievements:[],affirmations:[],owned:[],equipped:{}
      }));
    }
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','en');
    localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
  },platform);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(APP_URL,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof state!=='undefined'&&
    !!window.SupabaseSyncV30216?.signIn&&
    !!window.MLVCloudSharedStorageV30216?.capture&&
    !!window.JournalV30189?.save,null,{timeout:60000});
  return {context,page,errors,platform};
}

async function snap(dev){
  return dev.page.evaluate(()=>{
    const stored=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'null');
    return {runtime:JSON.stringify(state),
      master:JSON.stringify(window.MLVCloudSharedStorageV30216.capture()),
      journal:window.JournalV30189.entry('2026-10-20')?.body||'',
      xp:Number(state.xp),storedXp:Number(stored?.xp),
      meta:JSON.parse(localStorage.getItem('michelsLife.supabase.meta.v30216')||'{}'),
      token:!!localStorage.getItem('michelsLife.supabase.session.v30216')
    };
  });
}

function assertProjectAndChapter(s,label,{journal,xp}){
  ok(s.runtime.includes(PROJECT),label+': missing hydrated Project after same-account reload');
  ok(s.runtime.includes(CHAPTER),label+': missing hydrated Chapter after same-account reload');
  ok(s.master.includes(PROJECT)&&s.master.includes(CHAPTER)&&s.master.includes(MOTTO),
    label+': Project/Chapter missing in shareable backup');
  assert.equal(s.journal,journal,label+': canonical Journal body changed');
  assert.equal(s.xp,xp,label+': runtime XP drift');
  assert.equal(s.storedXp,xp,label+': persisted XP drift');
  ok(s.token,label+': same-account session lost');
}

function cloudSafety(label){
  ok(!!backend.remote?.snapshot,label+': remote master is absent');
  const map=backend.remote.snapshot.localStorage||{};
  ok(Object.keys(map).every(k=>!PRIVATE_PATTERN.test(k)),
    label+': remote snapshot contains device/auth key');
  ok(JSON.stringify(backend.remote.snapshot).includes(PROJECT)&&
     JSON.stringify(backend.remote.snapshot).includes(CHAPTER),
     label+': authoritative cloud lost Project/Chapter');
}

async function revisionAdvanced(before,label){
  const minimum=Number(before)+1,started=Date.now();
  // One package contains multiple *different* legitimate saves (mission,
  // Project, Chapter, Journal); requiring precisely one cloud revision is a
  // false assumption. Canonical identities, XP and CAS are asserted below.
  while(Date.now()-started<14000){
    const got=Number(backend.remote?.revision||0);
    if(got>=minimum && Date.now()-started>=3200)return;
    await new Promise(r=>setTimeout(r,150));
  }
  throw Error(label+': cloud did not advance from '+before+
    ', actual revision '+backend.remote?.revision);
}

async function routeAndroid(id){
  const done=await android.page.evaluate(id=>window.__mlvAndroidFastRoute?.(id),id);
  assert.notEqual(done,false,'Android route refused '+id);
  await android.page.waitForSelector('#tab-'+id+'.active',{state:'visible',timeout:15000});
}

try{
  android=await device('android');
  desktop=await device('windows');

  // Authenticate FIRST: guest-to-other-account raw import is an invalid path
  // under account isolation. Both runtimes now use the SAME synthetic account.
  await android.page.evaluate(async()=>window.SupabaseSyncV30216.signIn(
    'granada@example.com','synthetic-password'));
  // P0 #108: authentication MUST NOT create a cloud master automatically.
  ok(backend.remote===null,'Sign-in silently created a cloud master');
  ok((await snap(android)).token,'Android did not establish its synthetic session');
  // Model the explicit owner action through the production API. This does NOT
  // grant consent to overwrite a nonempty remote account or transfer guest data.
  const created=await android.page.evaluate(async()=>
    window.SupabaseSyncV30216.sync('upload',{silent:true}));
  const baseline=Number(backend.remote?.revision||0);
  ok(baseline>=1&&created?.revision===baseline,
    'Explicit owner action did not create account-scoped first master');
  // Authentication may quarantine a pre-login guest board (correct account
  // isolation). Create the linked mission INSIDE the authenticated account,
  // never assume a previous guest mission survived login.
  await android.page.evaluate(id=>{
    if(!state.missions.some(m=>m.id===id)){
      state.missions.push({
        id,name:'GRANADA canonical linked mission',
        canonical:'granada canonical linked mission',
        description:'Synthetic test only',type:'oneoff',category:'academic',
        difficulty:'medium',xp:25,coins:0,days:[],archived:false,
        hidden:false,createdAt:'2026-10-01T00:00:00.000Z',completions:[]
      });
      window.save();
    }
  },MISSION_ID);

  // Track A: actual Android Projects form and canonical mission link.
  await routeAndroid('projects');
  await android.page.locator('#tab-projects [data-v30106-action="new-project"]').click();
  const form=android.page.locator('#modalRoot #v30106ProjectForm');
  await form.waitFor({state:'visible',timeout:12000});
  await form.locator('input[name="name"]').fill(PROJECT);
  await form.locator('input[name="description"]').fill('Created through actual Android UI');
  const link=form.locator('.v30106-link-option input[type="checkbox"]').first();
  assert.equal(await link.count(),1,'Project editor missing canonical mission link');
  await link.check();
  await form.locator('button[type="submit"]').click();
  await android.page.waitForFunction(value=>
    [...document.querySelectorAll('#tab-projects .v30106-project-card h3')]
      .some(e=>e.textContent?.trim()===value),PROJECT,{timeout:12000});
  ok(!(await form.count()),'Project modal did not close after save');

  // Track B: actual Android Story chapter creation (not seeded directly).
  await routeAndroid('story');
  const story=android.page.locator('#tab-story .v30162-story-form');
  await story.waitFor({state:'visible',timeout:12000});
  await story.locator('input').first().fill(CHAPTER);
  await story.locator('input[name="motto"]').fill(MOTTO);
  await story.locator('button').filter({hasText:/start chapter/i}).first().click();
  await android.page.waitForFunction(value=>
    document.querySelector('#tab-story')?.textContent?.includes(value),
    CHAPTER,{timeout:12000});

  // Track C: canonical Journal and XP, not separate mobile-only state.
  await android.page.evaluate(({day,body})=>{
    window.JournalV30189.save(day,'GRANADA Android original',body);
    state.xp=117;window.save();
  },{day:DAY,body:AND_JOURNAL});
  await android.page.evaluate(async()=>window.SupabaseSyncV30216.push('granada_android_project_story'));
  await revisionAdvanced(baseline,'Android combined Project+Story upload');
  cloudSafety('Android authoritative upload');
  ok(JSON.stringify(backend.remote.snapshot).includes(AND_JOURNAL),
    'Cloud missed actual Android Journal body');
  const aOriginal=await snap(android);
  assertProjectAndChapter(aOriginal,'Android original',{journal:AND_JOURNAL,xp:117});

  // Two independently booted real browser contexts; same account, not a raw
  // unauthenticated guest transfer or an unsigned native-device claim.
  const androidRevision=Number(backend.remote.revision);
  await desktop.page.evaluate(async()=>window.SupabaseSyncV30216.signIn(
    'granada@example.com','synthetic-password'));
  const initialConflict=await snap(desktop);
  ok(initialConflict.meta.revision===0 || initialConflict.meta.revision===undefined,
    'New Windows client silently adopted Android cloud authority');
  ok(Number(backend.remote.revision)===androidRevision,
    'Windows sign-in overwrote Android Project/Story without consent');
  await desktop.page.evaluate(async()=>window.SupabaseSyncV30216.pull({reload:false}));
  await desktop.page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await desktop.page.waitForFunction(()=>!!window.JournalV30189?.entry&&
    !!window.SupabaseSyncV30216?.runtime,null,{timeout:60000});
  const win=await snap(desktop);
  assertProjectAndChapter(win,'Windows authenticated import',{journal:AND_JOURNAL,xp:117});
  assert.equal(Number(win.meta.revision),androidRevision,
    'Windows explicit adoption failed to record cloud revision');
  const winBoard=JSON.parse(await desktop.page.evaluate(()=>
    localStorage.getItem('vida_rpg_personal_progress_v2')));
  assert.equal((winBoard.missions||[]).filter(m=>m.id===MISSION_ID).length,1,
    'Windows import duplicated/dropped mission linked to Android Project');

  const beforeWinEdit=Number(backend.remote.revision);
  await desktop.page.evaluate(({day,body})=>{
    window.JournalV30189.save(day,'GRANADA Windows update',body);
    state.xp=124;window.save();
  },{day:DAY,body:WIN_JOURNAL});
  await desktop.page.evaluate(async()=>window.SupabaseSyncV30216.push('granada_windows_journal_xp'));
  await revisionAdvanced(beforeWinEdit,'Windows reverse edit');
  const winner=Number(backend.remote.revision);
  cloudSafety('Windows authoritative update');
  ok(JSON.stringify(backend.remote.snapshot).includes(WIN_JOURNAL),
    'Cloud did not publish Windows Journal update');

  // A's stale local change must be preserved for recovery, never silently
  // overwrite B's newer revision.
  await android.page.evaluate(({day,body})=>{
    window.JournalV30189.save(day,'GRANADA offline conflict',body);
    state.xp=119;window.save();
  },{day:DAY,body:OFFLINE_JOURNAL});
  const beforeConflictWrites=backend.writes;
  await android.page.evaluate(async()=>window.SupabaseSyncV30216.sync('auto',{silent:true}));
  const conflict=await snap(android);
  ok(conflict.meta.dirty===true&&
    conflict.journal===OFFLINE_JOURNAL&&
    Number(backend.remote.revision)===winner&&backend.writes===beforeConflictWrites,
    'Stale Android edit lost or clobbered newer Windows master');
  ok(!!(await android.page.evaluate(()=>
    window.SupabaseSyncV30216.runtime.cloudConflict))?.remoteRevision,
    'Account conflict not surfaced to user state');

  await android.page.evaluate(async()=>window.SupabaseSyncV30216.pull({reload:false}));
  const safety=backend.history.filter(h=>
    h.reason==='before_download_local'&&h.source_platform==='android'&&
    JSON.stringify(h.snapshot).includes(OFFLINE_JOURNAL)&&
    Number(h.snapshot?.state?.xp)===119);
  ok(safety.length>=1,
    'Explicit Use Cloud did not preserve displaced Android Journal/XP in recoverable history');
  await android.page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await android.page.waitForFunction(()=>!!window.JournalV30189?.entry&&
    !!window.SupabaseSyncV30216?.runtime,null,{timeout:60000});
  const recovered=await snap(android);
  assertProjectAndChapter(recovered,'Android safe recovery',{journal:WIN_JOURNAL,xp:124});
  assert.equal(Number(recovered.meta.revision),winner,
    'Android conflict recovery did not adopt newer authoritative revision');

  // Check no auth/device keys escaped into either remote master or history.
  cloudSafety('After recovery');
  for(const h of backend.history){
    const keys=Object.keys(h.snapshot?.localStorage||{});
    ok(keys.every(k=>!PRIVATE_PATTERN.test(k)),
      'Historical recovery backup contained auth or device key');
  }
  for(const d of [android,desktop])
    assert.deepEqual(d.errors,[],d.platform+' had browser runtime exceptions');

  console.log('GRANADA_GRANDE_REAL_BROWSER_PASS '+JSON.stringify({
    tracks:['actual-Android-Project-create-and-link',
      'actual-Android-Chapter-create','same-account-Windows-cloud-adoption',
      'canonical-Journal-XP-reverse','CAS-conflict-no-overwrite',
      'recoverable-displaced-private-writing','no-auth-secrets-in-history'],
    cloudRevision:winner,recoverableBackups:safety.length,
    mockSupabase:true,physicalGalaxy:false,publicRelease:false
  }));
}finally{
  await Promise.allSettled([android?.context?.close(),desktop?.context?.close()]);
  await browser.close();
}
