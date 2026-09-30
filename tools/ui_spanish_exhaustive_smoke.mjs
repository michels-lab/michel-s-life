import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const browserDiagnostics=[];
page.on('console',msg=>{
  if(['warning','error'].includes(msg.type()))browserDiagnostics.push({type:msg.type(),text:msg.text()});
});
page.on('pageerror',err=>browserDiagnostics.push({type:'pageerror',text:String(err&&err.stack||err)}));

await page.addInitScript(()=>{
  try{
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.language.v1','es');
  }catch(_){}
});

const uiEnglish=/\b(add|after|all|and|apply|archive|available|back|backup|before|breakfast|build|cancel|capture|change|choose|clear|close|completed|connect|continue|create|current|dashboard|data|date|day|delete|description|dinner|disconnect|done|download|edit|english|error|export|failed|finish|focus|for|from|history|home|import|important|inactive|language|last|level|linked|loading|lunch|gold|bar|main|mission|missions|month|move|new|next|notification|notifications|of|offline|on|open|optional|pending|previous|priority|profile|project|projects|quick|ready|reason|remove|reset|restore|retry|save|select|settings|show|start|status|stop|story|sync|the|without|duplicates|duplicate|focused|enough|reading|theme|themes|this|time|title|today|tomorrow|upload|use|view|week|weekly|with|work|year|yesterday|you|your)\b/i;
const dateEnglish=/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
const properAllow=[
  /Michel.?s Life/i,/Attack on Titan/i,/Google/i,/OpenFOAM/i,/Python/i,/Instagram/i,/LinkedIn/i,/XP\b/i,/OAuth/i,/Drive/i,/Pomodoro/i,/JSON/i,/RPG/i,
  /Midnights/i,/Born to Die/i,/Paradise/i,/Ultraviolence/i,/Honeymoon/i,/Lust for Life/i,/Norman Fucking Rockwell/i,
  /Chemtrails Over the Country Club/i,/Blue Banisters/i,/Did You Know That There.?s a Tunnel Under Ocean Blvd/i,
  /The Tortured Poets Department/i,/The Life of a Showgirl/i,/folklore/i,/evermore/i,/reputation/i,/RED\b/i
];

function suspicious(s){
  s=String(s||'').replace(/\s+/g,' ').trim();
  if(!s||properAllow.some(r=>r.test(s)))return false;
  // RESET is an intentional literal confirmation command, not interface copy.
  const scan=s.replace(/\bRESET\b/g,'');
  return uiEnglish.test(scan)||dateEnglish.test(scan);
}

async function auditSurface(label){
  await page.waitForTimeout(180);
  const data=await page.evaluate(()=>{
    function visible(el){
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)!==0&&r.width>0&&r.height>0;
    }
    const strings=[];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const n=walker.currentNode,p=n.parentElement;
      if(!p||/^(SCRIPT|STYLE|CODE|PRE)$/i.test(p.tagName)||!visible(p))continue;
      const s=(n.nodeValue||'').replace(/\s+/g,' ').trim();
      if(s)strings.push({kind:'text',value:s,tag:p.tagName,cls:p.className||''});
    }
    for(const el of [...document.querySelectorAll('button,input,select,option,label,[role="button"],[title],[aria-label],[placeholder]')]){
      if(!visible(el))continue;
      const vals=[
        ['control',(el.textContent||'').replace(/\s+/g,' ').trim()],
        ['placeholder',el.getAttribute('placeholder')||''],
        ['title',el.getAttribute('title')||''],
        ['aria',el.getAttribute('aria-label')||'']
      ];
      if(el.tagName==='INPUT'&&['button','submit','reset'].includes((el.type||'').toLowerCase())) vals.push(['value',el.value||'']);
      for(const [kind,value] of vals)if(value)strings.push({kind,value,tag:el.tagName,cls:el.className||''});
    }
    return strings;
  });
  const bad=[];
  for(const x of data){
    if(suspicious(x.value))bad.push(x);
  }
  return [...new Map(bad.map(x=>[x.kind+'|'+x.value,x])).values()].slice(0,120);
}

