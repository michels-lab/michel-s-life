import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const screenshot=process.env.MLV_ANDROID_UI_SCREENSHOT||'artifacts/ui-smoke/android-mobile.png';
function ok(value,message){if(!value)throw new Error(message)}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({
    viewport:{width:412,height:915},
    screen:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true
  });
  const page=await context.newPage();

  await page.addInitScript(()=>{
    try{
      const existing={
        version:2,
        settings:{characterName:'Michel',onboardingRequired:true,onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
        xp:10,coins:0,totalCoinsEarned:0,activeTab:'dashboard',
        missions:[{id:'smoke-mission',name:'Android smoke mission',canonical:'android smoke mission',description:'',category:'physical',type:'daily',difficulty:'medium',xp:25,coins:0,priority:'media',days:[1,2,3,4,5],deadline:'',fixed:false,boss:false,archived:false,hidden:false,noSuggest:false,createdAt:'2026-01-01T12:00:00.000Z',completions:[]}],
        history:[],owned:[],equipped:{},achievements:[],goals:[],affirmations:[]
      };
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(existing));
      localStorage.removeItem('michelsLife.onboarding.v30200');
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('michelsLife.language.installDefault.v1','en');
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
  });

  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(
    ()=>document.documentElement.dataset.mlvPlatform==='android' &&
        document.getElementById('mlv-android-topbar') &&
        document.getElementById('v30171Sidebar') &&
        document.getElementById('v30171PrimaryNav'),
    null,{timeout:60000}
  );

  await page.waitForTimeout(700);

  const existingOnboardingProbe=await page.evaluate(()=>{
    const rect=el=>{const r=el?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};
    const root=document.getElementById('mlv200Onboarding');
    const first=root?.querySelector('.mlv200-focus input[type="checkbox"]');
    const card=root?.querySelector('.mlv200-onboard-card');
    return {
      visible:!!(root&&root.getClientRects().length&&getComputedStyle(root).display!=='none'),
      root:rect(root),card:rect(card),checkbox:rect(first),
      grid:root?.querySelector('.mlv200-focus-grid')?getComputedStyle(root.querySelector('.mlv200-focus-grid')).gridTemplateColumns:''
    };
  });
  if(existingOnboardingProbe.visible){
    ok(existingOnboardingProbe.card&&existingOnboardingProbe.card.width<=412,'Fresh Android onboarding card overflows phone viewport: '+JSON.stringify(existingOnboardingProbe));
    ok(existingOnboardingProbe.checkbox&&existingOnboardingProbe.checkbox.width<=24&&existingOnboardingProbe.checkbox.height<=24,'Fresh Android onboarding checkbox is stretched: '+JSON.stringify(existingOnboardingProbe));
  }

  // Reproduce the user's real case: an existing Michel's Life profile whose local onboarding flag is stale/missing.
  await page.evaluate(()=>{
    const key='vida_rpg_personal_progress_v2';
    let saved={};
    try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){}
    saved.settings={...(saved.settings||{}),characterName:'Michel',onboardingRequired:true};
    localStorage.setItem(key,JSON.stringify(saved));
    localStorage.removeItem('michelsLife.onboarding.v30200');
  });
  await page.waitForFunction(()=>!document.getElementById('mlv200Onboarding'),null,{timeout:2500});

  const initialActive=await page.evaluate(()=>document.querySelector('#v30171PrimaryNav [aria-current="page"]')?.dataset?.tab||
    document.querySelector('#v30171PrimaryNav .active[data-tab]')?.dataset?.tab||'');
  if(initialActive!=='dashboard'){
    await page.evaluate(()=>document.querySelector('#v30171PrimaryNav [data-tab="dashboard"]')?.click());
    await page.waitForTimeout(350);
  }

  const initial=await page.evaluate(()=>{
    const rect=el=>{const r=el?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};
    const topbar=document.getElementById('mlv-android-topbar');
    const oldTop=document.querySelector('.topbar');
    const sidebar=document.getElementById('v30171Sidebar');
    const main=document.getElementById('main');
    const firstCard=main?.querySelector('.card');
    const status=document.getElementById('fixedStatusBar');
    return {
      topbar:rect(topbar),
      topbarDisplay:getComputedStyle(topbar).display,
      oldTopDisplay:oldTop?getComputedStyle(oldTop).display:'',
      sidebar:rect(sidebar),
      sidebarTransform:getComputedStyle(sidebar).transform,
      sidebarPosition:getComputedStyle(sidebar).position,
      sidebarParent:sidebar?.parentElement?.tagName||'',
      sidebarZ:Number.parseInt(getComputedStyle(sidebar).zIndex||'0',10)||0,
      backdropZ:Number.parseInt(getComputedStyle(document.getElementById('mlv-android-drawer-backdrop')).zIndex||'0',10)||0,
      onboardingVisible:(()=>{const el=document.getElementById('mlv200Onboarding');return !!(el&&el.getClientRects().length&&getComputedStyle(el).display!=='none')})(),
      onboardingExists:!!document.getElementById('mlv200Onboarding'),
      prevExists:!!document.getElementById('mlv-android-prev-section'),
      nextExists:!!document.getElementById('mlv-android-next-section'),
      actionDock:rect(document.getElementById('v30175ActionDock')),
      actionDockParent:document.getElementById('v30175ActionDock')?.parentElement?.id||'',
      quickFab:rect(document.getElementById('v30106QuickFab')),
      focusFab:rect(document.getElementById('v30175FocusFab')),
      focusDock:rect(document.getElementById('v30162FocusDock')),
      activeStatus:rect(document.getElementById('v176StatusPanel')),
      activeStatusMaxHeight:getComputedStyle(document.getElementById('v176StatusPanel')).maxHeight,
      appChildren:Array.from(document.querySelector('.app')?.children||[]).map(el=>({
        id:el.id||'',cls:String(el.className||''),display:getComputedStyle(el).display,
        position:getComputedStyle(el).position,rect:rect(el)
      })),
      main:rect(main),
      firstCard:rect(firstCard),
      status:rect(status),
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      viewportHeight:window.innerHeight,
      active:document.querySelector('#v30171PrimaryNav [aria-current="page"]')?.dataset?.tab||
             document.querySelector('#v30171PrimaryNav .active[data-tab]')?.dataset?.tab||''
    };
  });

  ok(initial.topbarDisplay!=='none','Android top bar is hidden: '+JSON.stringify(initial));
  ok(initial.topbar&&initial.topbar.top<=1&&initial.topbar.height>=50,'Android top bar geometry is invalid: '+JSON.stringify(initial));
  ok(initial.oldTopDisplay==='none','Desktop top bar is still consuming phone space: '+JSON.stringify(initial));
  ok(initial.sidebar&&initial.sidebar.right<=8,'Android drawer is visible before opening: '+JSON.stringify(initial));
  ok(initial.sidebarPosition==='fixed','Android drawer is still participating in document flow: '+JSON.stringify(initial));
  ok(initial.sidebarParent==='BODY','Android drawer is trapped inside a desktop stacking context: '+JSON.stringify(initial));
  ok(initial.sidebarZ>initial.backdropZ,'Android drawer can be dimmed by its own backdrop: '+JSON.stringify(initial));
  ok(!initial.onboardingVisible,'Desktop onboarding overlay reappeared on Android: '+JSON.stringify(initial));
  ok(initial.prevExists&&initial.nextExists,'Android section navigation arrows are missing: '+JSON.stringify(initial));
  if(initial.actionDock){
    ok(initial.actionDockParent==='v30171Sidebar','Android action dock is not contained by the drawer: '+JSON.stringify(initial));
    ok(initial.actionDock.right<=8,'Closed Android drawer leaves quick actions over app content: '+JSON.stringify(initial));
  }
  if(initial.focusDock)ok(initial.focusDock.width===0&&initial.focusDock.height===0,'Legacy Focus dock still occupies Android content space: '+JSON.stringify(initial));
  // Preserve a real screenshot for diagnosing user-visible layout drift when a regression gate fails.
  await mkdir(dirname(screenshot),{recursive:true});
  await page.screenshot({path:screenshot.endsWith('.png')?screenshot.slice(0,-4)+'-initial-dashboard.png':screenshot+'-initial-dashboard.png'});
  const preCardGeometry=await page.evaluate(()=>{
    const main=document.getElementById('main'),card=main?.querySelector('.card');
    const all=Array.from(main?.querySelectorAll('section,header,.card')||[])
      .filter(x=>x.getBoundingClientRect().height>0&&x.getBoundingClientRect().bottom<card?.getBoundingClientRect().top+3)
      .slice(0,8).map(x=>({tag:x.tagName,id:x.id,className:String(x.className||'').slice(0,120),top:x.getBoundingClientRect().top,height:x.getBoundingClientRect().height,text:(x.innerText||'').trim().slice(0,100)}));
    return {items:all,mainTop:main?.getBoundingClientRect().top,cardTop:card?.getBoundingClientRect().top};
  });
  ok(initial.main&&initial.main.top<190,'Primary content starts too low and still requires an initial scroll: '+JSON.stringify(initial));
  // A real first-run "pending mission from yesterday" carry-over prompt
  // appears ABOVE Today's card and adds ~147px. Treat the prompt as content,
  // never as an unexplained blank gap or a license to hide user reminders.
  const carryoverPrompt=await page.evaluate(()=>{
    const main=document.getElementById('main');
    const card=main?.querySelector('.card');
    const buttons=Array.from(main?.querySelectorAll('button')||[]);
    const decline=buttons.find(x=>/Do not move anything/i.test(x.textContent||''));
    const accept=buttons.find(x=>/Move all without duplicates/i.test(x.textContent||''));
    const bb=x=>{const b=x?.getBoundingClientRect();return b?{top:b.top,bottom:b.bottom,width:b.width,height:b.height}:null};
    const a=bb(decline),b=bb(accept),c=bb(card);
    return {visible:!!(a&&b&&c&&a.width>30&&b.width>30&&a.bottom<=c.top&&b.bottom<=c.top),
      decline:a,accept:b,card:c,bodyContains:!!main?.textContent?.includes('pending mission from yesterday')};
  });
  const firstCardMaxTop=carryoverPrompt.visible?410:240;
  ok(initial.firstCard&&initial.firstCard.top<firstCardMaxTop,
    'First dashboard card starts too low, accounting for actionable carry-over prompt: '+JSON.stringify({initial,carryoverPrompt,preCardGeometry}));
  ok(initial.overflow<=2,'Android page has horizontal overflow: '+JSON.stringify(initial));

  // Real phone screenshot regression: the 4 metrics used to stack vertically,
  // consuming the viewport before the first mission. Require a true 2x2 grid.
  const mobileDashboardDensity=await page.evaluate(()=>{
    const grid=document.querySelector('#tab-dashboard .v131-kpis');
    const cards=[...(grid?.querySelectorAll(':scope > .v131-kpi')||[])];
    const rectangles=cards.map(card=>{const r=card.getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,bottom:r.bottom,height:r.height,width:r.width}});
    const bounds=grid?.getBoundingClientRect();
    return {
      found:!!grid,count:cards.length,columns:grid?getComputedStyle(grid).gridTemplateColumns:'',
      height:bounds?.height||0,cards:rectangles
    };
  });
  ok(mobileDashboardDensity.found&&mobileDashboardDensity.count===4,
    'Missing canonical Today/Contracts/Level/Week indicators on Android: '+JSON.stringify(mobileDashboardDensity));
  ok(Math.abs(mobileDashboardDensity.cards[0].top-mobileDashboardDensity.cards[1].top)<=3 &&
    mobileDashboardDensity.cards[1].left>mobileDashboardDensity.cards[0].left+40 &&
    Math.abs(mobileDashboardDensity.cards[2].top-mobileDashboardDensity.cards[3].top)<=3 &&
    mobileDashboardDensity.cards[2].top>mobileDashboardDensity.cards[0].top+35 &&
    mobileDashboardDensity.height<245,
    'Android Dashboard metrics still stack in an oversized desktop column: '+JSON.stringify(mobileDashboardDensity));


  await page.locator('#mlv-android-menu-button').click();
  await page.waitForTimeout(260);
  const drawerOpen=await page.evaluate(()=>{
    const s=document.getElementById('v30171Sidebar').getBoundingClientRect();
    const d=document.getElementById('v30175ActionDock')?.getBoundingClientRect();
    return {
      bodyOpen:document.body.classList.contains('mlv-android-nav-open'),
      left:s.left,right:s.right,width:s.width,
      actionDock:d?{left:d.left,top:d.top,right:d.right,bottom:d.bottom,width:d.width,height:d.height}:null,
      expanded:document.getElementById('mlv-android-menu-button')?.getAttribute('aria-expanded')
    };
  });
  ok(drawerOpen.bodyOpen&&drawerOpen.left>=-2&&drawerOpen.expanded==='true','Drawer did not open correctly: '+JSON.stringify(drawerOpen));
  if(drawerOpen.actionDock)ok(drawerOpen.actionDock.left>=-2&&drawerOpen.actionDock.right<=drawerOpen.right+2,'Quick actions are not contained inside the open Android drawer: '+JSON.stringify(drawerOpen));

  await page.locator('#mlv-android-drawer-backdrop').click({position:{x:400,y:300}});
  await page.waitForTimeout(240);
  ok(!(await page.evaluate(()=>document.body.classList.contains('mlv-android-nav-open'))),'Backdrop did not close drawer');

  await page.locator('#mlv-android-next-section').click();
  await page.waitForFunction(
    ()=>document.querySelector('#v30171PrimaryNav [data-tab="missions"]')?.classList.contains('active') ||
        document.querySelector('#v30171PrimaryNav [data-tab="missions"]')?.getAttribute('aria-current')==='page',
    null,{timeout:5000}
  );
  await page.waitForFunction(
    ()=>window.__mlvAndroidLastSwitch?.tab==='missions' && window.__mlvAndroidLastSwitch?.active==='missions',
    null,{timeout:5000}
  );
  await page.waitForFunction(()=>window.__mlvAndroidLastSwitch?.tab==='missions',null,{timeout:5000});
  const arrowSwitch=await page.evaluate(()=>window.__mlvAndroidLastSwitch||null);
  ok(arrowSwitch&&arrowSwitch.active==='missions','Android next-section arrow did not route to Missions: '+JSON.stringify(arrowSwitch));
  ok(arrowSwitch.elapsedMs<1500,'Android section switch exceeded 1500 ms in smoke environment: '+JSON.stringify(arrowSwitch));
  await page.locator('#mlv-android-prev-section').click();
  await page.waitForFunction(
    ()=>document.querySelector('#v30171PrimaryNav [data-tab="dashboard"]')?.classList.contains('active') ||
        document.querySelector('#v30171PrimaryNav [data-tab="dashboard"]')?.getAttribute('aria-current')==='page',
    null,{timeout:5000}
  );

  const missionSelector='article.v132-mission, article.v137-mission, article.mission-card, article.quest-card';
  const missionCount=await page.locator(missionSelector).count();
  ok(missionCount>0,'No mission/checklist rows rendered on Dashboard');
  const missionGeometry=await page.locator(missionSelector).first().evaluate(card=>{
    const rect=el=>{const r=el?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};
    const check=card.querySelector('.v132-check');
    const content=card.querySelector(':scope > div');
    const title=card.querySelector('h3');
    const actions=card.querySelector('.v132-mission-actions,.v132-actions,.v131-actions,.quest-actions,.actions');
    return {
      card:rect(card),check:rect(check),content:rect(content),title:rect(title),actions:rect(actions),
      columns:getComputedStyle(card).gridTemplateColumns,
      actionsColumn:actions?getComputedStyle(actions).gridColumnStart:'',
      overflow:card.scrollWidth-card.clientWidth
    };
  });
  ok(missionGeometry.check&&missionGeometry.check.width>=43&&missionGeometry.check.height>=43,'Mission checkbox must provide a 44px-class touch target: '+JSON.stringify(missionGeometry));
  ok(missionGeometry.content&&missionGeometry.check.right<=missionGeometry.content.left+2,'Mission checkbox overlaps content: '+JSON.stringify(missionGeometry));
  ok(missionGeometry.title&&Math.abs(missionGeometry.check.top-missionGeometry.title.top)<18,'Mission checkbox/title are vertically crooked: '+JSON.stringify(missionGeometry));
  ok(missionGeometry.overflow<=2,'Mission card horizontally overflows: '+JSON.stringify(missionGeometry));
  if(missionGeometry.actions){
    ok(missionGeometry.actions.left>=missionGeometry.content.left-2,'Mission actions are falling into the checkbox column: '+JSON.stringify(missionGeometry));
  }

  const missionEditTouchTargets=await page.locator('article.v132-mission .v132-action-btn').first().evaluate(el=>{
    const r=el.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right};
  });
  ok(missionEditTouchTargets.width>=43&&missionEditTouchTargets.height>=43,
    'Mission row action buttons must be accessible to a finger: '+JSON.stringify(missionEditTouchTargets));
  // Mission editing must be a genuine mobile interaction and save to the
  // same canonical mission data as the Windows editor. Check touch targets,
  // scrollable form and sticky Save, not merely the existence of CSS.
  const firstMissionEdit=page.locator(
    'article.v132-mission [data-action="edit"], article.quest-card [data-action="edit-mission"], article.mission-card [data-action="edit-mission"]'
  ).first();
  ok(await firstMissionEdit.count()>0,'No working mission edit action on Android Today');
  await firstMissionEdit.click();
  await page.waitForSelector('#modalRoot #missionEditForm',{state:'visible',timeout:5000});
  const missionEditGeometry=await page.evaluate(()=>{
    const form=document.querySelector('#modalRoot #missionEditForm');
    const modal=document.querySelector('#modalRoot .modal');
    const save=form?.querySelector('.actions button[type="submit"]');
    const name=form?.querySelector('input[name="name"]');
    const days=[...(form?.querySelectorAll('label.day-chip')||[])];
    const box=el=>{const r=el?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}:null};
    return {
      modal:box(modal),save:box(save),name:box(name),
      font:name?parseFloat(getComputedStyle(name).fontSize):0,
      days:days.slice(0,8).map(box),cols:form?.querySelector('.form-grid')?getComputedStyle(form.querySelector('.form-grid')).gridTemplateColumns:'',
      modalScrollable:!!modal&&modal.scrollHeight>modal.clientHeight,
      scrollTop:modal?.scrollTop||0,viewport:innerHeight
    };
  });
  ok(missionEditGeometry.modal&&missionEditGeometry.modal.top>=0&&
    missionEditGeometry.modal.bottom<=916&&missionEditGeometry.modal.width<=412,
    'Android Mission editor is clipped by viewport or navigation bar: '+JSON.stringify(missionEditGeometry));
  ok(missionEditGeometry.name?.height>=47&&missionEditGeometry.font>=16&&
    missionEditGeometry.days.length>=7&&missionEditGeometry.days.every(r=>r?.height>=44),
    'Android Mission form controls are too small for touch and keyboard: '+JSON.stringify(missionEditGeometry));
  ok(missionEditGeometry.modalScrollable,'Android Mission editor must scroll independently to all options: '+JSON.stringify(missionEditGeometry));
  await page.locator('#missionEditForm input[name="name"]').fill('Android edited canonical mission');
  await page.locator('#missionEditForm textarea[name="description"]').fill('Mobile mission editor saves actual shared state');
  await page.locator('#missionEditForm .day-chip:has(input[name="days"][value="6"])').click();
  await page.locator('#missionEditForm .actions button[type="submit"]').scrollIntoViewIfNeeded();
  const missionSaveBounds=await page.evaluate(()=>{
    const modal=document.querySelector('#modalRoot .modal'),btn=document.querySelector('#missionEditForm .actions button[type="submit"]');
    const r=btn?.getBoundingClientRect();return {top:r?.top,bottom:r?.bottom,width:r?.width,modalScroll:modal?.scrollTop};
  });
  ok(missionSaveBounds.bottom<=915&&missionSaveBounds.top>=0&&missionSaveBounds.width>=115,
    'Android Mission Save is hidden below the system navigation bar: '+JSON.stringify(missionSaveBounds));
  await page.locator('#missionEditForm .actions button[type="submit"]').click();
  await page.waitForFunction(()=>{
    const data=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
    return data.missions?.some(m=>
      m.name==='Android edited canonical mission'&&
      m.description==='Mobile mission editor saves actual shared state'&&
      m.days?.includes(6));
  },null,{timeout:6500});
  ok(await page.locator('#modalRoot #missionEditForm').count()===0,
    'Mission editor did not dismiss after canonical state persisted');

  // Settings was the slowest Android transition because legacy code rebuilt it repeatedly.
  await page.evaluate(()=>window.__mlvAndroidFastRoute?.('settings'));
  await page.waitForFunction(
    ()=>!!document.getElementById('tab-settings') && (
      document.querySelector('#v30171PrimaryNav [data-tab="settings"]')?.classList.contains('active') ||
      document.querySelector('#v30171PrimaryNav [data-tab="settings"]')?.getAttribute('aria-current')==='page' ||
      document.getElementById('mlv-android-section-title')?.textContent?.trim()==='Settings'
    ),
    null,{timeout:5000}
  );
  await page.waitForFunction(
    ()=>window.__mlvAndroidLastSwitch?.tab==='settings',
    null,{timeout:5000}
  );
  const settingsSwitch=await page.evaluate(()=>window.__mlvAndroidLastSwitch||null);
  ok(settingsSwitch?.router==='android-render-main','Settings did not use Android fast route: '+JSON.stringify(settingsSwitch));
  ok(Number(settingsSwitch?.elapsedMs||99999)<1000,'Settings switch exceeded 1000 ms: '+JSON.stringify(settingsSwitch));
  const settingsAndroidState=await page.evaluate(()=>{
    const rect=el=>{const r=el?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};
    const drawer=document.getElementById('v30171Sidebar');
    const dock=document.getElementById('v30175ActionDock');
    const quick=document.getElementById('v30106QuickFab');
    const focus=document.getElementById('v30162FocusDock');
    return {
      onboardingVisible:(()=>{const el=document.getElementById('mlv200Onboarding');return !!(el&&el.getClientRects().length&&getComputedStyle(el).display!=='none')})(),
      drawer:rect(drawer),actionDock:rect(dock),quick:rect(quick),focus:rect(focus),
      actionDockParent:dock?.parentElement?.id||'',
      quickParent:quick?.parentElement?.id||''
    };
  });
  ok(!settingsAndroidState.onboardingVisible,'Existing user onboarding reappeared in Settings: '+JSON.stringify(settingsAndroidState));
  if(settingsAndroidState.actionDock)ok(settingsAndroidState.actionDock.right<=0&&settingsAndroidState.actionDockParent==='v30171Sidebar','Action dock is not safely off-canvas inside drawer in Settings: '+JSON.stringify(settingsAndroidState));
  if(settingsAndroidState.quick)ok(settingsAndroidState.quick.right<=0,'Quick Capture is visible over Settings: '+JSON.stringify(settingsAndroidState));
  if(settingsAndroidState.focus)ok(settingsAndroidState.focus.width===0||settingsAndroidState.focus.right<=0,'Focus control is visible over Settings: '+JSON.stringify(settingsAndroidState));

  const actionDockState=await page.evaluate(()=>{
    const dock=document.getElementById('v30175ActionDock');
    return {
      exists:!!dock,
      parentId:dock?.parentElement?.id||'',
      position:dock?getComputedStyle(dock).position:'',
      hint:document.getElementById('mlv-android-drawer-hint')?.textContent||''
    };
  });
  ok(actionDockState.exists&&actionDockState.parentId==='v30171Sidebar','Android Action Dock is not inside the drawer: '+JSON.stringify(actionDockState));
  ok(actionDockState.position==='sticky','Android Action Dock still floats over content: '+JSON.stringify(actionDockState));
  ok(/Swipe/.test(actionDockState.hint),'Android drawer does not explain swipe/arrow navigation: '+JSON.stringify(actionDockState));

  // Native Settings is not a 13-row desktop sidebar on a phone: the category
  // picker must be horizontally scrollable, and actual Sync/Google sections
  // must be reachable by a vertical document scroll above Android navigation.
  await page.waitForSelector('#tab-settings .v30171-settings-nav [data-v30171-setting="sync"]',{state:'visible',timeout:5000});
  const settingsPhoneGeometry=await page.evaluate(()=>{
    const nav=document.querySelector('#tab-settings .v30171-settings-nav');
    const sync=nav?.querySelector('[data-v30171-setting="sync"]');
    const google=nav?.querySelector('[data-v30171-setting="google"]');
    const content=document.querySelector('#tab-settings .v30171-settings-content');
    const bounds=e=>{const r=e?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};
    const doc=document.scrollingElement;
    return {picker:bounds(nav),sync:bounds(sync),google:bounds(google),
      pickerOverflow:nav?.scrollWidth-nav?.clientWidth,
      content:bounds(content),documentHeight:doc?.scrollHeight,
      viewportHeight:innerHeight,documentOverflow:getComputedStyle(doc).overflowY,
      contentOverflow:content?getComputedStyle(content).overflowY:''};
  });
  ok(settingsPhoneGeometry.picker&&settingsPhoneGeometry.picker.height<94,
    'Settings category selector still fills the entire phone display: '+JSON.stringify(settingsPhoneGeometry));
  ok(settingsPhoneGeometry.sync&&settingsPhoneGeometry.google&&
    settingsPhoneGeometry.sync.left>=0&&settingsPhoneGeometry.sync.right<=412&&
    settingsPhoneGeometry.google.left>=0&&settingsPhoneGeometry.google.right<=412,
    'Sync and Google are not immediately reachable on Android: '+JSON.stringify(settingsPhoneGeometry));
  ok(settingsPhoneGeometry.content&&settingsPhoneGeometry.content.top<420,
    'Settings content begins below the phone fold: '+JSON.stringify(settingsPhoneGeometry));
  await page.evaluate(()=>window.scrollTo(0,document.scrollingElement.scrollHeight));
  await page.waitForTimeout(250);
  const settingsScroll=await page.evaluate(()=>({
    scrolled:document.scrollingElement.scrollTop,
    available:document.scrollingElement.scrollHeight-innerHeight,
    contentBottom:document.querySelector('#tab-settings .v30171-settings-content')?.getBoundingClientRect().bottom
  }));
  ok(settingsScroll.available>120&&settingsScroll.scrolled>100,
    'Settings document is still locked and cannot scroll to Sync/Google content: '+JSON.stringify({settingsScroll,settingsPhoneGeometry}));
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.locator('#tab-settings .v30171-settings-nav [data-v30171-setting="sync"]').click();
  await page.waitForFunction(()=>{
    const pane=document.querySelector('#tab-settings [data-v30171-pane="sync"]');
    return pane&&pane.getBoundingClientRect().height>20;
  },null,{timeout:5000});
  await page.locator('#tab-settings .v30171-settings-nav [data-v30171-setting="google"]').click();
  await page.waitForFunction(()=>{
    const pane=document.querySelector('#tab-settings [data-v30171-pane="google"]');
    return pane&&pane.getBoundingClientRect().height>20;
  },null,{timeout:5000});
  await page.screenshot({path:screenshot.endsWith('.png')?screenshot.slice(0,-4)+'-settings-mobile-scroll.png':screenshot+'-settings-mobile-scroll.png'});


  // Phone-owned navigation must be genuinely usable in the first viewport.
  await page.waitForSelector('#mlv-android-bottom-nav [data-mobile-tab="focus"]',{state:'visible'});
  const mobileNav=await page.evaluate(()=>{
    const nav=document.getElementById('mlv-android-bottom-nav');
    const bounds=nav?.getBoundingClientRect();
    return {count:nav?.querySelectorAll('button[data-mobile-tab]').length,
      geometry:bounds?{top:bounds.top,bottom:bounds.bottom,width:bounds.width,height:bounds.height}:null,
      tabs:[...(nav?.querySelectorAll('button[data-mobile-tab]')||[])].map(el=>el.dataset.mobileTab)};
  });
  ok(mobileNav.count===5&&mobileNav.geometry&&mobileNav.geometry.bottom<=916&&mobileNav.geometry.top>780,
    'Mobile navigation is not touch-accessible above bottom system area: '+JSON.stringify(mobileNav));
  ok(mobileNav.tabs.join(',')==='dashboard,missions,focus,calendar,settings',
    'Mobile primary destinations diverged from platform navigation contract: '+JSON.stringify(mobileNav));
  await page.locator('#mlv-android-bottom-nav [data-mobile-tab="focus"]').click();
  await page.waitForSelector('#mlv-android-focus-overlay:not([hidden])',{state:'visible'});
  const focusStart=await page.evaluate(()=>({
    sharedReady:!!window.FocusStoryV30162?.focusState,
    time:document.getElementById('mlv-android-focus-time')?.textContent,
    status:window.FocusStoryV30162?.focusState?.().status,
    hasDuplicateStore:window.MichelsLifeMobileExperience?.focusState!==undefined
  }));
  ok(focusStart.sharedReady&&focusStart.time?.includes(':')&&focusStart.status==='ready'&&!focusStart.hasDuplicateStore,
    'Mobile Focus must use existing shared Pomodoro state: '+JSON.stringify(focusStart));
  await page.locator('#mlv-android-focus-overlay [data-mobile-focus="toggle"]').click();
  await page.waitForFunction(()=>window.FocusStoryV30162?.focusState?.().status==='running');
  const startedFocus=await page.evaluate(()=>({
    deadline:window.FocusStoryV30162.focusState().deadlineAt,
    status:window.FocusStoryV30162.focusState().status,
    stored:JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}').v30162FocusTimer?.status
  }));
  ok(Number(startedFocus.deadline)>Date.now()&&startedFocus.stored==='running',
    'Android Focus did not start/persist authoritative desktop timer: '+JSON.stringify(startedFocus));
  await page.locator('#mlv-android-focus-overlay [data-mobile-focus="toggle"]').click();
  await page.waitForFunction(()=>window.FocusStoryV30162?.focusState?.().status==='paused');
  const pausedFocus=await page.evaluate(()=>({
    status:window.FocusStoryV30162.focusState().status,
    stored:JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}').v30162FocusTimer?.status,
    remaining:window.FocusStoryV30162.remaining()
  }));
  ok(pausedFocus.stored==='paused'&&pausedFocus.remaining>0,
    'Android Focus did not pause/persist the shared timer: '+JSON.stringify(pausedFocus));
  ok(await page.evaluate(()=>window.__mlvAndroidHandleBack?.()),'Android Back did not close Focus sheet');
  ok(await page.evaluate(()=>document.getElementById('mlv-android-focus-overlay').hidden),
    'Mobile Focus remained over content after system Back');
  await page.locator('#mlv-android-bottom-nav [data-mobile-tab="missions"]').click();
  await page.waitForFunction(()=>
    !!document.getElementById('tab-missions') && (
      document.querySelector('#v30171PrimaryNav [data-tab="missions"]')?.classList.contains('active') ||
      document.querySelector('#v30171PrimaryNav [data-tab="missions"]')?.getAttribute('aria-current')==='page'
    ),null,{timeout:5000});
  ok(await page.evaluate(()=>document.querySelector('#mlv-android-bottom-nav [data-mobile-tab="missions"]')?.getAttribute('aria-current')==='page'),
    'Mobile nav did not reflect Missions selection');

  // Real touch-first Quick Capture: the phone header action must work from
  // Missions and must reuse shared mission and Journal engines.
  await page.waitForSelector('#mlv-android-capture-button',{state:'visible'});
  const captureButton=await page.evaluate(()=>{
    const r=document.getElementById('mlv-android-capture-button')?.getBoundingClientRect();
    const title=document.querySelector('#mlv-android-section-title')?.getBoundingClientRect();
    return {button:r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null,
      title:title?{left:title.left,right:title.right}:null};
  });
  ok(captureButton.button&&captureButton.button.width>=42&&captureButton.button.height>=42&&
    captureButton.button.right<=412&&captureButton.button.top>=0&&
    captureButton.title?.right<=captureButton.button.left+2,
    'Android Quick Capture header overlaps page title or misses touch-safe bounds: '+JSON.stringify(captureButton));
  await page.locator('#mlv-android-capture-button').click();
  await page.waitForSelector('[data-mlv216-qc]:not([hidden])',{state:'visible'});
  const captureSheet=await page.evaluate(()=>{
    const root=document.querySelector('[data-mlv216-qc]:not([hidden])');
    const card=root?.querySelector('.mlv216-qc-card');
    const input=root?.querySelector('[data-mlv216-qc-input]');
    const save=root?.querySelector('[data-mlv216-qc-save]');
    const r=el=>{const b=el?.getBoundingClientRect();return b?{top:b.top,bottom:b.bottom,left:b.left,right:b.right,height:b.height,width:b.width}:null};
    return {card:r(card),save:r(save),input:r(input),fontSize:input?parseFloat(getComputedStyle(input).fontSize):0};
  });
  ok(captureSheet.card&&captureSheet.card.top>=0&&captureSheet.card.bottom<=916&&
    captureSheet.card.width<=412&&captureSheet.save?.bottom<=916&&
    captureSheet.input?.height>=45&&captureSheet.fontSize>=16,
    'Mobile Quick Capture is a clipped desktop modal rather than keyboard-safe bottom sheet: '+JSON.stringify(captureSheet));
  ok(await page.evaluate(()=>window.__mlvAndroidHandleBack?.()),
    'Android system Back did not consume open Quick Capture');
  ok(await page.evaluate(()=>document.querySelector('[data-mlv216-qc]')?.hidden),
    'Quick Capture remained open after native system Back');
  await page.locator('#mlv-android-capture-button').click();
  await page.locator('[data-mlv216-qc] [data-mlv216-qc-type]').selectOption('mission');
  await page.locator('[data-mlv216-qc] [data-mlv216-qc-input]').fill('Android quick capture parity mission');
  await page.locator('[data-mlv216-qc] [data-mlv216-qc-save]').click();
  await page.waitForFunction(()=>{
    const state=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
    return state.missions?.some(m=>m.name==='Android quick capture parity mission');
  },null,{timeout:6000});
  ok(await page.evaluate(()=>document.querySelector('[data-mlv216-qc]')?.hidden),
    'Quick Capture did not close after saving the shared mission');
  await page.locator('#mlv-android-capture-button').click();
  await page.locator('[data-mlv216-qc] [data-mlv216-qc-type]').selectOption('journal');
  await page.locator('[data-mlv216-qc] [data-mlv216-qc-input]').fill('Android quick capture parity journal note');
  await page.locator('[data-mlv216-qc] [data-mlv216-qc-save]').click();
  await page.waitForFunction(()=>{
    const d=new Date(),two=n=>String(n).padStart(2,'0');
    const today=d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate());
    const api=window.JournalV30189||window.JournalV30188||window.JournalV30184;
    return String(api?.entry?.(today)?.body||'').includes('Android quick capture parity journal note');
  },null,{timeout:6000});
  ok(await page.evaluate(()=>document.querySelector('[data-mlv216-qc]')?.hidden),
    'Quick Capture did not close after writing to the canonical Journal');
  await page.screenshot({path:screenshot.endsWith('.png')?screenshot.slice(0,-4)+'-mobile-shell.png':screenshot+'-mobile-shell.png'});


  await page.evaluate(()=>window.__mlvAndroidFastRoute?.('dashboard'));
  await page.waitForFunction(
    ()=>!!document.getElementById('tab-dashboard') && (
      document.querySelector('#v30171PrimaryNav [data-tab="dashboard"]')?.classList.contains('active') ||
      document.querySelector('#v30171PrimaryNav [data-tab="dashboard"]')?.getAttribute('aria-current')==='page' ||
      document.getElementById('mlv-android-section-title')?.textContent?.trim()==='Dashboard'
    ),
    null,{timeout:5000}
  );

  console.log('ANDROID_GEOMETRY '+JSON.stringify({initial,drawerOpen,missionGeometry,settingsSwitch}));

  const cdp=await context.newCDPSession(page);
  async function touchSwipe(x1,y1,x2,y2){
    await cdp.send('Input.dispatchTouchEvent',{
      type:'touchStart',
      touchPoints:[{x:x1,y:y1,radiusX:2,radiusY:2,force:1,id:1}]
    });
    await page.waitForTimeout(30);
    await cdp.send('Input.dispatchTouchEvent',{
      type:'touchMove',
      touchPoints:[{x:(x1+x2)/2,y:(y1+y2)/2,radiusX:2,radiusY:2,force:1,id:1}]
    });
    await page.waitForTimeout(30);
    await cdp.send('Input.dispatchTouchEvent',{
      type:'touchMove',
      touchPoints:[{x:x2,y:y2,radiusX:2,radiusY:2,force:1,id:1}]
    });
    await page.waitForTimeout(20);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(320);
  }

  // Find a genuinely non-interactive point before swiping.
  // Inputs/buttons intentionally keep their own gestures and must never trigger section navigation.
  const swipePoint=await page.evaluate(()=>{
    const blocked=el=>!!el?.closest?.('button,a,input,select,textarea,label,[contenteditable="true"],.modal,.v132-actions,.actions,.v134-ach-filter,.v140-cat-shortcuts,.v140-library-toggle,[data-horizontal-scroll],.tabs');
    const x=window.innerWidth-22;
    for(let y=136;y<Math.min(window.innerHeight-120,760);y+=18){
      const el=document.elementFromPoint(x,y);
      if(el&&!blocked(el))return {x,y,tag:el.tagName,cls:String(el.className||'')};
    }
    return {x,y:136,tag:'fallback',cls:''};
  });
  await touchSwipe(swipePoint.x,swipePoint.y,110,swipePoint.y);
  try{
    await page.waitForFunction(
      ()=>document.querySelector('#v30171PrimaryNav [data-tab="missions"]')?.classList.contains('active') ||
          document.querySelector('#v30171PrimaryNav [data-tab="missions"]')?.getAttribute('aria-current')==='page',
      null,{timeout:5000}
    );
  }catch(error){
    const debug=await page.evaluate(()=>({
      gesture:window.__mlvAndroidGestureDebug||null,
      active:document.querySelector('#v30171PrimaryNav [aria-current="page"]')?.dataset?.tab||
             document.querySelector('#v30171PrimaryNav .active[data-tab]')?.dataset?.tab||'',
      targetAtStart:(()=>{const el=document.elementFromPoint(swipePoint.x,swipePoint.y);return el?{tag:el.tagName,cls:String(el.className||''),text:String(el.textContent||'').trim().slice(0,120)}:null})(),
      swipePoint
    }));
    throw new Error('Swipe did not navigate to Missions: '+JSON.stringify(debug));
  }
  const swipeState=await page.evaluate(()=>({
    active:document.querySelector('#v30171PrimaryNav [aria-current="page"]')?.dataset?.tab||
           document.querySelector('#v30171PrimaryNav .active[data-tab]')?.dataset?.tab||'',
    title:document.getElementById('mlv-android-section-title')?.textContent?.trim()||''
  }));
  ok(swipeState.active==='missions','Left swipe did not move to Missions: '+JSON.stringify(swipeState));

  await touchSwipe(5,720,105,720);
  ok(await page.evaluate(()=>document.body.classList.contains('mlv-android-nav-open')),'Left-edge swipe did not open drawer');
  await touchSwipe(300,720,120,720);
  ok(!(await page.evaluate(()=>document.body.classList.contains('mlv-android-nav-open'))),'Swipe-left did not close open drawer');

  const beforeFrame=await page.evaluate(()=>Number(document.getElementById('v30146Canvas')?.dataset?.frame||0));
  await sleep(260);
  const afterFrame=await page.evaluate(()=>Number(document.getElementById('v30146Canvas')?.dataset?.frame||0));
  if(beforeFrame>0)ok(afterFrame>beforeFrame,'Seasonal animation stalled in Android mobile viewport: '+JSON.stringify({beforeFrame,afterFrame}));

  const freshContext=await browser.newContext({
    viewport:{width:412,height:915},
    screen:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true
  });
  const fresh=await freshContext.newPage();
  await fresh.addInitScript(()=>{
    try{
      localStorage.removeItem('vida_rpg_personal_progress_v2');
      localStorage.removeItem('michelsLife.onboarding.v30200');
      localStorage.setItem('michelsLife.language.v1','en');
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
    // Temporary regression diagnostics: capture the source of unintended
    // palette writes, including JS stacks, without changing app behavior.
    window.__mlPaletteWrites=[];
    const nativeSet=CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty=function(k,v,p){
      if(k==='--accent'){
        const w=window.__mlPaletteWrites;
        if(w&&w.length<300)w.push({value:String(v),stack:String(new Error().stack).split(/\n/).slice(1,9).join(' | ')});
      }
      return nativeSet.call(this,k,v,p);
    };
  });
  await fresh.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await fresh.waitForSelector('#mlv200Onboarding',{state:'visible',timeout:60000});
  await fresh.waitForTimeout(350);
  // Focus checkboxes live on onboarding step 2, not the initial name/theme step.
  if(!(await fresh.locator('#mlv200Onboarding .mlv200-focus input[type="checkbox"]').count())){
    const next=fresh.locator('#mlv200Onboarding [data-mlv200-onboard="next"]');
    ok(await next.count(),'Fresh onboarding has no Continue button');
    await fresh.waitForTimeout(1600);
    const colorState=()=>fresh.evaluate(()=>{
      const tokens=['--accent','--ui-accent-rgb','--ui-panel-rgb','--ui-card-rgb','--ui-gold-rgb'];
      const get=(el)=>Object.fromEntries(tokens.map(k=>[k,getComputedStyle(el).getPropertyValue(k).trim()]));
      const card=document.querySelector('#mlv200Onboarding .mlv200-onboard-card');
      return {html:get(document.documentElement),body:get(document.body),card:card?get(card):null,
        cardBackground:card?getComputedStyle(card).backgroundImage:null,
        savedTheme:localStorage.getItem('michelsLifeTheme.v343')||'',
        chosenWorld:document.querySelector('[data-mlv200-theme].active')?.getAttribute('data-mlv200-theme')||null
      };
    });
    const colorsStep1=await colorState();
    await next.click();
    await fresh.waitForTimeout(900);
    const colorsStep2=await colorState();
    const paletteTrace=await fresh.evaluate(()=>({
      writes:(window.__mlPaletteWrites||[]).slice(-24),
      persisted:Object.fromEntries(['michelsLifeTheme.v3000','michelsLife.theme.v343','michelsLife.themePreset.v343','michelsLifeTheme.v343'].map(k=>[k,localStorage.getItem(k)])),
      settings:{onboardingRequired:window.state?.settings?.onboardingRequired,
        v3000Theme:window.state?.settings?.v3000Theme,
        v133Theme:window.state?.settings?.v133Theme}
    }));
    console.log('ANDROID_ONBOARD_THEME_STEP1_TO_STEP2',JSON.stringify({colorsStep1,colorsStep2,paletteTrace}));
    ok(JSON.stringify(colorsStep1.html)===JSON.stringify(colorsStep2.html)&&
       JSON.stringify(colorsStep1.body)===JSON.stringify(colorsStep2.body)&&
       JSON.stringify(colorsStep1.card)===JSON.stringify(colorsStep2.card)&&
       colorsStep1.cardBackground===colorsStep2.cardBackground,
       'Unexpected Android onboarding palette recolor on Continue: '+JSON.stringify({colorsStep1,colorsStep2}));
  }
  await fresh.waitForSelector('#mlv200Onboarding .mlv200-focus input[type="checkbox"]',{state:'visible',timeout:5000});
  const freshInstallOnboarding=await fresh.evaluate(()=>{
    const root=document.getElementById('mlv200Onboarding');
    const input=root?.querySelector('.mlv200-focus input[type="checkbox"]');
    const row=input?.closest('.mlv200-focus');
    const ir=input?.getBoundingClientRect(),rr=row?.getBoundingClientRect();
    const visible=!!(root&&root.getClientRects().length&&getComputedStyle(root).display!=='none');
    return {visible,checkbox:ir?{width:ir.width,height:ir.height}:null,row:rr?{width:rr.width,height:rr.height}:null};
  });
  ok(freshInstallOnboarding.visible,'Fresh-install onboarding disappeared before focus step');
  ok(freshInstallOnboarding.checkbox&&freshInstallOnboarding.checkbox.width<=24&&freshInstallOnboarding.checkbox.height<=24,'Fresh-install onboarding checkbox is oversized: '+JSON.stringify(freshInstallOnboarding));
  ok(freshInstallOnboarding.row&&freshInstallOnboarding.row.height<=64,'Fresh-install onboarding row is too tall: '+JSON.stringify(freshInstallOnboarding));

  // Regression: actual phone screenshot showed bottom Continue under Android's
  // navigation overlay and the permanent app topbar bleeding through the wizard.
  // Test hit-testing and progression, not mere presence of an enabled button.
  await fresh.waitForFunction(()=>!!document.querySelector('#mlv200Onboarding .mlv-android-onboard-scroll'),null,{timeout:5000});
  const onboardingActionGeometry=await fresh.evaluate(()=>{
    const root=document.querySelector('#mlv200Onboarding');
    const card=root?.querySelector('.mlv200-onboard-card');
    const scroll=root?.querySelector('.mlv-android-onboard-scroll');
    const actions=root?.querySelector('.mlv200-onboard-actions');
    const next=root?.querySelector('[data-mlv200-onboard="next"]');
    const header=document.getElementById('mlv-android-topbar');
    const rc=e=>{const x=e?.getBoundingClientRect();return x?{left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width,height:x.height}:null};
    const buttonRect=next?.getBoundingClientRect();
    const hit=buttonRect?document.elementFromPoint(buttonRect.left+buttonRect.width/2,buttonRect.top+buttonRect.height/2):null;
    return {viewport:{width:innerWidth,height:innerHeight},root:rc(root),card:rc(card),scroll:rc(scroll),actions:rc(actions),next:rc(next),
      hitAction:!!hit?.closest('[data-mlv200-onboard="next"]'),hiddenByNativeChrome:header?getComputedStyle(header).visibility==='hidden':true,
      nextDisabled:!!next?.disabled,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  ok(onboardingActionGeometry.scroll?.height>100,'Android onboarding lacks a bounded content scroller: '+JSON.stringify(onboardingActionGeometry));
  ok(onboardingActionGeometry.hiddenByNativeChrome,'Android app navigation obscures the onboarding wizard: '+JSON.stringify(onboardingActionGeometry));
  ok(onboardingActionGeometry.next&&!onboardingActionGeometry.nextDisabled,'Continue missing or disabled despite checked goals: '+JSON.stringify(onboardingActionGeometry));
  ok(onboardingActionGeometry.hitAction,'Continue is not the topmost touch target: '+JSON.stringify(onboardingActionGeometry));
  ok(onboardingActionGeometry.next.bottom<=onboardingActionGeometry.viewport.height-35,'Continue is beneath Android navigation gesture area: '+JSON.stringify(onboardingActionGeometry));
  ok(onboardingActionGeometry.overflow<=2,'Onboarding introduced horizontal overflow: '+JSON.stringify(onboardingActionGeometry));

  const themeBeforeTap=await fresh.evaluate(()=>({
    palette:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    stored:localStorage.getItem('michelsLifeTheme.v343')||'',
    background:document.body.className
  }));
  await fresh.locator('#mlv200Onboarding .mlv200-focus input[type="checkbox"]').nth(2).click();
  const themeAfterTap=await fresh.evaluate(()=>({
    palette:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    stored:localStorage.getItem('michelsLifeTheme.v343')||'',
    background:document.body.className
  }));
  ok(JSON.stringify(themeBeforeTap)===JSON.stringify(themeAfterTap),
    'Choosing focus unexpectedly changed theme colors: '+JSON.stringify({themeBeforeTap,themeAfterTap}));
  await mkdir(dirname(screenshot),{recursive:true});
  await fresh.screenshot({path:screenshot.endsWith('.png')?screenshot.slice(0,-4)+'-onboarding-step2.png':screenshot+'-onboarding-step2.png'});

  await fresh.locator('#mlv200Onboarding [data-mlv200-onboard="next"]').click({timeout:5000});
  await fresh.waitForSelector('#mlv200Schedule',{state:'visible',timeout:5000});
  const finishGeometry=await fresh.evaluate(()=>{
    const btn=document.querySelector('#mlv200Onboarding [data-mlv200-onboard="finish"]');
    const b=btn?.getBoundingClientRect();
    const top=b?document.elementFromPoint(b.left+b.width/2,b.top+b.height/2):null;
    return {button:!!btn,disabled:!!btn?.disabled,touchable:!!top?.closest('[data-mlv200-onboard="finish"]'),
      bottom:b?.bottom,viewport:innerHeight};
  });
  ok(finishGeometry.button&&!finishGeometry.disabled&&finishGeometry.touchable&&finishGeometry.bottom<=finishGeometry.viewport-35,
    'Finish setup is still trapped beneath Android navigation: '+JSON.stringify(finishGeometry));
  await fresh.locator('#mlv200Onboarding [data-mlv200-onboard="finish"]').click({timeout:5000});
  await fresh.waitForFunction(()=>!document.getElementById('mlv200Onboarding'),null,{timeout:5000});
  ok(await fresh.evaluate(()=>localStorage.getItem('michelsLife.onboarding.v30200')==='done'),
    'Android onboarding did not persist completion after real Continue and Finish clicks');
  await freshContext.close();

  // PC-hosted Android emulator / landscape validation.
  // A wide WebView must keep the Android shell instead of reverting to the desktop layout.
  const wideContext=await browser.newContext({
    viewport:{width:1536,height:864},
    screen:{width:1536,height:864},
    deviceScaleFactor:1,
    isMobile:false,
    hasTouch:true
  });
  const wide=await wideContext.newPage();
  await wide.addInitScript(()=>{
    try{
      const existing={
        version:2,
        settings:{characterName:'Michel',onboardingRequired:false,onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
        xp:10,coins:0,totalCoinsEarned:0,activeTab:'dashboard',
        missions:[{id:'wide-mission',name:'Wide Android smoke mission',canonical:'wide android smoke mission',description:'',category:'physical',type:'daily',difficulty:'medium',xp:25,coins:0,priority:'media',days:[1,2,3,4,5],deadline:'',fixed:false,boss:false,archived:false,hidden:false,noSuggest:false,createdAt:'2026-01-01T12:00:00.000Z',completions:[]}],
        history:[],owned:[],equipped:{},achievements:[],goals:[],affirmations:[]
      };
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(existing));
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
  });
  await wide.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await wide.waitForFunction(
    ()=>document.documentElement.dataset.mlvPlatform==='android' &&
        document.getElementById('mlv-android-topbar') &&
        getComputedStyle(document.getElementById('mlv-android-topbar')).display!=='none' &&
        document.getElementById('v30171Sidebar'),
    null,{timeout:60000}
  );
  await wide.waitForTimeout(700);
  const wideState=await wide.evaluate(()=>{
    const rect=el=>{const r=el?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};
    const side=document.getElementById('v30171Sidebar');
    const top=document.getElementById('mlv-android-topbar');
    const main=document.getElementById('main');
    const oldTop=document.querySelector('.topbar');
    return {
      topbar:rect(top),topbarDisplay:getComputedStyle(top).display,
      sidebar:rect(side),sidebarPosition:getComputedStyle(side).position,
      main:rect(main),mainMaxWidth:getComputedStyle(main).maxWidth,
      desktopTop:oldTop?getComputedStyle(oldTop).display:'',
      onboardingVisible:(()=>{const el=document.getElementById('mlv200Onboarding');return !!(el&&el.getClientRects().length&&getComputedStyle(el).display!=='none')})(),
      overflow:document.documentElement.scrollWidth-window.innerWidth
    };
  });
  ok(wideState.topbarDisplay!=='none','Wide Android emulator fell back to desktop UI: '+JSON.stringify(wideState));
  ok(wideState.desktopTop==='none','Desktop topbar is visible in wide Android emulator: '+JSON.stringify(wideState));
  ok(wideState.sidebarPosition==='fixed'&&wideState.sidebar&&wideState.sidebar.right<=8,'Wide Android drawer is not fixed/off-canvas: '+JSON.stringify(wideState));
  ok(wideState.main&&wideState.main.top<200,'Wide Android main content starts too low: '+JSON.stringify(wideState));
  ok(wideState.main&&wideState.main.width<=1182,'Wide Android content is not bounded for emulator/landscape: '+JSON.stringify(wideState));
  ok(!wideState.onboardingVisible,'Existing profile onboarding appeared in wide Android emulator: '+JSON.stringify(wideState));
  ok(wideState.overflow<=2,'Wide Android emulator has horizontal overflow: '+JSON.stringify(wideState));

  await wide.evaluate(()=>window.__mlvAndroidFastRoute?.('settings'));
  await wide.waitForFunction(()=>window.__mlvAndroidLastSwitch?.tab==='settings',null,{timeout:5000});
  const wideSettingsSwitch=await wide.evaluate(()=>window.__mlvAndroidLastSwitch||null);
  ok(wideSettingsSwitch?.router==='android-render-main','Wide Android Settings did not use fast route: '+JSON.stringify(wideSettingsSwitch));
  ok(Number(wideSettingsSwitch?.elapsedMs||99999)<1000,'Wide Android Settings switch exceeded 1000 ms: '+JSON.stringify(wideSettingsSwitch));
  await wideContext.close();

  await mkdir(dirname(screenshot),{recursive:true});
  await page.screenshot({path:screenshot,fullPage:true});
  console.log(JSON.stringify({
    ok:true,
    viewport:{width:412,height:915},
    existingOnboardingProbe,
    freshInstallOnboarding,
    wideState,
    wideSettingsSwitch,
    initial,
    drawerOpen,
    missionGeometry,
    settingsSwitch,
    settingsAndroidState,
    actionDockState,
    arrowSwitch,
    swipeState,
    animation:{beforeFrame,afterFrame}
  },null,2));
}finally{
  await browser.close();
}
