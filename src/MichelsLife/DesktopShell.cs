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
    private const string PreferencesRegistryPath = @"Software\MichelsLab\MichelsLife";
    private const string StartupChoiceValue = "StartupPreferenceConfigured";

    private static Form? _form;
    private static WebView2? _webView;
    private static NotifyIcon? _trayIcon;
    private static TrayHotKeyWindow? _hotKeyWindow;
    private static System.Windows.Forms.Timer? _taskbarTimer;
    private static TaskbarProgress? _taskbarProgress;
    private static bool _taskbarPollBusy;
    private static bool _alarmPollBusy;
    private static bool _focusNotificationPollBusy;
    private static bool _exitRequested;
    private static bool _attached;
    private static System.Threading.EventWaitHandle? _activationEvent;

    public static void RunSingleInstance(Func<Form> createForm)
    {
        var scope = @"Local\MichelsLab.MichelsLife." + System.Security.Principal.WindowsIdentity.GetCurrent().User?.Value;
        using var activation = new System.Threading.EventWaitHandle(false, System.Threading.EventResetMode.AutoReset, scope + ".Activate");
        using var instance = new System.Threading.Mutex(true, scope + ".Instance", out var primary);
        if (!primary) { activation.Set(); return; }
        _activationEvent = activation;
        try { Application.Run(createForm()); }
        finally { _activationEvent = null; }
    }

    public static void Attach(Form form, WebView2 webView)
    {
        if (_attached) return;
        _attached = true;
        _form = form;
        _webView = webView;
        // This release opts into opening with Windows on first native launch;
        // subsequent manual opt-out persists. Never re-enable after opt-out.
        EnsureStartupPreferenceOnce();

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
            else
                MarkStartupPreferenceConfigured();
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
        _trayIcon.BalloonTipClicked += (_, _) => RestoreWindow();

        form.FormClosing += OnFormClosing;
        // Standard Windows minimize retains the taskbar entry and live WebView.

        _hotKeyWindow = new TrayHotKeyWindow();
        _hotKeyWindow.HotKeyPressed += async (_, _) => await ShowQuickCaptureAsync();
        var hotKeyRegistered = _hotKeyWindow.Register(HotKeyId, ModControl | ModShift, VkSpace);
        quickCaptureItem.ToolTipText = hotKeyRegistered
            ? "Ctrl + Shift + Space"
            : spanish ? "Atajo ocupado; captura disponible aquí." : "Shortcut occupied; capture is available here.";

        _taskbarProgress = new TaskbarProgress(form.Handle);
        _taskbarTimer = new System.Windows.Forms.Timer { Interval = 1500 };
        _taskbarTimer.Tick += (_, _) => { if (_activationEvent?.WaitOne(0) == true) RestoreWindow(); };
        _taskbarTimer.Tick += async (_, _) => await RefreshTaskbarMissionAsync();
        _taskbarTimer.Tick += async (_, _) => await PollWindowsAlarmsAsync();
        _taskbarTimer.Tick += async (_, _) => await PollWindowsFocusAsync();
        _taskbarTimer.Start();
        _ = RefreshTaskbarMissionAsync();

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
            "(()=>{const api=window.SupabaseSyncV30216||window.GoogleCloudV30192||window.GoogleCloudV30191;" +
            "if(!api?.sync){window.toast?.('Michel’s Life Cloud','Cloud Sync is not ready yet.');return 'unavailable';}" +
            "api.sync('auto',{silent:false});return api.provider||'started';})()"
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

    private static async Task RefreshTaskbarMissionAsync()
    {
        if (_taskbarPollBusy || _form is null || _form.IsDisposed || _webView?.CoreWebView2 is null) return;
        _taskbarPollBusy = true;
        try
        {
            var raw = await _webView.CoreWebView2.ExecuteScriptAsync(
                "(()=>{try{const api=window.CurrentMissionV131,c=api?.getState?.();" +
                "if(!c)return null;let name='Current Mission';" +
                "try{name=(state.missions||[]).find(m=>String(m?.id)===String(c.id))?.name||name}catch(_){}" +
                "return {id:String(c.id||''),status:String(c.status||'running'),name:String(name),elapsedMs:Number(api?.elapsed?.(c)||c.elapsedMs||0)}" +
                "}catch(_){return null}})()"
            );
            using var doc = System.Text.Json.JsonDocument.Parse(raw);
            if (doc.RootElement.ValueKind is System.Text.Json.JsonValueKind.Null or System.Text.Json.JsonValueKind.Undefined)
            {
                ClearTaskbarMission();
                return;
            }

            var root = doc.RootElement;
            var name = root.TryGetProperty("name", out var n) ? n.GetString() ?? "Current Mission" : "Current Mission";
            var status = root.TryGetProperty("status", out var st) ? st.GetString() ?? "running" : "running";
            var elapsedMs = root.TryGetProperty("elapsedMs", out var em) && em.TryGetDouble(out var ms) ? Math.Max(0, ms) : 0;
            var elapsed = FormatElapsed(elapsedMs);

            _taskbarProgress?.SetMissionState(status);
            _form.Text = $"Michel's Life · {(status == "paused" ? "⏸" : "▶")} {name} · {elapsed}";
            if (_trayIcon is not null)
            {
                var trayText = $"Michel's Life · {name}";
                _trayIcon.Text = trayText.Length <= 63 ? trayText : trayText[..60] + "...";
            }
        }
        catch
        {
            // Navigation or startup can temporarily make the page context unavailable.
            // Keep the previous taskbar state until the next poll.
        }
        finally
        {
            _taskbarPollBusy = false;
        }
    }

    // The Windows tray timer stays active when the form is hidden. A background
    // WebView2 can throttle JavaScript intervals, so explicitly poll the same
    // alarm owner here; each due alarm is removed from its one-shot queue.
    // No second persistent alarm registry is created in the native shell.
    private static async Task PollWindowsAlarmsAsync()
    {
        if (_alarmPollBusy || _form is null || _form.IsDisposed || _webView?.CoreWebView2 is null) return;
        _alarmPollBusy = true;
        try
        {
            var raw = await _webView.CoreWebView2.ExecuteScriptAsync(
                "(()=>{try{return window.MichelsLifeAlarms?.takeWindowsNotification?.()||null}catch(_){return null}})()"
            );
            using var json = System.Text.Json.JsonDocument.Parse(raw);
            var info = json.RootElement;
            if (info.ValueKind != System.Text.Json.JsonValueKind.Object) return;
            var label = info.TryGetProperty("label", out var l) && l.ValueKind == System.Text.Json.JsonValueKind.String
                ? l.GetString() ?? "Alarma" : "Alarma";
            var time = info.TryGetProperty("time", out var t) && t.ValueKind == System.Text.Json.JsonValueKind.String
                ? t.GetString() ?? string.Empty : string.Empty;
            if (label.Length > 140) label = label[..140];
            RestoreWindow(); // The immersive alarm is now visible even after minimizing to tray.
            // Do NOT overlay the original cinematic alarm with a Windows 2000s
            // system beep. The native system cue remains only if Web Audio or the
            // user's imported MP3 cannot actually play in the active alarm UI.
            var audibleRaw = "false";
            try
            {
                audibleRaw = await _webView.CoreWebView2.ExecuteScriptAsync(
                    "(()=>{try{return window.MichelsLifeAlarms?.isAudible?.()===true}catch(_){return false}})()"
                );
            }
            catch
            {
                // Failed WebView/audio handshake still gets an OS audible cue.
            }
            if (!string.Equals(audibleRaw, "true", StringComparison.OrdinalIgnoreCase))
            {
                try { System.Media.SystemSounds.Exclamation.Play(); } catch { }
            }
            _trayIcon?.ShowBalloonTip(
                12000, "Michel's Life · Alarma",
                string.IsNullOrWhiteSpace(time) ? label : $"{time} · {label}",
                ToolTipIcon.Info
            );
        }
        catch
        {
            // A navigation/reload can temporarily remove the JS owner.
            // Do not modify or re-create saved alarm schedules here.
        }
        finally
        {
            _alarmPollBusy = false;
        }
    }

    // Windows desktop notifications: native tray balloon messages remain
    // available while Michel's Life is minimized to its background tray.
    // FocusStory is the single timer owner; native polling drains only events
    // and asks the JS clock to reconcile expiry after WebView2 throttling.
    private static async Task PollWindowsFocusAsync()
    {
        if (_focusNotificationPollBusy || _form is null || _form.IsDisposed ||
            _webView?.CoreWebView2 is null) return;
        _focusNotificationPollBusy = true;
        try
        {
            var raw = await _webView.CoreWebView2.ExecuteScriptAsync(
                "(()=>{try{return window.FocusStoryV30162?.takeWindowsNotification?.()||null}catch(_){return null}})()"
            );
            using var json = System.Text.Json.JsonDocument.Parse(raw);
            var root = json.RootElement;
            if (root.ValueKind != System.Text.Json.JsonValueKind.Object) return;
            var type = root.TryGetProperty("type", out var t) &&
                t.ValueKind == System.Text.Json.JsonValueKind.String
                ? t.GetString() ?? string.Empty : string.Empty;
            var detail = root.TryGetProperty("detail", out var d) &&
                d.ValueKind == System.Text.Json.JsonValueKind.String
                ? d.GetString() ?? string.Empty : string.Empty;
            var spanish = IsInstalledLanguageSpanish();
            var title = type switch
            {
                "started" => spanish ? "Michel's Life · Pomodoro iniciado" : "Michel's Life · Focus started",
                "paused" => spanish ? "Michel's Life · Pomodoro pausado" : "Michel's Life · Focus paused",
                "completed" => spanish ? "Michel's Life · Tiempo cumplido" : "Michel's Life · Focus complete",
                _ => spanish ? "Michel's Life · Pomodoro" : "Michel's Life · Focus timer"
            };
            if (detail.Length > 140) detail = detail[..140];
            _trayIcon?.ShowBalloonTip(type == "completed" ? 12000 : 5500,
                title, detail, ToolTipIcon.Info);
        }
        catch
        {
            // A navigation may temporarily make the JS timer unavailable;
            // never create a duplicate native timer or erase session data.
        }
        finally { _focusNotificationPollBusy = false; }
    }

    private static void ClearTaskbarMission()
    {
        _taskbarProgress?.Clear();
        if (_form is not null && !_form.IsDisposed)
            _form.Text = "Michel's Life";
        if (_trayIcon is not null)
            _trayIcon.Text = "Michel's Life";
    }

    private static string FormatElapsed(double elapsedMs)
    {
        var totalSeconds = Math.Max(0, (long)(elapsedMs / 1000));
        var hours = totalSeconds / 3600;
        var minutes = (totalSeconds % 3600) / 60;
        var seconds = totalSeconds % 60;
        return hours > 0
            ? $"{hours:00}:{minutes:00}:{seconds:00}"
            : $"{minutes:00}:{seconds:00}";
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

    private static void MarkStartupPreferenceConfigured()
    {
        try
        {
            using var settings = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(PreferencesRegistryPath, writable: true);
            settings?.SetValue(StartupChoiceValue, 1, Microsoft.Win32.RegistryValueKind.DWord);
        }
        catch { /* Registry can be restricted by enterprise policy. */ }
    }

    private static void EnsureStartupPreferenceOnce()
    {
        try
        {
            // Do not silently register transient build/test hosts as login apps.
            if (!string.Equals(Path.GetFileNameWithoutExtension(Application.ExecutablePath),
                    "MichelsLife", StringComparison.OrdinalIgnoreCase)) return;
            using var settings = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(PreferencesRegistryPath, writable: true);
            if (settings?.GetValue(StartupChoiceValue) is not null)
            {
                // Keep the opted-in startup target fresh after installer updates.
                if (IsStartWithWindowsEnabled()) return;
                return; // Manual opt-out remains off; never override it.
            }
            // Existing startup is an earlier explicit opt-in; leave it unchanged.
            using var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(StartupRegistryPath, writable: false);
            if (key?.GetValue(StartupValueName) is string) return;
            if (SetStartWithWindows(true))
                settings?.SetValue(StartupChoiceValue, 1, Microsoft.Win32.RegistryValueKind.DWord);
        }
        catch { /* No startup access must never prevent Michel's Life boot. */ }
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
        _taskbarTimer?.Stop();
        _taskbarTimer?.Dispose();
        _taskbarTimer = null;
        _taskbarProgress?.Dispose();
        _taskbarProgress = null;
        _hotKeyWindow?.Dispose();
        _hotKeyWindow = null;
        if (_trayIcon is not null)
        {
            _trayIcon.Visible = false;
            _trayIcon.Dispose();
            _trayIcon = null;
        }
    }

    private enum TaskbarProgressState
    {
        NoProgress = 0x0,
        Indeterminate = 0x1,
        Normal = 0x2,
        Error = 0x4,
        Paused = 0x8
    }

    [ComImport]
    [Guid("EA1AFB91-9E28-4B86-90E9-9E9F8A5EEA84")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface ITaskbarList3
    {
        void HrInit();
        void AddTab(IntPtr hwnd);
        void DeleteTab(IntPtr hwnd);
        void ActivateTab(IntPtr hwnd);
        void SetActiveAlt(IntPtr hwnd);
        void MarkFullscreenWindow(IntPtr hwnd, [MarshalAs(UnmanagedType.Bool)] bool fullscreen);
        void SetProgressValue(IntPtr hwnd, ulong completed, ulong total);
        void SetProgressState(IntPtr hwnd, TaskbarProgressState state);
    }

    [ComImport]
    [Guid("56FDF344-FD6D-11D0-958A-006097C9A090")]
    [ClassInterface(ClassInterfaceType.None)]
    private class CTaskbarList
    {
    }

    private sealed class TaskbarProgress : IDisposable
    {
        private readonly IntPtr _handle;
        private ITaskbarList3? _taskbar;

        public TaskbarProgress(IntPtr handle)
        {
            _handle = handle;
            try
            {
                _taskbar = (ITaskbarList3)new CTaskbarList();
                _taskbar.HrInit();
            }
            catch
            {
                _taskbar = null;
            }
        }

        public void SetMissionState(string status)
        {
            if (_taskbar is null) return;
            try
            {
                if (string.Equals(status, "paused", StringComparison.OrdinalIgnoreCase))
                {
                    _taskbar.SetProgressValue(_handle, 1, 1);
                    _taskbar.SetProgressState(_handle, TaskbarProgressState.Paused);
                }
                else
                {
                    _taskbar.SetProgressState(_handle, TaskbarProgressState.Indeterminate);
                }
            }
            catch
            {
                // Taskbar integration is best-effort and must never affect the app.
            }
        }

        public void Clear()
        {
            try { _taskbar?.SetProgressState(_handle, TaskbarProgressState.NoProgress); }
            catch { }
        }

        public void Dispose()
        {
            Clear();
            if (_taskbar is not null && Marshal.IsComObject(_taskbar))
                Marshal.FinalReleaseComObject(_taskbar);
            _taskbar = null;
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
