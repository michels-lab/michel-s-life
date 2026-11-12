import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const ok=(value,message)=>{if(!value)throw Error(message);};
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.addInitScript(()=>{
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','es');
    localStorage.setItem('michelsLife.language.userOverrideBase.v1','es');
    localStorage.setItem('michelsLife.language.installDefault.v1','es');
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='es';
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.FocusStoryV30162?.focusState&&
    !!window.MichelsLifeFocusImmersive?.open&&
    !!document.querySelector('#mlv-desktop-focus-launcher'),null,{timeout:60000});

  // The screenshot regression: the old Focus dock was fixed above the
  // sidebar with a z-index higher than the new immersive workspace.
  // Force it to expand and prove both old surfaces remain truly nonvisual.
  const legacy=await page.evaluate(()=>{
    window.FocusStoryV30162.setFocusPanelExpanded(true);
    const old=document.getElementById('v30162FocusDock');
    const proto=document.getElementById('v30106Focus');
    const hidden=node=>!node||getComputedStyle(node).display==='none';
    return {
      oldExists:!!old,
      legacyHidden:hidden(old),
      oldEvents:old?getComputedStyle(old).pointerEvents:'none',
      oldProtoHidden:hidden(proto),
      retainedEngine:!!window.FocusStoryV30162.focusState
    };
  });
  ok(legacy.oldExists&&legacy.legacyHidden&&legacy.oldProtoHidden&&
    legacy.oldEvents==='none'&&legacy.retainedEngine,
    'Old Windows Pomodoro panel or sidebar trigger is still visible: '+JSON.stringify(legacy));

  // A theme wallpaper already installed in the app must be used as the
  // full-screen background. The immersive layer may shade it, not erase it.
  const opened=await page.evaluate(()=>{
    document.body.style.backgroundImage='url("assets/michels_life_app_icon.svg")';
    const good=window.MichelsLifeFocusImmersive.open();
    const layer=document.getElementById('mlv-desktop-focus-immersive');
    const rect=layer?.getBoundingClientRect();
    return {good,hidden:layer.hidden,width:rect?.width,height:rect?.height,
      painted:getComputedStyle(layer).backgroundImage,
      selected:layer.style.getPropertyValue('--mlv-focus-wallpaper')};
  });
  ok(opened.good&&opened.hidden===false&&opened.width>=1430&&opened.height>=895&&
     opened.selected?.includes('url(')&&opened.painted?.includes('url('),
    'Desktop Pomodoro did not cover app with its selected wallpaper: '+JSON.stringify(opened));
  ok(await page.evaluate(()=>{
    const focus=document.getElementById('mlv-desktop-focus-immersive');
    const old=document.getElementById('v30162FocusDock');
    return focus&&!focus.hidden&&getComputedStyle(focus).display!=='none'&&
      getComputedStyle(old).display==='none'&&
      Number(getComputedStyle(focus).zIndex)>1000000000;
  }), 'Desktop immersive view is not the only visible active Focus workspace');

  await page.locator('#mlv-desktop-focus-immersive [data-focus-action="toggle"]').click();
  await page.waitForFunction(()=>window.FocusStoryV30162.focusState().status==='running');
  const timer=await page.locator('#mlv-desktop-focus-clock').innerText();
  ok(/^\d{2}:\d{2}$/.test(timer),'Shared desktop timer is not visible: '+timer);
  await mkdir('artifacts/ui-smoke',{recursive:true});
  await page.screenshot({path:'artifacts/ui-smoke/desktop-focus-immersive.png'});

  await page.locator('#mlv-desktop-focus-immersive [data-focus-action="minimize"]').first().click();
  const minimized=await page.evaluate(()=>({
    closed:document.getElementById('mlv-desktop-focus-immersive').hidden,
    mini:!document.getElementById('mlv-desktop-mini-focus').hidden,
    running:window.FocusStoryV30162.focusState().status==='running'
  }));
  ok(minimized.closed&&minimized.mini&&minimized.running,
    'Minimizing desktop Focus stopped its canonical clock: '+JSON.stringify(minimized));

  await page.evaluate(()=>window.LeftNavV30171.route('missions'));
  await page.waitForSelector('#tab-missions.active',{state:'visible',timeout:15000});
  ok(await page.evaluate(()=>!document.getElementById('mlv-desktop-mini-focus').hidden),
    'Desktop mini Pomodoro disappeared during Missions navigation');

  await page.locator('#mlv-desktop-mini-focus [data-focus-action="toggle"]').click();
  await page.waitForFunction(()=>window.FocusStoryV30162.focusState().status==='paused');
  await page.locator('#mlv-desktop-mini-focus [data-focus-action="toggle"]').click();
  await page.waitForFunction(()=>window.FocusStoryV30162.focusState().status==='running');
  ok(await page.evaluate(()=>document.getElementById('mlv-desktop-focus-immersive').hidden),
    'Resume from minimized desktop Focus reopened fullscreen without user intent');
  await page.locator('#mlv-desktop-mini-focus [data-focus-action="open"]').click();
  ok(await page.evaluate(()=>!document.getElementById('mlv-desktop-focus-immersive').hidden),
    'Mini Focus failed to restore fullscreen desktop immersion');
  // Work and Break both own the entire application. A newly started Break
  // reopens immersion; deliberate minimization keeps the canonical session
  // running while navigation stays accessible.
  const breakStart=await page.evaluate(()=>{
    const engine=window.FocusStoryV30162;
    engine.skipFocus?.();
    engine.startFocus?.();
    window.MichelsLifeFocusImmersive?.refresh?.();
    const state=engine.focusState?.(),screen=document.getElementById('mlv-desktop-focus-immersive');
    return {mode:state?.mode,status:state?.status,fullscreen:!screen?.hidden,
      phase:document.getElementById('mlv-desktop-focus-mode')?.textContent};
  });
  ok(breakStart.mode==='break'&&breakStart.status==='running'&&breakStart.fullscreen&&
    /DESCANSO|BREAK/.test(breakStart.phase||''),
    'Desktop Break phase did not take over the entire app: '+JSON.stringify(breakStart));
  await page.locator('#mlv-desktop-focus-immersive [data-focus-action="minimize"]').first().click();
  ok(await page.evaluate(()=>document.getElementById('mlv-desktop-focus-immersive').hidden &&
    !document.getElementById('mlv-desktop-mini-focus').hidden),
    'Desktop Break mini-timer is not available after intentional minimize');
  // A deliberate minimize survives a document reload for the SAME running
  // phase; automatic full-screen behavior returns with the NEXT phase.
  const breakDeadline=await page.evaluate(()=>window.FocusStoryV30162.focusState().deadlineAt);
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.MichelsLifeFocusImmersive?.open&&
    !!document.getElementById('mlv-desktop-mini-focus'),null,{timeout:60000});
  await page.waitForTimeout(650);
  const restored=await page.evaluate(()=>({
    mode:window.FocusStoryV30162.focusState()?.mode,
    deadline:window.FocusStoryV30162.focusState()?.deadlineAt,
    full:!document.getElementById('mlv-desktop-focus-immersive').hidden,
    mini:!document.getElementById('mlv-desktop-mini-focus').hidden
  }));
  ok(restored.mode==='break'&&restored.deadline===breakDeadline&&
    !restored.full&&restored.mini,
    'Desktop reload ignored intentional minimized Break: '+JSON.stringify(restored));
  await page.evaluate(()=>window.FocusStoryV30162?.resetFocus?.());


  console.log('PASS: desktop fullscreen selected wallpaper, canonical timer, intentional mini, Missions nav, pause/resume and restore');
}finally{await browser.close();}
