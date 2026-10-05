using System.Runtime.InteropServices;
using Microsoft.Web.WebView2.WinForms;

namespace MichelsLife;

internal static class DesktopShell
{
    private const int HotKeyId = 0x4D4C;
    private const uint ModControl = 0x0002;
    private const uint ModShift = 0x0004;
    private const uint VkSpace = 0x20;
    private const string StartupRegistryPath = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private const string StartupValueName = "MichelsLife";

    private static Form? _form;
    private static WebView2? _webView;
    private static NotifyIcon? _trayIcon;
    private static TrayHotKeyWindow? _hotKeyWindow;
    private static bool _exitRequested;
    private static bool _attached;

    public static void Attach(Form form, WebView2 webView)
    {
        if (_attached) return;
        _attached = true;
        _form = form;
        _webView = webView;

        var menu = new ContextMenuStrip();
        var spanish = IsInstalledLanguageSpanish();
        var openItem = menu.Items.Add(spanish ? "Abrir Michel's Life" : "Open Michel's Life", null, (_, _) => RestoreWindow());
        var quickCaptureItem = menu.Items.Add(spanish ? "Captura rápida" : "Quick Capture", null, async (_, _) => await ShowQuickCaptureAsync());
        var currentMissionItem = menu.Items.Add(spanish ? "Misión actual" : "Current Mission", null, async (_, _) => await OpenCurrentMissionAsync());
        var syncItem = menu.Items.Add(spanish ? "Sincronizar ahora" : "Sync Now", null, async (_, _) => await SyncNowAsync());
        var startupItem = new ToolStripMenuItem(spanish ? "Iniciar con Windows" : "Start with Windows")
        {
            CheckOnClick = true,
            Checked = IsStartWithWindowsEnabled()
        };
        startupItem.Click += (_, _) =>
        {
            if (!SetStartWithWindows(startupItem.Checked))
                startupItem.Checked = IsStartWithWindowsEnabled();
        };
        menu.Items.Add(startupItem);
        menu.Items.Add(new ToolStripSeparator());
        var exitItem = menu.Items.Add(spanish ? "Salir" : "Exit", null, (_, _) => ExitApplication());
        menu.Opening += async (_, _) => await RefreshTrayLanguageAsync(
            openItem,
            quickCaptureItem,
            currentMissionItem,
            syncItem,
            startupItem,
            exitItem
        );

        _trayIcon = new NotifyIcon
        {
            Text = "Michel's Life",
            Icon = form.Icon ?? SystemIcons.Application,
            ContextMenuStrip = menu,
            Visible = true
        };
        _trayIcon.DoubleClick += (_, _) => RestoreWindow();

        form.FormClosing += OnFormClosing;
        form.Resize += (_, _) =>
        {
            if (form.WindowState == FormWindowState.Minimized)
                form.Hide();
        };

        _hotKeyWindow = new TrayHotKeyWindow();
        _hotKeyWindow.HotKeyPressed += async (_, _) => await ShowQuickCaptureAsync();
        if (!_hotKeyWindow.Register(HotKeyId, ModControl | ModShift, VkSpace))
        {
            _trayIcon.ShowBalloonTip(
                5000,
                "Michel's Life",
                spanish
                    ? "Ctrl + Shift + Espacio ya está en uso por Windows u otra aplicación. Captura rápida sigue disponible desde la bandeja."
                    : "Ctrl + Shift + Space is already in use by Windows or another app. Quick Capture remains available from the tray.",
                ToolTipIcon.Warning
            );
        }

        Application.ApplicationExit += (_, _) => Dispose();
    }

