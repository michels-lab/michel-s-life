import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const focusSource=readFileSync('src/MichelsLife/frontend/focus-immersive.js','utf8');
const html=readFileSync('src/MichelsLife/frontend/index.html','utf8');
const legacy=['moonlight','celestial','orbit','aurora','observatory','library','afterglow','silver'];
const classical=['mozart_k545','tchaikovsky_op39'];
const library=['sb_meanwhile','sb_moonlight','sb_cobalt','sb_skyward','sb_life_is','sb_first_snow','sb_midsommar','sb_at_the_end_of_all_things','sb_in_this_moment','sb_hyperion','sb_ascension','sb_bring_me_the_sky'];
const piano=['debussy_clair_de_lune','chopin_nocturne_op9','satie_gymnopedie_1','bach_prelude_bwv846'];
const all=new Set([...legacy,...library,...piano,...classical]);
const classicalCollection=[...piano,...classical];

function harness(persisted={v30165Soundscape:'moonlight',v30165CompletionSound:'soft'}){
  const frequencies=[],startTimes=[],contexts=[],timers=new Map(),buffers=[],sources=[],gains=[],timeouts=new Map();
  let timerCounter=0;
  class AudioContext{
    constructor(){this.currentTime=0;this.state='running';this.destination={};this.closed=false;contexts.push(this);}
    resume(){return Promise.resolve();}
    close(){this.closed=true;this.state='closed';return Promise.resolve();}
    createBuffer(channels,length,rate){const samples=new Float32Array(length);const buffer={samples,length,rate,getChannelData(){return samples;}};buffers.push(buffer);return buffer;}
    createBufferSource(){const source={stopped:false,connect(){},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(source);return source;}
    createOscillator(){
      return {type:'sine',frequency:{setValueAtTime(freq,time){frequencies.push(freq)}},
        connect(){},start(time){startTimes.push(time)},stop(){}};
    }
    createGain(){
      const gain={value:NaN,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};gains.push(gain);return {gain,connect(){}};
    }
  }
  const recordings=[];
  class Audio{constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.playCalls=0;recordings.push(this);}play(){this.playCalls++;this.paused=false;return Promise.resolve();}pause(){this.paused=true;}removeAttribute(name){if(name==='src')this.src='';}load(){this.released=true;}}
  const window={
    AudioContext,Audio,
    FocusStoryV30162:{
      focusState:()=>persisted,
      setAudioPreference(kind,value){
        if(kind==='scene')persisted.v30165Soundscape=all.has(value)||/^my_[a-f0-9]{32}$/.test(value)?value:'moonlight';
        else if(kind==='completion')persisted.v30165CompletionSound=value;
        else if(kind==='ambientVolume')persisted.v30165AmbientVolume=value;
        else if(kind==='ambientMode')persisted.v30165AmbientMode=value;
        else if(kind==='ambientCollection')persisted.v30165AmbientCollection=value;
        else if(kind==='archivedAmbient')persisted.v30165ArchivedAmbient=Array.from(value);
        return true;
      }
    },
    setInterval(fn){const id=++timerCounter;timers.set(id,fn);return id},
    clearInterval(id){timers.delete(id)},
    setTimeout(fn){const id=++timerCounter;timeouts.set(id,fn);return id},clearTimeout(id){timeouts.delete(id)},addEventListener(){}
  };
  window.window=window;
  window.document={readyState:'loading',documentElement:{dataset:{mlvPlatform:'android'}},querySelector(){return null},addEventListener(){}};
  vm.runInNewContext(focusSource,window,{filename:'focus-immersive.js'});
  return {api:window.MichelsLifeFocusAudio,frequencies,startTimes,contexts,timers,persisted,buffers,sources,recordings,gains,timeouts,window};
}


