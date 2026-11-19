import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const native=readFileSync('android/app/src/main/java/com/michelslab/michelslife/NativeFocusAlarm.kt','utf8');
const mobile=readFileSync('android/mobile-experience.js','utf8');

test('Android native alarm receives same canonical selected completion chime as WebView',()=>{
  assert.match(mobile,/const completionSound=String\(state\.v30165CompletionSound\|\|'soft'\)/);
  assert.match(mobile,/status:running\?'running':state\.status,deadlineAt:running\?deadline:0,mode,language,completionSound/);
  assert.match(native,/private const val KEY_SOUND = "completionSound"/);
  assert.match(native,/val tone = completionSound\(state\.optString\(KEY_SOUND, "soft"\)\)/);
  assert.match(native,/prefs\.edit\(\)\.putString\(KEY_SOUND, tone\)\.apply\(\)/);
  assert.equal((native.match(/Notification\.Builder\(context, channelIdForSound\(tone\)\)/g)||[]).length,2,
    'normal completion AND snoozed notification must use the selected sound');
  assert.match(native,/if \(chosen == "off"\) setSound\(null, null\)/);
  assert.match(native,/enableVibration\(chosen != "off"\)/);
  assert.match(native,/setAndAllowWhileIdle\(AlarmManager\.RTC_WAKEUP, deadline/);
  assert.doesNotMatch(native,/System\.currentTimeMillis\(\)\s*\+\s*workMin/,
    'must not introduce a duplicate Android timer');
});

test('six original WAV chimes are 16-bit PCM, distinct, nonempty and referenced by native notifications',()=>{
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
    assert.ok(native.includes('R.raw.mlv_focus_'+id),'Kotlin channel missing '+id);
  }
  assert.equal(hashes.size,6);
});
console.log('PASS original Android background Pomodoro completion tone channel and RIFF provenance');
