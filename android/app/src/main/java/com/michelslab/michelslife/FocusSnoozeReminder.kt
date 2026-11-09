package com.michelslab.michelslife

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Device-local re-notification of a COMPLETED Focus phase, never a second timer.
 * No XP, history, session, or canonical deadline is modified here.
 * One bounded snooze is allowed per completion, and any new Focus phase revokes it.
 */
internal object FocusSnoozeReminder {
    const val ACTION_SNOOZE = "com.michelslab.michelslife.FOCUS_SNOOZE"
    const val ACTION_DELIVER = "com.michelslab.michelslife.FOCUS_SNOOZE_DELIVER"

    private const val PREFS = "michelslife.native.focus-alarm.v1"
    private const val KEY_ACTIVE = "token"
    private const val KEY_SOURCE = "snooze_source"
    private const val KEY_MODE = "snooze_mode"
    private const val KEY_LANGUAGE = "snooze_language"
    private const val KEY_COMPLETED = "snooze_completed"
    private const val KEY_DUE = "snooze_due"
    private const val EXTRA_SOURCE = "snooze_source_token"
    private const val REQUEST_ACTION = 4708
    private const val REQUEST_DELIVERY = 4709

    private fun broadcast(context: Context, action: String, code: Int, source: String): PendingIntent =
        PendingIntent.getBroadcast(
            context, code,
            Intent(context, FocusSnoozeReceiver::class.java).apply {
                this.action = action
                putExtra(EXTRA_SOURCE, source)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    fun action(context: Context, source: String): PendingIntent =
        broadcast(context, ACTION_SNOOZE, REQUEST_ACTION, source)

    private fun alarm(context: Context, source: String) =
        broadcast(context, ACTION_DELIVER, REQUEST_DELIVERY, source)

    fun prepare(context: Context, source: String, mode: String, language: String) {
        // A previously completed phase is no longer eligible once superseded.
        clear(context)
        if (source.isBlank()) return
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString(KEY_SOURCE, source)
            .putString(KEY_MODE, if (mode == "break") "break" else "work")
            .putString(KEY_LANGUAGE, if (language == "es") "es" else "en")
            .putLong(KEY_COMPLETED, System.currentTimeMillis())
            .putLong(KEY_DUE, 0L)
            .commit()
    }

    fun schedule(context: Context, source: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val now = System.currentTimeMillis()
        if (!FocusSnoozePolicy.maySnooze(
                source, prefs.getString(KEY_SOURCE, "") ?: "",
                prefs.getString(KEY_ACTIVE, "") ?: "",
                prefs.getLong(KEY_COMPLETED, 0L),
                prefs.getLong(KEY_DUE, 0L), now
            )) return

        val due = now + FocusSnoozePolicy.SNOOZE_MS
        val mode = prefs.getString(KEY_MODE, "work") ?: "work"
        val language = prefs.getString(KEY_LANGUAGE, "en") ?: "en"
        // Persist first, so duplicate taps cannot create two reminders.
        if (!prefs.edit().putLong(KEY_DUE, due).commit()) return
        try {
            val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, due, alarm(context, source))
            NativeFocusAlarm.notifySnoozed(context, mode, language, due, false)
        } catch (_: Exception) {
            clear(context)
        }
    }

    fun deliver(context: Context, source: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val due = prefs.getLong(KEY_DUE, 0L)
        val now = System.currentTimeMillis()
        if (!FocusSnoozePolicy.mayDeliver(
                source, prefs.getString(KEY_SOURCE, "") ?: "",
                prefs.getString(KEY_ACTIVE, "") ?: "", due, now
            )) return
        val mode = prefs.getString(KEY_MODE, "work") ?: "work"
        val language = prefs.getString(KEY_LANGUAGE, "en") ?: "en"
        // Clearing before notification prevents retries and replayed broadcasts.
        clear(context)
        NativeFocusAlarm.notifySnoozed(context, mode, language, due, true)
    }

    fun recoverAfterBoot(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val source = prefs.getString(KEY_SOURCE, "") ?: ""
        val due = prefs.getLong(KEY_DUE, 0L)
        if (due == 0L) return // A tappable completion action is not a scheduled alarm.
        if (!FocusSnoozePolicy.shouldRestore(
                source, prefs.getString(KEY_ACTIVE, "") ?: "",
                due, System.currentTimeMillis()
            )) {
            clear(context)
            return
        }
        try {
            val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, due, alarm(context, source))
        } catch (_: Exception) {
            clear(context)
        }
    }

    fun clear(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val source = prefs.getString(KEY_SOURCE, "") ?: ""
        val hadScheduledReminder = prefs.getLong(KEY_DUE, 0L) > 0L
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        manager.cancel(alarm(context, source))
        // Never leave a visible “reminder in 5 min” confirmation after its
        // scheduled delivery has been revoked by pause, reset or new Focus.
        if (hadScheduledReminder) {
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager)
                .cancel(4705)
        }
        prefs.edit()
            .remove(KEY_SOURCE).remove(KEY_MODE).remove(KEY_LANGUAGE)
            .remove(KEY_COMPLETED).remove(KEY_DUE).commit()
    }
}

class FocusSnoozeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val token = intent.getStringExtra("snooze_source_token") ?: return
        when (intent.action) {
            FocusSnoozeReminder.ACTION_SNOOZE -> FocusSnoozeReminder.schedule(context, token)
            FocusSnoozeReminder.ACTION_DELIVER -> FocusSnoozeReminder.deliver(context, token)
        }
    }
}
