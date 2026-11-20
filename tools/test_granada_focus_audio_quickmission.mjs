import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const focus=readFileSync('src/MichelsLife/frontend/focus-immersive.js','utf8');
const html=readFileSync('src/MichelsLife/frontend/index.html','utf8');
const android=readFileSync('android/mobile-experience.js','utf8');

function audioSandbox(){
  const state={v30165CompletionSound:'soft',v30165Soundscape:'moonlight'};
  const timers=new Map(),created=[];
  let oscCount=0,intervalId=0;
  class AudioContext {
    constructor(){this.currentTime=0;this.state='running';this.destination={};this.closed=false;created.push(this);}
    resume(){return Promise.resolve();}
    close(){this.state='closed';this.closed=true;return Promise.resolve();}
    createOscillator(){
      const osc={type:'sine',frequency:{setValueAtTime(){}},connect(){},start(){oscCount++;},stop(){}};
      return osc;
    }
    createGain(){
      return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};
    }
  }
  const sandbox={
    document:{readyState:'loading',documentElement:{dataset:{mlvPlatform:'android'}},
      querySelector(){return null;},addEventListener(){}},
    FocusStoryV30162:{
      focusState(){return state;},
      setAudioPreference(kind,id){
        if(kind==='completion')state.v30165CompletionSound=id;
        else if(kind==='scene')state.v30165Soundscape=id;
        else return false;
        return true;
      }
    },
    AudioContext,console,
    setTimeout(){return 1;},
    setInterval(fn){const id=++intervalId;timers.set(id,fn);return id;},
    clearInterval(id){timers.delete(id);},
    addEventListener(){}
  };
  sandbox.window=sandbox;
  vm.runInNewContext(focus,sandbox,{filename:'focus-immersive.js'});
  return {api:sandbox.MichelsLifeFocusAudio,state,timers,created,osc:()=>oscCount,sandbox};
}

test('real audio controls expose eight original A+C scenes and seven end tones',()=>{
  const {api}=audioSandbox();
  assert.ok(api,'audio engine must be exported at boot');
  assert.equal(api.sceneOptions().length,10);
  assert.equal(api.completionOptions().length,7);
  assert.ok(api.sceneOptions().some(x=>x.label.includes('Moonlight Study')));
  assert.ok(api.sceneOptions().some(x=>x.label.includes('Midnight Library')));
  assert.ok(api.completionOptions().some(x=>x.id==='off'));
  assert.equal(api.completionId(),'soft');
  assert.equal(api.sceneId(),'moonlight');
});

test('selected completion tone persists and performs real oscillator playback; off is silent',()=>{
  const {api,state,osc}=audioSandbox();
  assert.equal(api.selectCompletion('observatory'),'observatory');
  assert.equal(state.v30165CompletionSound,'observatory');
  const before=osc();
  assert.equal(api.playCompletion(true),true);
  assert.ok(osc()>before,'preview must schedule real Web Audio oscillators');
  api.selectCompletion('off');
  const silent=osc();
  assert.equal(api.playCompletion(),true);
  assert.equal(osc(),silent,'off must suppress all audio rather than fall back to old bell');
  assert.equal(api.selectCompletion('invalid-id'),'soft','invalid preference must fail closed');
});

test('ambient playback starts on demand and stops cleanly on selection change and dismiss',()=>{
  const {api,state,osc,timers,created}=audioSandbox();
  assert.equal(api.playing(),false,'ambient must never autoplay');
  api.selectScene('aurora');
  assert.equal(state.v30165Soundscape,'aurora');
  assert.equal(api.startAmbient(),true);
  assert.equal(api.playing(),true);
  assert.ok(osc()>=4,'a real original harmonic pad must be generated');
  assert.equal(timers.size,1,'one scheduler only');
  const old=created.at(-1);
  api.selectScene('library');
  assert.equal(old.closed,true,'old context must be released when switching');
  assert.equal(timers.size,1,'switch must not leak timers');
  assert.equal(api.playingScene(),'library');
  api.stopAmbient();
  assert.equal(api.playing(),false);
  assert.equal(timers.size,0);
  assert.ok(created.at(-1).closed,'stop must release Web Audio context');
});

