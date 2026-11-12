/* Michel's Life - shared Focus wallpaper and immersive desktop workspace.
 * FocusStoryV30162 remains the single owner of timer/session persistence.
 */
(function(){
  'use strict';
  if(window.MichelsLifeFocusImmersive)return;
  const q=(s,r=document)=>r.querySelector(s),api=()=>window.FocusStoryV30162;
  const android=()=>document.documentElement.dataset.mlvPlatform==='android'||window.__MICHELSLIFE_PLATFORM__==='android'||!!window.MichelsLifeAndroid;
  const lang=(en,es)=>window.MichelsLifeI18n?.language==='es'?es:en;
  const live=s=>s?.status==='running'||s?.status==='paused';
  const time=ms=>{const sec=Math.max(0,Math.ceil((Number(ms)||0)/1000));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');};
  let screen=null,mini=null,launcher=null,lastPhase=null,closedPhase=null,closedMode=null;
  let minimizedLoaded=false;
  const minimizedKey='michelsLife.desktop.minimizedFocus.v1';
  function restoreMinimized(){
    if(minimizedLoaded)return;
    minimizedLoaded=true;
    try{
      const saved=JSON.parse(sessionStorage.getItem(minimizedKey)||'null');
      if(!saved||!['work','break'].includes(saved.mode))return;
      if(!Number.isFinite(saved.at)||saved.at>Date.now()||Date.now()-saved.at>12*3600000)return;
      if(saved.phase!==null&&
         (typeof saved.phase!=='string'||!new RegExp('^'+saved.mode+':[0-9]{10,15}$').test(saved.phase)))return;
      closedPhase=saved.phase;closedMode=saved.mode;
    }catch(_){}
  }
  function saveMinimized(){
    try{
      if(!closedMode){sessionStorage.removeItem(minimizedKey);return;}
      sessionStorage.setItem(minimizedKey,JSON.stringify({
        phase:closedPhase,mode:closedMode,at:Date.now()
      }));
    }catch(_){}
  }

  function wallpaper(){
    const selectors=[
      '[data-mlv-active-wallpaper]','.mlv-theme-wallpaper',
      '[class*="wallpaper"]','#tab-missions .v131-hero',
      '#tab-story .v30162-story-hero','#tab-missions','#tab-story',
      '#main','body','html'
    ];
    const seen=new Set(),probes=[];
    for(const selector of selectors){
      const node=q(selector);
      if(node&&!seen.has(node)){seen.add(node);probes.push([node,null]);}
    }
    if(document.body)probes.push([document.body,'::before']);
    if(document.documentElement)probes.push([document.documentElement,'::before']);
    for(const [node,pseudo] of probes){
      try{
        const computed=getComputedStyle(node,pseudo).backgroundImage;
        if(computed&&computed!=='none'&&/url\(|image-set\(/i.test(computed))return computed;
        // The theme may own background-image with !important. Read the
        // persisted inline scene as well instead of silently replacing it
        // with an opaque gradient in the immersive workspace.
        const inline=!pseudo?node.style?.backgroundImage:'';
        if(inline&&/url\(|image-set\(/i.test(inline))return inline;
      }catch(_){}
    }
    const cover=q('[data-mlv-active-wallpaper] img, img[data-mlv-wallpaper], #tab-story img[class*="background"], #tab-missions img[class*="background"]');
    const src=cover?.getAttribute?.('src');
    if(src&&!/["\\\n\r]/.test(src))return 'url("'+src+'")';
    // Some Michel's Life eras render Missions/Story as layered CSS gradients
    // rather than a file-backed image. Preserve THAT scene when no URL exists;
    // otherwise a full-screen focus session becomes a featureless blue panel.
    const fallbackSelectors=[
      '#tab-missions [class*="hero"]','#tab-missions [class*="scene"]',
      '#tab-missions','#tab-story [class*="hero"]','#tab-story'
    ];
    for(const selector of fallbackSelectors){
      const element=q(selector);
      if(!element)continue;
      for(const pseudo of [null,'::before']){
        try{
          const value=getComputedStyle(element,pseudo).backgroundImage;
          if(value&&value!=='none'&&/gradient\(/i.test(value))return value;
        }catch(_){}
      }
    }
    return 'none';
  }
  function applyWallpaper(target){
    if(!target)return;
    const value=wallpaper();
    if(value==='none')target.style.removeProperty('--mlv-focus-wallpaper');
    else target.style.setProperty('--mlv-focus-wallpaper',value);
    target.dataset.mlvFocusWallpaper=value==='none'?'app-backdrop':
      /url\(|image-set\(/i.test(value)?'selected-image':'selected-scene';
  }
  window.MichelsLifeFocusImmersive={applyWallpaper,wallpaper};

  function installStyles(){
    if(q('#mlv-desktop-focus-css'))return;
    const el=document.createElement('style');el.id='mlv-desktop-focus-css';
    el.textContent=`
      #mlv-desktop-focus-immersive[hidden],#mlv-desktop-mini-focus[hidden],#mlv-desktop-focus-launcher[hidden]{display:none!important}
      html:not([data-mlv-platform="android"]) #mlv-desktop-focus-immersive{
        position:fixed;inset:0;z-index:2147483500;display:grid;place-items:center;
        padding:clamp(18px,4vw,58px);overflow:auto;box-sizing:border-box;
        background-color:rgba(7,11,20,.62);
        background-image:linear-gradient(140deg,rgba(3,6,15,.72),rgba(8,11,24,.46),rgba(4,7,17,.8)),var(--mlv-focus-wallpaper,none);
        background-position:center;background-size:cover;background-repeat:no-repeat;color:#f8fbff
      }
      html:not([data-mlv-platform="android"]) #mlv-desktop-focus-immersive::before{
        content:"";position:fixed;inset:0;pointer-events:none;
        backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)
      }
      #mlv-desktop-focus-immersive .mlv-focus-stage{
        position:relative;box-sizing:border-box;width:min(100%,880px);min-height:min(690px,85vh);
        display:flex;flex-direction:column;gap:24px;padding:clamp(25px,4vw,52px);
        border:1px solid rgba(255,255,255,.25);border-radius:25px;
        background:rgba(7,13,23,.33);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
        box-shadow:0 25px 85px rgba(0,0,0,.45)
      }
      .mlv-focus-stage header{display:flex;justify-content:space-between;align-items:start;gap:15px}
      .mlv-focus-stage .mlv-focus-eyebrow{font:800 11px system-ui,sans-serif;letter-spacing:.22em;color:#bbe7ff}
      .mlv-focus-stage h2{margin:9px 0 0;font:850 clamp(28px,4vw,52px) system-ui,sans-serif;color:white}
      .mlv-focus-stage .mlv-focus-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}
      .mlv-focus-stage .mlv-focus-mode{font:800 13px system-ui,sans-serif;letter-spacing:.23em}
      .mlv-focus-stage .mlv-focus-clock{font:850 clamp(82px,15vw,175px)/1 system-ui,sans-serif;letter-spacing:-.065em;font-variant-numeric:tabular-nums;text-shadow:0 5px 35px #0008}
      .mlv-focus-stage .mlv-focus-status{margin:0;font:550 16px system-ui,sans-serif;color:#e2ecf6}
      .mlv-focus-stage .mlv-focus-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}
      #mlv-desktop-focus-immersive button{
        cursor:pointer;touch-action:manipulation;min-height:46px;min-width:46px;padding:11px 17px;
        border:1px solid #ffffff55;border-radius:14px;background:#091526b8;color:#fff;
        font:750 14px system-ui,sans-serif
      }
      #mlv-desktop-focus-immersive button.primary{
        color:#06101f;border-color:transparent;background:linear-gradient(120deg,#76dfff,#ad90ff);min-width:165px
      }
      #mlv-desktop-focus-immersive button:focus-visible,
      #mlv-desktop-mini-focus button:focus-visible,#mlv-desktop-focus-launcher:focus-visible{
        outline:3px solid var(--ui-accent,#88dbff);outline-offset:3px
      }
      #mlv-desktop-mini-focus,#mlv-desktop-focus-launcher{
        position:fixed;right:22px;bottom:22px;z-index:2147483200;
        padding:8px;border-radius:16px;border:1px solid #ffffff44;
        color:#fff;background:#091424ee;box-shadow:0 13px 35px #0006
      }
      #mlv-desktop-mini-focus{display:flex;gap:8px;align-items:center}
      #mlv-desktop-mini-focus button,#mlv-desktop-focus-launcher{
        cursor:pointer;min-height:44px;padding:10px 14px;border:0;border-radius:11px;
        color:inherit;background:#ffffff16;font:750 14px system-ui,sans-serif
      }
      html:not([data-mlv-platform="android"]) body.mlv-desktop-focus-open{overflow:hidden!important}
      /* The pre-immersive Focus dock (v3.0.162/173) has a z-index of
         2147483643 and is re-created during renderAll(). It must not be
         painted or receive touches in Windows. Preserve its FocusStory
         timer/state APIs; replace only the visual presentation. */
      html:not([data-mlv-platform="android"]) #v30162FocusDock,
      html:not([data-mlv-platform="android"]) #v30106Focus{
        display:none!important;visibility:hidden!important;
        pointer-events:none!important
      }
      html:not([data-mlv-platform="android"]) #v30171Sidebar [data-tab="focus"]{display:none!important}
      @media(max-width:650px){.mlv-focus-stage .mlv-focus-clock{font-size:clamp(62px,17vw,110px)}}
      @media(prefers-reduced-motion:reduce){#mlv-desktop-focus-immersive *{animation:none!important;transition:none!important}}
    `;
    document.head.appendChild(el);
  }
  function create(){
    if(android()||!document.body||screen)return;
    installStyles();
    screen=document.createElement('div');
    screen.id='mlv-desktop-focus-immersive';screen.hidden=true;
    screen.innerHTML=`
      <section class="mlv-focus-stage" role="dialog" aria-modal="true" aria-labelledby="mlv-desktop-focus-title">
        <header>
          <div><span class="mlv-focus-eyebrow">MICHEL'S LIFE / FOCUS</span>
          <h2 id="mlv-desktop-focus-title">Pomodoro</h2></div>
          <button type="button" data-focus-action="minimize" aria-label="Minimize Pomodoro">—</button>
        </header>
        <div class="mlv-focus-center">
          <span class="mlv-focus-mode" id="mlv-desktop-focus-mode">FOCUS</span>
          <strong class="mlv-focus-clock" role="timer" aria-live="off" id="mlv-desktop-focus-clock">25:00</strong>
          <p class="mlv-focus-status" id="mlv-desktop-focus-status">Ready to focus</p>
        </div>
        <div class="mlv-focus-actions">
          <button type="button" class="primary" data-focus-action="toggle">Start</button>
          <button type="button" data-focus-action="skip">Skip phase</button>
          <button type="button" data-focus-action="reset">Reset</button>
          <button type="button" data-focus-action="minimize">Navigate the app</button>
        </div>
      </section>`;
    mini=document.createElement('aside');
    mini.id='mlv-desktop-mini-focus';mini.hidden=true;
    mini.innerHTML='<button type="button" data-focus-action="open">◷ 25:00</button><button type="button" data-focus-action="toggle">Pause</button>';
    launcher=document.createElement('button');
    launcher.id='mlv-desktop-focus-launcher';launcher.type='button';
    launcher.textContent='◷';launcher.title='Pomodoro';launcher.setAttribute('aria-label','Open Pomodoro');
    launcher.addEventListener('click',()=>open());
    for(const node of [screen,mini]){
      node.addEventListener('click',event=>{
        const button=event.target.closest('[data-focus-action]');if(!button)return;
        const command=button.dataset.focusAction;
        if(command==='open'){open();return;}
        if(command==='minimize'){minimize();return;}
        const engine=api(),state=engine?.focusState?.();if(!engine)return;
        if(command==='toggle')engine.toggleFocus?.();
        if(command==='skip'){
          if(state?.status==='running'&&!window.confirm(lang('Skip the current phase?','¿Saltar la fase actual?')))return;
          engine.skipFocus?.();
        }
        if(command==='reset'){
          if(state?.status==='running'&&!window.confirm(lang('Reset this session?','¿Reiniciar esta sesión?')))return;
          engine.resetFocus?.();
        }
        refresh();
      });
    }
    document.body.append(screen,mini,launcher);
  }
  function open(){
    if(android())return window.MichelsLifeMobileExperience?.openFocus?.()||false;
    create();if(!screen||!api()?.focusState)return false;
    applyWallpaper(screen);screen.hidden=false;closedPhase=null;closedMode=null;saveMinimized();
    document.body.classList.add('mlv-desktop-focus-open');
    refresh();
    q('[data-focus-action="minimize"]',screen)?.focus();
    return true;
  }
  function minimize(){
    if(android())return window.MichelsLifeMobileExperience?.closeFocus?.()||false;
    if(!screen)return false;
    screen.hidden=true;document.body.classList.remove('mlv-desktop-focus-open');
    const state=api()?.focusState?.();
    closedPhase=state?.status==='running'?state.mode+':'+state.deadlineAt:null;
    closedMode=live(state)?state.mode:null;
    saveMinimized();
    refresh();launcher?.focus();return true;
  }
  function refresh(){
    if(android())return;
    create();if(!screen)return;
    const engine=api(),state=engine?.focusState?.();
    restoreMinimized();
    if(state&&!live(state)&&(closedPhase||closedMode)){
      closedPhase=null;closedMode=null;saveMinimized();
    }
    const running=state?.status==='running';
    const phase=running?state.mode+':'+state.deadlineAt:null;
    if(running&&phase!==lastPhase&&phase!==closedPhase&&state.mode!==closedMode&&!q('#mlv200Onboarding:not([hidden])')){
      screen.hidden=false;document.body.classList.add('mlv-desktop-focus-open');applyWallpaper(screen);
    }
    lastPhase=phase;
    mini.hidden=!live(state)||!screen.hidden;
    launcher.hidden=live(state)||!screen.hidden;
    if(!state)return;
    const remaining=time(engine.remaining?.(state)),mode=state.mode==='break'?lang('BREAK','DESCANSO'):lang('FOCUS','ENFOQUE');
    q('#mlv-desktop-focus-mode',screen).textContent=mode;
    q('#mlv-desktop-focus-clock',screen).textContent=remaining;
    q('#mlv-desktop-focus-status',screen).textContent=state.status==='running'?lang('In progress','En curso'):state.status==='paused'?lang('Paused','En pausa'):lang('Ready to begin','Listo para comenzar');
    q('[data-focus-action="open"]',mini).textContent=mode+' · '+remaining;
    q('[data-focus-action="toggle"]',mini).textContent=running?lang('Pause','Pausar'):lang('Resume','Reanudar');
    q('[data-focus-action="toggle"]',screen).textContent=running?lang('Pause session','Pausar sesión'):state.status==='paused'?lang('Resume session','Reanudar sesión'):lang('Start focusing','Comenzar enfoque');
    screen.querySelectorAll('[data-focus-action="minimize"]').forEach((button,i)=>{
      const value=i?lang('Navigate the app','Navegar por la app'):lang('Minimize Pomodoro','Minimizar Pomodoro');
      button.setAttribute('aria-label',value);if(i)button.textContent=value;
    });
    q('[data-focus-action="skip"]',screen).textContent=lang('Skip phase','Saltar fase');
    q('[data-focus-action="reset"]',screen).textContent=lang('Reset','Reiniciar');
    if(!screen.hidden)applyWallpaper(screen);
  }
  window.MichelsLifeFocusImmersive.open=open;
  window.MichelsLifeFocusImmersive.minimize=minimize;
  window.MichelsLifeFocusImmersive.refresh=refresh;
  const boot=()=>{
    if(android())return;
    create();
    // A persisted pre-immersive popup may still be marked expanded.
    // Collapse it once without resetting or replacing the canonical timer.
    try{api()?.closeFocusPanel?.();}catch(_){}
    refresh();
    window.setInterval(()=>{if(document.body?.isConnected)refresh();},650);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&screen&&!screen.hidden){event.preventDefault();minimize();}
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();