test('all eighteen licensed recordings are ambience and canonical preferences accept both classical IDs',()=>{
 const f=harness();assert.deepEqual(Array.from(f.api.sceneOptions(),o=>o.id),[...legacy,...library,...piano,...classical]);
 for(const id of classical){assert.equal(f.api.selectScene(id),id);assert.equal(f.api.startAmbient(),true);assert.equal(f.recordings.at(-1).src,'assets/audio/classical/'+id+'.mp3');f.api.stopAmbient();}
 const pref=html.match(/function setAudioPreference\(kind,value\)\{[\s\S]*?\n\}/)?.[0];assert.ok(pref);assert.match(pref.split("kind==='scene'")[1],/mozart_k545.*tchaikovsky_op39/);
});
test('expiry always rings bells, even for legacy music or off preferences',()=>{
 for(const id of [...classical,'off']){const f=harness({v30165Soundscape:'moonlight',v30165CompletionSound:id,v30165Sound:false});assert.equal(f.api.playCompletion(false,'work'),true);assert.equal(f.recordings.length,0);assert.equal(f.frequencies.length,12);assert.equal(f.api.previewingCompletion(),null);}
 const f=harness();f.api.playCompletion(false,'break');assert.equal(f.frequencies.length,12);assert.notEqual(f.frequencies[0],783.99);
});
test('full licensed recordings have provenance and byte-identical native and web files',()=>{
 const folder='src/MichelsLife/frontend/assets/audio/classical/';
 const manifest=JSON.parse(readFileSync(folder+'RECORDINGS.json','utf8'));
 assert.equal(manifest.length,2);
 for(const id of classical){
  const item=manifest.find(x=>x.id===id);assert.ok(item?.performer&&item?.license_url&&item?.source_sha256);
  assert.ok(item.duration_seconds>110);
  const web=readFileSync(folder+id+'.mp3'),native=readFileSync('android/app/src/main/res/raw/mlv_focus_'+id+'.mp3');
  assert.ok(web.length>500000);assert.deepEqual(web,native);
  assert.equal(createHash('sha256').update(web).digest('hex'),item.asset_sha256);
  assert.match(item.modifications,/no synthesis/);
 }
 assert.doesNotMatch(focusSource,/renderClassicalPiano|classicalScores/);
});
test('eight original ambient tracks still support selection, start/stop and a single scheduler',()=>{
 const f=harness();
 for(const id of legacy){
   const previous=f.contexts.at(-1);
   assert.equal(f.api.toggleScene(id),true);
   assert.equal(f.api.playingScene(),id);assert.equal(f.timers.size,1);
   if(previous)assert.equal(previous.closed,true);
 }
 assert.equal(f.api.toggleScene('silver'),true);assert.equal(f.timers.size,0);
});
test('both focus templates keep clock, motivation and ambient toggle outside the audio drawer',()=>{
 const mobile=readFileSync('android/mobile-experience.js','utf8');
 for(const [s,clock,motivation,toggle,drawer] of [[focusSource,'id="mlv-desktop-focus-clock"','id="mlv-desktop-focus-motivation"','data-mlv-audio="toggle-ambient">Play','<details class="mlv-focus-sound-details"'],[mobile,'id="mlv-android-focus-time"','id="mlv-android-focus-motivation"','data-mobile-focus="toggle-ambient">Play','<details class="mlv-android-focus-sounds"']]){assert.ok(s.indexOf(clock)>0&&s.indexOf(clock)<s.indexOf(motivation)&&s.indexOf(motivation)<s.indexOf(toggle)&&s.indexOf(toggle)<s.indexOf(drawer));assert.doesNotMatch(s,/<select (?:id="mlv-focus-completion-select"|data-mobile-focus-completion)/);}
});


test('phase bells preserve original ambience and do not launch any completion recording',()=>{
 const f=harness();f.api.startAmbient();const ctx=f.contexts.at(-1);f.api.selectCompletion(classical[0]);assert.equal(f.api.playCompletion(false),true);assert.equal(ctx.closed,false);assert.equal(f.api.playingScene(),'moonlight');assert.equal(f.recordings.length,0);assert.equal(f.timers.size,1);
});


test('recorded ambience continues at ducked volume through the phase bell',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();const p=f.recordings.at(-1);f.api.setAmbientVolume(.2);assert.equal(p.volume,.2);p.currentTime=45;f.api.selectCompletion('off');assert.equal(f.api.playCompletion(false),true);assert.equal(p.paused,false);assert.equal(p.currentTime,45);assert.equal(f.api.playingScene(),library[0]);assert.equal(p.volume,.048);assert.equal(f.recordings.length,1);
});
test('all library recordings have hash provenance and same native/web audio',()=>{
 const folder='src/MichelsLife/frontend/assets/audio/classical/';
 const manifest=JSON.parse(readFileSync(folder+'LIBRARY.json','utf8'));
 assert.deepEqual(manifest.map(x=>x.id),library);
 for(const item of manifest){const bytes=readFileSync(folder+item.id+'.mp3');assert.ok(bytes.length>100000);assert.deepEqual(bytes,readFileSync('android/app/src/main/res/raw/mlv_focus_'+item.id+'.mp3'));assert.equal(createHash('sha256').update(bytes).digest('hex'),item.asset_sha256);assert.equal(item.license,'CC BY 4.0');assert.ok(item.duration_seconds>30);}
});


