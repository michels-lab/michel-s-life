#!/usr/bin/env python3
"""Build the Michel's Life v3.0.202 frontend by editing the core UI source once.

This replaces the old runtime-overlay approach for About, developer branding,
sidebar branding and notification dismissal. The generated index contains the
final behavior directly in renderNav(), aboutPane(), buildSettings() and
notification().
"""
from __future__ import annotations
import argparse
import json
import re
from pathlib import Path

LEGAL = "© 2026 Michel Duarte / Michel’s Lab. All rights reserved."

ROOT_STYLE = r'''<style id="mlv-v30202-core-branding-style">
#v30171Sidebar .v30171-brand-mark{width:72px!important;height:72px!important;border-radius:22px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important}
#v30171Sidebar .v30171-brand-mark img{width:72px!important;height:72px!important;display:block!important;object-fit:contain!important;filter:drop-shadow(0 8px 18px rgba(0,0,0,.28))}
#v30171Sidebar .v30171-brand-copy{min-width:0}
#v30171Sidebar .v30171-brand-legal{margin-top:6px;max-width:190px;color:var(--muted);font:600 7.2px/1.35 Inter,Segoe UI,Arial,sans-serif;letter-spacing:.025em;text-transform:none;opacity:.78}
.mlvdev-card{position:relative;overflow:hidden}.mlvdev-head{display:flex;align-items:center;gap:12px}.mlvdev-avatar-wrap{position:relative;flex:0 0 auto}.mlvdev-avatar{width:72px;height:72px;border-radius:18px;object-fit:cover;display:block;border:2px solid rgba(231,187,92,.58);box-shadow:0 10px 26px rgba(0,0,0,.28)}.mlvdev-title{min-width:0}.mlvdev-title h2{margin:0;font-size:16px}.mlvdev-title p{margin:3px 0 0;color:var(--muted);font-size:9.5px;line-height:1.4}.mlvdev-copy{margin-top:12px;color:var(--muted);font-size:9.5px;line-height:1.55}.mlvdev-contact{margin-top:10px;font-size:9.5px;color:var(--muted)}.mlvdev-contact a{color:inherit;text-decoration:none;border-bottom:1px dotted rgba(255,255,255,.22)}.mlvdev-socials{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:13px}.mlvdev-social{min-height:54px;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:8px 9px;text-decoration:none;color:inherit;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);transition:transform .15s ease,border-color .15s ease,background .15s ease}.mlvdev-social:hover{transform:translateY(-2px);border-color:rgba(231,187,92,.42);background:rgba(231,187,92,.07)}.mlvdev-social span{font-weight:800;font-size:10px}.mlvdev-social small{display:block;margin-top:2px;font-size:7.5px;color:var(--muted);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}.mlvdev-legal{margin-top:14px;padding-top:11px;border-top:1px solid rgba(255,255,255,.07);font-size:8.8px;line-height:1.5;color:var(--muted)}.mlvdev-copyright{display:block;margin-top:8px;color:rgba(255,255,255,.68);font-size:8.5px}@media(max-width:1000px){.mlvdev-socials{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>'''


def remove_block(html: str, element: str, marker: str) -> str:
    pat = rf'<{element}\b[^>]*id=["\']{re.escape(marker)}["\'][^>]*>.*?</{element}>'
    return re.sub(pat, '', html, flags=re.S | re.I)


