#!/usr/bin/env python3
"""Drive actual installed debuggable WebView onboarding using real ADB touches.

Read-only CDP is used ONLY to locate/verify the current native WebView step.
Every transition is performed by adb shell input tap on the real emulator.
Fail closed if a visual overlay intercepts the button, or the step does not
advance. Never store user names, mission text, journal data or storage values.
Signed Direct APKs never enable WebView DevTools; use the legacy native path.
"""
import argparse
import json
import re
import subprocess
import time
from pathlib import Path
from native_webview_state_probe import read_webview

PKG = "com.michelslab.michelslife"

STEP_JS = r"""(() => {
  const root=document.getElementById('mlv200Onboarding');
  if(!root)return {step:localStorage.getItem('michelsLife.onboarding.v30200')==='done'?'done':'missing'};
  const visible=el=>{
    if(!el||!el.getClientRects().length)return false;
    const style=getComputedStyle(el);
    return style.display!=='none'&&style.visibility!=='hidden';
  };
  const finish=root.querySelector('[data-mlv200-onboard="finish"]');
  const next=root.querySelector('[data-mlv200-onboard="next"]');
  const onFocus=root.querySelector('.mlv200-focus input[type="checkbox"]');
  const step=visible(finish)?3:visible(onFocus)?2:1;
  const target=step===3?finish:next;
  if(!visible(target))return {step,reason:'native continue or finish button not visible'};
  const b=target.getBoundingClientRect();
  const action=step===3?'finish':'next';
  const points=[0.20,0.83,0.50].map(position=>{
    const x=b.left+b.width*position,y=b.top+b.height*0.5;
    const hit=document.elementFromPoint(x,y);
    return {x,y,topmost:!!hit&&hit.closest('[data-mlv200-onboard="'+action+'"]')===target};
  });
  return {step,action,enabled:!target.disabled,
    viewport:{width:innerWidth,height:innerHeight},
    button:{width:b.width,height:b.height},points};
})()"""

def adb(*args, timeout=20):
    return subprocess.run(["adb", *map(str, args)], check=True, text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                          timeout=timeout).stdout.strip()


def attach(port):
    pid = adb("shell", "pidof", PKG)
    if not re.fullmatch(r"[0-9]+", pid):
        raise RuntimeError("Cannot identify exactly one installed Michel's Life process")
    adb("forward", f"tcp:{port}", f"localabstract:webview_devtools_remote_{pid}")


def screen_size():
    raw=adb("shell","wm","size")
    m=re.search(r"Physical size:\s*([0-9]+)x([0-9]+)",raw)
    if not m:
        raise RuntimeError("Cannot resolve actual native device geometry")
    return int(m.group(1)),int(m.group(2))


def safe_stage(port):
    result=read_webview(port,STEP_JS)
    if not isinstance(result,dict):
        raise RuntimeError("Native WebView onboarding DOM did not return a stage")
    step=result.get("step")
    if step not in (1,2,3,"done","missing"):
        raise RuntimeError("Native WebView returned an invalid onboarding step")
    return result


def touch_stage(port, expected, output):
    attach(port)
    size=screen_size()
    actual=safe_stage(port)
    if actual["step"]!=expected:
        raise RuntimeError(f"Expected native onboarding step {expected}; actual={actual['step']}")
    if not actual.get("enabled"):
        raise RuntimeError(f"Native onboarding step {expected} has a disabled action")
    viewport=actual.get("viewport",{})
    vw,vh=viewport.get("width"),viewport.get("height")
    if not all(isinstance(x,(int,float)) and 200<=x<=2600 for x in (vw,vh)):
        raise RuntimeError("Invalid real WebView viewport; cannot derive native tap coordinates")
    goal=expected+1 if expected<3 else "done"
    attempts=[]
    for point in actual.get("points",[]):
        if not point.get("topmost"):
            continue
        x=round(float(point["x"])*size[0]/vw)
        y=round(float(point["y"])*size[1]/vh)
        if not (0<x<size[0] and 0<y<size[1]):
            continue
        adb("shell","input","tap",x,y)
        time.sleep(0.7)
        current=None
        for _ in range(14):
            current=safe_stage(port)
            if current["step"]==goal:
                Path(output).write_text(json.dumps({
                    "native":True,"completed":True,"before":expected,
                    "after":goal,"action":actual["action"],
                    "devicePixels":{"width":size[0],"height":size[1]},
                    "touch":{"x":x,"y":y},"attempts":attempts+[{"x":x,"y":y,"after":goal}]
                },indent=2)+"\n",encoding="utf-8")
                print(f"PASS: actual ADB touch moved installed WebView {expected} -> {goal} at {x},{y}")
                return
            if current["step"]!=expected:
                raise RuntimeError(f"Native onboarding changed unexpectedly to {current['step']}")
            time.sleep(0.55)
        attempts.append({"x":x,"y":y,"after":current["step"] if current else "unavailable"})
    Path(output).write_text(json.dumps({
        "native":True,"completed":False,"before":expected,
        "after":actual["step"],"attempts":attempts
    },indent=2)+"\n",encoding="utf-8")
    raise RuntimeError(f"Native onboarding step {expected} did not advance after {len(attempts)} verified real taps")


def self_test():
    # Conversion is proportional to the REAL WebView viewport, never a
    # fixed Pixel6 screenshot percentage; no external emulator is needed here.
    for css_w,css_h,device_w,device_h in ((360,800,1080,2400),(393,873,1179,2619)):
        x,y=round(300*device_w/css_w),round(670*device_h/css_h)
        assert 0<x<device_w and 0<y<device_h
    assert "data-mlv200-onboard" in STEP_JS
    assert "elementFromPoint" in STEP_JS
    assert "michelsLife.onboarding.v30200" in STEP_JS
    print("PASS: native onboarding step probe uses actual DOM + real ADB input, no fixture taps")


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--step",type=int,choices=[1,2,3])
    parser.add_argument("--port",type=int,default=9222)
    parser.add_argument("--output")
    parser.add_argument("--self-test",action="store_true")
    args=parser.parse_args()
    if args.self_test:
        self_test()
    else:
        if args.step is None or not args.output:
            parser.error("Native onboarding touch requires --step and --output")
        touch_stage(args.port,args.step,args.output)