test('playlist, pause/resume, track navigation and saved volume preserve the canonical timer settings',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.setAmbientVolume(.17);f.api.setAmbientMode('playlist');
 assert.equal(harness(f.persisted).api.ambientVolume(),.17);assert.equal(harness(f.persisted).api.ambientMode(),'playlist');
 f.api.startAmbient();const first=f.recordings.at(-1);assert.equal(first.loop,false);assert.equal(first.volume,.17);
 first.currentTime=12;f.api.toggleAmbientPlayback();assert.equal(first.paused,true);f.api.toggleAmbientPlayback();assert.equal(first.paused,false);assert.equal(first.currentTime,12);
 first.paused=true;first.onended();const second=f.recordings.at(-1);assert.equal(second.paused,false,'natural end must auto-play next');assert.equal(f.api.playingScene(),library[1]);assert.equal(first.paused,true);
 f.api.moveAmbient(-1);assert.equal(second.paused,true);assert.equal(f.api.playingScene(),library[0]);
 f.api.setAmbientMode('repeat');assert.equal(f.recordings.at(-1).loop,true);
 f.api.stopAmbient();assert.equal(f.api.playing(),false);assert.equal(f.timers.size,0);
});


test('piano collection supports ambience, completion and verified native assets',()=>{
 const f=harness(),folder='src/MichelsLife/frontend/assets/audio/classical/';
 const manifest=JSON.parse(readFileSync(folder+'PIANO.json','utf8'));
 assert.deepEqual(manifest.map(x=>x.id),piano);
 for(const item of manifest){const id=item.id,bytes=readFileSync(folder+id+'.mp3');assert.equal(createHash('sha256').update(bytes).digest('hex'),item.asset_sha256);assert.deepEqual(bytes,readFileSync('android/app/src/main/res/raw/mlv_focus_'+id+'.mp3'));assert.ok(item.performer&&item.license_url&&item.source_page);assert.equal(f.api.selectScene(id),id);assert.equal(f.api.startAmbient(),true);assert.equal(f.recordings.at(-1).loop,true);assert.equal(f.api.playCompletion(),true);assert.equal(f.recordings.at(-1).loop,true);}
});


test('shuffle traverses a selected piano collection without repeating before exhausting it',()=>{
 const f=harness();f.api.setAmbientCollection('Classical');f.api.setAmbientMode('shuffle');assert.equal(f.api.sceneId(),piano[0]);
 assert.equal(harness(f.persisted).api.ambientCollection(),'Classical');assert.equal(harness(f.persisted).api.ambientMode(),'shuffle');
 f.api.startAmbient();const seen=new Set([f.api.playingScene()]);for(let i=1;i<classicalCollection.length;i++){f.recordings.at(-1).onended();const id=f.api.playingScene();assert.ok(classicalCollection.includes(id));assert.ok(!seen.has(id));seen.add(id);}
 const previous=f.api.playingScene();f.api.moveAmbient(-1);assert.notEqual(f.api.playingScene(),previous);assert.ok(classicalCollection.includes(f.api.playingScene()));f.api.stopAmbient();
 f.api.selectScene(library[0]);assert.equal(f.api.ambientCollection(),'all');
});


test('manual next skips an active track in repeat mode without modifying timer or completion; paused skip stays paused',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.selectCompletion(classical[0]);f.api.setAmbientMode('repeat');f.api.startAmbient();
 const first=f.recordings.at(-1);f.api.moveAmbient(1);assert.equal(first.paused,true);assert.equal(f.api.playingScene(),library[1]);assert.equal(f.recordings.at(-1).loop,true);assert.equal(f.api.completionId(),classical[0]);
 f.api.toggleAmbientPlayback();f.api.moveAmbient(1);assert.equal(f.api.playingScene(),library[2]);assert.equal(f.recordings.at(-1).paused,true);f.api.toggleAmbientPlayback();assert.equal(f.recordings.at(-1).paused,false);f.api.stopAmbient();
});


