import assert from 'node:assert/strict';
import { chromium } from 'playwright';

/**
 * GRANADA GRANDE #28/#54/#55 — THREE joined product stories, two REAL
 * isolated Chromium runtimes, synthetic state, no production provider.
 *
 * A) Create Project with actual Android form -> share to Windows -> restart
 * B) Start Chapter through actual Android form -> share/restart/return
 * C) Journal+XP forward/backward + backup recovery and strict device secrets
 *
 * Both clients use the canonical frontend and shared-storage policy; this is
 * NOT a Galaxy or live Supabase-provider test. Refuse absent state or payload.
 */
const URL=process.env.MLV_UI_URL||'http://127.0.0.1:4174';
const KEY='vida_rpg_personal_progress_v2';
const JOURNAL_DATE='2026-10-20';
const PROJECT='GRANADA LARGE project from Android';
const CHAPTER='GRANADA LARGE chapter from Android';
const MOTTO='Synthetic chapter with real saved provenance';
const JOURNAL_A='SYNTHETIC_GRANADA_ANDROID_JOURNAL';
const JOURNAL_B='SYNTHETIC_GRANADA_WINDOWS_JOURNAL';
const MISSION='granada-large-linked-mission';
const SECRET_KEYS=[
  // Keys intentionally inert on reload: real Supabase sessions and device
  // identifiers may legitimately refresh/rotate on bootstrap; those are
  // separately guarded by the existing account/session privacy tests.
  'michelsLife.google.refreshToken',
  'michelsLife.local.notification.id',
  'michelsLife.unknown.future.privateKey',
  'michelsLife.internal.transient'
];
const browser=await chromium.launch({headless:true});
let android,desktop;

async function device(platform){
  const context=await browser.newContext({
    viewport:platform==='android'?{width:412,height:915}:{width:1280,height:850},
    isMobile:platform==='android',hasTouch:platform==='android'
  });
  await context.addInitScript(p=>{
    window.__MICHELSLIFE_PLATFORM__=p;
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    if(p==='android')window.MichelsLifeAndroid={postMessage(){}};
    if(!localStorage.getItem('vida_rpg_personal_progress_v2')){
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
        version:2,activeTab:'dashboard',xp:0,coins:0,totalCoinsEarned:0,
        settings:{characterName:'Michel',onboardingRequired:false,
          onboardingCompletedAt:'2026-10-01T12:00:00.000Z',v30200GenericProfile:true},
        missions:[{
          id:'granada-large-linked-mission',name:'Granada linked mission',
          canonical:'granada linked mission',description:'Synthetic only',
          category:'academic',type:'oneoff',difficulty:'medium',xp:25,
          coins:0,days:[],archived:false,hidden:false,
          createdAt:'2026-10-01T00:00:00.000Z',completions:[]
        }],
        goals:[],history:[],achievements:[],affirmations:[],owned:[],equipped:{}
      }));
    }
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','en');
    localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
  },platform);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>
    typeof state!=='undefined' && typeof window.save==='function' &&
    typeof window.MLVCloudSharedStorageV30216?.capture==='function' &&
    typeof window.MLVCloudSharedStorageV30216?.restore==='function' &&
    typeof window.GoogleCloudV30192?.capture==='function' &&
    typeof window.JournalV30189?.save==='function',null,{timeout:60000});
  return {platform,context,page,errors};
}

async function mobileRoute(id){
  const result=await android.page.evaluate(id=>window.__mlvAndroidFastRoute?.(id),id);
  assert.notEqual(result,false,'Mobile fast route rejected '+id);
  await android.page.waitForSelector('#tab-'+id+'.active',{state:'visible',timeout:12000});
}

async function payload(dev){
  return dev.page.evaluate(()=>{
    const policy=window.MLVCloudSharedStorageV30216;
    const shared=policy.capture();
    const backup=JSON.parse(window.GoogleCloudV30192.capture());
    const persisted=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'null');
    return {shared,backup,
      runtime:JSON.stringify(state),
      persistedXp:persisted?.xp,
      runtimeXp:state.xp,
      journal:window.JournalV30189.entry('2026-10-20')?.body||''
    };
  });
}

function checkDomain(packet,label,{project,chapter,journal,xp}){
  assert.ok(packet.shared && packet.backup?.localStorage && packet.backup.state,
    label+': expected canonical shareable and backup payloads');
  const shared=JSON.stringify(packet.shared);
  const backup=JSON.stringify(packet.backup);
  if(project){
    assert.ok(shared.includes(PROJECT) && backup.includes(PROJECT),
      label+': Project absent from shared+Drive backup');
  }
  if(chapter){
    assert.ok(shared.includes(CHAPTER) && backup.includes(CHAPTER) &&
      shared.includes(MOTTO),label+': Story chapter absent from backup');
  }
  assert.equal(packet.journal,journal,label+': canonical Journal payload drift');
  assert.equal(packet.runtimeXp,xp,label+': loaded XP changed');
  assert.equal(packet.persistedXp,xp,label+': persisted XP changed');
  assert.equal(packet.backup.state.xp,xp,label+': cloud backup XP changed');
  for(const source of [packet.shared,packet.backup.localStorage]){
    for(const key of SECRET_KEYS){
      assert.equal(Object.hasOwn(source,key),false,
        label+': forbidden device/auth key leaked into shared backup: '+key);
    }
  }
}

