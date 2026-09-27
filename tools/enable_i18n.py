#!/usr/bin/env python3
from pathlib import Path
import argparse

MARKER = '<script src="i18n.js" data-mlv-i18n="v1"></script>'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--index', required=True)
    args = ap.parse_args()

    path = Path(args.index)
    text = path.read_text(encoding='utf-8')
    if MARKER in text:
        print('i18n loader already present')
        return
    if '</body>' not in text:
        raise SystemExit('index.html has no </body> marker')
    text = text.replace('</body>', MARKER + '\n</body>', 1)
    path.write_text(text, encoding='utf-8')
    print('injected i18n loader')

if __name__ == '__main__':
    main()
