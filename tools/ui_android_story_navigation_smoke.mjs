import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

// Regression for the owner's real Android Direct 0.2.7 screenshot:
// Story / "Start a new chapter" was visible but navigation to Settings,
// continuing the chapter and accessing the Pomodoro were reported blocked.
// Tap REAL buttons in a 412x915 touchscreen viewport; do not bypass clicks
// by calling __mlvAndroidFastRoute in assertions.
const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const out='artifacts/android-ui-smoke/story-navigation';
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({
    viewport:{width:412,height:915},screen:{width:412,height:915},
    deviceScaleFactor:2.625,isMobile:true,hasTouch:true
  });
  await context.addInitScript(()=>{
    // A restored Story profile, including the native clock and a prefilled
    // first chapter form. Never import or export the user's actual data.
    localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
      version:2,activeTab:'story',xp:0,coins:0,totalCoinsEarned:0,
      settings:{characterName:'Michel',onboardingRequired:false,
        onboardingCompletedAt:'2026-10-01T12:00:00.000Z',v30200GenericProfile:true},
      missions:[{id:'story-tap-qa',name:'Story navigation QA',canonical:'story navigation qa',
        description:'',category:'academic',type:'daily',difficulty:'medium',
        xp:25,coins:0,days:[1,2,3,4,5],archived:false,hidden:false,
        createdAt:'2026-01-01T12:00:00.000Z',completions:[]}],
      goals:[],history:[],achievements:[],affirmations:[],owned:[],equipped:{}
    }));
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','en');
    localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>{
    // The error message alone hides which lazily rendered script is malformed.
    // Synthetic CI fixture only: include a bounded non-secret stack for triage.
    errors.push(String(e.stack||e.message).slice(0,900));
  });
  await mkdir(out,{recursive:true});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.__mlvAndroidFastRoute &&
    document.getElementById('mlv-android-bottom-nav') &&
    document.getElementById('mlv-android-topbar'),null,{timeout:60000});
  // Route through the actual *visible drawer button* if the legacy boot
  // normalizes activeTab to Today.
  if(!await page.locator('#tab-story.active').isVisible().catch(()=>false)){
    await page.locator('#mlv-android-menu-button').tap();
    const item=page.locator('#v30171PrimaryNav [data-tab="story"]');
    assert(await item.count()>0,'Story is absent from the real Android drawer');
    await item.tap();
    await page.waitForSelector('#tab-story.active',{state:'visible',timeout:10000});
  }
  assert(await page.locator('#tab-story .v30162-story-form').isVisible(),
    'Story / Start a new chapter form missing from real Android viewport');
  await page.screenshot({path:out+'/01-story-start.png'});

  const nav=page.locator('#mlv-android-bottom-nav');
  const pom=nav.locator('[data-mobile-tab="focus"]');
  assert(await pom.getAttribute('aria-label')==='Pomodoro',
    'Pomodoro must be explicitly labeled in the permanent bottom nav');
  assert(await pom.isVisible(),'Pomodoro is hidden in the Android sidebar');
  // Snapshot AFTER first native-webview-model boot; distinguish any seed
  // inserted at startup from mutations caused by real navigation taps.
  const baseline=await page.evaluate(()=>{
    const data=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
    return {
      missions:(data.missions||[]).map(x=>String(x.id)).sort(),
      goals:(data.goals||[]).map(x=>String(x.id)).sort()
    };
  });
  assert(baseline.goals.length===0,
    'Generic saved Android profile unexpectedly seeds Premium goals BEFORE navigation: '+JSON.stringify(baseline));
  // Real touchscreen press, not a synthetic JS router call.
  await nav.locator('[data-mobile-tab="settings"]').tap({timeout:12000});
  await page.waitForSelector('#tab-settings.active .v30171-settings-shell',
    {state:'visible',timeout:12000});
  assert(await page.locator('#mlv-android-section-title').textContent()
    .then(x=>/settings/i.test(x)), 'Settings title did not follow actual tap');
  await page.screenshot({path:out+'/02-settings-from-story.png'});

  await pom.tap({timeout:12000});
  await page.waitForSelector('#mlv-android-focus-overlay:not([hidden])',
    {state:'visible',timeout:12000});
  assert(await page.locator('#mlv-android-focus-heading')
    .textContent().then(s=>/pomodoro/i.test(s)),
    'Permanent Pomodoro button did not open the canonical timer');
  await page.screenshot({path:out+'/03-pomodoro-from-settings.png'});
  // Opening and leaving the Pomodoro may never restart an active session.
  await page.locator('#mlv-android-focus-sheet [data-mobile-focus="toggle"]').tap();
  const initialTimer=await page.evaluate(()=>({
    status:window.FocusStoryV30162?.focusState?.().status,
    deadline:window.FocusStoryV30162?.focusState?.().deadlineAt,
    remaining:window.FocusStoryV30162?.remaining?.()
  }));
  assert(initialTimer.status==='running'&&Number.isFinite(Number(initialTimer.deadline)),
    'Pomodoro did not start a real persistent canonical session');
  await page.locator('#mlv-android-focus-sheet [data-mobile-focus="close"]').tap();
  await page.waitForSelector('#mlv-android-focus-overlay:not([hidden])',
    {state:'hidden',timeout:8000});
  await page.waitForTimeout(1200);
  await pom.tap();
  await page.waitForSelector('#mlv-android-focus-overlay:not([hidden])',
    {state:'visible',timeout:8000});
  const resumedTimer=await page.evaluate(()=>({
    status:window.FocusStoryV30162?.focusState?.().status,
    deadline:window.FocusStoryV30162?.focusState?.().deadlineAt,
    remaining:window.FocusStoryV30162?.remaining?.()
  }));
  assert(resumedTimer.status==='running'&&
    resumedTimer.deadline===initialTimer.deadline&&
    resumedTimer.remaining<initialTimer.remaining,
    'Pomodoro restarted or stopped while navigating: '+
      JSON.stringify({initialTimer,resumedTimer}));
  await page.locator('#mlv-android-focus-sheet [data-mobile-focus="close"]').tap();

  // Return via drawer Story, then escape again using the actual header arrow.
  await page.locator('#mlv-android-menu-button').tap();
  await page.locator('#v30171PrimaryNav [data-tab="story"]').tap();
  await page.waitForSelector('#tab-story.active',{state:'visible',timeout:10000});
  const arrows=await page.evaluate(()=>({
    prev:document.getElementById('mlv-android-prev-section')?.disabled,
    next:document.getElementById('mlv-android-next-section')?.disabled
  }));
  assert(!arrows.prev || !arrows.next,
    'Story has BOTH section-navigation arrows disabled; user is trapped');
  await page.locator(arrows.next?'#mlv-android-prev-section':
    '#mlv-android-next-section').tap();
  await page.waitForFunction(()=>document.querySelector('#tab-story.active')===null,
    null,{timeout:12000});
  await nav.locator('[data-mobile-tab="dashboard"]').tap();
  await page.waitForSelector('#tab-dashboard.active',{state:'visible',timeout:12000});
  const preserved=await page.evaluate(()=>{
    const data=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
    return {missions:(data.missions||[]).map(x=>String(x.id)).sort(),
      goals:(data.goals||[]).map(x=>String(x.id)).sort()};
  });
  assert(JSON.stringify(preserved.missions)===JSON.stringify(baseline.missions),
    'Android tab switching mutated canonical mission identities');
  assert(JSON.stringify(preserved.goals)===JSON.stringify(baseline.goals),
    'Android tab switching unexpectedly inserted/removed Premium contracts');

  // Independently verify the real Start chapter submit is clickable, not
  // buried under the fixed Android bottom bar or a dead overlay.
  await page.locator('#mlv-android-menu-button').tap();
  await page.locator('#v30171PrimaryNav [data-tab="story"]').tap();
  await page.waitForSelector('#tab-story.active .v30162-story-form',
    {state:'visible',timeout:12000});
  const chapterName='Android Story Touch Regression';
  const nameField=page.locator('#tab-story .v30162-story-form input').first();
  await nameField.fill(chapterName);
  const mottoField=page.locator('#tab-story .v30162-story-form input[name="motto"]');
  const chapterMotto='Unfinished drafts must survive Android navigation';
  await mottoField.fill(chapterMotto);
  // Trigger the same real navigation as the owner's Galaxy recording:
  // leave an unfinished Chapter form, then return through the drawer.
  await mottoField.evaluate(field=>field.blur());
  await nav.locator('[data-mobile-tab="dashboard"]').tap();
  await page.waitForSelector('#tab-dashboard.active',{state:'visible',timeout:12000});
  await page.locator('#mlv-android-menu-button').tap();
  await page.locator('#v30171PrimaryNav [data-tab="story"]').tap();
  await page.waitForSelector('#tab-story.active #v30162ChapterForm',
    {state:'visible',timeout:12000});
  assert(await nameField.inputValue()===chapterName,
    'Unsubmitted Story chapter name was lost after mobile navigation');
  assert(await mottoField.inputValue()===chapterMotto,
    'Unsubmitted Story chapter motto was lost after mobile navigation');
  const start=page.locator('#tab-story .v30162-story-form button')
    .filter({hasText:/start chapter/i}).first();
  assert(await start.count()===1,'Real Start chapter button was not rendered');
  // Dismiss keyboard to reproduce tapping the CTA with the persistent
  // native bottom navigation actually visible. During IME editing the nav
  // intentionally has display:none and its bounding rect is 0,0,0,0.
  await nameField.evaluate(input=>input.blur());
  await page.waitForFunction(()=>getComputedStyle(
    document.getElementById('mlv-android-bottom-nav')).display!=='none',
    null,{timeout:5000});
  await start.scrollIntoViewIfNeeded();
  const touchTarget=await start.evaluate(button=>{
    const bar=document.getElementById('mlv-android-bottom-nav');
    const rect=button.getBoundingClientRect(),barRect=bar.getBoundingClientRect();
    const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const hit=document.elementFromPoint(cx,cy);
    return {buttonBottom:rect.bottom,barTop:barRect.top,
      centerIsButton:hit===button||button.contains(hit),inViewport:cy>0&&cy<innerHeight};
  });
  assert(touchTarget.buttonBottom<=touchTarget.barTop-5&&
    touchTarget.centerIsButton&&touchTarget.inViewport,
    'Story Start chapter submit is covered by mobile bar/overlay: '+JSON.stringify(touchTarget));
  await start.tap({timeout:12000});
  await page.waitForFunction(name=>document.querySelector('#tab-story')
    ?.textContent?.includes(name),chapterName,{timeout:12000});
  assert(errors.length===0,'Android Story/Pomodoro navigation page errors: '+errors.join(' | '));
  await page.screenshot({path:out+'/04-chapter-started.png'});
  console.log('PASS: Story form -> Settings -> Pomodoro continuous countdown -> Story arrows -> Today; draft survived real tab switches and chapter submit persisted');
}finally{await browser.close();}