test('archiving excludes songs from manual play, repeat, next and shuffle, persists and restores without changing completion',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.selectCompletion(classical[0]);f.api.startAmbient();const first=f.recordings.at(-1);
 assert.equal(f.api.archiveScene(library[0]),true);assert.equal(first.paused,true);assert.notEqual(f.api.playingScene(),library[0]);assert.equal(f.api.completionId(),classical[0]);assert.equal(f.api.toggleScene(library[0]),false);
 assert.ok(!f.api.sceneOptions().some(x=>x.id===library[0]));assert.ok(f.api.archivedOptions().some(x=>x.id===library[0]));
 for(const mode of ['repeat','playlist','shuffle']){f.api.setAmbientMode(mode);for(let i=0;i<30;i++){f.api.moveAmbient(1);assert.notEqual(f.api.sceneId(),library[0]);}}
 assert.ok(harness(f.persisted).api.archivedOptions().some(x=>x.id===library[0]));assert.equal(f.api.archiveScene(library[0],false),true);assert.ok(f.api.sceneOptions().some(x=>x.id===library[0]));f.api.stopAmbient();
});
test('archiving the entire selected collection stops playback and does not fall through to another collection',()=>{
 const f=harness();f.api.setAmbientCollection('Classical');f.api.startAmbient();for(const id of classicalCollection)assert.equal(f.api.archiveScene(id),true);
 assert.equal(f.api.sceneId(),'');assert.equal(f.api.sceneOptions().length,0);assert.equal(f.api.playing(),false);assert.equal(f.api.startAmbient(),false);assert.equal(f.api.moveAmbient(1),false);assert.equal(f.api.ambientCollection(),'Classical');
 assert.equal(f.api.archiveScene(piano[0],false),true);assert.equal(f.api.sceneId(),piano[0]);assert.equal(f.api.playing(),false);assert.equal(f.api.startAmbient(),true);f.api.stopAmbient();
});

test('paused navigation, collection changes and archive replacement never call play before explicit resume',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();f.api.toggleAmbientPlayback();
 f.api.moveAmbient(1);let p=f.recordings.at(-1);assert.equal(p.paused,true);assert.equal(p.playCalls,0);
 f.api.selectScene(library[2]);p=f.recordings.at(-1);assert.equal(p.paused,true);assert.equal(p.playCalls,0);
 f.api.setAmbientCollection('Classical');p=f.recordings.at(-1);assert.equal(p.paused,true);assert.equal(p.playCalls,0);
 f.api.archiveScene(f.api.playingScene());p=f.recordings.at(-1);assert.equal(p.paused,true);assert.equal(p.playCalls,0);
 f.api.toggleAmbientPlayback();assert.equal(p.playCalls,1);assert.equal(p.paused,false);f.api.stopAmbient();
});
test('archive updates preserve unloaded local tracks without exposing unknown entries',()=>{
 const id='my_'+'a'.repeat(32),f=harness({v30165Soundscape:'moonlight',v30165CompletionSound:'soft',v30165ArchivedAmbient:[id,'invalid']});
 assert.equal(f.api.archiveScene(library[0]),true);
 assert.ok(f.persisted.v30165ArchivedAmbient.includes(id));assert.ok(!f.persisted.v30165ArchivedAmbient.includes('invalid'));
 assert.ok(!f.api.archivedOptions().some(o=>o.id===id));
 assert.equal(f.api.archiveScene(library[0],false),true);assert.ok(f.persisted.v30165ArchivedAmbient.includes(id));
});


test('paused recorded-to-original transitions retain the selection and never autoplay on further switches',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();f.api.toggleAmbientPlayback();
 const contexts=f.contexts.length;
 f.api.selectScene('moonlight');
 assert.equal(f.api.playingScene(),'moonlight');assert.equal(f.api.playing(),true);
 assert.equal(f.api.ambientPlayback().paused,true);assert.equal(f.contexts.length,contexts);
 f.api.selectScene(library[1]);let p=f.recordings.at(-1);
 assert.equal(p.paused,true);assert.equal(p.playCalls,0);
 f.api.selectScene('moonlight');assert.equal(f.api.ambientPlayback().paused,true);
 f.api.toggleAmbientPlayback();assert.equal(f.api.playingScene(),'moonlight');
 assert.equal(f.contexts.length,contexts+1);assert.equal(f.timers.size,1);
 f.api.stopAmbient();assert.equal(f.api.playing(),false);assert.equal(f.api.ambientPlayback(),null);
});


