/* Michel's Life · Granada floating color preview and persistence bridge.
 * Intentionally isolated from navigation, chapters, focus and alarm code. */
(function () {
  'use strict';
  if (window.MLColorFloatingPreview) return;
  const STORAGE='michelsLife.granadaColorPreview.v1';
  const PALETTES=['michelsLife.palette.v189','michelsLife.theme.v343','michelsLifeTheme.v3000','michelsLifePalette.v264'];
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
    panel.setAttribute('aria-live','polite');
    panel.style.cssText='position:fixed;z-index:2147482500;width:260px;max-width:calc(100vw - 24px);background:#141a29;color:#f4f6fb;border:1px solid #58647c;border-radius:16px;box-shadow:0 18px 48px #000a;padding:14px;font:13px system-ui,sans-serif;pointer-events:none;display:none;';
    panel.innerHTML='<div style="font-weight:750;font-size:12px;opacity:.72;margin-bottom:8px">LIVE COLOR PREVIEW</div><div data-ml-label style="font-weight:700;margin-bottom:10px"></div><div data-ml-sample style="border-radius:12px;padding:13px;border:1px solid #596277"><div data-ml-title style="font-size:18px;font-weight:750;margin-bottom:5px">Your next chapter</div><div data-ml-copy style="font-size:12px;margin-bottom:10px">Make today count.</div><div data-ml-card style="border-radius:8px;padding:9px;margin-bottom:8px">Today · 3 / 5 missions</div><span data-ml-button style="display:inline-block;padding:7px 12px;border-radius:8px;font-weight:700">Start mission</span></div><div data-ml-hex style="font-size:11px;opacity:.75;margin-top:9px"></div>';
    document.body.appendChild(panel);
    return panel;
  }
  function preview(input){
    const field=FIELDS[input?.id];if(!field||!input.closest('#tab-settings'))return;
    const [key,label]=field, color=valid(input.value);if(!color)return;
    active=input;
    const p=ensure(),q=s=>p.querySelector(s),saved={...palette(),...stateColors(),[key]:color};
    q('[data-ml-label]').textContent=label+' · '+color.toUpperCase();
    q('[data-ml-hex]').textContent='Changes apply instantly and stay saved.';
    const bg=saved.bg||'#070914',card=saved.card||'#1c2639',text=saved.text||'#eef4ff',muted=saved.muted||'#aab4c8',accent=saved.accent||'#75e4ff';
    q('[data-ml-sample]').style.background=bg;
    q('[data-ml-sample]').style.borderColor=saved.panel||'#58647c';
    q('[data-ml-title]').style.color=text;
    q('[data-ml-copy]').style.color=muted;
    q('[data-ml-card]').style.background=card;
    q('[data-ml-card]').style.color=text;
    q('[data-ml-button]').style.background=accent;
    q('[data-ml-button]').style.color='#08101b';
    if(key==='gold')q('[data-ml-label]').style.color=color;
    else q('[data-ml-label]').style.color='#f4f6fb';
    if(key==='atmosphere')q('[data-ml-sample]').style.boxShadow='inset 0 0 42px '+color+'66';
    else q('[data-ml-sample]').style.boxShadow='none';
    p.style.display='block';
    const rect=input.getBoundingClientRect(),width=260;
    const left=rect.right+14+width<innerWidth?rect.right+14:Math.max(12,rect.left-width-14);
    p.style.left=Math.max(12,left)+'px';
    p.style.top=Math.max(12,Math.min(innerHeight-p.offsetHeight-12,rect.top-40))+'px';
  }
  function onInput(e){
    const target=e.target,field=FIELDS[target?.id];
    if(!field||!target.closest('#tab-settings'))return;
    store(field[0],target.value);
    preview(target);
  }
  document.addEventListener('input',onInput,true);
  document.addEventListener('change',onInput,true);
  document.addEventListener('focusin',e=>{if(FIELDS[e.target?.id])preview(e.target)},true);
  document.addEventListener('pointerdown',e=>{
    if(active&&!e.target.closest('#tab-settings input[type="color"]')){
      if(panel)panel.style.display='none';
      active=null;
    }
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel)panel.style.display='none'},true);
  document.addEventListener('click',()=>setTimeout(restore,90),true);
  window.addEventListener('pageshow',restore);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore,{once:true});else restore();
  window.MLColorFloatingPreview=Object.freeze({restore,preview,colors:stateColors});
})();
