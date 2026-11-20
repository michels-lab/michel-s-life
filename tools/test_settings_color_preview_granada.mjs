import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('src/MichelsLife/frontend/settings-color-floating-preview.js','utf8');
const storageKey='michelsLife.granadaColorPreview.v1';
const themeKey='michelsLife.colorTheme.v30184';

function fixture(saved=new Map(),language='es'){
  const events={document:new Map(),window:new Map()};
  const writes=[],nodes=new Map(),timeouts=[];
  let panel=null,saveCalls=0;
  const style=()=>({setProperty:(name,value,priority)=>writes.push({name,value,priority})});
  const fieldIds={
    v133Bg:'#151525',v133Panel:'#222233',v133Card:'#333344',
    v133Accent:'#445566',v133Accent2:'#778899',v133Gold:'#aabbcc',
    v133TextColor:'#eaeaea',v30168MainText:'#eaeaea',
    v133MutedTextColor:'#bcbcbc',v30168SecondaryText:'#bcbcbc',
    v133Atmosphere:'#111122'
  };
  const root={querySelector(sel){return fields[sel.slice(1)]||null}};
  const fields=Object.fromEntries(Object.entries(fieldIds).map(([id,value])=>[
    id,{id,value,closest(){return root},getBoundingClientRect(){return {top:100,left:130,right:155}}}
  ]));
  const doc={
    readyState:'loading',hidden:false,activeElement:null,
    documentElement:{style:style()},body:{
      style:style(),
      appendChild(p){p.isConnected=true;panel=p;}
    },
    querySelector(sel){return sel==='#tab-settings'?root:null},
    createElement(){
      const element={
        isConnected:false,style:{},offsetHeight:340,innerHTML:'',
        setAttribute(){},contains(t){return t===element},
        querySelector(sel){
          if(!nodes.has(sel))nodes.set(sel,{style:{},textContent:'',disabled:false});
          return nodes.get(sel);
        }
      };
      return element;
    },
    addEventListener(name,fn){
      if(!events.document.has(name))events.document.set(name,[]);
      events.document.get(name).push(fn);
    }
  };
  const localStorage={
    getItem:key=>saved.has(key)?saved.get(key):null,
    setItem:(key,value)=>saved.set(key,String(value))
  };
  const sandbox={
    localStorage,document:doc,state:{settings:{}},
    MichelsLifeI18n:{language},
    innerWidth:1280,innerHeight:840,console,
    setTimeout(fn){timeouts.push(fn);return timeouts.length},
    clearTimeout(){},
    addEventListener(name,fn){
      if(!events.window.has(name))events.window.set(name,[]);
      events.window.get(name).push(fn);
    },
    save(){saveCalls++}
  };
  sandbox.window=sandbox;
  vm.runInNewContext(source,sandbox,{filename:'settings-color-floating-preview.js'});
  const fire=(kind,name,target,extras={})=>{
    const handlers=events[kind].get(name)||[];
    for(const h of handlers)h({target,...extras});
  };
  return {
    api:sandbox.MLColorFloatingPreview,storage:saved,writes,fields,doc,root,
    fire,panel:()=>panel,node:sel=>nodes.get(sel),saveCalls:()=>saveCalls,
    flush:()=>{for(const fn of timeouts.splice(0))fn();}
  };
}

test('no duplicate initializer; v30184 canonical active palette is written without deleting other values',()=>{
  const storage=new Map([[themeKey,JSON.stringify({accent:'#abcdef',unrelated:42})]]);
  const f=fixture(storage);
  assert.ok(f.api);
  assert.equal(f.api.applyColor('text','#112233'),true);
  assert.equal(f.api.applyColor('muted','#aabbcc'),true);
  assert.equal(f.api.applyColor('alien','#aabbcc'),false);
  assert.equal(f.api.applyColor('text','red'),false);
  assert.equal(JSON.parse(storage.get(themeKey)).unrelated,42);
  assert.equal(JSON.parse(storage.get(themeKey)).accent,'#abcdef');
  assert.equal(JSON.parse(storage.get(themeKey)).text,'#112233');
  assert.equal(JSON.parse(storage.get(storageKey)).muted,'#aabbcc');
  assert.ok(f.writes.some(x=>x.name==='--text'&&x.value==='#112233'&&x.priority==='important'));
  assert.ok(f.writes.some(x=>x.name==='--ui-muted'&&x.value==='#aabbcc'));
  f.flush();
  assert.ok(f.saveCalls()>0,'canonical app save is still called after storing color tokens');
});

