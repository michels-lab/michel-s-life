import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1500,height:980},deviceScaleFactor:1});

await page.addInitScript(()=>{
  try{
    localStorage.removeItem('michelsLife.language.v1');
    localStorage.removeItem('michelsLife.onboarding.v30200');
  }catch(_){}
  try{
    Object.defineProperty(navigator,'language',{configurable:true,get:()=> 'es-MX'});
    Object.defineProperty(navigator,'languages',{configurable:true,get:()=> ['es-MX','es']});
  }catch(_){}
});

const banned=[
  'A short first-run setup',
  'Choose how much starter structure you want',
  'Start with an empty board',
  'Build your starting system',
  'Your Michel’s Life board is ready',
  'Interface language',
  'Language',
  'English'
];

async function visibleLines(){
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
  await page.waitForFunction(()=>window.MichelsLifeI18n&&document.body,null,{timeout:60000});
  await page.waitForTimeout(900);
  await page.evaluate(()=>window.MichelsLifeI18n.refresh());
  await page.waitForTimeout(180);

  const state=await page.evaluate(()=>({
    language:window.MichelsLifeI18n.getLanguage(),
    htmlLang:document.documentElement.lang,
    stored:localStorage.getItem('michelsLife.language.v1')
  }));
  ok(state.language==='es','First run did not choose Spanish from es-MX: '+JSON.stringify(state));
  ok(state.htmlLang==='es','Document language is not Spanish on first run: '+JSON.stringify(state));

  const lines=await visibleLines();
  const joined='\n'+lines.join('\n')+'\n';
  const onboardingSpanish=[
    'Una configuración inicial breve',
    'Elige cuánta estructura inicial quieres',
    'Construye tu sistema inicial',
    'Tu tablero de Michel’s Life está listo'
  ];
  ok(onboardingSpanish.some(x=>joined.includes(x)),'Spanish first-run/onboarding copy was not visible. Visible text:\n'+lines.join('\n'));

  const bad=[];
  for(const x of banned){
    if(joined.toLowerCase().includes(x.toLowerCase()))bad.push(x);
  }
  ok(!bad.length,'English first-run copy remains in Spanish mode: '+bad.join(', '));

  console.log('OK: Spanish first run follows installer/browser es-MX language');
  console.log(lines.join('\n'));
} finally {
  await browser.close();
}
