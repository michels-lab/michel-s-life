#!/usr/bin/env node
/*
 * Michel's Life native-Windows rendered UI gate.
 *
 * Starts the actual installer-produced MichelsLife.exe on a hosted Windows
 * desktop and attaches to the WebView2 it creates. Browser mock servers or
 * screenshots from a standalone HTML page are explicitly not accepted.
 *
 * WebView2 remote debugging is enabled ONLY in this test process through a
 * process-local environment variable. This is not a production app setting.
 */
import {spawn, spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {resolve, dirname, join} from "node:path";
import {chromium} from "playwright-core";

const fields = Object.fromEntries(process.argv.slice(2).map(x => {
  const i = x.indexOf("=");
  if (i < 1 || !x.startsWith("--")) throw new Error("Expected --name=value argument");
  return [x.slice(2, i), x.slice(i + 1)];
}));
const source = process.env.GITHUB_SHA || fields.source;
if (!/^[a-f0-9]{40}$/i.test(source || "")) throw new Error("Full Git source SHA required");
const executable = resolve(fields.exe || "");
const setup = resolve(fields.setup || "");
const dir = resolve(fields.out || "artifacts/windows-native-visual");
if (!existsSync(executable) || !existsSync(setup)) throw new Error("Actual installed EXE and Setup artifact required");
mkdirSync(dir, {recursive: true});
const hash = file => createHash("sha256").update(readFileSync(file)).digest("hex");
const setupSha = hash(setup);
const installedSha = hash(executable);
const pause = ms => new Promise(r => setTimeout(r, ms));
const port = 9397;
let proc, browser;
const captures = [];
async function poll(debuggerUrl, deadline) {
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) throw new Error("Native installed app exited before UI validation");
    try {
      const response = await fetch(debuggerUrl, {signal: AbortSignal.timeout(2000)});
      if (response.ok) return;
    } catch (_) {}
    await pause(800);
  }
  throw new Error("Installed WebView2 did not expose CI-only CDP debugger; no native screenshot evidence");
}
function nativeResize(width, height) {
  const ps = [
    "$ErrorActionPreference = 'Stop'",
    "$p = Get-Process -Id " + proc.pid,
    "$p.Refresh()",
    "if ($p.MainWindowHandle -eq 0) {throw 'Installed Michel''s Life has no visible top-level window'}",
    "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class NativeWindowRect { [DllImport(\"user32.dll\",SetLastError=true)] public static extern bool MoveWindow(IntPtr h,int x,int y,int w,int hgt,bool repaint); }'",
    "if (-not [NativeWindowRect]::MoveWindow($p.MainWindowHandle,40,40," + width + "," + height + ",$true)) { throw 'Native window resize failed' }",
    "'WINDOW_RESIZE_PASS'"
  ].join("; ");
  const result = spawnSync("pwsh", ["-NoProfile", "-NonInteractive", "-Command", ps], {encoding:"utf8", timeout:20000});
  if (result.status !== 0 || !result.stdout.includes("WINDOW_RESIZE_PASS")) {
    throw new Error("Native Windows resize failed: " + result.stderr + " " + result.stdout);
  }
}
async function applicationPage() {
  const until = Date.now() + 90000;
  while (Date.now() < until) {
    for (const context of browser.contexts()) {
      for (const page of context.pages()) {
        try {
          if (await page.evaluate(() => !!document.querySelector("#v30171Sidebar") && !!window.LeftNavV30171)) return page;
        } catch (_) {}
      }
    }
    await pause(1000);
  }
  throw new Error("No real app page emerged from the installed WebView2 CDP connection");
}
async function capture(page, surface, viewport) {
  await page.waitForTimeout(350);
  const bounds = await page.evaluate(() => ({width: innerWidth, height: innerHeight}));
  if (bounds.width < 320 || bounds.height < 320) throw new Error("Native window viewport missing: " + JSON.stringify(bounds));
  const filename = "windows-" + viewport + "-" + surface + ".png";
  const imagePath = join(dir, filename);
  await page.screenshot({path: imagePath, animations: "disabled", fullPage: false});
  const digest = hash(imagePath);
  captures.push({
    platform: "windows-installed", surface, viewport, path: filename,
    width: bounds.width, height: bounds.height, sha256: digest,
    candidate_artifact_sha256: setupSha,
    capture_method: "installed-windows-desktop"
  });
}
try {
  proc = spawn(executable, [], {
    cwd: dirname(executable),
    windowsHide: false,
    stdio: "ignore",
    env: {...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=" + port}
  });
  await poll("http://127.0.0.1:" + port + "/json/version", Date.now() + 90000);
  browser = await chromium.connectOverCDP("http://127.0.0.1:" + port, {timeout:30000});
  const page = await applicationPage();
  await page.evaluate(() => {
    localStorage.setItem("michelsLife.onboarding.v30200", "done");
    if (window.state?.settings) window.state.settings.onboardingRequired = false;
    if (window.state) window.state.activeTab = "dashboard";
    window.save?.();
    window.renderAll?.();
  });
  for (const [viewport, width, height] of [["wide",1600,1000], ["compact",1280,800]]) {
    nativeResize(width, height);
    await page.waitForTimeout(600);
    await page.evaluate(() => window.LeftNavV30171.route("dashboard"));
    await page.locator("#v30171Sidebar").waitFor({state:"visible",timeout:10000});
    await capture(page, "home", viewport);
    await page.evaluate(() => window.LeftNavV30171.route("settings"));
    await page.locator('[data-v30171-setting="about"]').click();
    await page.locator('[data-v30171-pane="about"].active .mlvdev-avatar').waitFor({state:"visible",timeout:15000});
    const content = await page.evaluate(() => ({
      author: document.querySelector(".mlvdev-avatar")?.naturalWidth || 0,
      parent: document.querySelector(".mlvdev-studio-lockup img")?.naturalWidth || 0,
      socials: document.querySelectorAll(".mlvdev-social").length
    }));
    if (!content.author || !content.parent || content.socials !== 5) {
      throw new Error("Native Windows About render lacks required author/studio/social visuals: " + JSON.stringify(content));
    }
    await capture(page, "about", viewport);
  }
  if (captures.length !== 4 || new Set(captures.map(x => x.width+"x"+x.height)).size < 2) {
    throw new Error("Installed Windows app did not yield two distinct real viewport sizes");
  }
  const manifest = {
    schema:"michelslab-rendered-ui-v1",source_commit:source,
    artifact_sha256:{"windows-installed":setupSha},
    installed_executable_sha256:installedSha,
    screenshots:captures,
    human_visual_review:{decision:"PENDING"}
  };
  writeFileSync(join(dir,"manifest.json"), JSON.stringify(manifest,null,2)+"\n");
  console.log("NATIVE_WINDOWS_CAPTURE_PASS: installed EXE, Setup digest, real WebView2 Home/About at two actual window sizes");
  console.log("Human post-release review and physical PC testing remain separate.");
} finally {
  try {await browser?.close()} catch (_) {}
  if (proc && proc.exitCode === null) {
    try {proc.kill()} catch (_) {}
  }
}
