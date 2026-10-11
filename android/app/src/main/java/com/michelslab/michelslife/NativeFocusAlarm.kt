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
    private const val CHANNEL_ID = "michelslife-focus-complete"
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
    }

    fun notificationPermissionGranted(context: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED

    fun status(context: Context): JSONObject {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return JSONObject()
            .put("notificationsGranted", notificationPermissionGranted(context))
            .put("activeDeadlineAt", prefs.getLong(KEY_DEADLINE, 0L))
            .put("precision", "battery-optimized-inexact")
            .put("backgroundDelivery", true)
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
        val status = state.optString("status")
        val deadline = state.optLong("deadlineAt", 0L)
        val mode = if (state.optString("mode") == "break") "break" else "work"
        val now = System.currentTimeMillis()
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

        // Idle, paused or invalid states must remove the previous notification.
        if (status != "running" || deadline <= 0L || deadline > now + MAX_FUTURE_MS) {
            cancel(context)
            return status(context).put("scheduled", false)
        }

        // A deadline that has just passed is still owed by Android. Do NOT
        // cancel/reissue the pending alarm while the WebView has yet to render
        // the transition (Doze can defer the receiver for a short time).
        if (deadline <= now) {
            return status(context).put("scheduled", prefs.getLong(KEY_DEADLINE, 0L) == deadline)
        }

        val token = "$mode:$deadline"
        if (prefs.getString(KEY_TOKEN, "") == token &&
            prefs.getLong(KEY_DEADLINE, 0L) == deadline) {
            return status(context).put("scheduled", true)
        }

        cancel(context)
        val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        // setAndAllowWhileIdle does not require the special exact-alarm access.
        // It works with a locked screen, though Android may delay the delivery.
        alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, deadline, intent(context, token))
        prefs.edit().putString(KEY_TOKEN, token)
            .putLong(KEY_DEADLINE, deadline).putString(KEY_MODE, mode).apply()
        return status(context).put("scheduled", true)
    }

    fun cancel(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val token = prefs.getString(KEY_TOKEN, "") ?: ""
        val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        // Does not construct a second alarm: cancels the matching request code.
        alarm.cancel(intent(context, token))
        prefs.edit().remove(KEY_TOKEN).remove(KEY_DEADLINE).remove(KEY_MODE).apply()
    }

    fun deliverIfCurrent(context: Context, token: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (token.isBlank() || token != prefs.getString(KEY_TOKEN, "")) return
        val deadline = prefs.getLong(KEY_DEADLINE, 0L)
        if (deadline <= 0L || deadline > System.currentTimeMillis() + 5_000L) return
        val mode = prefs.getString(KEY_MODE, "work")
        // Clearing before notification means duplicate/stale receiver events
        // cannot double-send after reset or an overlapping phase transition.
        prefs.edit().remove(KEY_TOKEN).remove(KEY_DEADLINE).remove(KEY_MODE).commit()
        if (!notificationPermissionGranted(context)) return
        createChannel(context)
        val open = PendingIntent.getActivity(
            context, REQUEST_CODE,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val isBreak = mode == "break"
        val notification = Notification.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(if (isBreak) "Break complete" else "Focus session complete")
            .setContentText(if (isBreak) "Ready for another focus session?" else "Time to take a break.")
            .setContentIntent(open)
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_REMINDER)
            .build()
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, notification)
    }
}

class FocusAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "com.michelslab.michelslife.FOCUS_COMPLETED") return
        NativeFocusAlarm.deliverIfCurrent(context, intent.getStringExtra("token") ?: "")
    }
}
