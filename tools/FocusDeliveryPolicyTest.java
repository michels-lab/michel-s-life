import com.michelslab.michelslife.FocusDeliveryPolicy;

/** Executable JVM regression contract for the real Android notification policy. */
public final class FocusDeliveryPolicyTest {
    private static int cases = 0;

    private static void check(String name, boolean actual, boolean expected) {
        cases++;
        if (actual != expected) {
            throw new AssertionError(name + ": expected " + expected + ", got " + actual);
        }
    }

    public static void main(String[] args) {
        long expired = 1793836800000L; // synthetic timestamp
        check("same work session keeps already queued alarm",
                FocusDeliveryPolicy.keepExpiredPendingAlarm(
                        "work", expired, expired, "work:" + expired), true);
        check("same break session keeps already queued alarm",
                FocusDeliveryPolicy.keepExpiredPendingAlarm(
                        "break", expired, expired, "break:" + expired), true);
        check("new expired work session cannot retain old alarm",
                FocusDeliveryPolicy.keepExpiredPendingAlarm(
                        "work", expired + 1, expired, "work:" + expired), false);
        check("mode transition does not retain old session",
                FocusDeliveryPolicy.keepExpiredPendingAlarm(
                        "break", expired, expired, "work:" + expired), false);
        check("missing alarm metadata is not proof of a queued alarm",
                FocusDeliveryPolicy.keepExpiredPendingAlarm(
                        "work", expired, 0, ""), false);
        check("zero canonical deadline never counts as pending",
                FocusDeliveryPolicy.keepExpiredPendingAlarm("work", 0, 0, "work:0"), false);
        check("malformed stored token rejected",
                FocusDeliveryPolicy.keepExpiredPendingAlarm(
                        "work", expired, expired, "work:broken"), false);

        check("cold-start notification tap retries while UI is absent",
                FocusDeliveryPolicy.shouldRetryNotificationOpen(true, false, 0), true);
        check("still retries before bounded limit",
                FocusDeliveryPolicy.shouldRetryNotificationOpen(true, false, 23), true);
        check("never retries indefinitely",
                FocusDeliveryPolicy.shouldRetryNotificationOpen(true, false, 24), false);
        check("completed launch stops retries",
                FocusDeliveryPolicy.shouldRetryNotificationOpen(true, true, 0), false);
        check("superseded or consumed intent stops retries",
                FocusDeliveryPolicy.shouldRetryNotificationOpen(false, false, 0), false);
        check("invalid retry index rejected",
                FocusDeliveryPolicy.shouldRetryNotificationOpen(true, false, -1), false);
        System.out.println("PASS: " + cases + "/" + cases +
                " native Focus delivery ownership and notification-launch JVM cases");
    }
}
