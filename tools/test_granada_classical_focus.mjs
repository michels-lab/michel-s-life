import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

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
  const window={
    AudioContext,
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
  return {api:window.MichelsLifeFocusAudio,frequencies,startTimes,contexts,timers,persisted,buffers,sources};
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
test('both one-shot piano excerpts are actual non-silent score-derived audio with no ambient scheduler',()=>{
 const f=harness();
 for(const id of classical){
   f.api.selectCompletion(id);
   assert.equal(f.api.playCompletion(true),true);
   assert.equal(f.api.previewingCompletion(),id);
   assert.equal(f.api.playing(),false);
   assert.equal(f.timers.size,0);
   const buffer=f.buffers.at(-1),source=f.sources.at(-1);
   assert.ok(source.started&&buffer.rate===22050);
   assert.ok(buffer.length/22050>=18&&buffer.length/22050<=25);
   assert.ok(buffer.samples.some(x=>Math.abs(x)>.1));
   assert.ok(buffer.samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=.8));
   f.api.stopClassical();assert.equal(source.stopped,true);
   assert.equal(f.api.playCompletion(),true);
   assert.equal(f.api.previewingCompletion(),null);
   assert.equal(f.api.playing(),false);
 }
 assert.notEqual(f.buffers[0].length,f.buffers.at(-1).length);
 assert.equal(harness(f.persisted).api.completionId(),'tchaikovsky_op39');
});
test('same-source native WAV files match score-based browser PCM sample by sample within quantization',()=>{
 const f=harness();
 for(const id of classical){
   f.api.selectCompletion(id);assert.equal(f.api.playCompletion(),true);
   const pcm=f.buffers.at(-1).samples;
   const wav=readFileSync('android/app/src/main/res/raw/mlv_focus_'+id+'.wav');
   assert.equal(wav.toString('ascii',0,4),'RIFF');
   assert.equal(wav.readUInt32LE(24),22050);assert.equal(wav.readUInt32LE(40),pcm.length*2);
   for(let i=0;i<pcm.length;i+=137)assert.ok(Math.abs(wav.readInt16LE(44+2*i)-Math.round(pcm[i]*32767))<=2,'native/browser audio differs: '+id+' '+i);
 }
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