    private static void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        if (_exitRequested || e.CloseReason != CloseReason.UserClosing) return;
        e.Cancel = true;
        _form?.Hide();
    }

    private static void RestoreWindow()
    {
        if (_form is null || _form.IsDisposed) return;
        _form.Show();
        if (_form.WindowState == FormWindowState.Minimized)
            _form.WindowState = FormWindowState.Normal;
        _form.ShowInTaskbar = true;
        _form.BringToFront();
        _form.Activate();
    }

    private static async Task ShowQuickCaptureAsync()
    {
        RestoreWindow();
        await ExecuteDesktopScriptAsync(
            "window.MLV216QuickCapture&&window.MLV216QuickCapture.open({source:'desktop'});"
        );
    }

    private static async Task OpenCurrentMissionAsync()
    {
        RestoreWindow();
        await ExecuteDesktopScriptAsync(
            "(()=>{const api=window.CurrentMissionV131;const current=api?.getState?.();" +
            "if(current?.id){api.open?.(current.id);return 'current';}" +
            "window.LeftNavV30171?.route?.('missions');return 'missions';})()"
        );
    }

    private static async Task SyncNowAsync()
    {
        RestoreWindow();
        await ExecuteDesktopScriptAsync(
            "(()=>{const api=window.GoogleCloudV30192||window.GoogleCloudV30191;" +
            "if(!api?.sync){window.toast?.('Michel’s Life Cloud','Cloud Sync is not ready yet.');return 'unavailable';}" +
            "api.sync('auto',{silent:false});return 'started';})()"
        );
    }

    private static async Task ExecuteDesktopScriptAsync(string script)
    {
        if (_webView?.CoreWebView2 is null) return;
        try
        {
            await _webView.CoreWebView2.ExecuteScriptAsync(script);
        }
        catch
        {
            // Native shell actions may arrive while WebView2 is between documents.
            // The user can retry the action once the current document is ready.
        }
    }

    private static bool IsInstalledLanguageSpanish()
    {
        try
        {
            var raw = (Microsoft.Win32.Registry.GetValue(
                @"HKEY_CURRENT_USER\Software\Michel's Life",
                "Language",
                string.Empty
            ) as string ?? string.Empty).Trim().ToLowerInvariant();
            return raw.StartsWith("spanish") || raw.StartsWith("es");
        }
        catch
        {
            return false;
        }
    }

    private static async Task RefreshTrayLanguageAsync(
        ToolStripItem openItem,
        ToolStripItem quickCaptureItem,
        ToolStripItem currentMissionItem,
        ToolStripItem syncItem,
        ToolStripItem startupItem,
        ToolStripItem exitItem
    )
    {
        var spanish = IsInstalledLanguageSpanish();
        try
        {
            if (_webView?.CoreWebView2 is not null)
            {
                var raw = await _webView.CoreWebView2.ExecuteScriptAsync(
                    "window.MichelsLifeI18n?.language||'en'"
                );
                var language = System.Text.Json.JsonSerializer.Deserialize<string>(raw) ?? "en";
                spanish = language.Equals("es", StringComparison.OrdinalIgnoreCase);
            }
        }
        catch
        {
            // Keep the installed-language fallback if the WebView is not ready.
        }

        openItem.Text = spanish ? "Abrir Michel's Life" : "Open Michel's Life";
        quickCaptureItem.Text = spanish ? "Captura rápida" : "Quick Capture";
        currentMissionItem.Text = spanish ? "Misión actual" : "Current Mission";
        syncItem.Text = spanish ? "Sincronizar ahora" : "Sync Now";
        startupItem.Text = spanish ? "Iniciar con Windows" : "Start with Windows";
        exitItem.Text = spanish ? "Salir" : "Exit";
    }

    private static bool IsStartWithWindowsEnabled()
    {
        try
        {
            using var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(StartupRegistryPath, writable: false);
            var value = key?.GetValue(StartupValueName) as string;
            var expected = QuoteExecutablePath(Application.ExecutablePath);
            return string.Equals(value, expected, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private static bool SetStartWithWindows(bool enabled)
    {
        try
        {
            using var key = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(StartupRegistryPath, writable: true);
            if (enabled)
                key?.SetValue(StartupValueName, QuoteExecutablePath(Application.ExecutablePath), Microsoft.Win32.RegistryValueKind.String);
            else
                key?.DeleteValue(StartupValueName, throwOnMissingValue: false);
            return true;
        }
        catch
        {
            _trayIcon?.ShowBalloonTip(
                4000,
                "Michel's Life",
                IsInstalledLanguageSpanish()
                    ? "No se pudo cambiar la preferencia de inicio con Windows."
                    : "Windows startup preference could not be changed.",
                ToolTipIcon.Warning
            );
            return false;
        }
    }

    private static string QuoteExecutablePath(string path) => $"\"{path}\"";

    private static void ExitApplication()
    {
        _exitRequested = true;
        Dispose();
        if (_form is { IsDisposed: false })
            _form.Close();
        else
            Application.Exit();
    }

    private static void Dispose()
    {
        _hotKeyWindow?.Dispose();
        _hotKeyWindow = null;
        if (_trayIcon is not null)
        {
            _trayIcon.Visible = false;
            _trayIcon.Dispose();
            _trayIcon = null;
        }
    }

    private sealed class TrayHotKeyWindow : NativeWindow, IDisposable
    {
        private const int WmHotKey = 0x0312;
        private int _id;
        private bool _registered;

        public event EventHandler? HotKeyPressed;

        public TrayHotKeyWindow()
        {
            CreateHandle(new CreateParams());
        }

        public bool Register(int id, uint modifiers, uint key)
        {
            _id = id;
            _registered = RegisterHotKey(Handle, id, modifiers, key);
            return _registered;
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WmHotKey && m.WParam.ToInt32() == _id)
                HotKeyPressed?.Invoke(this, EventArgs.Empty);
            base.WndProc(ref m);
        }

        public void Dispose()
        {
            if (_registered)
            {
                UnregisterHotKey(Handle, _id);
                _registered = false;
            }
            DestroyHandle();
        }
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool UnregisterHotKey(IntPtr hWnd, int id);
}
