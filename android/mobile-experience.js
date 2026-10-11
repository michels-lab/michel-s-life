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
    {id:'focus',label:'Focus',glyph:'◷'},
    {id:'calendar',label:'Calendar',glyph:'▦'},
    {id:'settings',label:'Settings',glyph:'⚙'}
  ];
  let root=null,nav=null,ticker=null;
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
      @media(min-width:700px){
        #mlv-android-focus-sheet{margin-bottom:12px;border-radius:24px;border-bottom:1px solid rgba(var(--ui-accent-rgb,117,228,255),.30)}
      }
    `;
    document.head.appendChild(style);
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
        if(tab==='focus'){open();return;}
        close();
        window.__mlvAndroidFastRoute?.(tab);
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
            <div><h2 id="mlv-android-focus-heading">Focus session</h2><p>One timer shared with Michel's Life on desktop</p></div>
            <button type="button" class="mlv-android-focus-close" data-mobile-focus="close" aria-label="Close Focus">×</button>
          </div>
          <div class="mlv-android-focus-clock">
            <strong id="mlv-android-focus-time">25:00</strong>
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
          <div class="mlv-android-focus-footer"><span id="mlv-android-focus-linked">No mission linked</span><span id="mlv-android-focus-count">0 completed today</span></div>
          <p>Note: the running timer is shared with desktop data. Background alarms and lock-screen notifications need the native scheduler and are not active yet.</p>
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
        if(action==='toggle')api.toggleFocus?.();
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
  function updateFocus(){
    if(!root||root.hidden)return;
    const api=focusApi(),f=api?.focusState?.();
    if(!f){q('#mlv-android-focus-status',root).textContent='Focus is loading';return;}
    q('#mlv-android-focus-time',root).textContent=fmt(api.remaining?.(f));
    q('#mlv-android-focus-status',root).textContent=(f.status==='running'?'Running':f.status==='paused'?'Paused':'Ready')+' · '+(f.mode==='break'?'Break':'Work');
    q('[data-mobile-focus="toggle"]',root).textContent=f.status==='running'?'Pause':f.status==='paused'?'Resume':'Start';
    root.querySelectorAll('[data-mobile-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mobilePreset===f.preset)));
    const active=document.activeElement;
    if(active?.id!=='mlv-android-focus-work')q('#mlv-android-focus-work',root).value=String(f.workMin);
    if(active?.id!=='mlv-android-focus-break')q('#mlv-android-focus-break',root).value=String(f.breakMin);
    // Top-level desktop "state" is a global lexical binding, not
    // window.state. Read the canonical persisted snapshot for display only.
    // All timer mutations remain in FocusStoryV30162.
    let savedState={};
    try{savedState=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}')||{}}catch(_){}
    const mission=(savedState.missions||[]).find(m=>String(m.id)===String(f.linkedMissionId||''));
    q('#mlv-android-focus-linked',root).textContent=mission?'Mission: '+mission.name:'No mission linked';
    const today=new Date(),local=String(today.getFullYear())+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
    const completed=(api.focusSessions?.()||[]).filter(x=>x.status==='completed'&&x.date===local).length;
    q('#mlv-android-focus-count',root).textContent=completed+' completed today';
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
    const modalHost=q('#modalRoot');
    if(modalHost){
      const missionObserver=new MutationObserver(adaptMissionEditor);
      missionObserver.observe(modalHost,{childList:true,subtree:true});
      adaptMissionEditor();
    }
    ticker=window.setInterval(()=>{if(!document.body.isConnected){window.clearInterval(ticker);return;}updateFocus();},1000);
  }
  window.MichelsLifeMobileExperience={openFocus:open,closeFocus:close,updateFocus,isFocusOpen};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
