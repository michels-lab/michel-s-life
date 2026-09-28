import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1500,height:980},deviceScaleFactor:1});

await page.addInitScript(()=>{
  try{
    // Simulate a real reinstall: an older build left English in localStorage,
    // but the newly selected installer/WebView2 language is Spanish.
    localStorage.setItem('michelsLife.language.v1','en');
    localStorage.removeItem('michelsLife.language.userOverrideBase.v1');
    localStorage.setItem('michelsLife.onboarding.v30200','done');
  }catch(_){}
  try{
    // Match the installed Windows host: installer explicitly says Spanish,
    // while the browser/OS locale itself may still be English.
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='es';
    Object.defineProperty(navigator,'language',{configurable:true,get:()=> 'en-US'});
    Object.defineProperty(navigator,'languages',{configurable:true,get:()=> ['en-US','en']});
  }catch(_){}
});

async function state(){
  return await page.evaluate(()=>({
    language:window.MichelsLifeI18n?.language,
    resolved:window.MichelsLifeI18n?.getLanguage?.(),
    htmlLang:document.documentElement.lang,
    stored:localStorage.getItem('michelsLife.language.v1'),
    overrideBase:localStorage.getItem('michelsLife.language.userOverrideBase.v1')
  }));
}

async function openGeneralSettings(){
  await page.waitForFunction(()=>window.LeftNavV30171&&window.MichelsLifeI18n,null,{timeout:60000});
  await page.evaluate(()=>window.LeftNavV30171.route('settings'));
  await page.waitForTimeout(450);
  const general=page.locator('[data-v30171-setting="general"]');
  if(await general.count())await general.first().click();
  await page.waitForSelector('[data-mlv-language-select]',{timeout:20000});
}

try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.MichelsLifeI18n,null,{timeout:60000});
  await page.waitForTimeout(900);

  let s=await state();
  ok(s.language==='es'&&s.htmlLang==='es'&&s.stored==='es',
    'Spanish installer language did not override stale English localStorage: '+JSON.stringify(s));

  await openGeneralSettings();

  // Change using the actual Settings control, not the JS API.
  let select=page.locator('[data-mlv-language-select]').first();
  await select.selectOption('en');
  await page.waitForTimeout(900);
  s=await state();
  ok(s.language==='en'&&s.htmlLang==='en'&&s.stored==='en'&&s.overrideBase==='es',
    'Settings selector did not persist English: '+JSON.stringify(s));

  // Reload: explicit Settings preference must win over installer language.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MichelsLifeI18n,null,{timeout:60000});
  await page.waitForTimeout(850);
  s=await state();
  ok(s.language==='en'&&s.htmlLang==='en',
    'Explicit English Settings preference did not survive reload: '+JSON.stringify(s));

  await openGeneralSettings();
  select=page.locator('[data-mlv-language-select]').first();
  await select.selectOption('es');
  await page.waitForTimeout(900);
  s=await state();
  ok(s.language==='es'&&s.htmlLang==='es'&&s.stored==='es'&&s.overrideBase==='es',
    'Settings selector rebounded instead of staying Spanish: '+JSON.stringify(s));

  const spanishTitle=await page.locator('[data-mlv-lang-title]').first().textContent();
  ok(/Idioma de la interfaz/i.test(spanishTitle||''),
    'Settings card did not visibly switch to Spanish: '+String(spanishTitle));

  // Reload again: Spanish selection must persist.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MichelsLifeI18n,null,{timeout:60000});
  await page.waitForTimeout(850);
  s=await state();
  ok(s.language==='es'&&s.htmlLang==='es',
    'Explicit Spanish Settings preference did not survive reload: '+JSON.stringify(s));

  console.log('OK: installer Spanish overrides stale storage and Settings selector persists both languages');
} finally {
  await browser.close();
}
