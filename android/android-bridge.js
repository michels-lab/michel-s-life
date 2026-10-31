(function(){
  'use strict';
  if(window.__MICHELSLIFE_ANDROID_BRIDGE__) return;
  window.__MICHELSLIFE_ANDROID_BRIDGE__='0.2.9';
  window.__MICHELSLIFE_PLATFORM__='android';

  const listeners=new Set();
  window.chrome=window.chrome||{};
  window.chrome.webview={
    postMessage(payload){
      try{
        window.MichelsLifeAndroid.postMessage(JSON.stringify(payload));
      }catch(error){
        console.error('Michel\'s Life Android bridge postMessage failed',error);
      }
    },
    addEventListener(type,callback){
      if(type==='message'&&typeof callback==='function')listeners.add(callback);
    },
    removeEventListener(type,callback){
      if(type==='message')listeners.delete(callback);
    }
  };

  window.__mlvAndroidReceive=function(raw){
    try{
      const data=typeof raw==='string'?JSON.parse(raw):raw;
      listeners.forEach(callback=>{
        try{callback({data});}catch(error){console.error('Michel\'s Life Android bridge listener failed',error);}
      });
    }catch(error){
      console.error('Michel\'s Life Android bridge response failed',error);
    }
  };

  const MOBILE_BREAKPOINT=4096;
  const STORAGE_KEY='vida_rpg_personal_progress_v2';
  const ONBOARD_KEY='michelsLife.onboarding.v30200';
  const MAJOR_TABS=['dashboard','missions','contracts','journal','stats','achievements','calendar','story','settings'];
  const isMobile=()=>window.matchMedia('(max-width:'+MOBILE_BREAKPOINT+'px)').matches;
  const q=(selector,root=document)=>root.querySelector(selector);
  const qa=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const visible=el=>!!(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none');
  const escSelector=value=>String(value).replace(/(["\\])/g,'\\$1');

  function setDrawer(open){
    document.body.classList.toggle('mlv-android-nav-open',!!open);
    const side=q('#v30171Sidebar');
    if(side)side.style.setProperty('transform',open?'translateX(0)':'translateX(-105%)','important');
    const button=q('#mlv-android-menu-button');
    if(button)button.setAttribute('aria-expanded',open?'true':'false');
  }

  function activeTabId(){
    try{
      const id=String(window.state?.activeTab||'');
      if(id)return id==='goals'?'contracts':id;
    }catch(_){}
    const active=q('#v30171PrimaryNav [data-tab].active, #v30171PrimaryNav [data-tab][aria-current="page"], #side [data-tab].active, #side [data-tab][aria-current="page"]');
    return active?.dataset?.tab||'';
  }

  function displayLabelForTab(id){
    if(!id)return 'Today';
    const exact=q('#v30171PrimaryNav [data-tab="'+escSelector(id)+'"] .v30171-nav-label, #v30171PrimaryNav [data-tab="'+escSelector(id)+'"]');
    const text=exact?.textContent?.replace(/\s+/g,' ')?.trim();
    if(text)return text.replace(/^[^\p{L}\p{N}]+/u,'').trim()||text;
    return id.replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  }

  function updateTopbarTitle(){
    const title=q('#mlv-android-section-title');
    if(!title)return;
    const current=activeTabId()||'dashboard';
    title.textContent=displayLabelForTab(current);
    document.body.dataset.mlvAndroidTab=current;
    const tabs=availableMajorTabs();
    const index=tabs.indexOf(current);
    const prev=q('#mlv-android-prev-section');
    const next=q('#mlv-android-next-section');
    // Legacy Story is a real Android section. If an older saved Story tab is
    // absent from the sidebar list, keep the arrow escape route usable.
    if(prev)prev.disabled=index===0;
    if(next)next.disabled=index>=tabs.length-1;
  }

  function availableMajorTabs(){
    const nav=q('#v30171PrimaryNav')||q('#side')||document;
    const present=new Set(qa('[data-tab]',nav).filter(visible).map(el=>el.dataset.tab).filter(Boolean));
    const major=MAJOR_TABS.filter(id=>present.has(id));
    if(major.length>=2)return major;
    const seen=new Set();
    return qa('[data-tab]',nav)
      .filter(visible)
      .map(el=>el.dataset.tab)
      .filter(id=>id&&!seen.has(id)&&seen.add(id));
  }

  function finishSectionSwitch(started,id,routerName){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      document.documentElement.removeAttribute('data-mlv-android-switching');
      updateTopbarTitle();
      window.__mlvAndroidLastSwitch={
        tab:id,
        router:routerName,
        elapsedMs:Math.round((performance.now()-started)*10)/10,
        active:activeTabId()
      };
    }));
  }

  function persistNavLater(){
    const work=()=>{try{if(typeof window.save==='function')window.save();else if(typeof save==='function')save()}catch(_){}};
    if(typeof requestIdleCallback==='function')requestIdleCallback(work,{timeout:450});
    else setTimeout(work,80);
  }

  // A restored activeTab can say "journal" while the async shared boot
  // still leaves Today's markup inside the active tab-journal wrapper.
  // Preserve the canonical Journal renderer/data API; rebuild only that
  // stale mobile surface, never a second journal state or desktop template.
  function ensureCanonicalJournalSurface(){
    const api=window.JournalV30189,main=q('#main');
    if(!api||!main)return false;
    let tab=q('#tab-journal',main);
    if(!tab||!q('#mlv184JournalBody',tab)){
      const markup=typeof api.render==='function'?api.render():null;
      if(typeof markup!=='string'||!markup.includes('mlv184JournalBody'))
        return false;
      if(tab)tab.innerHTML=markup;
      else main.innerHTML='<section class="tab active" id="tab-journal">'+markup+'</section>';
      tab=q('#tab-journal',main);
    }
    if(!tab)return false;
    tab.classList.add('active');
    return !!q('#mlv184JournalBody',tab);
  }

  function fastRoute(id){
    id=String(id||'');
    if(!id)return false;
    if(id==='today')id='dashboard';
    if(id==='goals')id='contracts';
    // A saved activeTab is NOT proof that the visible surface mounted.
    // Android can restore Story's DOM with a stale state.activeTab=Settings;
    // returning early here used to trap users behind a nonresponsive nav.
    const actualTab=q('#tab-'+escSelector(id));
    const surfaceMounted=!!(actualTab&&actualTab.classList.contains('active')&&
      visible(actualTab)&&
      (id!=='journal'||!!q('#mlv184JournalBody',actualTab))&&
      (id!=='settings'||!!q('.v30171-settings-shell',actualTab)));
    if(activeTabId()===id&&surfaceMounted){
      setDrawer(false);updateTopbarTitle();return true;
    }

    const started=performance.now();
    document.documentElement.setAttribute('data-mlv-android-switching','1');
    setDrawer(false);
    try{window.v3094ExitDayPage?.()}catch(_){}

    if(id==='journal'&&window.JournalV30189?.open){
      try{
        window.JournalV30189.open();
        if(!ensureCanonicalJournalSurface())
          throw new Error('Journal activeTab restored before its editor DOM');
        finishSectionSwitch(started,id,'JournalV30189.open');
        return true;
      }catch(error){
        console.warn('Michel\'s Life Android journal fast route fallback',error);
      }
    }

    // Story keeps its compatibility router because it has its own legacy/fallback renderer.
    if(id==='story'){
      try{
        const router=window.LeftNavV30171;
        if(router&&typeof router.route==='function'){
          router.route(id);
          finishSectionSwitch(started,id,'LeftNavV30171.route:story');
          return true;
        }
      }catch(_){}
    }

    try{window.state.activeTab=id}catch(_){
      try{state.activeTab=id}catch(__){
        document.documentElement.removeAttribute('data-mlv-android-switching');
        return false;
      }
    }

    try{
      if(id==='settings'){
        const main=q('#main');
        const renderSettingsFn=typeof window.renderSettings==='function'?window.renderSettings:(typeof renderSettings==='function'?renderSettings:null);
        if(!main||!renderSettingsFn)throw new Error('Settings renderer unavailable');
        main.innerHTML='<section class="tab active" id="tab-settings">'+String(renderSettingsFn()||'')+'</section>';
      }else if(typeof window.renderMain==='function'){
        window.renderMain();
      }else if(typeof renderMain==='function'){
        renderMain();
      }else{
        throw new Error('renderMain unavailable');
      }
      try{window.LeftNavV30171?.renderNav?.()}catch(_){}
    }catch(error){
      console.warn('Michel\'s Life Android active-surface render',error);
      // The shared renderer may not yet exist on a first-launch Story
      // restoration. Try the canonical sidebar router before giving up;
      // never leave the user stranded in Story because Settings fails once.
      try{
        if(typeof window.LeftNavV30171?.route==='function'){
          window.LeftNavV30171.route(id);
          if(q('#tab-'+escSelector(id))?.classList.contains('active')){
            finishSectionSwitch(started,id,'LeftNavV30171.route:fallback');
            return true;
          }
        }
      }catch(fallbackError){console.warn('Android canonical route fallback',fallbackError);}
      document.documentElement.removeAttribute('data-mlv-android-switching');
      return false;
    }

    requestAnimationFrame(()=>{
      if(id==='settings'){
        // Build the canonical Settings categories once from the already-rendered Settings surface.
        try{window.LeftNavV30171?.buildSettings?.()}catch(error){console.warn('Michel\'s Life Android Settings shell',error);}
      }else{
        try{window.PlanningFocusV30106?.enhanceAll?.()}catch(_){}
      }
      enforceMobileFlowGeometry();
      updateTopbarTitle();
      // A new section begins at its own top, never at the preceding pane's
      // offscreen scroll position (the Windows->Android shell is shared).
      window.scrollTo(0,0);
    });
    persistNavLater();
    finishSectionSwitch(started,id,'android-render-main');
    return true;
  }
  window.__mlvAndroidFastRoute=fastRoute;

  function clickTab(id){
    const ok=fastRoute(id);
    const debug=window.__mlvAndroidGestureDebug;
    if(debug){
      debug.router='android-fast-route';
      debug.requestedTab=id;
      debug.activeImmediately=activeTabId();
      setTimeout(()=>{debug.activeAfter120=activeTabId();},120);
      setTimeout(()=>{debug.activeAfter500=activeTabId();},500);
    }
    return ok;
  }

  function installFastNavCapture(){
    if(window.__mlvAndroidFastNavCaptureInstalled)return;
    window.__mlvAndroidFastNavCaptureInstalled=true;
    // Registered from android-bridge.js in <head>, before legacy capture handlers.
    window.addEventListener('click',event=>{
      if(!isMobile())return;

      const nav=event.target?.closest?.('#v30171PrimaryNav [data-tab]');
      if(nav){
        const id=String(nav.dataset.tab||'');
        if(!id)return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        fastRoute(id);
        return;
      }

      const today=event.target?.closest?.('[data-v30171-day="today"]');
      if(today){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        fastRoute('dashboard');
        return;
      }

      const setting=event.target?.closest?.('.v30171-settings-nav [data-v30171-setting]');
      if(setting){
        const key=String(setting.dataset.v30171Setting||'');
        if(!key)return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        try{
          window.__mlvSettingsSectionLock=key;
          localStorage.setItem('michelsLife.settingsSection.v30171',key);
          window.LeftNavV30171?.activateSetting?.(key);
          if(key==='google')requestAnimationFrame(()=>window.GoogleCalendarV30190?.mountSettings?.());
          window.__mlvAndroidLastSettingsSwitch={key,at:performance.now()};
        }catch(error){
          console.warn('Michel\'s Life Android settings section switch',error);
        }
      }
    },true);
  }

  function navigateSwipe(direction){
    const tabs=availableMajorTabs();
    if(tabs.length<2)return false;
    const current=activeTabId();
    let index=tabs.indexOf(current);
    // Restored Story/legacy tab may not appear in the available sidebar.
    // Any arrow press must still escape to the canonical Today dashboard.
    if(index<0)return clickTab('dashboard');
    const next=index+(direction==='next'?1:-1);
    if(next<0||next>=tabs.length)return false;
    return clickTab(tabs[next]);
  }

  function savedMichelState(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch(_){return null}
  }

  function hasExistingMichelState(saved=savedMichelState()){
    if(!saved||typeof saved!=='object')return false;
    const settings=saved.settings||{};
    return !!(
      settings.onboardingCompletedAt ||
      (settings.characterName&&settings.characterName!=='Player') ||
      Number(saved.xp||0)>0 ||
      (Array.isArray(saved.missions)&&saved.missions.length) ||
      (Array.isArray(saved.goals)&&saved.goals.length) ||
      (Array.isArray(saved.history)&&saved.history.length)
    );
  }

  function stabilizeAndroidOnboarding(){
    const saved=savedMichelState();
    if(!hasExistingMichelState(saved))return false;
    try{localStorage.setItem(ONBOARD_KEY,'done')}catch(_){}
    if(saved?.settings?.onboardingRequired===true){
      saved.settings.onboardingRequired=false;
      try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved))}catch(_){}
    }
    q('#mlv200Onboarding')?.remove();
    return true;
  }

  function setImportantOnce(el,prop,value){
    if(!el)return;
    if(el.style.getPropertyValue(prop)===value&&el.style.getPropertyPriority(prop)==='important')return;
    el.style.setProperty(prop,value,'important');
  }

  // A first-run wizard is a modal workflow, not a scrollable desktop page.
  // Keep the controls outside the content scroller so they cannot slip behind
  // the Android system navigation bar on compact/edge-to-edge phones.
  function layoutAndroidOnboarding(root){
    const card=q('.mlv200-onboard-card',root);
    const head=q('.mlv200-onboard-head',card);
    const actions=q('.mlv200-onboard-actions',card);
    if(!card||!head||!actions)return false;
    if(!q('.mlv-android-onboard-scroll',card)){
      const scroller=document.createElement('div');
      scroller.className='mlv-android-onboard-scroll';
      let node=head.nextSibling;
      while(node&&node!==actions){
        const next=node.nextSibling;
        scroller.appendChild(node);
        node=next;
      }
      card.insertBefore(scroller,actions);
    }
    return true;
  }

  function stabilizeAndroidOnboardingControls(){
    const root=q('#mlv200Onboarding');
    if(!root||!isMobile())return false;
    layoutAndroidOnboarding(root);

    qa('.mlv200-focus',root).forEach(row=>{
      setImportantOnce(row,'display','grid');
      setImportantOnce(row,'grid-template-columns','28px minmax(0,1fr)');
      setImportantOnce(row,'align-items','center');
      setImportantOnce(row,'gap','8px');
      setImportantOnce(row,'width','100%');
      setImportantOnce(row,'height','auto');
      setImportantOnce(row,'min-height','44px');
      setImportantOnce(row,'padding','6px 8px');
      setImportantOnce(row,'box-sizing','border-box');
    });

    qa('.mlv200-focus input[type="checkbox"],.mlv200-option input[type="checkbox"]',root).forEach(input=>{
      setImportantOnce(input,'-webkit-appearance','checkbox');
      setImportantOnce(input,'appearance','auto');
      setImportantOnce(input,'display','block');
      setImportantOnce(input,'position','static');
      setImportantOnce(input,'width','22px');
      setImportantOnce(input,'height','22px');
      setImportantOnce(input,'min-width','22px');
      setImportantOnce(input,'min-height','22px');
      setImportantOnce(input,'max-width','22px');
      setImportantOnce(input,'max-height','22px');
      setImportantOnce(input,'inline-size','22px');
      setImportantOnce(input,'block-size','22px');
      setImportantOnce(input,'min-inline-size','22px');
      setImportantOnce(input,'min-block-size','22px');
      setImportantOnce(input,'max-inline-size','22px');
      setImportantOnce(input,'max-block-size','22px');
      setImportantOnce(input,'margin','0');
      setImportantOnce(input,'padding','0');
      setImportantOnce(input,'transform','none');
      setImportantOnce(input,'justify-self','center');
      setImportantOnce(input,'align-self','center');
      setImportantOnce(input,'box-sizing','border-box');
    });

    qa('.mlv200-focus > span',root).forEach(copy=>{
      setImportantOnce(copy,'min-width','0');
      setImportantOnce(copy,'width','auto');
    });
    return true;
  }

  function enforceMobileFlowGeometry(){
    if(!isMobile())return;
    stabilizeAndroidOnboarding();
    stabilizeAndroidOnboardingControls();
    // The shared Desktop layout reapplies a one-column mobile KPI rule with
    // !important after stylesheet setup. Android's structural ownership must
    // set the 2x2 metric grid on the live element after every Dashboard render.
    const dashboardMetrics=q('#tab-dashboard .v131-kpis');
    if(dashboardMetrics){
      setImportantOnce(dashboardMetrics,'display','grid');
      setImportantOnce(dashboardMetrics,'grid-template-columns','repeat(2,minmax(0,1fr))');
      setImportantOnce(dashboardMetrics,'gap','8px');
    }
    // The canonical desktop Settings authority injects !important layout
    // after Android's stylesheet. Own the live selector too: only Android
    // uses this shallow horizontal pane navigator, Desktop remains unchanged.
    const mobileSettings=q('#tab-settings > .v30171-settings-shell');
    if(mobileSettings){
      setImportantOnce(mobileSettings,'display','block');
      setImportantOnce(mobileSettings,'grid-template-columns','minmax(0,1fr)');
      setImportantOnce(mobileSettings,'width','100%');
      setImportantOnce(mobileSettings,'max-height','none');
      const nav=q('.v30171-settings-nav',mobileSettings);
      if(nav){
        [
          ['position','relative'],['top','auto'],['display','flex'],
          ['flex-direction','row'],['flex-wrap','nowrap'],['align-items','center'],
          ['height','auto'],['min-height','0'],['max-height','none'],
          ['width','100%'],['max-width','100%'],
          ['overflow-x','auto'],['overflow-y','hidden'],
          ['touch-action','pan-x'],['padding','7px'],['gap','6px'],
          ['margin','0 0 10px']
        ].forEach(([key,value])=>setImportantOnce(nav,key,value));
        const heading=q('.v30171-settings-title',nav);
        if(heading)setImportantOnce(heading,'display','none');
        qa('button[data-v30171-setting]',nav).forEach(btn=>{
          [
            ['flex','0 0 auto'],['width','auto'],['min-width','75px'],
            ['max-width','none'],['height','auto'],['min-height','48px'],
            ['padding','8px 10px'],['white-space','nowrap']
          ].forEach(([key,value])=>setImportantOnce(btn,key,value));
          if(btn.dataset.v30171Setting==='sync')setImportantOnce(btn,'order','-2');
          if(btn.dataset.v30171Setting==='google')setImportantOnce(btn,'order','-1');
        });
      }
    }
    // Restore the HTML document as the only vertical scrollport on Android;
    // BODY must not trap touch chains in an empty nested scroller.
    if(document.body){
      setImportantOnce(document.body,'overflow-y','visible');
      setImportantOnce(document.body,'overscroll-behavior-y','auto');
    }
    const app=q('.app');
    if(app){
      setImportantOnce(app,'padding','0');
      setImportantOnce(app,'margin','0');
      setImportantOnce(app,'width','100%');
      setImportantOnce(app,'max-width','none');
    }
    const side=q('#v30171Sidebar');
    if(side){
      if(side.parentElement!==document.body)document.body.appendChild(side);
      setImportantOnce(side,'position','fixed');
      setImportantOnce(side,'top','calc(var(--mlv-android-topbar-h) + env(safe-area-inset-top,0px))');
      setImportantOnce(side,'left','0');
      setImportantOnce(side,'right','auto');
      setImportantOnce(side,'bottom','0');
      setImportantOnce(side,'width','min(86vw,320px)');
      setImportantOnce(side,'max-width','320px');
      setImportantOnce(side,'height','auto');
      setImportantOnce(side,'max-height','none');
      setImportantOnce(side,'margin','0');
      setImportantOnce(side,'z-index','2147482995');
      setImportantOnce(side,'background','rgba(var(--ui-panel-rgb,7,13,25),.985)');
      setImportantOnce(side,'transform',document.body.classList.contains('mlv-android-nav-open')?'translateX(0)':'translateX(-105%)');

      let hint=q('#mlv-android-drawer-hint',side);
      if(!hint){
        hint=document.createElement('div');
        hint.id='mlv-android-drawer-hint';
        hint.textContent='Swipe ↔ or use ‹ › to change sections';
        side.appendChild(hint);
      }

      const actionDock=q('#v30175ActionDock');
      if(actionDock){
        if(actionDock.parentElement!==side)side.appendChild(actionDock);
        setImportantOnce(actionDock,'position','sticky');
        setImportantOnce(actionDock,'left','auto');
        setImportantOnce(actionDock,'right','auto');
        setImportantOnce(actionDock,'bottom','0');
        setImportantOnce(actionDock,'width','100%');
        setImportantOnce(actionDock,'display','flex');
        setImportantOnce(actionDock,'flex-direction','row');
        setImportantOnce(actionDock,'justify-content','center');
        setImportantOnce(actionDock,'gap','9px');
        setImportantOnce(actionDock,'z-index','8');
      }
    }

    const focusDock=q('#v30162FocusDock');
    if(focusDock){
      setImportantOnce(focusDock,'left','0');
      setImportantOnce(focusDock,'right','auto');
      setImportantOnce(focusDock,'bottom','0');
      setImportantOnce(focusDock,'width','0');
      setImportantOnce(focusDock,'height','0');
      setImportantOnce(focusDock,'min-width','0');
      setImportantOnce(focusDock,'min-height','0');
      setImportantOnce(focusDock,'max-width','0');
      setImportantOnce(focusDock,'max-height','0');
      setImportantOnce(focusDock,'pointer-events','none');
    }

    // Desktop Home's overflow:hidden hero traps one-finger vertical scroll.
    // An overflow:clip visual crop has no independent scroll container.
    const dashboardHero=q('#tab-dashboard .v131-hero');
    if(dashboardHero){
      setImportantOnce(dashboardHero,'overflow','clip');
      setImportantOnce(dashboardHero,'touch-action','pan-y');
    }
    qa('#tab-dashboard .v131-kpis, #tab-dashboard .v131-kpi').forEach(el=>
      setImportantOnce(el,'touch-action','pan-y')
    );
    const status=q('#v176StatusPanel');
    if(status){
      setImportantOnce(status,'position','relative');
      setImportantOnce(status,'top','auto');
      // The SECOND legacy status tile becomes Current Chapter. Never cap
      // the whole panel at 88px or hide that tile: doing so also clips the
      // canonical v30189 cinematic image, fog and light-sweep layers.
      setImportantOnce(status,'max-height','none');
      setImportantOnce(status,'overflow','visible');
      setImportantOnce(status,'contain','none');
      status.querySelectorAll('.v176-card').forEach(card=>{
        const chapter=card.classList.contains('v30165-rpg-chapter-hero');
        if(chapter){
          // Only undo the old Android interception; the shared Chapter
          // renderer owns the scene, art, timing and motion.
          for(const property of ['display','visibility','pointer-events']){
            if(card.style.getPropertyPriority(property)==='important' &&
               ['none','hidden'].includes(card.style.getPropertyValue(property)))
              card.style.removeProperty(property);
          }
        }else{
          setImportantOnce(card,'display','none');
          setImportantOnce(card,'visibility','hidden');
          setImportantOnce(card,'pointer-events','none');
        }
      });
      let summary=status.querySelector('#mlv-android-time-summary');
      if(!summary){
        summary=document.createElement('div');
        summary.id='mlv-android-time-summary';
        summary.setAttribute('aria-label','Current time and date');
        summary.innerHTML='<strong id="mlv-android-clock-time"></strong>'+
          '<span id="mlv-android-clock-date"></span>';
        status.appendChild(summary);
      }
      const locale=(document.documentElement.lang||'en').trim()||'en';
      const now=new Date();
      // Prefer the existing live clock text without relying on the desktop
      // tile's absolute geometry; fall back to a localized device time.
      const source=String(status.querySelector('.v176-time')?.textContent||'').trim();
      const found=source.match(/\b\d{1,2}:\d{2}(?:\s*[aApP][mM])?\b/);
      const clockText=found?found[0]:new Intl.DateTimeFormat(locale,{
        hour:'2-digit',minute:'2-digit',hour12:true
      }).format(now);
      const today=new Intl.DateTimeFormat(locale,{
        weekday:'long',month:'short',day:'numeric'
      }).format(now);
      const displayClock=summary.querySelector('#mlv-android-clock-time');
      const displayDate=summary.querySelector('#mlv-android-clock-date');
      if(displayClock&&displayClock.textContent!==clockText)displayClock.textContent=clockText;
      if(displayDate&&displayDate.textContent!==today)displayDate.textContent=today;
      setImportantOnce(status,'margin','6px 8px');
    }
  }

  function installMobileChrome(){
    if(q('#mlv-android-topbar')){enforceMobileFlowGeometry();return;}
    const topbar=document.createElement('header');
    topbar.id='mlv-android-topbar';
    topbar.setAttribute('aria-label','Android navigation');
    topbar.innerHTML='<button id="mlv-android-menu-button" type="button" aria-label="Open menu" aria-expanded="false">☰</button><div class="mlv-android-topbar-copy"><strong>Michel’s Life</strong><span id="mlv-android-section-title">Today</span></div><div class="mlv-android-section-controls" aria-label="Section navigation"><button id="mlv-android-prev-section" type="button" aria-label="Previous section">‹</button><button id="mlv-android-next-section" type="button" aria-label="Next section">›</button></div>';
    const backdrop=document.createElement('button');
    backdrop.id='mlv-android-drawer-backdrop';
    backdrop.type='button';
    backdrop.tabIndex=-1;
    backdrop.setAttribute('aria-label','Close menu');
    document.body.append(topbar,backdrop);
    q('#mlv-android-menu-button')?.addEventListener('click',()=>setDrawer(!document.body.classList.contains('mlv-android-nav-open')));
    q('#mlv-android-prev-section')?.addEventListener('click',()=>navigateSwipe('previous'));
    q('#mlv-android-next-section')?.addEventListener('click',()=>navigateSwipe('next'));
    backdrop.addEventListener('click',()=>setDrawer(false));
    document.addEventListener('click',event=>{
      if(!isMobile())return;
      const navTarget=event.target.closest('#side [data-tab], #v30171PrimaryNav [data-tab]');
      if(navTarget)setDrawer(false);
      if(event.target.closest('[data-action="close-modal"], .modal-backdrop'))setTimeout(updateTopbarTitle,0);
      if(event.target.closest('[data-mlv200-onboard]')){
        setTimeout(stabilizeAndroidOnboardingControls,0);
        setTimeout(stabilizeAndroidOnboardingControls,80);
      }
    },true);
    updateTopbarTitle();
  }

  function installSwipeNavigation(){
    let startX=0,startY=0,startAt=0,tracking=false,interactive=false,horizontalScroller=false;
    document.addEventListener('touchstart',event=>{
      if(!isMobile()||event.touches.length!==1)return;
      const touch=event.touches[0];
      startX=touch.clientX;startY=touch.clientY;startAt=performance.now();tracking=true;
      const target=event.target;
      interactive=!!target.closest('button,a,input,select,textarea,label,[contenteditable="true"],.modal,.v132-actions,.actions');
      horizontalScroller=!!target.closest('.v134-ach-filter,.v140-cat-shortcuts,.v140-library-toggle,[data-horizontal-scroll],.tabs,.v30171-settings-nav');
      window.__mlvAndroidGestureDebug={
        phase:'start',startX,startY,target:target?.tagName||'',className:String(target?.className||''),
        interactive,horizontalScroller
      };
    },{passive:true});
    document.addEventListener('touchend',event=>{
      if(!tracking||!isMobile()||event.changedTouches.length!==1){tracking=false;return;}
      tracking=false;
      const touch=event.changedTouches[0];
      const dx=touch.clientX-startX,dy=touch.clientY-startY,elapsed=Math.max(1,performance.now()-startAt);
      const debug=window.__mlvAndroidGestureDebug||{};
      Object.assign(debug,{phase:'end',dx,dy,elapsed,drawerOpen:document.body.classList.contains('mlv-android-nav-open')});
      window.__mlvAndroidGestureDebug=debug;
      if(Math.abs(dx)<96||Math.abs(dx)<Math.abs(dy)*1.65||elapsed>650){debug.result='threshold-rejected';return;}
      if(document.body.classList.contains('mlv-android-nav-open')){
        if(dx<0){setDrawer(false);debug.result='drawer-closed';}else debug.result='drawer-open-noop';
        return;
      }
      if(startX<=28&&dx>72){setDrawer(true);debug.result='drawer-opened';return;}
      if(interactive||horizontalScroller){debug.result=interactive?'interactive-rejected':'horizontal-scroller-rejected';return;}
      const direction=dx<0?'next':'previous';
      debug.direction=direction;
      debug.result=navigateSwipe(direction)?'navigated':'navigation-unavailable';
    },{passive:true});
  }

  function closeTopModal(){
    const modal=q('#modalRoot .modal-backdrop, .modal-backdrop');
    if(!visible(modal))return false;
    const close=q('[data-action="close-modal"]',modal);
    if(close){close.click();return true;}
    return false;
  }

  window.__mlvAndroidHandleBack=function(){
    if(document.body.classList.contains('mlv-android-nav-open')){setDrawer(false);return true;}
    if(closeTopModal())return true;
    return false;
  };

  function installPlatformStyles(){
    if(q('#mlv-android-platform-style'))return;
    const style=document.createElement('style');
    style.id='mlv-android-platform-style';
    style.textContent=`
      [data-mlv202-action="install-online"],[data-mlv202-action="install-local"],[data-mlv202-action="choose-local"]{display:none!important}
      html[data-mlv-platform="android"],html[data-mlv-platform="android"] body{min-width:0!important;max-width:100%!important;overflow-x:hidden!important}
      #mlv-android-topbar,#mlv-android-drawer-backdrop{display:none}
      @media(max-width:${MOBILE_BREAKPOINT}px){
        :root{--mlv-android-topbar-h:56px}
        html[data-mlv-platform="android"] body{overscroll-behavior-y:contain;padding-top:calc(var(--mlv-android-topbar-h) + env(safe-area-inset-top,0px))!important;touch-action:auto!important}
        html[data-mlv-platform="android"] #main *,html[data-mlv-platform="android"] #v30171Sidebar *,#mlv-android-topbar{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
        #v3000SkyImg{filter:none!important;transform:none!important}
        /* The wizard owns the whole foreground. Fixed Android chrome must never
           sit on top of first-run steps or hijack taps before Continue. */
        #mlv200Onboarding{position:fixed!important;inset:0!important;z-index:2147483500!important;display:flex!important;justify-content:center!important;align-items:stretch!important;width:100vw!important;height:100dvh!important;max-height:100dvh!important;min-height:0!important;box-sizing:border-box!important;padding:max(12px,env(safe-area-inset-top,0px)) 8px max(42px,env(safe-area-inset-bottom,0px))!important;overflow:hidden!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(3,7,13,.96)!important}
        body:has(#mlv200Onboarding:not([hidden])) #mlv-android-topbar{visibility:hidden!important;pointer-events:none!important}
        #mlv200Onboarding .mlv200-onboard-card{display:flex!important;flex-direction:column!important;width:100%!important;max-width:560px!important;height:100%!important;max-height:100%!important;min-height:0!important;min-width:0!important;overflow:hidden!important;box-sizing:border-box!important;padding:14px!important;border-radius:18px!important}
        #mlv200Onboarding .mlv200-onboard-head{flex:0 0 auto!important;min-width:0!important;margin-bottom:12px!important}
        #mlv200Onboarding .mlv200-onboard-head h1{font-size:clamp(22px,6.5vw,30px)!important;overflow-wrap:anywhere!important}
        #mlv200Onboarding .mlv-android-onboard-scroll{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:0 1px 12px!important}
        #mlv200Onboarding .mlv200-onboard-actions{flex:0 0 auto!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;position:relative!important;bottom:auto!important;margin:0!important;padding:12px 0 2px!important;min-height:68px!important;box-sizing:border-box!important;background:rgba(var(--ui-panel-rgb,8,16,26),.98)!important;z-index:2!important}
        #mlv200Onboarding .mlv200-onboard-actions>div{display:flex!important;gap:6px!important;min-width:0!important;justify-content:flex-end!important}
        #mlv200Onboarding .mlv200-onboard-actions button{position:relative!important;min-height:48px!important;min-width:0!important;max-width:100%!important;padding:8px 11px!important;font-size:12px!important;opacity:1!important;pointer-events:auto!important;touch-action:manipulation!important;white-space:nowrap!important}
        #mlv200Onboarding .mlv200-onboard-actions [data-mlv200-onboard="next"],#mlv200Onboarding .mlv200-onboard-actions [data-mlv200-onboard="finish"]{flex:0 0 auto!important;min-width:96px!important}
        @media(max-width:360px){#mlv200Onboarding .mlv200-onboard-actions button{padding-inline:7px!important;font-size:11px!important}#mlv200Onboarding .mlv200-onboard-actions [data-mlv200-onboard="next"],#mlv200Onboarding .mlv200-onboard-actions [data-mlv200-onboard="finish"]{min-width:85px!important}}
        #mlv200Onboarding .mlv200-focus-grid{grid-template-columns:1fr!important;gap:6px!important}
        #mlv200Onboarding .mlv200-focus{display:grid!important;grid-template-columns:28px minmax(0,1fr)!important;align-items:center!important;gap:8px!important;min-height:46px!important;padding:7px 10px!important;border-radius:12px!important}
        #mlv200Onboarding .mlv200-focus input[type="checkbox"],#mlv200Onboarding .mlv200-option input[type="checkbox"]{-webkit-appearance:checkbox!important;appearance:auto!important;width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important;max-width:22px!important;max-height:22px!important;margin:0!important;padding:0!important;transform:none!important;accent-color:var(--ui-accent,var(--accent,#ff7ad9))!important}
        #mlv200Onboarding .mlv200-focus b{font-size:12px!important;line-height:1.25!important}
        html[data-mlv-platform="android"][data-mlv-android-switching="1"] #main>.tab{transition-duration:0s!important}
        html[data-mlv-platform="android"][data-mlv-android-switching="1"] #mlv-android-topbar::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:currentColor;opacity:.38;animation:mlvAndroidSwitchPulse .55s ease-in-out infinite alternate}
        @keyframes mlvAndroidSwitchPulse{from{transform:scaleX(.22);opacity:.18}to{transform:scaleX(1);opacity:.52}}
        /* Do not intersect pan-y ancestors with Settings horizontal pan-x. */
        /* Normal page movement must work with ONE finger. Desktop theme
           surfaces occasionally own pointer/touch gestures and can suppress
           native WebView scrolling. Keep horizontal carousels separate. */
        html[data-mlv-platform="android"],
        html[data-mlv-platform="android"] body,
        html[data-mlv-platform="android"] .app,
        html[data-mlv-platform="android"] .app-shell,
        html[data-mlv-platform="android"] .layout,
        html[data-mlv-platform="android"] .content,
        html[data-mlv-platform="android"] #main,
        html[data-mlv-platform="android"] #main>.tab,
        html[data-mlv-platform="android"] #tab-dashboard,
        html[data-mlv-platform="android"] #tab-dashboard .v131-hero,
        html[data-mlv-platform="android"] #tab-dashboard .v131-kpis,
        html[data-mlv-platform="android"] #tab-dashboard .v131-kpi,
        html[data-mlv-platform="android"] #tab-dashboard .v132-panel,
        html[data-mlv-platform="android"] #tab-dashboard .card,
        html[data-mlv-platform="android"] #v176StatusPanel,
        html[data-mlv-platform="android"] #v176StatusPanel .v176-card{
          touch-action:pan-y!important
        }
        /* Status: one compact, complete time-and-date row, not a giant
           clipped clock left over from the desktop multi-card overlay. */
        html[data-mlv-platform="android"] #v176StatusPanel{
          height:auto!important;min-height:0!important;max-height:none!important;
          padding:7px 10px!important;overflow:visible!important;
          display:flex!important;flex-direction:column!important;
          align-items:stretch!important;gap:9px!important;
          contain:none!important
        }
        html[data-mlv-platform="android"] #v176StatusPanel
        >.v176-card.v30165-rpg-chapter-hero{
          display:block!important;position:relative!important;
          visibility:visible!important;pointer-events:auto!important;
          width:100%!important;min-width:0!important;min-height:238px!important;
          flex:0 0 auto!important;overflow:hidden!important;
          order:1!important
        }
        html[data-mlv-platform="android"] #v176StatusPanel .v176-card:not(.v30165-rpg-chapter-hero){
          /* Desktop status tiles are absolutely laid out, so reflowing the
             first one leaves descendants far outside the compact container. */
          display:none!important
        }
        html[data-mlv-platform="android"] #v176StatusPanel #mlv-android-time-summary{
          display:flex!important;position:relative!important;
          order:0!important;flex:0 0 auto!important;flex-direction:column!important;
          align-items:flex-start!important;justify-content:center!important;
          width:100%!important;min-width:0!important;min-height:0!important;
          height:auto!important;margin:0!important;padding:2px 5px!important;
          transform:none!important;overflow:visible!important;gap:3px!important;
          touch-action:pan-y!important
        }
        html[data-mlv-platform="android"] #v176StatusPanel #mlv-android-clock-time{
          display:block!important;position:static!important;
          font:800 clamp(21px,6.4vw,28px)/1.12 system-ui,sans-serif!important;
          letter-spacing:-.03em!important;white-space:nowrap!important
        }
        html[data-mlv-platform="android"] #v176StatusPanel #mlv-android-clock-date{
          display:block!important;position:static!important;
          font:500 12px/1.25 system-ui,sans-serif!important;
          opacity:.8!important;white-space:normal!important
        }
        /* overflow:hidden creates a non-scrollable scrolling ancestor in
           Chromium WebView and traps one-finger panning on Today metrics.
           overflow:clip preserves the rounded-card visual crop without
           creating a scrolling container or blocking document pan-y. */
        html[data-mlv-platform="android"] #tab-dashboard .v131-hero{
          overflow:clip!important;touch-action:pan-y!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v131-kpis,
        html[data-mlv-platform="android"] #tab-dashboard .v131-kpi{
          touch-action:pan-y!important
        }
        .v134-ach-filter,.v140-cat-shortcuts,.v140-library-toggle,[data-horizontal-scroll],.tabs,.v30171-settings-nav{touch-action:pan-x!important}
        #mlv-android-topbar{position:fixed;display:flex;align-items:center;gap:10px;top:0;left:0;right:0;height:calc(var(--mlv-android-topbar-h) + env(safe-area-inset-top,0px));padding:env(safe-area-inset-top,0px) 12px 0;z-index:2147483000;background:rgba(6,9,19,.94);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.1);box-sizing:border-box}
        #mlv-android-menu-button{width:42px;height:42px;min-width:42px;padding:0;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:inherit;font:inherit;font-size:22px;line-height:1;display:grid;place-items:center}
        .mlv-android-topbar-copy{min-width:0;display:flex;flex:1 1 auto;flex-direction:column;gap:1px}.mlv-android-topbar-copy strong{font-size:13px;line-height:1.1}.mlv-android-topbar-copy span{font-size:11px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:48vw}
        .mlv-android-section-controls{display:flex;gap:5px;flex:0 0 auto}.mlv-android-section-controls button{width:34px;height:34px;min-width:34px;padding:0;border-radius:10px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.045);color:inherit;font-size:22px;line-height:1;display:grid;place-items:center}.mlv-android-section-controls button:disabled{opacity:.24}
        #mlv-android-drawer-backdrop{display:block;position:fixed;inset:calc(var(--mlv-android-topbar-h) + env(safe-area-inset-top,0px)) 0 0;border:0;padding:0;background:rgba(0,0,0,.48);opacity:0;pointer-events:none;z-index:2147482990;transition:opacity .18s ease}
        body.mlv-android-nav-open #mlv-android-drawer-backdrop{opacity:1;pointer-events:auto}
        .app{max-width:none!important;width:100%!important;margin:0!important;padding:0!important}
        .topbar{display:none!important}
        .app-shell,.layout,.content,#main{min-width:0!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important}
        .app-shell,.layout{grid-template-columns:minmax(0,1fr)!important;display:block!important;margin-top:6px!important}
        #fixedStatusBar,.status-strip{display:none!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
        #v176StatusPanel{position:relative!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;width:calc(100% - 16px)!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;margin:6px 8px!important;padding:7px!important;border-radius:14px!important;overflow:visible!important;contain:none!important;transform:none!important}
        #v176StatusPanel .v176-card:not(.v30165-rpg-chapter-hero){display:none!important}
        #v176StatusPanel>.v176-card.v30165-rpg-chapter-hero{display:block!important;position:relative!important;visibility:visible!important;pointer-events:auto!important;min-height:238px!important;width:100%!important;overflow:hidden!important}
        #v176StatusPanel .v176-time{flex:0 0 auto!important;font-size:18px!important;line-height:1!important;letter-spacing:-.03em!important}
        #v176StatusPanel .v176-small{min-width:0!important;margin:0!important;font-size:9px!important;line-height:1.2!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
        #v30171Sidebar{position:fixed!important;top:calc(var(--mlv-android-topbar-h) + env(safe-area-inset-top,0px))!important;left:0!important;bottom:0!important;width:min(86vw,320px)!important;max-width:320px!important;height:auto!important;max-height:none!important;overflow-y:auto!important;transform:translateX(-105%)!important;transition:transform .16s ease!important;z-index:2147482995!important;margin:0!important;padding:10px!important;border-radius:0 18px 18px 0!important;box-shadow:12px 0 35px rgba(0,0,0,.35)!important;overscroll-behavior:contain;background:rgba(var(--ui-panel-rgb,7,13,25),.985)!important}
        body.mlv-android-nav-open #v30171Sidebar{transform:translateX(0)!important}
        #v30171Sidebar .v30171-brand{flex-direction:row!important;justify-content:flex-start!important;text-align:left!important;gap:8px!important;padding:5px 4px 9px!important}
        #v30171Sidebar .v30171-brand-mark{width:38px!important;height:38px!important;min-width:38px!important;font-size:20px!important}
        #v30171Sidebar h1.v30171-brand-title{font-size:13px!important;text-align:left!important}
        #v30171PrimaryNav{display:flex!important;flex-direction:column!important;grid-template-columns:none!important;gap:4px!important;padding:2px 0 8px!important}
        #v30171PrimaryNav .v30171-nav-btn{min-height:40px!important;padding:8px 9px!important;gap:8px!important;font-size:12px!important}
        #main,.content{margin:0!important;padding:8px!important}

        /*
         * Android screen owns its scrolling. The shared desktop layout uses
         * sticky/height/overflow constraints that clipped Settings below the
         * Galaxy navigation area. Keep document scroll vertical while the
         * Settings category picker scrolls horizontally on its own.
         */
        html[data-mlv-platform="android"]{height:auto!important;min-height:100%!important;overflow-x:clip!important;overflow-y:auto!important}
        /* The HTML element is document.scrollingElement. If BODY also has
           overflow-y:auto + overscroll-behavior:contain, native one-finger
           scrolling cannot chain to HTML even though scrollTo works.
           Leave BODY non-scrolling and let the root own the one scrollport. */
        html[data-mlv-platform="android"] body{
          height:auto!important;min-height:100dvh!important;max-height:none!important;
          overflow-x:clip!important;overflow-y:visible!important;
          overscroll-behavior-y:auto!important
        }
        html[data-mlv-platform="android"] .app,
        html[data-mlv-platform="android"] .app-shell,
        html[data-mlv-platform="android"] .layout,
        html[data-mlv-platform="android"] .content,
        html[data-mlv-platform="android"] #main,
        html[data-mlv-platform="android"] #tab-settings{
          height:auto!important;max-height:none!important;overflow-y:visible!important;min-height:0!important
        }
        html[data-mlv-platform="android"] #main{padding-bottom:max(100px,calc(56px + env(safe-area-inset-bottom,0px)))!important}
        /* Keep the 4 actual dashboard KPIs, but show them as compact 2x2. */
        html[data-mlv-platform="android"] #tab-dashboard .v131-kpis{
          display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:8px!important;margin-top:12px!important;align-items:stretch!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v131-kpi{
          width:auto!important;min-width:0!important;min-height:0!important;height:auto!important;
          padding:10px 11px!important;border-radius:14px!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v131-kpi small{
          font-size:11px!important;line-height:1.25!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v131-kpi b{
          margin-top:4px!important;font-size:24px!important;line-height:1.05!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v131-kpi span{
          margin-top:4px!important;font-size:10px!important;line-height:1.2!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v131-hero-title h2{
          font-size:22px!important;line-height:1.12!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v131-hero-title{
          display:flex!important;align-items:flex-start!important;gap:8px!important;margin-bottom:8px!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v131-hero{
          padding:12px!important;margin-bottom:10px!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v132-dashboard-grid > .v132-panel{
          min-height:0!important;height:auto!important
        }
        /* The desktop dashboard panel toggles consume an entire phone row. */
        html[data-mlv-platform="android"] #tab-dashboard .v30176-dashboard-layoutbar{
          flex-direction:row!important;flex-wrap:wrap!important;align-items:center!important;
          padding:6px 8px!important;gap:6px!important;margin-bottom:8px!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v30176-layout-label{display:none!important}
        html[data-mlv-platform="android"] #tab-dashboard .v30176-layout-actions{
          display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:6px!important;width:100%!important;min-width:0!important
        }
        html[data-mlv-platform="android"] #tab-dashboard .v30176-panel-toggle{
          min-width:0!important;min-height:38px!important;padding:6px 8px!important;
          font-size:11px!important;white-space:normal!important
        }
        /* Settings gets a shallow, swipeable section picker above actual content.
           Sync and Google lead the mobile-only visual order for quick access;
           DOM order and desktop section logic stay untouched. */
        html[data-mlv-platform="android"] #tab-settings>.v30171-settings-shell{
          display:block!important;grid-template-columns:minmax(0,1fr)!important;
          width:100%!important;min-width:0!important;max-height:none!important
        }
        html[data-mlv-platform="android"] #tab-settings .v30171-settings-nav{
          position:relative!important;top:auto!important;left:auto!important;
          display:flex!important;flex-flow:row nowrap!important;align-items:center!important;
          gap:6px!important;width:100%!important;max-width:100%!important;
          min-height:0!important;max-height:none!important;margin:0 0 10px!important;
          padding:7px!important;overflow-x:auto!important;overflow-y:hidden!important;
          -webkit-overflow-scrolling:touch!important;touch-action:pan-x!important;
          overscroll-behavior-x:contain!important;scrollbar-width:thin!important
        }
        html[data-mlv-platform="android"] #tab-settings .v30171-settings-title{display:none!important}
        html[data-mlv-platform="android"] #tab-settings .v30171-settings-nav button{
          flex:0 0 auto!important;width:auto!important;max-width:none!important;
          min-height:48px!important;min-width:75px!important;
          padding:8px 10px!important;white-space:nowrap!important;
          font-size:11px!important;line-height:1.2!important
        }
        html[data-mlv-platform="android"] #tab-settings .v30171-settings-nav [data-v30171-setting="sync"]{order:-2}
        html[data-mlv-platform="android"] #tab-settings .v30171-settings-nav [data-v30171-setting="google"]{order:-1}
        html[data-mlv-platform="android"] #tab-settings .v30171-settings-content,
        html[data-mlv-platform="android"] #tab-settings .v30171-settings-pane{
          height:auto!important;min-height:0!important;max-height:none!important;
          overflow:visible!important;width:100%!important;min-width:0!important
        }
        html[data-mlv-platform="android"] #v30171Sidebar{
          bottom:max(0px,env(safe-area-inset-bottom,0px))!important;
          padding-bottom:max(72px,calc(36px + env(safe-area-inset-bottom,0px)))!important
        }

        .card,.v132-panel,.v131-hero{max-width:100%!important;box-sizing:border-box!important}
        .v131-stack,.dashboard-v13{gap:8px!important}
        .v132-dashboard-grid,.dash-row-v13{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:8px!important}
        .v131-hero,.dash-hero-v13{padding:12px!important;min-height:0!important}
        .v131-kpis,.kpis{gap:6px!important}
        .v131-kpi,.kpi{padding:8px!important;min-width:0!important}
        .section-title{gap:8px!important;align-items:flex-start!important}.section-title h2{font-size:clamp(17px,5vw,21px)!important;line-height:1.12!important}.section-title p{margin-top:3px!important}
        article.v132-mission,article.v137-mission,article.mission-card,article.quest-card{display:grid!important;grid-template-columns:40px minmax(0,1fr)!important;column-gap:9px!important;align-items:start!important;padding:10px!important;min-width:0!important}
        article.v132-mission>.v132-check,article.v137-mission>.v132-check,.mission-card .v132-check,.quest-card .v132-check{grid-column:1!important;width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;margin:0!important;padding:0!important;align-self:start!important;justify-self:start!important;display:grid!important;place-items:center!important;line-height:1!important;box-sizing:border-box!important}
        article.v132-mission>div,article.v137-mission>div,article.mission-card>div,article.quest-card>div{grid-column:2!important;min-width:0!important}
        article.v132-mission h3,article.v137-mission h3,.mission-card h3,.quest-card h3{overflow-wrap:anywhere!important;margin-top:1px!important}
        .v131-pills,.pills,.chips{display:flex!important;flex-wrap:wrap!important;gap:5px!important;min-width:0!important}
        .v132-mission-actions{grid-column:2!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:6px!important;min-width:0!important;margin-top:6px!important}
        .v132-actions,.v131-actions,.quest-actions,article.v132-mission .actions,article.v137-mission .actions{display:flex!important;flex-wrap:wrap!important;gap:6px!important;min-width:0!important}
        .v132-actions button,.v131-actions button,.quest-actions button,article.v132-mission .actions button,article.v137-mission .actions button{min-height:38px!important;max-width:100%!important;white-space:normal!important}
        #mlv-android-drawer-hint{margin:8px 2px 5px;padding:7px 8px;border-top:1px solid rgba(255,255,255,.08);font-size:9px;line-height:1.25;text-align:center;color:var(--muted,#aeb9ce);opacity:.78}
        #v30175ActionDock{position:sticky!important;left:auto!important;right:auto!important;bottom:0!important;width:100%!important;margin:0!important;padding:6px 2px 8px!important;display:flex!important;flex-direction:row!important;justify-content:center!important;gap:9px!important;align-items:center!important;background:linear-gradient(180deg,transparent,rgba(6,9,19,.98) 30%)!important;z-index:8!important;pointer-events:none!important;box-sizing:border-box!important}
        #v30175ActionDock .v30175-action,#v30175ActionDock #v30106QuickFab{--v30175-action-size:44px!important;position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;max-width:44px!important;max-height:44px!important;border-radius:14px!important;pointer-events:auto!important}
        #v30175ActionDock .v30175-icon{width:21px!important;height:21px!important}
        #v30162FocusDock{left:0!important;right:auto!important;bottom:0!important;width:0!important;height:0!important;min-width:0!important;min-height:0!important;max-width:0!important;max-height:0!important;pointer-events:none!important}
        #v30162FocusDock .v30173-focus-wrap,#v30162FocusDock .v30173-focus-trigger{width:0!important;height:0!important;min-width:0!important;min-height:0!important;max-width:0!important;max-height:0!important}
        /* Stable Android check controls: never inherit full-width desktop input sizing. */
        #mlv200Onboarding .mlv200-focus{display:grid!important;grid-template-columns:26px minmax(0,1fr)!important;align-items:center!important;gap:10px!important;min-height:52px!important;padding:9px 11px!important}
        #mlv200Onboarding .mlv200-focus input[type="checkbox"]{width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important;max-width:22px!important;max-height:22px!important;margin:0!important;padding:0!important;transform:none!important;flex:0 0 22px!important;accent-color:var(--accent)!important}
        #mlv200Onboarding .mlv200-focus span{min-width:0!important}
        #mlv200Onboarding .mlv200-focus b{font-size:13px!important;line-height:1.25!important;overflow-wrap:anywhere!important}
        #mlv200Onboarding .mlv200-option input[type="checkbox"],.day-chip input[type="checkbox"],.mlv185-opacity-toggle input[type="checkbox"]{width:20px!important;height:20px!important;min-width:20px!important;min-height:20px!important;max-width:20px!important;max-height:20px!important;flex:0 0 20px!important;margin:1px 0 0!important}
        #main{padding-bottom:12px!important}
        #v30162FocusDock .v30173-focus-panel{pointer-events:auto!important;left:10px!important;right:10px!important;bottom:10px!important;width:auto!important;max-height:calc(100vh - var(--mlv-android-topbar-h) - 30px)!important}
                input,select,textarea,button{max-width:100%;box-sizing:border-box}
      }
      @media(min-width:900px) and (max-width:${MOBILE_BREAKPOINT}px){
        html[data-mlv-platform="android"] #main,
        html[data-mlv-platform="android"] .content{width:min(100%,1180px)!important;max-width:1180px!important;margin-left:auto!important;margin-right:auto!important}
        html[data-mlv-platform="android"] #v176StatusPanel{width:min(calc(100% - 24px),1180px)!important;max-width:1180px!important;margin-left:auto!important;margin-right:auto!important}
      }
      @media(min-width:${MOBILE_BREAKPOINT+1}px){body.mlv-android-nav-open{overflow:auto}}
    `;
    (document.body||document.head).appendChild(style);
  }

  function observeUi(){
    let navObserver=null;
    let navTarget=null;
    let lastActive='';

    const attachNavObserver=()=>{
      const next=q('#v30171PrimaryNav');
      if(next===navTarget)return;
      navObserver?.disconnect();
      navTarget=next;
      if(!next)return;
      navObserver=new MutationObserver(()=>requestAnimationFrame(updateTopbarTitle));
      navObserver.observe(next,{subtree:true,attributes:true,attributeFilter:['class','aria-current']});
    };

    const maintenance=()=>{
      if(!isMobile())return;
      stabilizeAndroidOnboarding();
      attachNavObserver();
      const active=activeTabId();
      if(active&&active!==lastActive){lastActive=active;updateTopbarTitle();}
      enforceMobileFlowGeometry();
      renderDirectUpdater();
    };

    attachNavObserver();
    maintenance();
    window.__mlvAndroidMaintenanceTimer=setInterval(maintenance,1000);
    window.addEventListener('michelslife:languagechange',()=>setTimeout(updateTopbarTitle,0));
    window.addEventListener('resize',()=>{if(!isMobile())setDrawer(false);else maintenance();});
  }

  installFastNavCapture();

  // Android Direct updater: a small Android-only control hosted INSIDE the
  // canonical About pane. The native bridge is the only release authority.
  // No alternate state engine, APK installation, credentials or external HTML.
  const directUpdater={
    next:0,pending:null,last:null,timeout:null
  };
  const updaterLabels=()=>{
    const lang=String(window.MichelsLifeI18n?.language||
      localStorage.getItem('michelsLife.language.v1')||'en').toLowerCase();
    return lang.startsWith('es')?{
      title:'Actualizaciones Android',check:'Buscar actualizaciones',
      checking:'Consultando la versión oficial…',
      initial:'Comprueba si existe una nueva versión oficial.',
      available:'Hay una nueva versión Android Direct disponible',
      current:'Ya tienes la versión pública más reciente',
      ahead:'Esta instalación es más reciente que la versión pública',
      unchecked:'No fue posible comprobar la versión. Inténtalo de nuevo.',
      play:'Esta instalación se actualiza desde Google Play.',
      test:'Versión de prueba: no se puede certificar como Android Direct.',
      untrusted:'Esta instalación no tiene la firma oficial Android Direct.',
      official:'Ver publicación oficial',installed:'Instalada',
      latest:'Disponible'
    }:{
      title:'Android updates',check:'Check for updates',
      checking:'Checking the official release…',
      initial:'Check for a newer official public release.',
      available:'A newer Android Direct version is available',
      current:'You have the latest public Android version',
      ahead:'This installation is newer than the public release',
      unchecked:'The update could not be verified. Try again.',
      play:'Google Play manages updates for this installation.',
      test:'Test build: official Android Direct status does not apply.',
      untrusted:'This APK is not signed with the official Android Direct identity.',
      official:'Open official release',installed:'Installed',
      latest:'Latest'
    };
  };
  const allowedReleaseUrl=raw=>{
    const url=String(raw||'');
    return /^https:\/\/github\.com\/michels-lab\/michel-s-life-releases\/releases\/tag\/v[0-9]+\.[0-9]+\.[0-9]+$/.test(url)?url:'';
  };
  function renderDirectUpdater(){
    const pane=q('#tab-settings [data-v30171-pane="about"]');
    if(!pane)return;
    // Canonical About uses an inner author/studio layout with its own
    // child-visibility rules. Add our action to that visible About content,
    // not as an unrelated direct sibling of its protected sections.
    const host=q('[data-mlv-about-core]',pane)||pane;
    let section=q('#mlv-android-direct-updater',pane);
    if(!section){
      section=document.createElement('section');
      section.id='mlv-android-direct-updater';
      section.setAttribute('aria-label','Android release verification');
      section.style.cssText='margin:16px 0;padding:16px;border:1px solid var(--ui-border,rgba(160,170,200,.3));border-radius:14px;background:var(--ui-card,rgba(28,30,42,.6));color:inherit;max-width:100%;box-sizing:border-box';
      const heading=document.createElement('h3');
      heading.dataset.mlvUpdateTitle='1';
      heading.style.cssText='margin:0 0 10px;font-size:1rem';
      const button=document.createElement('button');
      button.type='button';
      button.id='mlv-android-check-updates';
      button.style.cssText='min-height:44px;min-width:175px;max-width:100%;padding:9px 14px;border-radius:10px;cursor:pointer';
      const status=document.createElement('p');
      status.id='mlv-android-update-result';
      status.setAttribute('role','status');
      status.setAttribute('aria-live','polite');
      status.setAttribute('aria-atomic','true');
      status.style.cssText='margin:12px 0 0;overflow-wrap:anywhere;line-height:1.5';
      const link=document.createElement('a');
      link.id='mlv-android-update-official-link';
      link.rel='noopener noreferrer';
      // The native WebView forbids pop-up windows; same-frame navigation is
      // intercepted by MainActivity and opened with external ACTION_VIEW.
      link.target='_self';
      link.hidden=true;
      link.style.cssText='display:inline-block;margin-top:8px;text-decoration:underline';
      section.append(heading,button,status,link);
      host.appendChild(section);
      // Do not bind this directly to a canonical About DOM node: Settings
      // redraws and UI adapters may clone/replace that node after a check.
      // One delegated listener below survives those rerenders.
    }
    const t=updaterLabels(), button=q('#mlv-android-check-updates',section);
    const title=q('[data-mlv-update-title]',section);
    if(title.textContent!==t.title)title.textContent=t.title;
    button.disabled=!!directUpdater.pending;
    const buttonLabel=directUpdater.pending?t.checking:t.check;
    if(button.textContent!==buttonLabel)button.textContent=buttonLabel;
    const status=q('#mlv-android-update-result',section);
    const link=q('#mlv-android-update-official-link',section);
    const data=directUpdater.last;
    if(!data){
      if(status.textContent!==t.initial)status.textContent=t.initial;
      if(!link.hidden||link.hasAttribute('href')){
        link.hidden=true;link.style.display='none';link.removeAttribute('href');
        link.textContent='';
      }
      return;
    }
    const state=String(data.status||'unchecked');
    const byState={
      update_available:t.available,up_to_date:t.current,
      ahead_of_public_release:t.ahead,unchecked:t.unchecked
    };
    let message=byState[state]||t.unchecked;
    let validatedUrl='';
    if(state==='unchecked'){
      if(data.channel==='google-play')message=t.play;
      else if(data.channel==='test')message=t.test;
      else if(data.channel==='untrusted')message=t.untrusted;
    }
    if(['update_available','up_to_date','ahead_of_public_release'].includes(state)&&
       data.updateCheckPerformed===true){
      const installed=/^\d+\.\d+\.\d+$/.test(String(data.version||''))?
        String(data.version):'';
      const latest=/^\d+\.\d+\.\d+$/.test(String(data.latestVersion||''))?
        String(data.latestVersion):'';
      if(installed&&latest)message+=' · '+t.installed+': '+installed+
        ' · '+t.latest+': '+latest;
      const url=allowedReleaseUrl(data.releasePageUrl);
      if(url)validatedUrl=url;
    }
    if(status.textContent!==message)status.textContent=message;
    if(validatedUrl){
      if(link.getAttribute('href')!==validatedUrl)link.href=validatedUrl;
      if(link.textContent!==t.official)link.textContent=t.official;
      if(link.hidden){link.hidden=false;link.style.display='inline-block';}
    }else if(!link.hidden||link.hasAttribute('href')){
      link.hidden=true;link.style.display='none';link.removeAttribute('href');
      link.textContent='';
    }
  }
  function finishDirectUpdater(requestId,data){
    if(!directUpdater.pending||directUpdater.pending!==requestId)return;
    if(directUpdater.timeout)clearTimeout(directUpdater.timeout);
    directUpdater.timeout=null;directUpdater.pending=null;
    directUpdater.last=(data&&typeof data==='object')?data:{status:'unchecked'};
    renderDirectUpdater();
  }
  function checkDirectUpdater(){
    if(directUpdater.pending)return;
    // Browser fixtures and unsupported native shells must never silently
    // manufacture an up-to-date result.
    if(typeof window.MichelsLifeAndroid?.postMessage!=='function'){
      directUpdater.last={status:'unchecked'};renderDirectUpdater();return;
    }
    const requestId='mlv-direct-updates-'+(++directUpdater.next)+'-'+Date.now();
    directUpdater.pending=requestId;directUpdater.last=null;
    renderDirectUpdater();
    directUpdater.timeout=setTimeout(()=>finishDirectUpdater(requestId,{
      status:'unchecked'
    }),19000);
    try{
      window.chrome.webview.postMessage({
        channel:'michels-life-google-calendar',requestId,
        action:'updateStatus',payload:{}
      });
    }catch(_){finishDirectUpdater(requestId,{status:'unchecked'});}
  }
  // Delegated once per Android document; About/Settings rerenders replace
  // button nodes, so per-element listeners silently die after the first check.
  // Only this exact action is handled, never the host Settings nav.
  window.addEventListener('click',event=>{
    const button=event.target?.closest?.('#mlv-android-check-updates');
    if(!button || button.disabled || !button.closest('#mlv-android-direct-updater'))return;
    checkDirectUpdater();
  },true);

  window.chrome.webview.addEventListener('message',event=>{
    const msg=event?.data;
    if(!msg||msg.channel!=='michels-life-google-calendar-response'||
       typeof msg.requestId!=='string'||msg.requestId!==directUpdater.pending)return;
    finishDirectUpdater(msg.requestId,msg.ok===true?msg.payload:{
      status:'unchecked'
    });
  });

  // Run in <head> before Michel's Life body scripts can sanitize an existing profile as fresh.
  stabilizeAndroidOnboarding();
  function boot(){
    document.documentElement.setAttribute('data-mlv-platform','android');
    stabilizeAndroidOnboarding();
    installPlatformStyles();
    installMobileChrome();
    enforceMobileFlowGeometry();
    installSwipeNavigation();
    observeUi();
    setTimeout(enforceMobileFlowGeometry,0);
    setTimeout(enforceMobileFlowGeometry,120);
    setTimeout(enforceMobileFlowGeometry,650);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