test('original soundscapes expose actual paused state, resume explicitly and stop independently',()=>{
 const f=harness();f.api.selectScene('moonlight');assert.equal(f.api.startAmbient(),true);
 assert.equal(f.api.ambientPlayback().paused,false);const first=f.contexts.at(-1);
 f.api.toggleAmbientPlayback();assert.equal(first.closed,true);assert.equal(f.timers.size,0);
 assert.equal(f.api.playingScene(),'moonlight');assert.equal(f.api.playing(),true);assert.equal(f.api.ambientPlayback().paused,true);
 f.api.toggleAmbientPlayback();assert.equal(f.api.ambientPlayback().paused,false);assert.equal(f.timers.size,1);
 f.api.stopAmbient();assert.equal(f.api.playing(),false);assert.equal(f.api.ambientPlayback(),null);
});
test('track navigation is disabled for empty and single-track collections',()=>{
 const f=harness();f.api.setAmbientCollection('Classical');assert.equal(f.api.canNavigateAmbient(),true);
 for(const id of classicalCollection.slice(1))f.api.archiveScene(id);
 assert.equal(f.api.canNavigateAmbient(),false);f.api.archiveScene(piano[0]);
 assert.equal(f.api.canNavigateAmbient(),false);f.api.setAmbientCollection('all');
 assert.equal(f.api.canNavigateAmbient(),true);
});

test('original soundscape volume changes immediately and phase bell restores the latest volume',()=>{
 const f=harness();f.api.startAmbient();const bus=f.gains[0];
 assert.equal(bus.value,1);
 f.api.setAmbientVolume(0);assert.equal(bus.value,0);
 f.api.setAmbientVolume(.7);assert.equal(bus.value,2);
 f.api.playPhaseBells();assert.equal(bus.value,.48);
 f.api.setAmbientVolume(.35);assert.equal(bus.value,.24);
 [...f.timeouts.values()].at(-1)();assert.equal(bus.value,1);
 f.api.stopAmbient();
});
test('reselecting current recording does not restart or lose playback position',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();
 const p=f.recordings.at(-1);p.currentTime=52;f.api.selectScene(library[0]);
 assert.equal(f.recordings.length,1);assert.equal(p.currentTime,52);assert.equal(p.paused,false);
});
test('stale audio errors cannot override currently playing track status',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();
 const old=f.recordings.at(-1);f.api.selectScene(library[1]);old.onerror();
 assert.equal(f.api.playingScene(),library[1]);assert.equal(f.api.personalStatus(),'');
 f.recordings.at(-1).onerror();assert.equal(f.api.playing(),false);assert.match(f.api.personalStatus(),/Cannot play/);
});
test('failed track preference leaves current audio and reports error',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();const p=f.recordings.at(-1);
 const save=f.window.FocusStoryV30162.setAudioPreference;f.window.FocusStoryV30162.setAudioPreference=(kind,value)=>kind==='scene'?false:save(kind,value);
 assert.equal(f.api.moveAmbient(1),false);assert.equal(f.api.playingScene(),library[0]);
 assert.equal(p.paused,false);assert.equal(f.recordings.length,1);assert.match(f.api.personalStatus(),/not saved/);
});

test('a playlist with one remaining recording restarts on natural end',()=>{
 const f=harness();f.api.setAmbientCollection('Classical');for(const id of classicalCollection.slice(1))f.api.archiveScene(id);
 f.api.setAmbientMode('playlist');f.api.startAmbient();const first=f.recordings.at(-1);first.onended();
 assert.equal(f.recordings.length,2);assert.equal(f.api.playingScene(),piano[0]);assert.equal(f.recordings.at(-1).paused,false);
});

