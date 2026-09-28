import fs from 'node:fs';
import vm from 'node:vm';

function ok(v,m){if(!v)throw new Error(m)}

function extractObject(source,name){
  const marker='const '+name+'=';
  const at=source.indexOf(marker);
  if(at<0)throw new Error('Missing '+name+' in i18n.js');
  const start=source.indexOf('{',at+marker.length);
  if(start<0)throw new Error('Missing object start for '+name);
  let depth=0, quote='', escaped=false;
  for(let i=start;i<source.length;i++){
    const ch=source[i];
    if(quote){
      if(escaped){escaped=false;continue}
      if(ch==='\\'){escaped=true;continue}
      if(ch===quote)quote='';
      continue;
    }
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='{')depth++;
    else if(ch==='}'){
      depth--;
      if(depth===0){
        const literal=source.slice(start,i+1);
        return Function('"use strict"; return ('+literal+');')();
      }
    }
  }
  throw new Error('Unclosed object '+name);
}

const store=new Map([
  ['michelsLife.onboarding.v30200','done'],
  ['michelsLife.language.v1','en'],
  ['michelsLife.installLanguage.v1','en'],
  ['michelsLife.languageOverrideBase.v1','en']
]);
const localStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k)
};
const document={
  readyState:'loading',
  body:null,
  documentElement:{lang:'en'},
  addEventListener(){},
  querySelector(){return null},
  querySelectorAll(){return []},
  getElementById(){return null},
  createElement(){return {style:{},dataset:{},classList:{add(){},remove(){}},setAttribute(){},querySelectorAll(){return []}}},
  head:{appendChild(){}}
};
const window={
  __MICHELSLIFE_INSTALL_LANGUAGE__:'en',
  dispatchEvent(){},
  addEventListener(){}
};
class MutationObserver{constructor(){} observe(){}}
class CustomEvent{constructor(type,init){this.type=type;this.detail=init?.detail}}
const sandbox={
  window,document,localStorage,
  navigator:{language:'en'},
  MutationObserver,CustomEvent,
  requestAnimationFrame:()=>0,
  setTimeout:()=>0,clearTimeout:()=>{},
  setInterval:()=>0,clearInterval:()=>{},
  console
};
sandbox.globalThis=sandbox;
const src=fs.readFileSync(new URL('../src/MichelsLife/frontend/i18n.js',import.meta.url),'utf8');
vm.runInNewContext(src,sandbox,{filename:'i18n.js'});
const api=sandbox.window.MichelsLifeI18n;
ok(api&&typeof api.mapText==='function','i18n API failed to initialize in logic harness');

function setLanguage(lang){ api.setLanguage(lang); }
function mapMany(inputs){ return inputs.map(x=>api.mapText(x)); }
function compareCases(label,cases,actual){
  const bad=[];
  for(let i=0;i<cases.length;i++){
    if(actual[i]!==cases[i].expected){
      bad.push({id:cases[i].id,input:cases[i].input,expected:cases[i].expected,actual:actual[i]});
      if(bad.length>=100)break;
    }
  }
  ok(!bad.length,label+' failed '+bad.length+' examples (first 100):\n'+JSON.stringify(bad,null,2));
}

