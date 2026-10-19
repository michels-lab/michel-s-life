/* Michel's Life Android: platform-owned navigation and Focus experience.
 * Keep business state in the canonical shared frontend, NEVER in a second
 * Android task/timer store. No background alarm delivery is claimed here.
 */
(function(){
  'use strict';
  if(window.MichelsLifeMobileExperience)return;
  const q=(selector,root=document)=>root.querySelector(selector);
  const focusApi=()=>window.FocusStoryV30162;
  const actions=[
    {id:'dashboard',label:'Today',glyph:'⌂'},
    {id:'missions',label:'Missions',glyph:'✓'},
    {id:'focus',label:'Pomodoro',glyph:'◷'},
    {id:'calendar',label:'Calendar',glyph:'▦'},
    {id:'settings',label:'Settings',glyph:'⚙'}
  ];
  let root=null,nav=null,mini=null,ticker=null;
  let lastNativeAlarmKey=null;

  function syncNativeFocusAlarm(state){
    const native=window.MichelsLifeAndroid;
    if(!native||typeof native.syncFocusAlarm!=='function'||!state)return;
    const running=state.status==='running';
    const deadline=Number(state.deadlineAt)||0;
    const mode=state.mode==='break'?'break':'work';
    const key=running?'running:'+mode+':'+deadline:'inactive';
    if(key===lastNativeAlarmKey)return;
    try{
      const raw=native.syncFocusAlarm(JSON.stringify({
        status:running?'running':'paused',deadlineAt:running?deadline:0,mode
      }));
      const result=JSON.parse(raw||'{}');
      if(result.error)throw Error(result.error);
      lastNativeAlarmKey=key;
    }catch(error){
      // Retry on the next tick rather than silently claiming OS delivery.
      lastNativeAlarmKey=null;
      console.warn('Focus native notification unavailable:',String(error));
    }
  }

  function requestNativeFocusPermission(){
    const native=window.MichelsLifeAndroid;
    try{native?.requestFocusNotificationPermission?.();}
    catch(error){console.warn('Focus notification permission unavailable:',String(error));}
  }
  const isFocusOpen=()=>!!(root&&!root.hidden);
  function fmt(ms){
    let s=Math.max(0,Math.ceil((Number(ms)||0)/1000));
    return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  }
  function addStyles(){
    if(q('#mlv-android-experience-css'))return;
    const style=document.createElement('style');
    style.id='mlv-android-experience-css';
    style.textContent=`
      html[data-mlv-platform="android"] #main{
        padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important
      }
      #mlv-android-bottom-nav,#mlv-android-focus-overlay{display:none}
      html[data-mlv-platform="android"] body.mlv-android-keyboard-editing #mlv-android-bottom-nav{display:none!important}
      html[data-mlv-platform="android"] #mlv-android-bottom-nav{
        position:fixed;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));
        left:0;right:0;bottom:0;z-index:2147482980;box-sizing:border-box;
        padding:7px 7px calc(8px + env(safe-area-inset-bottom,0px));
        gap:3px;border-top:1px solid rgba(255,255,255,.14);
        background:rgba(var(--ui-panel-rgb,7,13,25),.97);
        box-shadow:0 -12px 30px rgba(0,0,0,.24)
      }
      /* Same canonical Quick Capture engine as desktop; Android only owns
         its touch-sized, keyboard-resilient sheet and always-available entry. */
      html[data-mlv-platform="android"] #mlv-android-capture-button{
        flex:0 0 42px;width:42px;height:42px;min-width:42px;min-height:42px;
        display:grid;place-items:center;padding:0;border-radius:12px;
        border:1px solid rgba(var(--ui-accent-rgb,117,228,255),.35);
        color:var(--text,#eff6ff);
        background:rgba(var(--ui-accent-rgb,117,228,255),.15);
        font:700 27px/1 system-ui,sans-serif;touch-action:manipulation;
        -webkit-tap-highlight-color:transparent
      }
      html[data-mlv-platform="android"] [data-mlv216-qc]:not([hidden]){
        display:flex!important;align-items:flex-end;justify-content:center;
        box-sizing:border-box;position:fixed;inset:0;
        padding:0!important;max-height:100dvh;z-index:2147483200!important;
        overflow:hidden;touch-action:pan-y
      }
      html[data-mlv-platform="android"] [data-mlv216-qc] .mlv216-qc-card{
        flex:0 1 auto;box-sizing:border-box;position:relative;
        width:100%!important;max-width:700px!important;
        max-height:calc(100dvh - env(safe-area-inset-top,0px) - 12px);
        margin:0!important;overflow-x:hidden;overflow-y:auto;
        overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
        border-radius:24px 24px 0 0;
        padding:18px 16px calc(16px + env(safe-area-inset-bottom,0px));
        background:rgba(var(--ui-panel-rgb,8,15,27),.99)
      }
      html[data-mlv-platform="android"] [data-mlv216-qc] .mlv216-qc-head h2{
        font-size:21px;line-height:1.2
      }
      html[data-mlv-platform="android"] [data-mlv216-qc] .mlv216-qc-input{
        min-height:51px!important;height:51px!important;
        font-size:16px!important;line-height:1.25!important;
        flex:0 0 auto!important
      }
      html[data-mlv-platform="android"] [data-mlv216-qc] select{
        font-size:16px;min-height:46px
      }
      html[data-mlv-platform="android"] [data-mlv216-qc] button{
        min-height:46px;touch-action:manipulation
      }
      html[data-mlv-platform="android"] [data-mlv216-qc] .mlv216-qc-close{
        min-width:44px;min-height:44px
      }
      html[data-mlv-platform="android"] [data-mlv216-qc] .mlv216-qc-hint{
        display:none
      }
      html[data-mlv-platform="android"] [data-mlv216-qc] .mlv216-qc-actions{
        position:sticky;bottom:0;z-index:1;justify-content:flex-end;
        margin-top:12px;padding:10px 0 0;
        background:rgba(var(--ui-panel-rgb,8,15,27),.99)
      }
      html[data-mlv-platform="android"] [data-mlv216-qc] .mlv216-qc-buttons{
        width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px
      }
      html[data-mlv-platform="android"] [data-mlv216-qc] .mlv216-qc-buttons button{
        min-width:0;width:100%;margin:0
      }
      /* Active mission editor owns the foreground and cannot be covered by
         Android tab bar or header. On close these controls are restored. */
      html[data-mlv-platform="android"] body.mlv-android-mission-edit-open #mlv-android-bottom-nav,
      html[data-mlv-platform="android"] body.mlv-android-mission-edit-open #mlv-android-topbar{
        visibility:hidden!important;pointer-events:none!important
      }
      /* Missions: touch-first rows + editor, same canonical mission FormData.
         Editor stays an independent scroller with a sticky save region; native
         adjustResize constrains the available viewport when IME is open. */
      html[data-mlv-platform="android"] article.v132-mission>.v132-check,
      html[data-mlv-platform="android"] article.v137-mission>.v132-check,
      html[data-mlv-platform="android"] .mission-card .v132-check{
        width:44px!important;height:44px!important;min-width:44px!important;
        min-height:44px!important;grid-column:1!important;
        border-radius:13px!important
      }
      html[data-mlv-platform="android"] article.v132-mission,
      html[data-mlv-platform="android"] article.v137-mission{
        grid-template-columns:46px minmax(0,1fr)!important;
        gap:8px!important;align-items:start!important
      }
      html[data-mlv-platform="android"] article.v132-mission .v132-action-btn{
        width:44px!important;height:44px!important;
        min-width:44px!important;min-height:44px!important;
        border-radius:13px!important
      }
      html[data-mlv-platform="android"] #tab-missions [data-action="v133-edit"],
      html[data-mlv-platform="android"] #tab-dashboard [data-action="v133-edit"],
      html[data-mlv-platform="android"] #tab-missions .v133-more-btn{
        min-height:44px!important;height:44px!important;
        min-width:44px!important;width:44px!important;
        font-size:16px!important;touch-action:manipulation!important
      }
      html[data-mlv-platform="android"] article.quest-card .quest-actions button,
      html[data-mlv-platform="android"] article.mission-card .actions button{
        min-height:44px!important;min-width:44px!important;
        font-size:13px!important;touch-action:manipulation!important
      }
      html[data-mlv-platform="android"] article.v132-mission .v132-menu-body button{
        min-height:44px!important;text-align:left!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#missionEditForm) .modal-backdrop{
        position:fixed!important;inset:0!important;display:flex!important;
        flex-direction:column!important;align-items:center!important;
        justify-content:flex-end!important;box-sizing:border-box!important;
        padding:0!important;overflow:hidden!important;
        z-index:2147483150!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#missionEditForm) .modal{
        width:100%!important;max-width:700px!important;
        height:auto!important;max-height:calc(100dvh - 8px)!important;
        min-height:0!important;margin:0!important;
        display:flex!important;flex-direction:column!important;
        overflow-x:hidden!important;overflow-y:auto!important;
        overscroll-behavior:contain!important;
        padding:15px 15px calc(20px + env(safe-area-inset-bottom,0px))!important;
        border-radius:22px 22px 0 0!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#missionEditForm) .modal-head{
        position:sticky!important;top:-16px!important;z-index:3!important;
        flex:0 0 auto!important;min-width:0!important;
        align-items:flex-start!important;margin:0 0 10px!important;
        padding:6px 0 10px!important;
        background:rgba(var(--ui-panel-rgb,8,15,27),.99)!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#missionEditForm) .modal-head h2{
        font-size:21px!important;line-height:1.12!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#missionEditForm) .modal-head p{
        font-size:11px!important;line-height:1.32!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#missionEditForm) .modal-head .icon-btn{
        flex:0 0 44px!important;width:44px!important;height:44px!important;
        min-width:44px!important;min-height:44px!important
      }
      html[data-mlv-platform="android"] #missionEditForm{
        flex:0 0 auto!important;width:100%!important;
        min-width:0!important;display:block!important
      }
      html[data-mlv-platform="android"] #missionEditForm .form-grid{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:10px!important;min-width:0!important
      }
      html[data-mlv-platform="android"] #missionEditForm .form-grid label:first-child,
      html[data-mlv-platform="android"] #missionEditForm .form-grid label:has(input[name="deadline"]){
        grid-column:span 2!important
      }
      html[data-mlv-platform="android"] #missionEditForm label{
        min-width:0!important;max-width:100%!important;overflow-wrap:anywhere!important
      }
      html[data-mlv-platform="android"] #missionEditForm input:not([type="checkbox"]),
      html[data-mlv-platform="android"] #missionEditForm select,
      html[data-mlv-platform="android"] #missionEditForm textarea{
        box-sizing:border-box!important;width:100%!important;
        min-width:0!important;min-height:48px!important;
        font-size:16px!important;line-height:1.35!important;
        padding:10px!important
      }
      html[data-mlv-platform="android"] #missionEditForm textarea{
        min-height:88px!important;resize:vertical!important
      }
      html[data-mlv-platform="android"] #missionEditForm .days{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:7px!important;width:100%!important;min-width:0!important
      }
      html[data-mlv-platform="android"] #missionEditForm .day-chip{
        display:flex!important;align-items:center!important;gap:7px!important;
        min-height:45px!important;min-width:0!important;
        padding:8px!important;box-sizing:border-box!important;
        white-space:normal!important;touch-action:manipulation!important
      }
      html[data-mlv-platform="android"] #missionEditForm .day-chip input[type="checkbox"]{
        appearance:checkbox!important;-webkit-appearance:checkbox!important;
        flex:0 0 22px!important;width:22px!important;height:22px!important;
        min-width:22px!important;min-height:22px!important;
        margin:0!important
      }
      html[data-mlv-platform="android"] #missionEditForm > .actions{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:8px!important;position:sticky!important;
        bottom:calc(-20px - env(safe-area-inset-bottom,0px))!important;
        z-index:4!important;width:100%!important;min-width:0!important;
        margin-top:12px!important;padding:12px 0
          calc(12px + env(safe-area-inset-bottom,0px))!important;
        border-top:1px solid rgba(255,255,255,.12)!important;
        background:rgba(var(--ui-panel-rgb,8,15,27),.99)!important
      }
      html[data-mlv-platform="android"] #missionEditForm > .actions button{
        min-width:0!important;width:100%!important;
        min-height:49px!important;font-size:13px!important;
        margin:0!important;padding:10px!important
      }
      /* The canonical Weekly Planner lives inside Missions. At 360px its
         desktop 4-column form and 34px weekday buttons are not tap-safe.
         Android owns presentation only; scheduling, XP and persistence stay
         in the existing v251 shared planner implementation. */
      @media(max-width:720px){
        html[data-mlv-platform="android"] #tab-missions .v169-weekly-planner{
          box-sizing:border-box!important;min-width:0!important;
          width:100%!important;max-width:100%!important;overflow-wrap:anywhere!important
        }
        html[data-mlv-platform="android"] #tab-missions .v169-weekly-head{
          display:flex!important;flex-wrap:wrap!important;
          align-items:center!important;gap:9px!important
        }
        html[data-mlv-platform="android"] #tab-missions .v169-weekly-form{
          display:grid!important;grid-template-columns:minmax(0,1fr)!important;
          align-items:stretch!important;gap:9px!important;min-width:0!important
        }
        html[data-mlv-platform="android"] #tab-missions
        .v169-weekly-form :is(input,select,button){
          box-sizing:border-box!important;width:100%!important;
          min-width:0!important;min-height:48px!important;
          font-size:16px!important;touch-action:manipulation!important
        }
        html[data-mlv-platform="android"] #tab-missions .v169-weekly-template{
          display:grid!important;grid-template-columns:minmax(0,1fr)!important;
          gap:12px!important;max-width:100%!important;min-width:0!important;
          box-sizing:border-box!important;padding:14px!important
        }
        html[data-mlv-platform="android"] #tab-missions .v169-day-row{
          display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;
          gap:8px!important;justify-content:stretch!important;
          min-width:0!important;width:100%!important
        }
        html[data-mlv-platform="android"] #tab-missions .v169-day-btn{
          box-sizing:border-box!important;min-width:0!important;
          width:100%!important;min-height:48px!important;
          height:48px!important;padding:8px 0!important;
          border-radius:13px!important;font-size:14px!important;
          touch-action:manipulation!important
        }
        html[data-mlv-platform="android"] #tab-missions .v169-template-actions{
          display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:8px!important;min-width:0!important;justify-content:stretch!important
        }
        html[data-mlv-platform="android"] #tab-missions .v169-small-btn{
          min-width:0!important;min-height:48px!important;
          font-size:12px!important;touch-action:manipulation!important
        }
        html[data-mlv-platform="android"] #tab-missions
        :is(.v169-weekly-form input,.v169-weekly-form select,.v169-day-btn,.v169-small-btn):focus-visible{
          outline:2px solid var(--ui-accent,#75e4ff)!important;
          outline-offset:2px!important
        }
      }
      @media(min-width:700px){
        html[data-mlv-platform="android"] [data-mlv216-qc] .mlv216-qc-card{
          margin-bottom:12px!important;border-radius:24px
        }
      }
      #mlv-android-bottom-nav button{
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:2px;min-width:0;min-height:51px;padding:5px 1px;
        border:1px solid transparent;border-radius:12px;
        color:var(--muted,#b6c1d2);background:transparent;
        font:700 10px/1.15 var(--mlv-ui-font,system-ui,sans-serif);
        -webkit-tap-highlight-color:transparent;touch-action:manipulation
      }
      #mlv-android-bottom-nav button[aria-current="page"]{
        background:rgba(var(--ui-accent-rgb,117,228,255),.13);
        border-color:rgba(var(--ui-accent-rgb,117,228,255),.25);
        color:var(--text,#edf7ff)
      }
      #mlv-android-bottom-nav button .mlv-android-nav-glyph{font-size:20px;line-height:1.05}
      html[data-mlv-platform="android"] #mlv-android-focus-overlay:not([hidden]){
        display:flex;position:fixed;inset:0;z-index:2147483100;
        flex-direction:column;justify-content:flex-end;box-sizing:border-box
      }
      #mlv-android-focus-dim{
        position:absolute;inset:0;background:rgba(2,5,13,.76);border:0;border-radius:0;padding:0
      }
      #mlv-android-focus-sheet{
        position:relative;display:flex;flex-direction:column;gap:12px;
        width:100%;max-width:700px;max-height:calc(100dvh - 22px);
        margin:0 auto;overflow-y:auto;overscroll-behavior:contain;
        padding:18px 16px calc(22px + env(safe-area-inset-bottom,0px));
        box-sizing:border-box;border:1px solid rgba(var(--ui-accent-rgb,117,228,255),.30);
        border-bottom:0;border-radius:24px 24px 0 0;
        background:linear-gradient(160deg,rgba(var(--ui-panel-rgb,8,15,27),.99),rgba(9,14,27,.99));
        color:var(--text,#f0f7ff);
        box-shadow:0 -18px 50px rgba(0,0,0,.48);
        font-family:var(--mlv-ui-font,system-ui,sans-serif)
      }
      #mlv-android-focus-sheet h2{margin:0;font-size:22px;line-height:1.15}
      #mlv-android-focus-sheet p{margin:0;color:var(--muted,#b9c9dc);font-size:12px;line-height:1.45}
      .mlv-android-focus-head{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}
      .mlv-android-focus-close{flex:0 0 42px;width:42px;height:42px}
      #mlv-android-focus-sheet button,#mlv-android-focus-sheet input{
        font-family:inherit;box-sizing:border-box;border-radius:12px
      }
      #mlv-android-focus-sheet button{
        min-height:46px;padding:9px 12px;
        border:1px solid rgba(255,255,255,.15);
        background:rgba(255,255,255,.065);color:inherit;
        font-weight:800;touch-action:manipulation
      }
      #mlv-android-focus-sheet button.primary{
        background:var(--ui-accent,#75e4ff);color:#07131b;
        border-color:transparent
      }
      .mlv-android-focus-clock{
        text-align:center;padding:18px 8px;
        border:1px solid rgba(255,255,255,.11);border-radius:18px;
        background:rgba(255,255,255,.035)
      }
      #mlv-android-focus-time{display:block;font-size:clamp(48px,16vw,76px);font-weight:900;letter-spacing:-.055em;font-variant-numeric:tabular-nums;line-height:1.1}
      #mlv-android-focus-status{display:block;margin-top:8px;color:var(--muted,#b4c6d6);font-size:12px}
      .mlv-android-focus-presets,.mlv-android-focus-main-actions{
        display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px
      }
      .mlv-android-focus-presets button[aria-pressed="true"]{
        border-color:var(--ui-accent,#75e4ff)!important;background:rgba(var(--ui-accent-rgb,117,228,255),.16)!important
      }
      .mlv-android-focus-compact{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .mlv-android-focus-compact label{display:flex;flex-direction:column;gap:5px;font-size:11px}
      .mlv-android-focus-compact input{
        width:100%;min-height:44px;padding:8px 12px;border:1px solid rgba(255,255,255,.16);
        background:rgba(0,0,0,.20);color:inherit;font-size:16px
      }
      #mlv-android-focus-apply{grid-column:span 2}
      .mlv-android-focus-footer{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:11px;color:var(--muted,#b2c3d1)}
      #mlv-android-focus-linked{overflow-wrap:anywhere}
      body.mlv-android-focus-open{overscroll-behavior:none!important}

      /* Android native-feeling hierarchy: one bottom navigation and a truly
         independent Focus workspace. No Desktop theme/markup modifications. */
      html[data-mlv-platform="android"] #mlv-android-bottom-nav{
        grid-template-columns:repeat(5,minmax(0,1fr));
        padding:7px 9px calc(9px + env(safe-area-inset-bottom,0px));
        gap:4px;background:rgba(var(--ui-panel-rgb,7,13,25),.975);
        border-top:1px solid rgba(var(--ui-accent-rgb,117,228,255),.16)
      }
      html[data-mlv-platform="android"] #mlv-android-bottom-nav button{
        border-radius:15px;min-height:56px;padding:7px 2px;
        font-size:10px;letter-spacing:.005em
      }
      html[data-mlv-platform="android"] #mlv-android-bottom-nav button[data-mobile-tab="focus"]{
        color:var(--text,#eff7ff);
        background:linear-gradient(145deg,rgba(var(--ui-accent-rgb,117,228,255),.17),rgba(var(--ui-accent-rgb,117,228,255),.055));
        border-color:rgba(var(--ui-accent-rgb,117,228,255),.30);
        box-shadow:inset 0 1px rgba(255,255,255,.09)
      }
      html[data-mlv-platform="android"] #mlv-android-bottom-nav button[data-mobile-tab="focus"] .mlv-android-nav-glyph{
        font-size:24px;color:var(--ui-accent,#75e4ff)
      }
      html[data-mlv-platform="android"] #mlv-android-topbar .mlv-android-topbar-copy strong{
        font-size:16px!important;font-weight:800!important;letter-spacing:-.035em!important
      }
      html[data-mlv-platform="android"] #mlv-android-topbar .mlv-android-topbar-copy span{
        font-size:12px!important;opacity:.78!important
      }
      html[data-mlv-platform="android"] #mlv-android-topbar .mlv-android-section-controls button{
        width:38px!important;height:44px!important;min-width:38px!important;
        border-radius:13px!important
      }
      html[data-mlv-platform="android"] #tab-dashboard .v131-hero{
        border-color:rgba(var(--ui-accent-rgb,117,228,255),.19)!important;
        box-shadow:0 10px 30px rgba(0,0,0,.16)!important
      }
      html[data-mlv-platform="android"] #tab-dashboard .v131-kpi{
        border:1px solid rgba(255,255,255,.10)!important;
        background:linear-gradient(165deg,rgba(var(--ui-panel-rgb,8,16,28),.47),rgba(8,12,25,.30))!important
      }
      /* Work begins at Today, not behind Settings. Compact inline access
         comes before metrics without replacing a single desktop card. */
      html[data-mlv-platform="android"] #mlv-android-today-focus{
        display:flex;align-items:center;gap:10px;min-width:0;
        min-height:57px;padding:10px 11px;margin:7px 0 2px;
        border-radius:17px;
        border:1px solid rgba(var(--ui-accent-rgb,117,228,255),.25);
        background:linear-gradient(112deg,rgba(var(--ui-accent-rgb,117,228,255),.14),rgba(var(--ui-panel-rgb,8,16,27),.44));
        box-sizing:border-box;touch-action:pan-y
      }
      #mlv-android-today-focus .mlv-focus-today-icon{
        flex:0 0 39px;width:39px;height:39px;display:grid;place-items:center;
        border-radius:13px;background:rgba(var(--ui-accent-rgb,117,228,255),.14);
        color:var(--ui-accent,#75e4ff);font:800 25px/1 system-ui,sans-serif
      }
      #mlv-android-today-focus .mlv-focus-today-copy{
        display:flex;flex:1 1 auto;min-width:0;flex-direction:column;gap:3px
      }
      #mlv-android-today-focus .mlv-focus-today-copy strong{
        font:800 13px/1.2 system-ui,sans-serif;color:var(--text,#eff7ff)
      }
      #mlv-android-today-focus .mlv-focus-today-copy span{
        font:500 11px/1.25 system-ui,sans-serif;color:var(--muted,#b6c7d8)
      }
      #mlv-android-today-focus button{
        flex:0 0 auto;min-height:44px;min-width:71px;padding:8px 10px;
        border:1px solid rgba(var(--ui-accent-rgb,117,228,255),.38);
        border-radius:13px;background:rgba(var(--ui-accent-rgb,117,228,255),.17);
        color:var(--text,#eff7ff);font:800 12px system-ui,sans-serif;
        touch-action:manipulation
      }
      /* Running/paused timer belongs to the same shared FocusStoryV30162
         engine; this is a view of its state, never an independent counter. */
      #mlv-android-mini-focus{display:none}
      html[data-mlv-platform="android"] #mlv-android-mini-focus:not([hidden]){
        display:flex;position:fixed;left:10px;right:10px;
        bottom:calc(82px + env(safe-area-inset-bottom,0px));
        z-index:2147482978;align-items:center;gap:9px;
        min-height:59px;box-sizing:border-box;padding:9px 10px;
        border-radius:17px;border:1px solid rgba(var(--ui-accent-rgb,117,228,255),.36);
        background:linear-gradient(125deg,rgba(var(--ui-panel-rgb,7,13,25),.99),rgba(18,29,44,.99));
        box-shadow:0 9px 31px rgba(0,0,0,.45);
        color:var(--text,#eff7ff);touch-action:pan-y
      }
      #mlv-android-mini-focus .mlv-mini-open{
        flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:9px;
        text-align:left;background:transparent;border:0;padding:0;
        color:inherit;min-height:44px;touch-action:manipulation
      }
      #mlv-android-mini-focus .mlv-mini-symbol{
        display:grid;place-items:center;flex:0 0 38px;width:38px;height:38px;
        border-radius:12px;background:rgba(var(--ui-accent-rgb,117,228,255),.14);
        color:var(--ui-accent,#75e4ff);font-size:23px
      }
      #mlv-android-mini-focus .mlv-mini-text{
        display:flex;min-width:0;flex-direction:column;gap:2px;align-items:flex-start
      }
      #mlv-android-mini-focus .mlv-mini-text strong{
        font:800 16px/1.16 system-ui,sans-serif;font-variant-numeric:tabular-nums
      }
      #mlv-android-mini-focus .mlv-mini-text span{
        font:600 10px/1.2 system-ui,sans-serif;color:var(--muted,#b4c3d5)
      }
      #mlv-android-mini-focus .mlv-mini-toggle{
        flex:0 0 77px;min-width:77px;min-height:44px;
        border:1px solid rgba(var(--ui-accent-rgb,117,228,255),.45);
        border-radius:12px;background:rgba(var(--ui-accent-rgb,117,228,255),.20);
        font:800 12px system-ui,sans-serif;color:inherit;touch-action:manipulation
      }
      html[data-mlv-platform="android"] body.mlv-android-timer-active #main{
        padding-bottom:calc(164px + env(safe-area-inset-bottom,0px))!important
      }
      html[data-mlv-platform="android"] body.mlv-android-focus-open #mlv-android-mini-focus,
      html[data-mlv-platform="android"] body.mlv-android-mission-edit-open #mlv-android-mini-focus,
      html[data-mlv-platform="android"] body:has(#mlv200Onboarding:not([hidden])) #mlv-android-mini-focus,
      html[data-mlv-platform="android"] body:has([data-mlv216-qc]:not([hidden])) #mlv-android-mini-focus,
      html[data-mlv-platform="android"] body.mlv-android-keyboard-editing #mlv-android-mini-focus{
        display:none!important;pointer-events:none!important
      }
      /* Story's first-launch explanation must not push the actual form
         beneath the phone viewport. Desktop Story remains unchanged. */
      @media(max-width:680px){
        html[data-mlv-platform="android"] #tab-story .v30162-story-empty{
          min-height:0!important;padding:16px 15px!important
        }
        html[data-mlv-platform="android"] #tab-story .v30162-story-empty h2{
          font-size:clamp(19px,5vw,24px)!important;line-height:1.18!important
        }
        html[data-mlv-platform="android"] #tab-story .v30162-story-empty p{
          font-size:12px!important;line-height:1.35!important;
          margin-bottom:0!important
        }
        html[data-mlv-platform="android"] #tab-story .v30162-story-form{
          grid-template-columns:minmax(0,1fr)!important;gap:11px!important
        }
        html[data-mlv-platform="android"] #tab-story .v30162-story-form input{
          min-height:48px!important;font-size:16px!important
        }
        html[data-mlv-platform="android"] #tab-story .v30162-story-form button[type="submit"]{
          min-height:52px!important;scroll-margin-bottom:110px
        }
      }
      /* Focus is a full mobile workspace, not a desktop popover or a
         Settings subsection. Its content scrolls safely on compact phones. */
      html[data-mlv-platform="android"] #mlv-android-focus-overlay:not([hidden]){
        display:flex!important;position:fixed;inset:0!important;
        z-index:2147483100!important;justify-content:stretch!important;
        align-items:stretch!important;flex-direction:column!important;
        background:rgba(var(--ui-panel-rgb,7,13,25),1)!important;
        overflow:hidden!important
      }
      html[data-mlv-platform="android"] #mlv-android-focus-dim{display:none!important}
      html[data-mlv-platform="android"] #mlv-android-focus-sheet{
        position:relative!important;width:100%!important;
        max-width:700px!important;height:100dvh!important;
        max-height:100dvh!important;min-height:0!important;
        margin:0 auto!important;padding:
          calc(22px + env(safe-area-inset-top,0px)) 20px
          calc(29px + env(safe-area-inset-bottom,0px))!important;
        border:0!important;border-radius:0!important;
        gap:16px!important;overflow-y:auto!important;
        box-shadow:none!important;
        background:
          radial-gradient(ellipse at 51% 27%,rgba(var(--ui-accent-rgb,117,228,255),.105),transparent 47%),
          rgba(var(--ui-panel-rgb,7,13,25),.99)!important;
        -webkit-overflow-scrolling:touch;touch-action:pan-y!important
      }
      #mlv-android-focus-sheet .mlv-android-focus-head{
        align-items:center;gap:14px;padding-bottom:4px
      }
      #mlv-android-focus-sheet .mlv-android-focus-eyebrow{
        display:block;margin-bottom:6px;text-transform:uppercase;
        letter-spacing:.18em;font:800 10px system-ui,sans-serif;
        color:var(--ui-accent,#75e4ff)
      }
      #mlv-android-focus-sheet h2{
        font:800 clamp(25px,7vw,33px)/1.1 system-ui,sans-serif!important;
        letter-spacing:-.035em!important
      }
      #mlv-android-focus-sheet .mlv-android-focus-close{
        flex:0 0 48px!important;width:48px!important;height:48px!important;
        min-width:48px!important;min-height:48px!important;max-width:48px!important;
        max-height:48px!important;padding:0!important;
        font-size:24px!important;border-radius:15px!important
      }
      #mlv-android-focus-sheet .mlv-android-focus-clock{
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        flex:0 0 auto;min-height:260px;padding:5px 0;
        border:0!important;border-radius:0!important;background:transparent!important
      }
      #mlv-android-focus-sheet #mlv-android-focus-progress-ring{
        display:flex;align-items:center;justify-content:center;
        width:min(65vw,240px);height:min(65vw,240px);
        padding:8px;box-sizing:border-box;border-radius:50%;
        background:conic-gradient(
          var(--ui-accent,#75e4ff) var(--mlv-focus-progress,100%),
          rgba(255,255,255,.12) 0
        );
        box-shadow:0 0 45px rgba(var(--ui-accent-rgb,117,228,255),.105)
      }
      #mlv-android-focus-sheet .mlv-android-focus-dial{
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        width:100%;height:100%;gap:4px;border-radius:50%;
        background:rgba(var(--ui-panel-rgb,7,13,25),.99);
        box-shadow:inset 0 0 22px rgba(0,0,0,.25)
      }
      #mlv-android-focus-time{
        font-size:clamp(38px,11vw,54px)!important;
        line-height:1.05!important;letter-spacing:-.065em!important
      }
      #mlv-android-focus-sheet .mlv-android-focus-phase{
        color:var(--ui-accent,#75e4ff);
        font:800 11px system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase
      }
      #mlv-android-focus-sheet #mlv-android-focus-status{
        margin-top:14px;font:700 13px/1.3 system-ui,sans-serif;
        letter-spacing:.01em
      }
      #mlv-android-focus-sheet .mlv-android-focus-presets{
        grid-template-columns:repeat(2,minmax(0,1fr));gap:10px
      }
      #mlv-android-focus-sheet .mlv-android-focus-presets button{
        min-height:56px!important;height:auto!important;padding:14px 12px!important;
        border-radius:16px!important;font-size:14px!important
      }
      #mlv-android-focus-sheet .mlv-android-focus-main-actions{
        grid-template-columns:repeat(2,minmax(0,1fr));gap:10px
      }
      #mlv-android-focus-sheet .mlv-android-focus-main-actions button{
        min-height:56px!important;height:auto!important;padding:14px 12px!important;
        border-radius:17px!important;font-size:14px!important
      }
      #mlv-android-focus-sheet .mlv-android-focus-main-actions button.primary{
        grid-column:span 2;min-height:62px!important;font-size:17px!important;
        box-shadow:0 9px 26px rgba(var(--ui-accent-rgb,117,228,255),.14)
      }
      #mlv-android-focus-sheet .mlv-android-focus-stats{
        display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
        gap:9px;border-top:1px solid rgba(255,255,255,.10);padding-top:14px
      }
      #mlv-android-focus-sheet .mlv-android-focus-stats>div{
        display:flex;flex-direction:column;gap:5px;padding:13px;
        border-radius:15px;background:rgba(255,255,255,.045);
        border:1px solid rgba(255,255,255,.065)
      }
      #mlv-android-focus-sheet .mlv-android-focus-stats span{
        color:var(--muted,#b6c6d8);font:600 11px/1.25 system-ui,sans-serif
      }
      #mlv-android-focus-sheet .mlv-android-focus-stats strong{
        font:800 14px/1.2 system-ui,sans-serif;overflow-wrap:anywhere
      }
      #mlv-android-focus-sheet details{
        padding:12px 13px;border:1px solid rgba(255,255,255,.12);
        border-radius:15px;background:rgba(255,255,255,.025)
      }
      #mlv-android-focus-sheet details summary{
        font:700 12px system-ui,sans-serif;padding:5px 2px;
        touch-action:manipulation;cursor:pointer
      }
      #mlv-android-focus-sheet .mlv-android-focus-compact{margin-top:13px}
      #mlv-android-focus-sheet .mlv-android-focus-footer{display:none}
      #mlv-android-focus-sheet .mlv-android-focus-system-note{
        font-size:11px!important;opacity:.8;line-height:1.4!important
      }
      /* Real Android screenshot QA: stop label/value collisions inherited
         from older desktop button/span and notification styles. */
      html[data-mlv-platform="android"] #mlv-android-today-focus{
        display:flex!important;align-items:center!important;gap:12px!important
      }
      html[data-mlv-platform="android"] #mlv-android-today-focus .mlv-focus-today-copy{
        display:flex!important;flex-direction:column!important;align-items:flex-start!important;
        justify-content:center!important;flex:1 1 auto!important;min-width:0!important;
        gap:5px!important
      }
      html[data-mlv-platform="android"] #mlv-android-today-focus .mlv-focus-today-copy strong,
      html[data-mlv-platform="android"] #mlv-android-today-focus .mlv-focus-today-copy span{
        display:block!important;position:static!important;max-width:100%!important;
        overflow-wrap:anywhere!important;line-height:1.35!important
      }
      html[data-mlv-platform="android"] #mlv-android-today-focus button{
        flex:0 0 auto!important;min-width:72px!important;min-height:46px!important;
        white-space:normal!important
      }
      html[data-mlv-platform="android"] #mlv-android-mini-focus:not([hidden]){
        display:flex!important;align-items:center!important;gap:9px!important;
        left:10px!important;right:10px!important;
        width:calc(100% - 20px)!important;max-width:none!important;
        box-sizing:border-box!important;
        bottom:calc(82px + env(safe-area-inset-bottom,0px))!important
      }
      html[data-mlv-platform="android"] #mlv-android-mini-focus .mlv-mini-open{
        display:flex!important;flex:1 1 auto!important;align-items:center!important;
        justify-content:flex-start!important;gap:10px!important;
        min-width:0!important;width:auto!important
      }
      html[data-mlv-platform="android"] #mlv-android-mini-focus .mlv-mini-symbol{
        display:grid!important;place-items:center!important;
        flex:0 0 38px!important;width:38px!important
      }
      html[data-mlv-platform="android"] #mlv-android-mini-focus .mlv-mini-text{
        display:flex!important;flex:1 1 auto!important;flex-direction:column!important;
        min-width:0!important;align-items:flex-start!important;gap:4px!important
      }
      html[data-mlv-platform="android"] #mlv-android-mini-focus .mlv-mini-text strong,
      html[data-mlv-platform="android"] #mlv-android-mini-focus .mlv-mini-text span{
        display:block!important;position:static!important;line-height:1.2!important;
        overflow-wrap:anywhere!important
      }
      html[data-mlv-platform="android"] #mlv-android-mini-focus .mlv-mini-toggle{
        flex:0 0 auto!important;min-width:71px!important;min-height:44px!important
      }
      html[data-mlv-platform="android"] #mlv-android-focus-sheet .mlv-android-focus-stats{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        align-items:stretch!important;gap:9px!important;
      }
      html[data-mlv-platform="android"] #mlv-android-focus-sheet .mlv-android-focus-stats>div{
        display:flex!important;flex-direction:column!important;gap:6px!important;
        min-width:0!important;max-width:100%!important;box-sizing:border-box!important
      }
      html[data-mlv-platform="android"] #mlv-android-focus-sheet .mlv-android-focus-stats span,
      html[data-mlv-platform="android"] #mlv-android-focus-sheet .mlv-android-focus-stats strong{
        display:block!important;position:static!important;
        min-width:0!important;overflow-wrap:anywhere!important;line-height:1.3!important
      }
      /* A toast is feedback, not a blocker over the five permanent nav tabs
         or over the running timer's Pause and Open controls. */
      html[data-mlv-platform="android"] #toastWrap{
        position:fixed!important;left:12px!important;right:12px!important;
        bottom:calc(93px + env(safe-area-inset-bottom,0px))!important;
        width:auto!important;max-width:none!important;
        max-height:min(40dvh,320px)!important;overflow-y:auto!important;
        display:grid!important;gap:8px!important;
        box-sizing:border-box!important;pointer-events:none!important;
        z-index:2147483000!important
      }
      html[data-mlv-platform="android"] body.mlv-android-timer-active #toastWrap{
        bottom:calc(185px + env(safe-area-inset-bottom,0px))!important
      }
      html[data-mlv-platform="android"] #toastWrap .toast{
        box-sizing:border-box!important;max-width:100%!important;width:100%!important;
        margin:0!important;pointer-events:auto!important
      }
      @media(max-width:360px){
        html[data-mlv-platform="android"] #mlv-android-focus-sheet .mlv-android-focus-stats{
          grid-template-columns:minmax(0,1fr)!important
        }
      }

      @media(max-height:750px){
        #mlv-android-focus-sheet{gap:11px!important}
        #mlv-android-focus-sheet .mlv-android-focus-clock{min-height:209px}
        #mlv-android-focus-sheet #mlv-android-focus-progress-ring{
          width:185px;height:185px
        }
      }

    `;
    document.head.appendChild(style);
  }
  // Canonical shared renderers can reinsert late !important desktop geometry.
  // Apply mobile presentation to the rendered Weekly Planner only when it
  // appears, without copying or mutating its templates or scheduling state.
  function adaptWeeklyPlanner(){
    if(document.documentElement.dataset.mlvPlatform!=='android'||innerWidth>720)return;
    const root=q('#tab-missions .v169-weekly-planner');
    if(!root)return;
    const force=(el,prop,value)=>{
      if(el&&(el.style.getPropertyValue(prop)!==value||
          el.style.getPropertyPriority(prop)!=='important'))
        el.style.setProperty(prop,value,'important');
    };
    const form=q('#v169WeeklyForm',root);
    force(form,'display','grid');
    force(form,'grid-template-columns','minmax(0,1fr)');
    for(const el of form?.querySelectorAll('input,select,button')||[]){
      force(el,'min-width','0');
      force(el,'width','100%');
      force(el,'min-height','48px');
      if(el.matches('input,select'))force(el,'font-size','16px');
    }
    for(const card of root.querySelectorAll('.v169-weekly-template')){
      force(card,'display','grid');
      force(card,'grid-template-columns','minmax(0,1fr)');
      const days=q('.v169-day-row',card);
      force(days,'display','grid');
      force(days,'grid-template-columns','repeat(4,minmax(0,1fr))');
      force(days,'gap','8px');
      force(days,'width','100%');
      for(const button of card.querySelectorAll('.v169-day-btn')){
        force(button,'width','100%');
        force(button,'min-width','0');
        force(button,'height','48px');
        force(button,'min-height','48px');
      }
      const actions=q('.v169-template-actions',card);
      force(actions,'display','grid');
      force(actions,'grid-template-columns','repeat(2,minmax(0,1fr))');
      force(actions,'gap','8px');
      for(const button of card.querySelectorAll('.v169-small-btn')){
        force(button,'min-height','48px');
        force(button,'min-width','0');
      }
    }
  }
  // Shared mission editor is recreated by desktop renderers. Android owns
  // its final form geometry after DOM insertion, so desktop !important and
  // late-injected styles cannot re-introduce narrow weekday hit areas.
  function adaptMissionEditor(){
    const form=q('#modalRoot #missionEditForm');
    const isAndroid=document.documentElement.dataset.mlvPlatform==='android';
    // A full-screen editor is an exclusive interaction layer, not content
    // above still-clickable fixed navigation. Observer restores it on close.
    document.body.classList.toggle('mlv-android-mission-edit-open',!!(isAndroid&&form));
    if(!form||!isAndroid)return;
    const host=q('#modalRoot'),backdrop=q('.modal-backdrop',host),modal=q('.modal',backdrop);
    const force=(el,property,value)=>{
      if(!el)return;
      if(el.style.getPropertyValue(property)===value&&el.style.getPropertyPriority(property)==='important')return;
      el.style.setProperty(property,value,'important');
    };
    [
      ['display','flex'],['flex-direction','column'],['align-items','center'],
      ['justify-content','flex-end'],['padding','0'],['inset','0'],['overflow','hidden']
    ].forEach(([property,value])=>force(backdrop,property,value));
    [
      ['width','100vw'],['max-width','100vw'],['min-width','0'],
      ['height','auto'],['max-height','calc(100dvh - 8px)'],
      ['margin','0'],['box-sizing','border-box'],['overflow-y','auto'],
      ['overflow-x','hidden'],['border-radius','22px 22px 0 0'],
      ['padding','15px 15px calc(20px + env(safe-area-inset-bottom,0px))']
    ].forEach(([property,value])=>force(modal,property,value));
    form.querySelectorAll('.days').forEach(days=>{
      [['display','grid'],['grid-template-columns','repeat(2,minmax(0,1fr))'],
       ['width','100%'],['min-width','0'],['gap','8px']].forEach(([property,value])=>force(days,property,value));
    });
    form.querySelectorAll('label.day-chip').forEach(label=>{
      [['display','flex'],['align-items','center'],['min-height','46px'],
       ['padding','8px'],['box-sizing','border-box'],['min-width','0'],
       ['touch-action','manipulation'],['white-space','normal']]
        .forEach(([property,value])=>force(label,property,value));
    });
    const actions=q(':scope > .actions',form);
    if(actions){
      [['position','sticky'],['bottom','0'],['display','grid'],
       ['grid-template-columns','repeat(2,minmax(0,1fr))'],
       ['width','100%'],['min-width','0'],['gap','8px'],
       ['z-index','4'],['padding','12px 0 calc(12px + env(safe-area-inset-bottom,0px))']]
        .forEach(([property,value])=>force(actions,property,value));
      actions.querySelectorAll('button').forEach(button=>{
        [['min-height','49px'],['width','100%'],['min-width','0']].forEach(([property,value])=>force(button,property,value));
      });
    }
  }
  function adaptQuickCaptureControls(){
    const field=q('[data-mlv216-qc]:not([hidden]) [data-mlv216-qc-input]');
    if(!field)return;
    // Legacy desktop input authorities can reapply 14px/44px at runtime.
    // Android owns the final touch target, without mutating the shared
    // input renderer or changing Desktop.
    for(const [property,value] of [
      ['font-size','16px'],['min-height','51px'],['height','51px'],
      ['line-height','1.25']
    ])field.style.setProperty(property,value,'important');
  }
  function ensure(){
    if(root&&nav)return true;
    if(!document.body||document.documentElement.dataset.mlvPlatform!=='android')return false;
    addStyles();
    if(!nav){
      nav=document.createElement('nav');
      nav.id='mlv-android-bottom-nav';
      nav.setAttribute('aria-label','Mobile primary navigation');
      actions.forEach(({id,label,glyph})=>{
        const button=document.createElement('button');
        button.type='button';button.dataset.mobileTab=id;button.setAttribute('aria-label',label);
        const ico=document.createElement('span');ico.className='mlv-android-nav-glyph';ico.setAttribute('aria-hidden','true');ico.textContent=glyph;
        const text=document.createElement('span');text.textContent=label;button.append(ico,text);
        nav.appendChild(button);
      });
      nav.addEventListener('click',event=>{
        const target=event.target.closest('button[data-mobile-tab]');
        if(!target)return;
        const tab=target.dataset.mobileTab;
        if(tab==='focus'){
          // Pomodoro lives in the permanent bottom bar, never only in a
          // drawer. Keep using the canonical FocusStoryV30162 timer state.
          open();return;
        }
        close();
        let routed=false;
        try{routed=window.__mlvAndroidFastRoute?.(tab)===true;}catch(error){
          console.warn('Android bottom navigation',error);
        }
        if(!routed){
          // Recover from a stale first-launch Story or Settings renderer.
          try{window.LeftNavV30171?.route?.(tab);}catch(error){
            console.warn('Android bottom canonical fallback',error);
          }
        }
        updateActive();
      });
      document.body.appendChild(nav);
    }
    if(!root){
      root=document.createElement('div');
      root.id='mlv-android-focus-overlay';root.hidden=true;
      root.innerHTML=`
        <button type="button" id="mlv-android-focus-dim" aria-label="Close Focus"></button>
        <section id="mlv-android-focus-sheet" role="dialog" aria-modal="true" aria-labelledby="mlv-android-focus-heading">
          <div class="mlv-android-focus-head">
            <div><span class="mlv-android-focus-eyebrow">POMODORO</span><h2 id="mlv-android-focus-heading">Your Pomodoro timer.</h2><p>Your session, your rhythm.</p></div>
            <button type="button" class="mlv-android-focus-close" data-mobile-focus="close" aria-label="Close Focus">×</button>
          </div>
          <div class="mlv-android-focus-clock">
            <div id="mlv-android-focus-progress-ring">
              <div class="mlv-android-focus-dial">
                <span class="mlv-android-focus-phase" id="mlv-android-focus-phase">FOCUS</span>
                <strong id="mlv-android-focus-time" role="timer" aria-live="off">25:00</strong>
              </div>
            </div>
            <span id="mlv-android-focus-status">Ready · Work</span>
          </div>
          <div class="mlv-android-focus-presets" aria-label="Focus presets">
            <button type="button" data-mobile-preset="25/5">25 / 5</button>
            <button type="button" data-mobile-preset="50/10">50 / 10</button>
          </div>
          <div class="mlv-android-focus-main-actions">
            <button type="button" class="primary" data-mobile-focus="toggle">Start</button>
            <button type="button" data-mobile-focus="skip">Skip phase</button>
            <button type="button" data-mobile-focus="reset">Reset</button>
            <button type="button" data-mobile-focus="settings">Focus settings</button>
          </div>
          <details><summary>Custom work / break duration</summary>
            <div class="mlv-android-focus-compact">
              <label>Work minutes<input type="number" min="1" max="180" id="mlv-android-focus-work" value="25" /></label>
              <label>Break minutes<input type="number" min="1" max="60" id="mlv-android-focus-break" value="5" /></label>
              <button type="button" id="mlv-android-focus-apply" data-mobile-focus="custom">Apply custom preset</button>
            </div>
          </details>
          <div class="mlv-android-focus-stats">
            <div><span>Linked mission</span><strong id="mlv-android-focus-linked">No mission linked</strong></div>
            <div><span>Finished today</span><strong id="mlv-android-focus-count">0 sessions</strong></div>
          </div>
          <p class="mlv-android-focus-system-note">The timer uses your existing Michel’s Life progress. Android notifications require permission and may be delayed by battery-saving settings.</p>
        </section>`;
      root.addEventListener('click',event=>{
        const source=event.target.closest('[data-mobile-focus],[data-mobile-preset],#mlv-android-focus-dim');
        if(!source)return;
        if(source.id==='mlv-android-focus-dim'){close();return;}
        const api=focusApi();
        const preset=source.dataset.mobilePreset;
        if(preset){
          // Delegate to the authoritative desktop Focus implementation; it
          // owns confirmation, session persistence and linked mission state.
          const original=q('#v30162FocusDock [data-v30162-preset="'+preset+'"]');
          if(original)original.click();
          updateFocus();return;
        }
        const action=source.dataset.mobileFocus;
        if(action==='close'){close();return;}
        if(!api){return;}
        if(action==='toggle'){
          if(api.focusState?.().status!=='running')requestNativeFocusPermission();
          api.toggleFocus?.();
        }
        if(action==='skip'){
          if(api.focusState?.().status==='running'&&!window.confirm('Skip the current focus phase?'))return;
          api.skipFocus?.();
        }
        if(action==='reset'){
          if(api.focusState?.().status==='running'&&!window.confirm('Reset the running focus phase?'))return;
          api.resetFocus?.();
        }
        if(action==='custom'){
          const work=q('#mlv-android-focus-work')?.value;
          const rest=q('#mlv-android-focus-break')?.value;
          const origWork=q('#v30162WorkMin'),origBreak=q('#v30162BreakMin');
          if(!origWork||!origBreak)return;
          origWork.value=work;origBreak.value=rest;
          q('#v30162FocusDock [data-v30162-focus="apply-custom"]')?.click();
        }
        if(action==='settings'){close();window.__mlvAndroidFastRoute?.('settings');setTimeout(()=>q('#tab-settings [data-v30171-setting="focus"]')?.click(),50);}
        updateFocus();
      });
      document.body.appendChild(root);
    }
    // Only one persistent mini-view of the canonical Focus timer. Both
    // buttons delegate to FocusStoryV30162; there is no Android timer store.
    if(!mini){
      mini=document.createElement('aside');
      mini.id='mlv-android-mini-focus';
      mini.hidden=true;
      mini.setAttribute('aria-label','Active Focus timer');
      mini.innerHTML='<button type="button" class="mlv-mini-open" aria-label="Open Focus timer">'+
        '<span class="mlv-mini-symbol" aria-hidden="true">◷</span>'+
        '<span class="mlv-mini-text"><strong id="mlv-android-mini-time">25:00</strong>'+
        '<span id="mlv-android-mini-state">Focus session</span></span></button>'+
        '<button type="button" class="mlv-mini-toggle" aria-label="Pause Focus timer">Pause</button>';
      mini.querySelector('.mlv-mini-open').addEventListener('click',()=>open());
      mini.querySelector('.mlv-mini-toggle').addEventListener('click',()=>{
        const api=focusApi();
        const state=api?.focusState?.();
        if(state?.status==='running'||state?.status==='paused'){
          if(state.status==='paused')requestNativeFocusPermission();
          api.toggleFocus?.();
          updateFocus();
        }
      });
      document.body.appendChild(mini);
    }
    // One visible action from every Android section, no desktop shortcut
    // dependency. The canonical MLV216QuickCapture owns data and saving.
    const topbar=q('#mlv-android-topbar');
    if(topbar&&!q('#mlv-android-capture-button',topbar)){
      const capture=document.createElement('button');
      capture.type='button';capture.id='mlv-android-capture-button';
      capture.textContent='+';capture.setAttribute('aria-label','Quick capture');
      capture.setAttribute('title','Quick capture: mission or journal note');
      capture.addEventListener('click',()=>{
        close();
        window.MLV216QuickCapture?.open?.();
        adaptQuickCaptureControls();
        requestAnimationFrame(adaptQuickCaptureControls);
      });
      const arrows=q('.mlv-android-section-controls',topbar);
      topbar.insertBefore(capture,arrows||null);
    }
    updateActive();return true;
  }
  function updateActive(){
    if(!nav)return;
    const active=isFocusOpen()?'focus':(document.body.dataset.mlvAndroidTab||window.state?.activeTab||'dashboard');
    nav.querySelectorAll('[data-mobile-tab]').forEach(b=>{
      if(b.dataset.mobileTab===active)b.setAttribute('aria-current','page');
      else b.removeAttribute('aria-current');
    });
  }
  function ensureTodayFocus(){
    const hero=q('#tab-dashboard .v131-hero');
    if(!hero)return null;
    let tile=q('#mlv-android-today-focus',hero);
    if(tile)return tile;
    tile=document.createElement('div');
    tile.id='mlv-android-today-focus';
    tile.innerHTML='<span class="mlv-focus-today-icon" aria-hidden="true">◎</span>'+
      '<div class="mlv-focus-today-copy"><strong>Focus session</strong>'+
      '<span id="mlv-android-today-focus-status">Ready when you are</span></div>'+
      '<button type="button" id="mlv-android-today-focus-action">Start</button>';
    tile.querySelector('button').addEventListener('click',()=>{
      const api=focusApi(),state=api?.focusState?.();
      if(!state){open();return;}
      if(state.status==='ready'){
        requestNativeFocusPermission();
        api.toggleFocus?.();
        updateFocus();
      }
      open();
    });
    const metrics=q('.v131-kpis',hero);
    if(metrics)hero.insertBefore(tile,metrics);
    else hero.appendChild(tile);
    return tile;
  }
  function enforceFocusTextLayout(tile){
    const force=(el,entries)=>{
      if(!el)return;
      for(const [name,value] of entries){
        if(el.style.getPropertyValue(name)!==value||
           el.style.getPropertyPriority(name)!=='important')
          el.style.setProperty(name,value,'important');
      }
    };
    const column=[['display','flex'],['flex-direction','column'],['align-items','flex-start'],
      ['justify-content','center'],['position','relative'],['gap','5px'],['min-width','0']];
    const label=[['display','block'],['position','relative'],['width','100%'],
      ['height','auto'],['inset','auto'],['line-height','1.35']];
    force(tile?.querySelector('.mlv-focus-today-copy'),column);
    force(tile?.querySelector('.mlv-focus-today-copy strong'),label);
    force(tile?.querySelector('.mlv-focus-today-copy #mlv-android-today-focus-status'),label);
    force(mini?.querySelector('.mlv-mini-text'),column);
    force(mini?.querySelector('.mlv-mini-text strong'),label);
    force(mini?.querySelector('.mlv-mini-text span'),label);
    force(mini?.querySelector('.mlv-mini-toggle'),[
      ['min-height','44px'],['height','44px'],
      ['min-width','74px'],['width','auto'],
      ['position','relative'],['line-height','1.2']
    ]);
    root?.querySelectorAll('.mlv-android-focus-stats>div').forEach(box=>{
      force(box,column);
      force(box.querySelector('span'),label);
      force(box.querySelector('strong'),label);
    });
  }
  // Canonical desktop renderer and dynamic visual style layers may reapply
  // 46px button geometry after Android's theme stylesheet. Focus is an
  // Android-owned full-screen workspace: enforce its accessible tap geometry
  // on the real controls, rather than duplicating timer/domain state.
  function enforceFocusTouchTargets(){
    if(!root||root.hidden)return;
    const sheet=q('#mlv-android-focus-sheet',root);
    if(!sheet)return;
    sheet.querySelectorAll('button').forEach(button=>{
      const action=button.dataset.mobileFocus;
      const height=action==='close'?48:action==='toggle'?62:56;
      for(const [name,value] of [
        ['min-height',height+'px'],['height','auto'],['max-height','none'],
        ['touch-action','manipulation']
      ])if(button.style.getPropertyValue(name)!==value||
            button.style.getPropertyPriority(name)!=='important')
          button.style.setProperty(name,value,'important');
      if(action==='close'){
        for(const [name,value] of [['width','48px'],['min-width','48px'],
          ['max-width','48px'],['height','48px'],['max-height','48px']]){
          if(button.style.getPropertyValue(name)!==value||
             button.style.getPropertyPriority(name)!=='important')
            button.style.setProperty(name,value,'important');
        }
      }
    });
  }
  function updateFocus(){
    if(!root||!nav)return;
    const api=focusApi(),f=api?.focusState?.();
    const tile=ensureTodayFocus();
    enforceFocusTextLayout(tile);
    if(!f){
      if(!root.hidden)q('#mlv-android-focus-status',root).textContent='Focus is loading';
      if(mini)mini.hidden=true;
      document.body.classList.remove('mlv-android-timer-active');
      return;
    }
    syncNativeFocusAlarm(f);
    const active=f.status==='running'||f.status==='paused';
    const left=fmt(api.remaining?.(f));
    const mode=f.mode==='break'?'Break':'Focus';
    if(mini){
      mini.hidden=!active;
      if(active){
        q('#mlv-android-mini-time',mini).textContent=left;
        q('#mlv-android-mini-state',mini).textContent=mode+' · '+(f.status==='running'?'In progress':'Paused');
        const control=q('.mlv-mini-toggle',mini);
        control.textContent=f.status==='running'?'Pause':'Resume';
        control.setAttribute('aria-label',control.textContent+' '+mode+' timer');
      }
    }
    document.body.classList.toggle('mlv-android-timer-active',active);
    if(tile){
      const state=q('#mlv-android-today-focus-status',tile);
      const button=q('#mlv-android-today-focus-action',tile);
      state.textContent=active?mode+' · '+left+(f.status==='paused'?' paused':' remaining'):
        'Start a distraction-free session';
      button.textContent=active?'Open':'Start';
    }
    if(root.hidden)return;
    enforceFocusTouchTargets();
    q('#mlv-android-focus-time',root).textContent=left;
    q('#mlv-android-focus-phase',root).textContent=mode.toUpperCase();
    q('#mlv-android-focus-status',root).textContent=
      (f.status==='running'?'Session in progress':f.status==='paused'?'Session paused':'Ready to begin')+
      ' · '+(f.mode==='break'?'Recovery break':'Work session');
    q('[data-mobile-focus="toggle"]',root).textContent=
      f.status==='running'?'Pause session':f.status==='paused'?'Resume session':'Start focusing';
    root.querySelectorAll('[data-mobile-preset]').forEach(b=>
      b.setAttribute('aria-pressed',String(b.dataset.mobilePreset===f.preset))
    );
    const duration=(f.mode==='break'?Number(f.breakMin):Number(f.workMin))*60000;
    const leftMs=Number(api.remaining?.(f))||0;
    const pct=duration>0?Math.min(100,Math.max(0,100*leftMs/duration)):100;
    q('#mlv-android-focus-progress-ring',root).style.setProperty('--mlv-focus-progress',pct.toFixed(2)+'%');
    const focused=document.activeElement;
    if(focused?.id!=='mlv-android-focus-work')q('#mlv-android-focus-work',root).value=String(f.workMin);
    if(focused?.id!=='mlv-android-focus-break')q('#mlv-android-focus-break',root).value=String(f.breakMin);
    // Read the authoritative state for mission labels and completed sessions;
    // no copy of mission/timer data is stored by the Android UI.
    let saved={};
    try{saved=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}')||{}}catch(_){}
    const linked=(saved.missions||[]).find(m=>String(m.id)===String(f.linkedMissionId||''));
    q('#mlv-android-focus-linked',root).textContent=linked?linked.name:'None yet';
    const now=new Date();
    const day=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+
      '-'+String(now.getDate()).padStart(2,'0');
    const done=(api.focusSessions?.()||[]).filter(x=>x.status==='completed'&&x.date===day).length;
    q('#mlv-android-focus-count',root).textContent=done+' session'+(done===1?'':'s');
    const native=window.MichelsLifeAndroid;
    if(typeof native?.focusNotificationStatus==='function'){
      try{
        const state=JSON.parse(native.focusNotificationStatus());
        q('.mlv-android-focus-system-note',root).textContent=state.notificationsGranted?
          'Android reminders are on. Battery saving may delay a completion alert.':
          'Allow Michel’s Life notifications for reminders with the screen locked. Android may delay delivery.';
      }catch(_){}
    }
  }
  function open(){
    if(!ensure())return false;
    const api=focusApi();
    if(!api?.focusState){return false;}
    root.hidden=false;document.body.classList.add('mlv-android-focus-open');
    api.renderFocusDock?.();
    updateActive();updateFocus();
    q('[data-mobile-focus="close"]',root)?.focus();
    return true;
  }
  function close(){
    if(!root||root.hidden)return false;
    root.hidden=true;document.body.classList.remove('mlv-android-focus-open');
    updateActive();q('#mlv-android-bottom-nav [data-mobile-tab="focus"]')?.focus();
    return true;
  }
  // Story is rebuilt by the canonical renderer when Android changes tabs.
  // Keep only the unsaved input draft here; chapters themselves remain owned
  // by FocusStoryV30162 and the user's canonical data store.
  const chapterDraftKey='michelsLife.android.chapterDraft.v1';
  let chapterDraftLoaded=false,chapterDraft=null;
  function loadChapterDraft(){
    if(chapterDraftLoaded)return chapterDraft;
    chapterDraftLoaded=true;
    try{
      const saved=JSON.parse(sessionStorage.getItem(chapterDraftKey)||'null');
      if(saved&&typeof saved==='object')chapterDraft=saved;
    }catch(_){}
    return chapterDraft;
  }
  function discardChapterDraft(){
    chapterDraft=null;chapterDraftLoaded=true;
    try{sessionStorage.removeItem(chapterDraftKey);}catch(_){}
  }
  function rememberChapterDraft(form){
    if(!form||form.id!=='v30162ChapterForm')return;
    chapterDraft={
      name:String(form.elements.namedItem('name')?.value||''),
      motto:String(form.elements.namedItem('motto')?.value||''),
      start:String(form.elements.namedItem('start')?.value||'')
    };
    chapterDraftLoaded=true;
    try{sessionStorage.setItem(chapterDraftKey,JSON.stringify(chapterDraft));}catch(_){}
  }
  function restoreChapterDraft(){
    const story=q('#tab-story.active');
    if(!story)return;
    // Once the canonical renderer shows a real chapter, a draft must never
    // resurrect as a second chapter or overwrite actual saved information.
    if(q('.v30162-story-hero',story)){discardChapterDraft();return;}
    const form=q('#v30162ChapterForm',story);
    if(!form||form.dataset.mlvAndroidDraftRestored==='1')return;
    form.dataset.mlvAndroidDraftRestored='1';
    const draft=loadChapterDraft();
    if(!draft)return;
    for(const field of ['name','motto','start']){
      const input=form.elements.namedItem(field);
      if(input&&typeof draft[field]==='string')input.value=draft[field];
    }
  }
  function boot(){
    if(!ensure())return;
    const oldBack=window.__mlvAndroidHandleBack;
    window.__mlvAndroidHandleBack=function(){
      // Native Back closes Quick Capture without losing a mission draft via
      // implicit browser history; its storage is owned by the shared engine.
      if(q('[data-mlv216-qc]:not([hidden])')){
        window.MLV216QuickCapture?.close?.();
        return true;
      }
      if(isFocusOpen()){close();return true;}
      return typeof oldBack==='function'?oldBack():false;
    };
    const observer=new MutationObserver(updateActive);
    observer.observe(document.body,{attributes:true,attributeFilter:['data-mlv-android-tab']});
    // The shared Missions subtree is replaced on route/template changes.
    // Observe insertion only, not style attributes, to avoid reflow loops.
    const missionRoot=q('#main');
    if(missionRoot){
      const weeklyObserver=new MutationObserver(()=>{adaptWeeklyPlanner();restoreChapterDraft();});
      weeklyObserver.observe(missionRoot,{childList:true,subtree:true});
      adaptWeeklyPlanner();
      restoreChapterDraft();
      window.addEventListener('resize',adaptWeeklyPlanner,{passive:true});
    }
    const modalHost=q('#modalRoot');
    if(modalHost){
      const missionObserver=new MutationObserver(adaptMissionEditor);
      missionObserver.observe(modalHost,{childList:true,subtree:true});
      adaptMissionEditor();
    }
    // Hide floating timer while text input/IME owns the phone viewport.
    const typingField=el=>!!el?.closest?.(
      'textarea,[contenteditable="true"],input:not([type]),'+
      'input[type="text"],input[type="search"],input[type="email"],'+
      'input[type="password"],input[type="url"],input[type="tel"],input[type="number"]'
    );
    // Keep unfinished Story form text across Today/Focus/Story rerenders.
    // A successful chapter creation clears the transient draft only after
    // the canonical Story screen confirms that an active chapter exists.
    document.addEventListener('input',event=>{
      const form=event.target?.closest?.('#v30162ChapterForm');
      if(form)rememberChapterDraft(form);
    },true);
    document.addEventListener('change',event=>{
      const form=event.target?.closest?.('#v30162ChapterForm');
      if(form)rememberChapterDraft(form);
    },true);
    document.addEventListener('submit',event=>{
      if(event.target?.id==='v30162ChapterForm')
        queueMicrotask(()=>{if(window.FocusStoryV30162?.activeChapter?.())discardChapterDraft();});
    },false);
    document.addEventListener('focusin',event=>{
      if(typingField(event.target))
        document.body.classList.add('mlv-android-keyboard-editing');
    });
    document.addEventListener('focusout',()=>{
      setTimeout(()=>{
        if(!typingField(document.activeElement))
          document.body.classList.remove('mlv-android-keyboard-editing');
      },0);
    });
    updateFocus();
    ticker=window.setInterval(()=>{if(!document.body.isConnected){window.clearInterval(ticker);return;}updateFocus();},1000);
  }
  window.MichelsLifeMobileExperience={openFocus:open,closeFocus:close,updateFocus,isFocusOpen};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
