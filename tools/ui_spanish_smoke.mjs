import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';

function ok(v,m){if(!v)throw new Error(m)}
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});

await page.addInitScript(()=>{
  try{
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','es');
  }catch(_){}
});

const exactBanned=[
  'Dashboard','Missions','Premium Contracts','Statistics','Projects','Achievements','Affirmations','Story','Settings',
  'Yesterday','Today','Tomorrow','Weekly Review','Color Theme','Typography','UI Customization','Focus & Timers',
  'Notifications','Planning & Next Up','Data & Backup','Chapter Scenes','About','Current Mission',
  'New phrase','Open affirmations','Quick Capture','Add contract','Add a quick mission','Quick actions',
  'Recurring Missions','Due today','Pending today','Done today','Done this week','Connect Google','Disconnect',
  'Sync Calendar now','Open Google Calendar','Cloud Sync','Last cloud sync','Keep this PC','Use cloud',
  'Ready to connect','Needs reconnect','Needs attention','Connecting…','Command','Affirmation'
];

const englishWords=new Set(('the and your you this that with from for into today tomorrow week weekly mission missions settings save add delete edit open close start stop focus google cloud calendar backup project chapter current completed pending choose connect sync data story theme color language affirmation command new reset restore ready linked optional important main quick capture decision reason profile developer license build show send automatic never offline error failed history account disconnect reconnect upload download keep use apply remove change create select all none next previous view status priority alert notification journal').split(' '));
const spanishWords=new Set(('el la los las un una de del y o tu tus tú este esta esto que con desde para hacia hoy ayer mañana semana misión misiones configuración guardar agregar eliminar editar abrir cerrar iniciar detener enfoque nube calendario respaldo proyecto capítulo actual completada pendiente elegir conectar sincronizar datos historia tema color idioma afirmación comando nuevo restablecer restaurar listo vinculado opcional importante principal rápida captura decisión razón perfil desarrollador licencia versión mostrar enviar automático nunca sin error historial cuenta desconectar reconectar subir descargar conservar usar aplicar quitar cambiar crear seleccionar todos ninguno siguiente anterior ver estado prioridad alerta notificación diario').split(' '));

const properAllow=[
  /Michel.?s Life/i,/Google/i,/OpenFOAM/i,/Python/i,/Instagram/i,/LinkedIn/i,/XP\b/i,/OAuth/i,/Drive/i,
  /Midnights/i,/Born to Die/i,/Paradise/i,/Ultraviolence/i,/Honeymoon/i,/Lust for Life/i,/Norman Fucking Rockwell/i,
  /Chemtrails Over the Country Club/i,/Blue Banisters/i,/Did You Know That There.?s a Tunnel Under Ocean Blvd/i,
  /The Tortured Poets Department/i,/The Life of a Showgirl/i,/folklore/i,/evermore/i,/reputation/i,/RED\b/i
];

function englishLooking(line){
  const clean=line.replace(/[0-9%+→←★✦⚔▦▥▰🏆⌂◈◆Aa✣⏱◉☷▣⌁ⓘ·—…]/g,' ').trim();
  if(clean.length<8||properAllow.some(r=>r.test(clean)))return false;
  const words=(clean.toLowerCase().match(/[a-záéíóúñ]+/g)||[]);
  if(words.length<2)return false;
  let en=0,es=0;
  for(const w of words){if(englishWords.has(w))en++;if(spanishWords.has(w))es++;}
  return en>=2 && es===0;
}

async function visibleLines(){
  return await page.evaluate(()=>{
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const out=[];
    while(walker.nextNode()){
      const n=walker.currentNode,p=n.parentElement;
      if(!p||/^(SCRIPT|STYLE|CODE|PRE)$/i.test(p.tagName))continue;
      const cs=getComputedStyle(p),r=p.getBoundingClientRect();
      if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0||r.width===0||r.height===0)continue;
      const s=(n.nodeValue||'').replace(/\s+/g,' ').trim();
      if(s)out.push(s);
    }
    return [...new Set(out)];
  });
}

const findings=new Map();
async function audit(label){
  await page.waitForTimeout(500);
  const lines=await visibleLines();
  const bad=[];
  for(const line of lines){
    if(exactBanned.some(x=>line===x||line.startsWith(x+' ')||line.endsWith(' '+x)))bad.push(line);
    else if(englishLooking(line))bad.push(line);
  }
  if(bad.length)findings.set(label,[...new Set(bad)].slice(0,80));
}

try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.LeftNavV30171&&window.MichelsLifeI18n&&document.querySelector('#v30171Sidebar'),null,{timeout:60000});
  await page.evaluate(()=>window.MichelsLifeI18n.setLanguage('es'));
  await page.waitForTimeout(500);
  ok(await page.evaluate(()=>document.documentElement.lang==='es'),'document language is not es');
  const translationProbe=await page.evaluate(()=>({
    dashboard:window.MichelsLifeI18n.mapText('Dashboard'),
    layout:window.MichelsLifeI18n.mapText('Dashboard layout'),
    affirmation:window.MichelsLifeI18n.mapText('Today I choose execution over fantasy.')
  }));
  ok(translationProbe.dashboard==='Inicio'&&translationProbe.layout==='Diseño de Inicio'&&translationProbe.affirmation==='Hoy elijo ejecución sobre fantasía.','Spanish dictionary probe failed: '+JSON.stringify(translationProbe));

  const routes=['dashboard','missions','contracts','calendar','stats','projects','achievements','affirmations','story','settings'];
  for(const route of routes){
    await page.evaluate(r=>window.LeftNavV30171.route(r),route);
    await page.waitForTimeout(260);
    await page.evaluate(()=>window.MichelsLifeI18n.refresh());
    await page.waitForTimeout(90);
    await audit(route);
  }

  await page.evaluate(()=>window.LeftNavV30171.route('settings'));
  await page.waitForSelector('[data-v30171-setting]',{timeout:10000});
  const settings=await page.evaluate(()=>[...document.querySelectorAll('[data-v30171-setting]')].map(x=>x.dataset.v30171Setting));
  for(const key of settings){
    await page.evaluate(k=>{
      const el=document.querySelector('[data-v30171-setting="'+k+'"]');
      if(el)el.click();
    },key);
    await page.waitForTimeout(220);
    await page.evaluate(()=>window.MichelsLifeI18n.refresh());
    await page.waitForTimeout(80);
    await audit('settings:'+key);
  }

  // Affirmation bank: verify seeded defaults and the rotating status phrase are translated.
  await page.evaluate(()=>window.LeftNavV30171.route('affirmations'));
  await page.waitForTimeout(350);
  await page.evaluate(()=>window.MichelsLifeI18n.refresh());
  await page.waitForTimeout(80);
  const affirmationTexts=await page.evaluate(()=>[...document.querySelectorAll('#tab-affirmations td:first-child,.affirmation')].map(x=>(x.textContent||'').trim()).filter(Boolean));
  const seededEnglish=affirmationTexts.filter(t=>/^(I |My |Evidence |Focused work|Today I )/.test(t));
  if(seededEnglish.length)findings.set('affirmation-bank',seededEnglish);

  if(findings.size){
    const report=[...findings.entries()].map(([k,v])=>'['+k+']\n'+v.map(x=>'  - '+x).join('\n')).join('\n\n');
    throw new Error('Visible English remains in Spanish mode:\n'+report);
  }
  console.log('OK: Spanish UI audit passed across main routes, Settings sections, and affirmation bank');
} finally {
  await browser.close();
}
