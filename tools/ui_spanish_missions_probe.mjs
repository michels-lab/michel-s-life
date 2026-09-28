import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});

await page.addInitScript(()=>{
  try{
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','es');
  }catch(_){}
});

try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.LeftNavV30171&&window.MichelsLifeI18n&&document.querySelector('#v30171Sidebar'),null,{timeout:60000});
  await page.evaluate(()=>{window.MichelsLifeI18n.setLanguage('es');window.LeftNavV30171.route('missions');});
  await page.waitForTimeout(900);
  await page.evaluate(()=>window.MichelsLifeI18n.refresh());
  await page.waitForTimeout(250);

  const data=await page.evaluate(()=>{
    function vis(el){
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)!==0&&r.width>0&&r.height>0;
    }
    const controls=[...document.querySelectorAll('button,[role="button"],input,select,option,label,[title],[aria-label]')]
      .filter(vis)
      .map((el,i)=>({
        i,
        tag:el.tagName,
        cls:el.className||'',
        text:(el.textContent||'').replace(/\s+/g,' ').trim(),
        value:'value' in el?el.value:'',
        placeholder:el.getAttribute('placeholder')||'',
        title:el.getAttribute('title')||'',
        aria:el.getAttribute('aria-label')||'',
        data:[...el.attributes].filter(a=>a.name.startsWith('data-')).reduce((o,a)=>(o[a.name]=a.value,o),{})
      }));
    const short=[...document.querySelectorAll('body *')]
      .filter(vis)
      .map(el=>({tag:el.tagName,cls:el.className||'',text:(el.textContent||'').replace(/\s+/g,' ').trim(),html:el.outerHTML.slice(0,500)}))
      .filter(x=>x.text&&x.text.length<=3);
    return {controls,short};
  });
  console.log('MISSIONS_CONTROLS '+JSON.stringify(data.controls,null,2));
  console.log('MISSIONS_SHORT '+JSON.stringify(data.short,null,2));
} finally {
  await browser.close();
}
