import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const native=readFileSync('android/app/src/main/java/com/michelslab/michelslife/NativeFocusAlarm.kt','utf8');
const mobile=readFileSync('android/mobile-experience.js','utf8');

test('native completion and snooze derive fixed bells from the completed phase, not stored music',()=>{
  assert.match(mobile,/const completionSound=mode==='break'\?'observatory':'soft'/);
  assert.match(mobile,/status:running\?'running':state\.status,deadlineAt:running\?deadline:0,mode,language,completionSound/);
  assert.match(native,/private fun phaseBell\(mode: String\): String = if \(mode == "break"\) "observatory" else "soft"/);
  assert.equal((native.match(/val tone = phaseBell\(mode\)/g)||[]).length,3);
  assert.equal((native.match(/Notification\.Builder\(context, channelIdForSound\(tone\)\)/g)||[]).length,2);
  assert.match(native,/enableVibration\(true\)/);
  assert.doesNotMatch(native,/R\.raw\.mlv_focus_(?:sb_|mozart|tchaikovsky|debussy|chopin|satie|bach)/);
  assert.match(native,/setAndAllowWhileIdle\(AlarmManager\.RTC_WAKEUP, deadline/);
  assert.doesNotMatch(native,/System\.currentTimeMillis\(\)\s*\+\s*workMin/);
  assert.ok(native.indexOf('if (phaseStatus != "running"')<native.indexOf('val tone = phaseBell(mode)'));
});

test('six existing WAV chimes remain intact; only two are eligible for native Pomodoro',()=>{
  const ids=['soft','glass','aurora','observatory','midnight','silver'],hashes=new Set();
  for(const id of ids){
    const file='android/app/src/main/res/raw/mlv_focus_'+id+'.wav';
    const data=readFileSync(file);
    assert.equal(data.toString('ascii',0,4),'RIFF',id);
    assert.equal(data.toString('ascii',8,12),'WAVE',id);
    assert.equal(data.toString('ascii',12,16),'fmt ',id);
    assert.equal(data.readUInt16LE(20),1,'PCM codec');
    assert.equal(data.readUInt16LE(22),1,'mono');
    assert.equal(data.readUInt32LE(24),22050,'fixed sampling rate');
    assert.equal(data.readUInt16LE(34),16,'16-bit depth');
    assert.equal(data.length,data.readUInt32LE(40)+44);
    let peak=0;
    for(let i=44;i<data.length;i+=314)peak=Math.max(peak,Math.abs(data.readInt16LE(i)));
    assert.ok(peak>200,id+' must not be empty/silent');
    const digest=createHash('sha256').update(data).digest('hex');
    assert.ok(!hashes.has(digest),'duplicate native soundscape files');
    hashes.add(digest);
    assert.equal(native.includes('R.raw.mlv_focus_'+id),['soft','observatory'].includes(id),'fixed bell allowlist: '+id);
  }
  assert.equal(hashes.size,6);
});
console.log('PASS original Android background Pomodoro completion tone channel and RIFF provenance');

test('classical recordings remain available as assets but never selected for Pomodoro expiry',()=>{for(const id of ['mozart_k545','tchaikovsky_op39']){assert.ok(!native.includes('R.raw.mlv_focus_'+id));assert.ok(readFileSync('android/app/src/main/res/raw/mlv_focus_'+id+'.mp3').length>500000);}});
