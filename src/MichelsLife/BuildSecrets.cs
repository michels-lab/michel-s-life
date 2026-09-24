using System;
using System.Text.Json;

namespace MichelsLife;

internal static class BuildSecrets
{
    // This placeholder is replaced only inside the CI runner before compilation.
    // It is intentionally safe to commit. Local developers can instead set
    // MICHELSLIFE_GOOGLE_CLIENT_SECRET in their environment.
    private const string CompiledGoogleClientSecret = "__BUILD_SECRET_GOOGLE__";

    internal static string GoogleClientSecret
    {
        get
        {
            var environmentValue = Environment.GetEnvironmentVariable("MICHELSLIFE_GOOGLE_CLIENT_SECRET");
            if (!string.IsNullOrWhiteSpace(environmentValue))
                return NormalizeGoogleClientSecret(environmentValue);

            return CompiledGoogleClientSecret.StartsWith("__BUILD_SECRET_", StringComparison.Ordinal)
                ? string.Empty
                : NormalizeGoogleClientSecret(CompiledGoogleClientSecret);
        }
    }

    private static string NormalizeGoogleClientSecret(string value)
    {
        var trimmed = value.Trim();
        if (!trimmed.StartsWith("{", StringComparison.Ordinal))
            return trimmed;

        try
        {
            using var json = JsonDocument.Parse(trimmed);
            if (json.RootElement.TryGetProperty("installed", out var installed)
                && installed.TryGetProperty("client_secret", out var secret))
            {
                return secret.GetString()?.Trim() ?? string.Empty;
            }
        }
        catch (JsonException)
        {
        }

        return string.Empty;
    }
}
