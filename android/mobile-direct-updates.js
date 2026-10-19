/* Android-only Direct/Play updater surface. Never install or sideload silently. */
(()=>{
 'use strict';
 if(window.MichelsLifeAndroidUpdates)return;
 const CHANNEL='michels-life-google-calendar',RESPONSE='michels-life-google-calendar-response';
 const RELEASE_PREFIX='https://github.com/michels-lab/michel-s-life-releases/releases/tag/';
 let count=0,busy=false,listener=null,timeout=null;
 const validUrl=value=>typeof value==='string'&&
   /^https:\/\/github\.com\/michels-lab\/michel-s-life-releases\/releases\/tag\/v[0-9]+\.[0-9]+\.[0-9]+$/.test(value);
 function mount(){
  if(document.documentElement.dataset.mlvPlatform!=='android')return;
  const tab=document.getElementById('tab-settings');
  if(!tab)return;
  let el=tab.querySelector('#mlv-android-direct-updates');
  if(el)return;
  const parent=tab.querySelector('.v30171-settings-content')||tab;
  el=document.createElement('section');el.id='mlv-android-direct-updates';
  el.style.cssText='margin:12px 0 110px;padding:15px;border-radius:17px;border:1px solid rgba(127,195,226,.4);background:rgba(var(--ui-panel-rgb,8,16,28),.94);display:grid;gap:10px;min-width:0';
  const title=document.createElement('h3');title.textContent='Android updates';title.style.cssText='margin:0;font-size:17px';el.appendChild(title);
  const help=document.createElement('p');help.textContent='Check the official Michel’s Life release. Installing an Android APK always requires your approval. The Developer Edition and Google Play use separate update channels.';help.style.cssText='margin:0;font-size:12px;opacity:.8;line-height:1.5';el.appendChild(help);
  const action=document.createElement('button');action.type='button';action.textContent='Check Android updates';action.style.cssText='min-height:48px;min-width:0;border-radius:12px;padding:10px 14px;background:rgba(var(--ui-accent-rgb,117,228,255),.18);color:inherit;border:1px solid currentColor;touch-action:manipulation';
  const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.textContent='Not checked on this device yet.';status.style.cssText='margin:0;font-size:12px;line-height:1.5;white-space:pre-wrap';
  const link=document.createElement('a');link.textContent='Open official release page';link.target='_blank';link.rel='noopener noreferrer';link.hidden=true;link.style.cssText='display:inline-flex;align-items:center;min-height:48px;padding:9px 12px;border:1px solid rgba(var(--ui-accent-rgb,117,228,255),.5);border-radius:12px;color:inherit;text-decoration:underline';
  el.append(action,status,link);parent.appendChild(el);
  action.addEventListener('click',()=>check(action,status,link));
 }
 function check(button,status,link){
   if(busy)return;
   const bridge=window.chrome?.webview;
   if(typeof bridge?.postMessage!=='function'||typeof bridge?.addEventListener!=='function'){
     status.textContent='Android update service is unavailable on this build.';return;
   }
   busy=true;button.disabled=true;button.textContent='Checking official release…';
   link.hidden=true;link.removeAttribute('href');
   const id='android-direct-update-'+(++count)+'-'+Date.now();
   const reset=()=>{
     busy=false;button.disabled=false;button.textContent='Check Android updates';
     if(listener){bridge.removeEventListener('message',listener);listener=null;}
     if(timeout){clearTimeout(timeout);timeout=null;}
   };
   listener=event=>{
     const data=event?.data;
     if(data?.channel!==RESPONSE||data.requestId!==id)return;
     reset();
     if(!data.ok){status.textContent='Update check failed: '+String(data.error||'unavailable').slice(0,180);return;}
     const result=data.payload||{};
     status.textContent=String(result.status||'No verified update result was returned.').slice(0,350);
     if(result.checkedOfficialRelease===true&&validUrl(result.releasePage)){
       link.href=result.releasePage;
       link.hidden=false;
       link.textContent=result.updateAvailable===true?'Review newer official Android release':'View current official Android release';
     }
   };
   bridge.addEventListener('message',listener);
   timeout=setTimeout(()=>{
     if(!busy)return;
     reset();status.textContent='Could not contact the Android update service. Please try again.';
   },18000);
   try{bridge.postMessage({channel:CHANNEL,requestId:id,action:'updateStatus',payload:{}});}
   catch(_){reset();status.textContent='Android update bridge is not available.';}
 }
 // Normal app router may replace the Settings subtree, so mount idempotently
 // after an Android route completes. No full-document polling or mutation scan.
 window.MichelsLifeAndroidUpdates={mount};
 document.addEventListener('DOMContentLoaded',mount,{once:true});
})();