test('failed collection selection rolls back the collection and retains existing recording',()=>{
 const f=harness();f.api.setAmbientCollection('Ambient');f.api.startAmbient();const p=f.recordings.at(-1);
 const save=f.window.FocusStoryV30162.setAudioPreference;f.window.FocusStoryV30162.setAudioPreference=(kind,value)=>kind==='scene'?false:save(kind,value);
 assert.equal(f.api.setAmbientCollection('Classical'),false);assert.equal(f.api.ambientCollection(),'Ambient');
 assert.equal(f.api.playingScene(),library[0]);assert.equal(p.paused,false);assert.equal(f.recordings.length,1);
});
test('failed cross-collection track selection does not alter the existing collection',()=>{
 const f=harness();f.api.setAmbientCollection('Classical');f.api.startAmbient();const p=f.recordings.at(-1);
 const save=f.window.FocusStoryV30162.setAudioPreference;f.window.FocusStoryV30162.setAudioPreference=(kind,value)=>kind==='scene'?false:save(kind,value);
 assert.equal(f.api.selectScene(library[0]),piano[0]);assert.equal(f.api.ambientCollection(),'Classical');
 assert.equal(f.api.playingScene(),piano[0]);assert.equal(p.paused,false);assert.equal(f.recordings.length,1);
});

function fakePersonalStorage(f,{failBlob=false}={}){
 const tracks=new Map(),blobs=new Map(),pending=[];
 let counter=0,opens=0;
 const db={close(){},transaction(names,mode){
   const tx={error:null,aborted:false,staged:[],abort(){this.aborted=true;this.onabort?.();},
     objectStore(name){const store=name==='tracks'?tracks:blobs;return {
       add(value,key){if(failBlob&&name==='blobs')throw Error('quota');tx.staged.push([store,key??value.id,value]);},
       getAll(){const req={result:[...store.values()]};queueMicrotask(()=>{req.onsuccess?.();tx.oncomplete?.();});return req;},
       get(key){const req={result:store.get(key)};queueMicrotask(()=>{req.onsuccess?.();tx.oncomplete?.();});return req;}
     };}
   };
   if(mode==='readwrite')pending.push(()=>{if(!tx.aborted){for(const [store,key,value] of tx.staged)store.set(key,value);tx.oncomplete?.();}});
   return tx;
 }};
 f.window.crypto={getRandomValues(bytes){bytes.fill(++counter);return bytes;}};
 f.window.indexedDB={open(){opens++;const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req;}};
 return {tracks,blobs,pending,db,opens:()=>opens};
}
async function waitPending(store){for(let i=0;i<20&&!store.pending.length;i++)await Promise.resolve();assert.ok(store.pending.length);}
test('cancel personal import commits current file and skips remaining files without changing music',async()=>{
 const f=harness(),store=fakePersonalStorage(f);f.api.setAmbientCollection('Classical');f.api.startAmbient();const p=f.recordings.at(-1);
 const result=f.api.importPersonalTracks([{name:'one.mp3',size:200},{name:'two.wav',size:300}]);
 await waitPending(store);assert.equal(f.api.cancelPersonalImport(),true);assert.equal(f.api.personalCancelPending(),true);
 store.pending.shift()();assert.equal(await result,true);
 assert.equal(store.tracks.size,1);assert.equal(store.blobs.size,1);
 assert.equal(f.api.personalImporting(),false);assert.equal(f.api.personalCancelPending(),false);
 assert.equal(f.api.ambientCollection(),'Classical');assert.equal(f.api.playingScene(),piano[0]);assert.equal(p.paused,false);
 assert.match(f.api.personalStatus(),/Skipped: 1/);
});
test('synchronous Blob write failure aborts metadata and leaves no orphan song',async()=>{
 const f=harness(),store=fakePersonalStorage(f,{failBlob:true});
 assert.equal(await f.api.importPersonalTracks([{name:'broken.mp3',size:300}]),false);
 store.pending.shift()();assert.equal(store.tracks.size,0);assert.equal(store.blobs.size,0);
 assert.match(f.api.personalStatus(),/Failed: 1/);
});
test('blocked database open releases import state and late success closes abandoned handle',async()=>{
 const f=harness();let req,closed=0;
 f.window.indexedDB={open(){req={result:{close(){closed++;}}};queueMicrotask(()=>req.onblocked());return req;}};
 assert.equal(await f.api.importPersonalTracks([{name:'song.mp3',size:200}]),false);
 assert.equal(f.api.personalImporting(),false);req.onsuccess();assert.equal(closed,1);
 const store=fakePersonalStorage(f);const result=f.api.importPersonalTracks([{name:'song.mp3',size:200}]);await waitPending(store);store.pending.shift()();
 assert.equal(await result,true);assert.equal(store.opens(),1);
});
test('synchronous database open exception is retryable',async()=>{
 const f=harness();f.window.indexedDB={open(){throw Error('denied');}};
 assert.equal(await f.api.loadPersonalTracks(),false);
 const store=fakePersonalStorage(f);assert.equal(await f.api.loadPersonalTracks(),true);assert.equal(store.opens(),1);
});
test('large personal files are accepted without a hard size cap and without autoplay',async()=>{
 const f=harness(),store=fakePersonalStorage(f);
 const result=f.api.importPersonalTracks([{name:'long.mp3',size:8*1024*1024*1024}]);await waitPending(store);store.pending.shift()();
 assert.equal(await result,true);assert.equal(store.tracks.size,1);assert.equal(f.api.playing(),false);assert.equal(f.api.ambientCollection(),'all');
 assert.ok(f.api.sceneOptions().some(o=>o.label.includes('long.mp3')));
});
test('cancel import is available only in expanded library on desktop and Android',()=>{
 const mobile=readFileSync('android/mobile-experience.js','utf8');
 for(const [source,attr] of [[focusSource,'data-mlv-audio'],[mobile,'data-mobile-focus']]){
  assert.ok(source.includes(attr+'="cancel-import" hidden'));assert.ok(source.includes('cancelPersonalImport'));
 }
});

