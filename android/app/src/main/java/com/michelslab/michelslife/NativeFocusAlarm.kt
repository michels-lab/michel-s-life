package com.michelslab.michelslife

import android.Manifest
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import org.json.JSONObject

/**
 * Android delivery-only companion for the canonical WebView FocusStoryV30162 timer.
 *
 * No second timer or session history is maintained here: the source of truth is
 * the JS deadline/status. A single device-local pending alarm mirrors a running
 * session and is revoked immediately on pause, reset, skip or mode change.
 * Without exact-alarm privileges Android may defer delivery while in Doze.
 */
internal object NativeFocusAlarm {
    private const val PREFS = "michelslife.native.focus-alarm.v1"
    private const val KEY_TOKEN = "token"
    private const val KEY_DEADLINE = "deadline"
    private const val KEY_MODE = "mode"
    private const val KEY_LANGUAGE = "language"
    private const val CHANNEL_ID = "michelslife-focus-complete"
    private const val ACTIVE_CHANNEL_ID = "michelslife-focus-running-v1"
    private const val ACTIVE_NOTIFICATION_ID = 4707
    const val EXTRA_OPEN_FOCUS = "com.michelslab.michelslife.OPEN_FOCUS"
    private const val REQUEST_CODE = 4705
    private const val NOTIFICATION_ID = 4705
    private const val MAX_FUTURE_MS = 4 * 60 * 60 * 1000L

