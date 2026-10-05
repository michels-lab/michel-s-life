using System.Runtime.InteropServices;
using Microsoft.Web.WebView2.WinForms;

namespace MichelsLife;

internal static class DesktopShell
{
    private const int HotKeyId = 0x4D4C;
    private const uint ModControl = 0x0002;
    private const uint ModShift = 0x0004;
    private const uint VkSpace = 0x20;

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
        menu.Items.Add("Open Michel's Life", null, (_, _) => RestoreWindow());
        menu.Items.Add("Quick Capture", null, async (_, _) => await ShowQuickCaptureAsync());
        menu.Items.Add("Current Mission", null, async (_, _) => await OpenCurrentMissionAsync());
        menu.Items.Add("Sync Now", null, async (_, _) => await SyncNowAsync());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Exit", null, (_, _) => ExitApplication());

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
        _hotKeyWindow.Register(HotKeyId, ModControl | ModShift, VkSpace);

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

        public void Register(int id, uint modifiers, uint key)
        {
            _id = id;
            _registered = RegisterHotKey(Handle, id, modifiers, key);
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
