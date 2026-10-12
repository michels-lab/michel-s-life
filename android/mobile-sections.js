/* Michel's Life Android — mobile-only layouts, shared domain data.
 * Calendar/Journal/Missions renderers remain the canonical Windows modules.
 * Never duplicate state, theme/typography engines or synchronized records.
 */
(function(){
  'use strict';
  if(window.MichelsLifeAndroidSections)return;
  const root=document.documentElement;
  const owned=()=>root.dataset.mlvPlatform==='android';
  const styleId='mlv-android-section-layout';
  const css=`
    html[data-mlv-platform="android"] #main #tab-missions,
    html[data-mlv-platform="android"] #main #tab-calendar,
    html[data-mlv-platform="android"] #main #tab-journal{
      min-width:0!important;width:100%!important;max-width:100%!important;
      box-sizing:border-box!important;overflow-x:clip!important
    }

    /* Secondary screens share a single mobile visual grammar. These rules
       change presentation only: desktop components and state stay canonical. */
    html[data-mlv-platform="android"] #main :is(
      #tab-contracts,#tab-goals,#tab-projects,#tab-planning,
      #tab-stats,#tab-achievements,#tab-story
    ){
      width:100%!important;max-width:100%!important;min-width:0!important;
      box-sizing:border-box!important;overflow-x:clip!important;
      padding-inline:2px!important
    }
    html[data-mlv-platform="android"] #main :is(
      #tab-contracts,#tab-goals,#tab-projects,#tab-planning,
      #tab-stats,#tab-achievements,#tab-story
    ) :is(.card,.panel,.v132-panel){
      box-sizing:border-box!important;min-width:0!important;
      max-width:100%!important;overflow-wrap:anywhere!important;
      border-radius:17px!important
    }
    html[data-mlv-platform="android"] #main :is(
      #tab-contracts,#tab-goals,#tab-projects,#tab-planning,
      #tab-stats,#tab-achievements,#tab-story
    ) :is(.section-title,.card-head,.panel-head){
      min-width:0!important;flex-wrap:wrap!important;gap:8px!important
    }
    html[data-mlv-platform="android"] #main :is(
      #tab-contracts,#tab-goals,#tab-projects,#tab-planning,
      #tab-stats,#tab-achievements,#tab-story
    ) :is(button,[role="button"],summary){
      min-height:44px!important;touch-action:manipulation!important
    }
    html[data-mlv-platform="android"] #main :is(
      #tab-contracts,#tab-goals,#tab-projects,#tab-planning,
      #tab-stats,#tab-achievements,#tab-story
    ) :is(input:not([type="checkbox"]):not([type="radio"]),select,textarea){
      box-sizing:border-box!important;max-width:100%!important;
      min-height:44px!important;font-size:16px!important
    }
    html[data-mlv-platform="android"] #main :is(
      #tab-contracts,#tab-goals,#tab-projects,#tab-planning,
      #tab-stats,#tab-achievements,#tab-story
    ) :is(button,[role="button"],summary,input,select,textarea):focus-visible{
      outline:2px solid var(--ui-accent,#75e4ff)!important;
      outline-offset:2px!important
    }

    /* Header and navigation controls remain thumb-sized on 320–412px phones.
       The source bridge still owns routing and selected-state semantics. */
    html[data-mlv-platform="android"] body #mlv-android-menu-button,
    html[data-mlv-platform="android"] body #mlv-android-capture-button,
    html[data-mlv-platform="android"] body #mlv-android-topbar .mlv-android-section-controls button{
      box-sizing:border-box!important;flex-shrink:0!important;
      width:44px!important;height:44px!important;
      min-width:44px!important;min-height:44px!important
    }
    html[data-mlv-platform="android"] body #v30171PrimaryNav .v30171-nav-btn{
      min-height:48px!important
    }
    html[data-mlv-platform="android"] body #tab-settings .v30171-settings-nav button{
      min-height:46px!important
    }
    html[data-mlv-platform="android"] body #tab-dashboard .v30176-panel-toggle{
      min-height:44px!important
    }
    html[data-mlv-platform="android"] body #mlv-android-bottom-nav button{
      font-size:11px!important
    }
    @media(max-width:360px){
      html[data-mlv-platform="android"] body #mlv-android-topbar{
        gap:6px!important;padding-inline:8px!important
      }
      html[data-mlv-platform="android"] body #mlv-android-topbar .mlv-android-topbar-copy{
        min-width:0!important;overflow:hidden!important
      }
    }

    /* Daily mission list: accessible one-tap completion, readable text,
       secondary actions under content. No hover-only interaction. */
    html[data-mlv-platform="android"] #main .v132-all-list{
      max-height:none!important;overflow:visible!important;
      padding:0 0 8px!important;display:grid!important;gap:9px!important
    }
    html[data-mlv-platform="android"] #main .v132-mission{
      display:grid!important;grid-template-columns:48px minmax(0,1fr)!important;
      grid-auto-rows:auto!important;gap:7px 9px!important;
      align-items:start!important;min-width:0!important;max-width:100%!important;
      padding:10px!important;box-sizing:border-box!important
    }
    html[data-mlv-platform="android"] #main .v132-mission .v132-check{
      grid-column:1!important;grid-row:1!important;
      min-width:44px!important;min-height:44px!important;
      width:44px!important;height:44px!important
    }
    html[data-mlv-platform="android"] #main .v132-mission .v132-mission-main{
      grid-column:2!important;min-width:0!important;overflow-wrap:anywhere!important
    }
    html[data-mlv-platform="android"] #main .v132-mission h3{
      font-size:14px!important;line-height:1.32!important;overflow-wrap:anywhere!important
    }
    html[data-mlv-platform="android"] #main .v132-mission .v132-mission-actions{
      grid-column:2!important;grid-row:auto!important;
      justify-content:flex-start!important;flex-wrap:wrap!important;
      gap:6px!important;min-width:0!important
    }
    html[data-mlv-platform="android"] #main .v132-action-btn,
    html[data-mlv-platform="android"] #main .v132-menu summary{
      min-width:44px!important;min-height:44px!important;
      display:inline-grid!important;place-items:center!important
    }

    /* Calendar is a real seven-day touch grid, not a 7*78px desktop table
       with horizontal overflow. Selected day's missions remain in the
       existing full-width detail pane. */
    html[data-mlv-platform="android"] #main .v30135-calendar,
    html[data-mlv-platform="android"] #main .v30135-calendar .card{
      min-width:0!important;max-width:100%!important;overflow-x:clip!important
    }
    html[data-mlv-platform="android"] #main .v30135-toolbar{
      display:flex!important;flex-direction:column!important;
      align-items:stretch!important;gap:9px!important;
      padding:12px!important;border-radius:18px!important;
      border:1px solid rgba(var(--ui-accent-rgb,117,228,255),.16)!important;
      background:linear-gradient(140deg,rgba(var(--ui-panel-rgb,8,16,28),.42),rgba(var(--ui-panel-rgb,8,16,28),.12))!important
    }
    html[data-mlv-platform="android"] #main .v30135-nav,
    html[data-mlv-platform="android"] #main .v30135-view,
    html[data-mlv-platform="android"] #main .v30135-actions{
      min-width:0!important;max-width:100%!important;
      flex-wrap:wrap!important;gap:5px!important
    }
    html[data-mlv-platform="android"] #main .v30135-toolbar button{
      min-height:46px!important
    }
    html[data-mlv-platform="android"] #main .v30135-grid{
      display:grid!important;
      grid-template-columns:repeat(7,minmax(0,1fr))!important;
      gap:3px!important;width:100%!important;max-width:100%!important;
      overflow:visible!important
    }
    html[data-mlv-platform="android"] #main .v30135-weekday{
      min-width:0!important;padding:3px 0!important;
      font-size:10px!important;letter-spacing:.01em!important
    }
    html[data-mlv-platform="android"] #main .v30135-day{
      box-sizing:border-box!important;min-width:0!important;
      min-height:62px!important;height:auto!important;
      padding:6px 2px!important;border-radius:12px!important;
      overflow:hidden!important;touch-action:manipulation!important
    }
    html[data-mlv-platform="android"] #main .v30135-daynum{
      font-size:13px!important;gap:2px!important;
      line-height:1.2!important;justify-content:center!important
    }
    html[data-mlv-platform="android"] #main .v30135-daymeta,
    html[data-mlv-platform="android"] #main .v30135-dayline{
      display:none!important
    }
    html[data-mlv-platform="android"] #main .v30135-stage-dots{
      justify-content:center!important;gap:2px!important;margin-top:6px!important
    }
    html[data-mlv-platform="android"] #main .v30135-dot{
      flex:0 0 5px!important;width:5px!important;height:5px!important
    }
    html[data-mlv-platform="android"] #main .v30135-row{
      display:flex!important;flex-direction:column!important;
      align-items:stretch!important;gap:8px!important
    }
    html[data-mlv-platform="android"] #main .v30135-row-actions{
      display:flex!important;flex-wrap:wrap!important;width:100%!important;gap:6px!important
    }
    html[data-mlv-platform="android"] #main .v30135-row-actions button{min-height:44px!important}
    html[data-mlv-platform="android"] #main .v30135-day:focus-visible,
    html[data-mlv-platform="android"] #main .v30135-toolbar button:focus-visible{
      outline:2px solid var(--ui-accent,#75e4ff)!important;
      outline-offset:2px!important
    }

    /* Journal becomes one continuous, keyboard-safe writing screen.
       Existing editor/autosave/entry history remain the exact same DOM
       and underlying JournalV30189 API as desktop. */
    html[data-mlv-platform="android"] #main .mlv184-journal-layout{
      display:flex!important;flex-direction:column!important;
      align-items:stretch!important;gap:12px!important;min-width:0!important;
      width:100%!important;max-width:100%!important
    }
    html[data-mlv-platform="android"] #main .mlv184-journal-sheet,
    html[data-mlv-platform="android"] #main .mlv184-journal-history{
      position:relative!important;top:auto!important;
      min-width:0!important;max-width:100%!important;
      width:100%!important;box-sizing:border-box!important;
      border-radius:18px!important
    }
    html[data-mlv-platform="android"] #main .mlv184-journal-sheet{
      padding:clamp(12px,3.5vw,18px)!important;
      box-shadow:0 12px 32px rgba(0,0,0,.13)!important
    }
    html[data-mlv-platform="android"] #main .mlv184-journal-toolbar{
      display:flex!important;align-items:center!important;
      flex-wrap:wrap!important;gap:6px!important
    }
    html[data-mlv-platform="android"] #main .mlv184-journal-toolbar button{
      min-width:44px!important;min-height:44px!important
    }
    html[data-mlv-platform="android"] #main .mlv184-journal-datehead h2{
      font-size:21px!important;line-height:1.18!important;overflow-wrap:anywhere!important
    }
    html[data-mlv-platform="android"] #main #mlv184JournalTitle{
      min-width:0!important;width:100%!important;min-height:48px!important;
      font-size:17px!important;box-sizing:border-box!important
    }
    html[data-mlv-platform="android"] #main #mlv184JournalBody{
      display:block!important;min-width:0!important;width:100%!important;
      min-height:36dvh!important;height:auto!important;
      font-size:16px!important;line-height:1.65!important;
      padding:14px 14px 20px!important;box-sizing:border-box!important;
      border-radius:15px!important;
      resize:vertical!important;touch-action:pan-y!important
    }
    html[data-mlv-platform="android"] #main .mlv184-journal-status{
      display:flex!important;flex-wrap:wrap!important;gap:5px!important
    }
    html[data-mlv-platform="android"] #main :is(#mlv184JournalBody,#mlv184JournalTitle):focus-visible{
      outline:2px solid var(--ui-accent,#75e4ff)!important;
      outline-offset:2px!important
    }
    html[data-mlv-platform="android"] #main .mlv184-journal-history{
      overflow-wrap:anywhere!important
    }
  `;
  function ensure(){
    if(!owned()||!document.head)return;
    if(!document.getElementById(styleId)){
      const style=document.createElement('style');style.id=styleId;
      style.textContent=css;document.head.appendChild(style);
    }
  }
  // Shared frontend and the Android bridge both re-render mission cards,
  // sometimes adding late !important/inline geometry from older layouts.
  // Own the final touch targets for Android without touching the desktop DOM.
  function enforceRendered(){
    if(!owned())return;
    const main=document.getElementById('main');
    if(!main)return;
    main.querySelectorAll('.v132-mission .v132-check').forEach(el=>{
      for(const key of ['width','height','min-width','min-height'])
        if(el.style.getPropertyValue(key)!=='44px'||el.style.getPropertyPriority(key)!=='important')
          el.style.setProperty(key,'44px','important');
    });
    main.querySelectorAll('.v30135-grid').forEach(el=>{
      const val='repeat(7,minmax(0,1fr))';
      if(el.style.getPropertyValue('grid-template-columns')!==val)
        el.style.setProperty('grid-template-columns',val,'important');
    });
    main.querySelectorAll('.v30135-day').forEach(el=>{
      // Desktop month cells inherit a 112px minimum. A phone shows the day
      // number/dots only; scheduled tasks remain accessible in day details.
      for(const [key,val] of [
        ['min-height','64px'],['height','64px'],['max-height','64px'],
        ['overflow','hidden'],['padding','6px 2px']
      ])if(el.style.getPropertyValue(key)!==val)
        el.style.setProperty(key,val,'important');
    });
    const body=main.querySelector('#mlv184JournalBody');
    if(body&&body.style.getPropertyValue('font-size')!=='16px')
      body.style.setProperty('font-size','16px','important');
  }
  let observer=null;
  function startOwnership(){
    ensure();enforceRendered();
    const main=document.getElementById('main');
    if(!main||observer)return;
    observer=new MutationObserver(()=>enforceRendered());
    observer.observe(main,{childList:true,subtree:true});
    document.addEventListener('click',()=>requestAnimationFrame(enforceRendered),true);
  }
  function audit(){
    const mission=document.querySelector('#main .v132-mission');
    const cal=document.querySelector('#main .v30135-grid');
    const journal=document.querySelector('#main .mlv184-journal-layout');
    const props=el=>el?{width:Math.round(el.getBoundingClientRect().width),
      overflow:getComputedStyle(el).overflowX,
      columns:getComputedStyle(el).gridTemplateColumns}:null;
    return {mobile:owned(),missions:props(mission),calendar:props(cal),journal:props(journal)};
  }
  window.MichelsLifeAndroidSections={ensure,audit,enforceRendered};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startOwnership,{once:true});
  else startOwnership();
})();
