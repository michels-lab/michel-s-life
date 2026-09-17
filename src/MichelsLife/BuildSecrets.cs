using System;

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
                return environmentValue.Trim();

            return CompiledGoogleClientSecret.StartsWith("__BUILD_SECRET_", StringComparison.Ordinal)
                ? string.Empty
                : CompiledGoogleClientSecret;
        }
    }
}
