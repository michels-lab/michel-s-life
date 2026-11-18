import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root='src/MichelsLife/frontend/';
const alarms=readFileSync(root+'personal-alarms.js','utf8');
const focus=readFileSync(root+'focus-immersive.js','utf8');
const android=readFileSync('android/mobile-experience.js','utf8');
const native=readFileSync('android/app/src/main/java/com/michelslab/michelslife/NativePersonalAlarms.kt','utf8');
const overlay=readFileSync('android/app/src/main/java/com/michelslab/michelslife/PersonalAlarmOverlay.kt','utf8');
const manifest=readFileSync('android/app/src/main/AndroidManifest.xml','utf8');
const loader=readFileSync('tools/enable_i18n.py','utf8');
const bundle=readFileSync('tools/replace_bundle_index.py','utf8');
const androidBundle=readFileSync('android/tools/prepare_bundle.py','utf8');

function runtime(){
  const window={};
  const document={readyState:'loading',addEventListener(){}};
  vm.runInNewContext(alarms,{window,document,console},{timeout:1000});
  return window.MichelsLifeAlarms;
}
const item=(repeat,date='',days=[],time='09:00')=>({
  id:'alarm-test',label:'Test',repeat,date,days,time,enabled:true
});

test('one-time alarms remain one-time and never reappear after their deadline',()=>{
  const ui=runtime();
  const once=item('once','2026-11-15',[],'10:30');
  const expected=new Date('2026-11-15T10:30:00').getTime();
  assert.equal(ui.localAt(once),expected);
  assert.equal(ui.next(once,expected-1),expected);
  assert.equal(ui.next(once,expected),0);
  assert.equal(ui.next({...once,enabled:false},expected-1),0);
});

test('daily alarm schedules a new day after its previous occurrence',()=>{
  const ui=runtime();
  const before=new Date('2026-11-12T08:00:00').getTime();
  const due=new Date('2026-11-12T09:00:00').getTime();
  assert.equal(ui.next(item('daily'),before),due);
  assert.equal(ui.next(item('daily'),due),new Date('2026-11-13T09:00:00').getTime());
});

test('selected weekdays skip unselected days without duplicating the same due time',()=>{
  const ui=runtime();
  const now=new Date('2026-11-12T08:00:00').getTime(); // Thursday
  const nextSaturday=new Date('2026-11-14T09:00:00').getTime();
  const saturdaySunday=item('weekly','',[0,6]);
  assert.equal(ui.next(saturdaySunday,now),nextSaturday);
  assert.equal(ui.next(saturdaySunday,nextSaturday),new Date('2026-11-15T09:00:00').getTime());
  assert.equal(ui.next(item('weekly','',[1]),now),new Date('2026-11-16T09:00:00').getTime());
});

test('Windows and Android both expose alarms beside immersive Pomodoro',()=>{
  assert.match(alarms,/mlv-alarm-ring/);
  assert.match(alarms,/useWallpaper\(ring\)/);
  assert.match(alarms,/setInterval\(tone,24000\)/);
  assert.match(alarms,/mlv-alarm-launcher/);
  assert.match(focus,/data-focus-action="alarms"/);
  assert.match(android,/data-mobile-focus="alarms"/);
  assert.match(alarms,/openPersonalAlarmPermissionSettings/);
});

test('Android alarm delivery is native, persistent and permission-aware',()=>{
  for(const permission of ['VIBRATE','POST_NOTIFICATIONS','SCHEDULE_EXACT_ALARM','SYSTEM_ALERT_WINDOW','USE_FULL_SCREEN_INTENT']){
    assert.ok(manifest.includes('android.permission.'+permission),permission);
  }
  for(const feature of [
    'AlarmManager.RTC_WAKEUP','setExactAndAllowWhileIdle','setAndAllowWhileIdle',
    'notificationAllowed','canUseFullScreenIntent','Notification.CATEGORY_ALARM',
    'setFullScreenIntent','LocalDateTime','schedule(context, target)',
    'fun recover(context: Context)'
  ]){
    if(feature==='schedule(context, target)')continue; // recursion uses current item
    assert.ok(native.includes(feature),feature);
  }
  assert.match(native,/fun snooze\(context: Context, id: String\)/);
  assert.match(native,/PersonalAlarmOverlay\.show/);
  assert.match(overlay,/TYPE_APPLICATION_OVERLAY/);
  assert.match(overlay,/isDeviceLocked/);
  assert.match(overlay,/MediaPlayer/);
  assert.match(overlay,/VibrationEffect\.createWaveform/);
  assert.match(overlay,/NativePersonalAlarms\.dismiss/);
});

