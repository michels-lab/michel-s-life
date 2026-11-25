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
const all=new Set([...legacy,...library,...piano]);

function harness(persisted={v30165Soundscape:'moonlight',v30165CompletionSound:'soft'}){
  const frequencies=[],startTimes=[],contexts=[],timers=new Map(),buffers=[],sources=[];
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
      return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};
    }
  }
  const recordings=[];
  class Audio{constructor(src){this.src=src;this.paused=true;this.currentTime=0;recordings.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
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
    setTimeout(){return 1},addEventListener(){}
  };
  window.window=window;
  window.document={readyState:'loading',documentElement:{dataset:{mlvPlatform:'android'}},querySelector(){return null},addEventListener(){}};
  vm.runInNewContext(focusSource,window,{filename:'focus-immersive.js'});
  return {api:window.MichelsLifeFocusAudio,frequencies,startTimes,contexts,timers,persisted,buffers,sources,recordings};
}


test('classical music is exclusively a completion sound, all eight original ambience choices remain',()=>{
 const f=harness();
 assert.deepEqual(Array.from(f.api.sceneOptions(),o=>o.id),[...legacy,...library,...piano]);
 assert.equal(f.api.completionOptions().length,25);
 for(const id of classical){
   assert.ok(f.api.completionOptions().some(o=>o.id===id));
   assert.equal(f.api.toggleScene(id),false);
   assert.equal(f.api.selectCompletion(id),id);
   assert.equal(f.persisted.v30165CompletionSound,id);
   assert.equal(f.persisted.v30165Soundscape,'moonlight');
 }
 const pref=html.match(/function setAudioPreference\(kind,value\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(pref); assert.match(pref,/completion[\s\S]*?mozart_k545/);
 assert.doesNotMatch(pref.split("kind==='scene'")[1],/mozart_k545|tchaikovsky_op39/);
 assert.match(html,/Migrate the mistakenly saved classical ambience choice/);
});
test('classical preview and expiry play the recorded file, not a synthesizer or ambience',()=>{
 const f=harness();
 for(const id of classical){
   f.api.selectCompletion(id);
   assert.equal(f.api.playCompletion(true),true);
   assert.equal(f.api.previewingCompletion(),id);
   const player=f.recordings.at(-1);
   assert.equal(player.src,'assets/audio/classical/'+id+'.mp3');
   assert.equal(player.paused,false);assert.equal(player.loop,false);
   assert.equal(f.api.playing(),false);assert.equal(f.timers.size,0);
   assert.equal(f.buffers.length,0);
   f.api.stopClassical();assert.equal(player.paused,true);
   assert.equal(f.api.playCompletion(),true);
   assert.equal(f.api.previewingCompletion(),null);
 }
 assert.equal(harness(f.persisted).api.completionId(),'tchaikovsky_op39');
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
test('both real focus templates put clock and visible motivation before audio, no hidden quotes or wall of track buttons',()=>{
 const mobile=readFileSync('android/mobile-experience.js','utf8');
 for(const [s,clock,motivation,completion] of [[focusSource,'id="mlv-desktop-focus-clock"','id="mlv-desktop-focus-motivation"','<select id="mlv-focus-completion-select"'],[mobile,'id="mlv-android-focus-time"','id="mlv-android-focus-motivation"','<select data-mobile-focus-completion>']]){
   assert.ok(s.indexOf(clock)>0&&s.indexOf(clock)<s.indexOf(motivation)&&s.indexOf(motivation)<s.indexOf(completion));
   assert.doesNotMatch(s,/<details class="mlv-focus-motivation-details">/);
   assert.doesNotMatch(s,/data-(?:mlv|mobile)-classical="mozart_k545"/);
 }
 assert.match(focusSource,/window\.MichelsLifeFocusAudio/);
});


test('completion and recorded preview take exclusive ownership of audio, and a new ambience stops the recording',()=>{
 const f=harness();
 for(const id of classical){
   f.api.selectCompletion(id);
   for(const preview of [false,true]){
     assert.equal(f.api.startAmbient(),true);
     const ambient=f.contexts.at(-1);
     assert.equal(f.api.playCompletion(preview),true);
     const player=f.recordings.at(-1);
     assert.equal(ambient.closed,true);
     assert.equal(f.timers.size,0);
     assert.equal(f.api.recordingActive(),true);
     assert.equal(f.api.startAmbient(),true);
     assert.equal(player.paused,true);
     assert.equal(f.api.recordingActive(),false);
   }
 }
 f.api.selectCompletion('off');
 assert.equal(f.api.playCompletion(),true);
 assert.equal(f.timers.size,0);
 assert.equal(f.api.playing(),false);
});


test('licensed library loops independently at adjustable volume; expiry interrupts it and retains the completion choice',()=>{
 const f=harness();
 for(const id of library){
  f.api.selectCompletion(id);assert.equal(f.api.selectScene(id),id);assert.equal(f.api.startAmbient(),true);
  const p=f.recordings.at(-1);assert.equal(p.loop,true);assert.equal(p.src,'assets/audio/classical/'+id+'.mp3');assert.equal(f.timers.size,0);
  f.api.setAmbientVolume(.2);assert.equal(p.volume,.2);assert.equal(f.api.playingScene(),id);
  assert.equal(f.api.playCompletion(),true);assert.equal(p.paused,true);assert.equal(f.api.playing(),false);assert.equal(f.recordings.at(-1).loop,false);assert.equal(f.api.completionId(),id);
 }
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
 for(const item of manifest){const id=item.id,bytes=readFileSync(folder+id+'.mp3');assert.equal(createHash('sha256').update(bytes).digest('hex'),item.asset_sha256);assert.deepEqual(bytes,readFileSync('android/app/src/main/res/raw/mlv_focus_'+id+'.mp3'));assert.ok(item.performer&&item.license_url&&item.source_page);assert.equal(f.api.selectScene(id),id);assert.equal(f.api.startAmbient(),true);assert.equal(f.recordings.at(-1).loop,true);assert.equal(f.api.selectCompletion(id),id);assert.equal(f.api.playCompletion(),true);assert.equal(f.recordings.at(-1).loop,false);}
});


test('shuffle traverses a selected piano collection without repeating before exhausting it',()=>{
 const f=harness();f.api.setAmbientCollection('Classical');f.api.setAmbientMode('shuffle');assert.equal(f.api.sceneId(),piano[0]);
 assert.equal(harness(f.persisted).api.ambientCollection(),'Classical');assert.equal(harness(f.persisted).api.ambientMode(),'shuffle');
 f.api.startAmbient();const seen=new Set([f.api.playingScene()]);for(let i=1;i<piano.length;i++){f.recordings.at(-1).onended();const id=f.api.playingScene();assert.ok(piano.includes(id));assert.ok(!seen.has(id));seen.add(id);}
 const previous=f.api.playingScene();f.api.moveAmbient(-1);assert.notEqual(f.api.playingScene(),previous);assert.ok(piano.includes(f.api.playingScene()));f.api.stopAmbient();
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
 const f=harness();f.api.setAmbientCollection('Classical');f.api.startAmbient();for(const id of piano)assert.equal(f.api.archiveScene(id),true);
 assert.equal(f.api.sceneId(),'');assert.equal(f.api.sceneOptions().length,0);assert.equal(f.api.playing(),false);assert.equal(f.api.startAmbient(),false);assert.equal(f.api.moveAmbient(1),false);assert.equal(f.api.ambientCollection(),'Classical');
 assert.equal(f.api.archiveScene(piano[0],false),true);assert.equal(f.api.sceneId(),piano[0]);assert.equal(f.api.playing(),false);assert.equal(f.api.startAmbient(),true);f.api.stopAmbient();
});
