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

  // No legacy dock or pre-Pomodoro overlay may be created at all.
  // Keep the canonical FocusStory timer API, but assert source retirement.
  const legacy=await page.evaluate(()=>{
    window.FocusStoryV30162.setFocusPanelExpanded(true);
    return {
      oldExists:!!document.getElementById('v30162FocusDock'),
      prototypeExists:!!document.getElementById('v30106Focus'),
      deadActionExists:!!document.getElementById('v30175FocusFab'),
      quickCaptureExists:!!document.getElementById('v30106QuickFab'),
      retainedEngine:!!window.FocusStoryV30162.focusState
    };
  });
  ok(!legacy.oldExists&&!legacy.prototypeExists&&!legacy.deadActionExists&&
    legacy.quickCaptureExists&&legacy.retainedEngine,
    'Legacy Focus UI must be absent, not hidden: '+JSON.stringify(legacy));

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
    const stage=focus?.querySelector('.mlv-focus-stage');
    const style=stage?getComputedStyle(stage):null;
    const alpha=Number(style?.backgroundColor.match(/,\s*([\d.]+)\)$/)?.[1]);
    return focus&&!focus.hidden&&getComputedStyle(focus).display!=='none'&&
      !old&&!!stage&&style.backdropFilter==='none'&&
      alpha>0.1&&alpha<0.7&&
      Number(getComputedStyle(focus).zIndex)>1000000000;
  }), 'Desktop immersive view is not the only visible active Focus workspace');

  // Owner screenshot was 976×737: Focus must be an intentionally composed
  // workspace, not an oversized clock + cramped/overflowing button strip.
  await page.setViewportSize({width:976,height:737});
  const compact=await page.evaluate(()=>{
    const stage=document.querySelector('#mlv-desktop-focus-immersive .mlv-focus-stage');
    const clock=document.querySelector('#mlv-desktop-focus-clock');
    const buttons=[...stage.querySelectorAll(':scope > .mlv-focus-actions button')];
    const rect=r=>({x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom});
    const bounds=stage.getBoundingClientRect();
    const digits=document.createRange();digits.selectNodeContents(clock);
    return {stage:rect(bounds),clock:rect(digits.getBoundingClientRect()),
      buttonRects:buttons.map(b=>rect(b.getBoundingClientRect())),
      stageWidth:stage.scrollWidth,clientWidth:stage.clientWidth,
      clockFont:parseFloat(getComputedStyle(clock).fontSize),
      audioCollapsed:!stage.querySelector('.mlv-focus-sound-details').open,
      affirmationsVisible:stage.querySelectorAll('#mlv-desktop-focus-motivation .mlv-motivation-line:not([hidden])').length===2,
      stageHeight:stage.scrollHeight,clientHeight:stage.clientHeight,
      cssEvidence:(()=>{
        const computed=getComputedStyle(stage),parent=getComputedStyle(stage.parentElement);
        const css=document.getElementById('mlv-desktop-focus-css')?.textContent||'';
        return {sourceWidthFix:css.includes('width:min(800px,calc(100vw - 48px))'),
          renderedWidth:computed.width,computedMaxWidth:computed.maxWidth,
          renderedMinWidth:computed.minWidth,display:computed.display,
          boxSizing:computed.boxSizing,inline:stage.getAttribute('style')||'',
          parentWidth:stage.parentElement.getBoundingClientRect().width,
          parentDisplay:parent.display,gridColumns:parent.gridTemplateColumns,
          viewport:window.innerWidth,
          styleLoaded:!!document.getElementById('mlv-desktop-focus-css')?.sheet,
          styleRules:(()=>{
            const target=document.getElementById('mlv-desktop-focus-css');
            try{return [...(target?.sheet?.cssRules||[])].filter(rule=>rule.cssText.includes('.mlv-focus-stage')).slice(0,4).map(rule=>({selector:rule.selectorText||'',css:rule.cssText.slice(0,500)}));}
            catch(error){return [String(error)];}
          })(),
          winningCandidates:[...document.styleSheets].flatMap((sheet,index)=>{
            try{return [...sheet.cssRules].filter(rule=>rule.selectorText&&rule.selectorText.includes('mlv-focus-stage')&&
              (()=>{try{return stage.matches(rule.selectorText);}catch{return false;}})()).map(rule=>({
                sheet:index,selector:rule.selectorText,display:rule.style?.getPropertyValue('display'),
                width:rule.style?.getPropertyValue('width'),height:rule.style?.getPropertyValue('height'),
                maxWidth:rule.style?.getPropertyValue('max-width')
              })).slice(-8);}
            catch{return [];}
          }).slice(-16)
        };
      })()};
  });
  await mkdir('artifacts/ui-smoke',{recursive:true});
  await page.screenshot({path:'artifacts/ui-smoke/desktop-focus-976x737-owner-viewport.png'});
  ok(compact.stage.w<=976&&compact.stage.w>610&&compact.stage.h>=460&&compact.stage.h<=713&&
     compact.clientWidth>610, 'Focus stage does not fit owner screenshot: '+JSON.stringify(compact));
  ok(compact.clockFont>=65&&compact.clockFont<=115&&
     compact.clock.right<compact.stage.right-15&&compact.clock.x>compact.stage.x+15,
     'Clock too big or clipped at owner viewport: '+JSON.stringify(compact));
  ok(compact.stageWidth<=compact.clientWidth+3&&compact.audioCollapsed&&compact.affirmationsVisible&&compact.stageHeight<=compact.clientHeight+3&&compact.clock.bottom<=737,
     'Visual controls introduce overflow or cover timer: '+JSON.stringify(compact));
  for(let i=0;i<compact.buttonRects.length;i++){
    const button=compact.buttonRects[i];
    ok(button.right<compact.stage.right+2&&button.x>=compact.stage.x-2&&button.h>=40,
      'Primary action clipped at owner viewport: '+JSON.stringify({button,compact}));
  }

  await page.setViewportSize({width:1440,height:900});

  // Real browser interaction, not a static API test: open the collapsed audio
  // panel, choose an end chime, preview it, and play/stop the A+C atmosphere.
  await page.locator('.mlv-focus-sound-details > summary').click();
  const audioLayout=await page.locator('.mlv-focus-audio-panel').evaluate(panel=>{
    const [playback,library]=Array.from(panel.children);
    if(!playback||!library)return null;
    const a=playback.getBoundingClientRect(),b=library.getBoundingClientRect();
    return {columns:panel.children.length,playbackWidth:a.width,libraryWidth:b.width,separate:b.left>=a.right,topGap:Math.abs(a.top-b.top),overflow:panel.scrollWidth>panel.clientWidth+2};
  });
  ok(audioLayout&&audioLayout.columns===2&&audioLayout.playbackWidth>0&&audioLayout.libraryWidth>0&&audioLayout.separate&&audioLayout.topGap<3&&!audioLayout.overflow,
    'Desktop audio columns are not both usable: '+JSON.stringify(audioLayout));
  ok(await page.locator('[data-mlv-completion-sound]').count()===0,'Legacy completion picker still visible');
  ok(await page.locator('[data-mlv-audio="toggle-ambient"]').evaluate(el=>!el.closest('details')),'Ambient play must stay outside drawer');
  const scenes=await page.locator('[data-mlv-scene-select] option').evaluateAll(options=>options.map(o=>o.value));
  ok(scenes.length===26&&['moonlight','celestial','orbit','aurora','observatory','library','afterglow','silver','mozart_k545','tchaikovsky_op39'].every(id=>scenes.includes(id)),'Ambient catalog missing tracks');
  await page.locator('[data-mlv-scene-select]').selectOption('library');
  await page.locator('[data-mlv-audio="toggle-ambient"]').click();
  ok(await page.evaluate(()=>window.MichelsLifeFocusAudio.playing()),
    'Soundscape Play did not start the actual Web Audio scheduler');
  await page.locator('[data-mlv-audio="toggle-ambient"]').click();
  ok(await page.evaluate(()=>{const a=window.MichelsLifeFocusAudio;return a.playing()&&a.playingScene()==='library'&&a.ambientPlayback()?.paused===true;}),
    'Soundscape Pause did not preserve the active selection');
  await page.locator('[data-mlv-audio="toggle-ambient"]').click();
  ok(await page.evaluate(()=>window.MichelsLifeFocusAudio.ambientPlayback()?.paused===false),
    'Soundscape Resume did not resume the scheduler');
  await page.locator('[data-mlv-audio="stop-ambient"]').click();
  ok(await page.evaluate(()=>{const a=window.MichelsLifeFocusAudio;return !a.playing()&&a.playingScene()===null&&a.ambientPlayback()===null;}),
    'Soundscape Stop left an active audio session');
  const soundPrefs=await page.evaluate(()=>window.FocusStoryV30162.focusState());
  ok(soundPrefs.v30165Soundscape==='library',
    'End chime and soundscape were not saved by the canonical FocusStory owner');
  await page.locator('.mlv-focus-sound-details > summary').click();

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

  // The same active-page class belongs to multiple pages, never to a primary button.
  await page.setViewportSize({width:1440,height:900});
  for(const route of ['dashboard','contracts','calendar','journal','stats','projects','achievements','affirmations','story','settings','missions']){
    await page.evaluate(route=>window.LeftNavV30171.route(route),route);
    await page.waitForSelector('#tab-'+route+'.active',{state:'visible',timeout:15000});
    const role=await page.evaluate(route=>{
      const el=document.getElementById('tab-'+route),style=getComputedStyle(el),theme=getComputedStyle(document.body);
      const accent=theme.getPropertyValue('--ui-accent').trim(),accent2=theme.getPropertyValue('--ui-accent2').trim();
      const probe=document.createElement('span');document.body.append(probe);
      probe.style.color=accent;const first=getComputedStyle(probe).color;
      probe.style.color=accent2;const second=getComputedStyle(probe).color;probe.remove();
      const gradient=style.backgroundImage;
      return {gradient,first,second,solidAccent:gradient.includes('linear-gradient(135deg, '+first+', '+second+')')||style.backgroundColor===first};
    },route);
    ok(!role.solidAccent,'Page received solid button accent: '+route+' '+JSON.stringify(role));
  }
  // Explicitly exercise saved custom glass values; restore the original configuration afterwards.
  const surface=await page.evaluate(()=>{
    const v=window.VisualSystemV30189,original=v.transparency();
    const target=document.querySelector('#tab-missions .card,#tab-missions .v132-panel');
    if(!target)return {missing:true};
    try{
      v.setTransparency({...original,enabled:true,header:50,panel:50,card:25});
      const outer=[...document.querySelectorAll('#tab-missions [data-mlv184-surface]')].find(e=>['main','header'].includes(e.dataset.mlv184Surface));
      if(!outer)return {missing:true};
      const on=getComputedStyle(outer).backdropFilter,background=outer.style.background;
      v.setTransparency({...original,enabled:true,header:0,panel:0,card:0});
      const zero=getComputedStyle(outer).backdropFilter,zeroBackground=outer.style.background;
      return {on,background,zero,zeroBackground};
    }finally{v.setTransparency(original);}
  });
  ok(!surface.missing&&surface.on==='blur(10px)'&&/0\.5(?:0+)?\)/.test(surface.background)&&surface.zero==='none'&&surface.zeroBackground==='transparent','Custom glass opacity/blur contract failed: '+JSON.stringify(surface));
  await page.waitForFunction(()=>{
    const mini=document.getElementById('mlv-desktop-mini-focus'),alarm=document.getElementById('mlv-alarm-launcher'),dock=document.getElementById('v3099NextUpDock');
    if(!mini||mini.hidden)return false;
    const m=mini.getBoundingClientRect();
    if(alarm&&!alarm.hidden&&getComputedStyle(alarm).display!=='none'&&alarm.getBoundingClientRect().bottom>m.top)return false;
    if(dock&&getComputedStyle(dock).display!=='none'&&dock.getBoundingClientRect().right>m.left)return false;
    return true;
  },null,{timeout:10000});
  await page.screenshot({path:'artifacts/ui-smoke/desktop-floating-control-lanes.png'});
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
  const afterReloadSound=await page.evaluate(()=>window.FocusStoryV30162.focusState());
  ok(afterReloadSound.v30165Soundscape==='library',
    'Selected ambient soundtrack was lost after reload');
  await page.evaluate(()=>window.FocusStoryV30162?.resetFocus?.());


  console.log('PASS: desktop fullscreen selected wallpaper, canonical timer, intentional mini, Missions nav, pause/resume and restore');
}finally{await browser.close();}
