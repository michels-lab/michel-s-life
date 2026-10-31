package com.michelslab.michelslife;

/** Actual JVM tests for AndroidReleaseVersion: no emulator or network required. */
public final class AndroidReleaseVersionContractTest {
    private static int cases = 0;
    private static void check(String a, String b, Integer expected) {
        Integer result = AndroidReleaseVersion.compare(a, b);
        if (expected == null ? result != null : !expected.equals(result))
            throw new AssertionError(a + " vs " + b + " expected " + expected + ", got " + result);
        cases++;
    }
    public static void main(String[] args) {
        check("0.2.9", "0.2.9", 0);
        check("0.2.10", "0.2.9", 1);
        check("0.3.0", "0.2.999", 1);
        check("1.0.0", "0.99.99", 1);
        check("0.2.8", "0.2.9", -1);
        check("0.2.9", "0.2.10", -1);
        check("0.2.9-rc1", "0.2.9", null);
        check("0.2.9", "0.2.9-beta", null);
        check("0.2.09", "0.2.9", null);
        check("0.2", "0.2.9", null);
        check("9999999.0.0", "0.2.9", null);
        check("0.2.9", "0.2.9+build", null);
        check("", "0.2.9", null);
        check("0.2.9", null, null);
        check("0.2.9", "0.2.9 ", null);
        System.out.println("PASS: " + cases + " Android release version comparisons");
    }
}
