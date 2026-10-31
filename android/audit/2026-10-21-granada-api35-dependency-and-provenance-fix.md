# Michel's Life — GRANADA Android 15 actual APK proof continuation (2026-10-21)

## Proven blocker and safe correction

Open [PR #166](https://github.com/michels-lab/michel-s-life/pull/166), alternate Android 15/API35 native persistence. Prior same-run [API35 workflow 39642953576](https://github.com/michels-lab/michel-s-life/actions/runs/39642953576) **FAILED** after emulator boot and first native screenshot: `ModuleNotFoundError: No module named 'websocket'` in the existing native WebView CDP probe. No reliable native same-APK/relaunch state proof was produced; the native result remained **red**. This Python module is a CI runner dependency, not an Android application library.

New workflow installs **pinned `websocket-client==1.8.0` before installing the real APK**, asserts `create_connection` is importable, and continues to require actual native screenshot, app PID, onboarding and two force-stop/relaunch evidence sequences. The source and app versions remain unchanged. An APK build or offline probe `self-test` is not a passing native installed APK gate.

## Provenance hardening

`tools/granada_android15_native_result.py` now rejects synthetic or mismatched native evidence unless:
1. `current-source-commit.txt` exactly matches the tested 40-hex-character Git commit;
2. `current-source-apk.sha256` matches both the actual produced APK byte digest and canonical output filename;
3. installed `dumpsys package` identifies `com.michelslab.michelslife` and the expected app version;
4. all original PNG CRC/size checks, actual process IDs, two native reload sequences, and three consistent canonical mission/contract comparisons pass.

The fixture regression suite now also rejects wrong package identity, wrong/missing source or artifact provenance, modified APK bytes, and hash records referring to a foreign file. No test shortcuts were added, and no user state, accounts, native app source, Developer Twin, release signing or paused Windows pipeline was changed.

## Validation and reentry

- Before the final audit-file commit, exact workflow on PR #166 tested the new code: [run 39676760696](https://github.com/michels-lab/michel-s-life/actions/runs/39676760696) **offline contract success**; live native job was still running when first observed. All later steps must be rechecked against the **latest PR HEAD**, not these earlier runs.
- Android UI smoke may separately expose the known Story/Focus obstruction or transient syntax error (#168/#171); never equate Android UI green with installed native durability.
- API35 native proof does **not** certify Android16 hosted reliability (#139), installed signed Direct/Galaxy mission persistence (#104), cross-account/provider boundary (#108/#55), or the Developer Twin integration (#134).
- Keep PR #166 as a separate integration gate until its exact-head native evidence is independently green. **No release candidate, beta or public release**. Android remains prioritized and Windows native packaging remains paused.


## Granada 2026-10-30 — controlled lower-resource graphics experiment (API35)

The prior exact-head [run 39677022880](https://github.com/michels-lab/michel-s-life/actions/runs/39677022880) had a successful offline evidence contract, compiled the actual debug APK, booted Android 15, and reached the **first native screenshot**, but obtained a very small (~19.6 KB) incomplete/blank-looking PNG and then lost emulator-5554/QEMU before obtaining the mandatory real pixels. Thus no onboarding/XP/persistence claim was established. The log does **not** establish whether QEMU died of host OOM, renderer instability, or other causes.

The new isolated candidate **changes only emulator hardware/graphics settings** in this PR's own API35 workflow, to test the host-resource hypothesis:

| Parameter | Prior failure | New experiment |
|---|---|---|
| Android OS/system image | API35 google_apis x86_64 | **Unchanged** |
| Device | pixel_6 | pixel_2 |
| Guest RAM | 3072 MiB | 2048 MiB |
| Heap | 512 MiB | 256 MiB |
| GPU | swiftshader | software |
| Snapshot / Vulkan / ADB / KVM | disabled snapshot, Vulkan disabled, real ADB/KVM | **Unchanged** |
| APK source, package, version, build command, native touch capture and 3 XP/mission comparisons | original production script | **Unchanged** |

Commit `e5c95ba6a8084d4f7a01b18866ce5f4ffd9cb3b9`. [Live API35 workflow 41159038337](https://github.com/michels-lab/michel-s-life/actions/runs/41159038337) is the new exact-commit test; it must pass both source/offline and the **actual installed APK + 2 native relaunches + strict real PNG/XP state** to count as API35 acceptance. If it fails, retain the exact stage/output and keep red. Even if green, Android16/Galaxy and signed Direct distribution remain independent gates. No release, no main merge or Windows packaging.
