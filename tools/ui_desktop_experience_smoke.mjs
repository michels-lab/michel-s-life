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
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.MLV216DesktopExperience&&window.MLV216CommandPalette&&window.MLV216SyncCenter,null,{timeout:60000});
  await page.evaluate(()=>window.MichelsLifeI18n?.setLanguage?.('es',{userInitiated:true}));

  const startup=await page.evaluate(()=>window.MLV216DesktopExperience.startup);
  ok(Number.isFinite(startup.criticalReadyAt),'Progressive startup did not record critical-ready timing');
  ok(Number.isFinite(startup.idleScheduledAt),'Progressive startup did not schedule deferred work');

  await page.keyboard.press('Control+K');
  await page.waitForFunction(()=>document.getElementById('mlv216CommandPalette')&&!document.getElementById('mlv216CommandPalette').hidden);
  const palette=await page.evaluate(()=>({
    placeholder:document.querySelector('#mlv216CommandPalette input')?.placeholder||'',
    text:document.querySelector('#mlv216CommandPalette')?.innerText||'',
    count:document.querySelectorAll('#mlv216CommandPalette [data-mlv216-command]').length
  }));
  ok(/Busca una acción/i.test(palette.placeholder),'Command Palette did not use Spanish copy: '+JSON.stringify(palette));
  ok(/Centro de sincronización/i.test(palette.text),'Command Palette is missing Sync Center');
  ok(/Buscar actualizaciones/i.test(palette.text),'Command Palette is missing update command');
  ok(palette.count>=12,'Command Palette has too few global commands: '+JSON.stringify(palette));

  await page.fill('#mlv216CommandPalette input','sincron');
  await page.waitForTimeout(80);
  const filtered=await page.evaluate(()=>({
    count:document.querySelectorAll('#mlv216CommandPalette [data-mlv216-command]').length,
    text:document.querySelector('#mlv216CommandPalette .mlv216-command-list')?.innerText||''
  }));
  ok(filtered.count>=2&&/Sincronizar ahora/i.test(filtered.text),'Command search did not find sync actions: '+JSON.stringify(filtered));

  await page.keyboard.press('ArrowDown');
  const activeCount=await page.locator('#mlv216CommandPalette .mlv216-command-item.active').count();
  ok(activeCount===1,'Arrow navigation did not keep exactly one selected command');
  await page.keyboard.press('Escape');
  ok(await page.locator('#mlv216CommandPalette').evaluate(el=>el.hidden),'Escape did not close Command Palette');

  await page.evaluate(()=>window.MLV216SyncCenter.open());
  await page.waitForFunction(()=>document.getElementById('mlv216SyncCenter')&&!document.getElementById('mlv216SyncCenter').hidden);
  const sync=await page.evaluate(()=>({
    text:document.getElementById('mlv216SyncCenter')?.innerText||'',
    buttons:[...document.querySelectorAll('#mlv216SyncCenter button')].map(x=>x.textContent.trim())
  }));
  ok(/Centro de sincronización/i.test(sync.text),'Sync Center did not render in Spanish: '+JSON.stringify(sync));
  ok(/Último sync/i.test(sync.text),'Sync Center is missing last-sync status');
  ok(sync.buttons.some(x=>/Sincronizar ahora/i.test(x)),'Sync Center is missing Sync Now action');
  ok(sync.buttons.some(x=>/Abrir Google/i.test(x)),'Sync Center is missing Google Settings action');
  await page.keyboard.press('Escape');
  ok(await page.locator('#mlv216SyncCenter').evaluate(el=>el.hidden),'Escape did not close Sync Center');

  const api=await page.evaluate(()=>({
    command:typeof window.MLV216CommandPalette?.open,
    sync:typeof window.MLV216SyncCenter?.open,
    experience:typeof window.MLV216DesktopExperience?.openCommand
  }));
  ok(api.command==='function'&&api.sync==='function'&&api.experience==='function','Desktop experience APIs are incomplete: '+JSON.stringify(api));

  console.log('OK: desktop Command Palette + Sync Center + progressive-startup surface',JSON.stringify({startup,paletteCount:palette.count,filtered:filtered.count}));
} finally {
  await browser.close();
}
