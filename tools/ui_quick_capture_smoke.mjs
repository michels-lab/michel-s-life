import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}
function todayKey(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await page.addInitScript(()=>{
    try{localStorage.setItem('michelsLife.onboarding.v30200','done')}catch(_){}
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.MLV216QuickCapture&&typeof state!=='undefined'&&window.JournalV30189,null,{timeout:60000});

  // User-reported dead + tile: exercise an actual pointer gesture and the
  // real canonical mission form. No force click, API call or DOM shortcut.
  await page.locator('#v30106QuickFab').waitFor({state:'visible',timeout:12000});
  const beforeDock=await page.evaluate(()=>state.missions.length);
  await page.locator('#v30106QuickFab').click();
  await page.locator('#v30106QuickForm').waitFor({state:'visible',timeout:8000});
  ok(await page.locator('#v30106QuickForm h2').count()===0||
    await page.locator('#v30106QuickForm input[name="text"]').count()===1,
    'Quick Mission did not mount a usable editor');
  await page.locator('#v30106QuickForm input[name="text"]').fill('Dock Quick Mission smoke');
  await page.locator('#v30106QuickForm button[type="submit"]').click();
  await page.waitForFunction(()=>state.missions.some(m=>m.name==='Dock Quick Mission smoke'),
    null,{timeout:8000});
  await page.waitForTimeout(250);
  const dock=await page.evaluate(()=>({
    count:state.missions.filter(m=>m.name==='Dock Quick Mission smoke').length,
    total:state.missions.length,
    dialogOpen:!!document.querySelector('#v30106QuickForm')
  }));
  ok(dock.count===1&&dock.total===beforeDock+1&&!dock.dialogOpen,
    'Floating Quick Mission created duplicates, failed to save or left a ghost form: '+JSON.stringify(dock));

  // Regression: user-facing Quick Mission title and editor must be complete
  // Spanish sentences, not the old mixed "Quick misión · Add a misión for hoy".
  await page.evaluate(()=>window.MichelsLifeI18n?.setLanguage?.('es',{userInitiated:true}));
  await page.waitForFunction(()=>
    document.getElementById('v30106QuickFab')?.title==='Misión rápida · Agrega una misión para hoy',
    null,{timeout:9000});
  await page.locator('#v30106QuickFab').click();
  await page.locator('#v30106QuickForm').waitFor({state:'visible',timeout:9000});
  await page.waitForFunction(()=>{
    const head=document.querySelector('#modalRoot .modal-head h2')?.textContent||'';
    const desc=document.querySelector('#modalRoot .modal-head p')?.textContent||'';
    return head.trim()==='Misión rápida'&&
      desc.includes('Agrega una misión para hoy sin interrumpir lo que estás haciendo.');
  },null,{timeout:9000});
  await page.locator('#modalRoot .modal-head [data-action="close-modal"]').click();
  await page.locator('#v30106QuickForm').waitFor({state:'detached',timeout:9000});
  await page.evaluate(()=>window.MichelsLifeI18n?.setLanguage?.('en',{userInitiated:true}));

  const before=await page.evaluate(k=>({
    missions:Array.isArray(state?.missions)?state.missions.length:0,
    journal:window.JournalV30189?.entry?.(k)?.body||''
  }),todayKey());

  await page.keyboard.press('Control+Shift+Space');
  await page.waitForSelector('[data-mlv216-qc]:not([hidden])',{timeout:5000});
  await page.fill('[data-mlv216-qc-input]','Quick capture smoke mission');
  await page.selectOption('[data-mlv216-qc-category]','academic');
  await page.click('[data-mlv216-qc-save]');
  await page.waitForFunction(()=>document.querySelector('[data-mlv216-qc]')?.hidden===true);

  const mission=await page.evaluate(()=>state.missions.find(x=>x?.name==='Quick capture smoke mission'));
  ok(!!mission,'Quick Capture did not create a mission');
  ok(mission.category==='academic','Quick Capture mission category was not preserved: '+JSON.stringify(mission));

  await page.evaluate(()=>window.MLV216QuickCapture.open());
  await page.waitForSelector('[data-mlv216-qc]:not([hidden])');
  await page.selectOption('[data-mlv216-qc-type]','journal');
  await page.fill('[data-mlv216-qc-input]','Quick capture journal smoke note');
  await page.click('[data-mlv216-qc-save]');
  await page.waitForFunction(()=>document.querySelector('[data-mlv216-qc]')?.hidden===true);

  const after=await page.evaluate(k=>({
    missions:Array.isArray(state?.missions)?state.missions.length:0,
    journal:window.JournalV30189?.entry?.(k)?.body||''
  }),todayKey());
  ok(after.missions===before.missions+1,'Quick Capture mission count did not increase exactly once: '+JSON.stringify({before,after}));
  ok(after.journal.includes('Quick capture journal smoke note'),'Quick Capture did not append the journal note: '+JSON.stringify(after));

  await page.evaluate(()=>window.MichelsLifeI18n?.setLanguage?.('es',{userInitiated:true}));
  await page.evaluate(()=>window.MLV216QuickCapture.open());
  await page.waitForSelector('[data-mlv216-qc]:not([hidden])');
  const spanish=await page.$eval('.mlv216-qc-head h2',el=>(el.textContent||'').trim());
  ok(spanish==='Captura rápida','Quick Capture did not rerender in Spanish: '+JSON.stringify({spanish}));

  console.log('OK: Quick Capture hotkey creates categorized missions, appends Journal notes, closes cleanly, and follows UI language',JSON.stringify({before,after,missionCategory:mission.category,spanish}));
} finally {
  await browser.close();
}
