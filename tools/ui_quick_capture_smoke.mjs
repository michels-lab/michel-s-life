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
  await page.waitForFunction(()=>window.MLV216QuickCapture&&window.state&&typeof window.makeMission==='function',null,{timeout:60000});

  const before=await page.evaluate(k=>({
    missions:Array.isArray(window.state?.missions)?window.state.missions.length:0,
    journal:window.JournalV30189?.entry?.(k)?.body||''
  }),todayKey());

  await page.keyboard.press('Control+Shift+Space');
  await page.waitForSelector('[data-mlv216-qc]:not([hidden])',{timeout:5000});
  await page.fill('[data-mlv216-qc-input]','Quick capture smoke mission');
  await page.selectOption('[data-mlv216-qc-category]','academic');
  await page.click('[data-mlv216-qc-save]');
  await page.waitForFunction(()=>document.querySelector('[data-mlv216-qc]')?.hidden===true);

  const mission=await page.evaluate(()=>window.state.missions.find(x=>x?.name==='Quick capture smoke mission'));
  ok(!!mission,'Quick Capture did not create a mission');
  ok(mission.category==='academic','Quick Capture mission category was not preserved: '+JSON.stringify(mission));

  await page.evaluate(()=>window.MLV216QuickCapture.open());
  await page.waitForSelector('[data-mlv216-qc]:not([hidden])');
  await page.selectOption('[data-mlv216-qc-type]','journal');
  await page.fill('[data-mlv216-qc-input]','Quick capture journal smoke note');
  await page.click('[data-mlv216-qc-save]');
  await page.waitForFunction(()=>document.querySelector('[data-mlv216-qc]')?.hidden===true);

  const after=await page.evaluate(k=>({
    missions:Array.isArray(window.state?.missions)?window.state.missions.length:0,
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
