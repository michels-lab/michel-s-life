import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

const MONTHS_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_ES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

async function snapshot(page){
  return page.evaluate(()=>{
    const canvas=document.getElementById('v30146Canvas');
    return {
      frame:Number(canvas?.dataset?.frame||0),
      canvasSame:canvas===window.__mlvSeasonCanvasRef,
      width:canvas?.width||0,
      height:canvas?.height||0,
      month:document.querySelector('.v30146-month-name')?.textContent?.trim()||'',
      season:document.querySelector('.v30146-season')?.textContent?.trim()||'',
      note:document.querySelector('.v30146-note')?.textContent?.trim()||'',
      language:window.MichelsLifeI18n?.language||''
    };
  });
}

async function sampleFrames(page,label,durationMs=4200,stepMs=350){
  const samples=[];
  const count=Math.ceil(durationMs/stepMs);
  for(let i=0;i<count;i++){
    await page.waitForTimeout(stepMs);
    samples.push(await snapshot(page));
  }
  ok(samples.length>=2,label+': insufficient samples');
  ok(samples.every(x=>x.canvasSame),label+': localization/render replaced the seasonal canvas: '+JSON.stringify(samples));
  ok(samples.every(x=>x.width>0&&x.height>0),label+': canvas lost its size: '+JSON.stringify(samples));
  for(let i=1;i<samples.length;i++){
    ok(samples[i].frame>samples[i-1].frame,
      label+': animation stalled or reset between samples '+(i-1)+' and '+i+': '+JSON.stringify(samples));
  }
  const gained=samples.at(-1).frame-samples[0].frame;
  ok(gained>=Math.max(20,Math.floor(durationMs/80)),
    label+': animation advanced too few frames: '+JSON.stringify({gained,samples}));
  return samples;
}

function assertCopy(samples,language){
  const monthIndex=new Date().getMonth();
  const expected=language==='es'?MONTHS_ES[monthIndex]:MONTHS_EN[monthIndex];
  for(const x of samples){
    ok(x.language===language,'Unexpected language during animation sampling: '+JSON.stringify(x));
    ok(x.month===expected,'Seasonal month copy changed language or was rewritten unexpectedly: '+JSON.stringify({expected,x}));
    ok(x.season&&x.note,'Seasonal season/note copy disappeared: '+JSON.stringify(x));
  }
}

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
  await page.evaluate(()=>{
    window.MichelsLifeI18n.setLanguage('es',{userInitiated:true});
    window.__mlvSeasonCanvasRef=document.getElementById('v30146Canvas');
  });
  await page.waitForTimeout(700);

  const start=await snapshot(page);
  ok(start.frame>0,'Seasonal canvas never started: '+JSON.stringify(start));
  ok(start.width>0&&start.height>0,'Seasonal canvas has invalid size: '+JSON.stringify(start));

  // Critical regression window: stay in Spanish beyond updateMonth's 3-second
  // timer. The old bug rewrote English copy every 3s and i18n translated it back,
  // causing layout churn and visible animation hitching.
  const spanishBefore=await sampleFrames(page,'Spanish >3s interval',4550,350);
  assertCopy(spanishBefore,'es');

  const frameBeforeEnglish=spanishBefore.at(-1).frame;
  await page.evaluate(()=>window.MichelsLifeI18n.setLanguage('en',{userInitiated:true}));
  await page.waitForTimeout(350);
  const english=await sampleFrames(page,'English interval',3850,350);
  assertCopy(english,'en');
  ok(english[0].frame>frameBeforeEnglish,
    'Switching Spanish -> English reset/stalled the seasonal frame counter: '+JSON.stringify({frameBeforeEnglish,english:first=english[0]}));

  const frameBeforeSpanish=english.at(-1).frame;
  await page.evaluate(()=>window.MichelsLifeI18n.setLanguage('es',{userInitiated:true}));
  await page.waitForTimeout(350);
  const spanishAfter=await sampleFrames(page,'Spanish round-trip >3s interval',3850,350);
  assertCopy(spanishAfter,'es');
  ok(spanishAfter[0].frame>frameBeforeSpanish,
    'Switching English -> Spanish reset/stalled the seasonal frame counter: '+JSON.stringify({frameBeforeSpanish,spanishAfter:first=spanishAfter[0]}));

  const finalState=await snapshot(page);
  ok(finalState.canvasSame,'Seasonal canvas object changed during language round trip: '+JSON.stringify(finalState));

  console.log('OK: seasonal banner stays source-bilingual and animates continuously across ES -> EN -> ES and the 3s month refresh interval',
    JSON.stringify({
      startFrame:start.frame,
      spanishEnd:spanishBefore.at(-1).frame,
      englishEnd:english.at(-1).frame,
      finalFrame:spanishAfter.at(-1).frame,
      finalState
    }));
} finally {
  await browser.close();
}
