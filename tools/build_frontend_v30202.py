#!/usr/bin/env python3
"""Build Michel's Life v3.0.202 frontend from the canonical bootstrap source.

The UI fixes in this builder are applied directly to the core function definitions
that ship in index.html. It does not append runtime hotfix or developer overlays.
"""
from __future__ import annotations
import argparse
import html as html_lib
import json
import re
from pathlib import Path

VERSION = "3.0.202"

CORE_STYLE = r'''<style id="mlv-v30202-core-branding-style">
#v30171Sidebar .v30171-brand-mark{width:72px!important;height:72px!important;border-radius:22px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important}
#v30171Sidebar .v30171-brand-mark img{width:72px!important;height:72px!important;display:block!important;object-fit:contain!important;filter:drop-shadow(0 8px 18px rgba(0,0,0,.28))}
#v30171Sidebar .v30171-brand-copy{min-width:0}
#v30171Sidebar .v30171-brand-legal{margin-top:6px;max-width:190px;color:var(--muted);font:600 7.2px/1.35 Inter,Segoe UI,Arial,sans-serif;letter-spacing:.025em;text-transform:none;opacity:.78}
.mlvdev-card{position:relative;overflow:hidden}.mlvdev-head{display:flex;align-items:center;gap:12px}.mlvdev-avatar-wrap{position:relative;flex:0 0 auto}.mlvdev-avatar{width:72px;height:72px;border-radius:18px;object-fit:cover;display:block;border:2px solid rgba(231,187,92,.58);box-shadow:0 10px 26px rgba(0,0,0,.28)}.mlvdev-title{min-width:0}.mlvdev-title h2{margin:0;font-size:16px}.mlvdev-title p{margin:3px 0 0;color:var(--muted);font-size:9.5px;line-height:1.4}.mlvdev-copy{margin-top:12px;color:var(--muted);font-size:9.5px;line-height:1.55}.mlvdev-contact{margin-top:10px;font-size:9.5px;color:var(--muted)}.mlvdev-contact a{color:inherit;text-decoration:none;border-bottom:1px dotted rgba(255,255,255,.22)}.mlvdev-socials{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:13px}.mlvdev-social{min-height:54px;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:8px 9px;text-decoration:none;color:inherit;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);transition:transform .15s ease,border-color .15s ease,background .15s ease}.mlvdev-social:hover{transform:translateY(-2px);border-color:rgba(231,187,92,.42);background:rgba(231,187,92,.07)}.mlvdev-social span{font-weight:800;font-size:10px}.mlvdev-social small{display:block;margin-top:2px;font-size:7.5px;color:var(--muted);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}.mlvdev-legal{margin-top:14px;padding-top:11px;border-top:1px solid rgba(255,255,255,.07);font-size:8.8px;line-height:1.5;color:var(--muted)}.mlvdev-copyright{display:block;margin-top:8px;color:rgba(255,255,255,.68);font-size:8.5px}@media(max-width:1000px){.mlvdev-socials{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one source match, found {count}")
    return text.replace(old, new, 1)


def remove_obsolete_overlay(text: str, marker: str) -> str:
    # Remove an old style/script block by id if a previously generated bundle is reused.
    pattern = rf'<(style|script)\b[^>]*id=["\']{re.escape(marker)}["\'][^>]*>.*?</\1>'
    return re.sub(pattern, '', text, flags=re.I | re.S)


def esc(v: object) -> str:
    return html_lib.escape(str(v or ''), quote=True)


def developer_html(profile: dict) -> str:
    developer = esc(profile['developer'])
    studio = esc(profile['studio'])
    email = esc(profile['email'])
    copyright_text = esc(profile['copyright'])
    socials = [
        ('Instagram', profile['instagram'], '@realmichelduarte'),
        ('Facebook', profile['facebook'], 'realmichelduarte'),
        ('LinkedIn', profile['linkedin'], 'realmichelduart'),
        ('GitHub', profile['github'], 'realmichelduarte'),
        ('Email', 'mailto:' + profile['email'], profile['email']),
    ]
    links = ''.join(
        f'<a class="mlvdev-social" href="{esc(url)}" target="_blank" rel="noopener noreferrer"><span><strong>{esc(name)}</strong><small>{esc(handle)}</small></span></a>'
        for name, url, handle in socials
    )
    return (
        '<section class="card" data-mlv-about-core><div class="section-title"><div><h2>Michel’s Life</h2><p>Personal Progress System</p></div>'
        '<span class="pill gold">v${VERSION}</span></div><div class="v30171-about-grid">'
        f'<div><small>DEVELOPER</small><b>{developer}</b></div><div><small>STUDIO</small><b>{studio}</b></div>'
        '<div><small>LICENSE</small><b>Proprietary · Personal use</b></div></div>'
        '<p class="muted" style="margin-top:12px">v3.0.202 is the Release Readiness build: diagnostics, portable backups, safer update infrastructure and product cleanup, while preserving the approved visual system.</p></section>'
        '<section class="card mlvdev-card" data-mlv-developer><div class="mlvdev-head"><div class="mlvdev-avatar-wrap">'
        f'<img class="mlvdev-avatar" src="assets/michel_duarte_avatar.jpg" alt="{developer}"></div><div class="mlvdev-title"><h2>{developer}</h2><p>Developer · {studio}</p></div></div>'
        f'<div class="mlvdev-copy">Michel’s Life is created and maintained by {developer} under {studio}. Independent software focused on productivity, life systems and personal tools.</div>'
        f'<div class="mlvdev-contact">Contact: <a href="mailto:{email}">{email}</a></div><div class="mlvdev-socials">{links}</div>'
        '<div class="mlvdev-legal">Free for personal use. Unauthorized copying, modification, redistribution, rebranding, resale, sublicensing, or claiming this software as your own is not permitted without prior written permission.'
        f'<span class="mlvdev-copyright">{copyright_text}</span></div></section>'
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--index', required=True)
    ap.add_argument('--profile', required=True)
    ap.add_argument('--release-overlay')
    args = ap.parse_args()

    path = Path(args.index)
    text = path.read_text(encoding='utf-8')
    profile = json.loads(Path(args.profile).read_text(encoding='utf-8'))

    # If the bootstrap is still 3.0.201, bring in the 3.0.202 feature module once.
    if 'mlv-v30202-release-readiness-script' not in text:
        if not args.release_overlay:
            raise SystemExit('3.0.202 release-readiness module is missing and --release-overlay was not provided.')
        overlay = Path(args.release_overlay).read_text(encoding='utf-8')
        if 'mlv-v30202-release-readiness-script' not in overlay:
            raise SystemExit('Invalid v3.0.202 release-readiness module.')
        old_account = "function specificAccount(v){const s=norm(v);if(s.includes('micheltheog'))return'micheltheog';if(s.includes('realmichelduarte'))return'realmichelduarte';return'';}"
        new_account = "function specificAccount(v){const raw=String(v||'');const s=norm(raw);if(!/instagram|followers|following|unfollow/.test(s))return'';const at=raw.match(/@([a-z0-9._]{2,30})/i);if(at)return at[1].toLowerCase();const paren=raw.match(/\(([a-z0-9._]{2,30})\)/i);if(paren)return paren[1].toLowerCase();const labeled=raw.match(/(?:account|cuenta)\s*[:\-]?\s*([a-z0-9._]{2,30})/i);return labeled?labeled[1].toLowerCase():'';}"
        if old_account not in text:
            raise SystemExit('Expected legacy account matcher not found in the 3.0.201 bootstrap.')
        text = text.replace('3.0.201', VERSION).replace(old_account, new_account, 1)
        pos = text.lower().rfind('</body>')
        if pos < 0:
            raise SystemExit('index.html closing </body> tag not found')
        text = text[:pos] + '\n' + overlay + '\n' + text[pos:]

    # Old repair layers must never survive into the final frontend.
    for marker in (
        'mlv-developer-branding-style', 'mlv-developer-branding',
        'mlv-v30202-ui-hotfix-style', 'mlv-v30202-ui-hotfix-script',
    ):
        text = remove_obsolete_overlay(text, marker)

    # Put the permanent visual rules in the document source itself.
    text = remove_obsolete_overlay(text, 'mlv-v30202-core-branding-style')
    head = text.lower().rfind('</head>')
    if head < 0:
        raise SystemExit('index.html closing </head> tag not found')
    text = text[:head] + '\n' + CORE_STYLE + '\n' + text[head:]

    # Settings description: this pane is now developer/license content, not a placeholder.
    text = re.sub(
        r"\['about','ⓘ','About','[^']*'\]",
        "['about','ⓘ','About','Developer, license and build information.']",
        text,
        count=1,
    )

    # Root sidebar rendering: no monogram fallback as the normal output.
    old_sidebar = "side.innerHTML='<div class=\"brand v30171-brand\"><div class=\"brand-mark v30171-brand-mark\" aria-hidden=\"true\">M</div><div><h1 class=\"v30171-brand-title\" style=\"color:var(--ui-gold,var(--gold,#ffd166))!important\">MICHEL\\'S LIFE</h1><p class=\"v30171-brand-sub\">Personal Progress System</p></div></div><nav id=\"v30171PrimaryNav\" class=\"v30171-primary-nav\"></nav>';"
    new_sidebar = "side.innerHTML='<div class=\"brand v30171-brand\"><div class=\"brand-mark v30171-brand-mark\" aria-hidden=\"true\"><img src=\"assets/michels_life_mark.svg\" alt=\"\"></div><div class=\"v30171-brand-copy\"><h1 class=\"v30171-brand-title\" style=\"color:var(--ui-gold,var(--gold,#ffd166))!important\">MICHEL\\'S LIFE</h1><p class=\"v30171-brand-sub\">Personal Progress System</p><div class=\"v30171-brand-legal\">© 2026 Michel Duarte / Michel’s Lab.<br>All rights reserved.</div></div></div><nav id=\"v30171PrimaryNav\" class=\"v30171-primary-nav\"></nav>';"
    if old_sidebar in text:
        text = replace_once(text, old_sidebar, new_sidebar, 'sidebar creation')
    elif 'assets/michels_life_mark.svg' not in text:
        raise SystemExit('Sidebar creation source not found.')

    old_brand_sync = "const brand=side.querySelector('.brand');if(brand){const h=brand.querySelector('h1'),p=brand.querySelector('p');if(h)h.textContent=\"MICHEL'S LIFE\";if(p)p.textContent='Personal Progress System';}"
    new_brand_sync = "const brand=side.querySelector('.brand');if(brand){const h=brand.querySelector('h1'),p=brand.querySelector('p'),mark=brand.querySelector('.v30171-brand-mark');if(h)h.textContent=\"MICHEL'S LIFE\";if(p)p.textContent='Personal Progress System';if(mark&&!mark.querySelector('img'))mark.innerHTML='<img src=\"assets/michels_life_mark.svg\" alt=\"\">';let legal=brand.querySelector('.v30171-brand-legal');if(!legal){legal=document.createElement('div');legal.className='v30171-brand-legal';legal.innerHTML='© 2026 Michel Duarte / Michel’s Lab.<br>All rights reserved.';(brand.querySelector('.v30171-brand-copy')||h?.parentElement||brand).appendChild(legal)}}"
    if old_brand_sync in text:
        text = replace_once(text, old_brand_sync, new_brand_sync, 'sidebar sync')

    # Replace the actual About pane function, not a post-render overlay.
    about_pattern = r"function aboutPane\(\)\{return .*?\}\nfunction moveDataActions\(panes\)\{"
    about_replacement = "function aboutPane(){return `" + developer_html(profile).replace('`', '\\`') + "`}\nfunction moveDataActions(panes){"
    text, about_count = re.subn(about_pattern, lambda _m: about_replacement, text, count=1, flags=re.S)
    if about_count != 1:
        raise SystemExit(f'aboutPane core replacement: expected 1 match, found {about_count}')

    # Insert About content when Settings is built. This fixes the original empty pane cause.
    panes_anchor = "const panes={};content.querySelectorAll('[data-v30171-pane]').forEach(p=>panes[p.dataset.v30171Pane]=p);"
    about_line = "if(panes.about&&!panes.about.querySelector('[data-mlv-about-core]'))panes.about.insertAdjacentHTML('beforeend',aboutPane());"
    inserts=[]
    if about_line not in text: inserts.append(about_line)
    if inserts:
        text = replace_once(text, panes_anchor, panes_anchor + '\n   ' + '\n   '.join(inserts), 'Settings pane core mounts')

    classify_anchor = "function classify(el){\n if(el?.matches?.('[data-mlv190-google-card]'))return 'google';"
    classify_rule = " if(el?.matches?.('[data-mlv-developer],[data-mlv200-update],[data-mlv202-update],[data-mlv202-changelog]'))return 'about';"
    if classify_rule not in text:
        text = replace_once(text, classify_anchor, classify_anchor + '\n' + classify_rule, 'About ownership in Settings classifier')

    # Replace the core cloud notification implementation so duplicate persistent errors are
    # tracked by identity and a user dismissal is respected for the current app session.
    notification_pattern = r"function legacyWrap\(\)\{return document\.getElementById\('toastWrap'\)\}\nfunction notification\(title,msg='',opts=\{\}\)\{.*?\n\}\nwindow\.toast=function\(title,msg='',kind=''\)\{return notification\(title,msg,\{kind\}\)\};"
    notification_core = r'''function legacyWrap(){return document.getElementById('toastWrap')}
