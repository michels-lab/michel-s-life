#!/usr/bin/env python3
from pathlib import Path
import hashlib

ROOT=Path(__file__).resolve().parents[1]

def text(path):
    return path.read_text(encoding='utf-8',errors='replace')

def git_blob_sha(path):
    data=path.read_bytes()
    return hashlib.sha1(f"blob {len(data)}\0".encode()+data).hexdigest()

required={
    'product app icon':ROOT/'branding/michels_life_app_icon.svg',
    'product mark':ROOT/'branding/michels_life_mark.svg',
    'product lockup':ROOT/'branding/michels_life_lockup.svg',
    'canonical portrait':ROOT/'branding/michel_duarte_avatar.jpg',
    "Michel's Lab mark":ROOT/'branding/michels_lab_mark.png',
    "Michel's Lab lockup":ROOT/'branding/michels_lab_lockup.png',
}
for label,path in required.items():
    assert path.exists() and path.stat().st_size>100, f"missing {label}: {path}"

expected_git_blobs={
    ROOT/'branding/michels_life_app_icon.svg':'169c62ccb7dfc7fc25532925932cde0818d7fe13',
    ROOT/'branding/michels_life_mark.svg':'420a506ecffcebd3fc1cf6dbb8875168c039abfd',
    ROOT/'branding/michels_life_lockup.svg':'edfa6026bfabbbe852d3cad8aa385de53b65775b',
    ROOT/'branding/michel_duarte_avatar.jpg':'be4d18572bec28d53783cd4db05cb6cd289a7916',
    ROOT/'branding/michels_lab_mark.png':'f205c15c3b6bd7fe676ced83fd1ea2ae24c25586',
    ROOT/'branding/michels_lab_lockup.png':'7819ef5c7d1a5c338c67c9bbd517e5448724a5cf',
}
for path,expected in expected_git_blobs.items():
    actual=git_blob_sha(path)
    assert actual==expected, f"canonical brand asset drift: {path} {actual} != {expected}"

frontend=text(ROOT/'src/MichelsLife/frontend/index.html')
for marker in (
    'assets/michels_life_app_icon.svg',
    'assets/michels_life_mark.svg',
    'assets/michels_life_lockup.svg',
    'assets/michels_lab_lockup.png',
    'data-mlv-product-brand="canonical"',
    'data-mlv-author-brand="canonical"',
    'About the author',
    'mlvdev-social-icon',
    "window.__MICHELS_LIFE_BUILD__||'3.0.216'",
):
    assert marker in frontend, f"frontend missing canonical identity marker: {marker}"
assert 'assets/michels_life_logo.webp' not in frontend, 'legacy product logo is still active in frontend'

manifest=text(ROOT/'android/app/src/main/AndroidManifest.xml')
assert 'android:icon="@mipmap/ic_launcher"' in manifest
assert 'android:roundIcon="@mipmap/ic_launcher_round"' in manifest
assert '@drawable/michels_life_logo' not in manifest
v31=text(ROOT/'android/app/src/main/res/values-v31/styles.xml')
assert 'android:windowSplashScreenAnimatedIcon' in v31
assert '@drawable/ic_launcher_foreground' in v31
adaptive=text(ROOT/'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml')
assert '@drawable/ic_launcher_foreground' in adaptive

workflow_paths=[
    ROOT/'.github/workflows/android-build.yml',
    ROOT/'.github/workflows/android-ui-smoke.yml',
    ROOT/'.github/workflows/build-store-msix.yml',
    ROOT/'.github/workflows/build-test-windows.yml',
    ROOT/'.github/workflows/ci.yml',
    ROOT/'.github/workflows/release-windows.yml',
    ROOT/'.github/workflows/ui-smoke.yml',
]
workflow='\n'.join(text(p) for p in workflow_paths)
assert 'branding/michels_life_logo.webp' not in workflow, 'legacy logo remains active in workflow'
for marker in (
    'branding/michels_life_app_icon.svg',
    'assets/michels_life_mark.svg',
    'assets/michels_life_lockup.svg',
    'assets/michels_lab_lockup.png',
):
    assert marker in workflow, f"workflow missing canonical identity asset: {marker}"

print("OK: canonical Michel's Life product identity + About + Windows/Android branding contract")
