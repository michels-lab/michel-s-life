import fs from 'node:fs';

const i18nPath='src/MichelsLife/frontend/i18n.js';
const installerPath='installer/MichelsLife.iss';
const src=fs.readFileSync(i18nPath,'utf8');
const installer=fs.readFileSync(installerPath,'utf8');

function fail(msg,items=[]){
  console.error(msg);
  for(const x of items) console.error('  - '+x);
  process.exitCode=1;
}

const pairRe=/"((?:\\.|[^"])*)"\s*:\s*"((?:\\.|[^"])*)"/g;
const pairs=[];
let m;
while((m=pairRe.exec(src))) pairs.push([m[1],m[2]]);

const spanishValues=pairs.map(x=>x[1]);

const bannedAnglicisms=/\b(app|apps|preset|presets|wallpaper|wallpapers|snapshot|snapshots|build|coach|gym|paper|papers|layout|preview|hover|badge|toast|timeline|feedback|checklist|dock|grid|card|cards|theme|themes|font|fonts|smart)\b/i;
const anglicismHits=spanishValues.filter(v=>bannedAnglicisms.test(v));
if(anglicismHits.length) fail('Avoidable English/anglicisms remain in Spanish copy:',[...new Set(anglicismHits)]);

const missingAccent=/\b(configuracion|mision|opcion|seccion|pagina|rapido|rapida|facil|dificil|proximo|proxima|ultimo|ultima|automatico|automatica|notificacion|descripcion|categoria|sesion|revision|historico|historica|tambien|despues|numero|metodo|analisis|energia|fisico|fisica|academico|academica|autonomia|dia)\b/i;
const accentHits=spanishValues.filter(v=>missingAccent.test(v));
if(accentHits.length) fail('Likely missing Spanish accents:',[...new Set(accentHits)]);

const badFormatting=spanishValues.filter(v=>/\s{2,}|\s+[,.!?;:]|[,;:]\s*[,;:]/.test(v));
if(badFormatting.length) fail('Spanish copy has suspicious spacing/punctuation:',[...new Set(badFormatting)]);

const missingOpeningQuestion=spanishValues.filter(v=>v.includes('?')&&!v.includes('¿'));
if(missingOpeningQuestion.length) fail('Spanish questions missing opening ¿:',[...new Set(missingOpeningQuestion)]);

const missingOpeningExclamation=spanishValues.filter(v=>v.includes('!')&&!v.includes('¡'));
if(missingOpeningExclamation.length) fail('Spanish exclamations missing opening ¡:',[...new Set(missingOpeningExclamation)]);

const agreementErrors=[
  /\bel misión\b/i,/\bla capítulo\b/i,/\bun misión\b/i,/\buna capítulo\b/i,
  /\blas misión\b/i,/\blos misión\b/i,/\blas contrato\b/i,/\blos afirmación\b/i,
  /\besta capítulo\b/i,/\beste misión\b/i,/\bmisiones principal\b/i,
  /\bmisiones vinculada\b/i,/\btareas vinculado\b/i,/\bdatos actual\b/i,
  /\bmisiones completado\b/i
];
const agreementHits=spanishValues.filter(v=>agreementErrors.some(rx=>rx.test(v)));
if(agreementHits.length) fail('Likely Spanish agreement errors:',[...new Set(agreementHits)]);

const awkward=[
  'muy reactivo',
  'completada solo',
  'misiones Principal',
  'agregarlas a hoy',
  'Semana actual hasta ahora',
  'Contado hoy',
  'de la app',
  'la app',
  'Restablecer app',
  'App restablecida'
];
const awkwardExact=new Set(['Completado manual']);
const awkwardHits=[];
for(const value of spanishValues){
  if(awkwardExact.has(value)) awkwardHits.push(value);
  for(const phrase of awkward){
    if(value.includes(phrase)) awkwardHits.push(value);
  }
}
if(awkwardHits.length) fail('Known awkward Spanish wording remains:',[...new Set(awkwardHits)]);

const requiredPairs=new Map([
  ['Monday','Lunes'],['Tuesday','Martes'],['Wednesday','Miércoles'],['Thursday','Jueves'],['Friday','Viernes'],['Saturday','Sábado'],['Sunday','Domingo'],
  ['January','Enero'],['February','Febrero'],['March','Marzo'],['April','Abril'],['May','Mayo'],['June','Junio'],['July','Julio'],['August','Agosto'],['September','Septiembre'],['October','Octubre'],['November','Noviembre'],['December','Diciembre']
]);
const pairMap=new Map(pairs);
for(const [en,es] of requiredPairs){
  if(pairMap.get(en)!==es) fail('Required date translation is missing or incorrect:',[en+' -> '+String(pairMap.get(en))+' (expected '+es+')']);
}

const spanishInstallerLines=installer.split(/\r?\n/).filter(l=>/^spanish\./i.test(l.trim()));
if(!spanishInstallerLines.length) fail('No Spanish installer custom messages found.');
const installerEnglish=/\b(create|desktop shortcut|additional icons|launch|open the|install|setup|next|back|cancel)\b/i;
const installerHits=spanishInstallerLines.filter(line=>{
  const value=line.includes('=')?line.slice(line.indexOf('=')+1):line;
  return installerEnglish.test(value);
});
if(installerHits.length) fail('English remains in Spanish installer custom messages:',installerHits);

if(process.exitCode) process.exit(process.exitCode);
console.log('OK: Spanish source copy audit passed '+pairs.length+' translation pairs and installer custom messages.');