test('replacing or stopping recorded audio releases decoder resources',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();const first=f.recordings.at(-1);
 f.api.selectScene(library[1]);const second=f.recordings.at(-1);assert.equal(first.released,true);assert.equal(first.src,'');
 assert.equal(second.released,undefined);f.api.stopAmbient();assert.equal(second.released,true);
});
test('stale personal Blob read cannot play after switching to another track',async()=>{
 const f=harness(),store=fakePersonalStorage(f);const id='my_'+'b'.repeat(32);
 store.tracks.set(id,{id,name:'personal.mp3'});store.blobs.set(id,{name:'personal.mp3',size:200});
 assert.equal(await f.api.loadPersonalTracks(),true);let created=0;
 f.window.URL={createObjectURL(){created++;return 'blob:test';},revokeObjectURL(){}};
 f.api.selectScene(id);f.api.startAmbient();f.api.selectScene(library[0]);
 for(let i=0;i<20;i++)await Promise.resolve();
 assert.equal(created,0);assert.equal(f.api.playingScene(),library[0]);assert.equal(f.recordings.length,1);
});
test('personal Blob URL is revoked after decoder release when stopping',async()=>{
 const f=harness(),store=fakePersonalStorage(f);const id='my_'+'c'.repeat(32);
 store.tracks.set(id,{id,name:'song.mp3'});store.blobs.set(id,{name:'song.mp3',size:300});
 await f.api.loadPersonalTracks();const revoked=[];
 f.window.URL={createObjectURL(){return 'blob:test';},revokeObjectURL(url){assert.equal(f.recordings.at(-1).released,true);revoked.push(url);}};
 f.api.selectScene(id);f.api.startAmbient();for(let i=0;i<20&&!f.recordings.length;i++)await Promise.resolve();
 assert.equal(f.recordings.at(-1).src,'blob:test');f.api.stopAmbient();assert.deepEqual(revoked,['blob:test']);
});