async function send(source,destination){
  const from=await payload(source);
  const result=await destination.page.evaluate(({shared,keys})=>{
    const policy=window.MLVCloudSharedStorageV30216;
    const before=Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)]));
    const hostile={...shared};
    keys.forEach((key,i)=>{hostile[key]='FOREIGN_DEVICE_SECRET_'+i;});
    policy.restore(hostile);
    const after=Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)]));
    const restoredString=String(localStorage.getItem('vida_rpg_personal_progress_v2')||'');
    const recapturedString=JSON.stringify(policy.capture());
    return {before,after,immediate:{
      projectInBoard:restoredString.includes('GRANADA LARGE project from Android'),
      chapterInBoard:restoredString.includes('GRANADA LARGE chapter from Android'),
      projectInRecapture:recapturedString.includes('GRANADA LARGE project from Android'),
      chapterInRecapture:recapturedString.includes('GRANADA LARGE chapter from Android'),
      boardLength:restoredString.length
    }};
  },{shared:from.shared,keys:SECRET_KEYS});
  assert.deepEqual(result.after,result.before,
    'Cross-device transfer overwrote the receiver auth, device or local secret');
  console.log('GRANADA_RESTORE_DIAG '+JSON.stringify({from:source.platform,to:destination.platform,
    immediate:result.immediate}));
  await destination.page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await destination.page.waitForFunction(()=>
    typeof state!=='undefined' && !!window.MLVCloudSharedStorageV30216?.capture &&
    !!window.JournalV30189?.entry, null,{timeout:60000});
  return from;
}

async function seedSyntheticDeviceSecrets(dev,prefix){
  return dev.page.evaluate(({keys,prefix})=>{
    for(const [index,key] of keys.entries()){
      localStorage.setItem(key,'SYNTHETIC_'+prefix+'_SECRET_'+index);
    }
    return Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)]));
  },{keys:SECRET_KEYS,prefix});
}

