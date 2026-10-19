#!/usr/bin/env python3
"""Installed Android 16 Developer Twin live WebView probe (redacted evidence)."""
from __future__ import annotations
import argparse
import json
import time
from pathlib import Path
from urllib.request import urlopen

from websocket import create_connection

PAGE = r"""(()=>{
  const twin=window.MichelsLabDeveloperTwin;
  const host=document.getElementById('ml-dev-twin-host');
  const shadow=host?.shadowRoot;
  const panel=shadow?.getElementById('mlpanel');
  const trigger=shadow?.getElementById('mltrigger');
  const stats=twin?.report?.();
  return {developerRuntime:!!twin,host:!!host,shadow:!!shadow,hasPanel:!!panel,
    trigger:trigger?.textContent||null,nativeSaveBridge:typeof window.MichelsLabDeveloperNative?.saveReport==='function',
    liveApp:!!document.querySelector('#main')||!!document.querySelector('#mlv200Onboarding'),
    notesCount:stats?.ownerAnnotations?.length??-1,
    aiPrompt:typeof twin?.prompt==='function',canAudit:typeof twin?.audit==='function',
    canonicalAndroid:!!window.MichelsLifeAndroid,identityPlatform:stats?.identity?.platform||'unknown'};
})()"""
EXPORT = "window.MichelsLabDeveloperNative.saveReport('michels-life-developer-install-probe.txt','installed Developer Twin native document picker QA')"

def evaluate(port: int, expression: str):
    with urlopen(f"http://127.0.0.1:{port}/json/list",timeout=10) as response:
        pages=json.load(response)
    pages=[p for p in pages if p.get('type')=='page' and
           p.get('url','').startswith('https://appassets.androidplatform.net/assets/app/index.html')]
    if len(pages)!=1:
        raise RuntimeError('Expected one real installed Developer WebView, found '+str(len(pages)))
    ws=create_connection(pages[0]['webSocketDebuggerUrl'],timeout=15,suppress_origin=True)
    try:
        ws.send(json.dumps({'id':1,'method':'Runtime.evaluate','params':{
            'expression':expression,'returnByValue':True}}))
        until=time.monotonic()+15
        while time.monotonic()<until:
            response=json.loads(ws.recv())
            if response.get('id')!=1:continue
            if response.get('error') or response.get('result',{}).get('exceptionDetails'):
                raise RuntimeError('Developer CDP expression failed in installed WebView')
            return response.get('result',{}).get('result',{}).get('value')
        raise RuntimeError('Developer CDP evaluation timeout')
    finally:
        ws.close()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=9224)
    parser.add_argument('--output',required=True)
    parser.add_argument('--invoke-native-export',action='store_true')
    args=parser.parse_args()
    last=None
    for _ in range(18):
        try:
            result=evaluate(args.port,PAGE)
            if not isinstance(result,dict) or not all(result.get(k) for k in
               ('developerRuntime','host','shadow','hasPanel','nativeSaveBridge',
                'liveApp','aiPrompt','canAudit','canonicalAndroid')):
                raise RuntimeError('Developer UI/native export/core app not ready')
            if result.get('identityPlatform')!='android' or result.get('trigger')!='DEV':
                raise RuntimeError('Actual installed Developer badge and Android identity not visible')
            Path(args.output).parent.mkdir(parents=True,exist_ok=True)
            Path(args.output).write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
            if args.invoke_native_export:
                evaluate(args.port,EXPORT)
            print('PASS: isolated Developer WebView, real app engine, audit/annotation UI and native export bridge installed')
            return
        except (RuntimeError,OSError,ValueError) as e:
            last=str(e);time.sleep(2)
    raise SystemExit('FAIL: installed Developer Twin not functional: '+str(last))

if __name__=='__main__':main()
