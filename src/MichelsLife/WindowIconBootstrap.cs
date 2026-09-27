using System;
using System.Drawing;
using System.IO;
using System.Runtime.CompilerServices;
using System.Windows.Forms;

namespace MichelsLife;

internal static class WindowIconBootstrap
{
    private static Icon? _icon;

    [ModuleInitializer]
    internal static void Initialize()
    {
        Application.Idle += ApplyIconToOpenForms;
    }

    private static void ApplyIconToOpenForms(object? sender, EventArgs e)
    {
        try
        {
            if (_icon is null)
            {
                var path = Path.Combine(AppContext.BaseDirectory, "michels_life_icon.ico");
                if (File.Exists(path))
                    _icon = new Icon(path);
            }

            if (_icon is null)
                return;

            foreach (Form form in Application.OpenForms)
            {
                if (!ReferenceEquals(form.Icon, _icon))
                    form.Icon = _icon;
                form.ShowIcon = true;
            }
        }
        catch
        {
            // Never block app startup because of icon rendering.
        }
    }
}