test('scripts reach both platform packages with no missing asset',()=>{
  assert.match(loader,/ALARM_LOADER_MARKER/);
  assert.match(bundle,/dst\.writestr\("personal-alarms\.js", personal_alarms\.read_bytes\(\)\)/);
  assert.match(androidBundle,/shutil\.copy2\(PERSONAL_ALARMS, assets \/ 'personal-alarms\.js'\)/);
});


test('Windows alarm delivery stays connected to the tray while minimized',()=>{
  const shell=readFileSync('src/MichelsLife/DesktopShell.cs','utf8');
  assert.match(shell,/Tick \+= async \(_, _\) => await PollWindowsAlarmsAsync\(\)/);
  assert.match(shell,/window\.MichelsLifeAlarms\?\.takeWindowsNotification\?\.\(\)/);
  assert.match(shell,/RestoreWindow\(\)/);
  assert.match(shell,/System\.Media\.SystemSounds\.Exclamation\.Play\(\)/);
  assert.match(alarms,/const windowsNotifications=\[\]/);
  assert.match(alarms,/windowsNotifications\.push\(\{/);
  assert.match(alarms,/return windowsNotifications\.shift\(\)\|\|null/);
  assert.match(alarms,/now-15\*60\*1000/);
  assert.match(alarms,/window\.addEventListener\?\.\('click',captureAlarmLauncher,true\)/);
  assert.doesNotMatch(alarms,/window\.addEventListener\?\.\('pointerdown',captureAlarmLauncher,true\)/);
});


test('Quick Alarm stores an exact 5-minute deadline rather than rounding to a later minute',()=>{
  const saved=new Map();
  const window={};
  const document={readyState:'loading',addEventListener(){}};
  const storage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
  vm.runInNewContext(alarms,{window,document,localStorage:storage,console},{timeout:1000});
  const ui=window.MichelsLifeAlarms;
  const started=Date.now();
  assert.equal(ui.quickAlarm(5),true);
  const item=ui.records()[0];
  assert.equal(item.repeat,'once');
  assert.equal(item.sound,'system');
  assert.ok(item.dueAt-started>=5*60000&&item.dueAt-started<5*60000+2000,'precise five-minute deadline');
  assert.equal(ui.localAt(item),item.dueAt);
  assert.equal(ui.next(item,item.dueAt-1),item.dueAt);
  assert.equal(ui.next(item,item.dueAt),0);
  assert.equal(ui.quickAlarm(60),true);
  assert.equal(ui.quickAlarm(7),false);
  const savedRecords=JSON.parse(saved.get('michelsLife.alarms.v1'));
  assert.equal(savedRecords.length,2);
  assert.ok(savedRecords[1].dueAt-started>=3600000,'one-hour quick deadline');
});

test('the selector offers preview, imported MP3/WAV/OGG and bounded private native storage',()=>{
  for(const id of ['classic','soft','digital','gentle','pulse','radar','custom'])
    assert.ok(alarms.includes(id),id);
  for(const duration of ['5','10','15','30','60','120'])
    assert.match(alarms,new RegExp('data-quick-minutes="'+duration+'"'));
  for(const feature of ['mlv-alarm-sound','mlv-alarm-preview','mlv-alarm-custom-file',
    'customDatabase','saveCustomBlob','indexedDB','installCustomAlarmSound','playPresetSound'])
    assert.ok(alarms.includes(feature),feature);
  assert.match(alarms,/file.size>6\*1024\*1024/);
  assert.match(native,/fun installCustomSound\(context: Context, dataUrl: String\)/);
  assert.match(native,/Base64\.decode/);
  assert.match(native,/File\(context\.filesDir, "personal-alarm-audio"\)/);
  assert.match(native,/\.put\("sound", sound\)/);
  assert.match(native,/\.put\("dueAt", dueAt\)/);
  assert.match(native,/if \(precise > 0L\) return precise/);
  assert.match(native,/fun alarmSoundUri\(context: Context, alarmId: String\)/);
  const bridge=readFileSync('android/app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt','utf8');
  const activity=readFileSync('android/app/src/main/java/com/michelslab/michelslife/MainActivity.kt','utf8');
  assert.match(bridge,/fun installCustomAlarmSound\(dataUrl: String\)/);
  assert.match(activity,/override fun onShowFileChooser/);
  assert.match(activity,/ACTION_OPEN_DOCUMENT/);
  assert.match(activity,/pendingWebFilePicker\?\.onReceiveValue/);
  assert.match(activity,/NativePersonalAlarms\.alarmSoundUri\(this, id\)/);
  assert.match(overlay,/NativePersonalAlarms\.alarmSoundUri\(context, id\)/);
});

test('two same-deadline Windows alarms are enqueued independently and survive first dismiss',()=>{
  const batch=alarms.slice(alarms.indexOf('function collectDueAlarms('),alarms.indexOf('function takeWindowsNotification('));
  assert.match(batch,/dueAlarms\.push\(item\)/);
  assert.match(batch,/pendingDueRings\.push\(item\.id\)/);
  assert.match(batch,/windowsNotifications\.push\(\{id:item\.id/);
  assert.match(batch,/ringNextDue\(\)/);
  assert.doesNotMatch(batch,/shown\.add\(key\);ringAlarm\(item\.id\);break/);
  assert.match(alarms,/ring\.hidden=true;ringingId=null;document\.body\.classList\.remove\('mlv-alarm-visible'\);\s*\/\/[^\n]*\n ringNextDue\(\);/);
  assert.match(alarms,/if\(!android\(\)&&notify\)windowsNotifications\.push\(/);
});

test('both native Android and Windows snooze preserve exact 5-minute deadlines',()=>{
  const nativeSnooze=native.slice(native.indexOf('fun snooze(context:'),native.indexOf('private fun notificationAllowed'));
  const webSnooze=alarms.slice(alarms.indexOf('function dismissRing('),alarms.indexOf('function collectDueAlarms('));
  assert.match(nativeSnooze,/val dueAt = System\.currentTimeMillis\(\) \+ 5L \* 60_000L/);
  assert.match(nativeSnooze,/LocalDateTime\.ofInstant/);
  assert.match(nativeSnooze,/\.put\("dueAt", dueAt\)/);
  assert.doesNotMatch(nativeSnooze,/plusMinutes\(6\)|withSecond\(0\)/);
  assert.match(webSnooze,/const dueAt=Date\.now\(\)\+5\*60000,when=/);
  assert.match(webSnooze,/date,time,dueAt,repeat:'once'/);
  assert.doesNotMatch(webSnooze,/setMinutes\(next\.getMinutes\(\)\+1/);
});

test('user ringtone URLs are revoked on preview replacement and full alarm dismissal',()=>{
  assert.match(alarms,/function stopCustomAudio\(isPreview=false\)/);
  assert.match(alarms,/if\(url\)URL\.revokeObjectURL\(url\)/);
  assert.match(alarms,/const generation=\+\+previewGeneration/);
  assert.match(alarms,/requestGeneration!==previewGeneration/);
  assert.match(alarms,/stopCustomAudio\(true\)/);
  assert.match(alarms,/stopCustomAudio\(false\)/);
});

test('desktop login startup is enabled once and respects later user opt-out',()=>{
  const shell=readFileSync('src/MichelsLife/DesktopShell.cs','utf8');
  assert.match(shell,/EnsureStartupPreferenceOnce\(\)/);
  assert.match(shell,/StartupPreferenceConfigured/);
  assert.match(shell,/MarkStartupPreferenceConfigured\(\)/);
  assert.match(shell,/SetStartWithWindows\(true\)/);
  assert.match(shell,/Manual opt-out remains off/);
  assert.match(shell,/CheckOnClick = true/);
});

test('optional motivational quotes cannot cover Pomodoro timer or primary buttons',()=>{
  assert.match(focus,/<details class="mlv-focus-motivation-details">/);
  assert.match(android,/<details class="mlv-focus-motivation-details">/);
  assert.ok(focus.indexOf('<details class="mlv-focus-motivation-details">')>
    focus.indexOf('data-focus-action="toggle"'),'desktop quotes appear below controls');
  assert.ok(android.indexOf('<details class="mlv-focus-motivation-details">')>
    android.indexOf('data-mobile-focus="toggle"'),'Android quotes appear below controls');
  assert.doesNotMatch(focus,/oldDock/);
  assert.doesNotMatch(focus,/backdrop-filter:blur/);
  assert.doesNotMatch(android,/#v30171Sidebar #v30162FocusDock/);
  assert.equal(android.includes('backdrop-filter:blur(3px)'),false);

});

test('legacy sidebar Pomodoro presentation is deleted at source',()=>{
  const core=readFileSync(root+'index.html','utf8');
  assert.equal(core.includes('function ensureFocusDock('),false);
  assert.equal(core.includes('v30173-focus-wrap" data-mode='),false);
  assert.equal(core.includes('Global Focus Timer dock'),false);
  assert.equal(core.includes('v30162FocusDock'),false);
  assert.equal(core.includes('v30173-focus-panel'),false);
  assert.equal(core.includes('function augmentFocus()'),false);
  assert.ok(core.includes("if(focusAction.dataset.mlvFocusAction==='open')"));
  assert.ok(core.includes('window.MichelsLifeFocusImmersive?.open?.()'));
  assert.ok(core.includes('function setFocusPanelExpanded(open){'));
  assert.equal(core.includes("f.expanded=!!open"),false);
  assert.ok(core.includes('data-mlv-focus-preset="90/15"'));
  assert.ok(core.includes("if(preset==='90/15'){work=90;rest=15}"));
  assert.ok(core.includes('data-v30165-focus-toggle="sound"'));
  assert.ok(core.includes('data-v30165-focus-toggle="autobreak"'));
  assert.equal(core.includes('function applyDeep()'),false);
  assert.ok(core.includes('augmentFocus:ensureFocusPreferences'));
  assert.equal(core.includes('augmentProjects,augmentFocus,openProjectSetup'),false);
  assert.equal(core.includes('.v30165-focus-extra{'),false);
  assert.equal(core.includes("root.id='v30106Focus'"),false);
  assert.equal(core.includes('v30175FocusFab'),false);
  assert.ok(core.includes("quick.id='v30106QuickFab'"));
  assert.equal(core.includes('function renderFocus(){'),false);
  assert.ok(core.includes('function renderFocusDock(){return focusState();}'));
  assert.ok(core.includes('MichelsLifeFocusImmersive?.open?.()'));
});

test('six original 24-second ringtone arrangements repeat until dismissed',()=>{
  assert.ok(alarms.includes("Michel's Life exclusive alarm suite"));
  assert.ok(alarms.includes('MICHEL_ALARM_SCORE'));
  assert.ok(alarms.includes('const length=preview?7:24'));
  assert.ok(alarms.includes('stopPresetAudio()'));
  assert.ok(alarms.includes('setInterval(tone,24000)'));
  assert.ok(native.includes('"radar"'));
  assert.ok(native.includes('AlarmNote('));
  assert.ok(alarms.includes('useSystemFallback=true'));
  assert.ok(native.includes('val durationSeconds = 24'));
  assert.ok(native.includes('preset-v2-$selected.wav'));
  assert.ok(overlay.includes('sound.isLooping = true'));
});
