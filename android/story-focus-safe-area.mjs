/* Isolated Android Story + running Focus safe-area candidate. Not part of a published APK. */
const SPACE=18,MIN_PAD=110,MAX_PAD=400;
export function calculateStoryClearance({viewportHeight,miniTop,miniVisible,navTop,navVisible}){
 if(!Number.isFinite(viewportHeight)||viewportHeight<=0)return MIN_PAD;
 const floor=[miniVisible?miniTop:Infinity,navVisible?navTop:Infinity]
  .filter(v=>Number.isFinite(v)&&v>0).reduce((a,b)=>Math.min(a,b),viewportHeight);
 return Math.round(Math.max(MIN_PAD,Math.min(MAX_PAD,Math.max(0,viewportHeight-floor)+SPACE+46)));
}
export function visibleViewportBounds({innerHeight,offsetTop=0,height}){
 const top=Number.isFinite(offsetTop)?Math.max(0,offsetTop):0;
 const fallback=Number.isFinite(innerHeight)&&innerHeight>0?innerHeight:0;
 const extent=Number.isFinite(height)&&height>0?height:fallback;
 return {top,bottom:Math.min(fallback||top+extent,top+extent)};
}
export function calculateScrollCorrection({buttonTop,buttonBottom,availableTop,availableBottom}){
 if(![buttonTop,buttonBottom,availableTop,availableBottom].every(Number.isFinite)||
    buttonBottom<buttonTop||availableBottom<=availableTop)return 0;
 if(buttonBottom-buttonTop>availableBottom-availableTop-20)return 0;
 if(buttonBottom>availableBottom-SPACE)return Math.ceil(buttonBottom-(availableBottom-SPACE));
 if(buttonTop<availableTop+SPACE)return -Math.ceil((availableTop+SPACE)-buttonTop);
 return 0;
}
export function installStoryFocusSafeArea(win=window){
 const doc=win.document;
 if(!doc||doc.getElementById('mlv-story-focus-clearance-css'))return {installed:false};
 const style=doc.createElement('style');style.id='mlv-story-focus-clearance-css';
 style.textContent=[
  'html[data-mlv-platform="android"] body.mlv-story-focus-clearance #tab-story.active {padding-bottom:var(--mlv-story-focus-clearance,210px)!important}',
  'html[data-mlv-platform="android"] body.mlv-story-focus-clearance #main {scroll-padding-bottom:var(--mlv-story-focus-clearance,210px)!important}',
  'html[data-mlv-platform="android"] body.mlv-story-focus-clearance #tab-story.active .v30162-story-form button[type="submit"] {scroll-margin-bottom:var(--mlv-story-focus-clearance,210px)!important}'
 ].join('\n');doc.head.append(style);
 let scheduled=false,disposed=false;
 const viewport=()=>visibleViewportBounds({
  innerHeight:win.innerHeight,offsetTop:win.visualViewport?.offsetTop,
  height:win.visualViewport?.height
 });
 const visible=el=>{
  if(!el||el.hidden)return false;
  const c=win.getComputedStyle(el);
  return c.display!=='none'&&c.visibility!=='hidden'&&el.getClientRects().length>0;
 };
 const bounds=id=>{const el=doc.getElementById(id);return{visible:visible(el),rect:el?.getBoundingClientRect()};};
 const scrollParent=btn=>{
  let el=btn.parentElement;
  while(el&&el!==doc.body&&el!==doc.documentElement){
   const c=win.getComputedStyle(el);
   if(/auto|scroll/.test(c.overflowY)&&el.scrollHeight>el.clientHeight+3)return el;
   el=el.parentElement;
  }
  return doc.scrollingElement||doc.documentElement;
 };
 function refresh(){
  scheduled=false;if(disposed)return null;
  const active=!!doc.querySelector('#tab-story.active .v30162-story-form');
  const mini=bounds('mlv-android-mini-focus'),nav=bounds('mlv-android-bottom-nav');
  const bounds=viewport();
  const clearance=calculateStoryClearance({viewportHeight:bounds.bottom,miniTop:mini.rect?.top,
    miniVisible:mini.visible,navTop:nav.rect?.top,navVisible:nav.visible});
  const enable=active&&mini.visible;
  if(doc.body.classList.contains('mlv-story-focus-clearance')!==enable)
   doc.body.classList.toggle('mlv-story-focus-clearance',enable);
  if(doc.body.style.getPropertyValue('--mlv-story-focus-clearance')!==clearance+'px')
   doc.body.style.setProperty('--mlv-story-focus-clearance',clearance+'px');
  return {active,mini,nav,clearance};
 }
 function schedule(){if(!disposed&&!scheduled){scheduled=true;win.requestAnimationFrame(refresh);}}
 function ensureSaveVisible(){
  const state=refresh();if(!state?.active||!state.mini.visible)return false;
  const btn=doc.querySelector('#tab-story.active .v30162-story-form button[type="submit"]');
  if(!btn)return false;
  const topbar=bounds('mlv-android-topbar'),rect=btn.getBoundingClientRect();
  const view=viewport();
  const delta=calculateScrollCorrection({
    buttonTop:rect.top,buttonBottom:rect.bottom,
    availableTop:Math.max(view.top,topbar.visible?topbar.rect.bottom:view.top),
    availableBottom:Math.min(view.bottom,
     state.mini.visible?state.mini.rect.top:view.bottom,
     state.nav.visible?state.nav.rect.top:view.bottom)
  });
  if(!delta)return true;
  const scroller=scrollParent(btn);
  if(typeof scroller.scrollBy==='function')scroller.scrollBy({top:delta,behavior:'instant'});
  else scroller.scrollTop+=delta;
  return true;
 }
 function onBlur(event){
  if(!event.target?.matches?.('#tab-story.active .v30162-story-form input, #tab-story.active .v30162-story-form textarea, #tab-story.active .v30162-story-form select'))return;
  win.requestAnimationFrame(()=>win.requestAnimationFrame(ensureSaveVisible));
 }
 const observer=typeof win.MutationObserver==='function'?new win.MutationObserver(schedule):null;
 observer?.observe(doc.body,{attributes:true,subtree:true,attributeFilter:['class','hidden','style','aria-hidden']});
 win.addEventListener('resize',schedule,{passive:true});
 win.visualViewport?.addEventListener?.('resize',schedule,{passive:true});
 win.visualViewport?.addEventListener?.('scroll',schedule,{passive:true});
 doc.addEventListener('focusout',onBlur,true);
 refresh();
 return {installed:true,refresh,ensureSaveVisible,dispose(){
  disposed=true;observer?.disconnect();win.removeEventListener('resize',schedule);
  win.visualViewport?.removeEventListener?.('resize',schedule);
  win.visualViewport?.removeEventListener?.('scroll',schedule);
  doc.removeEventListener('focusout',onBlur,true);
  doc.body.classList.remove('mlv-story-focus-clearance');
  doc.body.style.removeProperty('--mlv-story-focus-clearance');style.remove();
 }};
}
if(typeof window!=='undefined'&&window.document&&!window.__mlvStoryFocusClearance)
 window.__mlvStoryFocusClearance=installStoryFocusSafeArea(window);