const dismissedNotifications=new Set();
const activeNotifications=new Map();
function notificationKey(title,msg=''){return (String(title||'').trim()+'\n'+String(msg||'').trim()).toLowerCase()}
function notification(title,msg='',opts={}){
  const wrap=legacyWrap();if(!wrap){console.log(title,msg);return null}
  const key=notificationKey(title,msg),text=(String(title)+' '+String(msg)).toLowerCase();
  const error=opts.kind==='error'||/(error|failed|could not|needs attention)/i.test(text);
  const important=opts.persistent===true||error||/(conflict|warning)/i.test(text);
  if(important&&dismissedNotifications.has(key))return null;
  const existing=activeNotifications.get(key);if(existing?.isConnected)return existing;
  const div=document.createElement('div');
  div.className='toast mlv197-toast'+(important?' mlv197-toast-important':'')+(error?' mlv197-toast-error':'');
  div.dataset.notificationKey=key;
  div.innerHTML='<button class="mlv197-toast-close" type="button" aria-label="Dismiss">×</button><b>'+esc(title)+'</b><span>'+esc(msg)+'</span>';
  activeNotifications.set(key,div);
  const remove=(dismiss=false)=>{if(dismiss&&important)dismissedNotifications.add(key);if(activeNotifications.get(key)===div)activeNotifications.delete(key);div.remove()};
  div.querySelector('.mlv197-toast-close').addEventListener('click',()=>remove(true));
  wrap.appendChild(div);
  if(!important)setTimeout(()=>{if(!div.isConnected)return;div.style.opacity='0';div.style.transform='translateY(10px)';setTimeout(()=>remove(false),300)},4200);
  return div;
}
window.toast=function(title,msg='',kind=''){return notification(title,msg,{kind})};'''
    if 'const activeNotifications=new Map();' not in text:
        text, notif_count = re.subn(notification_pattern, lambda _m: notification_core, text, count=1, flags=re.S)
        if notif_count != 1:
            raise SystemExit(f'notification core replacement: expected 1 match, found {notif_count}')

    # Final invariants: the generated file itself owns the behavior.
    required = (
        'assets/michels_life_mark.svg',
        'v30171-brand-legal',
        "panes.about.insertAdjacentHTML('beforeend',aboutPane())",
        'data-mlv-about-core',
        'data-mlv-developer',
        'assets/michel_duarte_avatar.jpg',
        profile['copyright'],
        'const activeNotifications=new Map();',
        'dismissedNotifications.add(key)',
    )
    for value in required:
        if value not in text:
            raise SystemExit(f'Generated frontend missing required core value: {value}')
    for forbidden in ('mlv-v30202-ui-hotfix-script', 'id="mlv-developer-branding"'):
        if forbidden in text:
            raise SystemExit(f'Obsolete runtime repair remains in frontend: {forbidden}')

    path.write_text(text, encoding='utf-8')
    print('Built v3.0.202 core frontend: About, branding, legal and notification behavior are in the source.')


if __name__ == '__main__':
    main()