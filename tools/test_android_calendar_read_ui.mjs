import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(resolve(root,'src/MichelsLife/frontend/index.html'),'utf8');
const start=source.indexOf('async function syncNow(opts={}){');
const end=source.indexOf('async function refreshStatus(opts={})',start);
const viewStart=source.indexOf('function calendarViewEvents(){',end);
const viewEnd=source.indexOf('function eventsForDate(k){',viewStart);
assert(start>=0 && end>start && viewEnd>viewStart,
  'Real production Android Calendar implementation not found');
const production=source.slice(start,end)+'\n'+source.slice(viewStart,viewEnd);
let passed=0;

function harness({provider,available=true}={}){
  let owner='account-a',connected=false,requests=[];
  const runtime={busy:false,connected:false,lastResult:null,error:'',
    calendarEvents:[],calendarAccount:'',calendarLastSync:''};
  const settings={events:[{id:'previous-local-mission',title:'Local data'}],showEvents:true};
  const win={__MICHELSLIFE_PLATFORM__:'android',
    MichelsLifeAndroid:available?{calendarReadAvailable:()=>true}:{},
    SupabaseSyncV30216:{session:()=>({user:{id:owner}})}};
  const context=vm.createContext({
    window:win,runtime,Date,String,Array,Error,
    settings:()=>settings,
    syncRange:()=>({timeMin:'2026-11-01T00:00:00Z',timeMax:'2026-11-30T23:59:00Z'}),
    mountGoogleSettings:()=>{},decorateCalendar:()=>{},
    toastSafe:()=>{},bridge:async(action,payload)=>{
      requests.push({action,payload});
      return provider?provider(action,payload):{
        events:[{id:'google-123',title:'Calendar event',start:'2026-11-04',
          end:'2026-11-05',allDay:true,htmlLink:'https://calendar.google.com/'}],
        googleEventCount:1,account:'calendar-owner@example.test'
      };
    }
  });
  vm.runInContext(production+
    '\nthis.readAndroidCalendar=syncNow;this.viewCalendarEvents=calendarViewEvents;',
    context,{timeout:1500});
  return {runtime,settings,requests,context,changeOwner:id=>{owner=id},
    read:opts=>context.readAndroidCalendar(opts),
    view:()=>context.viewCalendarEvents()};
}

const normal=harness();
assert.equal((await normal.read()).googleEventCount,1);
assert.equal(normal.requests.length,1);
assert.equal(normal.requests[0].action,'calendarRead');
assert.deepEqual(Object.keys(normal.requests[0].payload).sort(),['timeMax','timeMin']);
assert.equal(normal.runtime.calendarAccount,'calendar-owner@example.test');
assert.equal(normal.view()[0].id,'google-123');
assert.equal(normal.settings.events[0].id,'previous-local-mission',
  'Google provider events must not overwrite shared/synced settings');
passed++;

// A->B after an already successful read must not leave A's Google events
// visible inside B's Calendar (not only guard the request while in-flight).
normal.changeOwner('account-b');
assert.equal(normal.view().length,0);
assert.equal(normal.runtime.calendarAccount,'');
assert.equal(normal.runtime.lastResult,null,
  'Cached Google provider response must be wiped after A-to-B switch');
passed++;

const automatic=harness();
assert.equal(await automatic.read({silent:true}),null);
assert.equal(automatic.requests.length,0,
  'An automatic timer may not display OAuth consent');
passed++;

const unavailable=harness({available:false});
assert.equal(await unavailable.read(),null);
assert.match(unavailable.runtime.error,/does not support/);
assert.equal(unavailable.requests.length,0);
passed++;

const rejected=harness({provider:async()=>{throw Error('Google authorization declined')}});
assert.equal(await rejected.read(),null);
assert.equal(rejected.runtime.calendarEvents.length,0);
assert.equal(rejected.runtime.calendarAccount,'');
passed++;

let resolveProvider;
const inflight=harness({provider:()=>new Promise(resolve=>{resolveProvider=resolve})});
const pending=inflight.read();
inflight.changeOwner('account-b');
resolveProvider({events:[{id:'foreign',title:'Wrong account'}],account:'other@example.test'});
assert.equal(await pending,null);
assert.equal(inflight.runtime.calendarEvents.length,0,
  'An A->B sign-in during the request must discard A Calendar events');
assert.equal(inflight.runtime.lastResult,null,
  'A late provider reply may not survive as a cached result');
assert.match(inflight.runtime.error,/account changed/);
passed++;

const separate=harness();
const p=separate.read();
assert.equal(await separate.read(),null,'a second simultaneous tap must not launch another request');
await p;
assert.equal(separate.requests.length,1,'Concurrent reads cannot duplicate OAuth requests');
passed++;

console.log('PASS: '+passed+'/'+passed+
  ' production Google Calendar Android read, opt-in, privacy and A/B tests');
