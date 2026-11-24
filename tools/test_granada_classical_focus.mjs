import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const focusSource=readFileSync('src/MichelsLife/frontend/focus-immersive.js','utf8');
const html=readFileSync('src/MichelsLife/frontend/index.html','utf8');
const legacy=['moonlight','celestial','orbit','aurora','observatory','library','afterglow','silver'];
const classical=['mozart_k545','tchaikovsky_op39'];
const all=new Set(legacy);

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
 assert.deepEqual(Array.from(f.api.sceneOptions(),o=>o.id),legacy);
 assert.equal(f.api.completionOptions().length,9);
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
