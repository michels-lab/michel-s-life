import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});

await page.addInitScript(()=>{
  try{
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','es');
    localStorage.setItem('michelsLife.language.installDefault.v1','es');
  }catch(_){}
  window.__MICHELSLIFE_INSTALL_LANGUAGE__='es';
});

try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.LeftNavV30171&&window.MichelsLifeI18n,null,{timeout:60000});
  await page.evaluate(()=>window.MichelsLifeI18n.setLanguage('es'));
  await page.waitForTimeout(700);

  // Stress Settings reconstruction repeatedly to catch duplicate-card regressions.
  for(let i=0;i<6;i++){
    await page.evaluate(()=>{
      window.LeftNavV30171.route('settings');
      window.LeftNavV30171.buildSettings?.();
      window.MichelsLifeI18n.refresh?.();
    });
    await page.waitForTimeout(180);
  }

  const integrity=await page.evaluate(()=>{
    const root=document.getElementById('tab-settings');
    if(!root)return {missing:true};

    const panes=[...root.querySelectorAll('[data-v30171-pane]')];
    const duplicates=[];
    for(const pane of panes){
      const seen=new Map();
      for(const el of [...pane.children]){
        if(!(el instanceof Element)||el.classList.contains('v30171-pane-heading')||!el.matches('.card,section.card,div.card'))continue;
        const h=(el.querySelector('h2,h3,.section-title h2,.section-title h3')?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
        const p=(el.querySelector('.section-title p,p')?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
        if(!h)continue;
        const key=h+'|'+p;
        if(seen.has(key))duplicates.push({pane:pane.dataset.v30171Pane,key});
        else seen.set(key,el);
      }
    }

    const dataPane=root.querySelector('[data-v30171-pane="data"]');
    const backupCards=dataPane?[...dataPane.querySelectorAll('.v30171-data-card')]:[];

    const buttons=[...root.querySelectorAll('[data-mlv-language-choice]')];
    const colors=Object.fromEntries(buttons.map(b=>[
      b.getAttribute('data-mlv-language-choice'),
      {
        pressed:b.getAttribute('aria-pressed'),
        color:getComputedStyle(b).color,
        fill:getComputedStyle(b).webkitTextFillColor||''
      }
    ]));

    return {
      missing:false,
      duplicates,
      backupCount:backupCards.length,
      colors,
      text:root.innerText
    };
  });

  ok(!integrity.missing,'Settings root missing');
  ok(!integrity.duplicates.length,'Duplicate Settings cards found: '+JSON.stringify(integrity.duplicates,null,2));
  ok(integrity.backupCount===1,'Expected exactly one Backup & restore card, found '+integrity.backupCount);

  const es=integrity.colors.es, en=integrity.colors.en;
  ok(es&&en,'Language choice buttons missing: '+JSON.stringify(integrity.colors));
  ok(es.pressed==='true','Spanish language button is not selected');
  ok(es.color===en.color,
    'Selected Spanish button changed text color unexpectedly: '+JSON.stringify(integrity.colors));

  const forbidden=[
    'Full Michel’s Life data, import and reset tools in one place.',
    'No stalking / no chasing',
    'Emotional Autonomy',
    'Physical health',
    'Train arms',
    'Close with intention, not chaos.'
  ];

  // Check Settings plus default mission/dashboard surfaces.
  const residues=[];
  for(const route of ['settings','missions','dashboard']){
    await page.evaluate(r=>window.LeftNavV30171.route(r),route);
    await page.waitForTimeout(350);
    await page.evaluate(()=>window.MichelsLifeI18n.refresh?.());
    await page.waitForTimeout(180);
    const text=await page.locator('body').innerText();
    for(const bad of forbidden){
      if(text.includes(bad))residues.push({route,bad});
    }
  }
  ok(!residues.length,'Known English residue remains in Spanish UI: '+JSON.stringify(residues,null,2));

  console.log('OK: Settings has no duplicate cards, language buttons keep theme text color, and known English residues are gone');
} finally {
  await browser.close();
}
