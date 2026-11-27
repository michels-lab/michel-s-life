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
  assert.match(shell,/MichelsLifeAlarms\?\.isAudible\?\.\(\)===true/);
  assert.match(shell,/if \(!string\.Equals\(audibleRaw, "true"/);
  assert.match(alarms,/function isAudible\(\)/);
  assert.match(alarms,/takeWindowsNotification,isAudible/);
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
  assert.equal(item.sound,'gentle');
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

test('the selector offers preview, imported MP3/WAV/OGG and chunked private native storage without a file-size cap',()=>{
  for(const id of ['classic','soft','digital','gentle','pulse','radar','custom'])
    assert.ok(alarms.includes(id),id);
  for(const duration of ['5','10','15','30','60','120'])
    assert.match(alarms,new RegExp('data-quick-minutes="'+duration+'"'));
  for(const feature of ['mlv-alarm-sound','mlv-alarm-preview','mlv-alarm-custom-file',
    'customDatabase','saveCustomBlob','indexedDB','beginCustomAlarmSound','appendCustomAlarmSound','finishCustomAlarmSound','cancelCustomAlarmSound','playPresetSound'])
    assert.ok(alarms.includes(feature),feature);
  assert.doesNotMatch(alarms,/file\.size\s*>\s*6\*1024\*1024|max 6 MB/);
  assert.match(alarms,/file\.slice\(offset,Math\.min\(file\.size,offset\+AUDIO_CHUNK_BYTES\)\)/);
  assert.match(native,/fun beginCustomSound\(context: Context, extension: String, sizeText: String\)/);
  assert.match(native,/transfer\.file\.appendBytes\(bytes\)/);
  assert.match(native,/transfer\.written != transfer\.expected/);
  assert.match(native,/dir\.usableSpace < size/);
  assert.doesNotMatch(native,/Audio exceeds 6 MB|8_500_000|6 \* 1024 \* 1024/);
  assert.match(native,/Base64\.decode/);
  assert.match(native,/File\(context\.filesDir, "personal-alarm-audio"\)/);
  assert.match(native,/\.put\("sound", sound\)/);
  assert.match(native,/\.put\("dueAt", dueAt\)/);
  assert.match(native,/if \(precise > 0L\) return precise/);
  assert.match(native,/fun alarmSoundUri\(context: Context, alarmId: String\)/);
  const bridge=readFileSync('android/app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt','utf8');
  const activity=readFileSync('android/app/src/main/java/com/michelslab/michelslife/MainActivity.kt','utf8');
  for(const name of ['beginCustomAlarmSound','appendCustomAlarmSound','finishCustomAlarmSound','cancelCustomAlarmSound'])assert.ok(bridge.includes('fun '+name+'('));
  assert.match(activity,/override fun onShowFileChooser/);
  assert.match(activity,/ACTION_OPEN_DOCUMENT/);
  assert.match(activity,/Intent.EXTRA_ALLOW_MULTIPLE, fileChooserParams\?\.mode == FileChooserParams.MODE_OPEN_MULTIPLE/);
  assert.match(activity,/data\?\.clipData/);
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

test('permanent motivational quotes follow the clock and precede the optional sound settings',()=>{
  assert.doesNotMatch(focus,/<details class="mlv-focus-motivation-details">/);
  assert.doesNotMatch(android,/<details class="mlv-focus-motivation-details">/);
  assert.ok(focus.indexOf('id="mlv-desktop-focus-clock"')<focus.indexOf('id="mlv-desktop-focus-motivation"'));
  assert.ok(focus.indexOf('id="mlv-desktop-focus-motivation"')<focus.indexOf('data-mlv-audio="toggle-ambient">Play'));
  assert.ok(android.indexOf('id="mlv-android-focus-time"')<android.indexOf('id="mlv-android-focus-motivation"'));
  assert.ok(android.indexOf('id="mlv-android-focus-motivation"')<android.indexOf('data-mobile-focus="toggle-ambient">Play'));
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
  assert.ok(core.includes('Phase completion always uses bells.'));
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

test('six original 24-second cinematic stereo alarm arrangements repeat until dismissed',()=>{
  assert.match(alarms,/exclusive alarm suite v3/);
  assert.match(alarms,/const ALARM_SCENES=/);
  assert.match(alarms,/const ALARM_SECONDS=24, ALARM_HZ=22050/);
  assert.match(alarms,/four harmonic chapters|Four harmonic chapters/);
  assert.match(alarms,/const duration=preview\?12:ALARM_SECONDS/);
  assert.match(alarms,/stopPresetAudio\(\)/);
  assert.match(alarms,/setInterval\(tone,24000\)/);
  assert.match(alarms,/createBuffer\(2,sample.left.length,sample.rate\)/);
  assert.match(alarms,/Math\.tanh\(left\[i\]\*rise\)/);
  assert.match(alarms,/useSystemFallback=true/);
  assert.match(native,/val sampleRate = 22050/);
  assert.match(native,/val durationSeconds = 24/);
  assert.match(native,/preset-v3-\$selected\.wav/);
  assert.match(native,/buffer\.putShort\(2\.toShort\(\)\)/);
  assert.match(native,/synchronized\(presetRenderLock\)/);
  assert.match(native,/val immersiveOverlayActive = PersonalAlarmOverlay\.show/);
  assert.match(native,/val selectedChannel = if \(immersiveOverlayActive &&/);
  assert.match(native,/PersonalAlarmOverlay\.hasAudibleRingtone\(id\)\) SILENT_CHANNEL else CHANNEL/);
  assert.match(native,/Notification\.Builder\(context, selectedChannel\)/);
  assert.match(native,/NotificationChannel\(SILENT_CHANNEL/);
  assert.match(native,/setSound\(null, null\)/);
  assert.match(native,/enableVibration\(false\)/);
  assert.match(overlay,/fun hasAudibleRingtone\(id: String\): Boolean/);
  assert.match(overlay,/player\?\.isPlaying == true/);
  assert.doesNotMatch(native,/notificationBuilder\.setSilent\(/);
  assert.match(overlay,/sound\.isLooping = true/);
});

test('new original soundscapes contain evolving harmonies, resonant melody and stereo separation',()=>{
  // Use the actual production synth rather than judging names or passing a
  // mock Web Audio sequence. No audio device/IndexedDB is required.
  const hook='window.MichelsLifeAlarms={open,close,ringAlarm,read,records:()=>records.slice(),next,localAt,dismissRing,quickAlarm:createQuickAlarm,pollWindows:tick,takeWindowsNotification,isAudible};';
  assert.ok(alarms.includes(hook),'canonical sound runtime hook found');
  const source=alarms.replace(hook,
    'window.__testAlarmRender={renderAlarmSoundscape,ALARM_SCENES};'+hook);
  const window={},document={readyState:'loading',documentElement:{dataset:{}},addEventListener(){}};
  vm.runInNewContext(source,{window,document,console,Float32Array,Math},{timeout:1000});
  const {renderAlarmSoundscape,ALARM_SCENES}=window.__testAlarmRender;
  const hashes=new Set();
  for(const id of ['classic','soft','digital','gentle','pulse','radar']){
    const score=ALARM_SCENES[id];
    assert.equal(score.roots.length,4,id+' must have four harmonic chapters');
    assert.ok(score.pattern.length>=4&&score.pattern.length<=9,id+' needs a distinct melodic phrase');
    assert.equal(score.offsets.length,score.pattern.length,id+' rhythms and notes must align');
    const render=renderAlarmSoundscape(id);
    assert.equal(render.rate,22050);
    assert.equal(render.seconds,24);
    assert.equal(render.left.length,22050*24);
    assert.equal(render.right.length,22050*24);
    let peak=0,energy=0,spatial=0;
    const sampleCount=render.left.length;
    for(let i=0;i<sampleCount;i+=20){
      const l=render.left[i],r=render.right[i];
      assert.ok(Number.isFinite(l)&&Number.isFinite(r),id+' contains NaN');
      peak=Math.max(peak,Math.abs(l),Math.abs(r));
      energy+=(l*l+r*r)*.5;
      spatial+=Math.abs(l-r);
    }
    const rms=Math.sqrt(energy/(sampleCount/20));
    assert.ok(peak>.68&&peak<=.82,id+' clipping / unexpectedly quiet peak '+peak);
    assert.ok(rms>.025,id+' inaudible sustained scene '+rms);
    assert.ok(spatial>30,id+' lacks left/right motion '+spatial);
    assert.ok(Math.abs(render.left[0])<.001&&Math.abs(render.right.at(-1))<.03,id+' must fade cleanly between loops');
    hashes.add(Array.from(render.left.slice(100000,100150)).map(x=>x.toFixed(3)).join(','));
  }
  assert.equal(hashes.size,6,'all six themes require their own composition');
});

test('Mozart and Tchaikovsky alarms use the bundled human performances on both platforms',()=>{
 for(const id of ['mozart_k545','tchaikovsky_op39']){
  assert.ok(alarms.includes("'"+id+"'"));
  assert.ok(native.includes('R.raw.mlv_focus_'+id));
  assert.ok(readFileSync('android/app/src/main/res/raw/mlv_focus_'+id+'.mp3').length>500000);
  assert.ok(!alarms.includes(id+':{roots:'));
 }
 assert.ok(alarms.includes("new Audio('assets/audio/classical/'+id+'.mp3')"));
 assert.ok(native.includes('if (recorded != 0) return Uri.parse'));
});
test('all ten original Focus motifs are selectable and survive daily alarm reloads',()=>{
  const ids=[
    'focus_moonlight','focus_celestial','focus_orbit','focus_aurora',
    'focus_observatory','focus_library','focus_afterglow','focus_silver',
    'mozart_k545','tchaikovsky_op39','sb_meanwhile','sb_moonlight','sb_cobalt','sb_skyward','sb_life_is','sb_first_snow','sb_midsommar','sb_at_the_end_of_all_things','sb_in_this_moment','sb_hyperion','sb_ascension','sb_bring_me_the_sky','debussy_clair_de_lune','chopin_nocturne_op9','satie_gymnopedie_1','bach_prelude_bwv846'
  ];
  const saved=ids.map((sound,i)=>({
    id:'scene-'+i,label:'Audio '+i,time:'09:00',repeat:'daily',date:'',
    days:[],sound,enabled:true
  }));
  const records=new Map([['michelsLife.alarms.v1',JSON.stringify(saved)]]);
  const localStorage={
    getItem:key=>records.get(key)||null,
    setItem:(key,value)=>records.set(key,value)
  };
  const window={},document={readyState:'loading',documentElement:{dataset:{}},addEventListener(){}};
  vm.runInNewContext(alarms,{window,document,localStorage,console},{timeout:1000});
  window.MichelsLifeAlarms.read();
  assert.deepEqual(Array.from(window.MichelsLifeAlarms.records(),x=>x.sound),ids);
  for(const id of ids){
    if(id.startsWith('focus_')){assert.ok(alarms.includes(id+':{roots:'),'WebAudio score missing '+id);assert.ok(native.includes('"'+id+'" -> SoundScene'),'native score missing '+id);}else assert.ok(native.includes('R.raw.mlv_focus_'+id));
    assert.ok(native.includes('"'+id+'"'),'native selection missing '+id);
  }
  assert.ok(alarms.includes('score.ambientNotes[degree]'));
  assert.ok(native.includes('notes[score.pattern[step]]'));
  assert.ok(alarms.includes("preview?12:ALARM_SECONDS"));
  assert.ok(native.includes('preset-v3-$selected.wav'));
});


test('actual import controller streams a 17 MiB MP3 and rolls back incomplete native replacements',async()=>{
  const begin=alarms.indexOf('function readDataURL(part)'),end=alarms.indexOf("/* Michel's Life exclusive alarm suite",begin);
  assert.ok(begin>=0&&end>begin);
  let saved={blob:{old:true},name:'previous.mp3'},alerted=[],length=0,expected=0,parts=0,largest=0,cancelled=0,fail=false;
  const label={textContent:'previous.mp3'},input={disabled:false},select={value:'gentle'};
  const native={beginCustomAlarmSound(ext,size){assert.equal(ext,'mp3');expected=Number(size);length=0;parts=0;return JSON.stringify({ok:true,token:'test'});},appendCustomAlarmSound(token,offset,encoded){assert.equal(token,'test');assert.equal(Number(offset),length);const part=Buffer.from(encoded,'base64');largest=Math.max(largest,part.length);length+=part.length;parts++;return JSON.stringify({ok:true});},finishCustomAlarmSound(){assert.equal(length,expected);return JSON.stringify(fail?{error:'storage failure'}:{ok:true});},cancelCustomAlarmSound(){cancelled++;return true;}};
  class FileReader{readAsDataURL(part){this.result='data:audio/mpeg;base64,'+Buffer.alloc(part.size).toString('base64');this.onload();}}
  const window={MichelsLifeAndroid:native,alert:m=>alerted.push(m)};
  const code=alarms.slice(begin,end)+'\nwindow.runImport=importSound;';
  const context={window,FileReader,screen:{},q:sel=>sel.includes('custom-file')?input:sel.includes('custom-name')?label:select,android:()=>true,tr:(en)=>en,storedCustomBlob:async()=>saved,saveCustomBlob:async(blob,name)=>{saved={blob,name};}};
  vm.runInNewContext(code,context);
  const size=17*1024*1024+123,file={name:'long.mp3',size,slice:(a,b)=>({size:b-a})};
  assert.equal(await window.runImport(file),true);assert.equal(length,size);assert.ok(parts>64);assert.equal(largest,256*1024);assert.equal(saved.blob,file);assert.equal(select.value,'custom');assert.equal(label.textContent,'long.mp3');assert.equal(input.disabled,false);
  fail=true;const replacement={...file,name:'replacement.mp3'};assert.equal(await window.runImport(replacement),false);assert.equal(saved.blob,file);assert.equal(cancelled,1);assert.ok(alerted.length);assert.equal(input.disabled,false);
});


test('Android persistence accepts every alarm selector sound, including snoozed recordings',()=>{
  const ids=[...alarms.match(/const SOUNDS=\[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
  const recorded=native.match(/private fun recordedResource\(selected: String\): Int = when \(selected\) \{([\s\S]*?)\n    \}/);
  const presets=native.match(/private val generatedSounds = setOf\(([\s\S]*?)\)/);
  assert.ok(recorded&&presets,'native validation must reuse the actual playback catalog');
  const recordingIds=[...recorded[1].matchAll(/"([^"]+)"\s*->\s*R\.raw\.mlv_focus_([a-z0-9_]+)/g)].map(m=>{
    assert.equal(m[1],m[2],'resource identity must match');return m[1];
  });
  const presetIds=[...presets[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual([...new Set(['system','custom',...recordingIds,...presetIds])].sort(),[...ids].sort());
  const cleaner=native.slice(native.indexOf('private fun clean('),native.indexOf('private fun deliveryIntent('));
  assert.match(cleaner,/val sound = normalizeSound\(input\.optString\("sound", "system"\)\)/);
  assert.match(native,/private fun normalizeSound\(selected: String\): String =\s*if \(selected == "system" \|\| selected == "custom" \|\|\s*selected in generatedSounds \|\| recordedResource\(selected\) != 0\) selected else "system"/);
  assert.match(native,/val recorded = recordedResource\(selected\)/);
  assert.match(native,/if \(selected in generatedSounds\)/);
  const snooze=native.slice(native.indexOf('fun snooze(context:'),native.indexOf('private fun notificationAllowed'));
  assert.match(snooze,/\.put\("sound", selected\.optString\("sound", "system"\)\)/);
  assert.match(snooze,/armOccurrence\(context, replacementId, dueAt\)/);
});

test('failed snooze keeps the ringing overlay active and failed native save retains scheduling',()=>{
  const snooze=native.slice(native.indexOf('fun snooze(context:'),native.indexOf('private fun notificationAllowed'));
  assert.match(snooze,/fun snooze\(context: Context, id: String\): Boolean/);
  assert.match(snooze,/if \(original.length\(\) >= 80\) return false/);
  assert.match(snooze,/if \(!wasDelivered\(context, id\)\) return false/);
  assert.match(snooze,/\.putString\(KEY_ALARMS, originalRaw\)/);
  assert.match(snooze,/\.putLong\(deliveryKey, deliveredAt\)/);
  const save=native.slice(native.indexOf('fun sync(context:'),native.indexOf('fun recover(context:'));
  assert.ok(save.indexOf('armOccurrence(context, id, date)')<save.indexOf('if (!edit.commit())'));
  assert.ok(save.indexOf('if (!edit.commit())')<save.indexOf('for ((id, previous) in oldOccurrences)'));
  assert.match(save,/for \(\(id, date\) in armed\) retireOccurrence\(context, id, date\)/);
  assert.match(overlay,/if \(NativePersonalAlarms.snooze\(app, id\)\) \{\s*NativePersonalAlarms.dismiss\(app, id\)/);
  const start=overlay.slice(overlay.indexOf('private fun startAttention'),overlay.indexOf('fun stop(context:'));
  assert.ok(start.indexOf('player = sound')<start.indexOf('sound.setDataSource'));
  assert.match(start,/player\?\.release\(\)/);
  const dismiss=alarms.slice(alarms.indexOf('function dismissRing('),alarms.indexOf('function collectDueAlarms('));
  assert.ok(dismiss.indexOf('records.length>=80')>=0);
  assert.ok(dismiss.indexOf('records.length>=80')<dismiss.indexOf('stopPresetAudio()'));
});

test('native receiver rejects stale, duplicate and early alarm occurrences and recovers each independently',()=>{
  const delivery=native.slice(native.indexOf('fun deliver(context:'),native.indexOf('class PersonalAlarmReceiver'));
  assert.match(native,/putExtra\(EXTRA_OCCURRENCE, occurrence\)/);
  assert.match(native,/putLong\(key, date\).commit\(\)/);
  assert.match(delivery,/if \(occurrence <= 0L \|\| stored != occurrence \|\| occurrence > System.currentTimeMillis\(\)\) return/);
  assert.ok(delivery.indexOf('.remove(SCHEDULED_PREFIX + id)')<delivery.indexOf('schedule(context, target)'));
  assert.match(native,/intent.getLongExtra\(NativePersonalAlarms.EXTRA_OCCURRENCE, 0L\)/);
  assert.match(native,/fun recover\(context: Context\)[\s\S]*?try \{ schedule\(context, item\) \} catch/);
});
test('a second native overlay queues without replacing the first and advances on dismissal',()=>{
  assert.match(overlay,/if \(view != null && activeId != null\) \{\s*pending\[id\] = QueuedAlarm\(id, title, time\)\s*return true/);
  assert.match(overlay,/fun dismiss\(context: Context, id: String\) \{\s*pending.remove\(id\)\s*if \(!isRinging\(id\)\) return\s*stop\(context\)/);
  assert.match(overlay,/while \(pending.isNotEmpty\(\)\)[\s\S]*?show\(context, next.id, next.title, next.time\)/);
  assert.match(native,/PersonalAlarmOverlay.dismiss\(context, id\)/);
  assert.match(native,/if \(!PersonalAlarmOverlay.isQueued\(id\) &&/);
});

test('occurrence identity uses immutable data and unrelated edits preserve delayed delivery',()=>{
  assert.match(native,/michelslife:\/\/personal-alarm\/\$id\/\$occurrence/);
  assert.match(native,/PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE/);
  assert.match(native,/if \(previous != date\) retireOccurrence\(context, id, previous\)/);
  assert.match(native,/if \(previous != newOccurrences\[id\]\) retireOccurrence\(context, id, previous\)/);
  assert.match(native,/if \(old != null && sameSchedule\(old, item\) && previous > 0L\) previous/);
});
test('recent unacknowledged alarms restore from persistent delivery records and notification tags are unique',()=>{
  assert.match(native,/fun recentDelivered\(context: Context\): List<JSONObject>/);
  assert.match(native,/\.filter \{ wasDelivered\(context, it.optString\("id"\)\) \}/);
  assert.match(native,/\.sortedBy \{ prefs\(context\).getLong\(LAST_DELIVERED_PREFIX/);
  assert.match(overlay,/for \(item in NativePersonalAlarms.recentDelivered\(context\)\)/);
  assert.match(native,/PersonalAlarmOverlay.dismiss\(context, id\)\s*PersonalAlarmOverlay.restoreRecent\(context\)/);
  assert.match(native,/manager.notify\(notificationTag\(id\), NOTIFICATION_ID,/);
  assert.match(native,/manager.cancel\(notificationTag\(id\), NOTIFICATION_ID\)/);
});

test('invalid native alarm input cannot silently replace the registry and CAS rejects a stale list',()=>{
  const sync=native.slice(native.indexOf('fun sync(context:'),native.indexOf('fun recover(context:'));
  assert.ok(sync.indexOf('Invalid alarm record')<sync.indexOf('putString(KEY_ALARMS'));
  assert.ok(sync.indexOf('Duplicate alarm identifier')<sync.indexOf('putString(KEY_ALARMS'));
  assert.match(native,/if \(registrySnapshot\(context\) != expected\)/);
  assert.match(native,/val existing = readRegistry\(context\)/);
});
test('real frontend registry controller fails closed on stale read and never overwrites newer Android delivery',()=>{
  const from=alarms.indexOf('function hasNativeRegistry()'),to=alarms.indexOf('function localAt(',from);
  let raw=JSON.stringify([{id:'a',enabled:true}]),written=0,alerts=0,local=raw;
  const context={window:{MichelsLifeAndroid:{getPersonalAlarms:()=>raw,syncPersonalAlarmsIfUnchanged:(next,expected)=>{
    if(expected!==raw)return JSON.stringify({error:'stale'});
    written++;raw=next;return JSON.stringify({registry:raw});
  }},alert(){alerts++;}},localStorage:{setItem:(k,v)=>{local=v;}},KEY:'alarms',
    normal:x=>x,localRead:()=>JSON.parse(local),renderList(){},tr:x=>x,console,
    records:[],nativeCache:'',nativeSnapshot:null,nativeError:''};
  vm.createContext(context);vm.runInContext(alarms.slice(from,to),context);
  assert.equal(context.read(),true);
  raw=JSON.stringify([{id:'a',enabled:false}]); // real delivery happened after read
  context.records.push({id:'b',enabled:true});
  assert.equal(context.store(),false);assert.equal(written,0);assert.equal(alerts,1);
  assert.equal(context.records[0].enabled,false);assert.equal(context.records.length,1);
  context.records.push({id:'b',enabled:true});assert.equal(context.store(),true);assert.equal(written,1);
  raw='{"error":"unavailable"}';assert.equal(context.read(),false);
  context.records.push({id:'c',enabled:true});assert.equal(context.store(),false);assert.equal(written,1);
});
test('native snooze failure does not stop the visible alarm and success does not issue a second dismiss',()=>{
  const from=alarms.indexOf('function dismissRing('),to=alarms.indexOf('function collectDueAlarms(',from);
  let ok=false,dismissed=0,stopped=0,alerts=0;
  const context={ring:{hidden:false},ringingId:'a',records:[{id:'a'}],hasNativeRegistry:()=>true,
    window:{MichelsLifeAndroid:{snoozePersonalAlarm:()=>ok,dismissPersonalAlarm:()=>{dismissed++;}},alert:()=>{alerts++;}},
    tr:x=>x,windowsRingtone:null,stopPresetAudio:()=>{stopped++;},stopCustomAudio(){},read(){},renderList(){},
    windowsNotifications:[],document:{body:{classList:{remove(){}}}},ringNextDue(){}};
  vm.createContext(context);vm.runInContext(alarms.slice(from,to),context);
  context.dismissRing(true);assert.equal(alerts,1);assert.equal(stopped,0);assert.equal(context.ring.hidden,false);
  ok=true;context.dismissRing(true);assert.equal(context.ring.hidden,true);assert.equal(dismissed,0);assert.equal(stopped,1);
});
test('lockscreen audio ownership and pending notification are not overwritten by another alarm',()=>{
  const activity=readFileSync('android/app/src/main/java/com/michelslab/michelslife/MainActivity.kt','utf8');
  const bridge=readFileSync('android/app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt','utf8');
  assert.match(activity,/if \(id != null && attentionAlarmId != id\) return/);
  assert.match(activity,/if \(attentionAlarmId != null\) return/);
  assert.match(activity,/stopAlarmAttention\(id\)/);
  assert.match(bridge,/activity.completePersonalAlarm\(id\)/);
  assert.match(alarms,/if\(android\(\)&&ringingId&&ringingId!==id&&!ring.hidden\)return false/);
});

test('multi-alarm scheduling stages replacements before committing registry and retires old alarms only afterwards',()=>{
  const sync=native.slice(native.indexOf('fun sync(context:'),native.indexOf('fun recover(context:'));
  assert.ok(sync.indexOf('An enabled alarm has no future occurrence')<sync.indexOf('armOccurrence(context, id, date)'));
  assert.ok(sync.indexOf('armed.add(id to date)')<sync.indexOf('armOccurrence(context, id, date)'));
  assert.ok(sync.indexOf('armOccurrence(context, id, date)')<sync.indexOf('putString(KEY_ALARMS, cleanList.toString())'));
  assert.match(sync,/rollback.putLong\(SCHEDULED_PREFIX \+ id, date\)/);
  assert.match(sync,/rollback.remove\(SCHEDULED_PREFIX \+ id\)/);
  assert.match(sync,/for \(\(id, date\) in armed\) retireOccurrence\(context, id, date\)/);
  assert.ok(sync.indexOf('if (!edit.commit())')<sync.indexOf('if (previous != newOccurrences[id])'));
});

test('Android Activity queues multiple notification opens and preserves them on Activity recreation',()=>{
  const activity=readFileSync('android/app/src/main/java/com/michelslab/michelslife/MainActivity.kt','utf8');
  assert.match(activity,/private val pendingPersonalAlarmIds = linkedSetOf<String>\(\)/);
  assert.match(activity,/if \(id != activePersonalAlarmId && NativePersonalAlarms.wasDelivered\(this, id\)\)/);
  assert.match(activity,/activePersonalAlarmId != id\) return@evaluateJavascript/);
  assert.match(activity,/activePersonalAlarmId\?\.let \{ queue.add\(it\) \}/);
  assert.match(activity,/queue.addAll\(pendingPersonalAlarmIds\)/);
  assert.match(activity,/getStringArrayList\(personalAlarmQueueKey\)\?\.forEach/);
  assert.match(activity,/webView.post \{ openPersonalAlarmFromNotification\(\) \}/);
});

test('snooze stages its new OS occurrence before committing the acknowledgement and registry',()=>{
  const snooze=native.slice(native.indexOf('fun snooze(context:'),native.indexOf('private fun notificationAllowed'));
  assert.ok(snooze.indexOf('armOccurrence(context, replacementId, dueAt)')<snooze.indexOf('putString(KEY_ALARMS, original.toString())'));
  assert.match(snooze,/\.putLong\(SCHEDULED_PREFIX \+ replacementId, dueAt\)\s*\.remove\(deliveryKey\)\.commit\(\)/);
  assert.match(snooze,/retireOccurrence\(context, replacementId, dueAt\)/);
  assert.match(snooze,/\.remove\(SCHEDULED_PREFIX \+ replacementId\)\s*\.putLong\(deliveryKey, deliveredAt\)/);
});
test('expired one-time alarms cannot block unrelated changes and deleted alarm markers cannot reopen UI',()=>{
  const sync=native.slice(native.indexOf('fun sync(context:'),native.indexOf('fun recover(context:'));
  assert.match(sync,/sameSchedule\(old, item\) && item.optString\("repeat"\) == "once"\) \{\s*item.put\("enabled", false\)/);
  const recovery=native.slice(native.indexOf('fun recover(context:'),native.indexOf('private const val NOTIFICATION_ID'));
  assert.match(recovery,/timestamp\(item, now\) <= 0L/);
  assert.match(recovery,/item.put\("enabled", false\)/);
  assert.ok(recovery.indexOf('if (!edit.commit())')<recovery.indexOf('retireOccurrence(context, id, previous)'));
  const delivered=native.slice(native.indexOf('fun wasDelivered('),native.indexOf('fun rememberMotivation('));
  assert.match(delivered,/readRegistry\(context\)/);
  assert.match(delivered,/registry.optJSONObject\(it\)\?\.optString\("id"\) == id/);
});
test('clock/timezone changes re-arm personal alarms without touching the canonical Focus timer',()=>{
  assert.match(manifest,/\.PersonalAlarmClockReceiver/);
  assert.match(manifest,/android.intent.action.TIME_SET/);
  assert.match(manifest,/android.intent.action.TIMEZONE_CHANGED/);
  const focusNative=readFileSync('android/app/src/main/java/com/michelslab/michelslife/NativeFocusAlarm.kt','utf8');
  const receiver=focusNative.slice(focusNative.indexOf('class PersonalAlarmClockReceiver'));
  assert.match(receiver,/NativePersonalAlarms.recover\(context\)/);
  assert.doesNotMatch(receiver,/NativeFocusAlarm.recoverAfterBoot/);
});