const PAIRS=extractObject(src,'PAIRS');
  const SPANISH_SYSTEM_DEFAULTS=extractObject(src,'SPANISH_SYSTEM_DEFAULTS');
  const ENGLISH_SYSTEM_DEFAULTS=extractObject(src,'ENGLISH_SYSTEM_DEFAULTS');
  const pairs=Object.entries(PAIRS);

  // 1) Every canonical static English phrase must map exactly to its Spanish pair.
  setLanguage('es');
  const staticEsCases=pairs.map(([en,es],i)=>({id:'pair-es-'+i,input:en,expected:es}));
  compareCases('Canonical EN -> ES dictionary',staticEsCases,mapMany(staticEsCases.map(x=>x.input)));

  // 2) Every explicit system default must map exactly to Spanish.
  const defaultEsCases=Object.entries(SPANISH_SYSTEM_DEFAULTS).map(([en,es],i)=>({id:'default-es-'+i,input:en,expected:es}));
  compareCases('System-default EN -> ES',defaultEsCases,mapMany(defaultEsCases.map(x=>x.input)));

  // 3) Long stock phrases must also translate when embedded in larger dynamic nodes.
  const longPairs=pairs.filter(([en])=>/[.!?]/.test(en)||en.trim().split(/\s+/).length>=4);
  const embeddedEsCases=longPairs.map(([en,es],i)=>({id:'embedded-es-'+i,input:'⟦ '+en+' ⟧',expected:'⟦ '+es+' ⟧'}));
  compareCases('Embedded system EN -> ES',embeddedEsCases,mapMany(embeddedEsCases.map(x=>x.input)));

  const counts=[0,1,2,3,5,10,26,99];
  const toSpanish=[];

  // 4) Yesterday carry-over: all English/Spanish partial-token permutations.
  for(const n of counts){
    for(const lead of ['You have','Tienes'])
    for(const pending of ['pending','pendientes'])
    for(const mission of [n===1?'mission':'missions',n===1?'misión':'misiones'])
    for(const tail of ['from yesterday','de ayer']){
      toSpanish.push({
        id:'carry-'+n+'-'+lead+'-'+pending+'-'+mission+'-'+tail,
        input:`${lead} ${n} ${pending} ${mission} ${tail}.`,
        expected:`Tienes ${n} ${n===1?'misión pendiente':'misiones pendientes'} de ayer.`
      });
    }
  }

  // 5) Move/carry actions: every known mixed-language permutation.
  for(const lead of ['Move them to','Muévelas a'])
  for(const when of ['today','hoy'])
  for(const tail of ['without creating duplicates','without duplicating existing tasks','sin crear duplicados','sin duplicar tareas existentes']){
    toSpanish.push({id:'move-'+lead+'-'+when+'-'+tail,input:`${lead} ${when} ${tail}.`,expected:'Muévelas a hoy sin crear duplicados.'});
  }
  for(const lead of ['Move all','Mover todas'])
  for(const tail of ['without duplicates','sin duplicados']){
    toSpanish.push({id:'move-all-'+lead+'-'+tail,input:`${lead} ${tail}`,expected:'Mover todas sin duplicados'});
  }

  // 6) Generic progress templates exercised over all category/count combinations.
  const categories=[
    ['physical health','salud física'],['education / thesis','educación / tesis'],['career','carrera'],
    ['image / presence','imagen / presencia'],['culture / languages','cultura / idiomas'],
    ['order / execution','orden / ejecución'],['self-worth','amor propio'],
    ['emotional autonomy','autonomía emocional'],['mental strength','fortaleza mental']
  ];
  for(const [cat,esCat] of categories){
    for(const n of counts){
      toSpanish.push({
        id:'weekly-challenge-'+cat+'-'+n,
        input:`Complete the weekly ${cat} challenge ${n} ${n===1?'time':'times'}.`,
        expected:`Completa el reto semanal de ${esCat} ${n} ${n===1?'vez':'veces'}.`
      });
      toSpanish.push({
        id:'category-missions-'+cat+'-'+n,
        input:`Complete ${n} ${cat} missions.`,
        expected:`Completa ${n} ${n===1?'misión':'misiones'} de ${esCat}.`
      });
    }
  }
  for(const n of counts){
    toSpanish.push({id:'total-'+n,input:`Complete ${n} total missions.`,expected:`Completa ${n} ${n===1?'misión':'misiones'} en total.`});
    toSpanish.push({id:'consecutive-'+n,input:`Complete at least one mission per day for ${n} consecutive days.`,expected:`Completa al menos una misión por día durante ${n} días consecutivos.`});
    toSpanish.push({id:'xp-'+n,input:`Today +${n} XP`,expected:`Hoy +${n} XP`});
    toSpanish.push({id:'queued-'+n,input:`${n} queued`,expected:`${n} en cola`});
    toSpanish.push({id:'to-next-'+n,input:`${n}% to next`,expected:`${n}% para el siguiente nivel`});
    toSpanish.push({id:'days-'+n,input:`${n} days`,expected:`${n} días`});
    for(const max of [1,2,5,7,10,30]){
      toSpanish.push({id:'distinct-'+n+'-'+max,input:`${n}/${max} distinctDays this week`,expected:`${n}/${max} días distintos esta semana`});
      toSpanish.push({id:'count-'+n+'-'+max,input:`${n}/${max} count this week`,expected:`${n}/${max} conteo esta semana`});
      toSpanish.push({id:'times-'+n+'-'+max,input:`${n}/${max} times this week`,expected:`${n}/${max} veces esta semana`});
    }
  }

  // 7) Date/greeting/message cartesian product. The message list is discovered
  // from the real dictionary so newly added stock messages enter automatically.
  const dayparts=[['Good morning','Buenos días'],['Good afternoon','Buenas tardes'],['Good evening','Buenas noches'],['Late night','Noche tardía']];
  const days=[['Sun','dom'],['Mon','lun'],['Tue','mar'],['Wed','mié'],['Thu','jue'],['Fri','vie'],['Sat','sáb']];
  const months=[['Jan','ene'],['Feb','feb'],['Mar','mar'],['Apr','abr'],['May','may'],['Jun','jun'],['Jul','jul'],['Aug','ago'],['Sep','sep'],['Oct','oct'],['Nov','nov'],['Dec','dic']];
  const messages=pairs.filter(([en])=>/[.!?]$/.test(en)&&/\b(day|action|mission|tomorrow|progress|morning|reset|momentum)\b/i.test(en));
  for(const [g,gEs] of dayparts)
  for(const [d,dEs] of days)
  for(const [m,mEs] of months)
  for(const [msg,msgEs] of messages){
    toSpanish.push({
      id:'header-'+g+'-'+d+'-'+m+'-'+msg.slice(0,30),
      input:`🌇 ${g}, Michel · ${d}, ${m} 28 · ${msg}`,
      expected:`🌇 ${gEs}, Michel · ${dEs}, ${mEs} 28 · ${msgEs}`
    });
  }

  // 8) Known mixed-state corruption forms must heal to a single language.
  for(const [en,es] of messages){
    if(/\btoday\b/i.test(en)){
      toSpanish.push({id:'mixed-today-'+en.slice(0,40),input:en.replace(/\btoday\b/gi,'hoy'),expected:es});
    }
    if(/\btomorrow\b/i.test(en)){
      toSpanish.push({id:'mixed-tomorrow-'+en.slice(0,40),input:en.replace(/\btomorrow\b/gi,'mañana'),expected:es});
    }
    if(/\bmission(s)?\b/i.test(en)){
      toSpanish.push({id:'mixed-mission-'+en.slice(0,40),input:en.replace(/\bmissions\b/gi,'misiones').replace(/\bmission\b/gi,'misión'),expected:es});
    }
  }

  // Exact dictionary/default entries are the canonical wording whenever a
  // generated case happens to match one exactly.
  for(const c of toSpanish){
    if(Object.prototype.hasOwnProperty.call(PAIRS,c.input))c.expected=PAIRS[c.input];
    else if(Object.prototype.hasOwnProperty.call(SPANISH_SYSTEM_DEFAULTS,c.input))c.expected=SPANISH_SYSTEM_DEFAULTS[c.input];
  }
  compareCases('Generated/dynamic EN or mixed -> ES',toSpanish,mapMany(toSpanish.map(x=>x.input)));

  // Build a complete Spanish corpus from the exact expected outputs above.
  const spanishCorpus=[...new Set([
    ...Object.values(PAIRS),
    ...Object.values(SPANISH_SYSTEM_DEFAULTS),
    ...toSpanish.map(x=>x.expected),
    ...embeddedEsCases.map(x=>x.expected)
  ])];

  // 9) Switch to English. Every explicit reverse default must map exactly.
  setLanguage('en');
  const defaultEnCases=Object.entries(ENGLISH_SYSTEM_DEFAULTS).map(([es,en],i)=>({id:'default-en-'+i,input:es,expected:en}));
  compareCases('System-default ES -> EN',defaultEnCases,mapMany(defaultEnCases.map(x=>x.input)));

  // 10) Static Spanish values may be ambiguous (e.g. Mañana can mean Tomorrow or
  // Morning), so accept any canonical English key that maps to the same Spanish.
  const reverseGroups=new Map();
  for(const [en,es] of pairs){
    if(!reverseGroups.has(es))reverseGroups.set(es,new Set());
    reverseGroups.get(es).add(en);
  }
  const staticEsValues=[...reverseGroups.keys()];
  const staticEnActual=mapMany(staticEsValues);
  const staticReverseBad=[];
  for(let i=0;i<staticEsValues.length;i++){
    const es=staticEsValues[i],actual=staticEnActual[i],allowed=reverseGroups.get(es);
    if(!allowed.has(actual)){
      staticReverseBad.push({input:es,allowed:[...allowed],actual});
      if(staticReverseBad.length>=100)break;
    }
  }
  ok(!staticReverseBad.length,'Static ES -> EN canonical reverse failed:\n'+JSON.stringify(staticReverseBad,null,2));

  // 11) Generated dynamic Spanish must round-trip to exact canonical English.
  const toEnglish=[];
  for(const n of counts){
    toEnglish.push({id:'carry-en-'+n,input:`Tienes ${n} ${n===1?'misión pendiente':'misiones pendientes'} de ayer.`,expected:`You have ${n} pending ${n===1?'mission':'missions'} from yesterday.`});
  }
  toEnglish.push({id:'move-en',input:'Muévelas a hoy sin crear duplicados.',expected:'Move them to today without creating duplicates.'});
  toEnglish.push({id:'move-all-en',input:'Mover todas sin duplicados',expected:'Move all without duplicates'});
  for(const [g,gEs] of dayparts)
  for(const [d,dEs] of days)
  for(const [m,mEs] of months)
  for(const [msg,msgEs] of messages){
    toEnglish.push({
      id:'header-en-'+g+'-'+d+'-'+m+'-'+msg.slice(0,30),
      input:`🌇 ${gEs}, Michel · ${dEs}, ${mEs} 28 · ${msgEs}`,
      expected:`🌇 ${g}, Michel · ${d}, ${m} 28 · ${msg}`
    });
  }
  compareCases('Generated ES -> EN',toEnglish,mapMany(toEnglish.map(x=>x.input)));

  // 12) Round-trip stability for the complete system corpus: after ES -> EN -> ES,
  // the Spanish system phrase must return byte-for-byte to its original Spanish.
  const enFromSpanish=mapMany(spanishCorpus);
  setLanguage('es');
  const esAgain=mapMany(enFromSpanish);
  const roundTripBad=[];
  for(let i=0;i<spanishCorpus.length;i++){
    if(esAgain[i]!==spanishCorpus[i]){
      roundTripBad.push({spanish:spanishCorpus[i],english:enFromSpanish[i],spanishAgain:esAgain[i]});
      if(roundTripBad.length>=100)break;
    }
  }
  ok(!roundTripBad.length,'System corpus ES -> EN -> ES is unstable:\n'+JSON.stringify(roundTripBad,null,2));

  // 13) User-authored Spanish must not be opportunistically translated in English
  // merely because it contains a system word.
  setLanguage('en');
  const userSamples=[
    'Mi proyecto de septiembre',
    'Cena con amigos',
    'Trabajo en casa',
    'Mañana revisar la tesis',
    'Comida con Mariana',
    'Después del gimnasio',
    'Casa nueva',
    'Revisión personal de octubre'
  ];
  const userActual=mapMany(userSamples);
  const userBad=userSamples.map((input,i)=>({input,actual:userActual[i]})).filter(x=>x.input!==x.actual);
  ok(!userBad.length,'English mode modified user-authored Spanish samples:\n'+JSON.stringify(userBad,null,2));

  console.log(JSON.stringify({
    ok:true,
    staticPairs:pairs.length,
    defaultsEs:defaultEsCases.length,
    defaultsEn:defaultEnCases.length,
    embeddedPhrases:embeddedEsCases.length,
    generatedSpanish:toSpanish.length,
    generatedEnglish:toEnglish.length,
    roundTripCorpus:spanishCorpus.length,
    discoveredMessages:messages.length,
    totalAssertions:pairs.length+defaultEsCases.length+defaultEnCases.length+embeddedEsCases.length+toSpanish.length+toEnglish.length+spanishCorpus.length+userSamples.length
  },null,2));
