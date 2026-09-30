#!/usr/bin/env python3
from pathlib import Path
import base64,gzip

ROOT=Path(__file__).resolve().parents[1]/'src'/'MichelsLife'
APP_VERSION='3.0.215'
LEGACY_APP_VERSIONS=('3.0.202','3.0.203','3.0.204','3.0.205','3.0.206','3.0.207','3.0.208','3.0.209','3.0.210','3.0.211','3.0.212','3.0.213','3.0.214')
GOOGLE_CLIENT_ID='256320502181-fvfuhkbijecscl1p3g41f8n28cr2541i.apps.googleusercontent.com'
LEGACY_GOOGLE_CLIENT_IDS=(
    '794181282949-v3ufh901g9rlec673qd0kho1karaqacj.apps.googleusercontent.com',
)

for name in ('Program.cs','GoogleCalendarService.cs'):
    packed=ROOT/(name+'.gz.b64')
    if not packed.exists():
        raise SystemExit(f'missing {packed}')
    data=gzip.decompress(base64.b64decode(packed.read_text().strip()))
    text=data.decode('utf-8')
    for old_version in LEGACY_APP_VERSIONS:
        text=text.replace(old_version,APP_VERSION)
    if name=='GoogleCalendarService.cs':
        for old_client_id in LEGACY_GOOGLE_CLIENT_IDS:
            text=text.replace(old_client_id,GOOGLE_CLIENT_ID)
        if GOOGLE_CLIENT_ID not in text:
            raise SystemExit('GoogleCalendarService.cs does not contain the approved Google Desktop OAuth client id')
    stale=[v for v in LEGACY_APP_VERSIONS if v in text]
    if stale:
        raise SystemExit(f'{name} still contains stale app version markers: {stale}')
    if name=='Program.cs' and f'CurrentAppVersion = new("{APP_VERSION}")' not in text:
        raise SystemExit(f'Program.cs missing CurrentAppVersion {APP_VERSION}')
    if name=='Program.cs':
        webview_anchor='            await _webView.EnsureCoreWebView2Async(env);'
        if text.count(webview_anchor)!=1:
            raise SystemExit(f'Program.cs expected exactly one WebView2 initialization anchor, found {text.count(webview_anchor)}')
        language_bridge=r'''
            var installerLanguageRaw = ((Microsoft.Win32.Registry.GetValue(
                @"HKEY_CURRENT_USER\\Software\\Michel's Life",
                "Language",
                string.Empty
            ) as string) ?? string.Empty).Trim().ToLowerInvariant();
            var installerLanguage = installerLanguageRaw.StartsWith("spanish") || installerLanguageRaw.StartsWith("es")
                ? "es"
                : "en";
            var installerLanguageJson = System.Text.Json.JsonSerializer.Serialize(installerLanguage);
            var installerLanguageScript =
                $"window.__MICHELSLIFE_INSTALL_LANGUAGE__={installerLanguageJson};" +
                $"window.MichelsLifeI18n&&window.MichelsLifeI18n.applyInstalledLanguage&&window.MichelsLifeI18n.applyInstalledLanguage({installerLanguageJson});";
            await _webView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(installerLanguageScript);
            try
            {
                await _webView.CoreWebView2.ExecuteScriptAsync(installerLanguageScript);
            }
            catch
            {
                // The first document may not exist yet. The document-created script
                // above will apply the installer language on the next navigation.
            }
'''
        text=text.replace(webview_anchor,webview_anchor+language_bridge)
        if '__MICHELSLIFE_INSTALL_LANGUAGE__' not in text:
            raise SystemExit('Program.cs installer-language bridge injection failed')
        if 'applyInstalledLanguage' not in text or 'ExecuteScriptAsync(installerLanguageScript)' not in text:
            raise SystemExit('Program.cs installer-language bridge is missing the late-document reconciliation path')
    data=text.encode('utf-8')
    (ROOT/name).write_bytes(data)
    print('materialized',name)