    fun createChannel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            CHANNEL_ID, "Focus timer", NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Session completion reminders from Michel's Life"
            enableVibration(true)
        }
        manager.createNotificationChannel(channel)
        manager.createNotificationChannel(NotificationChannel(
            ACTIVE_CHANNEL_ID, "Running Pomodoro", NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Quiet, persistent countdown while a focus or break session is active"
            enableVibration(false)
            setSound(null, null)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        })
    }

    fun notificationPermissionGranted(context: Context): Boolean {
        val granted = Build.VERSION.SDK_INT < 33 ||
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        return granted && manager.areNotificationsEnabled()
    }

    internal fun openPomodoro(context: Context): PendingIntent =
        PendingIntent.getActivity(
            context, REQUEST_CODE,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra(EXTRA_OPEN_FOCUS, true)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    /** The OS renders the countdown from the canonical deadline, even with
     * the display off or the WebView suspended. It is NOT a second timer. */
    private fun showRunning(context: Context, mode: String, deadline: Long, language: String) {
        if (!notificationPermissionGranted(context)) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createChannel(context)
        val isBreak = mode == "break"
        val running = Notification.Builder(context, ACTIVE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_michels_focus)
            .setContentTitle(if (isBreak) (if (language == "es") "Pomodoro · Descanso" else "Pomodoro · Break") else "Pomodoro · Focus")
            .setContentText(if (language == "es") {
                if (isBreak) "Descanso en curso · toca para abrir" else "Sesión de enfoque en curso · toca para abrir"
            } else {
                if (isBreak) "Recovery in progress · tap to open" else "Focus session in progress · tap to open"
            })
            .setSubText("Michel's Life")
            .setContentIntent(openPomodoro(context))
            .setWhen(deadline)
            .setShowWhen(true)
            .setUsesChronometer(true)
            .setChronometerCountDown(true)
            .setOnlyAlertOnce(true)
            .setOngoing(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(Notification.CATEGORY_PROGRESS)
            .build()
        manager.notify(ACTIVE_NOTIFICATION_ID, running)
    }

    private fun hideRunning(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(ACTIVE_NOTIFICATION_ID)
    }

    fun status(context: Context): JSONObject {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val permitted = notificationPermissionGranted(context)
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        // API 26+ users can block just the Focus channel while leaving app
        // notifications enabled. Runtime permission alone is not proof that
        // an alarm completion can actually display a notification.
        val completionChannel = manager.getNotificationChannel(CHANNEL_ID)
        val runningChannel = manager.getNotificationChannel(ACTIVE_CHANNEL_ID)
        val completionAllowed = permitted &&
            (completionChannel == null ||
                completionChannel.importance != NotificationManager.IMPORTANCE_NONE)
        val ongoingAllowed = permitted &&
            (runningChannel == null ||
                runningChannel.importance != NotificationManager.IMPORTANCE_NONE)
        val reason = when {
            !permitted -> "notification-permission-disabled"
            !completionAllowed -> "focus-completion-channel-disabled"
            else -> "inexact-alarm-may-be-delayed-by-battery"
        }
        return JSONObject()
            .put("notificationsGranted", permitted)
            .put("ongoingCountdownSupported", true)
            .put("ongoingCountdownAvailable", ongoingAllowed)
            .put("activeDeadlineAt", prefs.getLong(KEY_DEADLINE, 0L))
            .put("precision", "battery-optimized-inexact")
            // Registered with AlarmManager does not imply an actual visible
            // background notification, especially if user revoked permission.
            .put("backgroundDelivery", completionAllowed)
            .put("backgroundDeliveryGuaranteed", false)
            .put("deliveryReason", reason)
    }

    private fun intent(context: Context, token: String): PendingIntent {
        val message = Intent(context, FocusAlarmReceiver::class.java).apply {
            action = "com.michelslab.michelslife.FOCUS_COMPLETED"
            putExtra(KEY_TOKEN, token)
        }
        return PendingIntent.getBroadcast(
            context, REQUEST_CODE, message,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    fun sync(context: Context, state: JSONObject): JSONObject {
        val phaseStatus = state.optString("status")
        val deadline = state.optLong("deadlineAt", 0L)
        val mode = if (state.optString("mode") == "break") "break" else "work"
        val language = if (state.optString("language") == "es") "es" else "en"
        val now = System.currentTimeMillis()
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

        // Idle, paused or invalid states must remove the previous notification.
        if (phaseStatus != "running" || deadline <= 0L || deadline > now + MAX_FUTURE_MS) {
            // Explicit pause/reset cancels an old completion snooze; a normal
            // ready-after-completion state preserves its user-facing action.
            if (phaseStatus == "paused") FocusSnoozeReminder.clear(context)
            cancel(context)
            return status(context).put("scheduled", false)
        }

        // A deadline that has just passed is still owed by Android. Do NOT
        // cancel/reissue the pending alarm while the WebView has yet to render
        // the transition (Doze can defer the receiver for a short time).
        if (deadline <= now) {
            // A different (or reset) clock may be past its deadline while a
            // previous session's Android alarm is still registered. Revoke
            // that old alarm instead of leaving a ghost lock-screen alert.
            val keepPending = FocusDeliveryPolicy.keepExpiredPendingAlarm(
                mode, deadline,
                prefs.getLong(KEY_DEADLINE, 0L),
                prefs.getString(KEY_TOKEN, "")
            )
            if (!keepPending) {
                cancel(context)
                return status(context).put("scheduled", false)
            }
            hideRunning(context)
            return status(context).put("scheduled", true)
        }

        val token = "$mode:$deadline"
        if (prefs.getString(KEY_TOKEN, "") == token &&
            prefs.getLong(KEY_DEADLINE, 0L) == deadline) {
            // Re-show quietly after a permission grant or language change without touching the alarm.
            prefs.edit().putString(KEY_LANGUAGE, language).apply()
            showRunning(context, mode, deadline, language)
            return status(context).put("scheduled", true)
        }

        cancel(context)
        // The new canonical phase supersedes any previous completion snooze.
        FocusSnoozeReminder.clear(context)
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .cancel(NOTIFICATION_ID)
        val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        // setAndAllowWhileIdle does not require the special exact-alarm access.
        // It works with a locked screen, though Android may delay the delivery.
        alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, deadline, intent(context, token))
        prefs.edit().putString(KEY_TOKEN, token)
            .putLong(KEY_DEADLINE, deadline).putString(KEY_MODE, mode)
            .putString(KEY_LANGUAGE, language).apply()
        showRunning(context, mode, deadline, language)
        return status(context).put("scheduled", true)
    }

    /**
     * Android discards pending AlarmManager entries after device reboot.
     * Re-create ONLY a valid, not-yet-expired canonical Focus deadline.
     * The persisted token/deadline are delivery metadata, not a second timer;
     * no JS state or session history is rewritten and no stale notification
     * is emitted for a phase that elapsed while the phone was off.
     */
    fun recoverAfterBoot(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val token = prefs.getString(KEY_TOKEN, "") ?: ""
        val deadline = prefs.getLong(KEY_DEADLINE, 0L)
        val mode = prefs.getString(KEY_MODE, "") ?: ""
        val language = prefs.getString(KEY_LANGUAGE, "en") ?: "en"
        val now = System.currentTimeMillis()
        if ((mode != "work" && mode != "break") ||
            token != "$mode:$deadline" ||
            deadline <= now || deadline > now + MAX_FUTURE_MS) {
            cancel(context)
            FocusSnoozeReminder.recoverAfterBoot(context)
            return
        }
        // Re-arming the same PendingIntent is idempotent if the package
        // replacement broadcast arrives while an alarm still exists.
        val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, deadline, intent(context, token))
        showRunning(context, mode, deadline, language)
        FocusSnoozeReminder.clear(context) // Active canonical Focus takes precedence.
    }

    fun cancel(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val token = prefs.getString(KEY_TOKEN, "") ?: ""
        val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        // Does not construct a second alarm: cancels the matching request code.
        alarm.cancel(intent(context, token))
        hideRunning(context)
        prefs.edit().remove(KEY_TOKEN).remove(KEY_DEADLINE).remove(KEY_MODE)
            .remove(KEY_LANGUAGE).apply()
    }

    fun deliverIfCurrent(context: Context, token: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (token.isBlank() || token != prefs.getString(KEY_TOKEN, "")) return
        val deadline = prefs.getLong(KEY_DEADLINE, 0L)
        if (deadline <= 0L || deadline > System.currentTimeMillis() + 5_000L) return
        val mode = prefs.getString(KEY_MODE, "work") ?: "work"
        val language = prefs.getString(KEY_LANGUAGE, "en") ?: "en"
        // Clearing before notification means duplicate/stale receiver events
        // cannot double-send after reset or an overlapping phase transition.
        prefs.edit().remove(KEY_TOKEN).remove(KEY_DEADLINE).remove(KEY_MODE)
            .remove(KEY_LANGUAGE).commit()
        hideRunning(context)
        if (!notificationPermissionGranted(context)) return
        createChannel(context)
        FocusSnoozeReminder.prepare(context, token, mode, language)
        val open = openPomodoro(context)
        val isBreak = mode == "break"
        val notification = Notification.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_michels_focus)
            .setContentTitle(if (isBreak) (if (language == "es") "Descanso terminado" else "Break complete") else (if (language == "es") "Sesión de enfoque terminada" else "Focus session complete"))
            .setContentText(if (language == "es") {
                if (isBreak) "¿Listo para otra sesión de enfoque?" else "Es hora de descansar."
            } else {
                if (isBreak) "Ready for another focus session?" else "Time to take a break."
            })
            .addAction(0, if (language == "es") "Avisar en 5 min" else "Remind in 5 min",
                FocusSnoozeReminder.action(context, token))
            .setContentIntent(open)
            .setAutoCancel(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(Notification.CATEGORY_REMINDER)
            .build()
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, notification)
    }
    /** A delivered completion may be re-notified once, entirely outside the
     * canonical Focus clock. This does not restart or prolong a session. */
    internal fun notifySnoozed(
        context: Context, mode: String, language: String, due: Long, reminder: Boolean
    ) {
        if (!notificationPermissionGranted(context)) return
        createChannel(context)
        val isBreak = mode == "break"
        val es = language == "es"
        val title = if (reminder) {
            if (es) "Recordatorio de Pomodoro" else "Pomodoro reminder"
        } else {
            if (es) "Aviso pospuesto" else "Reminder snoozed"
        }
        val message = if (reminder) {
            if (es) {
                if (isBreak) "El descanso terminó · toca para abrir" else "Tu sesión terminó · toca para abrir"
            } else {
                if (isBreak) "Break ended · tap to open" else "Focus session finished · tap to open"
            }
        } else if (es) "Te avisaremos de nuevo en 5 minutos"
        else "Another reminder in 5 minutes"
        val notification = Notification.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_michels_focus)
            .setContentTitle(title)
            .setContentText(message)
            .setContentIntent(openPomodoro(context))
            .setAutoCancel(true)
            .setOnlyAlertOnce(!reminder)
            .setWhen(due)
            .setShowWhen(!reminder)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(Notification.CATEGORY_REMINDER)
            .build()
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .notify(NOTIFICATION_ID, notification)
    }

}

class FocusAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "com.michelslab.michelslife.FOCUS_COMPLETED") return
        NativeFocusAlarm.deliverIfCurrent(context, intent.getStringExtra("token") ?: "")
    }
}

/**
 * A boot/package-upgrade broadcast is the only authority for restoring the
 * system-side Focus alarm after Android clears its alarm queue. The shared
 * WebView timer remains the sole session owner.
 */
class FocusAlarmBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
            intent.action != Intent.ACTION_MY_PACKAGE_REPLACED) return
        NativeFocusAlarm.recoverAfterBoot(context)
        NativePersonalAlarms.recover(context)
    }
}
