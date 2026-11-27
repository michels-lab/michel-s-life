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
  class Audio{constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.playCalls=0;recordings.push(this);}play(){this.playCalls++;this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
  const window={
    AudioContext,Audio,
    FocusStoryV30162:{
      focusState:()=>persisted,
      setAudioPreference(kind,value){
        if(kind==='scene')persisted.v30165Soundscape=all.has(value)?value:'moonlight';
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
