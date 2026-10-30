package com.michelslab.michelslife;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Strict stable Android x.y.z numeric version comparison; no prerelease coercion. */
final class AndroidReleaseVersion {
    private static final Pattern VERSION = Pattern.compile(
        "^(0|[1-9][0-9]{0,5})\\.(0|[1-9][0-9]{0,5})\\.(0|[1-9][0-9]{0,5})$"
    );
    private AndroidReleaseVersion() { }

    /** Null means invalid data, not equal or up to date. */
    static Integer compare(String candidate, String installed) {
        if (candidate == null || installed == null) return null;
        Matcher a = VERSION.matcher(candidate);
        Matcher b = VERSION.matcher(installed);
        if (!a.matches() || !b.matches()) return null;
        for (int i = 1; i <= 3; i++) {
            int result = Integer.compare(Integer.parseInt(a.group(i)), Integer.parseInt(b.group(i)));
            if (result != 0) return result;
        }
        return 0;
    }
}
