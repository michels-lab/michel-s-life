import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

async function state(page){
  return await page.evaluate(()=>({
    language:window.MichelsLifeI18n?.language,
    htmlLang:document.documentElement.lang,
    stored:localStorage.getItem('michelsLife.language.v1'),
    overrideBase:localStorage.getItem('michelsLife.language.userOverrideBase.v1'),
    native:window.__MICHELSLIFE_INSTALL_LANGUAGE__||null,
    selects:[...document.querySelectorAll('[data-mlv-language-select]')].map(x=>x.value)
  }));
}

const browser=await chromium.launch({headless:true});
try{
  // Real installed-app case: OS/browser English, installer explicitly Spanish.
  const page=await browser.newPage({viewport:{width:1500,height:980}});
  await page.addInitScript(()=>{
    try{
      localStorage.removeItem('michelsLife.language.v1');
      localStorage.removeItem('michelsLife.language.userOverrideBase.v1');
      localStorage.setItem('michelsLife.onboarding.v30200','done');
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='es';
    try{
      Object.defineProperty(navigator,'language',{configurable:true,get:()=> 'en-US'});
      Object.defineProperty(navigator,'languages',{configurable:true,get:()=> ['en-US','en']});
    }catch(_){}
  });

  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.LeftNavV30171&&window.MichelsLifeI18n,null,{timeout:60000});
  await page.waitForTimeout(900);

  let s=await state(page);
  ok(s.language==='es'&&s.htmlLang==='es'&&s.stored==='es',
    'Installer Spanish did not win over English OS/browser: '+JSON.stringify(s));

  await page.evaluate(()=>window.LeftNavV30171.route('settings'));
  await page.waitForSelector('[data-mlv-language-select]',{timeout:10000});
  await page.waitForTimeout(300);
  s=await state(page);
  ok(s.selects.length&&s.selects.every(x=>x==='es'),
    'Settings selector did not reflect installed Spanish: '+JSON.stringify(s));

  // Reproduce the user video: opening/clicking the select must not schedule a
  // stale refresh that forces the previous value back.
  let sel=page.locator('[data-mlv-language-select]:visible').first();
  await sel.waitFor({state:'visible',timeout:10000});
  await sel.click();
  await page.waitForTimeout(120);
  await sel.selectOption('en');
  await page.waitForTimeout(900);
  s=await state(page);
  ok(s.language==='en'&&s.htmlLang==='en'&&s.stored==='en'&&s.selects.every(x=>x==='en'),
    'Settings reverted/failed after choosing English: '+JSON.stringify(s));

  sel=page.locator('[data-mlv-language-select]:visible').first();
  await sel.waitFor({state:'visible',timeout:10000});
  await sel.click();
  await page.waitForTimeout(120);
  await sel.selectOption('es');
  await page.waitForTimeout(900);
  s=await state(page);
  ok(s.language==='es'&&s.htmlLang==='es'&&s.stored==='es'&&s.selects.every(x=>x==='es'),
    'Settings reverted/failed after choosing Spanish: '+JSON.stringify(s));

  const spanishProbe=await page.evaluate(()=>({
    dashboard:window.MichelsLifeI18n.mapText('Dashboard'),
    settings:window.MichelsLifeI18n.mapText('Settings')
  }));
  ok(spanishProbe.dashboard==='Inicio'&&spanishProbe.settings==='Configuración',
    'Spanish UI did not apply after Settings selection: '+JSON.stringify(spanishProbe));

  await page.close();

  // Timing-race case: page starts English because native bridge arrives late.
  const late=await browser.newPage({viewport:{width:1500,height:980}});
  await late.addInitScript(()=>{
    try{
      localStorage.removeItem('michelsLife.language.v1');
      localStorage.removeItem('michelsLife.language.userOverrideBase.v1');
      localStorage.setItem('michelsLife.onboarding.v30200','done');
    }catch(_){}
    try{
      Object.defineProperty(navigator,'language',{configurable:true,get:()=> 'en-US'});
      Object.defineProperty(navigator,'languages',{configurable:true,get:()=> ['en-US','en']});
    }catch(_){}
  });
  await late.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await late.waitForFunction(()=>window.MichelsLifeI18n,null,{timeout:60000});
  await late.waitForTimeout(350);
  let lateState=await state(late);
  ok(lateState.language==='en','Late-bridge fixture did not start English: '+JSON.stringify(lateState));

  await late.evaluate(()=>window.MichelsLifeI18n.applyInstalledLanguage('es'));
  await late.waitForTimeout(900);
  lateState=await state(late);
  ok(lateState.language==='es'&&lateState.htmlLang==='es'&&lateState.stored==='es',
    'Late native installer bridge failed to reconcile Spanish: '+JSON.stringify(lateState));

  console.log('OK: installed Spanish wins, Settings language selector is stable, and late native bridge reconciles');
  await late.close();
} finally {
  await browser.close();
}