try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.LeftNavV30171&&window.MichelsLifeI18n&&document.querySelector('#v30171Sidebar'),null,{timeout:60000});
  await page.evaluate(()=>window.MichelsLifeI18n.setLanguage('es'));
  await page.waitForTimeout(400);

  const dateProbe=await page.evaluate(()=>{
    const tr=window.MichelsLifeI18n.mapText;
    return {
      months:['January','February','March','April','May','June','July','August','September','October','November','December'].map(tr),
      weekdays:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(tr),
      weekdayAbbr:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(tr),
      compound:tr('Monday, September 28')
    };
  });
  ok(JSON.stringify(dateProbe.months)===JSON.stringify(['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']),'Month coverage failed: '+JSON.stringify(dateProbe));
  ok(JSON.stringify(dateProbe.weekdays)===JSON.stringify(['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']),'Weekday coverage failed: '+JSON.stringify(dateProbe));
  ok(JSON.stringify(dateProbe.weekdayAbbr)===JSON.stringify(['lun','mar','mié','jue','vie','sáb','dom']),'Weekday abbreviation coverage failed: '+JSON.stringify(dateProbe));
  ok(dateProbe.compound==='Lunes, Septiembre 28','Compound Spanish date failed: '+JSON.stringify(dateProbe));

  // Deterministic probes for dynamic/composite copy that may not be visible on
  // every CI run because it depends on time of day or yesterday's mission state.
  const dynamicProbe=await page.evaluate(()=>{
    const tr=window.MichelsLifeI18n.mapText;
    const inputs=[
      'You have 2 pending missions from yesterday.',
      'You have 1 pending mission from yesterday.',
      'You have 2 pendientes misiones from yesterday.',
      'Move them to today without creating duplicates.',
      'Move them to hoy without creating duplicates.',
      'Move all without duplicates',
      'One focused action is enough to change the reading of today.',
      'One focused action is enough to change the reading of hoy.',
      '🌇 Good afternoon, Michel · Mon, Sep 28 · One focused action is enough to change the reading of today.'
    ];
    return inputs.map(input=>({input,output:tr(input)}));
  });
  const expectedDynamic=[
    'Tienes 2 misiones pendientes de ayer.',
    'Tienes 1 misión pendiente de ayer.',
    'Tienes 2 misiones pendientes de ayer.',
    'Muévelas a hoy sin crear duplicados.',
    'Muévelas a hoy sin crear duplicados.',
    'Mover todas sin duplicados',
    'Una acción enfocada basta para cambiar cómo se lee el día.',
    'Una acción enfocada basta para cambiar cómo se lee el día.',
    '🌇 Buenas tardes, Michel · lun, sep 28 · Una acción enfocada basta para cambiar cómo se lee el día.'
  ];
  ok(JSON.stringify(dynamicProbe.map(x=>x.output))===JSON.stringify(expectedDynamic),
    'Dynamic Spanish translation probe failed:\n'+JSON.stringify(dynamicProbe,null,2));

  const findings=new Map();
  const routes=['dashboard','missions','contracts','calendar','journal','stats','compare','weekly-review','projects','achievements','affirmations','story','settings'];
  for(const route of routes){
    const beforeDiagCount=browserDiagnostics.length;
    await page.evaluate(r=>window.LeftNavV30171.route(r),route);
    await page.waitForTimeout(260);
    await page.evaluate(()=>window.MichelsLifeI18n.refresh());
    const routeDiagnostics=browserDiagnostics.slice(beforeDiagCount);
    if(routeDiagnostics.length)console.log('ROUTE_DIAGNOSTICS '+route+' '+JSON.stringify(routeDiagnostics));
    const bad=await auditSurface(route);
    if(bad.length)findings.set(route,bad);

    if(route==='missions'){
      const initials=await page.evaluate(()=>{
        function visible(el){const cs=getComputedStyle(el),r=el.getBoundingClientRect();return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)!==0&&r.width>0&&r.height>0}
        const scheduled=[...document.querySelectorAll('.v169-day-btn[data-day]')].filter(visible).map(el=>({day:Number(el.dataset.day),text:(el.textContent||'').trim(),title:el.getAttribute('title')||''}));
        const chipGroups=[];
        const parents=[...new Set([...document.querySelectorAll('.v137-day-chip')].filter(visible).map(el=>el.parentElement).filter(Boolean))];
        for(const p of parents){
          const chips=[...p.children].filter(el=>el.matches?.('.v137-day-chip')&&visible(el)).map(el=>(el.textContent||'').trim());
          if(chips.length>=7)chipGroups.push(chips.slice(0,7));
        }
        return {scheduled,chipGroups};
      });
      const byDay=['D','L','M','X','J','V','S'];
      const badScheduled=initials.scheduled.filter(x=>x.day>=0&&x.day<7&&x.text!==byDay[x.day]);
      if(badScheduled.length)findings.set('missions:scheduled-weekday-initials',badScheduled.map(x=>({kind:'weekday-initial',value:'day '+x.day+': '+x.text+' ('+x.title+')',tag:'button',cls:'v169-day-btn'})));
      const mondayFirst=['L','M','X','J','V','S','D'];
      const badGroups=initials.chipGroups.filter(g=>g.join('|')!==mondayFirst.join('|'));
      if(badGroups.length)findings.set('missions:repeat-weekday-initials',badGroups.map(g=>({kind:'weekday-initials',value:g.join(' '),tag:'button-group',cls:'v137-day-chip'})));
    }
  }

  await page.evaluate(()=>window.LeftNavV30171.route('settings'));
  await page.waitForSelector('[data-v30171-setting]',{timeout:10000});
  const settings=await page.evaluate(()=>[...document.querySelectorAll('[data-v30171-setting]')].map(x=>x.dataset.v30171Setting));
  for(const key of settings){
    await page.evaluate(k=>document.querySelector('[data-v30171-setting="'+k+'"]')?.click(),key);
    await page.waitForTimeout(220);
    await page.evaluate(()=>window.MichelsLifeI18n.refresh());
    const bad=await auditSurface('settings:'+key);
    if(bad.length)findings.set('settings:'+key,bad);
  }

  const modalLaunches=[
    {route:'missions',texts:['Nueva misión','Agregar una misión rápida','Captura rápida']},
    {route:'contracts',texts:['Agregar contrato','Nuevo contrato']},
    {route:'affirmations',texts:['Nueva frase']}
  ];
  for(const group of modalLaunches){
    await page.evaluate(r=>window.LeftNavV30171.route(r),group.route);
    await page.waitForTimeout(250);
    for(const label of group.texts){
      const clicked=await page.evaluate(label=>{
        const els=[...document.querySelectorAll('button,[role="button"]')];
        const el=els.find(x=>(x.textContent||'').replace(/\s+/g,' ').trim()===label);
        if(!el)return false; el.click(); return true;
      },label);
      if(!clicked)continue;
      await page.waitForTimeout(180);
      await page.evaluate(()=>window.MichelsLifeI18n.refresh());
      const bad=await auditSurface(group.route+':dialog:'+label);
      if(bad.length)findings.set(group.route+':dialog:'+label,bad);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }
  }

  if(findings.size){
    const report=[...findings.entries()].map(([k,v])=>'['+k+']\n'+v.map(x=>'  - '+x.kind+': '+x.value).join('\n')).join('\n\n');
    throw new Error('Exhaustive Spanish UI audit found untranslated UI:\n'+report);
  }

  console.log('OK: exhaustive Spanish UI audit passed routes, Settings, controls, attributes, dialogs and full date vocabulary');
} finally {
  await browser.close();
}
