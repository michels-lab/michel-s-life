import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

// Run the actual production Focus presentation and in-place locale updater,
// without copying its translation decisions into a test-only implementation.
const rootPath=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(resolve(rootPath,'android/mobile-experience.js'),'utf8');
function sliceOnce(startText,endText){
  const start=source.indexOf(startText);
  const end=source.indexOf(endText,start);
  assert.ok(start>=0&&end>start,'Canonical Focus source anchors must exist');
  assert.equal(source.indexOf(startText,start+1),-1,'Duplicate Focus owner found');
  return source.slice(start,end);
}
const presentation=sliceOnce('  function focusNotificationPresentation(', '  function requestNativeFocusPermission()');
const locale=sliceOnce('  function focusEs()', '  const isFocusOpen=');

const node=(text='')=>{
  const attributes=new Map();
  return {
    textContent:text,childNodes:[],firstChild:null,
    getAttribute:key=>attributes.get(key)||null,
    setAttribute(key,value){attributes.set(key,value);}
  };
};
const elements=new Map(), miniElements=new Map();
for(const selector of [
  '.mlv-android-focus-eyebrow','.mlv-android-focus-head p',
  '.mlv-focus-controls-title','[data-mobile-focus="skip"]',
  '[data-mobile-focus="reset"]','[data-mobile-focus="settings"]',
  'details summary','.mlv-android-focus-compact label:first-child',
  '.mlv-android-focus-compact label:nth-child(2)',
  '[data-mobile-focus="custom"]',
  '.mlv-android-focus-stats>div:first-child span',
  '.mlv-android-focus-stats>div:nth-child(2) span',
  '.mlv-focus-notification-copy strong','#mlv-android-focus-dim',
  '[data-mobile-focus="close"]','.mlv-android-focus-presets'
])elements.set(selector,node());
const dot={nodeType:1,tagName:'I'};
const eyebrowText={nodeType:3,nodeValue:" MICHEL'S LIFE / FOCUS"};
elements.get('.mlv-android-focus-eyebrow').childNodes=[dot,eyebrowText];
const input={nodeType:1,tagName:'INPUT',value:'37'};
for(const selector of [
  '.mlv-android-focus-compact label:first-child',
  '.mlv-android-focus-compact label:nth-child(2)'
]){
  const label=elements.get(selector);
  label.firstChild={nodeType:3,nodeValue:'Work minutes'};
  label.childNodes=[label.firstChild,input];
}
miniElements.set('.mlv-mini-open',node());
const root={querySelector:selector=>elements.get(selector)||null};
const mini={...node(),querySelector:selector=>miniElements.get(selector)||null};
const today=node('Focus session');
const lang={language:'en'};
let textWrites=0;
const ctx={
  window:{MichelsLifeI18n:lang},
  root,mini,Array,
  q:(selector,scope)=>scope?scope.querySelector(selector):
    selector==='#mlv-android-today-focus .mlv-focus-today-copy strong'?today:null,
  writeText:(el,value)=>{if(el&&el.textContent!==String(value)){el.textContent=String(value);textWrites++;}}
};
vm.createContext(ctx);
vm.runInContext(presentation+'\n'+locale+
  '\nthis.Focus={focusNotificationPresentation,focusEs,focusText,localizeFocusSurface};',
  ctx,{timeout:2000});
const Focus=ctx.Focus;

test('English and Spanish mutate existing Android Focus controls without destroying icon or input',()=>{
  Focus.localizeFocusSurface();
  assert.equal(elements.get('[data-mobile-focus="skip"]').textContent,'Skip phase');
  assert.equal(eyebrowText.nodeValue," MICHEL'S LIFE / FOCUS");
  const beforeSecondRun=textWrites;
  Focus.localizeFocusSurface();
  assert.equal(textWrites,beforeSecondRun,'One-second tick must not re-render unchanged nodes');
  lang.language='es';
  Focus.localizeFocusSurface();
  assert.equal(elements.get('[data-mobile-focus="skip"]').textContent,'Saltar fase');
  assert.equal(elements.get('[data-mobile-focus="reset"]').textContent,'Reiniciar');
  assert.equal(elements.get('.mlv-focus-notification-copy strong').textContent,
    'Cuenta regresiva en pantalla bloqueada');
  assert.equal(elements.get('[data-mobile-focus="close"]').getAttribute('aria-label'),'Cerrar Pomodoro');
  assert.equal(elements.get('.mlv-android-focus-presets').getAttribute('aria-label'),'Duraciones de enfoque');
  assert.equal(mini.getAttribute('aria-label'),'Temporizador Pomodoro activo');
  assert.equal(today.textContent,'Sesión de enfoque');
  assert.equal(eyebrowText.nodeValue," MICHEL'S LIFE / ENFOQUE");
  assert.equal(elements.get('.mlv-android-focus-eyebrow').childNodes[0],dot,
    'Locale change destroyed the brand mark');
  assert.equal(input.value,'37','Translation cleared an unsaved duration value');
  assert.equal(elements.get('.mlv-android-focus-compact label:first-child').childNodes[1],input,
    'Translation replaced the input node');
  lang.language='en';
  Focus.localizeFocusSurface();
  assert.equal(elements.get('[data-mobile-focus="skip"]').textContent,'Skip phase');
  assert.equal(eyebrowText.nodeValue," MICHEL'S LIFE / FOCUS");
  assert.equal(input.value,'37','Switching back to English discarded user input');
});

test('Every Android notification permission/channel state is translated without changing actions',()=>{
  for(const [state,es,action] of [
    [{notificationsGranted:false},'Permite las notificaciones','Activar'],
    [{notificationsGranted:true,ongoingCountdownAvailable:false},'cuenta regresiva','Ajustes'],
    [{notificationsGranted:true,ongoingCountdownAvailable:true,backgroundDelivery:false},'aviso al terminar','Ajustes'],
    [{notificationsGranted:true,ongoingCountdownAvailable:true,backgroundDelivery:true},'pantalla bloqueada','Ajustes']
  ]){
    const spanish=Focus.focusNotificationPresentation(state,'es');
    const english=Focus.focusNotificationPresentation(state);
    assert.ok(spanish.note.includes(es),spanish.note);
    assert.equal(spanish.actionLabel,action);
    assert.equal(spanish.showAction,english.showAction,'Locale changed permission decisions');
    assert.ok(english.note.length>0);
  }
});

test('Running clock uses language-dependent copy without mutating canonical timer state',()=>{
  assert.match(source,/localizeFocusSurface\(\);\s*if\(!f\)/);
  assert.match(source,/focusText\('Session in progress','Sesión en curso'\)/);
  assert.match(source,/focusText\('Start focusing','Comenzar enfoque'\)/);
  assert.match(source,/focusText\('Ends at ','Termina a las '\)/);
  assert.match(source,/focusText\('None yet','Ninguna todavía'\)/);
  assert.match(source,/focusNotificationPresentation\(state,focusEs\(\)\?'es':'en'\)/);
  assert.ok(!locale.includes('localStorage.setItem('),'Locale updater must not mutate board storage');
});
