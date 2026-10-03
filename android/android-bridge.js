(function(){
  'use strict';
  if(window.__MICHELSLIFE_ANDROID_BRIDGE__) return;
  window.__MICHELSLIFE_ANDROID_BRIDGE__='0.2.0';
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

  const MOBILE_BREAKPOINT=760;
  const MAJOR_TABS=['dashboard','missions','contracts','journal','stats','achievements','calendar','settings'];
  const isMobile=()=>window.matchMedia('(max-width:'+MOBILE_BREAKPOINT+'px)').matches;
  const q=(selector,root=document)=>root.querySelector(selector);
  const qa=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const visible=el=>!!(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none');
  const escSelector=value=>String(value).replace(/(["\\])/g,'\\$1');

  function setDrawer(open){
    document.body.classList.toggle('mlv-android-nav-open',!!open);
    const button=q('#mlv-android-menu-button');
    if(button)button.setAttribute('aria-expanded',open?'true':'false');
  }

  function activeTabId(){
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
    title.textContent=displayLabelForTab(activeTabId()||'dashboard');
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

  function clickTab(id){
    if(!id)return false;
    const target=q('#v30171PrimaryNav [data-tab="'+escSelector(id)+'"]')||q('#side [data-tab="'+escSelector(id)+'"]')||q('[data-tab="'+escSelector(id)+'"]');
    const router=window.LeftNavV30171;
    try{
      if(router&&typeof router.route==='function'){
        router.route(id);
        setDrawer(false);
        setTimeout(updateTopbarTitle,0);
        const debug=window.__mlvAndroidGestureDebug;
        if(debug){
          debug.router='LeftNavV30171.route';
          debug.requestedTab=id;
          debug.activeImmediately=activeTabId();
          setTimeout(()=>{debug.activeAfter120=activeTabId();},120);
          setTimeout(()=>{debug.activeAfter500=activeTabId();},500);
        }
        return true;
      }
    }catch(error){
      console.warn('Michel\'s Life Android route fallback',error);
    }
    if(!target)return false;
    target.click();
    setDrawer(false);
    setTimeout(updateTopbarTitle,0);
    const debug=window.__mlvAndroidGestureDebug;
    if(debug){
      debug.router='button.click';
      debug.requestedTab=id;
      debug.activeImmediately=activeTabId();
      setTimeout(()=>{debug.activeAfter120=activeTabId();},120);
      setTimeout(()=>{debug.activeAfter500=activeTabId();},500);
    }
    return true;
  }

  function navigateSwipe(direction){
    const tabs=availableMajorTabs();
    if(tabs.length<2)return false;
    const current=activeTabId();
    let index=tabs.indexOf(current);
    if(index<0)index=0;
    const next=index+(direction==='next'?1:-1);
    if(next<0||next>=tabs.length)return false;
    return clickTab(tabs[next]);
  }

  function enforceMobileFlowGeometry(){
    if(!isMobile())return;
    const app=q('.app');
    if(app){
      app.style.setProperty('padding','0','important');
      app.style.setProperty('margin','0','important');
      app.style.setProperty('width','100%','important');
      app.style.setProperty('max-width','none','important');
    }
    const side=q('#v30171Sidebar');
    if(side){
      side.style.setProperty('position','fixed','important');
      side.style.setProperty('top','calc(var(--mlv-android-topbar-h) + env(safe-area-inset-top,0px))','important');
      side.style.setProperty('left','0','important');
      side.style.setProperty('right','auto','important');
      side.style.setProperty('bottom','0','important');
      side.style.setProperty('width','min(86vw,320px)','important');
      side.style.setProperty('max-width','320px','important');
      side.style.setProperty('height','auto','important');
      side.style.setProperty('max-height','none','important');
      side.style.setProperty('margin','0','important');
    }
    const status=q('#v176StatusPanel');
    if(status){
      status.style.setProperty('position','relative','important');
      status.style.setProperty('top','auto','important');
      status.style.setProperty('max-height','64px','important');
      status.style.setProperty('overflow','hidden','important');
      status.style.setProperty('margin','6px 8px','important');
    }
  }

  function installMobileChrome(){
    if(q('#mlv-android-topbar')){enforceMobileFlowGeometry();return;}
    const topbar=document.createElement('header');
    topbar.id='mlv-android-topbar';
    topbar.setAttribute('aria-label','Android navigation');
    topbar.innerHTML='<button id="mlv-android-menu-button" type="button" aria-label="Open menu" aria-expanded="false">☰</button><div class="mlv-android-topbar-copy"><strong>Michel’s Life</strong><span id="mlv-android-section-title">Today</span></div>';
    const backdrop=document.createElement('button');
    backdrop.id='mlv-android-drawer-backdrop';
    backdrop.type='button';
    backdrop.tabIndex=-1;
    backdrop.setAttribute('aria-label','Close menu');
    document.body.append(topbar,backdrop);
    q('#mlv-android-menu-button')?.addEventListener('click',()=>setDrawer(!document.body.classList.contains('mlv-android-nav-open')));
    backdrop.addEventListener('click',()=>setDrawer(false));
    document.addEventListener('click',event=>{
      if(!isMobile())return;
      const navTarget=event.target.closest('#side [data-tab], #v30171PrimaryNav [data-tab]');
      if(navTarget)setDrawer(false);
      if(event.target.closest('[data-action="close-modal"], .modal-backdrop'))setTimeout(updateTopbarTitle,0);
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
      horizontalScroller=!!target.closest('.v134-ach-filter,.v140-cat-shortcuts,.v140-library-toggle,[data-horizontal-scroll],.tabs');
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
      if(Math.abs(dx)<64||Math.abs(dx)<Math.abs(dy)*1.35||elapsed>650){debug.result='threshold-rejected';return;}
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
        html[data-mlv-platform="android"] body{overscroll-behavior-y:none;padding-top:calc(var(--mlv-android-topbar-h) + env(safe-area-inset-top,0px))!important;touch-action:pan-y!important}
        #main,.layout{touch-action:pan-y!important}
        .v134-ach-filter,.v140-cat-shortcuts,.v140-library-toggle,[data-horizontal-scroll],.tabs{touch-action:pan-x!important}
        #mlv-android-topbar{position:fixed;display:flex;align-items:center;gap:10px;top:0;left:0;right:0;height:calc(var(--mlv-android-topbar-h) + env(safe-area-inset-top,0px));padding:env(safe-area-inset-top,0px) 12px 0;z-index:2147483000;background:rgba(6,9,19,.94);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.1);box-sizing:border-box}
        #mlv-android-menu-button{width:42px;height:42px;min-width:42px;padding:0;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:inherit;font:inherit;font-size:22px;line-height:1;display:grid;place-items:center}
        .mlv-android-topbar-copy{min-width:0;display:flex;flex-direction:column;gap:1px}.mlv-android-topbar-copy strong{font-size:13px;line-height:1.1}.mlv-android-topbar-copy span{font-size:11px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:62vw}
        #mlv-android-drawer-backdrop{display:block;position:fixed;inset:calc(var(--mlv-android-topbar-h) + env(safe-area-inset-top,0px)) 0 0;border:0;padding:0;background:rgba(0,0,0,.48);opacity:0;pointer-events:none;z-index:2147482990;transition:opacity .18s ease}
        body.mlv-android-nav-open #mlv-android-drawer-backdrop{opacity:1;pointer-events:auto}
        .app{max-width:none!important;width:100%!important;margin:0!important;padding:0!important}
        .topbar{display:none!important}
        .app-shell,.layout,.content,#main{min-width:0!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important}
        .app-shell,.layout{grid-template-columns:minmax(0,1fr)!important;display:block!important;margin-top:6px!important}
        #fixedStatusBar,.status-strip{display:none!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
        #v176StatusPanel{position:relative!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;display:block!important;width:calc(100% - 16px)!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:64px!important;margin:6px 8px!important;padding:5px 7px!important;border-radius:14px!important;overflow:hidden!important;contain:layout paint!important;transform:none!important}
        #v176StatusPanel .v176-card{display:none!important}
        #v176StatusPanel .v176-card:first-child{display:flex!important;align-items:center!important;gap:8px!important;width:100%!important;min-width:0!important;min-height:0!important;height:auto!important;margin:0!important;padding:5px 7px!important;border:0!important;border-radius:10px!important;background:transparent!important;box-shadow:none!important;overflow:hidden!important}
        #v176StatusPanel .v176-time{flex:0 0 auto!important;font-size:18px!important;line-height:1!important;letter-spacing:-.03em!important}
        #v176StatusPanel .v176-small{min-width:0!important;margin:0!important;font-size:9px!important;line-height:1.2!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
        #v30171Sidebar{position:fixed!important;top:calc(var(--mlv-android-topbar-h) + env(safe-area-inset-top,0px))!important;left:0!important;bottom:0!important;width:min(86vw,320px)!important;max-width:320px!important;height:auto!important;max-height:none!important;overflow-y:auto!important;transform:translateX(-105%)!important;transition:transform .2s ease!important;z-index:2147482995!important;margin:0!important;padding:10px!important;border-radius:0 18px 18px 0!important;box-shadow:12px 0 35px rgba(0,0,0,.35)!important;overscroll-behavior:contain}
        body.mlv-android-nav-open #v30171Sidebar{transform:translateX(0)!important}
        #v30171Sidebar .v30171-brand{flex-direction:row!important;justify-content:flex-start!important;text-align:left!important;gap:8px!important;padding:5px 4px 9px!important}
        #v30171Sidebar .v30171-brand-mark{width:38px!important;height:38px!important;min-width:38px!important;font-size:20px!important}
        #v30171Sidebar h1.v30171-brand-title{font-size:13px!important;text-align:left!important}
        #v30171PrimaryNav{display:flex!important;flex-direction:column!important;grid-template-columns:none!important;gap:4px!important;padding:2px 0 8px!important}
        #v30171PrimaryNav .v30171-nav-btn{min-height:40px!important;padding:8px 9px!important;gap:8px!important;font-size:12px!important}
        #main,.content{margin:0!important;padding:8px!important}
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
        input,select,textarea,button{max-width:100%;box-sizing:border-box}
      }
      @media(min-width:${MOBILE_BREAKPOINT+1}px){body.mlv-android-nav-open{overflow:auto}}
    `;
    document.head.appendChild(style);
  }

  function observeUi(){
    let queued=false;
    const refresh=()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;enforceMobileFlowGeometry();updateTopbarTitle();});
    };
    new MutationObserver(refresh).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-current']});
    window.addEventListener('michelslife:languagechange',()=>setTimeout(updateTopbarTitle,0));
    window.addEventListener('resize',()=>{if(!isMobile())setDrawer(false);else enforceMobileFlowGeometry();});
  }

  function boot(){
    document.documentElement.setAttribute('data-mlv-platform','android');
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
