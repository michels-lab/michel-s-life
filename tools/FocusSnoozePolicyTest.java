import com.michelslab.michelslife.FocusSnoozePolicy;

/** Execute with javac/java, independent of Android SDK and private user data. */
public final class FocusSnoozePolicyTest {
    private static int cases = 0;
    private static final String TOKEN = "work:1793836800000";
    private static final long COMPLETED = 1793836800000L;
    private static void check(String name, boolean actual, boolean expected) {
        cases++;
        if (actual != expected)
            throw new AssertionError(name + ": expected " + expected + " but got " + actual);
    }

    public static void main(String[] args) {
        check("completion can be snoozed for five minutes", FocusSnoozePolicy.maySnooze(
                TOKEN, TOKEN, "", COMPLETED, 0L, COMPLETED + 3000), true);
        check("cannot snooze another session", FocusSnoozePolicy.maySnooze(
                "break:wrong", TOKEN, "", COMPLETED, 0L, COMPLETED + 3000), false);
        check("cannot snooze while a newer focus phase is running", FocusSnoozePolicy.maySnooze(
                TOKEN, TOKEN, "work:new", COMPLETED, 0L, COMPLETED + 3000), false);
        check("cannot double schedule", FocusSnoozePolicy.maySnooze(
                TOKEN, TOKEN, "", COMPLETED, COMPLETED + 301000, COMPLETED + 3000), false);
        check("expired notification action rejected", FocusSnoozePolicy.maySnooze(
                TOKEN, TOKEN, "", COMPLETED, 0L, COMPLETED + 60 * 60_000L + 1), false);
        check("future completion rejected", FocusSnoozePolicy.maySnooze(
                TOKEN, TOKEN, "", COMPLETED, 0L, COMPLETED - 1), false);
        check("absent completion rejected", FocusSnoozePolicy.maySnooze(
                TOKEN, TOKEN, "", 0L, 0L, COMPLETED), false);
        check("missing token rejected", FocusSnoozePolicy.maySnooze(
                "", "", "", COMPLETED, 0L, COMPLETED), false);

        final long due = COMPLETED + FocusSnoozePolicy.SNOOZE_MS;
        check("deliver exactly at scheduled deadline", FocusSnoozePolicy.mayDeliver(
                TOKEN, TOKEN, "", due, due), true);
        check("never deliver before deadline", FocusSnoozePolicy.mayDeliver(
                TOKEN, TOKEN, "", due, due - 1), false);
        check("another phase suppresses stale reminder", FocusSnoozePolicy.mayDeliver(
                TOKEN, TOKEN, "break:new", due, due + 500), false);
        check("wrong token never delivers", FocusSnoozePolicy.mayDeliver(
                TOKEN, "break:wrong", "", due, due + 500), false);
        check("stale notification suppressed after hours", FocusSnoozePolicy.mayDeliver(
                TOKEN, TOKEN, "", due, due + 4 * 60 * 60_000L + 1), false);
        check("zero due never delivers", FocusSnoozePolicy.mayDeliver(
                TOKEN, TOKEN, "", 0L, due), false);
        check("valid reboot restores pending snooze", FocusSnoozePolicy.shouldRestore(
                TOKEN, "", due, COMPLETED + 10_000), true);
        check("past-due reboot never resurrects snooze", FocusSnoozePolicy.shouldRestore(
                TOKEN, "", due, due), false);
        check("new session blocks reboot recovery", FocusSnoozePolicy.shouldRestore(
                TOKEN, "work:new", due, COMPLETED + 10_000), false);
        check("absent token blocks reboot recovery", FocusSnoozePolicy.shouldRestore(
                "", "", due, COMPLETED + 10_000), false);
        check("implausible future due blocks recovery", FocusSnoozePolicy.shouldRestore(
                TOKEN, "", due + 12 * 60 * 60_000L, COMPLETED), false);

        System.out.println("PASS " + cases + "/" + cases
                + " Focus lock-screen snooze state-machine cases");
    }
}