test('saved personal track never falls through to unrelated audio before local library loads',async()=>{
 const id='my_'+'d'.repeat(32),f=harness({v30165Soundscape:id,v30165CompletionSound:'soft'});
 assert.equal(f.api.sceneId(),'');assert.equal(f.api.startAmbient(),false);assert.equal(f.persisted.v30165Soundscape,id);
 const store=fakePersonalStorage(f);store.tracks.set(id,{id,name:'remembered.mp3'});
 const a=f.api.loadPersonalTracks(),b=f.api.loadPersonalTracks();assert.equal(a,b);assert.equal(f.api.personalLibraryLoading(),true);
 assert.equal(await a,true);assert.equal(f.api.personalLibraryLoading(),false);assert.equal(f.api.sceneId(),id);
 assert.equal(f.api.playing(),false);
});
test('missing personal file can be replaced only by explicit collection or track choice',()=>{
 const id='my_'+'e'.repeat(32),f=harness({v30165Soundscape:id,v30165CompletionSound:'soft'});
 assert.equal(f.api.sceneId(),'');assert.equal(f.api.setAmbientCollection('Classical'),true);
 assert.equal(f.api.sceneId(),piano[0]);assert.equal(f.api.playing(),false);
});
test('library failure is observable and retry clears the failure state',async()=>{
 const f=harness();f.window.indexedDB={open(){throw Error('blocked');}};
 assert.equal(await f.api.loadPersonalTracks(),false);assert.equal(f.api.personalLibraryFailed(),true);
 fakePersonalStorage(f);assert.equal(await f.api.loadPersonalTracks(),true);assert.equal(f.api.personalLibraryFailed(),false);
 assert.equal(f.api.personalStatus(),'');
});
test('failed replacement preference after archive does not start an unintended track',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();
 const save=f.window.FocusStoryV30162.setAudioPreference;f.window.FocusStoryV30162.setAudioPreference=(kind,value)=>kind==='scene'?false:save(kind,value);
 assert.equal(f.api.archiveScene(library[0]),true);assert.equal(f.api.playing(),false);
 assert.equal(f.recordings.length,1);assert.match(f.api.personalStatus(),/replacement was not saved/);
});
test('failed volume persistence retains session volume and exposes warning',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();
 const save=f.window.FocusStoryV30162.setAudioPreference;f.window.FocusStoryV30162.setAudioPreference=(kind,value)=>kind==='ambientVolume'?false:save(kind,value);
 f.api.setAmbientVolume(.6);assert.equal(f.api.ambientVolume(),.6);assert.equal(f.recordings.at(-1).volume,.6);
 assert.match(f.api.personalStatus(),/session only/);f.window.FocusStoryV30162.setAudioPreference=save;
 f.api.setAmbientVolume(.5);assert.equal(f.persisted.v30165AmbientVolume,.5);assert.equal(f.api.personalStatus(),'');
});

test('seek recorded music without changing pause state or Focus preferences',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();const p=f.recordings.at(-1);p.duration=200;
 const generation=f.api.ambientPlayback().generation;f.api.toggleAmbientPlayback();
 const saved=JSON.stringify(f.persisted);
 assert.equal(f.api.seekAmbient(50,generation),true);assert.equal(p.currentTime,50);assert.equal(p.paused,true);
 assert.equal(f.api.seekAmbient(-50,generation),true);assert.equal(p.currentTime,0);
 assert.equal(f.api.seekAmbient(999,generation),true);assert.equal(p.currentTime,199.95);
 assert.equal(f.api.seekAmbient(NaN,generation),false);assert.equal(JSON.stringify(f.persisted),saved);
});
test('stale seek gestures cannot affect a replacement recording or generated soundtrack',()=>{
 const f=harness();f.api.selectScene(library[0]);f.api.startAmbient();f.recordings.at(-1).duration=120;
 const old=f.api.ambientPlayback().generation;f.api.selectScene(library[1]);const p=f.recordings.at(-1);p.duration=160;
 assert.equal(f.api.seekAmbient(90,old),false);assert.equal(p.currentTime,0);
 f.api.selectScene('moonlight');assert.equal(f.api.seekAmbient(30,old),false);
});
test('seek control is in advanced options and not the timer controls on either platform',()=>{
 const mobile=readFileSync('android/mobile-experience.js','utf8');
 for(const [src,key,drawer] of [[focusSource,'mlv','<details class="mlv-focus-sound-details"'],[mobile,'mobile','<details class="mlv-android-focus-sounds"']]){
   assert.ok(src.indexOf(drawer)<src.indexOf('data-'+key+'-ambient-seek'));
   assert.ok(src.includes('input.dataset.audioGeneration'));
 }
});

test('seek uses native range keyboard focus and explicit hidden styles',()=>{
 const mobile=readFileSync('android/mobile-experience.js','utf8');
 for(const [src,key] of [[focusSource,'mlv'],[mobile,'mobile']]){
   assert.ok(src.includes('[data-'+key+'-seek-wrap][hidden]{display:none!important}'));
   const handler=src.slice(src.indexOf("matches?.('[data-"+key+"-ambient-seek]')"),src.indexOf("matches?.('[data-"+key+"-ambient-seek]')")+700);
   assert.ok(handler.includes('seekAmbient'));assert.doesNotMatch(handler,/input\.blur\(/);
 }
});
