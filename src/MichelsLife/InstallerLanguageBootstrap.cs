using System;
using System.Globalization;
using System.Runtime.CompilerServices;
using Microsoft.Win32;

namespace MichelsLife;

internal static class InstallerLanguageBootstrap
{
    private const string RegistryPath = @"Software\Michel's Life";

    [ModuleInitializer]
    internal static void Initialize()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(RegistryPath);
            var raw = (key?.GetValue("Language") as string ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(raw))
                return;

            var cultureName = raw.StartsWith("spanish") || raw.StartsWith("es") ? "es-MX" : "en-US";
            var culture = CultureInfo.GetCultureInfo(cultureName);

            CultureInfo.DefaultThreadCurrentCulture = culture;
            CultureInfo.DefaultThreadCurrentUICulture = culture;

            var existing = Environment.GetEnvironmentVariable("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS") ?? string.Empty;
            if (!existing.Contains("--lang=", StringComparison.OrdinalIgnoreCase))
            {
                var combined = string.IsNullOrWhiteSpace(existing)
                    ? $"--lang={cultureName}"
                    : $"{existing.Trim()} --lang={cultureName}";
                Environment.SetEnvironmentVariable("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", combined);
            }
        }
        catch
        {
            // Language bootstrap must never prevent Michel's Life from starting.
        }
    }
}
