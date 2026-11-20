import {chromium} from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const testWindows=[{width:1450,height:920},{width:360,height:740}];
const assert=(ok,reason)=>{if(!ok)throw new Error(reason)};

async function run(viewport){
  const page=await browser.newPage({viewport});
  const faults=[];
  page.on('pageerror',e=>faults.push(String(e?.message||e)));
  await page.addInitScript(()=>{
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','es');
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='es';
  });
  try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>!!window.MLColorFloatingPreview&&!!window.LeftNavV30171,{timeout:60000});
    await page.evaluate(()=>window.LeftNavV30171.route('settings'));
    await page.waitForTimeout(700);
    const selected=await page.evaluate(()=>{
      const root=document.querySelector('#tab-settings');
      const color=root?.querySelector('#v133TextColor, #v30168MainText');
      if(!color)return {missing:true};
      const chosen='#d0ecf8';
      color.focus();
      color.value=chosen;
      color.dispatchEvent(new Event('input',{bubbles:true}));
      const preview=document.querySelector('#ml-granada-color-floating-preview');
      return {
        missing:false,value:color.value,
        preview:!!preview&&preview.style.display==='block',
        focusCard:!!preview?.querySelector('[data-ml-focus-title]'),
        alarmCard:!!preview?.querySelector('[data-ml-alarm-title]'),
        applied:document.documentElement.style.getPropertyValue('--text').trim(),
        persisted:JSON.parse(localStorage.getItem('michelsLife.granadaColorPreview.v1')||'{}').text
      };
    });
    assert(!selected.missing,'Settings must expose a canonical main text color control');
    assert(selected.value==='#d0ecf8','Picker value was not applied: '+JSON.stringify(selected));
    assert(selected.preview&&selected.focusCard&&selected.alarmCard,
      'Contextual preview missing chapter/focus/alarm: '+JSON.stringify(selected));
    assert(selected.applied==='#d0ecf8'&&selected.persisted==='#d0ecf8',
      'Color not live/persisted: '+JSON.stringify(selected));
    await page.evaluate(()=>window.LeftNavV30171.route('dashboard'));
    await page.waitForTimeout(350);
    await page.evaluate(()=>window.LeftNavV30171.route('settings'));
    await page.waitForTimeout(450);
    assert(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--text').trim()==='#d0ecf8'),
      'Navigation Settings → Dashboard → Settings lost chosen color');
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>!!window.MLColorFloatingPreview,{timeout:60000});
    await page.waitForTimeout(250);
    const after=await page.evaluate(()=>({
      token:document.documentElement.style.getPropertyValue('--text').trim(),
      saved:JSON.parse(localStorage.getItem('michelsLife.granadaColorPreview.v1')||'{}').text
    }));
    assert(after.token==='#d0ecf8'&&after.saved==='#d0ecf8',
      'Page reload lost text color: '+JSON.stringify(after));
    assert(!faults.length,'Page has JS errors: '+faults.slice(0,5).join(' | '));
    console.log('PASS Settings color reload/nav preview at '+viewport.width+'px');
  }finally{await page.close()}
}
try{for(const v of testWindows)await run(v)}finally{await browser.close()}
