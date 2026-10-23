#!/usr/bin/env python3
"""GRANADA real Android DEBUG WebView: synthetic mission + XP and two cold process relaunches.

This never connects to Supabase, Google or a real user account. Run only on a
fresh, isolated Android test emulator; protected signed APKs must NOT expose CDP.
Outputs digests/counters, never mission names, storage payloads or credentials.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import struct
import zlib
import time
from pathlib import Path
from urllib.request import urlopen

def png_info(path):
    """Inspect complete native screenshot, never an empty/forged PNG signature."""
    data=Path(path).read_bytes()
    if len(data)<100 or len(data)>8_000_000 or not data.startswith(bytes.fromhex("89504e470d0a1a0a")):
        raise ValueError("invalid_native_png")
    n=8
    dimensions=None
    finished=False
    while n+12<=len(data):
        size=struct.unpack_from(">I",data,n)[0]
        if size>8_000_000 or n+size+12>len(data):
            raise ValueError("truncated_native_png")
        kind=data[n+4:n+8]
        body=data[n+8:n+8+size]
        crc=struct.unpack_from(">I",data,n+8+size)[0]
        if zlib.crc32(kind+body)&0xffffffff!=crc:
            raise ValueError("native_png_crc_mismatch")
        if kind==b"IHDR":
            if dimensions is not None or len(body)!=13:
                raise ValueError("invalid_native_png_header")
            dimensions=struct.unpack_from(">II",body)
            if not (240<=dimensions[0]<=4096 and 400<=dimensions[1]<=4096):
                raise ValueError("invalid_native_resolution")
        n+=size+12
        if kind==b"IEND":
            if size!=0 or n!=len(data):
                raise ValueError("incomplete_native_png")
            finished=True
            break
    if not finished or dimensions is None:
        raise ValueError("incomplete_native_png")
    return {"width":dimensions[0],"height":dimensions[1],
            "sha256":hashlib.sha256(data).hexdigest()}

PKG = "com.michelslab.michelslife"
KEY = "vida_rpg_personal_progress_v2"
ID = "granada-native-xp-relaunch-qa"
REWARD = 50

# This expression runs within the ACTUAL installed app's WebView, never a
# Playwright/browser fake. It mutates ONLY a test-only mission in a fresh AVD.
# The canonical completeMission() logic, not test math, must issue real XP.
SEED = r"""(() => {
  const key='vida_rpg_personal_progress_v2';
  const id='granada-native-xp-relaunch-qa';
  const live=typeof state!=='undefined'?state:window.state;
  if(!live || !Array.isArray(live.missions) || typeof window.save!=='function' ||
      typeof window.completeMission!=='function')
    return {ready:false,reason:'canonical_runtime_unavailable'};
  if(localStorage.getItem('michelsLife.supabase.session.v30216') ||
      localStorage.getItem('michelsLife.supabase.localAccount.v30218'))
    return {ready:false,reason:'account_present'};
  if(live.missions.some(m=>m.id===id))
    return {ready:false,reason:'already_seeded'};
  const before=Number(live.xp||0);
  if(!Number.isFinite(before)||before<0) return {ready:false,reason:'invalid_base_xp'};
  live.missions.push({
    id,name:'Synthetic GRANADA native QA',canonical:'synthetic granada native qa',
    description:'Device-only synthetic QA',type:'daily',category:'academic',
    priority:'medium',difficulty:'medium',xp:50,coins:0,
    days:[0,1,2,3,4,5,6],archived:false,hidden:false,
    createdAt:'2026-10-20T00:00:00.000Z',completions:[]
  });
  window.save();
  window.completeMission(id);
  const first=JSON.parse(localStorage.getItem(key)||'null');
  if(!first) return {ready:false,reason:'persist_failed'};
  const afterFirst=Number(first.xp);
  const countFirst=first.missions.find(m=>m.id===id)?.completions?.length;
  window.completeMission(id);
  const second=JSON.parse(localStorage.getItem(key)||'null');
  if(!second) return {ready:false,reason:'persist_failed'};
  if(afterFirst!==before+50||Number(second.xp)!==afterFirst ||
      countFirst!==1||second.missions.find(m=>m.id===id)?.completions?.length!==1)
    return {ready:false,reason:'exact_once_xp_failed'};
  return {ready:true,baseXp:before};
})()"""

CAPTURE = r"""(() => {
  const key='vida_rpg_personal_progress_v2';
  const id='granada-native-xp-relaunch-qa';
  const live=typeof state!=='undefined'?state:window.state;
  let saved;
  try { saved=JSON.parse(localStorage.getItem(key)||'null'); }
  catch { return {ready:false,reason:'invalid_board_json'}; }
  if(!saved||!live||!Array.isArray(saved.missions)||!Array.isArray(live.missions))
    return {ready:false,reason:'board_not_ready'};
  if(localStorage.getItem('michelsLife.supabase.session.v30216') ||
     localStorage.getItem('michelsLife.supabase.localAccount.v30218'))
    return {ready:false,reason:'account_present'};
  const a=saved.missions.find(m=>m.id===id);
  const b=live.missions.find(m=>m.id===id);
  if(!a||!b||!Array.isArray(a.completions)||!Array.isArray(b.completions))
    return {ready:false,reason:'mission_not_found'};
  const ids=src=>src.missions.map(m=>String(m.id||'')).sort();
  const completions=a.completions.map(c=>({
    id:String(c.id||''),xp:Number(c.xp)}));
  const liveCompletions=b.completions.map(c=>({
    id:String(c.id||''),xp:Number(c.xp)}));
  if(completions.length!==1||liveCompletions.length!==1||
     !completions[0].id||completions[0].xp!==50||
     JSON.stringify(completions)!==JSON.stringify(liveCompletions)||
     Number(saved.xp)!==Number(live.xp) ||
     JSON.stringify(ids(saved))!==JSON.stringify(ids(live)))
    return {ready:false,reason:'live_saved_ledger_drift'};
  return {ready:true,xp:Number(saved.xp),ids:ids(saved),
    completions,goals:(saved.goals||[]).map(g=>String(g.id||'')).sort(),
    missionCount:saved.missions.length};
})()"""

def sha(obj):
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()).hexdigest()

def compact(raw):
    if not isinstance(raw, dict) or raw.get("ready") is not True:
        raise ValueError("native_runtime_unready")
    ids=raw.get("ids")
    comps=raw.get("completions")
    goals=raw.get("goals")
    xp=raw.get("xp")
    if (not isinstance(ids,list) or ID not in ids or len(ids)!=len(set(ids)) or
        not all(isinstance(x,str) and 0<len(x)<=128 for x in ids) or
        not isinstance(goals,list) or not all(isinstance(x,str) for x in goals) or
        not isinstance(comps,list) or len(comps)!=1 or
        not isinstance(comps[0],dict) or
        not isinstance(comps[0].get("id"),str) or not comps[0]["id"] or
        comps[0].get("xp")!=REWARD or
        not isinstance(xp,(int,float)) or isinstance(xp,bool) or
        not (0 <= xp <= 10_000_000) or
        raw.get("missionCount")!=len(ids)):
        raise ValueError("synthetic_native_ledger_invalid")
    return {"schema":"mlv.granada.native.xp.relaunch.v1",
            "missionCount":len(ids),"missionIdsSha256":sha(ids),
            "goalsSha256":sha(goals),"completionSha256":sha(comps),
            "syntheticCompletionCount":1,"syntheticRewardXp":REWARD,
            "xp":xp,"providerUsed":False,"physicalDeviceVerified":False}

def compare(a,b,c):
    required={"missionCount","missionIdsSha256","goalsSha256",
              "completionSha256","syntheticCompletionCount","syntheticRewardXp","xp"}
    for record in (a,b,c):
        if not isinstance(record,dict) or record.get("schema")!="mlv.granada.native.xp.relaunch.v1":
            raise ValueError("wrong_native_snapshot_schema")
        if record.get("physicalDeviceVerified") is not False or record.get("providerUsed") is not False:
            raise ValueError("unsupported_native_scope_claim")
        if any(key not in record for key in required):
            raise ValueError("missing_native_ledger_evidence")
    if any(b[k]!=a[k] or c[k]!=a[k] for k in required):
        raise ValueError("xp_or_mission_changed_across_real_relaunches")
    return {"pass":True,"realAndroidWebView":True,"forcedRelaunches":2,
            "missionAndXpIdentical":True,"xp":a["xp"],
            "missionCount":a["missionCount"],
            "providerUsed":False,"signedDeviceVerified":False,
            "scope":"same debuggable APK / real emulator only"}

def evaluate(port,expr):
    from websocket import create_connection
    with urlopen(f"http://127.0.0.1:{port}/json/list",timeout=9) as resp:
        targets=json.load(resp)
    pages=[p for p in targets if p.get("type")=="page" and
        str(p.get("url","")).startswith("https://appassets.androidplatform.net/assets/app/index.html")]
    if len(pages)!=1: raise RuntimeError("native_webview_target_unavailable")
    url=pages[0].get("webSocketDebuggerUrl")
    if not url: raise RuntimeError("native_debug_endpoint_unavailable")
    ws=create_connection(url,timeout=18,suppress_origin=True)
    try:
        ws.send(json.dumps({"id":7,"method":"Runtime.evaluate",
            "params":{"expression":expr,"returnByValue":True}}))
        for _ in range(30):
            msg=json.loads(ws.recv())
            if msg.get("id")!=7: continue
            if msg.get("error") or msg.get("result",{}).get("exceptionDetails"):
                raise RuntimeError("native_webview_evaluation_failed")
            return msg.get("result",{}).get("result",{}).get("value")
        raise RuntimeError("native_webview_reply_unavailable")
    finally:
        ws.close()

def poll(port,expr):
    for _ in range(12):
        try:
            item=evaluate(port,expr)
            if isinstance(item,dict) and item.get("ready") is True:
                return item
            if isinstance(item,dict) and item.get("reason") in (
                "account_present","already_seeded","exact_once_xp_failed",
                "invalid_base_xp","live_saved_ledger_drift"):
                raise ValueError("native_synthetic_state_invalid")
        except (OSError, RuntimeError, TimeoutError):
            pass
        time.sleep(2)
    raise RuntimeError("native_webview_not_ready")

def write(path,record):
    p=Path(path);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(record,sort_keys=True,indent=2)+"\n",encoding="utf-8")

def main():
    p=argparse.ArgumentParser()
    p.add_argument("action",choices=("seed","capture","compare","self-test"))
    p.add_argument("--port",type=int,default=9222)
    p.add_argument("--output")
    p.add_argument("--before")
    p.add_argument("--first")
    p.add_argument("--second")
    args=p.parse_args()
    if args.action=="self-test":
        item={"ready":True,"xp":317,"missionCount":1,"ids":[ID],
              "completions":[{"id":"synthetic-fixed-completion","xp":REWARD}],
              "goals":[]}
        snap=compact(item); result=compare(snap,snap,snap)
        assert result["pass"] and result["forcedRelaunches"]==2
        try: compact({**item,"xp":-1})
        except ValueError: pass
        else: raise AssertionError("negative XP accepted")
        print("GRANADA_NATIVE_XP_SELF_TEST_PASS")
        return
    if args.action=="compare":
        if not all((args.before,args.first,args.second,args.output)):
            p.error("compare requires --before, --first, --second, --output")
        snaps=[json.loads(Path(x).read_text()) for x in (args.before,args.first,args.second)]
        result=compare(*snaps)
        write(args.output,result)
        print("GRANADA_NATIVE_XP_TWO_RELAUNCH_PASS")
        return
    if not args.output: p.error("seed/capture require --output")
    if args.action=="seed":
        state=poll(args.port,SEED)
        if not isinstance(state.get("baseXp"),(int,float)):
            raise ValueError("invalid_native_base_xp")
    else:
        state=None
    item=poll(args.port,CAPTURE)
    result=compact(item)
    if state is not None and result["xp"]!=state["baseXp"]+REWARD:
        raise ValueError("canonical_native_reward_mismatch")
    write(args.output,result)
    print("GRANADA_NATIVE_XP_"+args.action.upper()+"_PASS no raw mission/provider data")

if __name__=="__main__":
    main()
