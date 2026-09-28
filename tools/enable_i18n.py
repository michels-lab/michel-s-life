#!/usr/bin/env python3
from pathlib import Path
import argparse
import re

LOADER_MARKER = '<script src="i18n.js" data-mlv-i18n="v1"></script>'
GUARD_ATTR = 'data-mlv-language-guard="v1"'
GUARD_SCRIPT = r'''<script data-mlv-language-guard="v1">
(function(){
  if(window.__MLV_LANGUAGE_GUARD__)return;
  window.__MLV_LANGUAGE_GUARD__=true;

  function applyChoice(target){
    var value=target&&target.getAttribute&&target.getAttribute('data-mlv-language-choice');
    if(value!=='en'&&value!=='es')return;
    var apply=function(){
      if(window.MichelsLifeI18n&&window.MichelsLifeI18n.setLanguage){
        window.MichelsLifeI18n.setLanguage(value,{userInitiated:true});
      }else{
        setTimeout(apply,25);
      }
    };
    apply();
  }

  // Run before Settings/app-wide capture listeners so a language button cannot
  // be rerendered away before its own handler executes.
  window.addEventListener('pointerdown',function(event){
    var target=event.target&&event.target.closest
      ? event.target.closest('[data-mlv-language-choice]')
      : null;
    if(!target)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    applyChoice(target);
  },true);

  // Keyboard activation gets the same early protection.
  window.addEventListener('keydown',function(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    var target=event.target&&event.target.closest
      ? event.target.closest('[data-mlv-language-choice]')
      : null;
    if(!target)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    applyChoice(target);
  },true);
})();
</script>'''

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--index', required=True)
    args = ap.parse_args()

    path = Path(args.index)
    text = path.read_text(encoding='utf-8')
    changed = False

    if GUARD_ATTR not in text:
        match = re.search(r'<head\b[^>]*>', text, flags=re.I)
        if not match:
            raise SystemExit('index.html has no <head> marker for early language guard')
        pos = match.end()
        text = text[:pos] + '\n' + GUARD_SCRIPT + text[pos:]
        changed = True

    if LOADER_MARKER not in text:
        if '</body>' not in text:
            raise SystemExit('index.html has no </body> marker')
        text = text.replace('</body>', LOADER_MARKER + '\n</body>', 1)
        changed = True

    if changed:
        path.write_text(text, encoding='utf-8', newline='\n')
        print('ensured early language guard + i18n loader')
    else:
        print('early language guard + i18n loader already present')

if __name__ == '__main__':
    main()
