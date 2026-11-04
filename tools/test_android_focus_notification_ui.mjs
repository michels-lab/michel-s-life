import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

// Execute the real production functions extracted from the Android bundle,
// rather than reimplementing their decisions in a synthetic test helper.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(resolve(root,'android/mobile-experience.js'),'utf8');
const start=source.indexOf('  function focusNotificationPresentation(state){');
const end=source.indexOf('  const isFocusOpen=',start);
assert(start>=0&&end>start&&source.indexOf(
  '  function focusNotificationPresentation(state){',start+1)===-1,
  'Production Focus notification functions missing or duplicated');
const real=source.slice(start,end);
let passed=0;

function exercise(state,expectedLabel,expectedVisible,expectedWord,expectedAction){
  const calls=[];
  const context={
    window:{MichelsLifeAndroid:{
      focusNotificationStatus:()=>JSON.stringify(state),
      openFocusNotificationSettings:()=>calls.push('settings'),
      requestFocusNotificationPermission:()=>calls.push('permission')
    }},
    console:{warn:()=>calls.push('warning')},JSON,String
  };
  vm.createContext(context);
  vm.runInContext(real+'\nthis.Focus={focusNotificationPresentation,requestNativeFocusPermission};',
    context,{timeout:1500});
  const ui=context.Focus.focusNotificationPresentation(state);
  assert.equal(ui.actionLabel,expectedLabel);
  assert.equal(ui.showAction,expectedVisible);
  assert.ok(ui.note.includes(expectedWord),ui.note);
  if(expectedAction){
    context.Focus.requestNativeFocusPermission();
    assert.deepEqual(calls,[expectedAction]);
  }else assert.equal(calls.length,0);
  passed++;
}
exercise({notificationsGranted:false,ongoingCountdownAvailable:false,
  backgroundDelivery:false},'Enable',true,'Allow Michel','permission');
exercise({notificationsGranted:true,ongoingCountdownAvailable:false,
  backgroundDelivery:true},'Settings',true,'running Pomodoro','settings');
exercise({notificationsGranted:true,ongoingCountdownAvailable:true,
  backgroundDelivery:false},'Settings',true,'completion-alert','settings');
exercise({notificationsGranted:true,ongoingCountdownAvailable:true,
  backgroundDelivery:true},'Settings',false,'Countdown available',null);
exercise({notificationsGranted:true,ongoingCountdownAvailable:false,
  backgroundDelivery:false},'Settings',true,'running Pomodoro','settings');
console.log('PASS: '+passed+'/'+passed+' production Android Focus notification UI states');
