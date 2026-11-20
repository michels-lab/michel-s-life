/* Michel's Life · Granada floating color preview and persistence bridge.
 * Intentionally isolated from navigation, chapters, focus and alarm code. */
(function () {
  'use strict';
  if (window.MLColorFloatingPreview) return;
  const STORAGE='michelsLife.granadaColorPreview.v1';
  const PALETTES=['michelsLife.theme.v343','michelsLifeTheme.v3000','michelsLifePalette.v264','michelsLife.colorTheme.v30184'];
  const FIELDS={
    v133Bg:['bg','Background'],v133Panel:['panel','Panel'],v133Card:['card','Card'],
    v133Accent:['accent','Primary accent'],v133Accent2:['accent2','Secondary accent'],
    v133Gold:['gold','Gold accent'],
    v133TextColor:['text','Main text'],v30168MainText:['text','Main text'],
    v133MutedTextColor:['muted','Secondary text'],v30168SecondaryText:['muted','Secondary text'],
    v133Atmosphere:['atmosphere','Glass atmosphere']
  };
  const VARS={bg:['--bg','--ui-bg'],panel:['--panel','--ui-panel'],card:['--card','--ui-card'],
    accent:['--accent','--ui-accent'],accent2:['--accent2','--ui-accent2'],
    gold:['--gold','--ui-gold'],text:['--text','--ui-text'],muted:['--muted','--ui-muted'],
    atmosphere:['--glass-atmosphere','--ui-atmosphere']};
  const valid=s=>/^#[0-9a-f]{6}$/i.test(String(s||''))?String(s):null;
  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||{}}catch(_){return {}}};
  const stateColors=()=>read(STORAGE);
  let panel, active=null, saveTimer=0;
  const editOrigin=new Map();
  const translate=(en,es)=>window.MichelsLifeI18n?.language==='es'?es:en;
  const LABEL_ES={
    bg:'Fondo',panel:'Panel',card:'Tarjeta',accent:'Acento principal',
    accent2:'Acento secundario',gold:'Dorado',text:'Texto principal',
    muted:'Texto secundario',atmosphere:'Atmósfera del cristal'
  };
  function contrast(foreground,background){
    const luminance=hex=>{
      if(!valid(hex))return null;
      const parts=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
      const linear=parts.map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
      return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
    };
    const a=luminance(foreground),b=luminance(background);
    if(a===null||b===null)return null;
    return Math.round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)*100)/100;
  }
  function beginEdit(input){
    const field=FIELDS[input?.id];
    if(!field||!input.closest?.('#tab-settings'))return;
    if(!editOrigin.has(input.id)){
      const initial=stateColors()[field[0]]||input.value;
      if(valid(initial))editOrigin.set(input.id,initial);
    }
  }
  function palette() {
    const p={};
    for(const k of PALETTES) Object.assign(p,read(k));
    return p;
  }
  function setVars(key,color) {
    for(const el of [document.documentElement,document.body]){
      if(!el) continue;
      for(const css of VARS[key]||[])el.style.setProperty(css,color,'important');
    }
  }
  function store(key,color) {
    if(!valid(color))return;
    const saved={...stateColors(),[key]:color};
    try{localStorage.setItem(STORAGE,JSON.stringify(saved))}catch(_){}
    if(key==='atmosphere') {
      try{localStorage.setItem('michelsLife.glassAtmosphere.v3042',color)}catch(_){}
    }else{
      for(const storageKey of PALETTES){
        try{localStorage.setItem(storageKey,JSON.stringify({...read(storageKey),[key]:color}))}catch(_){}
      }
      if(key==='text')try{localStorage.setItem('michelsLife.textColor.v3042',color)}catch(_){}
      if(key==='muted')try{localStorage.setItem('michelsLife.mutedTextColor.v3042',color)}catch(_){}
    }
    try{
      const s=window.state?.settings;
      if(s){
        const prop=key==='atmosphere'?'glassAtmosphere':key==='muted'?'mutedTextColor':key==='text'?'textColor':null;
        if(prop)s[prop]=color;
        for(const k of ['v133Theme','v264Palette','v3000Theme','v2910Theme']){
          s[k]={...(s[k]||{}),[key==='atmosphere'?'glassAtmosphere':key]:color};
        }
      }
    }catch(_){}
    setVars(key,color);
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{try{if(typeof window.save==='function')window.save()}catch(_){}},110);
  }
  function restore() {
    const c=stateColors();
    for(const [key,color]of Object.entries(c)){
      if(!VARS[key]||!valid(color))continue;
      setVars(key,color);
    }
    const root=document.querySelector('#tab-settings');
    if(!root)return;
    for(const [id,[key]]of Object.entries(FIELDS)){
      const input=root.querySelector('#'+id);
      if(input&&document.activeElement!==input&&valid(c[key])&&input.value.toLowerCase()!==c[key].toLowerCase())input.value=c[key];
    }
  }
  function ensure(){
    if(panel?.isConnected)return panel;
    panel=document.createElement('aside');
    panel.id='ml-granada-color-floating-preview';
    panel.setAttribute('aria-live','off');
    panel.setAttribute('role','region');
    panel.setAttribute('aria-label','Color preview');
    panel.style.cssText='position:fixed;z-index:2147482500;width:300px;box-sizing:border-box;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);overflow:auto;background:#141a29;color:#f4f6fb;border:1px solid #58647c;border-radius:16px;box-shadow:0 18px 48px #000a;padding:14px;font:13px system-ui,sans-serif;pointer-events:auto;display:none;';
    panel.innerHTML='<div data-ml-label style="font-weight:750;font-size:12px;margin-bottom:10px"></div><div data-ml-sample style="border-radius:12px;padding:13px;border:1px solid #596277"><div data-ml-title style="font-size:18px;font-weight:750;margin-bottom:5px">Your next chapter</div><div data-ml-copy style="font-size:12px;margin-bottom:10px">Make today count.</div><div data-ml-card style="border-radius:8px;padding:9px;margin-bottom:8px">Today · 3 / 5 missions</div><div data-ml-focus style="border:1px solid;border-radius:9px;padding:8px;margin-bottom:7px"><strong data-ml-focus-title>Focus · Deep work</strong><div data-ml-focus-copy>One step at a time</div></div><div data-ml-alarm style="border:1px solid;border-radius:9px;padding:8px;margin-bottom:8px"><strong data-ml-alarm-title>Alarm · First Light</strong></div><span data-ml-button style="display:inline-block;padding:7px 12px;border-radius:8px;font-weight:700">Start mission</span></div><div data-ml-contrast style="font-size:12px;margin-top:9px"></div><div data-ml-hex style="font-size:11px;opacity:.75;margin-top:8px"></div><button id="ml-granada-undo-color" data-ml-undo type="button" style="margin-top:9px;min-height:34px;width:100%;background:#27334b;color:#fff;border:1px solid #7082a0;border-radius:8px;cursor:pointer">Undo this color</button>';
    document.body.appendChild(panel);
    return panel;
  }
  function preview(input){
    const field=FIELDS[input?.id];if(!field||!input.closest('#tab-settings'))return;
    const [key,label]=field, color=valid(input.value);if(!color)return;
    active=input;
    const p=ensure(),q=s=>p.querySelector(s),saved={...palette(),...stateColors(),[key]:color};
    q('[data-ml-label]').textContent=translate('Live preview','Vista previa')+' · '+translate(label,LABEL_ES[key]||label)+' · '+color.toUpperCase();
    q('[data-ml-title]').textContent=translate('Your next chapter','Tu siguiente capítulo');
    q('[data-ml-copy]').textContent=translate('Make today count.','Haz que hoy cuente.');
    q('[data-ml-card]').textContent=translate('Today · 3 / 5 missions','Hoy · 3 / 5 misiones');
    q('[data-ml-button]').textContent=translate('Start mission','Iniciar misión');
    q('[data-ml-hex]').textContent=translate('Applied and saved as you move the color picker.','Se aplica y guarda al mover el selector.');
    q('[data-ml-focus-title]').textContent=translate('Focus · Deep work','Pomodoro · Concentración');
    q('[data-ml-focus-copy]').textContent=translate('One step at a time','Un paso a la vez');
    q('[data-ml-alarm-title]').textContent=translate('Alarm · First Light','Alarma · Primera luz');
    q('[data-ml-undo]').textContent=translate('Undo this color','Deshacer este color');
    const bg=valid(saved.bg)||'#070914',card=valid(saved.card)||'#1c2639';
    const fg=valid(saved.text)||'#eef4ff',muted=valid(saved.muted)||'#aab4c8';
    const accent=valid(saved.accent)||'#75e4ff',accent2=valid(saved.accent2)||'#9a8ae2';
    const gold=valid(saved.gold)||'#dec38c',surface=valid(saved.panel)||'#58647c';
    q('[data-ml-sample]').style.background=bg;
    q('[data-ml-sample]').style.borderColor=surface;
    for(const selector of ['[data-ml-title]','[data-ml-card]','[data-ml-focus-title]','[data-ml-alarm-title]'])
      q(selector).style.color=fg;
    for(const selector of ['[data-ml-copy]','[data-ml-focus-copy]'])
      q(selector).style.color=muted;
    q('[data-ml-card]').style.background=card;
    q('[data-ml-card]').style.borderLeft='3px solid '+accent2;
    q('[data-ml-focus]').style.background=card;
    q('[data-ml-focus]').style.borderColor=accent2;
    q('[data-ml-alarm]').style.background=card;
    q('[data-ml-alarm]').style.borderColor=gold;
    q('[data-ml-button]').style.background=accent;
    q('[data-ml-button]').style.color='#08101b';
    q('[data-ml-label]').style.color=key==='gold'?gold:'#f4f6fb';
    q('[data-ml-sample]').style.boxShadow=key==='atmosphere'?'inset 0 0 42px '+color+'66':'none';
    const ratio=contrast(fg,bg);
    q('[data-ml-contrast]').textContent=ratio===null?'':translate('Text contrast','Contraste del texto')+': '+ratio.toFixed(2)+':1'+(ratio<4.5?' · '+translate('low contrast','contraste bajo'):'');
    q('[data-ml-contrast]').style.color=ratio!==null&&ratio<4.5?'#ffd48b':'#bfeacb';
    q('[data-ml-undo]').disabled=!editOrigin.has(input.id)||editOrigin.get(input.id)===color;
    p.style.display='block';
    const rect=input.getBoundingClientRect(),width=300,screenWidth=window.innerWidth||1024,screenHeight=window.innerHeight||768;
    const left=rect.right+14+width<screenWidth?rect.right+14:Math.max(12,rect.left-width-14);
    p.style.left=Math.min(screenWidth-24,Math.max(12,left))+'px';
    p.style.top=Math.max(12,Math.min(screenHeight-p.offsetHeight-12,rect.top-40))+'px';
  }
  function onInput(e){
    const target=e.target,field=FIELDS[target?.id];
    if(!field||!target.closest?.('#tab-settings'))return;
    beginEdit(target);
    store(field[0],target.value);
    preview(target);
  }
  function undoColor(){
    if(!active)return false;
    const field=FIELDS[active.id],original=editOrigin.get(active.id);
    if(!field||!valid(original))return false;
    active.value=original;
    store(field[0],original);
    preview(active);
    return true;
  }
  document.addEventListener('input',onInput,true);
  document.addEventListener('change',onInput,true);
  document.addEventListener('focusin',e=>{if(FIELDS[e.target?.id]){beginEdit(e.target);preview(e.target)}},true);
  document.addEventListener('pointerdown',e=>{
    if(panel?.contains(e.target))return;
    if(active&&!e.target.closest?.('#tab-settings input[type="color"]')){
      panel.style.display='none';
      editOrigin.clear();
      active=null;
    }
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel){panel.style.display='none';editOrigin.clear();active=null}},true);
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#ml-granada-undo-color')){e.preventDefault?.();undoColor();return;}
    setTimeout(restore,125);
  },true);
  function observeSettingsRebuild(){
    if(typeof window.MutationObserver!=='function'||!document.body)return;
    const watch=new window.MutationObserver(()=>setTimeout(restore,80));
    watch.observe(document.body,{attributes:true,attributeFilter:['class','data-view','data-route'],childList:true});
    const root=document.querySelector('#tab-settings');
    if(root)watch.observe(root,{attributes:true,attributeFilter:['class','style','hidden'],childList:true,subtree:true});
  }
  window.addEventListener('pageshow',restore);
  window.addEventListener('focus',restore);
  window.addEventListener('storage',e=>{if(!e.key||e.key===STORAGE||PALETTES.includes(e.key))restore()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)restore()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{restore();observeSettingsRebuild()},{once:true});
  else{restore();observeSettingsRebuild()}
  window.MLColorFloatingPreview=Object.freeze({restore,preview,colors:stateColors,contrast,undoColor,
    applyColor:(key,color)=>{if(!VARS[key]||!valid(color))return false;store(key,color);return true;}});
})();
