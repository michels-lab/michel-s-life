import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const focusSource=readFileSync('src/MichelsLife/frontend/focus-immersive.js','utf8');
const html=readFileSync('src/MichelsLife/frontend/index.html','utf8');
const legacy=['moonlight','celestial','orbit','aurora','observatory','library','afterglow','silver'];
const classical=['mozart_k545','tchaikovsky_op39'];
const all=new Set([...legacy,...classical]);

function harness(persisted={v30165Soundscape:'moonlight',v30165CompletionSound:'soft'}){
  const frequencies=[],startTimes=[],contexts=[],timers=new Map();
  let timerCounter=0;
  class AudioContext{
    constructor(){this.currentTime=0;this.state='running';this.destination={};this.closed=false;contexts.push(this);}
    resume(){return Promise.resolve();}
    close(){this.closed=true;this.state='closed';return Promise.resolve();}
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
  return {api:window.MichelsLifeFocusAudio,frequencies,startTimes,contexts,timers,persisted};
}

test('canonical FocusStory validator accepts exactly the two new IDs, with no competing audio storage',()=>{
  const expression=html.match(/function setAudioPreference\(kind,value\)\{[\s\S]*?\n\}/)?.[0]||'';
  assert.ok(expression,'canonical preferences function missing');
  for(const id of classical)assert.ok(expression.includes("'"+id+"'"),'canonical state rejects '+id);
  assert.doesNotMatch(focusSource,/localStorage\.setItem\(/,'only FocusStory may persist selected scene');
});

test('ten scenes keep all eight original pieces, and classical themes describe excerpts rather than fake recordings',()=>{
  const {api}=harness();
  const options=api.sceneOptions();
  assert.equal(options.length,10);
  for(const id of legacy)assert.ok(options.some(o=>o.id===id),'removed original scene '+id);
  for(const id of classical)assert.ok(options.some(o=>o.id===id),'missing '+id);
  assert.match(options.find(x=>x.id==='mozart_k545').label,/Mozart.*K\.545.*excerpt/);
  assert.match(options.find(x=>x.id==='tchaikovsky_op39').label,/Tchaikovsky.*Morning Prayer.*excerpt/);
});

test('Mozart K545 opening pitches are real synthesized note frequencies with a bounded scheduler',()=>{
  const f=harness();
  assert.equal(f.api.playing(),false,'must not autoplay on boot');
  assert.equal(f.api.selectScene('mozart_k545'),'mozart_k545');
  assert.equal(f.persisted.v30165Soundscape,'mozart_k545');
  assert.equal(f.api.startAmbient(),true);
  const near=(hz)=>f.frequencies.some(x=>Math.abs(x-hz)<1);
  assert.ok(near(523.25),'C5 should sound');
  assert.ok(near(659.26),'E5 should sound');
  assert.ok(near(783.99),'G5 should sound');
  assert.equal(f.timers.size,1,'one scheduler only');
  assert.ok(f.frequencies.every(x=>Number.isFinite(x)&&x>=90&&x<=1200));
  assert.ok(f.startTimes.every(x=>Number.isFinite(x)&&x>=0&&x<=7.2));
  f.api.stopAmbient();
  assert.equal(f.timers.size,0);
  assert.equal(f.contexts.at(-1).closed,true);
});

test('Tchaikovsky Op39 hymn theme evolves across multiple measures and preserves user scene choice',()=>{
  const f=harness();
  f.api.selectScene('tchaikovsky_op39');
  assert.equal(f.api.startAmbient(),true);
  assert.ok(f.frequencies.some(x=>Math.abs(x-493.88)<1),'B4 opening must sound');
  const period=f.timers.values().next().value;
  assert.equal(typeof period,'function');
  period();period();
  assert.ok(f.frequencies.some(x=>Math.abs(x-739.99)<1),'F-sharp high note must appear in later phrase');
  const old=f.contexts.at(-1);
  f.api.selectScene('mozart_k545');
  assert.equal(old.closed,true,'switch must close obsolete context');
  assert.equal(f.timers.size,1,'no interval leak');
  assert.equal(f.api.sceneId(),'mozart_k545');
  const next=harness(f.persisted);
  assert.equal(next.api.sceneId(),'mozart_k545','reopening the app must read the canonical preference');
  f.api.stopAmbient();
});

test('Spanish composer names are localized, and original composition categories remain separate',()=>{
  const f=harness();
  assert.equal(f.api.sceneOptions().filter(x=>x.label.startsWith('CL · ')).length,2);
  // Public-domain composers are reproduced as short new synth arrangements.
  assert.match(focusSource,/These are short ambient arrangements, not full scores or recordings/);
  assert.doesNotMatch(focusSource,/https?:\/\/.*\.mp3/);
});

test('visible classical cards toggle one canonical audio scene and never autoplay or duplicate intervals',()=>{
  const f=harness();
  assert.equal(f.api.playing(),false);
  assert.equal(f.api.toggleClassical('bad-id'),false,'unknown sound must not be accepted');
  assert.equal(f.api.playing(),false);
  assert.equal(f.api.classicalOptions().length,2);
  assert.equal(f.api.toggleClassical('mozart_k545'),true);
  assert.equal(f.api.playingScene(),'mozart_k545');
  assert.equal(f.api.playing(),true);
  assert.equal(f.api.sceneId(),'mozart_k545');
  assert.equal(f.timers.size,1);
  assert.equal(f.api.toggleClassical('tchaikovsky_op39'),true);
  assert.equal(f.api.playingScene(),'tchaikovsky_op39');
  assert.equal(f.api.sceneId(),'tchaikovsky_op39');
  assert.equal(f.timers.size,1,'switching classical composers must not leak scheduler timers');
  assert.equal(f.api.toggleClassical('tchaikovsky_op39'),true);
  assert.equal(f.api.playing(),false,'pressing playing composer stops ambient');
  assert.equal(f.timers.size,0);
  assert.equal(f.api.sceneId(),'tchaikovsky_op39','stopping must retain selected composer in canonical preferences');
  const es=harness(f.persisted);
  es.api.selectScene('mozart_k545');
  es.api.stopAmbient();
  assert.equal(es.api.sceneId(),'mozart_k545');
});

test('both actual Focus surfaces expose explicit classical music controls OUTSIDE collapsed audio drawers',()=>{
  const android=readFileSync('android/mobile-experience.js','utf8');
  for(const id of classical){
    assert.match(focusSource,new RegExp('data-mlv-classical="'+id+'"'));
    assert.match(android,new RegExp('data-mobile-classical="'+id+'"'));
  }
  assert.match(focusSource,/data-mlv-classical-heading/);
  assert.match(android,/data-mlv-android-classical-heading/);
  assert.ok(focusSource.indexOf('data-mlv-classical-heading')<focusSource.indexOf('<details class="mlv-focus-sound-details"'),
    'desktop should show music without opening audio details');
  assert.ok(android.indexOf('data-mlv-android-classical-heading')<android.indexOf('<details class="mlv-android-focus-sounds"'),
    'Android should show music without opening audio details');
  assert.match(focusSource,/\[data-mlv-classical\]/);
  assert.match(android,/\[data-mobile-classical\]/);
  assert.match(android,/audio\?\.classicalOptions\?\.\(\)/);
  assert.match(focusSource,/audio\?\.classicalOptions\?\.\(\)/);
  assert.doesNotMatch(focusSource,/localStorage\.setItem\(/,'no second audio persistence store');
});


test('all eight original ambient scenes are directly previewable with one bounded scheduler',()=>{
  const f=harness();
  assert.equal(f.api.playing(),false);
  assert.equal(f.api.toggleScene('unknown'),false);
  assert.equal(f.api.playing(),false,'invalid scene must never autoplay or reset choice');
  for(const id of legacy){
    const previous=f.contexts.at(-1);
    assert.equal(f.api.toggleScene(id),true,'cannot start '+id);
    assert.equal(f.api.playingScene(),id);
    assert.equal(f.persisted.v30165Soundscape,id,'selection must persist for '+id);
    assert.equal(f.timers.size,1,'concurrent scheduler after '+id);
    if(previous)assert.equal(previous.closed,true,'previous context leaked on '+id);
  }
  assert.equal(f.api.toggleScene('silver'),true,'same track must act as Stop');
  assert.equal(f.api.playing(),false);
  assert.equal(f.timers.size,0);
  assert.equal(f.persisted.v30165Soundscape,'silver','Stop must not lose saved choice');
});

test('direct Focus audio controls expose 8 ambient tracks plus 2 classics and completion preview on BOTH platforms',()=>{
  const desktop=focusSource;
  const mobile=readFileSync('android/mobile-experience.js','utf8');
  for(const id of legacy){
    assert.match(desktop,new RegExp('data-mlv-scene="'+id+'"'),id+' hidden on Windows');
    assert.match(mobile,new RegExp('data-mobile-scene="'+id+'"'),id+' hidden on Android');
  }
  for(const id of classical){
    assert.match(desktop,new RegExp('data-mlv-classical="'+id+'"'));
    assert.match(mobile,new RegExp('data-mobile-classical="'+id+'"'));
  }
  assert.match(desktop,/toggleScene\(id\)/);
  assert.match(mobile,/MichelsLifeFocusAudio\?\.toggleScene\?\.\(sceneId\)/);
  assert.ok(desktop.indexOf('data-mlv-scene="moonlight"')<desktop.indexOf('<details class="mlv-focus-sound-details"'));
  assert.ok(mobile.indexOf('data-mobile-scene="moonlight"')<mobile.indexOf('<details class="mlv-android-focus-sounds"'));
  assert.ok(desktop.indexOf('data-mlv-completion-sound')<desktop.indexOf('<details class="mlv-focus-sound-details"'));
  assert.ok(mobile.indexOf('data-mobile-focus-completion')<mobile.indexOf('<details class="mlv-android-focus-sounds"'));
  assert.equal((desktop.match(/data-mlv-completion-sound/g)||[]).length,3,'desktop must avoid a duplicated completion picker');
  assert.equal((mobile.match(/<select data-mobile-focus-completion>/g)||[]).length,1,'Android completion input must not be duplicated');
  assert.match(mobile,/selector\.includes\('quick-completion label'\)/,'localization must preserve nested select control');
  assert.match(desktop,/data-mlv-audio="preview-completion"/);
  assert.match(mobile,/data-mobile-focus="preview-completion"/);
});
