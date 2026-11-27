/* Michel's Life — personal alarms. Recurrence is independent of Pomodoro.
 * Android OS schedules notifications; Windows rings while the app is open.
 */
(function(){
'use strict';
if(window.MichelsLifeAlarms)return;
const KEY='michelsLife.alarms.v1';
const q=(s,r=document)=>r.querySelector(s);
const android=()=>document.documentElement.dataset.mlvPlatform==='android'||!!window.MichelsLifeAndroid;
const tr=(en,es)=>window.MichelsLifeI18n?.language==='es'?es:en;
const hhmm=x=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(x);
const validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(new Date(x+'T12:00:00').getTime());
const days=['Su','Mo','Tu','We','Th','Fr','Sa'];
const SOUNDS=['system','classic','soft','digital','gentle','pulse','radar',
 'focus_moonlight','focus_celestial','focus_orbit','focus_aurora','focus_observatory','focus_library','focus_afterglow','focus_silver',
 'mozart_k545','tchaikovsky_op39','sb_meanwhile','sb_moonlight','sb_cobalt','sb_skyward','sb_life_is','sb_first_snow','sb_midsommar','sb_at_the_end_of_all_things','sb_in_this_moment','sb_hyperion','sb_ascension','sb_bring_me_the_sky','debussy_clair_de_lune','chopin_nocturne_op9','satie_gymnopedie_1','bach_prelude_bwv846','custom'];
const SOUND_NAMES={system:['System default','Sistema'],classic:['Velvet Dawn · cinematic bells','Alba de terciopelo · campanas'],
 soft:['Glass Garden · dream chimes','Jardín de cristal · campanillas'],digital:['Neon Orbit · ambient synth','Órbita neón · sintetizador'],gentle:['First Light · gentle sunrise','Primera luz · amanecer'],
 pulse:['Inner Pulse · warm heartbeat','Pulso interior · latido cálido'],radar:['Celestial Tide · atmospheric','Marea celeste · atmosférico'],
 focus_moonlight:['Moonlight Study · ambient','Estudio lunar · ambiental'],
 focus_celestial:['Celestial Focus · ambient','Enfoque celestial · ambiental'],
 focus_orbit:['Quiet Orbit · ambient','Órbita tranquila · ambiental'],
 focus_aurora:['Aurora · ambient','Aurora · ambiental'],
 focus_observatory:['Observatory · ambient','Observatorio · ambiental'],
 focus_library:['Midnight Library · ambient','Biblioteca nocturna · ambiental'],
 focus_afterglow:['Afterglow · ambient','Resplandor · ambiental'],
 focus_silver:['Silver Room · ambient','Sala plateada · ambiental'],
 mozart_k545:['Mozart · Sonata K.545 · classical alarm','Mozart · Sonata K.545 · alarma clásica'],
 tchaikovsky_op39:['Tchaikovsky · Morning Prayer Op.39/1','Chaikovski · Oración matinal Op.39/1'],sb_meanwhile:["Meanwhile","Meanwhile"],
 sb_moonlight:["Moonlight","Moonlight"],
 sb_cobalt:["Cobalt","Cobalt"],
 sb_skyward:["Skyward","Skyward"],
 sb_life_is:["Life Is","Life Is"],
 sb_first_snow:["First Snow","First Snow"],
 sb_midsommar:["Midsommar","Midsommar"],
 sb_at_the_end_of_all_things:["At The End Of All Things","At The End Of All Things"],
 sb_in_this_moment:["In This Moment","In This Moment"],
 sb_hyperion:["Hyperion","Hyperion"],
 sb_ascension:["Ascension","Ascension"],
 sb_bring_me_the_sky:["Bring Me The Sky","Bring Me The Sky"],debussy_clair_de_lune:["Claude Debussy · Clair de Lune","Claude Debussy · Clair de Lune"],
 chopin_nocturne_op9:["Frédéric Chopin · Nocturne Op. 9 No. 2","Frédéric Chopin · Nocturne Op. 9 No. 2"],
 satie_gymnopedie_1:["Erik Satie · Gymnopédie No. 1","Erik Satie · Gymnopédie No. 1"],
 bach_prelude_bwv846:["Johann Sebastian Bach · Prelude in C major, BWV 846","Johann Sebastian Bach · Prelude in C major, BWV 846"],custom:['My MP3 / audio','Mi MP3 / audio']};
const soundName=id=>tr(...(SOUND_NAMES[id]||SOUND_NAMES.system));
const soundGroup=id=>id==='system'?0:id==='custom'?5:id.startsWith('focus_')?2:id.startsWith('sb_')?4:/^(mozart|tchaikovsky|debussy|chopin|satie|bach)_/.test(id)?3:1;
const soundGroupNames=()=>[tr('System','Sistema'),tr('Alarm tones','Tonos de alarma'),tr('Original ambience','Ambiente original'),tr('Classical recordings','Grabaciones clásicas'),tr('Ambient and cinematic recordings','Grabaciones ambientales y cinematográficas'),tr('My audio','Mi audio')];
function buildSoundPicker(select){
 const groups=soundGroupNames().map((label,i)=>{const g=document.createElement('optgroup');g.label=label;g.dataset.soundGroup=String(i);return g;});
 for(const id of SOUNDS){const option=document.createElement('option');option.value=id;option.textContent=soundName(id);groups[soundGroup(id)].appendChild(option);}
 select.replaceChildren(...groups.filter(g=>g.children.length));
}
// One collapsed attribution section in About, or bottom of Settings.
function mountAudioCredits(){
 const host=document.querySelector('#tab-settings [data-v30171-pane="about"] [data-mlv-about-core]');
 if(!host||host.querySelector('#mlv-about-audio-credits'))return;
 const details=document.createElement('details');details.id='mlv-about-audio-credits';
 details.style.cssText='margin:16px 0 4px;font-size:12px;max-width:100%;overflow-wrap:anywhere;';
 const summary=document.createElement('summary');summary.textContent=tr('Audio credits and licenses','Créditos y licencias de audio');
 const body=document.createElement('div');body.style.cssText='padding:8px 0;line-height:1.55;';
 details.append(summary,body);host.appendChild(details);
 details.addEventListener('toggle',async()=>{
  if(!details.open||body.dataset.loaded==='true'||body.dataset.loading==='true')return;
  body.dataset.loading='true';
  try{
   const manifests=await Promise.all(['RECORDINGS','LIBRARY','PIANO'].map(async name=>{
    const response=await fetch('assets/audio/classical/'+name+'.json');
    if(!response.ok)throw Error('Audio credits unavailable');
    return response.json();
   }));
   body.replaceChildren();
   for(const item of manifests.flat()){
    const row=document.createElement('p');row.style.margin='5px 0';
    row.append(document.createTextNode(item.title+' — '+item.performer+' · '));
    const license=document.createElement('a');license.href=item.license_url;license.textContent=item.license;license.target='_blank';license.rel='noopener noreferrer';
    const source=document.createElement('a');source.href=item.source_page;source.textContent=tr('Source','Fuente');source.target='_blank';source.rel='noopener noreferrer';
    row.append(license,document.createTextNode(' · '),source,document.createTextNode(' · '+(item.modifications||'MP3 conversion only')));
    body.appendChild(row);
   }
   body.dataset.loaded='true';
  }catch(_){body.textContent=tr('Audio credits: Scott Buckley (CC BY 4.0), Musopen, Wikimedia Commons and IMSLP. Reopen to retry full credits.','Créditos: Scott Buckley (CC BY 4.0), Musopen, Wikimedia Commons e IMSLP. Vuelve a abrir para reintentar.');}
  finally{delete body.dataset.loading;}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountAudioCredits,{once:true});else mountAudioCredits();
document.addEventListener('click',()=>setTimeout(mountAudioCredits,100),true);
let customAudio=null,previewAudio=null,customAudioUrl=null,previewAudioUrl=null;
let previewGeneration=0;
function localDateTime(at){
 const d=new Date(at);
 return {date:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),
  time:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
}
function customDatabase(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error('IndexedDB unavailable'));return;}
  const req=window.indexedDB.open('michelsLife.personalAlarmAudio.v1',1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('audio'))req.result.createObjectStore('audio');};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Audio storage unavailable'));
 });
}
async function saveCustomBlob(blob,name){
 const db=await customDatabase();
 try{await new Promise((resolve,reject)=>{const tx=db.transaction('audio','readwrite');
  tx.objectStore('audio').put({blob,name},'selected');tx.oncomplete=resolve;
  tx.onerror=()=>reject(tx.error||Error('Audio save failed'));tx.onabort=()=>reject(tx.error||Error('Audio save aborted'));});}
 finally{db.close();}
}
async function storedCustomBlob(){
 const db=await customDatabase();
 try{return await new Promise((resolve,reject)=>{const req=db.transaction('audio','readonly').objectStore('audio').get('selected');
  req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error||Error('Audio load failed'));});}
 finally{db.close();}
}
function readDataURL(part){return new Promise((resolve,reject)=>{
 const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(reader.error||Error('Could not read audio'));reader.readAsDataURL(part);
});}
const AUDIO_CHUNK_BYTES=256*1024; // transport block, never a maximum file size
let importingAudio=false;
function nativeResult(raw){const result=JSON.parse(raw||'{}');if(!result.ok)throw Error(result.error||'Native audio storage failed');return result;}
async function restoreCustomBlob(saved){
 if(saved?.blob)return saveCustomBlob(saved.blob,saved.name);
 const db=await customDatabase();
 try{await new Promise((resolve,reject)=>{const tx=db.transaction('audio','readwrite');tx.objectStore('audio').delete('selected');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}
}
async function importSound(file){
 if(!file||importingAudio)return false;
 if(!Number.isSafeInteger(file.size)||file.size<128||!/\.(mp3|wav|ogg)$/i.test(file.name)){
  window.alert(tr('Choose a valid MP3, WAV or OGG file.','Elige un archivo MP3, WAV u OGG válido.'));return false;
 }
 importingAudio=true;
 const input=screen&&q('#mlv-alarm-custom-file',screen),label=screen&&q('#mlv-alarm-custom-name',screen);
 const oldLabel=label?.textContent||'';if(input)input.disabled=true;
 const progress=percent=>{if(label)label.textContent=tr('Importing audio… ','Importando audio… ')+percent+'%';};
 let token=null,native=null,previous=null,webSaved=false,committed=false;
 try{
  if(android()){
   native=window.MichelsLifeAndroid;
   if(typeof native?.beginCustomAlarmSound!=='function'||typeof native?.appendCustomAlarmSound!=='function'||typeof native?.finishCustomAlarmSound!=='function'||typeof native?.cancelCustomAlarmSound!=='function')throw Error(tr('Update the Android app to import large audio files.','Actualiza la app de Android para importar archivos grandes.'));
   token=nativeResult(native.beginCustomAlarmSound(file.name.split('.').pop().toLowerCase(),String(file.size))).token;
   for(let offset=0;offset<file.size;offset+=AUDIO_CHUNK_BYTES){
    const part=file.slice(offset,Math.min(file.size,offset+AUDIO_CHUNK_BYTES));
    const data=await readDataURL(part),marker=data.indexOf(';base64,');
    if(marker<0)throw Error('Invalid audio chunk');
    nativeResult(native.appendCustomAlarmSound(token,String(offset),data.slice(marker+8)));
    progress(Math.floor(95*Math.min(file.size,offset+part.size)/file.size));
   }
  }
  // IDB stores the File as a Blob, not a full base64 string or ArrayBuffer.
  // Both platforms are bounded by actual storage capacity, not a product limit.
  previous=await storedCustomBlob();
  await saveCustomBlob(file,file.name.slice(0,100));webSaved=true;
  if(token){nativeResult(native.finishCustomAlarmSound(token));committed=true;}
  const select=screen&&q('#mlv-alarm-sound',screen);if(select)select.value='custom';
  if(label)label.textContent=file.name.slice(0,100);
  return true;
 }catch(e){
  if(webSaved&&!committed)try{await restoreCustomBlob(previous);}catch(_){}
  if(label)label.textContent=oldLabel;
  window.alert(tr('Could not save the audio (check available storage and file format): ','No se pudo guardar el audio (revisa el espacio disponible y el formato): ')+String(e.message||e));return false;
 }finally{
  if(token&&!committed)try{native.cancelCustomAlarmSound(token);}catch(_){}
  importingAudio=false;if(input)input.disabled=false;
 }
}
/* Michel's Life exclusive alarm suite v3 — six original, evolving 24s
   cinematic miniatures, NOT repeated calculator-style note pairs.
   Four harmonic chapters, warm pad, low heartbeat, melody, diffused bell
   echoes, stereo motion and gentle loudness rise. Fully synthesized offline
   from math: no samples, third-party recordings or internet dependency.
   Retain saved sound IDs and scheduling; native Android mirrors this score. */
const ALARM_SECONDS=24, ALARM_HZ=22050;
const ALARM_SCENES={
 classic:{roots:[174.61,130.81,146.83,174.61],minor:false,
  pattern:[2,4,3,1,2,4,3],offsets:[.17,1.02,1.89,2.83,3.71,4.53,5.27],timbre:'bell',drift:.17,accent:.90},
 soft:{roots:[146.83,116.54,130.81,146.83],minor:true,
  pattern:[3,4,2,3,4],offsets:[.28,1.55,2.73,3.9,5.15],timbre:'glass',drift:.26,accent:.72},
 digital:{roots:[164.81,130.81,146.83,164.81],minor:true,
  pattern:[4,2,3,1,2,4,3,2,4],offsets:[.14,.67,1.23,1.82,2.49,3.18,3.84,4.51,5.19],timbre:'shimmer',drift:.38,accent:.92},
 gentle:{roots:[130.81,174.61,146.83,196.00],minor:false,
  pattern:[1,2,3,4],offsets:[.42,1.78,3.28,4.8],timbre:'bell',drift:.14,accent:.78},
 pulse:{roots:[110.00,87.31,98.00,110.00],minor:true,
  pattern:[2,3,4,1,3],offsets:[.32,1.14,2.66,4.12,5.09],timbre:'bell',drift:.23,accent:.83},
 radar:{roots:[82.41,110.00,98.00,82.41],minor:true,
  pattern:[3,2,4,1],offsets:[.22,1.65,3.31,4.82],timbre:'shimmer',drift:.45,accent:.77},
 // The eight original Focus scenes now have native 24s alarm counterparts.
 // Roots and motifs match the existing Focus soundtrack; harmonic pads
 // evolve across the four bars while the motif is clearly recognizable.
 focus_moonlight:{roots:[220,174.61,196,220],minor:false,
  pattern:[0,2,1,3,2],offsets:[],timbre:'glass',drift:.16,accent:.73,
  ambientNotes:[220,329.63,440,493.88]},
 focus_celestial:{roots:[196,174.61,220,196],minor:false,
  pattern:[0,3,2,1,3],offsets:[],timbre:'shimmer',drift:.22,accent:.78,
  ambientNotes:[196,293.66,392,587.33]},
 focus_orbit:{roots:[174.61,146.83,196,174.61],minor:true,
  pattern:[1,2,0,2,3,2],offsets:[],timbre:'glass',drift:.31,accent:.72,
  ambientNotes:[174.61,261.63,349.23,523.25]},
 focus_aurora:{roots:[164.81,146.83,174.61,164.81],minor:true,
  pattern:[3,2,1,0,1],offsets:[],timbre:'shimmer',drift:.28,accent:.75,
  ambientNotes:[164.81,246.94,329.63,493.88]},
 focus_observatory:{roots:[146.83,130.81,164.81,146.83],minor:false,
  pattern:[0,1,3,2,0],offsets:[],timbre:'bell',drift:.13,accent:.75,
  ambientNotes:[146.83,220,293.66,440]},
 focus_library:{roots:[130.81,116.54,146.83,130.81],minor:true,
  pattern:[0,2,1,0,3,1],offsets:[],timbre:'glass',drift:.18,accent:.69,
  ambientNotes:[130.81,196,261.63,392]},
 focus_afterglow:{roots:[174.61,164.81,196,174.61],minor:false,
  pattern:[2,3,1,0,2],offsets:[],timbre:'bell',drift:.19,accent:.77,
  ambientNotes:[174.61,220,349.23,440]},
 focus_silver:{roots:[196,174.61,220,196],minor:true,
  pattern:[3,1,2,0,3,2],offsets:[],timbre:'glass',drift:.23,accent:.79,
  ambientNotes:[196,246.94,392,493.88]}

};
const SEMITONES={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function frequency(note){
 const match=/^([A-G])(#?)([0-8])$/.exec(note);
 if(!match)return 0;
 const midi=12*(Number(match[3])+1)+SEMITONES[match[1]]+(match[2]?1:0);
 return 440*Math.pow(2,(midi-69)/12);
}
const soundBufferCache=new Map();
let livePresetContext=null,previewPresetContext=null;
let liveRecording=null,previewRecording=null;
function stopRecording(preview){const audio=preview?previewRecording:liveRecording;if(preview)previewRecording=null;else liveRecording=null;if(audio){audio.pause();audio.currentTime=0;}}
function renderAlarmSoundscape(id){
 const score=ALARM_SCENES[id]||ALARM_SCENES.gentle;
 const count=ALARM_HZ*ALARM_SECONDS,left=new Float32Array(count),right=new Float32Array(count);
 const chord=score.minor?[1,1.18921,1.49831,1.78180,2.24492]:
  [1,1.25992,1.49831,2,2.24492];
 function voice(start,length,hz,level,kind,pan){
  if(!(length>0&&hz>0&&level>0))return;
  const lo=Math.max(0,Math.ceil(start*ALARM_HZ));
  const hi=Math.min(count,Math.floor((start+length)*ALARM_HZ));
  const leftGain=Math.sqrt((1-pan)*.5),rightGain=Math.sqrt((1+pan)*.5);
  const attack=kind==='pad'?.88:kind==='sub'?.11:kind==='swell'?.9:.018;
  const release=kind==='pad'||kind==='swell'?1.2:kind==='sub'?.22:.55;
  for(let i=lo;i<hi;i++){
   const t=i/ALARM_HZ-start;
   const envelope=Math.min(1,t/attack)*Math.min(1,(length-t)/release);
   if(envelope<=0)continue;
   const angle=2*Math.PI*hz*(t+.0018*Math.sin(2*Math.PI*score.drift*t));
   let wave;
   if(kind==='pad')wave=Math.sin(angle)+.25*Math.sin(angle*2.002+.4)+.07*Math.sin(angle*3.014+.9);
   else if(kind==='sub')wave=Math.sin(angle)+.13*Math.sin(angle*2);
   else if(kind==='glass')wave=Math.sin(angle)+.36*Math.sin(angle*2.76+.5)+.11*Math.sin(angle*4.18);
   else if(kind==='shimmer'||kind==='swell')wave=Math.sin(angle)+.31*Math.sin(angle*.997+.8)+.12*Math.sin(angle*1.503);
   else wave=Math.sin(angle)+.36*Math.sin(angle*2.009+.45)+.12*Math.sin(angle*3.981);
   const tail=(kind==='bell'||kind==='glass'||kind==='shimmer')?Math.exp(-t/(kind==='glass'?1.23:1.75)):1;
   const value=wave*envelope*tail*level;
   left[i]+=value*leftGain;right[i]+=value*rightGain;
  }
 }
 for(let bar=0;bar<4;bar++){
  const start=bar*6,root=score.roots[bar];
  // A full sustained chord, not one isolated oscillator at a time.
  for(let degree=0;degree<4;degree++)
   voice(start,5.98,root*chord[degree],.064*(degree===0?1.25:1),
     'pad',[-.56,.41,-.24,.62][degree]);
  voice(start,5.96,root*.5,.060,'sub',-.05);
  voice(start+.65,4.65,root*3.01,.020,'swell',bar%2?.55:-.55);
  const phrase=score.phrases?.[bar];
  const melody=phrase
   ? phrase.map((note,step)=>[start+.18+step*5.34/phrase.length,frequency(note)])
   : score.ambientNotes
     ? score.pattern.map((degree,step)=>[start+.20+step*5.4/score.pattern.length,score.ambientNotes[degree]])
     : score.pattern.map((degree,step)=>[start+score.offsets[step],root*2*chord[degree]]);
  for(let step=0;step<melody.length;step++){
   // Classical phrases use the same spatial echoes and evolving pad as original presets.
   const [t,hz]=melody[step];
   const gain=(.10+.028*(step%3===0))*score.accent*(bar===3?1.08:1);
   const pan=[-.48,.26,.58,-.34,.41,-.58,.18][step%7];
   voice(t,2.12,hz,gain,score.timbre,pan);
   // Studio-like diffused delay, not repeated hard beeps.
   voice(t+.31,1.78,hz*.998,gain*.27,score.timbre,-pan*.7);
   voice(t+.64,1.38,hz*1.002,gain*.12,score.timbre,pan*.4);
  }
  if(id==='pulse'){
   for(const beat of [.15,1.65,3.15,4.65])
    voice(start+beat,.80,root*.48,.062,'sub',beat%3?-.30:.30);
  }
  if(id==='radar'){
   voice(start+.20,5.4,root*2.26,.038,'swell',-.69);
   voice(start+1.35,4.3,root*2.98,.030,'swell',.69);
  }
 }
 let max=0;
 // Four phrases become progressively more present, without sharp attacks.
 for(let i=0;i<count;i++){
  const t=i/ALARM_HZ;
  const rise=.64+.36*Math.min(1,t/18);
  const edge=Math.min(1,t/.21,(ALARM_SECONDS-t)/.34);
  const l=Math.tanh(left[i]*rise)*edge,r=Math.tanh(right[i]*rise)*edge;
  left[i]=l;right[i]=r;max=Math.max(max,Math.abs(l),Math.abs(r));
 }
 const master=max>0?.81/max:1;
 for(let i=0;i<count;i++){left[i]*=master;right[i]*=master;}
 return {left,right,rate:ALARM_HZ,seconds:ALARM_SECONDS};
}
function stopPresetAudio(){
 stopRecording(false);
 if(livePresetContext){const ctx=livePresetContext;livePresetContext=null;ctx.close().catch(()=>{});}
}
function playPresetSound(id,preview=false){
 stopRecording(preview);
 if(['mozart_k545','tchaikovsky_op39','sb_meanwhile','sb_moonlight','sb_cobalt','sb_skyward','sb_life_is','sb_first_snow','sb_midsommar','sb_at_the_end_of_all_things','sb_in_this_moment','sb_hyperion','sb_ascension','sb_bring_me_the_sky','debussy_clair_de_lune','chopin_nocturne_op9','satie_gymnopedie_1','bach_prelude_bwv846'].includes(id)){
  if(!preview)stopPresetAudio();
  if(preview&&previewPresetContext){previewPresetContext.close().catch(()=>{});previewPresetContext=null;}
  try{const audio=new Audio('assets/audio/classical/'+id+'.mp3');audio.loop=!preview;if(preview)previewRecording=audio;else liveRecording=audio;audio.play().catch(()=>{if((preview?previewRecording:liveRecording)===audio)stopRecording(preview);});return true;}catch(_){return false;}
 }
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtx)return false;
 if(preview){
  if(previewPresetContext){previewPresetContext.close().catch(()=>{});previewPresetContext=null;}
 }else stopPresetAudio();
 const ctx=new AudioCtx();
 if(preview)previewPresetContext=ctx;else livePresetContext=ctx;
 try{
  const key=ALARM_SCENES[id]?id:'gentle';
  let sample=soundBufferCache.get(key);
  if(!sample){sample=renderAlarmSoundscape(key);soundBufferCache.set(key,sample);}
  const buffer=ctx.createBuffer(2,sample.left.length,sample.rate);
  buffer.getChannelData(0).set(sample.left);
  buffer.getChannelData(1).set(sample.right);
  const source=ctx.createBufferSource();source.buffer=buffer;
  source.connect(ctx.destination);
  const duration=preview?12:ALARM_SECONDS;
  source.start(ctx.currentTime+.015);
  source.stop(ctx.currentTime+.015+duration);
  window.setTimeout(()=>{
   if(previewPresetContext===ctx)previewPresetContext=null;
   if(livePresetContext===ctx)livePresetContext=null;
   ctx.close().catch(()=>{});
  },(duration+.22)*1000);
  return true;
 }catch(err){
  if(previewPresetContext===ctx)previewPresetContext=null;
  if(livePresetContext===ctx)livePresetContext=null;
  ctx.close().catch(()=>{});
  console.warn('Michel’s Life alarm audio unavailable',err);
  return false;
 }
}
function stopCustomAudio(isPreview=false){
 const audio=isPreview?previewAudio:customAudio;
 const url=isPreview?previewAudioUrl:customAudioUrl;
 if(isPreview){previewAudio=null;previewAudioUrl=null;}
 else{customAudio=null;customAudioUrl=null;}
 try{audio?.pause();}catch(_){}
 if(url)URL.revokeObjectURL(url);
}
async function playCustom(isPreview,requestGeneration=null){
 const saved=await storedCustomBlob().catch(()=>null);if(!saved?.blob)return false;
 if(isPreview&&requestGeneration!==null&&requestGeneration!==previewGeneration)return false;
 if(!isPreview&&(!ring||ring.hidden))return false;
 const url=URL.createObjectURL(saved.blob),audio=new Audio(url);audio.loop=!isPreview;
 stopCustomAudio(isPreview);
 if(isPreview){previewAudio=audio;previewAudioUrl=url;}
 else{customAudio=audio;customAudioUrl=url;}
 try{await audio.play();}
 catch(_){if((isPreview?previewAudio:customAudio)===audio)stopCustomAudio(isPreview);return false;}
 // Playback may settle after a preview is replaced or an alarm dismissed.
 if((isPreview?previewAudio:customAudio)!==audio)return false;
 if(!isPreview&&(!ring||ring.hidden||ringingId===null)){stopCustomAudio(false);return false;}
 if(isPreview)window.setTimeout(()=>{if(previewAudio===audio)stopCustomAudio(true);stopRecording(true);},5000);
 return true;
}
async function previewSound(id){
 const generation=++previewGeneration;
 stopCustomAudio(true);stopRecording(true);
 if(previewPresetContext){previewPresetContext.close().catch(()=>{});previewPresetContext=null;}
 if(id==='custom'){
  if(await playCustom(true,generation))return;
  if(generation!==previewGeneration)return;
  const native=window.MichelsLifeAndroid;
  if(typeof native?.previewPersonalAlarmSound==='function'&&native.previewPersonalAlarmSound('custom'))return;
  window.alert(tr('Import an MP3 first.','Primero importa un MP3.'));
 }else playPresetSound(id,true);
}
function createQuickAlarm(minutes){
 if(![5,10,15,30,60,120].includes(minutes)||records.length>=80)return false;
 const dueAt=Date.now()+minutes*60000,dt=localDateTime(dueAt);
 const item=normal({id:'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
  label:tr('Quick alarm','Alarma rápida')+' · '+(minutes>=60?minutes/60+'h':minutes+'min'),
  ...dt,dueAt,repeat:'once',days:[],sound:screen?.querySelector('#mlv-alarm-sound')?.value||'gentle',enabled:true});
 if(!item)return false;records.push(item);store();return true;
}

let records=[],screen=null,ring=null,launcher=null,editing=null,lastTick=Date.now(),shown=new Set(),pendingDueRings=[],nativeError='',nativeCache='',ready=false;
let windowsRingtone=null;
const windowsNotifications=[];
function normal(item){
  if(!item||! /^[a-zA-Z0-9_-]{1,64}$/.test(item.id)||!hhmm(item.time))return null;
  const repeat=['once','daily','weekly'].includes(item.repeat)?item.repeat:'once';
  const date=validDate(item.date)?item.date:'';
  const selected=Array.isArray(item.days)?[...new Set(item.days.map(Number).filter(x=>Number.isInteger(x)&&x>=0&&x<=6))].sort():[];
  if(repeat==='weekly'&&!selected.length)return null;
  if(repeat==='once'&&!date)return null;
  const sound=SOUNDS.includes(item.sound)?item.sound:'system';
  const dueAt=repeat==='once'&&Number.isSafeInteger(Number(item.dueAt))&&Number(item.dueAt)>0?Number(item.dueAt):0;
  return {id:item.id,label:String(item.label||'').slice(0,60),time:item.time,repeat,date,days:selected,sound,dueAt,enabled:!!item.enabled};
}
function localRead(){
  try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(data)?data.slice(0,80).map(normal).filter(Boolean):[];}catch(_){return [];}
}
function store(){
  try{localStorage.setItem(KEY,JSON.stringify(records));}catch(e){console.warn('Alarm save unavailable',e);}
  nativeCache='';
  syncNative();
  renderList();
}
function read(){
  const native=window.MichelsLifeAndroid;
  if(android()&&typeof native?.getPersonalAlarms==='function'){
    try{
      const result=JSON.parse(native.getPersonalAlarms()||'[]');
      if(Array.isArray(result)){
        const saved=result.map(normal).filter(Boolean);
        // Android's OS alarm registry is the authoritative source after an alarm rings.
        // It must not be silently rearmed from stale WebView storage on restart.
        records=saved;
        try{localStorage.setItem(KEY,JSON.stringify(records));}catch(_){}
        nativeCache=JSON.stringify(records);
        return;
      }
    }catch(e){nativeError=String(e);}
  }
  records=localRead();
  syncNative();
}
function syncNative(){
  const native=window.MichelsLifeAndroid;
  if(typeof native?.syncPersonalAlarms!=='function')return;
  const raw=JSON.stringify(records);
  if(nativeCache===raw)return;
  try{
    const result=JSON.parse(native.syncPersonalAlarms(raw)||'{}');
    if(result.error)throw Error(result.error);
    nativeCache=raw;nativeError='';
  }catch(e){nativeError=String(e);nativeCache='';console.warn('Android alarms unavailable',e);}
}
function localAt(item){
  const due=item.dueAt||new Date(item.date+'T'+item.time+':00').getTime();
  return Number.isFinite(due)?due:0;
}
function next(item,at=Date.now()){
  if(!item.enabled)return 0;
  if(item.repeat==='once'){
    const when=localAt(item);return when>at?when:0;
  }
  const [hour,min]=item.time.split(':').map(Number);
  for(let i=0;i<=7;i++){
    const day=new Date(at);day.setHours(hour,min,0,0);day.setDate(day.getDate()+i);
    if(day.getTime()<=at)continue;
    if(item.repeat==='daily'||item.days.includes(day.getDay()))return day.getTime();
  }
  return 0;
}
function rememberWallpaper(){
  if(!android())return;
  const raw=window.MichelsLifeFocusImmersive?.wallpaper?.()||'';
  const match=raw.match(/url\(\s*["']?([^)"']+)/i);
  if(!match)return;
  const path=match[1].replace(/^\.?\//,'').replace(/^app\//,'');
  if(/^assets\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp)$/i.test(path)&&!path.includes('..')){
    try{window.MichelsLifeAndroid?.rememberAlarmWallpaper?.(path);}catch(_){}
  }
}
function useWallpaper(element){
  window.MichelsLifeFocusImmersive?.applyWallpaper?.(element);
  rememberWallpaper();
}
function dateInput(){
  const d=new Date(),today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  return today;
}
function initialTime(){
  const d=new Date(Date.now()+3600000);
  return {time:String(d.getHours()).padStart(2,'0')+':00',
    date:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
}
function styles(){
 if(q('#mlv-personal-alarms-style'))return;
 const style=document.createElement('style');style.id='mlv-personal-alarms-style';
 style.textContent=`
#mlv-alarm-screen[hidden],#mlv-alarm-ring[hidden],#mlv-alarm-launcher[hidden]{display:none!important}
#mlv-alarm-screen,#mlv-alarm-ring{
 position:fixed!important;inset:0!important;z-index:2147483580!important;box-sizing:border-box!important;
 overflow:auto!important;color:#f5f9ff!important;
 background-color:#08101c!important;
 background-image:linear-gradient(125deg,#050a14ab,#050a1488,#050a14c9),var(--mlv-focus-wallpaper,none)!important;
 background-position:center!important;background-repeat:no-repeat!important;background-size:cover!important;
 display:flex!important;align-items:center!important;justify-content:center!important;
 padding:clamp(12px,3vw,35px)!important
}
#mlv-alarm-screen .mlv-alarm-panel{
 width:min(100%,780px);max-height:calc(100dvh - 25px);overflow:auto;padding:clamp(18px,3.5vw,34px);
 border:1px solid #ffffff55;border-radius:24px;background:#07101f99;backdrop-filter:blur(11px);
 box-shadow:0 18px 85px #0008;box-sizing:border-box
}
.mlv-alarm-heading{display:flex;align-items:start;justify-content:space-between;gap:12px}
.mlv-alarm-heading h2{font:850 clamp(25px,4vw,38px) system-ui,sans-serif;margin:3px 0 2px}
.mlv-alarm-heading p{font:400 13px system-ui,sans-serif;color:#d2dcf0;margin:4px 0 0}
.mlv-alarm-eyebrow{font:800 11px system-ui,sans-serif;letter-spacing:.16em;color:#a9dcff}
#mlv-alarm-screen button,#mlv-alarm-ring button,#mlv-alarm-launcher{
 min-height:45px;border:1px solid #ffffff50;border-radius:13px;background:#111c30e6;
 color:#fff;cursor:pointer;padding:9px 13px;font:700 14px system-ui,sans-serif
}
#mlv-alarm-screen button.primary,#mlv-alarm-ring button.primary{
 background:linear-gradient(125deg,#65d7ff,#ac84ff);border-color:transparent;color:#061224
}
#mlv-alarm-screen button:focus-visible,#mlv-alarm-ring button:focus-visible,#mlv-alarm-launcher:focus-visible{
 outline:3px solid #b9e6ff;outline-offset:2px
}
.mlv-alarm-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:18px 0;margin-top:9px;border-bottom:1px solid #ffffff35}
.mlv-alarm-form label{display:flex;flex-direction:column;gap:6px;font:700 13px system-ui,sans-serif}
.mlv-alarm-form input,.mlv-alarm-form select{min-width:0;min-height:46px;border:1px solid #ffffff54;border-radius:11px;
 background:#111d30;color:#fff;padding:8px 10px;font:600 16px system-ui,sans-serif;box-sizing:border-box}
.mlv-alarm-form input[type=date]{color-scheme:dark}
.mlv-alarm-form .full{grid-column:1/-1}
.mlv-alarm-days{display:flex;gap:6px;flex-wrap:wrap}
.mlv-alarm-days label{display:flex;flex-direction:row;align-items:center;gap:4px;padding:7px 9px;border-radius:9px;
 background:#ffffff16;cursor:pointer}
.mlv-alarm-days input{min-height:18px;height:18px;width:18px;accent-color:#87dbff}
.mlv-alarm-form .mlv-alarm-buttons{display:flex;gap:9px;flex-wrap:wrap}
.mlv-alarm-quick{display:flex;gap:7px;flex-wrap:wrap;padding:13px 0 8px;align-items:center}
.mlv-alarm-quick strong{flex-basis:100%;font:800 13px system-ui,sans-serif;color:#cde9f9}
.mlv-alarm-quick button{min-width:65px;flex:1 0 auto}
.mlv-alarm-sound-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.mlv-alarm-sound-row select{flex:1 1 240px;min-width:0;max-width:100%;width:auto}
.mlv-alarm-sound-row button{flex:0 0 auto}
#mlv-alarm-custom-file{display:block;min-height:0;padding:9px;max-width:100%;font-size:13px}
#mlv-alarm-custom-name{font:500 12px system-ui,sans-serif;opacity:.84;overflow-wrap:anywhere}
.mlv-alarm-count{font:750 14px system-ui,sans-serif;margin:18px 0 11px}
.mlv-alarm-list{display:grid;gap:10px}
.mlv-alarm-item{display:flex;gap:10px;align-items:center;padding:12px;border:1px solid #ffffff2f;
 border-radius:15px;background:#040a14a6}
.mlv-alarm-item .info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.mlv-alarm-item strong{font:800 18px system-ui,sans-serif;overflow-wrap:anywhere}
.mlv-alarm-item span,.mlv-alarm-item small{font:500 12px system-ui,sans-serif;color:#d7e0f1}
.mlv-alarm-item input[type=checkbox]{height:25px;width:25px;accent-color:#75e6ff;cursor:pointer}
.mlv-alarm-item .edit,.mlv-alarm-item .remove{min-width:45px}
.mlv-alarm-note{font:500 12px/1.45 system-ui,sans-serif;color:#c5d1e4;margin-top:14px}
#mlv-alarm-ring{text-align:center}
#mlv-alarm-ring .scene{display:flex;flex-direction:column;gap:23px;align-items:center;justify-content:center;
 padding:25px;min-height:75dvh;max-width:780px;text-shadow:0 6px 25px #000}
#mlv-alarm-ring .bell{font-size:clamp(50px,9vw,100px);animation:mlv-alarm-pulse 1.3s ease-in-out infinite}
#mlv-alarm-ring h2{font:850 clamp(35px,7vw,72px) system-ui,sans-serif;margin:0}
#mlv-alarm-ring strong{font:850 clamp(65px,12vw,136px)/1 system-ui,sans-serif;letter-spacing:-.045em}
#mlv-alarm-ring p{font:600 clamp(18px,3vw,28px) system-ui,sans-serif;margin:0}
#mlv-alarm-ring .actions{display:flex;gap:13px;justify-content:center;flex-wrap:wrap}
#mlv-alarm-launcher{
 position:fixed;right:157px;bottom:94px;z-index:2147483200;border-radius:16px;
 padding:10px 13px;box-shadow:0 10px 35px #0008;background:#091424ee;white-space:nowrap
}
/* Android has a dedicated navigation slot, never a floating content overlay.
   Keep the standalone launcher out of the viewport until the native bar mounts. */
html[data-mlv-platform=android] #mlv-alarm-launcher{display:none!important}
html[data-mlv-platform=android] #mlv-android-topbar:has(>#mlv-alarm-launcher){gap:5px;padding-inline:8px}
html[data-mlv-platform=android] #mlv-android-topbar>#mlv-alarm-launcher{
 display:grid!important;place-items:center;position:static!important;inset:auto!important;
 flex:0 0 44px;width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;
 margin:0!important;padding:0!important;border-radius:12px;box-shadow:none;font-size:19px;line-height:1;
 background:rgba(255,255,255,.07);touch-action:manipulation
}
html[data-mlv-platform=android] #mlv-android-topbar:has(>#mlv-alarm-launcher) .mlv-android-topbar-copy strong{
 white-space:nowrap;overflow:hidden;text-overflow:ellipsis
}
html[data-mlv-platform=android] body.mlv-android-focus-open #mlv-alarm-launcher,
html[data-mlv-platform=android] body.mlv-android-mission-edit-open #mlv-alarm-launcher,
html[data-mlv-platform=android] body.mlv-android-keyboard-editing #mlv-alarm-launcher,
html[data-mlv-platform=android] body:has(#mlv200Onboarding:not([hidden])) #mlv-alarm-launcher,
html[data-mlv-platform=android] body:has([data-mlv216-qc]:not([hidden])) #mlv-alarm-launcher{
 visibility:hidden;pointer-events:none
}
html[data-mlv-platform=android] #mlv-alarm-screen,html[data-mlv-platform=android] #mlv-alarm-ring{
 padding:calc(10px + env(safe-area-inset-top,0px)) 10px calc(13px + env(safe-area-inset-bottom,0px))!important
}
html[data-mlv-platform=android] .mlv-alarm-form{grid-template-columns:1fr 1fr}
html[data-mlv-platform=android] #mlv-alarm-screen .mlv-alarm-panel{max-height:100dvh}
body.mlv-alarm-visible{overflow:hidden!important}
@keyframes mlv-alarm-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.17)}}
@media(max-width:420px){.mlv-alarm-form{grid-template-columns:1fr}.mlv-alarm-item{flex-wrap:wrap}}
@media(prefers-reduced-motion:reduce){#mlv-alarm-ring .bell{animation:none}}
`;
 document.head.appendChild(style);
}
function create(){
 if(!document.body||screen)return;
 styles();
 screen=document.createElement('section');screen.id='mlv-alarm-screen';screen.hidden=true;
 screen.innerHTML=`
 <div class="mlv-alarm-panel" role="dialog" aria-modal="true" aria-labelledby="mlv-alarm-title">
 <header class="mlv-alarm-heading"><div><span class="mlv-alarm-eyebrow">MICHEL'S LIFE / ALARMS</span>
 <h2 id="mlv-alarm-title">Alarms</h2><p id="mlv-alarm-subtitle"></p></div>
 <button type="button" id="mlv-alarm-close" data-alarm-close>×</button></header>
 <div class="mlv-alarm-quick" id="mlv-alarm-quick"><strong id="mlv-alarm-quick-title">Quick Alarm · ring in</strong>
  <button type="button" data-quick-minutes="5">5 min</button><button type="button" data-quick-minutes="10">10 min</button>
  <button type="button" data-quick-minutes="15">15 min</button><button type="button" data-quick-minutes="30">30 min</button>
  <button type="button" data-quick-minutes="60">1 h</button><button type="button" data-quick-minutes="120">2 h</button></div>
 <form id="mlv-alarm-form" class="mlv-alarm-form">
 <label class="full"><span data-alarm-t="name">Name</span><input id="mlv-alarm-name" maxlength="60" autocomplete="off" /></label>
 <label><span data-alarm-t="time">Time</span><input id="mlv-alarm-time" type="time" required /></label>
 <label><span data-alarm-t="repeat">Repeat</span><select id="mlv-alarm-repeat">
  <option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly / selected days</option>
 </select></label>
 <label id="mlv-alarm-date-wrap"><span data-alarm-t="date">Date</span><input id="mlv-alarm-date" type="date" required /></label>
 <fieldset id="mlv-alarm-days-wrap" class="full" hidden><legend data-alarm-t="days">Days of the week</legend>
 <div class="mlv-alarm-days"></div></fieldset>
 <label class="full"><span data-alarm-t="sound">Alarm sound</span>
  <span class="mlv-alarm-sound-row"><select id="mlv-alarm-sound"></select><button type="button" id="mlv-alarm-preview">▶ Preview</button></span></label>
 <label class="full"><span data-alarm-t="upload">Upload your MP3 / audio</span>
  <input id="mlv-alarm-custom-file" type="file" accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg" />
  <small id="mlv-alarm-custom-name">MP3, WAV or OGG · available storage / espacio disponible</small></label>
 <div class="mlv-alarm-buttons full"><button type="submit" class="primary" id="mlv-alarm-save">Create alarm</button>
 <button type="button" id="mlv-alarm-cancel-edit" hidden>Cancel edit</button></div></form>
 <div class="mlv-alarm-count" id="mlv-alarm-count"></div><div id="mlv-alarm-list" class="mlv-alarm-list"></div>
 <p id="mlv-alarm-note" class="mlv-alarm-note"></p>
 <button type="button" id="mlv-alarm-permissions" hidden>Enable full-screen alarms over other apps</button>
 </div>`;
 ring=document.createElement('section');ring.id='mlv-alarm-ring';ring.hidden=true;
 ring.innerHTML=`
 <div class="scene" role="alertdialog" aria-modal="true" aria-labelledby="mlv-alarm-ring-title">
 <span class="bell" aria-hidden="true">⏰</span>
 <h2 id="mlv-alarm-ring-title"></h2><strong id="mlv-alarm-ring-clock"></strong>
 <p id="mlv-alarm-ring-label"></p><div id="mlv-alarm-motivation"></div><div class="actions">
 <button type="button" class="primary" data-ring-dismiss>Dismiss alarm</button>
 <button type="button" data-ring-snooze>Snooze 5 minutes</button></div></div>`;
 launcher=document.createElement('button');launcher.type='button';launcher.id='mlv-alarm-launcher';
 launcher.setAttribute('aria-label','Open alarms');launcher.textContent='⏰ Alarmas';
 launcher.addEventListener('click',open);
 for(let i=0;i<7;i++){
  const label=document.createElement('label'),check=document.createElement('input'),span=document.createElement('span');
  check.type='checkbox';check.value=String(i);if(i>=1&&i<=5)check.checked=true;
  span.dataset.alarmWeekday=String(i);span.textContent=days[i];label.append(check,span);
  q('.mlv-alarm-days',screen).appendChild(label);
 }
 const soundSelect=q('#mlv-alarm-sound',screen);
 buildSoundPicker(soundSelect);
 soundSelect.value='gentle';
 q('#mlv-alarm-preview',screen).addEventListener('click',()=>previewSound(soundSelect.value));
 q('#mlv-alarm-custom-file',screen).addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(file)await importSound(file);
  e.target.value='';
 });
 q('#mlv-alarm-repeat',screen).addEventListener('change',updateForm);
 q('#mlv-alarm-permissions',screen).addEventListener('click',()=>{
  try{window.MichelsLifeAndroid?.openPersonalAlarmPermissionSettings?.();}catch(_){}
 });
 screen.addEventListener('click',e=>{
  const target=e.target.closest('button');if(!target)return;
  if(target.hasAttribute('data-quick-minutes')){createQuickAlarm(Number(target.dataset.quickMinutes));return;}
  if(target.hasAttribute('data-alarm-close'))close();
  if(target.id==='mlv-alarm-cancel-edit')resetForm();
  const id=target.closest('[data-alarm-id]')?.dataset.alarmId;
  if(!id)return;
  if(target.classList.contains('remove')){
    records=records.filter(x=>x.id!==id);store();
  }
  if(target.classList.contains('edit')){const item=records.find(x=>x.id===id);if(item)fillForm(item);}
 });
 screen.addEventListener('change',e=>{
  if(!e.target.matches('[data-alarm-enabled]'))return;
  const item=records.find(x=>x.id===e.target.closest('[data-alarm-id]')?.dataset.alarmId);
  if(!item)return;
  item.enabled=e.target.checked;
  if(item.enabled&&item.repeat==='once'&&localAt(item)<=Date.now()){
    item.enabled=false;window.alert(tr('This one-time alarm is in the past. Edit its date and time.','Esta alarma ya pasó. Edita la fecha y hora.'));
  }
  store();
 });
 q('#mlv-alarm-form',screen).addEventListener('submit',e=>{
  e.preventDefault();
  const time=q('#mlv-alarm-time',screen).value;
  const date=q('#mlv-alarm-date',screen).value;
  const repeat=q('#mlv-alarm-repeat',screen).value;
  const selected=[...screen.querySelectorAll('.mlv-alarm-days input:checked')].map(x=>Number(x.value));
  if(!hhmm(time)||repeat==='once'&&!validDate(date)||repeat==='weekly'&&!selected.length){
    window.alert(tr('Select a valid date, time and weekdays.','Selecciona fecha, hora y días válidos.'));return;
  }
  const base=editing?records.find(a=>a.id===editing):null;
  const item=normal({id:base?.id||'a'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
   label:q('#mlv-alarm-name',screen).value,time,date,repeat,days:selected,sound:q('#mlv-alarm-sound',screen).value,enabled:true});
  if(!item)return;
  if(item.repeat==='once'&&localAt(item)<=Date.now()){
    window.alert(tr('Choose a future date and time.','Selecciona una fecha y hora futuras.'));return;
  }
  if(base)records=records.map(x=>x.id===base.id?item:x);
  else if(records.length<80)records.push(item);
  else{window.alert(tr('Maximum 80 alarms.','Máximo 80 alarmas.'));return;}
  store();resetForm();
 });
 q('[data-ring-dismiss]',ring).addEventListener('click',()=>dismissRing(false));
 q('[data-ring-snooze]',ring).addEventListener('click',()=>dismissRing(true));
 document.body.append(screen,ring,launcher);
 // The Android bar is created independently by android-bridge.js.
 // Use the same button, not a duplicate listener or overlay; handle either
 // module load order and topbar replacement. No observer on content churn.
 const dock=()=>{
  if(!android())return;
  const bar=document.getElementById('mlv-android-topbar');
  if(!bar||launcher.parentElement===bar)return;
  bar.insertBefore(launcher,bar.querySelector('.mlv-android-section-controls')||null);
  localize();
 };
 dock();
 if(android()){
  const dockObserver=new MutationObserver(dock);
  dockObserver.observe(document.body,{childList:true});
 }
 resetForm();renderList();
}
function updateForm(){
 const repeat=q('#mlv-alarm-repeat',screen).value;
 q('#mlv-alarm-date-wrap',screen).hidden=repeat!=='once';
 q('#mlv-alarm-date',screen).required=repeat==='once';
 q('#mlv-alarm-days-wrap',screen).hidden=repeat!=='weekly';
}
function resetForm(){
 if(!screen)return;
 editing=null;q('#mlv-alarm-form',screen).reset();
 const d=initialTime();
 q('#mlv-alarm-date',screen).value=d.date;q('#mlv-alarm-time',screen).value=d.time;
 q('#mlv-alarm-sound',screen).value='gentle';
 q('#mlv-alarm-cancel-edit',screen).hidden=true;
 updateForm();localize();
}
function fillForm(item){
 editing=item.id;
 q('#mlv-alarm-name',screen).value=item.label;
 q('#mlv-alarm-time',screen).value=item.time;
 q('#mlv-alarm-sound',screen).value=item.sound||'system';
 q('#mlv-alarm-repeat',screen).value=item.repeat;
 q('#mlv-alarm-date',screen).value=item.date||dateInput();
 screen.querySelectorAll('.mlv-alarm-days input').forEach(c=>c.checked=item.days.includes(Number(c.value)));
 q('#mlv-alarm-cancel-edit',screen).hidden=false;
 updateForm();localize();
 q('#mlv-alarm-name',screen).focus();
}
function localize(){
 if(!screen)return;
 const labels={name:['Name (optional)','Nombre (opcional)'],time:['Time','Hora'],repeat:['Repeat','Repetir'],date:['Date','Fecha'],days:['Days of the week','Días de la semana'],sound:['Alarm sound','Sonido de alarma'],upload:['Upload your MP3 / audio','Cargar mi MP3 / audio']};
 for(const [key,translation] of Object.entries(labels)){
  const node=q('[data-alarm-t="'+key+'"]',screen);if(node)node.textContent=tr(...translation);
 }
 const options=q('#mlv-alarm-repeat',screen).options;
 options[0].textContent=tr('Once','Una sola vez');
 options[1].textContent=tr('Daily','Todos los días');
 options[2].textContent=tr('Weekly / selected days','Semanal / elegir días');
 q('#mlv-alarm-sound',screen).querySelectorAll('option').forEach(option=>option.textContent=soundName(option.value));
 q('#mlv-alarm-sound',screen).querySelectorAll('optgroup').forEach(group=>group.label=soundGroupNames()[Number(group.dataset.soundGroup)]);
 q('#mlv-alarm-preview',screen).textContent=tr('▶ Preview','▶ Escuchar');
 q('#mlv-alarm-quick-title',screen).textContent=tr('Quick Alarm · ring in','Alarma rápida · sonar en');
 const esDays=['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
 screen.querySelectorAll('[data-alarm-weekday]').forEach(el=>el.textContent=
   window.MichelsLifeI18n?.language==='es'?esDays[Number(el.dataset.alarmWeekday)]:days[Number(el.dataset.alarmWeekday)]);
 q('#mlv-alarm-title',screen).textContent=tr('Alarms','Alarmas');
 q('#mlv-alarm-subtitle',screen).textContent=tr('Schedule one-time, daily or weekly reminders.','Programa alarmas únicas, diarias o semanales.');
 q('#mlv-alarm-close',screen).textContent=tr('Close','Cerrar');
 q('#mlv-alarm-save',screen).textContent=editing?tr('Save changes','Guardar cambios'):tr('Create alarm','Crear alarma');
 q('#mlv-alarm-cancel-edit',screen).textContent=tr('Cancel edit','Cancelar edición');
 const permission=q('#mlv-alarm-permissions',screen);
 permission.hidden=!android();
 permission.textContent=tr('Allow alarms over other apps / screen lock','Permitir alarmas sobre otras apps / pantalla bloqueada');
 if(android()){
  try{
   const status=JSON.parse(window.MichelsLifeAndroid?.personalAlarmStatus?.()||'{}');
   permission.hidden=status.notificationsGranted!==false&&status.overlayGranted===true&&status.fullScreen!==false&&status.exact!==false;
  }catch(_){}
 }
 q('#mlv-alarm-count',screen).textContent=tr('Alarms','Alarmas')+' · '+records.length;
 const launcherText=android()?'⏰':tr('⏰ Alarms','⏰ Alarmas');
 if(launcher.textContent!==launcherText)launcher.textContent=launcherText;
 launcher.setAttribute('aria-label',tr('Open alarms','Abrir alarmas'));
 launcher.title=tr('Alarms','Alarmas');
 q('#mlv-alarm-note',screen).textContent=(android()?
  tr('When the immersive alarm is visible, your selected original soundtrack plays. If the screen is locked or the overlay is unavailable, Android uses the system alarm channel as a safety fallback. Permissions and battery optimization may affect delivery.',
  'Cuando la alarma inmersiva está visible, suena la composición original que elegiste. Si la pantalla está bloqueada o no se permite la superposición, Android usa el canal de alarma del sistema como respaldo. Los permisos y el ahorro de batería pueden afectar el aviso.'):
  tr('On Windows, sound and the full-screen scene work while Michel’s Life is open. A closed app cannot ring.',
  'En Windows, el sonido y la pantalla inmersiva funcionan con Michel’s Life abierta. Cerrada no puede sonar.'))+
  (nativeError?' · '+nativeError:'');
}
function renderList(){
 if(!screen)return;localize();
 const root=q('#mlv-alarm-list',screen);root.replaceChildren();
 if(!records.length){
  const p=document.createElement('p');p.textContent=tr('You have no alarms yet.','Todavía no tienes alarmas.');root.append(p);return;
 }
 for(const item of [...records].sort((a,b)=>Number(b.enabled)-Number(a.enabled)||a.time.localeCompare(b.time))){
  const card=document.createElement('div');card.className='mlv-alarm-item';card.dataset.alarmId=item.id;
  card.innerHTML='<div class="info"><strong></strong><span></span><small></small></div>'+
    '<input type="checkbox" data-alarm-enabled aria-label="Enable alarm" />'+
    '<button type="button" class="edit"></button><button type="button" class="remove"></button>';
  q('strong',card).textContent=item.time+' · '+(item.label||tr('Alarm','Alarma'));
  q('span',card).textContent=item.repeat==='once'?tr('One time','Una vez'):
    item.repeat==='daily'?tr('Every day','Todos los días'):
    tr('Weekly','Semanal')+' · '+item.days.map(d=>tr(days[d],['Do','Lu','Ma','Mi','Ju','Vi','Sá'][d])).join(' ');
  const due=next(item);
  q('small',card).textContent=(!item.enabled?tr('Off','Desactivada'):
    due?new Date(due).toLocaleString(window.MichelsLifeI18n?.language==='es'?'es-MX':'en-US',
      {weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):
      tr('Needs a new date','Requiere otra fecha'))+' · '+soundName(item.sound);
  q('input',card).checked=item.enabled;
  q('input',card).setAttribute('aria-label',tr('Enable alarm','Activar alarma'));

  q('.edit',card).textContent=tr('Edit','Editar');
  q('.remove',card).textContent=tr('Delete','Eliminar');
  root.append(card);
 }
}
function open(){
 create();if(!screen)return false;
 useWallpaper(screen);screen.hidden=false;document.body.classList.add('mlv-alarm-visible');
 renderList();q('#mlv-alarm-close',screen).focus();return true;
}
function close(){
 if(!screen||screen.hidden)return false;
 screen.hidden=true;if(ring?.hidden)document.body.classList.remove('mlv-alarm-visible');
 return true;
}
let ringingId=null;
function ringAlarm(id,{notify=true}={}){
 create();
 const item=records.find(x=>x.id===id);
 if(!item)return false;
 ringingId=id;
 if(!android()&&notify)windowsNotifications.push({id:item.id,label:item.label||tr('Alarm','Alarma'),time:item.time,sound:item.sound});
 if(item.repeat==='once'&&item.enabled){item.enabled=false;store();}
 screen.hidden=true;ring.hidden=false;useWallpaper(ring);
 document.body.classList.add('mlv-alarm-visible');
 q('#mlv-alarm-ring-title',ring).textContent=tr('ALARM','ALARMA');
 q('#mlv-alarm-ring-clock',ring).textContent=item.dueAt?localDateTime(item.dueAt).time:item.time;
 q('#mlv-alarm-ring-label',ring).textContent=item.label||tr('Time to go','Es la hora');
 window.MichelsLifeMotivation?.render?.(q('#mlv-alarm-motivation',ring),'alarm:'+id+':'+item.time);
 q('[data-ring-dismiss]',ring).textContent=tr('Dismiss','Descartar');
 q('[data-ring-snooze]',ring).textContent=tr('Snooze 5 min','Posponer 5 min');
 q('[data-ring-dismiss]',ring).focus();
 if(!android()){
   if('Notification' in window&&Notification.permission==='granted'){
     try{new Notification('Michel’s Life · '+(item.label||tr('Alarm','Alarma')));}catch(_){}
   }
   // Keep audible reminder repeating until dismissed or snoozed. Windows
   // cannot ring from a closed application; Android has native OS delivery.
   if(windowsRingtone)window.clearInterval(windowsRingtone);
   // An alarm takes priority over the ringtone preview, including a slow
   // IndexedDB read that may still complete after the alarm begins.
   previewGeneration++;
   stopCustomAudio(true);stopRecording(true);
   if(previewPresetContext){previewPresetContext.close().catch(()=>{});previewPresetContext=null;}
   stopPresetAudio();
   stopCustomAudio(false);
   const selectedSound=item.sound||'system';
   let useSystemFallback=false;
   if(selectedSound==='custom')playCustom(false).then(ok=>{
     if(!ok&&ringingId===id&&!ring.hidden){
       useSystemFallback=true;
       playPresetSound('system');
     }
   });
   const tone=()=>{
     if(ring.hidden){window.clearInterval(windowsRingtone);windowsRingtone=null;return;}
     try{if(selectedSound!=='custom'||useSystemFallback)
       playPresetSound(useSystemFallback?'system':selectedSound);}catch(_){}
   };
   tone();windowsRingtone=window.setInterval(tone,24000);
 }
 return true;
}
function dismissRing(snooze){
 if(!ring||ring.hidden)return;
 if(snooze&&(!records.some(x=>x.id===ringingId)||records.length>=80)){
  window.alert(tr('Could not snooze. The alarm is still active.','No se pudo posponer. La alarma sigue activa.'));return;
 }
 if(windowsRingtone){window.clearInterval(windowsRingtone);windowsRingtone=null;}
 stopPresetAudio();
 stopCustomAudio(false);
 if(snooze&&ringingId){
  const item=records.find(x=>x.id===ringingId);
  if(item){
   const dueAt=Date.now()+5*60000,when=new Date(dueAt);
   const date=when.getFullYear()+'-'+String(when.getMonth()+1).padStart(2,'0')+'-'+String(when.getDate()).padStart(2,'0');
   const time=String(when.getHours()).padStart(2,'0')+':'+String(when.getMinutes()).padStart(2,'0');
   const snoozed={id:'s'+Date.now().toString(36),label:item.label||tr('Snoozed alarm','Alarma pospuesta'),
     date,time,dueAt,repeat:'once',days:[],sound:item.sound||'system',enabled:true};
   records.push(snoozed);store();
  }
 }
 try{window.MichelsLifeAndroid?.dismissPersonalAlarm?.(ringingId||'');}catch(_){}
 if(ringingId){for(let i=windowsNotifications.length-1;i>=0;i--)if(windowsNotifications[i].id===ringingId)windowsNotifications.splice(i,1)}
 ring.hidden=true;ringingId=null;document.body.classList.remove('mlv-alarm-visible');
 // Present any simultaneous alarm after this one is dismissed without dropping it.
 ringNextDue();
}
function collectDueAlarms(start,now){
 const dueAlarms=[];
 for(const item of records){
  if(!item.enabled)continue;
  let due=0;
  if(item.repeat==='once')due=localAt(item);
  else{
   const [hour,minute]=item.time.split(':').map(Number);
   const occurrence=new Date(now);occurrence.setHours(hour,minute,0,0);
   if(occurrence.getTime()>now)occurrence.setDate(occurrence.getDate()-1);
   due=occurrence.getTime();
   if(item.repeat==='weekly'&&!item.days.includes(occurrence.getDay()))continue;
  }
  const key=item.id+':'+due;
  if(due>start&&due<=now&&!shown.has(key)){
   shown.add(key);dueAlarms.push(item);
  }
 }
 return dueAlarms;
}
function ringNextDue(){
 if(ringingId||android())return;
 while(pendingDueRings.length){
  const id=pendingDueRings.shift();
  const item=records.find(x=>x.id===id);
  if(item?.enabled&&ringAlarm(id,{notify:false}))return;
 }
}
function tick(){
 if(!screen||android())return;
 const now=Date.now();
 if(now<lastTick){lastTick=now;return;}
 // Catch every due alarm, including multiple reminders with the same deadline.
 // Keep Windows tray notifications independent of sequential full-screen rings.
 const start=Math.max(lastTick,now-15*60*1000);
 for(const item of collectDueAlarms(start,now)){
  windowsNotifications.push({id:item.id,label:item.label||tr('Alarm','Alarma'),time:item.time,sound:item.sound});
  pendingDueRings.push(item.id);
 }
 lastTick=now;
 if(shown.size>256)shown.clear();
 ringNextDue();
}
function takeWindowsNotification(){
 // The native tray polls this even if the web timer was throttled.
 if(android())return null;
 tick();
 return windowsNotifications.shift()||null;
}
let lastLauncherGesture=0;
function captureAlarmLauncher(event){
 if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
 const button=event.target?.closest?.('#mlv-alarm-launcher');
 if(!button||button.disabled)return;
 event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
 const now=Date.now();
 if(event.type==='click'&&now-lastLauncherGesture<400)return;
 lastLauncherGesture=now;open();
}
// Do not hide the launcher on pointerdown; the browser must finish its click.
window.addEventListener?.('click',captureAlarmLauncher,true);
window.addEventListener?.('keydown',captureAlarmLauncher,true);
function boot(){
 if(ready)return;ready=true;
 read();create();
 rememberWallpaper();window.addEventListener('load',rememberWallpaper,{once:true});
 // Android receives a system notification; the page timer is only a foreground mirror.
 window.setInterval(tick,900);
 window.addEventListener('focus',()=>{syncNative();renderList();});
 window.addEventListener('michelslife:languagechange',()=>{localize();renderList();});
 // If installer language is reconciled after a first paint, refresh accessibility copy.
 const observer=new MutationObserver(()=>{if(screen)localize();});
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(ring&&!ring.hidden){e.preventDefault();dismissRing(false);}
  else if(screen&&!screen.hidden){e.preventDefault();close();}
 });
}
function isAudible(){
 return !!ring&&!ring.hidden&&ringingId!==null&&(
  (livePresetContext?.state==='running')||(!!liveRecording&&!liveRecording.paused)||(!!customAudio&&!customAudio.paused));
}
window.MichelsLifeAlarms={open,close,ringAlarm,read,records:()=>records.slice(),next,localAt,dismissRing,quickAlarm:createQuickAlarm,pollWindows:tick,takeWindowsNotification,isAudible};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();