#!/usr/bin/env python3
"""Insert or replace one file inside AppBundle.zip."""
from __future__ import annotations
import argparse, os, tempfile, zipfile
from pathlib import Path

def main() -> None:
    ap=argparse.ArgumentParser()
    ap.add_argument("--bundle",required=True)
    ap.add_argument("--source",required=True)
    ap.add_argument("--arcname",required=True)
    args=ap.parse_args()
    bundle=Path(args.bundle)
    source=Path(args.source)
    if not bundle.exists(): raise SystemExit(f"Bundle not found: {bundle}")
    if not source.exists(): raise SystemExit(f"Source asset not found: {source}")
    fd,tmpname=tempfile.mkstemp(prefix=bundle.stem+"_",suffix=".zip",dir=bundle.parent)
    os.close(fd)
    tmp=Path(tmpname)
    try:
        with zipfile.ZipFile(bundle,"r") as zin, zipfile.ZipFile(tmp,"w") as zout:
            for item in zin.infolist():
                if item.filename==args.arcname: continue
                zout.writestr(item,zin.read(item.filename))
            zout.write(source,args.arcname)
        with zipfile.ZipFile(tmp,"r") as z:
            bad=z.testzip()
            if bad: raise SystemExit(f"Bundle integrity failed at {bad}")
            if args.arcname not in z.namelist(): raise SystemExit("Inserted asset missing from rebuilt bundle")
        tmp.replace(bundle)
        print(f"Inserted {args.arcname} into {bundle}")
    finally:
        if tmp.exists(): tmp.unlink()

if __name__=="__main__":
    main()