test('saved text colors survive navigation/reopen even when a stale palette value exists',()=>{
  const storage=new Map();
  const old=fixture(storage);
  old.api.applyColor('text','#d0ebfe');
  old.api.applyColor('muted','#99aabb');
  old.api.applyColor('bg','#112244');
  // Re-entry: another legacy route wrote stale theme values.
  storage.set(themeKey,JSON.stringify({text:'#ffffff',muted:'#ffffff',bg:'#000000'}));
  const fresh=fixture(storage);
  fresh.api.restore();
  assert.ok(fresh.writes.some(x=>x.name==='--text'&&x.value==='#d0ebfe'));
  assert.ok(fresh.writes.some(x=>x.name==='--muted'&&x.value==='#99aabb'));
  assert.ok(fresh.writes.some(x=>x.name==='--bg'&&x.value==='#112244'));
  assert.equal(fresh.fields.v133TextColor.value,'#d0ebfe');
  assert.equal(fresh.fields.v30168SecondaryText.value,'#99aabb');
  fresh.fire('document','click',{closest(){return null}});
  fresh.flush();
  assert.equal(JSON.parse(storage.get(storageKey)).text,'#d0ebfe');
});

test('contextual preview shows chapter, Pomodoro and alarm colors plus readable contrast warning',()=>{
  const f=fixture();
  const input=f.fields.v133TextColor;
  f.doc.activeElement=input;
  f.fire('document','focusin',input);
  assert.ok(f.panel(),'preview must be created at native settings input focus');
  assert.equal(f.panel().style.display,'block');
  assert.ok(f.panel().innerHTML.includes('data-ml-focus-title'));
  assert.ok(f.panel().innerHTML.includes('data-ml-alarm-title'));
  assert.equal(f.node('[data-ml-focus-title]').textContent,'Pomodoro · Concentración');
  assert.equal(f.node('[data-ml-alarm-title]').textContent,'Alarma · Primera luz');
  input.value='#0e0e0e';
  f.fire('document','input',input);
  assert.ok(f.node('[data-ml-contrast]').textContent.includes('contraste bajo'));
  assert.equal(f.api.contrast('#ffffff','#000000'),21);
  assert.ok(f.node('[data-ml-undo]').disabled===false);
});

test('undo only this color, without changing other selections; dismiss does not trap controls',()=>{
  const f=fixture();
  const input=f.fields.v133TextColor;
  f.doc.activeElement=input;
  f.fire('document','focusin',input);
  input.value='#ccddff';
  f.fire('document','input',input);
  f.api.applyColor('accent','#a1b2c3');
  assert.equal(f.api.undoColor(),true);
  assert.equal(input.value,'#eaeaea');
  assert.equal(JSON.parse(f.storage.get(storageKey)).text,'#eaeaea');
  assert.equal(JSON.parse(f.storage.get(storageKey)).accent,'#a1b2c3');
  f.fire('document','pointerdown',{closest(){return null}});
  assert.equal(f.panel().style.display,'none');
  assert.equal(f.api.undoColor(),false);
});

test('source keeps no automatic theme overrides or changes to Focus Story, alarm or mission stores',()=>{
  assert.doesNotMatch(source,/FocusStoryV30162|personal-alarms|michelsLife\.missions|deleteItem|removeItem/);
  assert.match(source,/window\.addEventListener\('storage'/);
  assert.match(source,/window\.addEventListener\('pageshow'/);
  assert.match(source,/pointer-events:auto/);
  assert.match(source,/granadaColorPreview\.v1/);
});
