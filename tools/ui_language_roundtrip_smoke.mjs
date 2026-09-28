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

const spanishSystem=/\b(inicio|misiones|misión|contratos premium|contrato|calendario|diario|estadísticas|comparar|revisión semanal|revisión|proyectos|proyecto|logros|afirmaciones|afirmación|historia|configuración|mañana|noche|tarde|hoy|ayer|semana|semanal|mes|año|editar|eliminar|guardar|cancelar|cerrar|restablecer|hoy no|duplicar|archivar|vincular proyecto|poner como siguiente|fácil|media|difícil|fortaleza mental|imagen\s*\/\s*presencia|completar|pendientes|completadas|siguiente\s*#\s*\d+|desayuno|comida|trabajo|casa|cena|después|usar|sesiones|caminata|preparar|hora del día|días activos|días de diario|lunes|martes|miércoles|jueves|viernes|sábado|domingo|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i;

function allowedSpanishInEnglish(s){
  return /^Español$/i.test(s)||/Michel.?s Life/i.test(s);
}

async function collectSystemSpanish(label){
  await page.waitForTimeout(260);
  return await page.evaluate(({source})=>{
    const rx=new RegExp(source,'i');
    const out=[];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const n=walker.currentNode,p=n.parentElement;
      if(!p||/^(SCRIPT|STYLE|CODE|PRE)$/i.test(p.tagName))continue;
      const s=(n.nodeValue||'').replace(/\s+/g,' ').trim();
      if(s&&rx.test(s)&&!/^Español$/i.test(s))out.push({kind:'text',value:s,tag:p.tagName,cls:String(p.className||'')});
    }
    for(const el of document.querySelectorAll('button,input,select,option,label,[role="button"],[title],[aria-label],[placeholder]')){
      for(const [kind,value] of [
        ['control',(el.textContent||'').replace(/\s+/g,' ').trim()],
        ['placeholder',el.getAttribute('placeholder')||''],
        ['title',el.getAttribute('title')||''],
        ['aria',el.getAttribute('aria-label')||'']
      ]){
        if(value&&rx.test(value)&&!/^Español$/i.test(value))out.push({kind,value,tag:el.tagName,cls:String(el.className||'')});
      }
    }
    return out;
  },{source:spanishSystem.source});
}

async function visibleOverflow(){
  return await page.evaluate(()=>{
    function visible(el){
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)!==0&&r.width>0&&r.height>0;
    }
    return [...document.querySelectorAll('button,[role="button"]')]
      .filter(el=>visible(el)&&((el.textContent||'').replace(/\s+/g,' ').trim().length>1))
      .map(el=>({
        text:(el.textContent||'').replace(/\s+/g,' ').trim(),
        sw:el.scrollWidth,cw:el.clientWidth,sh:el.scrollHeight,ch:el.clientHeight,
        cls:String(el.className||'')
      }))
      .filter(x=>x.sw>x.cw+1||x.sh>x.ch+1)
      .slice(0,80);
  });
}

