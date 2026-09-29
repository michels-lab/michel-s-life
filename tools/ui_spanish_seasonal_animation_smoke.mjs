import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
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
  await page.waitForFunction(()=>window.MichelsLifeI18n&&window.SeasonalMonthV30146&&document.getElementById('v30146Canvas'),null,{timeout:60000});
  await page.evaluate(()=>window.MichelsLifeI18n.setLanguage('es',{userInitiated:true}));
  await page.waitForTimeout(500);

  const first=await page.evaluate(()=>{
    const canvas=document.getElementById('v30146Canvas');
    window.__mlvSeasonCanvasRef=canvas;
    return {
      frame:Number(canvas?.dataset?.frame||0),
      width:canvas?.width||0,
      height:canvas?.height||0,
      month:document.querySelector('.v30146-month-name')?.textContent?.trim()||'',
      season:document.querySelector('.v30146-season')?.textContent?.trim()||'',
      note:document.querySelector('.v30146-note')?.textContent?.trim()||''
    };
  });
  ok(first.frame>0,'Seasonal canvas never started: '+JSON.stringify(first));
  ok(first.width>0&&first.height>0,'Seasonal canvas has invalid size: '+JSON.stringify(first));

  const samples=[];
  for(let i=0;i<8;i++){
    await page.waitForTimeout(250);
    samples.push(await page.evaluate(()=>{
      const canvas=document.getElementById('v30146Canvas');
      return {
        frame:Number(canvas?.dataset?.frame||0),
        same:canvas===window.__mlvSeasonCanvasRef,
        width:canvas?.width||0,
        height:canvas?.height||0
      };
    }));
  }

  ok(samples.every(x=>x.same),'Spanish localization rebuilt/replaced the seasonal canvas: '+JSON.stringify(samples));
  for(let i=1;i<samples.length;i++){
    ok(samples[i].frame>samples[i-1].frame,
      'Seasonal animation stalled between samples '+(i-1)+' and '+i+': '+JSON.stringify(samples));
  }
  ok(samples.at(-1).frame-first.frame>=20,
    'Seasonal animation advanced too few frames in Spanish: '+JSON.stringify({first,samples}));

  const last=await page.evaluate(()=>({
    language:window.MichelsLifeI18n.language,
    month:document.querySelector('.v30146-month-name')?.textContent?.trim()||'',
    season:document.querySelector('.v30146-season')?.textContent?.trim()||'',
    note:document.querySelector('.v30146-note')?.textContent?.trim()||''
  }));
  ok(last.language==='es','Language changed during seasonal animation test: '+JSON.stringify(last));
  ok(last.month&&last.season&&last.note,'Seasonal Spanish copy missing: '+JSON.stringify(last));

  console.log('OK: Spanish seasonal banner keeps the same canvas and advances continuously',JSON.stringify({first,lastFrame:samples.at(-1).frame,last}));
} finally {
  await browser.close();
}
