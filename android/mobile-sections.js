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
  let contractCategoriesExpanded=false;
  const css=`
    html[data-mlv-platform="android"] #main #tab-missions,
    html[data-mlv-platform="android"] #main #tab-calendar,
    html[data-mlv-platform="android"] #main #tab-journal{
      min-width:0!important;width:100%!important;max-width:100%!important;
      box-sizing:border-box!important;overflow-x:clip!important
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
      align-items:stretch!important;gap:9px!important
    }
    html[data-mlv-platform="android"] #main .v30135-nav,
    html[data-mlv-platform="android"] #main .v30135-view,
    html[data-mlv-platform="android"] #main .v30135-actions{
      min-width:0!important;max-width:100%!important;
      flex-wrap:wrap!important;gap:5px!important
    }
    html[data-mlv-platform="android"] #main .v30135-toolbar button{
      min-height:42px!important
    }
    html[data-mlv-platform="android"] #main .v30135-grid{
      display:grid!important;
      grid-template-columns:repeat(7,minmax(0,1fr))!important;
      gap:3px!important;width:100%!important;max-width:100%!important;
      overflow:visible!important
    }
    html[data-mlv-platform="android"] #main .v30135-weekday{
      min-width:0!important;padding:3px 0!important;
      font-size:9px!important;letter-spacing:0!important
    }
    html[data-mlv-platform="android"] #main .v30135-day{
      box-sizing:border-box!important;min-width:0!important;
      min-height:62px!important;height:auto!important;
      padding:6px 2px!important;border-radius:10px!important;
      overflow:hidden!important;touch-action:manipulation!important
    }
    html[data-mlv-platform="android"] #main .v30135-daynum{
      font-size:12px!important;gap:2px!important;
      line-height:1.18!important;justify-content:center!important
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
      width:100%!important;box-sizing:border-box!important
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
      padding-bottom:20px!important;box-sizing:border-box!important;
      resize:vertical!important;touch-action:pan-y!important
    }
    html[data-mlv-platform="android"] #main .mlv184-journal-status{
      display:flex!important;flex-wrap:wrap!important;gap:5px!important
    }

    /*
     * One Android-owned design language across all canonical tab renderers.
     * Layout and interaction ONLY: preserve user-selected colors, fonts,
     * themes, backgrounds, chapter artwork and business state untouched.
     */
    html[data-mlv-platform="android"] #main > .tab{
      min-width:0!important;max-width:100%!important;box-sizing:border-box!important
    }
    html[data-mlv-platform="android"] #main > .tab.active{
      display:block;overflow:visible!important;min-height:0!important
    }
    html[data-mlv-platform="android"] #main > .tab .card,
    html[data-mlv-platform="android"] #main > .tab .v194-stack,
    html[data-mlv-platform="android"] #main > .tab .section-title{
      box-sizing:border-box!important;min-width:0!important;max-width:100%!important
    }
    html[data-mlv-platform="android"] #main > .tab .section-title{
      display:flex!important;align-items:flex-start!important;
      justify-content:space-between!important;flex-wrap:wrap!important;gap:10px!important
    }
    html[data-mlv-platform="android"] #main > .tab .section-title > div{
      min-width:0!important;flex:1 1 180px!important
    }
    html[data-mlv-platform="android"] #main > .tab .section-title h2{
      font-size:clamp(20px,5vw,26px)!important;line-height:1.2!important;
      overflow-wrap:anywhere!important;margin:0!important
    }
    html[data-mlv-platform="android"] #main > .tab .section-title p,
    html[data-mlv-platform="android"] #main > .tab .card p{
      max-width:100%!important;overflow-wrap:anywhere!important
    }
    html[data-mlv-platform="android"] #main > .tab .section-title button,
    html[data-mlv-platform="android"] #main > .tab button,
    html[data-mlv-platform="android"] #main > .tab select,
    html[data-mlv-platform="android"] #main > .tab summary,
    html[data-mlv-platform="android"] #main > .tab [role="button"]{
      touch-action:manipulation;box-sizing:border-box
    }
    html[data-mlv-platform="android"] #main > .tab input:not([type="checkbox"]):not([type="radio"]),
    html[data-mlv-platform="android"] #main > .tab textarea,
    html[data-mlv-platform="android"] #main > .tab select{
      box-sizing:border-box!important;max-width:100%!important;min-width:0!important;
      font-size:16px!important
    }
    html[data-mlv-platform="android"] #main > .tab textarea{
      touch-action:pan-y;resize:vertical
    }
    /* Premium Contracts retains the canonical search/filter/progress engine. */
    html[data-mlv-platform="android"] #tab-contracts .v194-stack,
    html[data-mlv-platform="android"] #tab-contracts .v216-search-panel,
    html[data-mlv-platform="android"] #tab-contracts .v216-contract-card{
      min-width:0!important;max-width:100%!important;box-sizing:border-box!important
    }
    html[data-mlv-platform="android"] #tab-contracts .v216-contract-card{
      border-radius:19px!important;padding:14px!important;gap:11px!important;
      overflow-wrap:anywhere!important
    }
    html[data-mlv-platform="android"] #tab-contracts .v216-contract-card h3{
      font-size:17px!important;line-height:1.3!important;overflow-wrap:anywhere!important
    }
    html[data-mlv-platform="android"] #tab-contracts .v216-search-panel input,
    html[data-mlv-platform="android"] #tab-contracts .v216-top-actions button,
    html[data-mlv-platform="android"] #tab-contracts .v216-filter-chip{
      min-height:44px!important
    }
    html[data-mlv-platform="android"] #tab-contracts .v216-top-actions{
      align-items:stretch!important;gap:8px!important
    }
    html[data-mlv-platform="android"] #tab-contracts .v216-top-actions .btn{
      min-width:0!important;white-space:normal!important
    }
    /* Every visible category chip must be a thumb-size target, including
       when shared Contracts markup injects desktop inline dimensions. */
    html[data-mlv-platform="android"] #tab-contracts .v216-filter-chip{
      min-width:44px!important
    }
    html[data-mlv-platform="android"] #tab-contracts .v194-kpis{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:9px!important;min-width:0!important;margin-top:10px!important
    }
    html[data-mlv-platform="android"] #tab-contracts .v194-kpi{
      display:flex!important;flex-direction:column!important;gap:5px!important;
      box-sizing:border-box!important;min-width:0!important;
      border-radius:13px!important;padding:12px!important;
      border:1px solid rgba(255,255,255,.10)!important;
      background:rgba(var(--ui-card-rgb,12,20,34),.42)!important
    }
    html[data-mlv-platform="android"] #tab-contracts .v194-kpi small,
    html[data-mlv-platform="android"] #tab-contracts .v194-kpi b{
      display:block!important;position:static!important;max-width:100%!important;
      overflow-wrap:anywhere!important;line-height:1.25!important
    }
    html[data-mlv-platform="android"] #tab-contracts .v194-kpi small{
      font-size:11px!important;color:var(--muted)!important
    }
    html[data-mlv-platform="android"] #tab-contracts .v194-kpi b{
      font-size:20px!important;color:var(--text)!important
    }
    /* On a phone the board is the product, not eleven permanently expanded
       filter chips. Put progress first and categories in a real, accessible
       expandable control. Existing canonical chip handlers remain in place. */
    html[data-mlv-platform="android"] #tab-contracts .mlv-android-contract-filter-details{
      display:block!important;margin:10px 0 2px!important;
      padding:0!important;border:0!important;background:transparent!important
    }
    html[data-mlv-platform="android"] #tab-contracts .mlv-android-contract-filter-details summary{
      display:flex!important;align-items:center!important;justify-content:space-between!important;
      box-sizing:border-box!important;width:100%!important;min-height:44px!important;
      padding:10px 13px!important;border:1px solid rgba(var(--ui-accent-rgb,117,228,255),.28)!important;
      border-radius:13px!important;background:rgba(var(--ui-card-rgb,10,18,30),.48)!important;
      color:var(--text,#eaf4ff)!important;font-weight:700!important;
      cursor:pointer!important;list-style:none!important
    }
    html[data-mlv-platform="android"] #tab-contracts .mlv-android-contract-filter-details summary::-webkit-details-marker{
      display:none!important
    }
    html[data-mlv-platform="android"] #tab-contracts .mlv-android-contract-filter-details summary::after{
      content:"⌄";display:inline-block;transition:transform .18s ease
    }
    html[data-mlv-platform="android"] #tab-contracts .mlv-android-contract-filter-details[open] summary::after{
      transform:rotate(180deg)
    }
    html[data-mlv-platform="android"] #tab-contracts .mlv-android-contract-filter-details .v216-chip-row{
      display:flex!important;flex-wrap:wrap!important;gap:8px!important;
      margin-top:9px!important;padding:6px 0 3px!important
    }
    @media(prefers-reduced-motion:reduce){
      html[data-mlv-platform="android"] #tab-contracts .mlv-android-contract-filter-details summary::after{
        transition:none!important
      }
    }
    /* Projects/Planning and Goals — original data, phone-native stacked cards. */
    html[data-mlv-platform="android"] #main .goal-card,
    html[data-mlv-platform="android"] #main .v169-weekly-template,
    html[data-mlv-platform="android"] #main .v131-mission,
    html[data-mlv-platform="android"] #main .v132-contract,
    html[data-mlv-platform="android"] #main .v194-contract-card,
    html[data-mlv-platform="android"] #main .v211-contract-card{
      box-sizing:border-box!important;max-width:100%!important;min-width:0!important;
      overflow-wrap:anywhere!important
    }
    html[data-mlv-platform="android"] #tab-goals .goal-control-bar,
    html[data-mlv-platform="android"] #tab-goals .v133-goal-shortcuts{
      display:flex!important;align-items:stretch!important;gap:8px!important;flex-wrap:wrap!important
    }
    html[data-mlv-platform="android"] #tab-goals .v133-goal-shortcut,
    html[data-mlv-platform="android"] #tab-goals .goal-control-bar button{
      min-height:44px!important
    }
    /* A 360px phone previously displayed six 170px-min desktop stat tiles
       as one long column. Two compact, readable columns preserve the
       canonical numbers while bringing the full activity overview into view. */
    @media(max-width:720px){
      html[data-mlv-platform="android"] #tab-stats .stat-hero-grid{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:9px!important;min-width:0!important
      }
      html[data-mlv-platform="android"] #tab-stats .stat-hero{
        box-sizing:border-box!important;min-width:0!important;
        width:auto!important;min-height:96px!important;
        padding:12px!important;border-radius:16px!important;
        overflow:hidden!important
      }
      html[data-mlv-platform="android"] #tab-stats .stat-hero small{
        display:block!important;max-width:100%!important;
        line-height:1.35!important;font-size:11px!important;
        overflow-wrap:anywhere!important
      }
      html[data-mlv-platform="android"] #tab-stats .stat-hero b{
        display:block!important;margin-top:6px!important;
        font-size:clamp(23px,6vw,29px)!important;line-height:1.12!important
      }
    }
    /* Month overview is primary content on a phone. Four full-width
       desktop KPIs previously pushed the actual calendar below the fold. */
    @media(max-width:720px){
      /* Phone month cells should show their date and state dots. Detailed
         Completed/Missed/XP copy belongs in the selected-day pane, not
         clipped below every 1/7-width cell. */
      html[data-mlv-platform="android"] #tab-calendar
      :is(.v30134-daymeta,.v30135-daymeta,
          .v30134-daynum .v30134-count,.v30135-daynum .v30135-count){
        display:none!important
      }
      html[data-mlv-platform="android"] #tab-calendar
      :is(.v30134-kpis,.v30135-kpis){
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:9px!important;min-width:0!important
      }
      html[data-mlv-platform="android"] #tab-calendar
      :is(.v30134-kpi,.v30135-kpi){
        box-sizing:border-box!important;width:auto!important;min-width:0!important;
        min-height:86px!important;padding:12px!important;
        border-radius:15px!important;overflow-wrap:anywhere!important
      }
      html[data-mlv-platform="android"] #tab-calendar
      :is(.v30134-kpi,.v30135-kpi) small{
        display:block!important;line-height:1.4!important;
        font-size:11px!important;overflow-wrap:anywhere!important
      }
      html[data-mlv-platform="android"] #tab-calendar
      :is(.v30134-kpi,.v30135-kpi) b{
        display:block!important;font-size:clamp(20px,5.5vw,27px)!important;
        margin-top:5px!important;line-height:1.16!important
      }
    }
    /* Statistics, Compare, Reviews: charts can shrink; no wide desktop columns. */
    html[data-mlv-platform="android"] #tab-stats .chart-card,
    html[data-mlv-platform="android"] #tab-stats .stat-hero,
    html[data-mlv-platform="android"] #tab-compare .card,
    html[data-mlv-platform="android"] #tab-weekly-review .card{
      max-width:100%!important;min-width:0!important;box-sizing:border-box!important
    }
    html[data-mlv-platform="android"] #main .chart-card svg,
    html[data-mlv-platform="android"] #main .chart-card canvas{
      max-width:100%!important;display:block
    }
    html[data-mlv-platform="android"] #main .v132-stat,
    html[data-mlv-platform="android"] #main .v131-kpi{
      min-width:0!important;overflow-wrap:anywhere!important;box-sizing:border-box!important
    }
    /* Weekly Review's four canonical KPIs became four tall full-width
       strips on narrow screens. Keep title/action tools prominent, then
       summarize all four numbers in two equally readable rows. */
    @media(max-width:720px){
      html[data-mlv-platform="android"] #tab-weekly-review .v30105-review-hero{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:9px!important;box-sizing:border-box!important
      }
      html[data-mlv-platform="android"] #tab-weekly-review
      .v30105-review-hero > div:first-child{
        grid-column:1/-1!important;min-width:0!important
      }
      html[data-mlv-platform="android"] #tab-weekly-review .v30105-review-kpi{
        box-sizing:border-box!important;min-width:0!important;width:auto!important;
        min-height:93px!important;border-radius:15px!important;
        padding:12px!important;overflow-wrap:anywhere!important
      }
      html[data-mlv-platform="android"] #tab-weekly-review .v30105-review-kpi small{
        display:block!important;max-width:100%!important;
        line-height:1.35!important;font-size:11px!important
      }
      html[data-mlv-platform="android"] #tab-weekly-review .v30105-review-kpi b{
        display:block!important;line-height:1.14!important;
        font-size:clamp(20px,6vw,27px)!important;margin-top:6px!important
      }
      html[data-mlv-platform="android"] #tab-weekly-review
      :is(.v30105-review-hero .actions button,.v30105-review-actions button){
        min-height:44px!important;min-width:44px!important;
        touch-action:manipulation!important
      }
      html[data-mlv-platform="android"] #tab-weekly-review .v30105-outlook-grid{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:8px!important
      }
    }
    /* Projects and Planning use the real v30106 project editor and actions,
       never a mobile-only clone of projects or mission linking. */
    html[data-mlv-platform="android"] #tab-projects .v30106-projects,
    html[data-mlv-platform="android"] #tab-projects .v30106-grid,
    html[data-mlv-platform="android"] #tab-projects .v30106-project-card{
      min-width:0!important;max-width:100%!important;box-sizing:border-box!important
    }
    html[data-mlv-platform="android"] #tab-projects .v30106-project-head,
    html[data-mlv-platform="android"] #tab-projects .v30106-project-actions,
    html[data-mlv-platform="android"] #tab-projects .v30106-row-actions{
      display:flex!important;flex-wrap:wrap!important;gap:8px!important
    }
    html[data-mlv-platform="android"] #tab-projects .v30106-project-head > div{
      min-width:0!important;flex:1 1 175px!important
    }
    html[data-mlv-platform="android"] #tab-projects .v30106-project-actions button,
    html[data-mlv-platform="android"] #tab-projects .v30106-row-actions button,
    html[data-mlv-platform="android"] #tab-projects [data-v30106-action]{
      min-height:44px!important;font-size:12px!important
    }
    html[data-mlv-platform="android"] #tab-projects .v30106-next-action,
    html[data-mlv-platform="android"] #tab-projects .v30106-row{
      min-width:0!important;max-width:100%!important;box-sizing:border-box!important;
      overflow-wrap:anywhere!important
    }
    /* Weekly Review and decision rows: no desktop-width action columns. */
    html[data-mlv-platform="android"] #tab-weekly-review .v30105-snapshot-row,
    html[data-mlv-platform="android"] #tab-weekly-review .v30105-snapshot-list,
    html[data-mlv-platform="android"] #tab-weekly-review .v30105-snapshot-actions{
      max-width:100%!important;min-width:0!important;box-sizing:border-box!important
    }
    html[data-mlv-platform="android"] #tab-weekly-review button{
      min-height:44px!important
    }
    /* Achievements and affirmations: preserve badges, glow, favoriting. */
    html[data-mlv-platform="android"] #tab-achievements .v156-ach-card,
    html[data-mlv-platform="android"] #tab-achievements .v133-ach,
    html[data-mlv-platform="android"] #tab-achievements .achievement-card{
      min-width:0!important;max-width:100%!important;box-sizing:border-box!important;
      overflow-wrap:anywhere!important
    }
    html[data-mlv-platform="android"] #tab-achievements .v156-ach-card{
      min-height:0!important;padding:14px!important;border-radius:20px!important
    }
    html[data-mlv-platform="android"] #tab-achievements h3{
      line-height:1.3!important;overflow-wrap:anywhere!important
    }
    html[data-mlv-platform="android"] #tab-affirmations .affirmation{
      max-width:100%!important;box-sizing:border-box!important;
      font-size:clamp(22px,6vw,32px)!important;line-height:1.32!important;
      overflow-wrap:anywhere!important;padding:20px 15px!important
    }
    html[data-mlv-platform="android"] #tab-affirmations .table-wrap{
      max-width:100%!important;overflow-x:auto!important;overflow-y:visible!important;
      overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;
      touch-action:pan-x pan-y
    }
    html[data-mlv-platform="android"] #tab-affirmations .table td{
      white-space:normal!important;vertical-align:top!important
    }
    html[data-mlv-platform="android"] #tab-affirmations .mlv-android-affirmations-empty{
      display:block!important;padding:19px 15px!important;margin:10px 0 0!important;
      border-radius:15px!important;line-height:1.45!important;
      border:1px dashed rgba(var(--ui-accent-rgb,117,228,255),.25)!important;
      background:rgba(var(--ui-card-rgb,10,19,32),.38)!important;
      color:var(--muted,#c2d0df)!important;font-size:14px!important
    }
    /* Real mobile Affirmations: a readable list, not four cramped table
       columns. The original table remains semantic and keyboard-accessible;
       JS labels each cell from its actual localized <th> text. */
    @media(max-width:720px){
      html[data-mlv-platform="android"] #tab-affirmations .table-wrap{
        overflow-x:hidden!important;touch-action:pan-y!important
      }
      html[data-mlv-platform="android"] #tab-affirmations .table,
      html[data-mlv-platform="android"] #tab-affirmations .table tbody{
        display:block!important;width:100%!important;max-width:100%!important;
        min-width:0!important;box-sizing:border-box!important
      }
      html[data-mlv-platform="android"] #tab-affirmations .table thead{
        position:absolute!important;width:1px!important;height:1px!important;
        overflow:hidden!important;clip-path:inset(50%)!important
      }
      html[data-mlv-platform="android"] #tab-affirmations .table tbody tr{
        display:grid!important;grid-template-columns:minmax(0,1fr)!important;
        gap:8px!important;min-width:0!important;max-width:100%!important;
        border:1px solid rgba(255,255,255,.11)!important;
        border-radius:15px!important;padding:12px!important;
        margin-bottom:10px!important;background:rgba(var(--ui-card-rgb,12,20,34),.40)!important
      }
      html[data-mlv-platform="android"] #tab-affirmations .table tbody td{
        display:flex!important;flex-direction:column!important;align-items:flex-start!important;
        gap:4px!important;box-sizing:border-box!important;border:0!important;
        padding:3px 0!important;min-width:0!important;max-width:100%!important;
        white-space:normal!important;overflow-wrap:anywhere!important;
        font-size:14px!important;line-height:1.4!important
      }
      html[data-mlv-platform="android"] #tab-affirmations .table tbody td::before{
        content:attr(data-mlv-android-label);display:block!important;
        font-size:10px!important;font-weight:800!important;letter-spacing:.06em!important;
        text-transform:uppercase!important;color:var(--muted)!important
      }
      html[data-mlv-platform="android"] #tab-affirmations .table tbody td:last-child button{
        min-height:44px!important;min-width:44px!important
      }
    }
    /* Story/Chapters scenes keep original assets and scene transforms. */
    html[data-mlv-platform="android"] #tab-story{
      min-width:0!important;max-width:100%!important;overflow-x:clip!important
    }
    html[data-mlv-platform="android"] #tab-story img{
      max-width:100%!important;height:auto
    }
    html[data-mlv-platform="android"] #tab-story .card,
    html[data-mlv-platform="android"] #tab-story .section-title{
      min-width:0!important;max-width:100%!important;box-sizing:border-box!important
    }
    /* Story uses the unchanged Chapter engine and art. The desktop form has
       four columns and 34px inputs; make the real mobile editing surface
       keyboard-safe and thumb-usable without cloning a chapter renderer. */
    @media(max-width:720px){
      html[data-mlv-platform="android"] #tab-story .v30162-story{
        display:grid!important;grid-template-columns:minmax(0,1fr)!important;
        gap:12px!important;min-width:0!important
      }
      html[data-mlv-platform="android"] #tab-story
      :is(.v30162-story-hero,.v30162-story-card,.v30162-story-empty){
        min-width:0!important;max-width:100%!important;
        box-sizing:border-box!important;padding:clamp(14px,4vw,20px)!important;
        border-radius:20px!important;overflow-wrap:anywhere!important
      }
      html[data-mlv-platform="android"] #tab-story .v30162-story-form{
        display:grid!important;grid-template-columns:minmax(0,1fr)!important;
        gap:12px!important;align-items:stretch!important
      }
      html[data-mlv-platform="android"] #tab-story .v30162-story-form label{
        display:grid!important;min-width:0!important;gap:5px!important;
        font-size:12px!important;line-height:1.4!important
      }
      html[data-mlv-platform="android"] #tab-story
      .v30162-story-form :is(input,textarea,select){
        display:block!important;width:100%!important;min-width:0!important;
        box-sizing:border-box!important;min-height:48px!important;
        margin:0!important;padding:12px!important;font-size:16px!important
      }
      html[data-mlv-platform="android"] #tab-story .v30162-story-form button{
        width:100%!important;min-height:48px!important;font-size:14px!important
      }
      html[data-mlv-platform="android"] #tab-story
      :is(.v30162-story-form input,.v30162-story-actions button):focus-visible{
        outline:2px solid var(--ui-accent,#75e4ff)!important;
        outline-offset:2px!important
      }
      html[data-mlv-platform="android"] #tab-story
      :is(.v30162-story-kpi,.v30162-archive-card,.v30162-event-body){
        min-width:0!important;max-width:100%!important;
        box-sizing:border-box!important;overflow-wrap:anywhere!important
      }
      html[data-mlv-platform="android"] #tab-story .v30162-chapter-archive{
        display:grid!important;grid-template-columns:minmax(0,1fr)!important
      }
      html[data-mlv-platform="android"] #tab-story
      :is(.v30162-event,.v30162-story-actions,.v30162-archive-stats){
        min-width:0!important;max-width:100%!important;
        overflow-wrap:anywhere!important
      }

      /* About remains the one canonical author/studio card. Shrink its
         desktop 390px brand pane and 210px portrait to fit a real phone. */
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] [data-mlv-about-core]{
        min-width:0!important;max-width:100%!important;
        width:100%!important;box-sizing:border-box!important;
        overflow-x:clip!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] :is(.mlvdev-product,.mlvdev-main,.mlvdev-studio){
        display:grid!important;grid-template-columns:minmax(0,1fr)!important;
        gap:12px!important;min-width:0!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-product-lockup{
        min-width:0!important;min-height:88px!important;
        box-sizing:border-box!important;padding:12px!important;
        border-radius:16px!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-product-lockup img{
        display:block!important;width:100%!important;
        max-height:90px!important;object-fit:contain!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-version-chip{
        grid-column:auto!important;min-width:0!important;
        width:max-content!important;max-width:100%!important;
        justify-self:start!important;text-align:left!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-avatar-wrap{
        display:grid!important;place-items:center!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-avatar{
        display:block!important;width:min(100%,180px)!important;
        height:auto!important;aspect-ratio:3/4!important;
        object-fit:cover!important;border-radius:18px!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-studio-lockup img{
        width:100%!important;max-height:58px!important;
        object-fit:contain!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-socials{
        display:grid!important;grid-template-columns:minmax(0,1fr)!important;
        width:100%!important;max-width:100%!important;gap:9px!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-social{
        display:flex!important;align-items:center!important;
        box-sizing:border-box!important;min-width:0!important;
        min-height:48px!important;padding:10px 12px!important;
        text-decoration:none!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-social :is(small,strong){
        overflow-wrap:anywhere!important;white-space:normal!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-meta{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:9px!important
      }
      html[data-mlv-platform="android"] #tab-settings
      [data-v30171-pane="about"] .mlvdev-meta > div{
        min-width:0!important;overflow-wrap:anywhere!important
      }
    }

    /* Goals has a canonical multi-field desktop editor. On phones keep the
       same form and save handler but present one scrollable, keyboard-safe
       sheet with touch-sized controls. Desktop remains untouched. */
    @media(max-width:720px){
      html[data-mlv-platform="android"] #modalRoot:has(#goalEditForm) .modal-backdrop{
        box-sizing:border-box!important;align-items:end!important;
        padding:calc(8px + env(safe-area-inset-top,0px)) 0 0!important;
        overflow:hidden!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#goalEditForm) .modal.wide{
        box-sizing:border-box!important;width:100%!important;
        max-width:100%!important;max-height:calc(100dvh - 8px - env(safe-area-inset-top,0px))!important;
        margin:0!important;border-radius:22px 22px 0 0!important;
        padding:16px 14px calc(16px + env(safe-area-inset-bottom,0px))!important;
        overflow-x:hidden!important;overflow-y:auto!important;
        overscroll-behavior:contain;-webkit-overflow-scrolling:touch
      }
      html[data-mlv-platform="android"] #goalEditForm .goal-edit-grid{
        display:grid!important;grid-template-columns:minmax(0,1fr)!important;
        gap:10px!important
      }
      html[data-mlv-platform="android"] #goalEditForm :is(input:not([type="checkbox"]),select,textarea){
        box-sizing:border-box!important;width:100%!important;min-width:0!important;
        min-height:48px!important;font-size:16px!important
      }
      html[data-mlv-platform="android"] #goalEditForm .days{
        display:flex!important;flex-wrap:wrap!important;gap:8px!important
      }
      html[data-mlv-platform="android"] #goalEditForm .day-chip{
        box-sizing:border-box!important;min-width:44px!important;min-height:44px!important;
        display:inline-flex!important;align-items:center!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#goalEditForm) .modal-head .icon-btn{
        min-width:44px!important;min-height:44px!important
      }
      html[data-mlv-platform="android"] #goalEditForm > .actions{
        position:sticky!important;bottom:0!important;z-index:2!important;
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:8px!important;padding:10px 0 0!important;
        background:var(--ui-panel,rgba(9,13,25,.98))!important
      }
      html[data-mlv-platform="android"] #goalEditForm > .actions button{
        min-height:48px!important;min-width:0!important
      }
    }

    /* The existing Projects/Decision-Log editor uses a desktop modal.
       Android owns only modal geometry and tap priority. Saving/mission links
       still go through the canonical v30106ProjectForm submit handler. */
    @media(max-width:720px){
      html[data-mlv-platform="android"] body:has(#v30106ProjectForm)
      :is(#mlv-android-bottom-nav,#mlv-android-topbar,#mlv-android-mini-focus){
        visibility:hidden!important;pointer-events:none!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#v30106ProjectForm){
        position:fixed!important;inset:0!important;z-index:2147483300!important;
        box-sizing:border-box!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#v30106ProjectForm) .modal-backdrop{
        position:fixed!important;inset:0!important;display:flex!important;
        justify-content:center!important;align-items:flex-end!important;
        box-sizing:border-box!important;padding:0!important;
        overflow:hidden!important;z-index:2147483300!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#v30106ProjectForm) .modal{
        width:100%!important;max-width:700px!important;min-width:0!important;
        margin:0!important;max-height:calc(100dvh - 8px)!important;
        box-sizing:border-box!important;display:block!important;
        overflow-x:hidden!important;overflow-y:auto!important;
        overscroll-behavior:contain!important;
        padding:14px 14px calc(18px + env(safe-area-inset-bottom,0px))!important;
        border-radius:20px 20px 0 0!important;
        -webkit-overflow-scrolling:touch!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#v30106ProjectForm) .modal-head{
        display:flex!important;align-items:flex-start!important;gap:10px!important;
        position:sticky!important;top:-14px!important;z-index:2!important;
        padding:8px 0 12px!important;margin-bottom:8px!important;
        background:rgba(var(--ui-panel-rgb,8,16,28),.98)!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#v30106ProjectForm) .modal-head h2{
        font-size:20px!important;line-height:1.2!important
      }
      html[data-mlv-platform="android"] #modalRoot:has(#v30106ProjectForm) .modal-head button{
        min-width:44px!important;min-height:44px!important;flex:0 0 44px!important
      }
      html[data-mlv-platform="android"] #v30106ProjectForm,
      html[data-mlv-platform="android"] #v30106ProjectForm .v30106-editor-grid{
        width:100%!important;min-width:0!important;max-width:100%!important;
        box-sizing:border-box!important
      }
      html[data-mlv-platform="android"] #v30106ProjectForm .v30106-editor-grid{
        display:grid!important;grid-template-columns:minmax(0,1fr)!important;
        gap:11px!important;align-items:stretch!important
      }
      html[data-mlv-platform="android"] #v30106ProjectForm label{
        min-width:0!important;overflow-wrap:anywhere!important
      }
      html[data-mlv-platform="android"] #v30106ProjectForm
      :is(input:not([type="checkbox"]),select,textarea){
        display:block!important;box-sizing:border-box!important;
        width:100%!important;min-width:0!important;
        min-height:48px!important;font-size:16px!important;
        padding:10px!important
      }
      html[data-mlv-platform="android"] #v30106ProjectForm textarea{
        min-height:88px!important;resize:vertical!important
      }
      html[data-mlv-platform="android"] #v30106ProjectForm .v30106-link-option{
        box-sizing:border-box!important;min-height:48px!important;
        display:flex!important;align-items:center!important;
        gap:10px!important;max-width:100%!important
      }
      html[data-mlv-platform="android"] #v30106ProjectForm .v30106-link-option input[type="checkbox"]{
        flex:0 0 22px!important;width:22px!important;height:22px!important
      }
      html[data-mlv-platform="android"] #v30106ProjectForm > .actions{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        position:sticky!important;bottom:calc(-18px - env(safe-area-inset-bottom,0px))!important;
        gap:9px!important;z-index:3!important;
        width:100%!important;min-width:0!important;
        padding:11px 0 calc(12px + env(safe-area-inset-bottom,0px))!important;
        margin-top:12px!important;border-top:1px solid rgba(255,255,255,.12)!important;
        background:rgba(var(--ui-panel-rgb,8,16,28),.98)!important
      }
      html[data-mlv-platform="android"] #v30106ProjectForm > .actions button{
        box-sizing:border-box!important;min-width:0!important;
        width:100%!important;min-height:49px!important;
        margin:0!important;touch-action:manipulation!important
      }
      html[data-mlv-platform="android"] #v30106ProjectForm :is(input,select,textarea,button):focus-visible{
        outline:2px solid var(--ui-accent,#75e4ff)!important;
        outline-offset:2px!important
      }
    }
    /* Settings remains the original canonical pane system, not a second UI. */
    html[data-mlv-platform="android"] #tab-settings .v30171-settings-shell,
    html[data-mlv-platform="android"] #tab-settings .v30171-settings-content{
      min-width:0!important;max-width:100%!important;width:100%!important;
      box-sizing:border-box!important
    }
    html[data-mlv-platform="android"] #tab-settings .v30171-settings-nav{
      box-sizing:border-box!important;max-width:100%!important;
      -webkit-overflow-scrolling:touch;overscroll-behavior-x:contain
    }
    html[data-mlv-platform="android"] #tab-settings .v30171-settings-nav [data-v30171-setting]{
      min-height:44px!important;border-radius:12px!important
    }
    html[data-mlv-platform="android"] #tab-settings [data-v30171-pane]{
      max-width:100%!important;min-width:0!important;
      overflow-wrap:anywhere!important;box-sizing:border-box!important
    }
    html[data-mlv-platform="android"] #tab-settings [data-v30171-pane] input,
    html[data-mlv-platform="android"] #tab-settings [data-v30171-pane] select{
      min-height:44px!important
    }
    @media(max-width:720px){
      html[data-mlv-platform="android"] #main > .tab .card{
        border-radius:19px!important;padding:14px!important
      }
      html[data-mlv-platform="android"] #main > .tab:not(#tab-dashboard):not(#tab-missions):not(#tab-calendar) .grid,
      html[data-mlv-platform="android"] #main > .tab .grid.cols-2,
      html[data-mlv-platform="android"] #main > .tab .grid.cols-3,
      html[data-mlv-platform="android"] #main > .tab .compare-grid,
      html[data-mlv-platform="android"] #main > .tab .v132-stats-grid,
      html[data-mlv-platform="android"] #main > .tab .chart-grid{
        grid-template-columns:minmax(0,1fr)!important;gap:11px!important
      }
      html[data-mlv-platform="android"] #tab-contracts .v216-contract-grid{
        grid-template-columns:minmax(0,1fr)!important;gap:11px!important
      }
      html[data-mlv-platform="android"] #tab-contracts .v216-top-actions{
        grid-template-columns:repeat(2,minmax(0,1fr))!important
      }
      html[data-mlv-platform="android"] #tab-achievements .v156-ach-grid,
      html[data-mlv-platform="android"] #tab-achievements .v133-ach-grid{
        grid-template-columns:minmax(0,1fr)!important;gap:12px!important
      }
      html[data-mlv-platform="android"] #tab-projects .v30106-grid,
      html[data-mlv-platform="android"] #tab-projects .v30106-editor-grid,
      html[data-mlv-platform="android"] #tab-projects .v30106-row,
      html[data-mlv-platform="android"] #tab-projects .v30106-plan-row,
      html[data-mlv-platform="android"] #tab-weekly-review .v30105-snapshot-row,
      html[data-mlv-platform="android"] #tab-story .v30162-story-grid{
        display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:10px!important
      }
      html[data-mlv-platform="android"] #tab-story .v30162-story-kpis{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:9px!important
      }
      html[data-mlv-platform="android"] #tab-story .v30162-story-kpi,
      html[data-mlv-platform="android"] #tab-story .v30162-story-card{
        min-width:0!important;max-width:100%!important;box-sizing:border-box!important
      }
      html[data-mlv-platform="android"] #tab-story .v30162-story-title{
        font-size:clamp(24px,8vw,38px)!important;line-height:1.15!important;
        overflow-wrap:anywhere!important
      }
      html[data-mlv-platform="android"] #tab-story .v30162-story-actions{
        display:flex!important;flex-wrap:wrap!important;gap:8px!important
      }
      html[data-mlv-platform="android"] #tab-story .v30162-story-actions button{
        min-height:44px!important
      }
      html[data-mlv-platform="android"] #tab-goals .goal-card,
      html[data-mlv-platform="android"] #tab-goals .v169-weekly-template{
        grid-template-columns:minmax(0,1fr)!important;gap:10px!important
      }
      html[data-mlv-platform="android"] #tab-goals .v169-weekly-form,
      html[data-mlv-platform="android"] #tab-goals .form-grid,
      html[data-mlv-platform="android"] #tab-settings .form-grid{
        grid-template-columns:minmax(0,1fr)!important;gap:10px!important
      }
      html[data-mlv-platform="android"] #main > .tab button,
      html[data-mlv-platform="android"] #main > .tab select,
      html[data-mlv-platform="android"] #main > .tab summary,
      html[data-mlv-platform="android"] #main > .tab [role="button"]{
        min-height:44px
      }
    }
    /* A measured, nonblocking entrance for sections, never Chapter art. */
    @keyframes mlvAndroidSectionEnter{
      from{opacity:.88;translate:0 7px}
      to{opacity:1;translate:0 0}
    }
    html[data-mlv-platform="android"] #main > .tab.active > .card{
      animation:mlvAndroidSectionEnter .22s cubic-bezier(.2,.7,.2,1) both
    }
    @media(prefers-reduced-motion:reduce){
      html[data-mlv-platform="android"] #main > .tab.active > .card{
        animation:none!important;translate:none!important
      }
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
    main.querySelectorAll('#tab-achievements .v134-ach-filter button').forEach(el=>{
      if(el.style.getPropertyValue('min-width')!=='44px'||
         el.style.getPropertyPriority('min-width')!=='important')
        el.style.setProperty('min-width','44px','important');
    });
    main.querySelectorAll('.v30135-grid').forEach(el=>{
      const val='repeat(7,minmax(0,1fr))';
      if(el.style.getPropertyValue('grid-template-columns')!==val)
        el.style.setProperty('grid-template-columns',val,'important');
    });
    // The canonical month view re-applies display:grid !important to compact
    // day metadata after style injection. Hide only those redundant strings
    // on phone month cells; the day number/dots and day-detail state remain.
    if(window.innerWidth<=720){
      main.querySelectorAll('#tab-calendar .v30135-daymeta, #tab-calendar .v30135-dayline, #tab-calendar .v30134-daymeta').forEach(el=>{
        if(el.style.getPropertyValue('display')!=='none'||
           el.style.getPropertyPriority('display')!=='important')
          el.style.setProperty('display','none','important');
      });
    }
    main.querySelectorAll('.v30135-day').forEach(el=>{
      // Desktop month cells inherit a 112px minimum. A phone shows the day
      // number/dots only; scheduled tasks remain accessible in day details.
      for(const [key,val] of [
        ['min-height','64px'],['height','64px'],['max-height','64px'],
        ['overflow','hidden'],['padding','6px 2px']
      ])if(el.style.getPropertyValue(key)!==val)
        el.style.setProperty(key,val,'important');
    });
    // The legacy Contracts renderer reapplies !important desktop KPI rules
    // after Android CSS injection. Use the same scoped ownership strategy as
    // mission buttons; never change the shared user data or desktop renderer.
    const force=(el,key,value)=>{
      if(el&&(el.style.getPropertyValue(key)!==value||
          el.style.getPropertyPriority(key)!=='important'))
        el.style.setProperty(key,value,'important');
    };
    // The canonical Chapter renderer keeps 34px/37px desktop control sizes
    // with !important and can re-render after our stylesheet is injected.
    // As with Contracts, own the actual rendered inputs on narrow Android
    // screens; leave desktop and larger tablet form behavior unchanged.
    if(window.innerWidth<=720){
      main.querySelectorAll('#tab-story .v30162-story-form input, #tab-story .v30162-story-form textarea, #tab-story .v30162-story-form select, #tab-story .v30162-story-form button').forEach(el=>{
        force(el,'min-height','48px');
        force(el,'box-sizing','border-box');
        if(el.matches('input,textarea,select'))force(el,'font-size','16px');
      });
    }
    if(window.innerWidth<=720){
      // Desktop About CSS may restyle the canonical 210/300px portrait after
      // mobile rules load. Keep the genuine photo capped to a phone-safe card.
      main.querySelectorAll('#tab-settings [data-v30171-pane="about"] .mlvdev-avatar').forEach(el=>{
        force(el,'width','180px');
        force(el,'max-width','100%');
        force(el,'height','auto');
        force(el,'aspect-ratio','3 / 4');
        force(el,'object-fit','cover');
      });
    }
    // The shared Statistics renderer can reapply a desktop auto-fit grid
    // with !important after Android injects its responsive stylesheet.
    // Keep this ownership in the same canonical post-render geometry pass.
    if(window.innerWidth<=720){
      main.querySelectorAll('#tab-stats .stat-hero-grid').forEach(grid=>{
        force(grid,'display','grid');
        force(grid,'grid-template-columns','repeat(2,minmax(0,1fr))');
        force(grid,'gap','9px');
      });
      main.querySelectorAll('#tab-stats .stat-hero').forEach(card=>{
        force(card,'min-height','96px');
        force(card,'min-width','0');
      });
    }
    if(window.innerWidth<=720){
      main.querySelectorAll('#tab-weekly-review .v30105-review-hero').forEach(grid=>{
        force(grid,'display','grid');
        force(grid,'grid-template-columns','repeat(2,minmax(0,1fr))');
      });
      main.querySelectorAll('#tab-weekly-review .v30105-review-hero > div:first-child').forEach(header=>{
        force(header,'grid-column','1 / -1');
      });
      main.querySelectorAll('#tab-weekly-review .v30105-review-kpi').forEach(card=>{
        force(card,'min-width','0');
        force(card,'min-height','93px');
      });
    }
    if(window.innerWidth<=720){
      // Reassert against late desktop renderer inline !important geometry.
      main.querySelectorAll('#tab-calendar .v30134-kpis, #tab-calendar .v30135-kpis').forEach(grid=>{
        force(grid,'display','grid');
        force(grid,'grid-template-columns','repeat(2,minmax(0,1fr))');
        force(grid,'gap','9px');
      });
      main.querySelectorAll('#tab-calendar .v30134-kpi, #tab-calendar .v30135-kpi').forEach(card=>{
        force(card,'min-width','0');
        force(card,'min-height','86px');
      });
    }
    main.querySelectorAll('#tab-contracts .v194-hero').forEach(hero=>{
      const searchPanel=hero.querySelector('.v216-search-panel');
      const progress=hero.querySelector('.v194-kpis');
      if(progress&&searchPanel&&progress.nextElementSibling!==searchPanel)
        hero.insertBefore(progress,searchPanel);
      const chips=searchPanel?.querySelector('.v216-chip-row');
      if(!chips||searchPanel.querySelector('.mlv-android-contract-filter-details'))return;
      const details=document.createElement('details');
      details.className='mlv-android-contract-filter-details';
      details.open=contractCategoriesExpanded;
      const summary=document.createElement('summary');
      summary.textContent=window.MichelsLifeI18n?.language==='es'?
        'Filtrar categorías':'Filter categories';
      details.appendChild(summary);
      details.appendChild(chips);
      searchPanel.appendChild(details);
      details.addEventListener('toggle',()=>{contractCategoriesExpanded=details.open;});
    });
    main.querySelectorAll('#tab-contracts .v194-kpis').forEach(grid=>{
      force(grid,'display','grid');
      force(grid,'grid-template-columns','repeat(2,minmax(0,1fr))');
      force(grid,'gap','9px');
      Array.from(grid.querySelectorAll('.v194-kpi')).forEach(card=>{
        force(card,'display','flex');
        force(card,'flex-direction','column');
        force(card,'align-items','flex-start');
        force(card,'width','auto');
        force(card,'min-width','0');
        force(card,'gap','5px');
        for(const el of card.querySelectorAll('small,b')){
          force(el,'display','block');
          force(el,'position','relative');
          force(el,'width','100%');
          force(el,'height','auto');
          force(el,'inset','auto');
          force(el,'line-height','1.3');
        }
      });
    });
    // Canonical renderers still inline desktop-size 32px/36px buttons.
    // Explicitly own touch dimensions for these real Android actions rather
    // than re-rendering or cloning any of the underlying domain controls.
    main.querySelectorAll('#tab-contracts .v216-filter-chip, #tab-projects .v30106-project-actions button, #tab-projects .v30106-row-actions button, #tab-settings .v30171-settings-nav [data-v30171-setting]').forEach(el=>{
      const rules=[['min-height','44px'],['height','44px']];
      if(el.matches('#tab-contracts .v216-filter-chip'))rules.push(['min-width','44px']);
      for(const [key,value] of rules){
        if(el.style.getPropertyValue(key)!==value||el.style.getPropertyPriority(key)!=='important')
          el.style.setProperty(key,value,'important');
      }
    });
    // Existing semantic table headers become the visible phone card labels.
    // Blank databases should show a meaningful empty state, not a cropped
    // strip of four desktop column headings with no content.
    main.querySelectorAll('#tab-affirmations table.table').forEach(table=>{
      const labels=Array.from(table.querySelectorAll('thead th')).map(th=>(th.textContent||'').trim());
      const rows=Array.from(table.querySelectorAll('tbody tr'));
      const isNarrow=window.innerWidth<=720;
      const wrapper=table.closest('.table-wrap')||table.parentElement;
      const existing=wrapper?.querySelector('.mlv-android-affirmations-empty');
      if(!rows.length && isNarrow){
        force(table,'display','none');
        if(!existing&&wrapper){
          const empty=document.createElement('p');
          empty.className='mlv-android-affirmations-empty';
          empty.textContent=window.MichelsLifeI18n?.language==='es'?
            'Tus afirmaciones aparecerán aquí. Crea la primera para comenzar.':
            'Your affirmations will appear here. Add one to get started.';
          wrapper.appendChild(empty);
        }
      }else{
        if(table.style.getPropertyValue('display')==='none')table.style.removeProperty('display');
        existing?.remove();
      }
      const head=table.querySelector('thead');
      if(head&&isNarrow)force(head,'display','none');
      else if(head&&head.style.getPropertyValue('display')==='none')head.style.removeProperty('display');
      rows.forEach(tr=>{
        Array.from(tr.cells).forEach((cell,i)=>{
          const label=labels[i]||'';
          if(cell.dataset.mlvAndroidLabel!==label)cell.dataset.mlvAndroidLabel=label;
        });
      });
    });
    main.querySelectorAll('#tab-contracts .v194-hero').forEach(hero=>{
      const p=hero.querySelector('.section-title p');
      if(p&&p.textContent==='Filter by category. Search now reorders cards without re-rendering each key.')
        p.textContent='Search, filter and track your weekly commitments.';
      const hint=hero.querySelector('#v216ContractSearchCount');
      if(hint?.textContent==='Cards stay rendered')hint.textContent='Matches appear first';
    });
    const body=main.querySelector('#mlv184JournalBody');
    if(body&&body.style.getPropertyValue('font-size')!=='16px')
      body.style.setProperty('font-size','16px','important');
  }
  let observer=null;
  // The shared v30106 modal and Android bridge can apply late !important
  // desktop geometry after the stylesheet. Own the rendered phone form and
  // restore underlying chrome immediately after the canonical save/close.
  function enforceProjectEditor(){
    if(!owned())return;
    const form=document.getElementById('v30106ProjectForm');
    const nav=document.getElementById('mlv-android-bottom-nav');
    const top=document.getElementById('mlv-android-topbar');
    const mini=document.getElementById('mlv-android-mini-focus');
    const visible=!!form && window.innerWidth<=720;
    const force=(el,key,val)=>{
      if(el&&(el.style.getPropertyValue(key)!==val||
          el.style.getPropertyPriority(key)!=='important'))
        el.style.setProperty(key,val,'important');
    };
    for(const el of [nav,top,mini]){
      if(!el)continue;
      if(visible){
        force(el,'visibility','hidden');
        force(el,'pointer-events','none');
      }else{
        if(el.style.getPropertyValue('visibility')==='hidden'&&
           el.style.getPropertyPriority('visibility')==='important')
          el.style.removeProperty('visibility');
        if(el.style.getPropertyValue('pointer-events')==='none'&&
           el.style.getPropertyPriority('pointer-events')==='important')
          el.style.removeProperty('pointer-events');
      }
    }
    if(!visible)return;
    const backdrop=form.closest('.modal-backdrop');
    const modal=form.closest('.modal');
    for(const [key,val] of [
      ['position','fixed'],['inset','0'],['display','flex'],
      ['align-items','flex-end'],['justify-content','center'],
      ['padding','0'],['overflow','hidden']])force(backdrop,key,val);
    for(const [key,val] of [
      ['width','100%'],['max-width','100vw'],['min-width','0'],
      ['max-height','calc(100dvh - 8px)'],
      ['box-sizing','border-box'],['margin','0'],
      ['transform','none'],['overflow-y','auto'],['overflow-x','hidden'],
      ['border-radius','20px 20px 0 0']])force(modal,key,val);
    const details=form.querySelector('.v30106-editor-grid');
    force(details,'display','grid');
    force(details,'grid-template-columns','minmax(0,1fr)');
    for(const el of form.querySelectorAll('input:not([type="checkbox"]),select,textarea')){
      force(el,'width','100%');
      force(el,'min-width','0');
      force(el,'min-height','48px');
      force(el,'font-size','16px');
    }
    const actions=form.querySelector(':scope > .actions');
    force(actions,'position','sticky');
    force(actions,'bottom','0');
    force(actions,'display','grid');
    force(actions,'grid-template-columns','repeat(2,minmax(0,1fr))');
    for(const b of actions?.querySelectorAll('button')||[])
      force(b,'min-height','49px');
  }
  function startOwnership(){
    ensure();enforceRendered();
    const main=document.getElementById('main');
    if(!main||observer)return;
    observer=new MutationObserver(()=>enforceRendered());
    observer.observe(main,{childList:true,subtree:true});
    document.addEventListener('click',()=>requestAnimationFrame(enforceRendered),true);
    const modal=document.getElementById('modalRoot');
    if(modal){
      const modalObserver=new MutationObserver(enforceProjectEditor);
      modalObserver.observe(modal,{childList:true,subtree:true});
      enforceProjectEditor();
    }
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
