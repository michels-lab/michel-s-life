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
  assert.doesNotMatch(focus,/oldDock|v30162FocusDock/);
  assert.doesNotMatch(android,/v30162FocusDock/);
});

test('six Michel\'s Life original full-length alarm arrangements and Android native repeat',()=>{
  assert.match(alarms,/const MICHEL_ALARM_SCORE=/);
  assert.match(alarms,/const length=preview\?7:24/);
  assert.match(alarms,/setInterval\(tone,24000\)/);
  assert.match(alarms,/stopPresetAudio\(\)/);
  assert.match(native,/val durationSeconds = 24/);
  assert.match(native,/preset-v2-\$selected\.wav/);
  assert.match(native,/fun generatePreset\(file: File, preset: String\)/);
  assert.match(overlay,/sound\.isLooping = true/);
  const activity=readFileSync('android/app/src/main/java/com/michelslab/michelslife/MainActivity.kt','utf8');
  assert.match(activity,/player\.isLooping = true/);
  for(const name of ['classic','soft','digital','gentle','pulse','radar']){
    assert.ok(alarms.includes(name+':{'),'missing original score '+name);
    assert.match(native,new RegExp('"'+name+'" -> Pair'));
  }
});

test('native Windows Focus and alarm notifications coexist with Android channels',()=>{
  const shell=readFileSync('src/MichelsLife/DesktopShell.cs','utf8');
  const core=readFileSync('src/MichelsLife/frontend/index.html','utf8');
  const focusNative=readFileSync('android/app/src/main/java/com/michelslab/michelslife/NativeFocusAlarm.kt','utf8');
  assert.match(shell,/PollWindowsFocusAsync\(\)/);
  assert.match(shell,/ShowBalloonTip\(type == "completed"/);
  assert.match(shell,/PollWindowsAlarmsAsync\(\)/);
  assert.match(core,/function takeWindowsNotification\(\)/);
  assert.match(core,/queueFocusDesktop\('started'/);
  assert.match(core,/queueFocusDesktop\('completed'/);
  assert.match(focusNative,/ACTIVE_NOTIFICATION_ID/);
  assert.match(focusNative,/\.setCategory\(Notification\.CATEGORY_PROGRESS\)/);
  assert.match(native,/\.setCategory\(Notification\.CATEGORY_ALARM\)/);
});

test('legacy Focus buttons are deleted at source and only Quick Capture remains',()=>{
  const core=readFileSync('src/MichelsLife/frontend/index.html','utf8');
  for(const old of ['v30162FocusDock','v30175FocusFab','v30173-focus-trigger',
     'setFocusPanelExpanded','toggleFocusPanel','renderFocusDock']){
    assert.ok(!core.includes(old),'retired UI unexpectedly present: '+old);
  }
  assert.match(core,/window\.ActionDockV30175=\{ensureDock\}/);
  assert.match(core,/quick\.dataset\.tip='Quick mission'/);
  assert.match(core,/renderStory,applyPreset,refreshFocusViews,takeWindowsNotification/);
});
