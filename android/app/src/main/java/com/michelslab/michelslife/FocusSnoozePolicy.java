package com.michelslab.michelslife;

/**
 * Pure rules for a device-local completion-notification snooze.
 * Snoozing a notification never moves the canonical Focus deadline, creates
 * a Pomodoro session, or changes mission progress.
 */
public final class FocusSnoozePolicy {
    private FocusSnoozePolicy() {}

    public static final long SNOOZE_MS = 5 * 60_000L;
    public static final long ACTION_WINDOW_MS = 60 * 60_000L;
    public static final long MAX_REMINDER_LATENESS_MS = 4 * 60 * 60_000L;

    public static boolean maySnooze(
            String requestedToken, String eligibleToken, String activeFocusToken,
            long completedAt, long existingReminderDue, long now) {
        return requestedToken != null && !requestedToken.isBlank()
                && requestedToken.equals(eligibleToken)
                && (activeFocusToken == null || activeFocusToken.isEmpty())
                && existingReminderDue == 0L
                && completedAt > 0L && now >= completedAt
                && now - completedAt <= ACTION_WINDOW_MS;
    }

    public static boolean mayDeliver(
            String requestedToken, String eligibleToken, String activeFocusToken,
            long reminderDue, long now) {
        return requestedToken != null && !requestedToken.isBlank()
                && requestedToken.equals(eligibleToken)
                && (activeFocusToken == null || activeFocusToken.isEmpty())
                && reminderDue > 0L && now >= reminderDue
                && now - reminderDue <= MAX_REMINDER_LATENESS_MS;
    }

    public static boolean shouldRestore(
            String eligibleToken, String activeFocusToken, long reminderDue, long now) {
        return eligibleToken != null && !eligibleToken.isBlank()
                && (activeFocusToken == null || activeFocusToken.isEmpty())
                && reminderDue > now
                && reminderDue - now <= SNOOZE_MS;
    }
}
