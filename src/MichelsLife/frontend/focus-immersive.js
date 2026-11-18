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

  // Original, royalty-free Michel's Life audio. A + C: dreamy and cinematic.
  // The Web Audio engine is shared by desktop and Android WebView. It NEVER
  // touches FocusStory deadlines/history and never autoplays on boot.
  const completionKey='completion';
  const sceneKey='scene';
  const finishTones={
    soft:{en:'Soft Bell',es:'Campana suave',notes:[[0,587,.55,.065],[.32,784,.85,.045]]},
    glass:{en:'Glass Chime',es:'Cristal',notes:[[0,988,.4,.052],[.2,1318,.65,.041],[.52,1567,.65,.026]]},
    aurora:{en:'Aurora Tone',es:'Aurora',notes:[[0,440,.8,.039],[.3,659,1,.035],[.72,880,.9,.028]]},
    observatory:{en:'Observatory Bell',es:'Observatorio',notes:[[0,392,.8,.053],[.5,587,.85,.035],[.9,784,1.05,.027]]},
    midnight:{en:'Midnight Chime',es:'Medianoche',notes:[[0,523,.5,.037],[.34,698,.8,.035],[.66,1047,1.2,.026]]},
    silver:{en:'Silver Echo',es:'Eco plateado',notes:[[0,784,.6,.044],[.36,987,.8,.036],[.75,1175,1.1,.024]]},
    off:{en:'No sound',es:'Sin sonido',notes:[]}
  };
  // All sequences are newly composed harmonic pads, not licensed recordings.
  const ambientScenes={
    moonlight:{en:'Moonlight Study',es:'Estudio lunar',group:'A',notes:[220,329.63,440,493.88]},
    celestial:{en:'Celestial Focus',es:'Enfoque celestial',group:'A',notes:[196,293.66,392,587.33]},
    orbit:{en:'Quiet Orbit',es:'Órbita tranquila',group:'A',notes:[174.61,261.63,349.23,523.25]},
    aurora:{en:'Aurora',es:'Aurora',group:'C',notes:[164.81,246.94,329.63,493.88]},
    observatory:{en:'Observatory',es:'Observatorio',group:'C',notes:[146.83,220,293.66,440]},
    library:{en:'Midnight Library',es:'Biblioteca nocturna',group:'C',notes:[130.81,196,261.63,392]},
    afterglow:{en:'Afterglow',es:'Resplandor',group:'C',notes:[174.61,220,349.23,440]},
    silver:{en:'Silver Room',es:'Sala plateada',group:'C',notes:[196,246.94,392,493.88]}
  };
  let effectContext=null,ambientContext=null,ambientInterval=null,ambientScene=null,ambientStep=0;
  function soundContext(){
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    if(!effectContext||effectContext.state==='closed')effectContext=new C();
    effectContext.resume?.().catch?.(()=>{});
    return effectContext;
  }
  // FocusStory is the ONLY persistence owner. This immersive view must not
  // write localStorage independently or duplicate timer/session state.
  function readChoice(key,valid,fallback){
    const f=api()?.focusState?.();
    const value=key==='completion'?f?.v30165CompletionSound:f?.v30165Soundscape;
    return Object.hasOwn(valid,value)?value:fallback;
  }
  function choice(key,valid,value,fallback){
    const selected=Object.hasOwn(valid,value)?value:fallback;
    api()?.setAudioPreference?.(key,selected);
    return selected;
  }
  const finishId=()=>readChoice(completionKey,finishTones,'soft');
  const sceneId=()=>readChoice(sceneKey,ambientScenes,'moonlight');
  function unlock(){
    try{return !!soundContext();}catch(_){return false;}
  }
  function playCompletion(preview=false){
    const id=finishId(),score=finishTones[id];
    if(!score||id==='off')return true;
    const ctx=soundContext();
    if(!ctx)return false;
    try{
      const start=ctx.currentTime+.025;
      score.notes.forEach(([offset,freq,duration,gain])=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.type=id==='observatory'?'triangle':'sine';
        o.frequency.setValueAtTime(freq,start+offset);
        g.gain.setValueAtTime(.0001,start+offset);
        g.gain.exponentialRampToValueAtTime(gain*(preview?.75:1),start+offset+.035);
        g.gain.exponentialRampToValueAtTime(.0001,start+offset+duration);
        o.connect(g);g.connect(ctx.destination);
        o.start(start+offset);o.stop(start+offset+duration+.04);
      });
      return true;
    }catch(_){return false;}
  }
  function stopAmbient(){
    if(ambientInterval){window.clearInterval(ambientInterval);ambientInterval=null;}
    const ctx=ambientContext;ambientContext=null;ambientScene=null;
    if(ctx)ctx.close().catch(()=>{});
    return true;
  }
  function scheduleAmbient(){
    const ctx=ambientContext,scene=ambientScenes[ambientScene];
    if(!ctx||!scene||ctx.state==='closed')return;
    const start=ctx.currentTime+.04,notes=scene.notes;
    for(let i=0;i<notes.length;i++){
      const osc=ctx.createOscillator(),env=ctx.createGain();
      osc.type=i===0?'sine':i===2?'triangle':'sine';
      const rotation=(ambientStep+i)%notes.length;
      osc.frequency.setValueAtTime(notes[rotation]*(i===3?2:1),start+.22*i);
      const gain=i===0?.012:i===3?.004:.006;
      env.gain.setValueAtTime(.0001,start+.22*i);
      env.gain.linearRampToValueAtTime(gain,start+2+.22*i);
      env.gain.setValueAtTime(gain,start+4.8+.22*i);
      env.gain.exponentialRampToValueAtTime(.0001,start+8.5+.22*i);
      osc.connect(env);env.connect(ctx.destination);
      osc.start(start+.22*i);osc.stop(start+8.55+.22*i);
    }
    ambientStep=(ambientStep+1)%scene.notes.length;
  }
  function startAmbient(){
    stopAmbient();
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return false;
    try{
      ambientScene=sceneId();ambientContext=new C();
      ambientContext.resume?.().catch?.(()=>{});
      ambientStep=0;scheduleAmbient();
      ambientInterval=window.setInterval(scheduleAmbient,7200);
      return true;
    }catch(_){stopAmbient();return false;}
  }
  function selectScene(id){
    const old=ambientScene;choice(sceneKey,ambientScenes,id,'moonlight');
    if(old)startAmbient();
    return sceneId();
  }
  function textOptions(items,group=false){
    const es=window.MichelsLifeI18n?.language==='es';
    return Object.entries(items).map(([id,item])=>({id,label:(group?item.group+' · ':'')+(es?item.es:item.en)}));
  }
  window.MichelsLifeFocusAudio={
    completionOptions:()=>textOptions(finishTones),
    sceneOptions:()=>textOptions(ambientScenes,true),
    completionId:finishId,sceneId,selectCompletion:id=>choice(completionKey,finishTones,id,'soft'),
    selectScene,playCompletion,unlock,startAmbient,stopAmbient,
    playing:()=>!!ambientContext,playingScene:()=>ambientScene
  };
  window.addEventListener?.('pagehide',stopAmbient);

  let screen=null,mini=null,launcher=null,lastPhase=null,closedPhase=null,closedMode=null;
  let minimizedLoaded=false;
  let focusSceneSequence=0;
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
    // VisualSystemV30182 owns the actual selected background in a dedicated
    // image layer, not on html/body CSS. Read the real loaded scene first.
    const visual=q('#mlv184Background img');
    const current=visual?.currentSrc||visual?.getAttribute?.('src')||'';
    if(visual?.complete&&visual.naturalWidth>0&&
       current&&!/["\\\n\r]/.test(current)&&!/^javascript:/i.test(current)){
      return 'url("'+current+'")';
    }
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
      #mlv-desktop-focus-immersive .mlv-focus-stage{
        position:relative;box-sizing:border-box;width:min(100%,880px);min-height:min(690px,85vh);
        display:flex;flex-direction:column;gap:24px;padding:clamp(25px,4vw,52px);
        border:1px solid rgba(255,255,255,.25);border-radius:25px;
        background:rgba(7,13,23,.56);
        box-shadow:0 25px 85px rgba(0,0,0,.45)
      }
      .mlv-focus-stage header{display:flex;justify-content:space-between;align-items:start;gap:15px}
      .mlv-focus-stage .mlv-focus-eyebrow{font:800 11px system-ui,sans-serif;letter-spacing:.22em;color:#bbe7ff}
      .mlv-focus-stage h2{margin:9px 0 0;font:850 clamp(28px,4vw,52px) system-ui,sans-serif;color:white}
      .mlv-focus-stage .mlv-focus-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}
      .mlv-focus-stage .mlv-focus-mode{font:800 13px system-ui,sans-serif;letter-spacing:.23em}
      .mlv-focus-stage .mlv-focus-clock{font:850 clamp(82px,15vw,175px)/1 system-ui,sans-serif;letter-spacing:-.065em;font-variant-numeric:tabular-nums;text-shadow:0 5px 35px #0008}

      /* Real Playwright caught legacy strong/timer rules shrinking 25:00 to 16px. */
      #mlv-desktop-focus-immersive .mlv-focus-stage{
        min-height:0!important;max-height:calc(100dvh - 24px)!important;
        overflow-y:auto!important;gap:clamp(8px,1.8vh,20px)!important;
        padding:clamp(16px,2.4vw,36px)!important
      }
      #mlv-desktop-focus-immersive #mlv-desktop-focus-clock{
        display:block!important;width:auto!important;min-width:0!important;
        min-height:70px!important;font-family:system-ui,sans-serif!important;
        font-size:clamp(66px,10vw,150px)!important;font-weight:900!important;
        line-height:1.03!important;letter-spacing:-.055em!important;
        color:#fff!important;text-align:center!important
      }
      #mlv-desktop-focus-immersive .mlv-focus-center{min-height:0!important;flex:1 1 auto!important;gap:6px!important}
      #mlv-desktop-focus-immersive .mlv-focus-stage>header,
      #mlv-desktop-focus-immersive .mlv-focus-stage>.mlv-focus-actions{flex-shrink:0!important}
      #mlv-desktop-focus-immersive .mlv-focus-motivation-details{
        max-height:22vh;overflow-y:auto;min-height:0;flex:0 1 auto;
        border:1px solid #ffffff24;border-radius:12px;padding:7px 12px
      }
      #mlv-desktop-focus-immersive .mlv-focus-motivation-details summary{cursor:pointer;font:700 12px system-ui,sans-serif}
      #mlv-desktop-focus-immersive .mlv-focus-motivation-details:not([open]){max-height:40px}
      #mlv-desktop-focus-immersive .mlv-focus-motivation-details .mlv-motivation{gap:5px;margin:6px auto 0}
      #mlv-desktop-focus-immersive .mlv-focus-motivation-details .mlv-motivation-copy{font-size:clamp(12px,1.3vw,15px);line-height:1.25}
      @media(max-height:550px){
        #mlv-desktop-focus-immersive .mlv-focus-stage{gap:5px!important;padding:10px!important}
        #mlv-desktop-focus-immersive #mlv-desktop-focus-clock{font-size:clamp(43px,13vh,82px)!important}
      }
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
      #mlv-desktop-focus-launcher{right:19px;bottom:94px;padding:10px 16px;min-height:46px}
      #mlv-desktop-mini-focus button,#mlv-desktop-focus-launcher{
        cursor:pointer;min-height:44px;padding:10px 14px;border:0;border-radius:11px;
        color:inherit;background:#ffffff16;font:750 14px system-ui,sans-serif
      }
      html:not([data-mlv-platform="android"]) body.mlv-desktop-focus-open{overflow:hidden!important}
      @media(max-width:650px){.mlv-focus-stage .mlv-focus-clock{font-size:clamp(62px,17vw,110px)}}

      #mlv-desktop-focus-immersive .mlv-focus-stage{
        width:min(100%,920px)!important;
        background-color:rgba(7,15,24,.43)!important;
        background-image:linear-gradient(155deg,rgba(5,12,21,.18),rgba(8,17,27,.11))!important;
        border:1px solid rgba(220,241,255,.22)!important;
        box-shadow:0 24px 70px rgba(0,0,0,.16)!important;
        backdrop-filter:none!important;
      }
      #mlv-desktop-focus-immersive .mlv-focus-stage h2{letter-spacing:-.035em!important;font-weight:780!important}
      #mlv-desktop-focus-immersive .mlv-focus-actions{gap:8px!important;flex-wrap:wrap!important}
      #mlv-desktop-focus-immersive .mlv-focus-actions button{
        border-radius:12px!important;border-color:rgba(204,236,255,.28)!important;
        background:rgba(5,19,27,.75)!important;
      }
      #mlv-desktop-focus-immersive .mlv-focus-actions button.primary{
        background:linear-gradient(120deg,#71eed1,#7cddff)!important;color:#09202a!important;
      }
      #mlv-desktop-focus-immersive .mlv-focus-motivation-details{
        border:0!important;background:rgba(3,16,25,.25)!important;padding:4px 10px!important
      }
      #mlv-desktop-focus-immersive .mlv-focus-sound-details{
        border:1px solid rgba(210,245,250,.14);border-radius:14px;
        background:rgba(3,15,26,.28);padding:7px 12px
      }
      #mlv-desktop-focus-immersive .mlv-focus-sound-details summary{
        font:700 12px/1.5 system-ui,sans-serif;cursor:pointer;color:#e1f2f3
      }
      #mlv-desktop-focus-immersive .mlv-focus-sound-details:not([open]){max-height:36px}
      #mlv-desktop-focus-immersive .mlv-focus-audio-panel{
        display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;
        padding:12px;border:1px solid rgba(220,241,255,.15);
        border-radius:16px;background:rgba(3,15,26,.48)
      }
      #mlv-desktop-focus-immersive .mlv-focus-audio-group{display:flex;gap:7px;align-items:end;min-width:0}
      #mlv-desktop-focus-immersive .mlv-focus-audio-group label{
        flex:1;min-width:0;color:#dbeff3;font:650 12px/1.4 system-ui,sans-serif
      }
      #mlv-desktop-focus-immersive .mlv-focus-audio-group select{
        display:block;width:100%;min-height:40px;margin-top:4px;padding:8px;
        color:#f5fbff;background:#102a33;border:1px solid #7cb1b555;border-radius:9px;font:600 12px system-ui
      }
      #mlv-desktop-focus-immersive .mlv-focus-audio-group button{
        min-height:40px;min-width:70px;padding:7px 10px;font-size:12px
      }
      @media(max-width:670px){
        #mlv-desktop-focus-immersive .mlv-focus-audio-panel{grid-template-columns:1fr}
      }

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
          <div class="mlv-focus-actions"><button type="button" data-focus-action="alarms">⏰ Alarmas</button>
          <button type="button" data-focus-action="minimize" aria-label="Minimize Pomodoro">—</button></div>
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
        <details class="mlv-focus-sound-details"><summary>Audio · Completion tone & ambience</summary>
        <div class="mlv-focus-audio-panel" aria-label="Pomodoro audio">
          <div class="mlv-focus-audio-group">
            <label for="mlv-focus-completion-select">Completion sound
              <select id="mlv-focus-completion-select" data-mlv-completion-sound></select>
            </label>
            <button type="button" data-mlv-audio="preview-completion">Preview</button>
          </div>
          <div class="mlv-focus-audio-group">
            <label for="mlv-focus-scene-select">Ambient soundscapes · Dreamy + Cinematic
              <select id="mlv-focus-scene-select" data-mlv-scene-select></select>
            </label>
            <button type="button" data-mlv-audio="toggle-ambient">Play</button>
          </div>
        </div></details>
        <details class="mlv-focus-motivation-details"><summary>Messages & affirmations</summary><div id="mlv-desktop-focus-motivation"></div></details>
      </section>`;
    mini=document.createElement('aside');
    mini.id='mlv-desktop-mini-focus';mini.hidden=true;
    mini.innerHTML='<button type="button" data-focus-action="open">◷ 25:00</button><button type="button" data-focus-action="toggle">Pause</button>';
    launcher=document.createElement('button');
    launcher.id='mlv-desktop-focus-launcher';launcher.type='button';
    launcher.textContent='◷ Pomodoro';launcher.title='Pomodoro';launcher.setAttribute('aria-label','Open Pomodoro');
    launcher.addEventListener('click',()=>open());
    for(const node of [screen,mini]){
      node.addEventListener('click',event=>{
        const button=event.target.closest('[data-focus-action]');if(!button)return;
        handleAction(button.dataset.focusAction);
      });
    }
    screen.addEventListener('change',event=>{
      if(event.target?.matches?.('[data-mlv-completion-sound]'))
        window.MichelsLifeFocusAudio?.selectCompletion?.(event.target.value);
      else if(event.target?.matches?.('[data-mlv-scene-select]'))
        window.MichelsLifeFocusAudio?.selectScene?.(event.target.value);
      refresh();
    });
    document.body.append(screen,mini,launcher);
  }
  function handleAction(command){
    if(command==='preview-completion')return window.MichelsLifeFocusAudio?.playCompletion?.(true)===true;
    if(command==='toggle-ambient'){
      const music=window.MichelsLifeFocusAudio;
      if(music?.playing?.())music.stopAmbient();
      else music?.startAmbient?.();
      refresh();return true;
    }
    if(command==='open'){open();return true;}
    if(command==='alarms'){
      minimize();
      const opened=window.MichelsLifeAlarms?.open?.();
      return opened===true;
    }
    if(command==='minimize'){minimize();return true;}
    const engine=api(),state=engine?.focusState?.();
    if(!engine?.focusState)return false;
    if(command==='toggle')engine.toggleFocus?.();
    else if(command==='skip'){
      if(state?.status==='running'&&!window.confirm(lang('Skip the current phase?','¿Saltar la fase actual?')))return false;
      engine.skipFocus?.();
    }else if(command==='reset'){
      if(state?.status==='running'&&!window.confirm(lang('Reset this session?','¿Reiniciar esta sesión?')))return false;
      engine.resetFocus?.();
    }else return false;
    refresh();return true;
  }
  // The legacy 3.0.x navigation stack registers several capture listeners that
  // can consume a click before launcher/button handlers see it. Own only our
  // three surfaces from window capture (installed in <head> before legacy UI).
  let lastInput=null;
  function dispatchFocusInput(event){
    if(android())return;
    if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
    const t=event.target?.closest?.('#mlv-desktop-focus-launcher, #mlv-desktop-focus-immersive [data-focus-action], #mlv-desktop-focus-immersive [data-mlv-audio], #mlv-desktop-mini-focus [data-focus-action]');
    if(!t||t.disabled)return;
    const action=t.id==='mlv-desktop-focus-launcher'?'launch':(t.dataset.mlvAudio||t.dataset.focusAction);
    if(!action)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const now=Date.now();
    // Never dedupe two physical clicks. Pausing then resuming rapidly is a
    // legitimate action, especially in the minimized floating Pomodoro.
    // Only suppress the browser's synthetic click after a handled keydown.
    if(event.type==='click'&&lastInput?.kind==='keydown'&&
       lastInput.action===action&&now-lastInput.at<350)return;
    if(event.type==='keydown')lastInput={at:now,action,kind:'keydown'};
    else lastInput=null;
    if(action==='launch')open();else handleAction(action);
  }
  // Handle the completed click: hiding/mounting a dialog on pointerdown
  // makes its originating button vanish before pointerup (WebView/Chromium).
  window.addEventListener?.('click',dispatchFocusInput,true);
  window.addEventListener?.('keydown',dispatchFocusInput,true);
  function open(){
    if(android())return window.MichelsLifeMobileExperience?.openFocus?.()||false;
    create();if(!screen)return false;
    applyWallpaper(screen);screen.hidden=false;closedPhase=null;closedMode=null;saveMinimized();
    if(!api()?.focusState){
      const status=q('#mlv-desktop-focus-status',screen);
      if(status)status.textContent=lang('Starting the timer…','Iniciando el temporizador…');
    }
    focusSceneSequence++;
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
    q('[data-focus-action="alarms"]',screen).textContent=lang('⏰ Alarms','⏰ Alarmas');
    const audio=window.MichelsLifeFocusAudio;
    for(const [selector,options,selected] of [
      ['[data-mlv-completion-sound]',audio?.completionOptions?.(),audio?.completionId?.()],
      ['[data-mlv-scene-select]',audio?.sceneOptions?.(),audio?.sceneId?.()]
    ]){
      const select=q(selector,screen);
      if(!select||!options)continue;
      if(select.options.length!==options.length||
         options.some((item,i)=>select.options[i]?.value!==item.id||
           select.options[i]?.textContent!==item.label)){
        select.replaceChildren(...options.map(item=>{
          const opt=document.createElement('option');opt.value=item.id;opt.textContent=item.label;return opt;
        }));
      }
      if(select.value!==selected)select.value=selected;
    }
    const ambientButton=q('[data-mlv-audio="toggle-ambient"]',screen);
    if(ambientButton)ambientButton.textContent=audio?.playing?.()?lang('Stop','Detener'):lang('Play','Reproducir');
    const previewButton=q('[data-mlv-audio="preview-completion"]',screen);
    if(previewButton)previewButton.textContent=lang('Preview','Escuchar');
    const completionLabel=q('[for="mlv-focus-completion-select"]',screen);
    if(completionLabel?.firstChild?.nodeType===3)
      completionLabel.firstChild.textContent=lang('Completion sound','Sonido al terminar')+' ';
    if(!screen.hidden){
      applyWallpaper(screen);
      window.MichelsLifeMotivation?.render?.(
        q('#mlv-desktop-focus-motivation',screen),
        'desktop-focus:'+focusSceneSequence+':'+String(state.mode||'work')+':'+String(state.deadlineAt||'ready')
      );
    }
  }
  window.MichelsLifeFocusImmersive.open=open;
  window.MichelsLifeFocusImmersive.minimize=minimize;
  window.MichelsLifeFocusImmersive.refresh=refresh;
  const boot=()=>{
    if(android())return;
    create();
    refresh();
    window.setInterval(()=>{if(document.body?.isConnected)refresh();},650);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&screen&&!screen.hidden){event.preventDefault();minimize();}
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();