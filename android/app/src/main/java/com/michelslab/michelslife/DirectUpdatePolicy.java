package com.michelslab.michelslife;

import java.util.Locale;
import java.util.regex.Pattern;

/** Pure Android Direct update-discovery policy. Never downloads, installs,
 * grants APK installer permission, or writes app/account state. */
public final class DirectUpdatePolicy {
    private DirectUpdatePolicy() {}

    // Permanent public signing certificate of the owner-controlled Direct APK,
    // distinct from Play-upload and CI debug certificates. A key rotation
    // requires a deliberate release migration, never silent TOFU.
    public static final String DIRECT_SIGNER_SHA256 =
        "36a9f5144243d14ebade9d38559cfd7d4d9207c1edba01e6f0fbdd5f076a50fa";
    private static final Pattern VERSION = Pattern.compile("^[0-9]{1,5}\\.[0-9]{1,5}\\.[0-9]{1,5}$");
    public static final String OFFICIAL_RELEASE_PREFIX =
        "https://github.com/michels-lab/michel-s-life-releases/releases/tag/";

    public static String channel(String installer, boolean debuggable, String signerSha256) {
        if (debuggable) return "test";
        if ("com.android.vending".equals(installer)) return "google-play";
        if (signerSha256 != null &&
            DIRECT_SIGNER_SHA256.equals(signerSha256.replace(":", "").toLowerCase(Locale.ROOT)))
            return "android-direct";
        return "test";
    }

    public enum Status { NEWER, CURRENT, UNVERIFIED }

    public static Status compare(String installedVersion, long installedCode,
            String publishedVersion, long publishedCode,
            boolean stable, boolean completeAssets, boolean officialReleaseUrl) {
        if (!stable || !completeAssets || !officialReleaseUrl ||
            installedCode <= 0 || publishedCode <= 0 ||
            !validVersion(installedVersion) || !validVersion(publishedVersion))
            return Status.UNVERIFIED;
        int versionComparison = compareVersion(publishedVersion, installedVersion);
        if (publishedCode == installedCode && versionComparison == 0) return Status.CURRENT;
        if (publishedCode > installedCode && versionComparison > 0) return Status.NEWER;
        // Conflicting code/version, older release, or republished same code:
        // fail closed. No direct APK install can be recommended from this.
        return Status.UNVERIFIED;
    }

    public static boolean validVersion(String version) {
        return version != null && VERSION.matcher(version).matches();
    }

    public static int compareVersion(String a, String b) {
        if (!validVersion(a) || !validVersion(b))
            throw new IllegalArgumentException("Invalid Android version");
        String[] aa = a.split("\\."), bb = b.split("\\.");
        for (int i = 0; i < 3; i++) {
            int diff = Integer.compare(Integer.parseInt(aa[i]), Integer.parseInt(bb[i]));
            if (diff != 0) return diff;
        }
        return 0;
    }

    public static boolean officialReleaseUrl(String url, String tag) {
        return tag != null && tag.matches("v[0-9]+\\.[0-9]+\\.[0-9]+") &&
            (OFFICIAL_RELEASE_PREFIX + tag).equals(url);
    }

    public static boolean officialAssetUrl(String url, String tag, String filename) {
        if (tag == null || filename == null || filename.isBlank() ||
            !filename.matches("[A-Za-z0-9._-]+")) return false;
        return ("https://github.com/michels-lab/michel-s-life-releases/releases/download/"
            + tag + "/" + filename).equals(url);
    }
}