def replace_once(html: str, old: str, new: str, label: str) -> str:
    n = html.count(old)
    if n != 1:
        raise SystemExit(f"{label}: expected exactly one source match, found {n}")
    return html.replace(old, new, 1)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--index', required=True)
    ap.add_argument('--profile', required=True)
    ap.add_argument('--release-overlay', required=False)
    args = ap.parse_args()
    path = Path(args.index)
    html = path.read_text(encoding='utf-8')
    profile = json.loads(Path(args.profile).read_text(encoding='utf-8'))

    # If this is still a 3.0.201 bootstrap, bring in the release-readiness feature once.
    if 'mlv-v30202-release-readiness-script' not in html:
        if '3.0.201' not in html:
            raise SystemExit('Expected a 3.0.201/3.0.202 Michel\'s Life source bundle.')
        if not args.release_overlay:
            raise SystemExit('--release-overlay is required when upgrading a 3.0.201 bundle.')
        overlay = Path(args.release_overlay).read_text(encoding='utf-8')
        old_account = "function specificAccount(v){const s=norm(v);if(s.includes('micheltheog'))return'micheltheog';if(s.includes('realmichelduarte'))return'realmichelduarte';return'';}"
        new_account = "function specificAccount(v){const raw=String(v||'');const s=norm(raw);if(!/instagram|followers|following|unfollow/.test(s))return'';const at=raw.match(/@([a-z0-9._]{2,30})/i);if(at)return at[1].toLowerCase();const paren=raw.match(/\\(([a-z0-9._]{2,30})\\)/i);if(paren)return paren[1].toLowerCase();const labeled=raw.match(/(?:account|cuenta)\\s*[:\\-]?\\s*([a-z0-9._]{2,30})/i);return labeled?labeled[1].toLowerCase():'';}"
        html = html.replace('3.0.201', '3.0.202')
        html = replace_once(html, old_account, new_account, 'legacy account matcher')
        pos = html.lower().rfind('</body>')
        if pos < 0: raise SystemExit('index.html closing </body> tag not found')
        html = html[:pos] + '\n' + overlay + '\n' + html[pos:]

    # Remove obsolete runtime fixes. Their behavior is now part of the core functions below.
    for el, marker in (
        ('style','mlv-developer-branding-style'),('script','mlv-developer-branding'),
        ('style','mlv-v30202-ui-hotfix-style'),('script','mlv-v30202-ui-hotfix-script'),
    ):
        html = remove_block(html, el, marker)

    # Core style lives in the canonical generated source, not in a runtime hotfix.
    html = remove_block(html, 'style', 'mlv-v30202-core-branding-style')
    head = html.lower().rfind('</head>')
    if head < 0: raise SystemExit('index.html closing </head> tag not found')
    html = html[:head] + '\n' + ROOT_STYLE + '\n' + html[head:]

    old_settings = " ['about','ⓘ','About','Build information and navigation notes.']"
    new_settings = " ['about','ⓘ','About','Developer, license and build information.']"
    if old_settings in html:
        html = html.replace(old_settings, new_settings, 1)

    old_sidebar = "side.innerHTML='<div class=\"brand v30171-brand\"><div class=\"brand-mark v30171-brand-mark\" aria-hidden=\"true\">M</div><div><h1 class=\"v30171-brand-title\" style=\"color:var(--ui-gold,var(--gold,#ffd166))!important\">MICHEL\\'S LIFE</h1><p class=\"v30171-brand-sub\">Personal Progress System</p></div></div><nav id=\"v30171PrimaryNav\" class=\"v30171-primary-nav\"></nav>';"
    new_sidebar = "side.innerHTML='<div class=\"brand v30171-brand\"><div class=\"brand-mark v30171-brand-mark\" aria-hidden=\"true\"><img src=\"assets/michels_life_mark.svg\" alt=\"\"></div><div class=\"v30171-brand-copy\"><h1 class=\"v30171-brand-title\" style=\"color:var(--ui-gold,var(--gold,#ffd166))!important\">MICHEL\\'S LIFE</h1><p class=\"v30171-brand-sub\">Personal Progress System</p><div class=\"v30171-brand-legal\">© 2026 Michel Duarte / Michel’s Lab.<br>All rights reserved.</div></div></div><nav id=\"v30171PrimaryNav\" class=\"v30171-primary-nav\"></nav>';"
    if old_sidebar in html:
        html = html.replace(old_sidebar, new_sidebar, 1)
    elif 'assets/michels_life_mark.svg' not in html:
        raise SystemExit('Core sidebar creation source was not found.')

    old_sync = "const brand=side.querySeled�PЀL@