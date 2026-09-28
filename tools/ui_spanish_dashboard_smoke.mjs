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

const bannedSystem=[
  'Dashboard','Good morning','Good noon','Good afternoon','Good evening','Late night',
  'CURRENT CHAPTER','CHAPTER ','LEVEL','TOTAL XP','TODAY','FOCUS','DAY','CURRENT BOSS',
  'No active boss battle','Choose in Projects','Open Story','Life Build','Bosses & Quest Chains',
  'COMING NEXT','queued','Dashboard layout','Premium Contracts','Weekly Review','Revisión weekly',
  'Early autumn','Golden shift','September','Earlier today','Positive affirmations','Focus Mode'
];

const badSpanish=[
  'Buena tarde','Buen mediodía','Revisión weekly',
  'Me trato como alguien que vale esfuerzo.'
];

async function visibleText(){
  return await page.evaluate(()=>{
    const out=[];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
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

try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.LeftNavV30171&&window.MichelsLifeI18n&&document.querySelector('#v30171Sidebar'),null,{timeout:60000});
  await page.evaluate(()=>{
    window.MichelsLifeI18n.setLanguage('es');
    window.LeftNavV30171.route('dashboard');
  });
  await page.waitForTimeout(700);
  await page.evaluate(()=>window.MichelsLifeI18n.refresh());
  await page.waitForTimeout(180);

  const lines=await visibleText();
  const joined='\n'+lines.join('\n')+'\n';

  const expectedVisible=['Inicio','Ayer','Mañana','Hoy'];
  const missingVisible=expectedVisible.filter(x=>!joined.includes(x));
  ok(!missingVisible.length,'Missing always-visible Spanish dashboard labels: '+missingVisible.join(', '));

  const probe=await page.evaluate(()=>({
    chapter:window.MichelsLifeI18n.mapText('CURRENT CHAPTER'),
    level:window.MichelsLifeI18n.mapText('LEVEL'),
    xp:window.MichelsLifeI18n.mapText('TOTAL XP'),
    focus:window.MichelsLifeI18n.mapText('FOCUS'),
    day:window.MichelsLifeI18n.mapText('DAY')
  }));
  ok(
    probe.chapter==='CAPÍTULO ACTUAL'&&probe.level==='NIVEL'&&probe.xp==='XP TOTAL'&&probe.focus==='ENFOQUE'&&probe.day==='DÍA',
    'Dashboard translation probes failed: '+JSON.stringify(probe)
  );

  const banned=[];
  for(const x of bannedSystem){
    if(joined.toLowerCase().includes(x.toLowerCase()))banned.push(x);
  }
  ok(!banned.length,'English system text remains on Dashboard: '+banned.join(', '));

  const awkward=badSpanish.filter(x=>joined.includes(x));
  ok(!awkward.length,'Bad Spanish wording remains on Dashboard: '+awkward.join(', '));

  const logo=await page.evaluate(()=>{
    const img=document.querySelector('#v30171Sidebar .v30171-brand-mark img');
    return img?{src:img.getAttribute('src')||'',w:img.naturalWidth,h:img.naturalHeight}:null;
  });
  ok(logo&&logo.w>0&&logo.h>0,'Dashboard logo is not rendering: '+JSON.stringify(logo));

  console.log('OK: Spanish Dashboard audit passed');
  console.log(lines.join('\n'));
} finally {
  await browser.close();
}
