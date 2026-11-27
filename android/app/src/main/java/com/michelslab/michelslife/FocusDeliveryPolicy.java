package com.michelslab.michelslife;

/**
 * Pure, platform-independent guards for the native delivery side of the
 * canonical FocusStoryV30162 clock. No second timer or user data is stored.
 */
public final class FocusDeliveryPolicy {
    private FocusDeliveryPolicy() {}

    /**
     * A just-expired Focus clock may leave its existing alarm pending while
     * Android dispatches the completion. A DIFFERENT expired clock must not
     * preserve an older session's pending completion.
     */
    public static boolean keepExpiredPendingAlarm(
            String mode, long deadline, long storedDeadline, String storedToken) {
        if (deadline <= 0 || deadline != storedDeadline) return false;
        String normalizedMode = "break".equals(mode) ? "break" : "work";
        return (normalizedMode + ":" + deadline).equals(storedToken);
    }

    /** Retry a notification deep-link only while it remains pending.
     * An early WebView page-finished callback is not proof the Focus UI loaded.
     */
    public static boolean shouldRetryNotificationOpen(
            boolean intentPending, boolean opened, int retriesAttempted) {
        return intentPending && !opened &&
                retriesAttempted >= 0 && retriesAttempted < 24;
    }
}
