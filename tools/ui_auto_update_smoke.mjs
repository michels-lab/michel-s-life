import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await page.addInitScript(()=>{
    try{
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','es');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','es');
      localStorage.setItem('michelsLife.language.installDefault.v1','es');
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='es';
    window.__mlvUpdateBridgeRequests=[];
    window.__mlvUpdateBridgeListeners=[];
    window.chrome=window.chrome||{};
    window.chrome.webview={
      addEventListener(type,fn){
        if(type==='message')window.__mlvUpdateBridgeListeners.push(fn);
      },
      postMessage(message){
        window.__mlvUpdateBridgeRequests.push(message);
        if(message?.action!=='updateStatus')return;
        const payload={
          currentVersion:'3.0.215',
          onlineChannelConfigured:true,
          onlineStatus:'Connected',
          onlineAvailable:true,
          onlineVersion:'3.0.216',
          onlineDownloadUrl:'https://example.invalid/MichelsLife-v3.0.216.exe',
          onlineChecksumUrl:'https://example.invalid/MichelsLife-v3.0.216.exe.sha256',
          onlineReleaseNotes:'Automatic update smoke test',
          candidatePath:'',
          candidateVersion:''
        };
        setTimeout(()=>{
          for(const fn of window.__mlvUpdateBridgeListeners){
            fn({data:{
              channel:'michels-life-google-calendar-response',
              requestId:message.requestId,
              ok:true,
              payload
            }});
          }
        },30);
      }
    };
  });

  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.MLV202ReleaseReadiness&&window.MichelsLifeI18n,null,{timeout:60000});
  await page.evaluate(()=>{
    window.MichelsLifeI18n.setLanguage('es',{userInitiated:true});
    window.__mlvAutomaticUpdateNotices=[];
    const api=window.MLV197Reliability;
    if(api?.notification&&!api.notification.__mlv216Wrapped){
      const original=api.notification.bind(api);
      const wrapped=(title,message,options)=>{
        window.__mlvAutomaticUpdateNotices.push({title:String(title||''),message:String(message||''),options:options||{}});
        return original(title,message,options);
      };
      wrapped.__mlv216Wrapped=true;
      api.notification=wrapped;
    }else{
      const originalToast=window.toast;
      window.toast=(title,message,...rest)=>{
        window.__mlvAutomaticUpdateNotices.push({title:String(title||''),message:String(message||'')});
        return originalToast?.(title,message,...rest);
      };
    }
  });

  await page.waitForFunction(
    ()=>window.__mlvUpdateBridgeRequests.some(x=>x?.action==='updateStatus'),
    null,
    {timeout:10000}
  );
  await page.waitForFunction(
    ()=>window.__mlvAutomaticUpdateNotices.some(x=>/Actualización disponible/i.test(x.title)),
    null,
    {timeout:10000}
  );

  const first=await page.evaluate(()=>({
    requests:window.__mlvUpdateBridgeRequests.filter(x=>x?.action==='updateStatus').length,
    notices:window.__mlvAutomaticUpdateNotices.filter(x=>/Actualización disponible/i.test(x.title)),
    api:typeof window.MLV202ReleaseReadiness?.automaticUpdateCheck,
    translatedNote:window.MichelsLifeI18n.mapText('Michel’s Life checks the public release channel automatically when the desktop app starts and every six hours while it stays open. Updates are never installed without your approval. Online builds must include a matching SHA-256 checksum, and a restore point is created before replacement.')
  }));
  ok(first.requests>=1,'Michel’s Life did not request updateStatus automatically at startup: '+JSON.stringify(first));
  ok(first.notices.length===1,'Expected exactly one automatic update notice after startup: '+JSON.stringify(first));
  ok(/v3\.0\.216/.test(first.notices[0].message),'Automatic update notice did not identify the available version: '+JSON.stringify(first));
  ok(/Configuración/.test(first.notices[0].message),'Spanish automatic update notice was not rendered in Spanish: '+JSON.stringify(first));
  ok(first.api==='function','automaticUpdateCheck API is not exposed');
  ok(/revisa automáticamente el canal público de actualizaciones/i.test(first.translatedNote),'Automatic update Settings note is not translated: '+JSON.stringify(first));

  await page.evaluate(()=>window.MLV202ReleaseReadiness.automaticUpdateCheck(true));
  await page.waitForTimeout(250);
  const second=await page.evaluate(()=>({
    requests:window.__mlvUpdateBridgeRequests.filter(x=>x?.action==='updateStatus').length,
    notices:window.__mlvAutomaticUpdateNotices.filter(x=>/Actualización disponible/i.test(x.title)).length
  }));
  ok(second.requests>=2,'Forced automatic recheck did not call updateStatus again: '+JSON.stringify(second));
  ok(second.notices===1,'The same available version produced duplicate notices in one app session: '+JSON.stringify(second));

  console.log('OK: automatic desktop update detection checks the online channel, notifies in Spanish, and deduplicates the same release',JSON.stringify({first,second}));
} finally {
  await browser.close();
}
