/* Michel's Life - shared Focus wallpaper and immersive desktop workspace.
 * FocusStoryV30162 remains the single owner of timer/session persistence.
 */
(function(){
  'use strict';
  if(window.MichelsLifeFocusImmersive)return;
  const q=(s,r=document)=>r.querySelector(s),api=()=>window.FocusStoryV30162;
  const android=()=>document.documentElement.dataset.mlvPlatform==='android'||window.__MICHELSLIFE_PLATFORM__==='android'||!!window.MichelsLifeAndroid;
  const lang=(en,es)=>window.MichelsLifeI18n?.language==='es'?es:en;
  const live=s=>s?.status==='running'||s?.status==='paused';
  const time=ms=>{const sec=Math.max(0,Math.ceil((Number(ms)||0)/1000));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');};

  // Original, royalty-free Michel's Life audio. A + C: dreamy and cinematic.
  // The Web Audio engine is shared by desktop and Android WebView. It NEVER
  // touches FocusStory deadlines/history and never autoplays on boot.
  const completionKey='completion';
  const sceneKey='scene';
  const finishTones={
    soft:{en:'Soft Bell',es:'Campana suave',notes:[[0,587,.55,.065],[.32,784,.85,.045]]},
    glass:{en:'Glass Chime',es:'Cristal',notes:[[0,988,.4,.052],[.2,1318,.65,.041],[.52,1567,.65,.026]]},
    aurora:{en:'Aurora Tone',es:'Aurora',notes:[[0,440,.8,.039],[.3,659,1,.035],[.72,880,.9,.028]]},
    observatory:{en:'Observatory Bell',es:'Observatorio',notes:[[0,392,.8,.053],[.5,587,.85,.035],[.9,784,1.05,.027]]},
    midnight:{en:'Midnight Chime',es:'Medianoche',notes:[[0,523,.5,.037],[.34,698,.8,.035],[.66,1047,1.2,.026]]},
    silver:{en:'Silver Echo',es:'Eco plateado',notes:[[0,784,.6,.044],[.36,987,.8,.036],[.75,1175,1.1,.024]]},
    mozart_k545:{en:'Mozart · Sonata K.545 · recording',es:'Mozart · Sonata K.545 · grabación',classical:true},
    tchaikovsky_op39:{en:'Tchaikovsky · Morning Prayer · recording',es:'Chaikovski · Oración matinal · grabación',classical:true},
    sb_meanwhile:{en:"Meanwhile · Scott Buckley",es:"Meanwhile · Scott Buckley",classical:true},
    sb_moonlight:{en:"Moonlight · Scott Buckley",es:"Moonlight · Scott Buckley",classical:true},
    sb_cobalt:{en:"Cobalt · Scott Buckley",es:"Cobalt · Scott Buckley",classical:true},
    sb_skyward:{en:"Skyward · Scott Buckley",es:"Skyward · Scott Buckley",classical:true},
    sb_life_is:{en:"Life Is · Scott Buckley",es:"Life Is · Scott Buckley",classical:true},
    sb_first_snow:{en:"First Snow · Scott Buckley",es:"First Snow · Scott Buckley",classical:true},
    sb_midsommar:{en:"Midsommar · Scott Buckley",es:"Midsommar · Scott Buckley",classical:true},
    sb_at_the_end_of_all_things:{en:"At The End Of All Things · Scott Buckley",es:"At The End Of All Things · Scott Buckley",classical:true},
    sb_in_this_moment:{en:"In This Moment · Scott Buckley",es:"In This Moment · Scott Buckley",classical:true},
    sb_hyperion:{en:"Hyperion · Scott Buckley",es:"Hyperion · Scott Buckley",classical:true},
    sb_ascension:{en:"Ascension · Scott Buckley",es:"Ascension · Scott Buckley",classical:true},
    sb_bring_me_the_sky:{en:"Bring Me The Sky · Scott Buckley",es:"Bring Me The Sky · Scott Buckley",classical:true},
    debussy_clair_de_lune:{en:"Claude Debussy · Clair de Lune · Laurens Goedhart · CC BY 3.0",es:"Claude Debussy · Clair de Lune · Laurens Goedhart · CC BY 3.0",classical:true},
    chopin_nocturne_op9:{en:"Frédéric Chopin · Nocturne Op. 9 No. 2 · Peter Johnston / Musopen · CC0 1.0",es:"Frédéric Chopin · Nocturne Op. 9 No. 2 · Peter Johnston / Musopen · CC0 1.0",classical:true},
    satie_gymnopedie_1:{en:"Erik Satie · Gymnopédie No. 1 · Robin Alciatore / Musopen · Public domain",es:"Erik Satie · Gymnopédie No. 1 · Robin Alciatore / Musopen · Public domain",classical:true},
    bach_prelude_bwv846:{en:"Johann Sebastian Bach · Prelude in C major, BWV 846 · Kimiko Ishizaka · CC0 1.0",es:"Johann Sebastian Bach · Prelude in C major, BWV 846 · Kimiko Ishizaka · CC0 1.0",classical:true},
    off:{en:'No sound',es:'Sin sonido',notes:[]}
  };
  // All sequences are newly composed harmonic pads, not licensed recordings.
  const ambientScenes={
    moonlight:{en:'Moonlight Study',es:'Estudio lunar',group:'A',notes:[220,329.63,440,493.88],pattern:[0,2,1,3,2],beat:1.12},
    celestial:{en:'Celestial Focus',es:'Enfoque celestial',group:'A',notes:[196,293.66,392,587.33],pattern:[0,3,2,1,3],beat:.91},
    orbit:{en:'Quiet Orbit',es:'Órbita tranquila',group:'A',notes:[174.61,261.63,349.23,523.25],pattern:[1,2,0,2,3,2],beat:.76},
    aurora:{en:'Aurora',es:'Aurora',group:'C',notes:[164.81,246.94,329.63,493.88],pattern:[3,2,1,0,1],beat:1.13},
    observatory:{en:'Observatory',es:'Observatorio',group:'C',notes:[146.83,220,293.66,440],pattern:[0,1,3,2,0],beat:1.18},
    library:{en:'Midnight Library',es:'Biblioteca nocturna',group:'C',notes:[130.81,196,261.63,392],pattern:[0,2,1,0,3,1],beat:.84},
    afterglow:{en:'Afterglow',es:'Resplandor',group:'C',notes:[174.61,220,349.23,440],pattern:[2,3,1,0,2],beat:1.02},
    silver:{en:'Silver Room',es:'Sala plateada',group:'C',notes:[196,246.94,392,493.88],pattern:[3,1,2,0,3,2],beat:.78}
    ,
    sb_meanwhile:{en:"Meanwhile · Scott Buckley",es:"Meanwhile · Scott Buckley",group:"Ambient",recorded:true},
    sb_moonlight:{en:"Moonlight · Scott Buckley",es:"Moonlight · Scott Buckley",group:"Ambient",recorded:true},
    sb_cobalt:{en:"Cobalt · Scott Buckley",es:"Cobalt · Scott Buckley",group:"Ambient",recorded:true},
    sb_skyward:{en:"Skyward · Scott Buckley",es:"Skyward · Scott Buckley",group:"Ambient",recorded:true},
    sb_life_is:{en:"Life Is · Scott Buckley",es:"Life Is · Scott Buckley",group:"Ambient",recorded:true},
    sb_first_snow:{en:"First Snow · Scott Buckley",es:"First Snow · Scott Buckley",group:"Ambient",recorded:true},
    sb_midsommar:{en:"Midsommar · Scott Buckley",es:"Midsommar · Scott Buckley",group:"Ambient",recorded:true},
    sb_at_the_end_of_all_things:{en:"At The End Of All Things · Scott Buckley",es:"At The End Of All Things · Scott Buckley",group:"Ambient",recorded:true},
    sb_in_this_moment:{en:"In This Moment · Scott Buckley",es:"In This Moment · Scott Buckley",group:"Ambient",recorded:true},
    sb_hyperion:{en:"Hyperion · Scott Buckley",es:"Hyperion · Scott Buckley",group:"Cinematic",recorded:true},
    sb_ascension:{en:"Ascension · Scott Buckley",es:"Ascension · Scott Buckley",group:"Cinematic",recorded:true},
    sb_bring_me_the_sky:{en:"Bring Me The Sky · Scott Buckley",es:"Bring Me The Sky · Scott Buckley",group:"Cinematic",recorded:true}
    ,
    debussy_clair_de_lune:{en:"Claude Debussy · Clair de Lune · Laurens Goedhart · CC BY 3.0",es:"Claude Debussy · Clair de Lune · Laurens Goedhart · CC BY 3.0",group:'Classical',recorded:true},
    chopin_nocturne_op9:{en:"Frédéric Chopin · Nocturne Op. 9 No. 2 · Peter Johnston / Musopen · CC0 1.0",es:"Frédéric Chopin · Nocturne Op. 9 No. 2 · Peter Johnston / Musopen · CC0 1.0",group:'Classical',recorded:true},
    satie_gymnopedie_1:{en:"Erik Satie · Gymnopédie No. 1 · Robin Alciatore / Musopen · Public domain",es:"Erik Satie · Gymnopédie No. 1 · Robin Alciatore / Musopen · Public domain",group:'Classical',recorded:true},
    bach_prelude_bwv846:{en:"Johann Sebastian Bach · Prelude in C major, BWV 846 · Kimiko Ishizaka · CC0 1.0",es:"Johann Sebastian Bach · Prelude in C major, BWV 846 · Kimiko Ishizaka · CC0 1.0",group:'Classical',recorded:true}
  };
  // Licensed human performances, bundled locally. No synthesized fallback.
  // Personal files stay in the device's IndexedDB. Metadata is separate so
  // opening the library never materializes every audio Blob in memory.
  let personalDbPromise=null,personalImporting=false,personalStatus='',personalGeneration=0,personalUrl=null,personalPending=false,pauseOnReady=false;
  function personalDatabase(){
    if(!window.indexedDB)return Promise.reject(Error('Local audio storage unavailable'));
    if(!personalDbPromise)personalDbPromise=new Promise((resolve,reject)=>{
      const req=window.indexedDB.open('michelsLife.focus.personalAudio.v1',1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('tracks'))db.createObjectStore('tracks',{keyPath:'id'});if(!db.objectStoreNames.contains('blobs'))db.createObjectStore('blobs');};
      req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();personalDbPromise=null;};resolve(db);};
      req.onerror=()=>{personalDbPromise=null;reject(req.error||Error('Audio storage unavailable'));};
    });
    return personalDbPromise;
  }
  async function personalRead(store,key){
    const db=await personalDatabase();
    return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),req=key===undefined?tx.objectStore(store).getAll():tx.objectStore(store).get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  }
  function registerPersonal(item){
    if(!item||!/^my_[a-f0-9]{32}$/.test(item.id)||typeof item.name!=='string')return false;
    ambientScenes[item.id]={en:item.name,es:item.name,group:'Personal',recorded:true,personal:true};return true;
  }
  async function loadPersonalTracks(){try{for(const item of await personalRead('tracks'))registerPersonal(item);return true;}catch(_){return false;}}
  async function importPersonalTracks(files){
    if(personalImporting)return false;personalImporting=true;
    let added=0,failed=0;const list=Array.from(files||[]);
    try{
      const db=await personalDatabase();
      for(const file of list){
        if(!file||!Number.isSafeInteger(file.size)||file.size<128||!/\.(mp3|wav|ogg)$/i.test(file.name)){failed++;continue;}
        personalStatus=lang('Importing ','Importando ')+(added+failed+1)+' / '+list.length+' · '+file.name;
        try{
          const bytes=new Uint8Array(16);window.crypto.getRandomValues(bytes);
          const id='my_'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
          const item={id,name:file.name.slice(0,160),size:file.size,type:file.type||''};
          await new Promise((resolve,reject)=>{const tx=db.transaction(['tracks','blobs'],'readwrite');tx.objectStore('tracks').add(item);tx.objectStore('blobs').add(file,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
          registerPersonal(item);added++;
        }catch(_){failed++;}
      }
      personalStatus=lang('Imported: ','Importadas: ')+added+' · '+lang('Failed: ','No importadas: ')+failed;
      if(added&&!ambientScene){const id=Object.keys(ambientScenes).find(id=>ambientScenes[id].personal&&isAvailable(id));if(id){setAmbientCollection('Personal');selectScene(id);}}
      return added>0;
    }catch(_){personalStatus=lang('Audio storage unavailable. Check free space.','Almacenamiento no disponible. Revisa el espacio libre.');return false;}
    finally{personalImporting=false;}
  }

  let classicalSource=null,previewingId=null,ambientRecording=null,ambientVolume=.35,volumeDraft=null;
  const classicalIds=['mozart_k545','tchaikovsky_op39'];
  let effectContext=null,ambientContext=null,ambientInterval=null,ambientScene=null,ambientStep=0;
  function soundContext(){
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    if(!effectContext||effectContext.state==='closed')effectContext=new C();
    effectContext.resume?.().catch?.(()=>{});
    return effectContext;
  }
  // FocusStory is the ONLY persistence owner. This immersive view must not
  // write localStorage independently or duplicate timer/session state.
  function readChoice(key,valid,fallback){
    const f=api()?.focusState?.();
    const value=key==='completion'?f?.v30165CompletionSound:f?.v30165Soundscape;
    return Object.hasOwn(valid,value)?value:fallback;
  }
  function choice(key,valid,value,fallback){
    const selected=Object.hasOwn(valid,value)?value:fallback;
    api()?.setAudioPreference?.(key,selected);
    return selected;
  }
  const finishId=()=>readChoice(completionKey,finishTones,'soft');
  const archivedIds=()=>{const v=api()?.focusState?.()?.v30165ArchivedAmbient;return new Set(Array.isArray(v)?v.filter(id=>Object.hasOwn(ambientScenes,id)):[]);};
  const isAvailable=id=>Object.hasOwn(ambientScenes,id)&&!archivedIds().has(id);
  function activeIds(){const c=ambientCollection();return Object.keys(ambientScenes).filter(id=>isAvailable(id)&&(c==='all'||ambientScenes[id].group===c));}
  const sceneId=()=>{const selected=readChoice(sceneKey,ambientScenes,'moonlight'),ids=activeIds();return ids.includes(selected)?selected:(ids[0]||'');};
  function unlock(){
    try{return !!soundContext();}catch(_){return false;}
  }
  function stopClassical(){
    const source=classicalSource;classicalSource=null;previewingId=null;
    if(source)try{source.pause();source.currentTime=0;}catch(_){}
  }
  function playCompletion(preview=false){
    const id=finishId(),score=finishTones[id];
    stopClassical();
    // Final audio takes precedence; hear licensed previews in isolation too.
    if(!preview||score?.classical)stopAmbient();
    if(!score||id==='off')return true;
    if(score.classical){
      try{
        const source=new Audio('assets/audio/classical/'+id+'.mp3');
        source.loop=false;classicalSource=source;previewingId=preview?id:null;
        const clear=()=>{if(classicalSource===source){classicalSource=null;previewingId=null;}};
        source.onended=clear;source.onerror=clear;
        source.play().catch(clear);return true;
      }catch(_){return false;}
    }
    const ctx=soundContext();
    if(!ctx)return false;
    try{
      const start=ctx.currentTime+.025;
      score.notes.forEach(([offset,freq,duration,gain])=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.type=id==='observatory'?'triangle':'sine';
        o.frequency.setValueAtTime(freq,start+offset);
        g.gain.setValueAtTime(.0001,start+offset);
        g.gain.exponentialRampToValueAtTime(gain*(preview?.75:1),start+offset+.035);
        g.gain.exponentialRampToValueAtTime(.0001,start+offset+duration);
        o.connect(g);g.connect(ctx.destination);
        o.start(start+offset);o.stop(start+offset+duration+.04);
      });
      return true;
    }catch(_){return false;}
  }
  function stopAmbient(){
    personalGeneration++;personalPending=false;pauseOnReady=false;
    const player=ambientRecording;ambientRecording=null;
    if(player)try{player.pause();player.currentTime=0;}catch(_){}
    if(personalUrl){try{URL.revokeObjectURL(personalUrl);}catch(_){}personalUrl=null;}
    if(ambientInterval){window.clearInterval(ambientInterval);ambientInterval=null;}
    const ctx=ambientContext;ambientContext=null;ambientScene=null;
    if(ctx)ctx.close().catch(()=>{});
    return true;
  }
  function scheduleAmbient(){
    const ctx=ambientContext,scene=ambientScenes[ambientScene];
    if(!ctx||!scene||ctx.state==='closed')return;
    const start=ctx.currentTime+.04,notes=scene.notes;
    for(let i=0;i<notes.length;i++){
      const osc=ctx.createOscillator(),env=ctx.createGain();
      osc.type=i===0?'sine':i===2?'triangle':'sine';
      const rotation=(ambientStep+i)%notes.length;
      osc.frequency.setValueAtTime(notes[rotation]*(i===3?2:1),start+.22*i);
      const gain=(i===0?.012:i===3?.004:.006)*Math.max(.0001,ambientVolume/.35);
      env.gain.setValueAtTime(.0001,start+.22*i);
      env.gain.linearRampToValueAtTime(gain,start+2+.22*i);
      env.gain.setValueAtTime(gain,start+4.8+.22*i);
      env.gain.exponentialRampToValueAtTime(.0001,start+8.5+.22*i);
      osc.connect(env);env.connect(ctx.destination);
      osc.start(start+.22*i);osc.stop(start+8.55+.22*i);
    }
    // Each soundscape has its own original melodic motif (not eight copies
    // of the same pad), with quiet plucks above the sustained harmony.
    const noteHz=name=>{
      const m=/^([A-G])(#?)([2-6])$/.exec(name||'');
      if(!m)return null;
      const semitones={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
      const midi=(Number(m[3])+1)*12+semitones[m[1]]+(m[2]?1:0);
      return 440*Math.pow(2,(midi-69)/12);
    };
    const theme=scene.phrases?.[ambientStep%scene.phrases.length];
    const melody=theme||scene.pattern;
    melody.forEach((pitch,i)=>{
      const frequency=theme?noteHz(pitch):notes[pitch];
      if(!Number.isFinite(frequency)||frequency<=0)return;
      const at=start+.35+i*scene.beat;
      const osc=ctx.createOscillator(),env=ctx.createGain();
      osc.type=theme?'triangle':ambientScene==='observatory'||ambientScene==='library'?'triangle':'sine';
      osc.frequency.setValueAtTime(frequency,at);
      env.gain.setValueAtTime(.0001,at);
      env.gain.exponentialRampToValueAtTime((theme?.012:.008)*Math.max(.0001,ambientVolume/.35),at+.055);
      env.gain.exponentialRampToValueAtTime(.0001,at+(theme?.55:.67));
      osc.connect(env);env.connect(ctx.destination);
      osc.start(at);osc.stop(at+(theme?.6:.7));
    });
    ambientStep=(ambientStep+1)%(scene.phrases?.length||scene.notes.length);
  }
  function savedVolume(){const v=api()?.focusState?.()?.v30165AmbientVolume;return typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(1,v)):.35;}
  function getVolume(){return volumeDraft??savedVolume();}
  function setVolume(value,save=true){const n=Number(value);if(!Number.isFinite(n))return getVolume();ambientVolume=Math.max(0,Math.min(1,n));volumeDraft=ambientVolume;if(ambientRecording)ambientRecording.volume=ambientVolume;if(save&&api()?.setAudioPreference?.('ambientVolume',ambientVolume)===true)volumeDraft=null;return ambientVolume;}
  const ambientMode=()=>{const m=api()?.focusState?.()?.v30165AmbientMode;return ['repeat','playlist','shuffle'].includes(m)?m:'repeat';};
  const ambientCollection=()=>{const c=api()?.focusState?.()?.v30165AmbientCollection;return ['Ambient','Cinematic','Classical','Personal'].includes(c)?c:'all';};
  let shuffleHistory=[],shuffleBag=[];
  function resetShuffle(){shuffleHistory=[];shuffleBag=[];}
  function collectionIds(){return activeIds().filter(id=>ambientScenes[id].recorded);}
  function archiveScene(id,archived=true){
    if(!Object.hasOwn(ambientScenes,id))return false;
    const old=archivedIds();if(old.has(id)===archived)return true;
    const selected=sceneId(),wasActive=ambientScene===id,wasPaused=!!ambientRecording?.paused;
    if(archived)old.add(id);else old.delete(id);
    if(api()?.setAudioPreference?.('archivedAmbient',[...old])!==true)return false;
    resetShuffle();
    if(archived&&(wasActive||selected===id)){
      const next=collectionIds()[0]||activeIds()[0]||'';
      if(wasActive)stopAmbient();
      if(next){choice(sceneKey,ambientScenes,next,'moonlight');if(wasActive&&!wasPaused)startAmbient();}
    }
    return true;
  }
  function setAmbientCollection(value){if(!['all','Ambient','Cinematic','Classical','Personal'].includes(value))return false;api()?.setAudioPreference?.('ambientCollection',value);resetShuffle();const ids=activeIds();const selected=sceneId();if(!ids.length){stopAmbient();return true;}if(ambientScene&&!ids.includes(ambientScene)){const paused=!!ambientRecording?.paused;stopAmbient();choice(sceneKey,ambientScenes,selected,'moonlight');if(!paused)startAmbient();}else choice(sceneKey,ambientScenes,selected,'moonlight');return true;}
  function setAmbientMode(mode){if(!['repeat','playlist','shuffle'].includes(mode))return false;if(mode!==ambientMode())resetShuffle();api()?.setAudioPreference?.('ambientMode',mode);if(ambientRecording)ambientRecording.loop=ambientMode()==='repeat';return true;}
  function moveAmbient(delta,automatic=false){const ids=collectionIds();if(!ids.length)return false;const current=sceneId(),index=ids.indexOf(current);let next;if(ambientMode()==='shuffle'){
    shuffleHistory=shuffleHistory.filter(id=>ids.includes(id));if(delta<0&&shuffleHistory.length)next=shuffleHistory.pop();
    else{shuffleBag=shuffleBag.filter(id=>ids.includes(id)&&id!==current);if(!shuffleBag.length){shuffleBag=ids.filter(id=>id!==current);for(let i=shuffleBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffleBag[i],shuffleBag[j]]=[shuffleBag[j],shuffleBag[i]];}}next=shuffleBag.pop()||ids[0];if(next!==current&&ids.includes(current))shuffleHistory.push(current);if(shuffleHistory.length>100)shuffleHistory.shift();}
    }else next=ids[(index<0?(delta<0?ids.length-1:0):(index+delta+ids.length)%ids.length)];const wasPaused=!automatic&&(!!ambientRecording?.paused||pauseOnReady);selectScene(next,true);if(wasPaused){if(ambientRecording)ambientRecording.pause();else if(personalPending)pauseOnReady=true;}return true;}
  function startRecording(id,src,paused=false){
    try{
      const player=new Audio(src);
      player.loop=ambientMode()==='repeat';player.volume=getVolume();ambientRecording=player;ambientScene=id;
      const clear=()=>{if(ambientRecording===player)stopAmbient();};
      const error=()=>{if(ambientScenes[id]?.personal)personalStatus=lang('Audio cannot be played.','No se pudo reproducir el audio.');clear();};
      player.onerror=error;player.onended=()=>{if(ambientRecording!==player)return;if(ambientMode()!=='repeat'){if(!moveAmbient(1,true))clear();}else clear();};
      if(!paused)player.play().catch(error);return true;
    }catch(_){stopAmbient();return false;}
  }
  function startAmbient(){
    stopAmbient();
    // Explicit new ambience replaces the recording rather than mixing audio.
    stopClassical();
    const id=sceneId();if(!id||!isAvailable(id))return false;ambientVolume=getVolume();
    if(ambientScenes[id]?.personal){
      const generation=personalGeneration;personalPending=true;ambientScene=id;
      personalRead('blobs',id).then(blob=>{
        if(generation!==personalGeneration)return;
        if(!blob||!isAvailable(id)){personalStatus=lang('Personal audio is missing.','Falta el archivo de audio personal.');stopAmbient();return;}
        personalUrl=URL.createObjectURL(blob);personalPending=false;
        if(!startRecording(id,personalUrl,pauseOnReady)){stopAmbient();}
      }).catch(()=>{if(generation===personalGeneration){personalStatus=lang('Cannot open personal audio.','No se pudo abrir el audio personal.');stopAmbient();}});
      return true;
    }
    if(ambientScenes[id]?.recorded)return startRecording(id,'assets/audio/classical/'+id+'.mp3');
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return false;
    try{
      ambientScene=id;ambientContext=new C();
      ambientContext.resume?.().catch?.(()=>{});
      ambientStep=0;scheduleAmbient();
      ambientInterval=window.setInterval(scheduleAmbient,7200);
      return true;
    }catch(_){stopAmbient();return false;}
  }
  function toggleAmbientPlayback(){if(personalPending){pauseOnReady=!pauseOnReady;return true;}if(ambientRecording){const player=ambientRecording;if(player.paused){player.play().catch(()=>{if(ambientRecording===player)stopAmbient();});}else player.pause();return true;}if(ambientContext)return stopAmbient();return startAmbient();}
  function selectScene(id,fromPlaylist=false){
    if(!isAvailable(id))return sceneId();
    if(!fromPlaylist){resetShuffle();const group=ambientScenes[id]?.group;if(ambientCollection()!=='all'&&group!==ambientCollection())api()?.setAudioPreference?.('ambientCollection','all');}
    const old=ambientScene;choice(sceneKey,ambientScenes,id,'moonlight');
    if(old)startAmbient();
    return sceneId();
  }
  function toggleScene(id){
    // Every soundtrack shares one canonical persisted choice and scheduler.
    // Reject unknown IDs rather than silently switching to the default.
    if(!isAvailable(id))return false;
    if((ambientContext||ambientRecording||personalPending)&&ambientScene===id){stopAmbient();return true;}
    const wasPlaying=!!(ambientContext||ambientRecording||personalPending);
    selectScene(id);
    return wasPlaying?!!(ambientContext||ambientRecording||personalPending):startAmbient();
  }
  function toggleClassical(id){
    if(!classicalIds.includes(id))return false;
    if(previewingId===id){stopClassical();return true;}
    choice(completionKey,finishTones,id,'soft');return playCompletion(true);
  }
  function textOptions(items,group=false){
    const es=window.MichelsLifeI18n?.language==='es';
    return Object.entries(items).map(([id,item])=>({id,label:(group?({A:lang('Original soundscape','Ambiente original'),C:lang('Original soundscape','Ambiente original'),Ambient:lang('Ambient','Ambiental'),Cinematic:lang('Cinematic','Cinematográfica'),Classical:lang('Classical piano','Piano clásico'),Personal:lang('My music','Mi música')}[item.group]||item.group)+' · ':'')+(es?item.es:item.en)}));
  }
  window.MichelsLifeFocusAudio={
    completionOptions:()=>textOptions(finishTones),
    sceneOptions:()=>textOptions(ambientScenes,true).filter(x=>activeIds().includes(x.id)),
    archivedOptions:()=>textOptions(ambientScenes,true).filter(x=>archivedIds().has(x.id)),archiveScene,
    classicalOptions:()=>classicalIds.map(id=>({id,label:lang(finishTones[id].en,finishTones[id].es)})),
    toggleClassical,toggleScene,
    completionId:finishId,sceneId,selectCompletion:id=>{stopClassical();return choice(completionKey,finishTones,id,'soft');},
    selectScene,playCompletion,stopClassical,previewingCompletion:()=>previewingId,recordingActive:()=>!!classicalSource,recordingPlayback:()=>classicalSource?{paused:classicalSource.paused,currentTime:classicalSource.currentTime,duration:classicalSource.duration,src:classicalSource.src}:null,unlock,startAmbient,stopAmbient,
    playing:()=>!!(ambientContext||ambientRecording||personalPending),
    importPersonalTracks,loadPersonalTracks,personalStatus:()=>personalStatus,personalImporting:()=>personalImporting,playingScene:()=>ambientScene,
    ambientVolume:getVolume,setAmbientVolume:setVolume,ambientMode,setAmbientMode,ambientCollection,setAmbientCollection,moveAmbient,toggleAmbientPlayback,
    ambientPlayback:()=>ambientRecording?{paused:ambientRecording.paused,currentTime:ambientRecording.currentTime,duration:ambientRecording.duration,loop:ambientRecording.loop,src:ambientRecording.src,volume:ambientRecording.volume}:null
  };
  if(window.indexedDB)loadPersonalTracks();
  window.addEventListener?.('pagehide',()=>{stopAmbient();stopClassical();});

  let screen=null,mini=null,launcher=null,lastPhase=null,closedPhase=null,closedMode=null;
  let minimizedLoaded=false;
  let focusSceneSequence=0;
  const minimizedKey='michelsLife.desktop.minimizedFocus.v1';
  function restoreMinimized(){
    if(minimizedLoaded)return;
    minimizedLoaded=true;
    try{
      const saved=JSON.parse(sessionStorage.getItem(minimizedKey)||'null');
      if(!saved||!['work','break'].includes(saved.mode))return;
      if(!Number.isFinite(saved.at)||saved.at>Date.now()||Date.now()-saved.at>12*3600000)return;
      if(saved.phase!==null&&
         (typeof saved.phase!=='string'||!new RegExp('^'+saved.mode+':[0-9]{10,15}$').test(saved.phase)))return;
      closedPhase=saved.phase;closedMode=saved.mode;
    }catch(_){}
  }
  function saveMinimized(){
    try{
      if(!closedMode){sessionStorage.removeItem(minimizedKey);return;}
      sessionStorage.setItem(minimizedKey,JSON.stringify({
        phase:closedPhase,mode:closedMode,at:Date.now()
      }));
    }catch(_){}
  }

  function wallpaper(){
    // VisualSystemV30182 owns the actual selected background in a dedicated
    // image layer, not on html/body CSS. Read the real loaded scene first.
    const visual=q('#mlv184Background img');
    const current=visual?.currentSrc||visual?.getAttribute?.('src')||'';
    if(visual?.complete&&visual.naturalWidth>0&&
       current&&!/["\\\n\r]/.test(current)&&!/^javascript:/i.test(current)){
      return 'url("'+current+'")';
    }
    const selectors=[
      '[data-mlv-active-wallpaper]','.mlv-theme-wallpaper',
      '[class*="wallpaper"]','#tab-missions .v131-hero',
      '#tab-story .v30162-story-hero','#tab-missions','#tab-story',
      '#main','body','html'
    ];
    const seen=new Set(),probes=[];
    for(const selector of selectors){
      const node=q(selector);
      if(node&&!seen.has(node)){seen.add(node);probes.push([node,null]);}
    }
    if(document.body)probes.push([document.body,'::before']);
    if(document.documentElement)probes.push([document.documentElement,'::before']);
    for(const [node,pseudo] of probes){
      try{
        const computed=getComputedStyle(node,pseudo).backgroundImage;
        if(computed&&computed!=='none'&&/url\(|image-set\(/i.test(computed))return computed;
        // The theme may own background-image with !important. Read the
        // persisted inline scene as well instead of silently replacing it
        // with an opaque gradient in the immersive workspace.
        const inline=!pseudo?node.style?.backgroundImage:'';
        if(inline&&/url\(|image-set\(/i.test(inline))return inline;
      }catch(_){}
    }
    const cover=q('[data-mlv-active-wallpaper] img, img[data-mlv-wallpaper], #tab-story img[class*="background"], #tab-missions img[class*="background"]');
    const src=cover?.getAttribute?.('src');
    if(src&&!/["\\\n\r]/.test(src))return 'url("'+src+'")';
    // Some Michel's Life eras render Missions/Story as layered CSS gradients
    // rather than a file-backed image. Preserve THAT scene when no URL exists;
    // otherwise a full-screen focus session becomes a featureless blue panel.
    const fallbackSelectors=[
      '#tab-missions [class*="hero"]','#tab-missions [class*="scene"]',
      '#tab-missions','#tab-story [class*="hero"]','#tab-story'
    ];
    for(const selector of fallbackSelectors){
      const element=q(selector);
      if(!element)continue;
      for(const pseudo of [null,'::before']){
        try{
          const value=getComputedStyle(element,pseudo).backgroundImage;
          if(value&&value!=='none'&&/gradient\(/i.test(value))return value;
        }catch(_){}
      }
    }
    return 'none';
  }
  function applyWallpaper(target){
    if(!target)return;
    const value=wallpaper();
    if(value==='none')target.style.removeProperty('--mlv-focus-wallpaper');
    else target.style.setProperty('--mlv-focus-wallpaper',value);
    target.dataset.mlvFocusWallpaper=value==='none'?'app-backdrop':
      /url\(|image-set\(/i.test(value)?'selected-image':'selected-scene';
  }
  window.MichelsLifeFocusImmersive={applyWallpaper,wallpaper};

  function installStyles(){
    if(q('#mlv-desktop-focus-css'))return;
    const el=document.createElement('style');el.id='mlv-desktop-focus-css';
    el.textContent=`

      /* A single Focus layout authority, not stacked visual-era overrides. */
      #mlv-desktop-focus-immersive[hidden],#mlv-desktop-mini-focus[hidden],
      #mlv-desktop-focus-launcher[hidden]{display:none!important}
      html:not([data-mlv-platform="android"]) #mlv-desktop-focus-immersive{
        position:fixed;inset:0;z-index:2147483500;
        display:grid;grid-template-columns:minmax(0,1fr);place-items:center;box-sizing:border-box;
        padding:clamp(12px,2.4vw,24px);overflow:auto;
        color:#f8fbff;background-color:rgba(4,9,16,.5);
        background-image:linear-gradient(152deg,rgba(3,9,18,.5),rgba(5,13,22,.29) 54%,rgba(2,8,14,.57)),var(--mlv-focus-wallpaper,none);
        background-position:center;background-size:cover;background-repeat:no-repeat
      }
      #mlv-desktop-focus-stage{
        position:relative;display:flex;flex-direction:column;box-sizing:border-box;
        /* No percentage max-width: grid's intrinsic track was capping this at 467px. */
        width:min(1040px,calc(100vw - 32px))!important;max-width:1040px!important;
        justify-self:center!important;
        height:auto!important;min-height:calc(100dvh - 84px)!important;
        max-height:none!important;
        overflow:visible!important;
        gap:clamp(8px,1.4vh,14px)!important;padding:clamp(14px,2.2vw,25px)!important;
        border:1px solid rgba(213,237,245,.26);border-radius:26px;
        background-color:rgba(7,17,27,.47)!important;
        background-image:linear-gradient(145deg,rgba(9,27,36,.16),rgba(6,16,27,.06))!important;
        box-shadow:0 25px 70px rgba(0,0,0,.24)!important;
        backdrop-filter:none!important;-webkit-backdrop-filter:none!important
      }
      #mlv-desktop-focus-stage>header{
        display:flex;justify-content:space-between;align-items:flex-start;
        gap:12px;flex-shrink:0;min-width:0
      }
      .mlv-focus-eyebrow{
        display:block;font:750 10px/1.4 system-ui,sans-serif;
        letter-spacing:.18em;text-transform:uppercase;color:#c5e9f2
      }
      #mlv-desktop-focus-title{
        margin:8px 0 0!important;color:#fff;
        font:780 clamp(31px,3.9vw,43px)/1.04 system-ui,sans-serif!important;
        letter-spacing:-.045em!important
      }
      #mlv-desktop-focus-stage>.mlv-focus-center{
        display:flex;flex:1 0 auto!important;min-height:125px!important;
        flex-direction:column;align-items:center;justify-content:center;
        gap:6px!important;padding:7px 0!important;text-align:center
      }
      .mlv-focus-mode{
        font:750 11px/1.35 system-ui,sans-serif;letter-spacing:.2em;color:#b5e8e8
      }
      #mlv-desktop-focus-clock{
        display:block!important;width:auto!important;height:auto!important;
        min-height:0!important;min-width:0!important;
        padding:0!important;margin:0!important;text-align:center!important;
        color:#fff!important;font-family:system-ui,sans-serif!important;
        font-size:clamp(70px,9vw,112px)!important;font-weight:820!important;
        line-height:1.02!important;letter-spacing:-.045em!important;
        font-variant-numeric:tabular-nums!important;
        text-shadow:0 8px 32px rgba(0,0,0,.18)
      }
      .mlv-focus-status{
        margin:2px 0 0;color:#dcebf2;font:520 13px/1.4 system-ui,sans-serif
      }
      .mlv-focus-actions{
        display:flex;justify-content:center;align-items:center;
        flex-wrap:wrap;gap:8px;flex-shrink:0!important
      }
      #mlv-desktop-focus-stage>header>.mlv-focus-actions{
        flex-wrap:nowrap;justify-content:flex-end
      }
      .mlv-focus-btn{
        cursor:pointer;touch-action:manipulation;box-sizing:border-box;
        min-height:44px;min-width:44px;padding:9px 13px;
        border:1px solid rgba(202,231,244,.28);border-radius:11px;
        background:rgba(4,22,32,.75);color:#f5fcff;
        font:700 12px/1.25 system-ui,sans-serif
      }
      .mlv-focus-btn.primary{
        min-width:150px;color:#09222a!important;border-color:transparent!important;
        background:linear-gradient(110deg,#82ebc5,#83dce9)!important;
        font-weight:800!important
      }
      .mlv-focus-btn:focus-visible,
      #mlv-desktop-mini-focus>button:focus-visible,#mlv-desktop-focus-launcher:focus-visible{
        outline:3px solid var(--ui-accent,#88dbff);outline-offset:3px
      }
      .mlv-focus-classical{
        flex:0 0 auto;display:flex;flex-wrap:wrap;align-items:center;
        justify-content:space-between;gap:8px;padding:10px 12px;
        border:1px solid rgba(214,229,255,.25);border-radius:14px;
        background:rgba(8,23,40,.58)
      }
      .mlv-focus-classical strong{
        display:block;font:750 12px/1.4 system-ui,sans-serif;color:#e7f4ff
      }
      .mlv-focus-classical-actions,.mlv-focus-ambient-actions{display:flex;gap:6px;flex-wrap:wrap;width:100%}
      .mlv-focus-ambient-actions{max-height:120px;overflow-y:auto;overscroll-behavior:contain}
      .mlv-focus-ambient-actions button{min-height:36px;padding:6px 10px}
      .mlv-focus-quick-completion{
        display:flex;align-items:center;justify-content:center;flex-wrap:wrap;
        gap:10px;flex:0 0 auto;padding:8px 10px;
        border:1px solid rgba(199,239,245,.17);border-radius:12px;
        background:rgba(3,14,23,.36)
      }
      .mlv-focus-quick-completion label{display:flex;align-items:center;gap:8px;font:700 12px system-ui,sans-serif}
      .mlv-focus-quick-completion select{max-width:230px;min-height:42px;border-radius:8px;
        background:#152637;color:#fff;border:1px solid rgba(200,238,245,.32)}
      .mlv-focus-classical button{
        cursor:pointer;touch-action:manipulation;min-height:44px;
        padding:9px 12px;color:#f3f9ff;background:rgba(255,255,255,.08);
        border:1px solid rgba(210,231,250,.28);border-radius:10px;
        font:700 12px/1.3 system-ui,sans-serif
      }
      .mlv-focus-classical button[aria-pressed="true"]{
        background:rgba(131,226,217,.23);border-color:#9cf5df;color:#fff
      }
      .mlv-focus-classical button:focus-visible{
        outline:3px solid var(--ui-accent,#88dbff);outline-offset:2px
      }
      .mlv-focus-classical-note{width:100%;font:500 11px/1.4 system-ui,sans-serif;color:#d0dbe5}
      .mlv-focus-sound-details,
      .mlv-focus-motivation-details{
        flex:0 0 auto!important;min-height:0!important;max-height:26vh;
        overflow-y:auto;box-sizing:border-box;padding:8px 12px;
        border:1px solid rgba(199,239,245,.14);border-radius:12px;
        background:rgba(3,14,23,.28)
      }
      .mlv-focus-sound-details:not([open]),
      .mlv-focus-motivation-details:not([open]){
        max-height:40px!important;overflow:hidden
      }
      .mlv-focus-sound-details>summary,
      .mlv-focus-motivation-details>summary{
        cursor:pointer;font:700 12px/1.45 system-ui,sans-serif;
        color:#d9f0f2;padding:2px 0
      }
       .mlv-focus-motivation-always{flex:0 0 auto;min-width:0}
      .mlv-focus-motivation{gap:6px;margin:0 auto!important}
      #mlv-desktop-focus-stage .mlv-motivation{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;gap:8px;margin:0 auto!important}
      #mlv-desktop-focus-stage .mlv-motivation-line{padding:8px 12px}
      @media(max-width:670px){#mlv-desktop-focus-stage .mlv-motivation{grid-template-columns:1fr}}
      .mlv-focus-motivation-copy{
        font-size:clamp(12px,1.35vw,15px);line-height:1.4
      }
      .mlv-focus-audio-panel{
        display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;
        margin-top:8px;padding:10px;border:1px solid rgba(205,239,250,.12);
        border-radius:12px;background:rgba(3,15,26,.4)
      }
      .mlv-focus-audio-group{
        display:flex;align-items:end;gap:7px;min-width:0
      }
      .mlv-focus-audio-group>label{
        flex:1;min-width:0;color:#dceef4;font:650 12px/1.4 system-ui,sans-serif
      }
      .mlv-focus-audio-group>label>select{
        display:block;width:100%;min-height:42px;box-sizing:border-box;
        margin-top:5px;padding:8px 9px;border-radius:9px;color:#f5fbff;
        background:#102c35;border:1px solid rgba(146,202,212,.35);
        font:600 12px system-ui,sans-serif
      }
      .mlv-focus-audio-group>button{
        min-height:42px;min-width:68px;padding:8px 10px;font-size:12px
      }
      #mlv-desktop-mini-focus,#mlv-desktop-focus-launcher{
        position:fixed;right:22px;bottom:22px;z-index:2147483200;
        box-sizing:border-box;padding:8px;border-radius:16px;
        border:1px solid rgba(220,247,255,.27);color:#fff;
        background:rgba(8,27,40,.93);box-shadow:0 13px 35px rgba(0,0,0,.34)
      }
      #mlv-desktop-mini-focus{display:flex;gap:8px;align-items:center}
      #mlv-desktop-focus-launcher{right:19px;bottom:94px;padding:10px 16px;min-height:46px}
      #mlv-desktop-mini-focus>button,#mlv-desktop-focus-launcher{
        cursor:pointer;min-height:44px;padding:10px 14px;border:0;
        border-radius:11px;color:inherit;background:rgba(255,255,255,.09);
        font:750 13px system-ui,sans-serif
      }
      html:not([data-mlv-platform="android"]) body.mlv-desktop-focus-open{overflow:hidden!important}
      @media(max-width:670px){
        #mlv-desktop-focus-stage{
          width:100%;padding:16px!important;border-radius:20px
        }
        .mlv-focus-audio-panel{grid-template-columns:1fr}
        #mlv-desktop-focus-clock{
          font-size:clamp(60px,14vw,86px)!important
        }
      }
      @media(max-height:550px){
        #mlv-desktop-focus-stage{
          height:auto!important;min-height:0!important;gap:7px!important;padding:12px!important
        }
        #mlv-desktop-focus-stage>.mlv-focus-center{
          min-height:100px!important;padding:0!important
        }
        #mlv-desktop-focus-clock{
          font-size:clamp(50px,12vh,78px)!important
        }
      }
      @media(prefers-reduced-motion:reduce){
        #mlv-desktop-focus-stage>*{animation:none!important;transition:none!important}
      }
    `;
    document.head.appendChild(el);
  }
  function create(){
    if(android()||!document.body||screen)return;
    installStyles();
    screen=document.createElement('div');
    screen.id='mlv-desktop-focus-immersive';screen.hidden=true;
    screen.innerHTML=`
      <section id="mlv-desktop-focus-stage" class="mlv-focus-stage" role="dialog" aria-modal="true" aria-labelledby="mlv-desktop-focus-title">
        <header>
          <div><span class="mlv-focus-eyebrow">MICHEL'S LIFE / FOCUS</span>
          <h2 id="mlv-desktop-focus-title">Pomodoro</h2></div>
          <div class="mlv-focus-actions"><button type="button" class="mlv-focus-btn" data-focus-action="alarms">⏰ Alarmas</button>
          <button type="button" class="mlv-focus-btn" data-focus-action="minimize" aria-label="Minimize Pomodoro">—</button></div>
        </header>
        <div class="mlv-focus-center">
          <span class="mlv-focus-mode" id="mlv-desktop-focus-mode">FOCUS</span>
          <strong class="mlv-focus-clock" role="timer" aria-live="off" id="mlv-desktop-focus-clock">25:00</strong>
          <p class="mlv-focus-status" id="mlv-desktop-focus-status">Ready to focus</p>
        </div>
        <div id="mlv-desktop-focus-motivation" class="mlv-focus-motivation-always" aria-label="Messages and affirmations"></div>
        <div class="mlv-focus-actions">
          <button type="button" class="mlv-focus-btn primary" data-focus-action="toggle">Start</button>
          <button type="button" class="mlv-focus-btn" data-focus-action="skip">Skip phase</button>
          <button type="button" class="mlv-focus-btn" data-focus-action="reset">Reset</button>
          <button type="button" class="mlv-focus-btn" data-focus-action="minimize">Navigate the app</button>
        </div>
        <div class="mlv-focus-quick-completion" role="group" aria-label="Completion sound">
          <label for="mlv-focus-completion-select">Completion sound
            <select id="mlv-focus-completion-select" data-mlv-completion-sound></select>
          </label>
          <button type="button" class="mlv-focus-btn" data-mlv-audio="preview-completion">▶ Preview completion</button>
        </div>
        <details class="mlv-focus-sound-details"><summary>Audio · Completion tone & ambience</summary>
        <div class="mlv-focus-audio-panel" aria-label="Pomodoro audio">
          <div class="mlv-focus-audio-group">
            <label for="mlv-focus-scene-select">Background music
              <select id="mlv-focus-scene-select" data-mlv-scene-select></select>
            </label>
            <button type="button" class="mlv-focus-btn" data-mlv-audio="toggle-ambient">Play</button>
            <label><span data-mlv-volume-label>Volume</span><input type="range" min="0" max="100" value="35" data-mlv-ambient-volume aria-label="Background music volume" /></label>
            <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="mlv-focus-btn" data-mlv-audio="previous-ambient" aria-label="Previous track">⏮ Previous</button><button type="button" class="mlv-focus-btn" data-mlv-audio="next-ambient" aria-label="Skip track">Next ⏭</button><button type="button" class="mlv-focus-btn" data-mlv-audio="stop-ambient">Stop</button><select data-mlv-ambient-mode aria-label="Playback mode"><option value="repeat">Repeat track</option><option value="playlist">Continuous playlist</option><option value="shuffle">Shuffle</option></select><select data-mlv-ambient-collection aria-label="Playlist collection"><option value="all">All recordings</option><option value="Ambient">Ambient</option><option value="Cinematic">Cinematic</option><option value="Classical">Classical piano</option><option value="Personal">My music</option></select></div>
            <small data-mlv-ambient-progress aria-live="off"></small>
            <label><span data-mlv-personal-label>Import my music</span><input type="file" multiple accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg" data-mlv-personal-files /></label><small data-mlv-personal-status role="status"></small>
            <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="mlv-focus-btn" data-mlv-audio="archive-ambient">Archive track</button><select data-mlv-archived-track aria-label="Archived tracks"></select><button type="button" class="mlv-focus-btn" data-mlv-audio="restore-ambient">Restore</button></div>
            <small style="flex-basis:100%;overflow-wrap:anywhere">Scott Buckley · CC BY 4.0 · www.scottbuckley.com.au · creativecommons.org/licenses/by/4.0/</small>
            <details><summary>Classical credits / Créditos clásicos</summary><small style="overflow-wrap:anywhere">Claude Debussy · Clair de Lune — Laurens Goedhart (CC BY 3.0; https://creativecommons.org/licenses/by/3.0/; https://commons.wikimedia.org/wiki/File:Clair_de_lune_(Claude_Debussy)_Suite_bergamasque.ogg) | Frédéric Chopin · Nocturne Op. 9 No. 2 — Peter Johnston / Musopen (CC0 1.0; https://creativecommons.org/publicdomain/zero/1.0/; https://commons.wikimedia.org/wiki/File:Chopin_Nocturne_No._2_in_E_Flat_Major%2C_Op._9.ogg) | Erik Satie · Gymnopédie No. 1 — Robin Alciatore / Musopen (Public domain; https://creativecommons.org/publicdomain/mark/1.0/; https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg) | Johann Sebastian Bach · Prelude in C major, BWV 846 — Kimiko Ishizaka (CC0 1.0; https://creativecommons.org/publicdomain/zero/1.0/; https://commons.wikimedia.org/wiki/File:Kimiko_Ishizaka_-_Bach_-_Well-Tempered_Clavier%2C_Book_1_-_01_Prelude_No._1_in_C_major%2C_BWV_846.ogg) · MP3 conversion only.</small></details>
          </div>
        </div></details>

      </section>`;
    // Scope layout directly to the canonical stage and use explicit child
    // selectors: a production CSS sanitizer collapsed descendant whitespace,
    // turning "#id .class" into the incorrect "#id.class".
    mini=document.createElement('aside');
    mini.id='mlv-desktop-mini-focus';mini.hidden=true;
    mini.innerHTML='<button type="button" data-focus-action="open">◷ 25:00</button><button type="button" data-focus-action="toggle">Pause</button>';
    launcher=document.createElement('button');
    launcher.id='mlv-desktop-focus-launcher';launcher.type='button';
    launcher.textContent='◷ Pomodoro';launcher.title='Pomodoro';launcher.setAttribute('aria-label','Open Pomodoro');
    launcher.addEventListener('click',()=>open());
    for(const node of [screen,mini]){
      node.addEventListener('click',event=>{
        const button=event.target.closest('[data-focus-action]');if(!button)return;
        handleAction(button.dataset.focusAction);
      });
    }
    screen.addEventListener('input',event=>{if(event.target?.matches?.('[data-mlv-ambient-volume]'))window.MichelsLifeFocusAudio?.setAmbientVolume?.(Number(event.target.value)/100,false);});
    screen.addEventListener('change',async event=>{
      if(event.target?.matches?.('[data-mlv-personal-files]')){const input=event.target;input.disabled=true;try{await window.MichelsLifeFocusAudio?.importPersonalTracks?.(input.files);}finally{input.value='';input.disabled=false;refresh();}return;}
      if(event.target?.matches?.('[data-mlv-ambient-volume]'))window.MichelsLifeFocusAudio?.setAmbientVolume?.(Number(event.target.value)/100);
      else if(event.target?.matches?.('[data-mlv-ambient-mode]'))window.MichelsLifeFocusAudio?.setAmbientMode?.(event.target.value);
      else if(event.target?.matches?.('[data-mlv-ambient-collection]'))window.MichelsLifeFocusAudio?.setAmbientCollection?.(event.target.value);
      else if(event.target?.matches?.('[data-mlv-completion-sound]'))
        window.MichelsLifeFocusAudio?.selectCompletion?.(event.target.value);
      else if(event.target?.matches?.('[data-mlv-scene-select]'))
        window.MichelsLifeFocusAudio?.selectScene?.(event.target.value);
      refresh();
    });
    document.body.append(screen,mini,launcher);
  }
  function handleAction(command){
    if(command==='preview-completion'){const audio=window.MichelsLifeFocusAudio;if(audio?.recordingActive?.()){audio.stopClassical();refresh();return true;}return audio?.playCompletion?.(true)===true;}
    if(command==='toggle-ambient'){
      const music=window.MichelsLifeFocusAudio;
      music?.toggleAmbientPlayback?.();
      refresh();return true;
    }
    if(command==='archive-ambient'){const audio=window.MichelsLifeFocusAudio;audio?.archiveScene?.(audio.playingScene?.()||audio.sceneId?.(),true);refresh();return true;}
    if(command==='restore-ambient'){const id=q('[data-mlv-archived-track]',screen)?.value;window.MichelsLifeFocusAudio?.archiveScene?.(id,false);refresh();return true;}
    if(command==='stop-ambient'){window.MichelsLifeFocusAudio?.stopAmbient?.();refresh();return true;}
    if(command==='previous-ambient'||command==='next-ambient'){window.MichelsLifeFocusAudio?.moveAmbient?.(command==='previous-ambient'?-1:1);refresh();return true;}
    if(command==='open'){open();return true;}
    if(command==='alarms'){
      minimize();
      const opened=window.MichelsLifeAlarms?.open?.();
      return opened===true;
    }
    if(command==='minimize'){minimize();return true;}
    const engine=api(),state=engine?.focusState?.();
    if(!engine?.focusState)return false;
    if(command==='toggle')engine.toggleFocus?.();
    else if(command==='skip'){
      if(state?.status==='running'&&!window.confirm(lang('Skip the current phase?','¿Saltar la fase actual?')))return false;
      engine.skipFocus?.();
    }else if(command==='reset'){
      if(state?.status==='running'&&!window.confirm(lang('Reset this session?','¿Reiniciar esta sesión?')))return false;
      engine.resetFocus?.();
    }else return false;
    refresh();return true;
  }
  // The legacy 3.0.x navigation stack registers several capture listeners that
  // can consume a click before launcher/button handlers see it. Own only our
  // three surfaces from window capture (installed in <head> before legacy UI).
  let lastInput=null;
  function dispatchFocusInput(event){
    if(android())return;
    if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
    const t=event.target?.closest?.('#mlv-desktop-focus-launcher, #mlv-desktop-focus-immersive [data-focus-action], #mlv-desktop-focus-immersive [data-mlv-audio], #mlv-desktop-focus-immersive [data-mlv-classical], #mlv-desktop-focus-immersive [data-mlv-scene], #mlv-desktop-mini-focus [data-focus-action]');
    if(!t||t.disabled)return;
    const action=t.id==='mlv-desktop-focus-launcher'?'launch':(t.dataset.mlvClassical?'classical:'+t.dataset.mlvClassical:(t.dataset.mlvScene?'scene:'+t.dataset.mlvScene:(t.dataset.mlvAudio||t.dataset.focusAction)));
    if(!action)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const now=Date.now();
    // Never dedupe two physical clicks. Pausing then resuming rapidly is a
    // legitimate action, especially in the minimized floating Pomodoro.
    // Only suppress the browser's synthetic click after a handled keydown.
    if(event.type==='click'&&lastInput?.kind==='keydown'&&
       lastInput.action===action&&now-lastInput.at<350)return;
    if(event.type==='keydown')lastInput={at:now,action,kind:'keydown'};
    else lastInput=null;
    if(action==='launch')open();
    else if(action.startsWith('classical:')){
      window.MichelsLifeFocusAudio?.toggleClassical?.(action.slice(10));refresh();
    }else if(action.startsWith('scene:')){
      window.MichelsLifeFocusAudio?.toggleScene?.(action.slice(6));refresh();
    }else handleAction(action);
  }
  // Handle the completed click: hiding/mounting a dialog on pointerdown
  // makes its originating button vanish before pointerup (WebView/Chromium).
  window.addEventListener?.('click',dispatchFocusInput,true);
  window.addEventListener?.('keydown',dispatchFocusInput,true);
  function open(){
    if(android())return window.MichelsLifeMobileExperience?.openFocus?.()||false;
    create();if(!screen)return false;
    applyWallpaper(screen);screen.hidden=false;closedPhase=null;closedMode=null;saveMinimized();
    if(!api()?.focusState){
      const status=q('#mlv-desktop-focus-status',screen);
      if(status)status.textContent=lang('Starting the timer…','Iniciando el temporizador…');
    }
    focusSceneSequence++;
    document.body.classList.add('mlv-desktop-focus-open');
    refresh();
    q('[data-focus-action="minimize"]',screen)?.focus();
    return true;
  }
  function minimize(){
    if(android())return window.MichelsLifeMobileExperience?.closeFocus?.()||false;
    if(!screen)return false;
    screen.hidden=true;document.body.classList.remove('mlv-desktop-focus-open');
    const state=api()?.focusState?.();
    closedPhase=state?.status==='running'?state.mode+':'+state.deadlineAt:null;
    closedMode=live(state)?state.mode:null;
    saveMinimized();
    refresh();launcher?.focus();return true;
  }
  function refresh(){
    if(android())return;
    create();if(!screen)return;
    const engine=api(),state=engine?.focusState?.();
    restoreMinimized();
    if(state&&!live(state)&&(closedPhase||closedMode)){
      closedPhase=null;closedMode=null;saveMinimized();
    }
    const running=state?.status==='running';
    const phase=running?state.mode+':'+state.deadlineAt:null;
    if(running&&phase!==lastPhase&&phase!==closedPhase&&state.mode!==closedMode&&!q('#mlv200Onboarding:not([hidden])')){
      screen.hidden=false;document.body.classList.add('mlv-desktop-focus-open');applyWallpaper(screen);
    }
    lastPhase=phase;
    mini.hidden=!live(state)||!screen.hidden;
    launcher.hidden=live(state)||!screen.hidden;
    if(!state)return;
    const remaining=time(engine.remaining?.(state)),mode=state.mode==='break'?lang('BREAK','DESCANSO'):lang('FOCUS','ENFOQUE');
    q('#mlv-desktop-focus-mode',screen).textContent=mode;
    q('#mlv-desktop-focus-clock',screen).textContent=remaining;
    q('#mlv-desktop-focus-status',screen).textContent=state.status==='running'?lang('In progress','En curso'):state.status==='paused'?lang('Paused','En pausa'):lang('Ready to begin','Listo para comenzar');
    q('[data-focus-action="open"]',mini).textContent=mode+' · '+remaining;
    q('[data-focus-action="toggle"]',mini).textContent=running?lang('Pause','Pausar'):lang('Resume','Reanudar');
    q('[data-focus-action="toggle"]',screen).textContent=running?lang('Pause session','Pausar sesión'):state.status==='paused'?lang('Resume session','Reanudar sesión'):lang('Start focusing','Comenzar enfoque');
    screen.querySelectorAll('[data-focus-action="minimize"]').forEach((button,i)=>{
      const value=i?lang('Navigate the app','Navegar por la app'):lang('Minimize Pomodoro','Minimizar Pomodoro');
      button.setAttribute('aria-label',value);if(i)button.textContent=value;
    });
    q('[data-focus-action="skip"]',screen).textContent=lang('Skip phase','Saltar fase');
    q('[data-focus-action="reset"]',screen).textContent=lang('Reset','Reiniciar');
    q('[data-focus-action="alarms"]',screen).textContent=lang('⏰ Alarms','⏰ Alarmas');
    const audio=window.MichelsLifeFocusAudio;
    const classicalHeading=q('[data-mlv-classical-heading]',screen);
    const headingText=lang('Classical music','Música clásica');
    if(classicalHeading&&classicalHeading.textContent!==headingText)
      classicalHeading.textContent=headingText;
    const classicalNote=q('[data-mlv-classical-note]',screen);
    const noteText=lang('Licensed piano recordings · completion only.',
      'Grabaciones de piano con licencia · solo al terminar.');
    if(classicalNote&&classicalNote.textContent!==noteText)
      classicalNote.textContent=noteText;
    const ambientHeading=q('[data-mlv-ambient-heading]',screen);
    if(ambientHeading)ambientHeading.textContent=lang('Ambient music','Música ambiental')+' · '+(audio?.sceneOptions?.().length||0);
    screen.querySelectorAll('[data-mlv-scene]').forEach(button=>{
      const id=button.dataset.mlvScene;
      const option=audio?.sceneOptions?.().find(item=>item.id===id);
      const active=audio?.playing?.()&&audio?.playingScene?.()===id;
      const label=(active?'■ ':'▶ ')+(option?.label||id);
      if(button.textContent!==label)button.textContent=label;
      button.setAttribute('aria-pressed',String(!!active));
    });
    screen.querySelectorAll('[data-mlv-classical]').forEach(button=>{
      const id=button.dataset.mlvClassical;
      const item=audio?.classicalOptions?.().find(option=>option.id===id);
      const active=audio?.previewingCompletion?.()===id;
       const text=(active?'■ ':'▶ ')+(item?.label||id);
      if(button.textContent!==text)button.textContent=text;
      if(button.getAttribute('aria-pressed')!==String(!!active))
        button.setAttribute('aria-pressed',String(!!active));
    });
    for(const [selector,options,selected] of [
      ['[data-mlv-completion-sound]',audio?.completionOptions?.(),audio?.completionId?.()],
      ['[data-mlv-scene-select]',audio?.sceneOptions?.(),audio?.sceneId?.()]
    ]){
      const select=q(selector,screen);
      if(!select||!options)continue;
      if(select.options.length!==options.length||
         options.some((item,i)=>select.options[i]?.value!==item.id||
           select.options[i]?.textContent!==item.label)){
        select.replaceChildren(...options.map(item=>{
          const opt=document.createElement('option');opt.value=item.id;opt.textContent=item.label;return opt;
        }));
      }
      if(select.value!==selected)select.value=selected;
    }
    const vol=q('[data-mlv-ambient-volume]',screen),volLabel=q('[data-mlv-volume-label]',screen);
    if(vol&&document.activeElement!==vol)vol.value=String(Math.round((audio?.ambientVolume?.()??.35)*100));
    if(volLabel)volLabel.textContent=lang('Volume','Volumen');
    const archivedSelect=q('[data-mlv-archived-track]',screen),archiveButton=q('[data-mlv-audio="archive-ambient"]',screen),restoreButton=q('[data-mlv-audio="restore-ambient"]',screen),archived=audio?.archivedOptions?.()||[];
    if(archiveButton){archiveButton.textContent=lang('Archive track','Archivar canción');archiveButton.disabled=!audio?.sceneId?.();}
    if(archivedSelect){const selected=archivedSelect.value;const opts=[{id:'',label:lang('Archived','Archivadas')+' ('+archived.length+')'},...archived];if(archivedSelect.options.length!==opts.length||opts.some((x,i)=>archivedSelect.options[i]?.value!==x.id||archivedSelect.options[i]?.textContent!==x.label)){archivedSelect.replaceChildren(...opts.map(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=x.label;return o;}));archivedSelect.value=archived.some(x=>x.id===selected)?selected:'';}archivedSelect.disabled=!archived.length;}
    if(restoreButton){restoreButton.textContent=lang('Restore','Restaurar');restoreButton.disabled=!archivedSelect?.value;}
    const personalLabel=q('[data-mlv-personal-label]',screen),personalNotice=q('[data-mlv-personal-status]',screen);if(personalLabel)personalLabel.textContent=lang('Import my music (local files)','Importar mi música (archivos locales)');if(personalNotice)personalNotice.textContent=audio?.personalStatus?.()||lang('MP3, WAV, OGG · available storage','MP3, WAV, OGG · espacio disponible');
    const ambientButton=q('[data-mlv-audio="toggle-ambient"]',screen);if(ambientButton)ambientButton.disabled=!audio?.sceneId?.();
    const playback=audio?.ambientPlayback?.(),modeSelect=q('[data-mlv-ambient-mode]',screen),progress=q('[data-mlv-ambient-progress]',screen);
    if(modeSelect){modeSelect.value=audio?.ambientMode?.()||'repeat';modeSelect.options[0].textContent=lang('Repeat track','Repetir pista');modeSelect.options[1].textContent=lang('Continuous playlist','Lista continua');modeSelect.options[2].textContent=lang('Shuffle','Aleatorio');}
    const coll=q('[data-mlv-ambient-collection]',screen);if(coll){coll.value=audio?.ambientCollection?.()||'all';const names=[lang('All recordings','Todas las grabaciones'),lang('Ambient','Ambiental'),lang('Cinematic','Cinematográfica'),lang('Classical piano','Piano clásico'),lang('My music','Mi música')];names.forEach((name,i)=>coll.options[i].textContent=name);}
    if(progress)progress.textContent=playback&&Number.isFinite(playback.duration)?time(playback.currentTime*1000)+' / '+time(playback.duration*1000):'';
    const prevTrack=q('[data-mlv-audio="previous-ambient"]',screen),nextTrack=q('[data-mlv-audio="next-ambient"]',screen);
    if(prevTrack){prevTrack.textContent=lang('⏮ Previous','⏮ Anterior');prevTrack.setAttribute('aria-label',lang('Previous track','Canción anterior'));}
    if(nextTrack){nextTrack.textContent=lang('Next ⏭','Saltar ⏭');nextTrack.setAttribute('aria-label',lang('Skip track','Saltar canción'));}
    const stop=q('[data-mlv-audio="stop-ambient"]',screen);if(stop)stop.textContent=lang('Stop','Detener');
    if(ambientButton)ambientButton.textContent=playback?(playback.paused?lang('Resume','Reanudar'):lang('Pause','Pausar')):audio?.playing?.()?lang('Stop','Detener'):lang('Play','Reproducir');
    const previewButton=q('[data-mlv-audio="preview-completion"]',screen);
    if(previewButton)previewButton.textContent=audio?.recordingActive?.()?lang('■ Stop recording','■ Detener grabación'):lang('▶ Listen to completion','▶ Escuchar sonido final');
    const sceneLabel=q('[for="mlv-focus-scene-select"]',screen);
    if(sceneLabel?.firstChild?.nodeType===3)
      sceneLabel.firstChild.textContent=lang('Background music','Música de ambiente')+' ';
    const completionLabel=q('[for="mlv-focus-completion-select"]',screen);
    if(completionLabel?.firstChild?.nodeType===3)
      completionLabel.firstChild.textContent=lang('Completion sound','Sonido al terminar')+' ';
    if(!screen.hidden){
      applyWallpaper(screen);
      window.MichelsLifeMotivation?.render?.(
        q('#mlv-desktop-focus-motivation',screen),
        'desktop-focus:'+focusSceneSequence+':'+String(state.mode||'work')+':'+String(state.deadlineAt||'ready')
      );
    }
  }
  window.MichelsLifeFocusImmersive.open=open;
  window.MichelsLifeFocusImmersive.minimize=minimize;
  window.MichelsLifeFocusImmersive.refresh=refresh;
  const boot=()=>{
    if(android())return;
    create();
    refresh();
    window.setInterval(()=>{if(document.body?.isConnected)refresh();},650);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&screen&&!screen.hidden){event.preventDefault();minimize();}
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();