try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.LeftNavV30171&&window.MichelsLifeI18n,null,{timeout:60000});

  // Spanish pass: verify translated controls fit.
  await page.evaluate(()=>window.MichelsLifeI18n.setLanguage('es'));
  await page.waitForTimeout(800);
  const routes=['dashboard','missions','contracts','calendar','journal','stats','compare','weekly-review','projects','achievements','affirmations','story','settings'];
  const overflowFindings=[];
  for(const route of routes){
    await page.evaluate(r=>window.LeftNavV30171.route(r),route);
    await page.waitForTimeout(300);
    await page.evaluate(()=>window.MichelsLifeI18n.refresh());
    await page.waitForTimeout(120);
    const bad=await visibleOverflow();
    if(bad.length)overflowFindings.push({route,bad});
  }
  ok(!overflowFindings.length,'Spanish translated controls overflow:\n'+JSON.stringify(overflowFindings,null,2));

  // Exact failure mode from the real app: Spanish -> English without reload.
  await page.evaluate(()=>window.MichelsLifeI18n.setLanguage('en'));
  await page.waitForTimeout(900);
  const htmlLang=await page.evaluate(()=>document.documentElement.lang);
  ok(htmlLang==='en','Document language did not switch to English: '+htmlLang);

  const residue=[];
  for(const route of routes){
    await page.evaluate(r=>window.LeftNavV30171.route(r),route);
    await page.waitForTimeout(320);
    const bad=await collectSystemSpanish(route);
    const uniq=[...new Map(bad.map(x=>[x.kind+'|'+x.value,x])).values()].filter(x=>!allowedSpanishInEnglish(x.value));
    if(uniq.length)residue.push({route,bad:uniq.slice(0,80)});
  }

  ok(!residue.length,'Spanish system copy survived Spanish -> English switch:\n'+JSON.stringify(residue,null,2));

  // Direct probes for the exact labels seen in the user's screenshots.
  const probe=await page.evaluate(()=>({
    language:window.MichelsLifeI18n.language,
    mapNight:window.MichelsLifeI18n.mapText('Night'),
    mapTomorrow:window.MichelsLifeI18n.mapText('Tomorrow'),
    mapEdit:window.MichelsLifeI18n.mapText('Edit'),
    mapMedium:window.MichelsLifeI18n.mapText('Medium'),
    mapComplete:window.MichelsLifeI18n.mapText('Complete'),
    mapBreakfast:window.MichelsLifeI18n.mapText('Desayuno'),
    mapLunch:window.MichelsLifeI18n.mapText('Comida'),
    mapWork:window.MichelsLifeI18n.mapText('Trabajo'),
    mapHome:window.MichelsLifeI18n.mapText('Casa'),
    mapDinner:window.MichelsLifeI18n.mapText('Cena'),
    mapAfter:window.MichelsLifeI18n.mapText('Después')
  }));
  ok(probe.language==='en','i18n language state is not English');
  ok(probe.mapNight==='Night'&&probe.mapTomorrow==='Tomorrow'&&probe.mapEdit==='Edit'&&probe.mapMedium==='Medium'&&probe.mapComplete==='Complete',
    'English mapText is not canonical identity: '+JSON.stringify(probe));
  ok(probe.mapBreakfast==='Breakfast'&&probe.mapLunch==='Lunch'&&probe.mapWork==='Work'&&probe.mapHome==='Home'&&probe.mapDinner==='Dinner'&&probe.mapAfter==='After',
    'Known Spanish system defaults were not normalized in English mode: '+JSON.stringify(probe));

  const dynamicEnglishProbe=await page.evaluate(()=>{
    const tr=window.MichelsLifeI18n.mapText;
    const inputs=[
      'Tienes 2 misiones pendientes de ayer.',
      'Tienes 1 misión pendiente de ayer.',
      'Muévelas a hoy sin crear duplicados.',
      'Mover todas sin duplicados',
      'Una acción enfocada basta para cambiar cómo se lee el día.',
      '🌇 Buenas tardes, Michel · lun, sep 28 · Una acción enfocada basta para cambiar cómo se lee el día.'
    ];
    return inputs.map(input=>({input,output:tr(input)}));
  });
  const expectedEnglish=[
    'You have 2 pending missions from yesterday.',
    'You have 1 pending mission from yesterday.',
    'Move them to today without creating duplicates.',
    'Move all without duplicates',
    'One focused action is enough to change the reading of today.',
    '🌇 Good afternoon, Michel · Mon, Sep 28 · One focused action is enough to change the reading of today.'
  ];
  ok(JSON.stringify(dynamicEnglishProbe.map(x=>x.output))===JSON.stringify(expectedEnglish),
    'Dynamic English round-trip probe failed:\n'+JSON.stringify(dynamicEnglishProbe,null,2));

  console.log('OK: Spanish controls fit and Spanish -> English round-trip leaves no system Spanish residue');
} finally {
  await browser.close();
}
