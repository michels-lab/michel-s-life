package com.michelslab.michelslife;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Pinned public certificate fingerprint for the official Android Direct
 * distribution identity. This is NOT a secret or a signing private key.
 */
final class AndroidDirectCertificate {
    static final String EXPECTED_SHA256 =
        "36a9f5144243d14ebade9d38559cfd7d4d9207c1edba01e6f0fbdd5f076a50fa";

    private AndroidDirectCertificate() { }

    static boolean matchesInstalledSigner(byte[][] certificateBytes) {
        return matchesSigner(certificateBytes, EXPECTED_SHA256);
    }

    // Package-visible only to exercise both positive and negative signature
    // validation using synthetic certificates, not the production private key.
    static boolean matchesSigner(byte[][] certificateBytes, String expectedSha256) {
        if (certificateBytes == null || certificateBytes.length != 1 ||
            certificateBytes[0] == null || certificateBytes[0].length == 0 ||
            expectedSha256 == null || !expectedSha256.matches("(?i)[0-9a-f]{64}"))
            return false;
        try {
            byte[] actual = MessageDigest.getInstance("SHA-256").digest(certificateBytes[0]);
            return MessageDigest.isEqual(actual, decodeExpected(expectedSha256));
        } catch (NoSuchAlgorithmException e) {
            return false;
        }
    }

    private static byte[] decodeExpected(String digest) {
        byte[] bytes = new byte[32];
        for (int i = 0; i < bytes.length; i++)
            bytes[i] = (byte)Integer.parseInt(digest.substring(i * 2, i * 2 + 2), 16);
        return bytes;
    }
}
