(function(){
  'use strict';
  if(window.__MICHELSLIFE_ANDROID_BRIDGE__) return;
  window.__MICHELSLIFE_ANDROID_BRIDGE__='0.1.0';
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

  document.addEventListener('DOMContentLoaded',()=>{
    document.documentElement.setAttribute('data-mlv-platform','android');
    const style=document.createElement('style');
    style.id='mlv-android-platform-style';
    style.textContent=[
      '[data-mlv202-action="install-online"],[data-mlv202-action="install-local"],[data-mlv202-action="choose-local"]{display:none!important}',
      '@media(max-width:760px){body{overscroll-behavior-y:none}.app-shell{min-width:0!important}.content,.layout,#main{min-width:0!important;max-width:100%!important}}'
    ].join('');
    document.head.appendChild(style);
  },{once:true});
})();