test('Spanish option labels are genuine and both platform controls are wired',()=>{
  const {api,sandbox}=audioSandbox();
  sandbox.MichelsLifeI18n={language:'es'};
  assert.ok(api.completionOptions().some(x=>x.label==='Campana suave'));
  assert.ok(api.sceneOptions().some(x=>x.label.includes('Biblioteca nocturna')));
  for(const selector of ['data-mlv-completion-sound','data-mlv-scene-select','data-mlv-audio="preview-completion"','data-mlv-audio="toggle-ambient"'])
    assert.ok(focus.includes(selector),'desktop missing '+selector);
  for(const selector of ['data-mobile-focus-completion','data-mobile-focus-ambience','data-mobile-focus="preview-completion"','data-mobile-focus="toggle-ambient"'])
    assert.ok(android.includes(selector),'Android missing '+selector);
  assert.match(html,/window\.MichelsLifeFocusAudio\?\.playCompletion\?\.\(\)===true/);
  assert.match(html,/window\.MichelsLifeFocusAudio\?\.unlock\?\.\(\)/);
  assert.doesNotMatch(focus,/localStorage\.setItem\(/,'UI must not own a second store');
  assert.match(html,/function setAudioPreference\(kind,value\)/);
  assert.match(html,/focusSessions,setAudioPreference,chapters/);
});

test('Quick Mission floating button catches a real pointerup and single synthetic click',()=>{
  const match=html.match(/<script id="v30175-quick-action-runtime">([\s\S]*?)<\/script>/);
  assert.ok(match,'real action dock source missing');
  const listeners=new Map(),nodes=new Map();
  const body={appendChild(node){node.isConnected=true;node.parentElement=this;nodes.set(node.id,node);},isConnected:true};
  const createElement=kind=>({
    tagName:kind,id:'',dataset:{},style:{setProperty(){}},isConnected:false,innerHTML:'',
    setAttribute(){},removeAttribute(){},appendChild(n){n.parentElement=this;n.isConnected=true;nodes.set(n.id,n);}
  });
  const doc={
    body,createElement,getElementById:id=>nodes.get(id)||null,
    querySelector(){return null;}
  };
  let opened=0;
  const sandbox={
    document:doc,console,Date,
    window:{QuickCaptureV30175:{open(){opened++;}},addEventListener(type,fn){listeners.set(type,fn);}},
    MutationObserver:class {observe(){}},
    setTimeout(fn){fn();return 1;},clearTimeout(){}
  };
  vm.runInNewContext(match[1],sandbox,{filename:'quick-mission-dock.js'});
  const quick=nodes.get('v30106QuickFab');
  assert.ok(quick,'floating Quick Mission is created');
  assert.equal(quick.textContent,'+','button glyph must be visible, not an inherited invisible SVG stroke');
  assert.equal(quick.getAttribute?.('aria-label')||quick.dataset.tip,'Quick mission');
  const event=type=>({type,button:0,target:{closest:()=>quick},preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});
  listeners.get('pointerup')(event('pointerup'));
  listeners.get('click')(event('click'));
  assert.equal(opened,1,'one gesture must open editor exactly once');
  assert.match(html,/function openQuickCapture\(\)\{let root=document\.getElementById\('modalRoot'\)/);
  assert.match(html,/window\.QuickCaptureV30175=\{open:openQuickCapture\}/);
  assert.match(html,/f\.id==='v30106QuickForm'/,'modal submit must create a mission');
  assert.doesNotMatch(match[1],/fallback\?\.click\(\)/,'dead fallback button must be removed');
});
console.log('PASS Granada Quick Mission and original A+C Pomodoro audio contract');
