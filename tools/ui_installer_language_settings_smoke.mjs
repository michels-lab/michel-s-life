import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1500,height:980},deviceScaleFactor:1});

await page.addInitScript(()=>{
  try{
    // Simulate stale data only on the first document. sessionStorage survives
    // reloads, so later reloads can test whether a Settings choice really
    // persists instead of having the test overwrite it again.
    if(!sessionStorage.getItem('__mlvInstallerLanguageTestBootstrapped')){
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.removeItem('michelsLife.language.userOverrideBase.v1');
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      sessionStorage.setItem('__mlvInstallerLanguageTestBootstrapped','1');
    }
  }catch(_){}
  try{
    // Match the installed Windows host on every document: installer explicitly
    // says Spanish while the browser/OS locale itself may still be English.
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

async function chooseLanguage(value){
  await page.waitForFunction(()=>{
    return [...document.querySelectorAll('[data-mlv-language-select]')].some(el=>{
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0;
    });
  },null,{timeout:10000});

  await page.evaluate(value=>{
    const select=[...document.querySelectorAll('[data-mlv-language-select]')].find(el=>{
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0;
    });
    if(!select)throw new Error('visible language selector not found');
    select.value=value;
    select.dispatchEvent(new Event('change',{bubbles:true,cancelable:true}));
  },value);
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
  await chooseLanguage('en');
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
  await chooseLanguage('es');
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