try{
  android=await device('android');
  desktop=await device('windows');

  // Android real DOM/submit: Project + link using the canonical modal.
  await mobileRoute('projects');
  await android.page.locator('#tab-projects [data-v30106-action="new-project"]').click();
  const form=android.page.locator('#modalRoot #v30106ProjectForm');
  await form.waitFor({state:'visible',timeout:12000});
  await form.locator('[name="name"]').fill(PROJECT);
  await form.locator('[name="description"]').fill('Synthetic regression for Android and Windows');
  const option=form.locator('.v30106-link-option input[type="checkbox"]').first();
  assert.equal(await option.count(),1,'Project editor did not expose canonical mission linkage');
  await option.check();
  await form.locator('button[type="submit"]').click();
  await android.page.waitForFunction(name=>
    [...document.querySelectorAll('#tab-projects .v30106-project-card h3')]
      .some(el=>el.textContent?.trim()===name),PROJECT,{timeout:12000});
  assert.equal(await form.count(),0,'Project modal failed to close on real Save');

  // Story: the real existing chapter creation form, no direct internal insert.
  await mobileRoute('story');
  const story=android.page.locator('#tab-story .v30162-story-form');
  await story.waitFor({state:'visible',timeout:12000});
  await story.locator('input').first().fill(CHAPTER);
  await story.locator('input[name="motto"]').fill(MOTTO);
  await story.locator('button').filter({hasText:/start chapter/i}).first().click();
  await android.page.waitForFunction(name=>
    document.querySelector('#tab-story')?.textContent?.includes(name),
    CHAPTER,{timeout:12000});

  // Canonical Journal and XP are independent data domains, not test-only maps.
  await android.page.evaluate(({date,body})=>{
    window.JournalV30189.save(date,'GRANADA phone journal',body);
    state.xp=117;
    window.save();
  },{date:JOURNAL_DATE,body:JOURNAL_A});
  await android.page.waitForFunction(date=>
    JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}').xp===117 &&
    window.JournalV30189.entry(date)?.body==='SYNTHETIC_GRANADA_ANDROID_JOURNAL',
    JOURNAL_DATE,{timeout:12000});

  const androidSecrets=await seedSyntheticDeviceSecrets(android,'ANDROID');
  const desktopSecrets=await seedSyntheticDeviceSecrets(desktop,'WINDOWS');
  const original=await payload(android);
  checkDomain(original,'Android original',{project:true,chapter:true,journal:JOURNAL_A,xp:117});
  const priorWindows=await payload(desktop); // explicit synthetic rollback point

  // Device A -> B, actual new browser bootstrap (same storage, no reset).
  await send(android,desktop);
  const win=await payload(desktop);
  console.log('GRANADA_RED_DIAG',JSON.stringify({
    originalProjectKeys:Object.keys(original.shared).filter(k=>String(original.shared[k]).includes(PROJECT)),
    receivedProjectKeys:Object.keys(win.shared).filter(k=>String(win.shared[k]).includes(PROJECT)),
    originalChapterKeys:Object.keys(original.shared).filter(k=>String(original.shared[k]).includes(CHAPTER)),
    receivedChapterKeys:Object.keys(win.shared).filter(k=>String(win.shared[k]).includes(CHAPTER)),
    originalShareKeys:Object.keys(original.shared).sort(),
    receivedShareKeys:Object.keys(win.shared).sort(),
    originalStateProject:original.runtime.includes(PROJECT),
    receivedStateProject:win.runtime.includes(PROJECT),
    originalBackupProject:JSON.stringify(original.backup).includes(PROJECT),
    receivedBackupProject:JSON.stringify(win.backup).includes(PROJECT)
  }));
  checkDomain(win,'Windows after Android import',{project:true,chapter:true,journal:JOURNAL_A,xp:117});
  assert.ok(win.runtime.includes(PROJECT),
    'Windows runtime did not hydrate Android canonical Project after restart');
  assert.ok(JSON.stringify(win.shared).includes(CHAPTER),
    'Windows did not retain canonical Chapter data on reload');
  assert.equal((JSON.parse(win.shared[KEY]||'{}').missions||[])
    .filter(m=>m.id===MISSION).length,1,
    'Mission linkage transfer duplicated/dropped canonical mission ID');

  // Device B edits two domains and returns them to Android without a shadow store.
  await desktop.page.evaluate(({date,body})=>{
    window.JournalV30189.save(date,'GRANADA Windows response',body);
    state.xp=124;
    window.save();
  },{date:JOURNAL_DATE,body:JOURNAL_B});
  const winEdited=await payload(desktop);
  checkDomain(winEdited,'Windows edited',{project:true,chapter:true,journal:JOURNAL_B,xp:124});
  await send(desktop,android);
  const androidAgain=await payload(android);
  checkDomain(androidAgain,'Android return',{project:true,chapter:true,journal:JOURNAL_B,xp:124});
  assert.ok(androidAgain.runtime.includes(PROJECT),
    'Android reload lost Project after roundtrip');
  assert.ok(JSON.stringify(androidAgain.shared).includes(CHAPTER),
    'Android reload lost Chapter after roundtrip');

  // Synthetic rollback: the originally captured shared map restores the
  // original Journal+XP without losing Project/Chapter or changing secrets.
  await android.page.evaluate(shared=>
    window.MLVCloudSharedStorageV30216.restore(shared),original.shared);
  await android.page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await android.page.waitForFunction(()=>
    !!window.MLVCloudSharedStorageV30216?.capture && !!window.JournalV30189?.entry,
    null,{timeout:60000});
  const recovered=await payload(android);
  checkDomain(recovered,'Android explicit backup recovery',
    {project:true,chapter:true,journal:JOURNAL_A,xp:117});

  // If the synthetic Windows pre-import backup is applied, the imported
  // Project/Chapter should not be left behind as partial/stale private data.
  await desktop.page.evaluate(shared=>
    window.MLVCloudSharedStorageV30216.restore(shared),priorWindows.shared);
  await desktop.page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await desktop.page.waitForFunction(()=>!!window.MLVCloudSharedStorageV30216?.capture,
    null,{timeout:60000});
  const winRolledBack=await payload(desktop);
  assert.ok(!JSON.stringify(winRolledBack.shared).includes(PROJECT) &&
    !JSON.stringify(winRolledBack.shared).includes(CHAPTER),
    'Windows explicit rollback left an imported project or chapter behind');

  for(const [dev,expected] of [[android,androidSecrets],[desktop,desktopSecrets]]){
    const local=await dev.page.evaluate(keys=>
      Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),SECRET_KEYS);
    assert.deepEqual(local,expected,dev.platform+' changed device-specific values');
    const final=await payload(dev);
    const captured=JSON.stringify(final.shared)+JSON.stringify(final.backup);
    for(const value of Object.values(expected))
      assert.ok(!captured.includes(value),dev.platform+' leaked private synthetic values');
    assert.deepEqual(dev.errors,[],dev.platform+' raised runtime errors');
  }
  console.log('GRANADA_LARGE_PROJECT_STORY_CLOUD_PASS '+JSON.stringify({
    tracks:['real-Android-Project-link','real-Android-Story-chapter',
      'Journal-and-XP-two-way','two-platform-relaunch','explicit-backup-recovery',
      'receiver-private-key-isolation'],
    mockProvider:true,physicalDevice:false,releasePublished:false
  }));
} finally{
  await Promise.allSettled([android?.context?.close(),desktop?.context?.close()]);
  await browser.close();
}
