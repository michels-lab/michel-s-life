package com.michelslab.michelslife;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Real JDK signer regression tests; a synthetic certificate cannot certify an APK. */
public final class AndroidDirectCertificateContractTest {
    private static int cases = 0;

    private static void check(byte[][] certs, boolean expected) {
        boolean result = AndroidDirectCertificate.matchesInstalledSigner(certs);
        if (result != expected)
            throw new AssertionError("Unexpected production pin trust result: " + result);
        cases++;
    }

    private static void checkSynthetic(byte[][] certs, String pin, boolean expected) {
        boolean result = AndroidDirectCertificate.matchesSigner(certs, pin);
        if (result != expected)
            throw new AssertionError("Unexpected synthetic signer digest result: " + result);
        cases++;
    }

    private static String sha256(byte[] bytes) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(bytes);
        StringBuilder hex = new StringBuilder(64);
        for (byte b : hash) hex.append(String.format("%02x", b & 0xff));
        return hex.toString();
    }

    public static void main(String[] args) throws Exception {
        byte[] sample = "synthetic-not-an-official-certificate"
            .getBytes(StandardCharsets.UTF_8);
        String syntheticDigest = sha256(sample);
        byte[] modified = sample.clone();
        modified[0] ^= 1;

        check(null, false);
        check(new byte[][]{}, false);
        check(new byte[][]{null}, false);
        check(new byte[][]{new byte[]{}}, false);
        check(new byte[][]{new byte[]{1, 2, 3}}, false);
        check(new byte[][]{new byte[]{1}, new byte[]{2}}, false);

        // Positive acceptance with a known synthetic digest, negative rejection
        // for tampering and signer multiplicity. Official pin is never changed.
        checkSynthetic(new byte[][]{sample}, syntheticDigest, true);
        checkSynthetic(new byte[][]{sample}, syntheticDigest.toUpperCase(), true);
        checkSynthetic(new byte[][]{modified}, syntheticDigest, false);
        checkSynthetic(new byte[][]{sample, sample}, syntheticDigest, false);
        checkSynthetic(new byte[][]{sample}, null, false);
        checkSynthetic(new byte[][]{sample}, "", false);
        checkSynthetic(new byte[][]{sample}, "bad", false);
        checkSynthetic(new byte[][]{sample}, "g".repeat(64), false);

        if (!AndroidDirectCertificate.EXPECTED_SHA256
                .matches("[0-9a-f]{64}"))
            throw new AssertionError("Pinned public SHA256 is not 64 lowercase hex digits");
        System.out.println("PASS: " + cases +
            " signer digest cases (synthetic positive + production pin negatives)");
    }
}
