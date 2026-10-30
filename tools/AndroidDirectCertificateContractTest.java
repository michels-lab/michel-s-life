package com.michelslab.michelslife;

public final class AndroidDirectCertificateContractTest {
    private static int cases = 0;
    private static void check(byte[][] certs, boolean expected) {
        boolean result = AndroidDirectCertificate.matchesInstalledSigner(certs);
        if (result != expected)
            throw new AssertionError("Unexpected signer trust result: " + result);
        cases++;
    }
    public static void main(String[] args) {
        check(null, false);
        check(new byte[][]{}, false);
        check(new byte[][]{null}, false);
        check(new byte[][]{new byte[]{}}, false);
        check(new byte[][]{new byte[]{1, 2, 3}}, false);
        check(new byte[][]{new byte[]{1}, new byte[]{2}}, false);
        if (AndroidDirectCertificate.EXPECTED_SHA256.length() != 64)
            throw new AssertionError("Pinned public SHA256 fingerprint is not 64 hex digits");
        System.out.println("PASS: " + cases + " unsafe APK signer inputs fail closed");
    }
}
