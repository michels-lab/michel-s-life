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
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import org.json.JSONArray
import org.json.JSONObject
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Standalone personal alarms; NEVER changes canonical FocusStoryV30162 sessions.
 * Persisted in native preferences so broadcasts run while WebView is closed.
 * The WebView only owns the creation/edit UX; Android owns delivery and recurrence.
 */
internal object NativePersonalAlarms {
    private const val PREFS = "michelslife.personal-alarms.v1"
    private const val KEY_ALARMS = "alarms"
    private const val CHANNEL = "michelslife-personal-alarms-v1"
    private const val ACTION = "com.michelslab.michelslife.PERSONAL_ALARM"
    const val EXTRA_OPEN_ALARM = "com.michelslab.michelslife.OPEN_PERSONAL_ALARM"
    private val timePattern = Regex("^(?:[01]\\d|2[0-3]):[0-5]\\d$")
    private val idPattern = Regex("^[A-Za-z0-9_-]{1,64}$")
    private val formatter = DateTimeFormatter.ISO_LOCAL_DATE

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun list(context: Context): JSONArray =
        try { JSONArray(prefs(context).getString(KEY_ALARMS, "[]") ?: "[]") }
        catch (_: Exception) { JSONArray() }

    private fun notificationAllowed(context: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    fun createChannel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL) != null) return
        val sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val audio = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL, "Personal alarms", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "User-scheduled one-time, daily, and weekly alarms"
                setSound(sound, audio)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 550, 250, 550, 250, 550)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
        )
    }

    private fun clean(input: JSONObject): JSONObject? {
        val id = input.optString("id")
        val time = input.optString("time")
        val repeat = input.optString("repeat")
        val date = input.optString("date")
        if (!idPattern.matches(id) || !timePattern.matches(time) ||
            repeat !in listOf("once", "daily", "weekly")) return null
        if (repeat == "once") {
            try { LocalDate.parse(date, formatter) } catch (_: Exception) { return null }
        }
        val days = JSONArray()
        val selection = input.optJSONArray("days") ?: JSONArray()
        val seen = mutableSetOf<Int>()
        for (index in 0 until selection.length().coerceAtMost(7)) {
            val day = selection.optInt(index, -1)
            if (day in 0..6 && seen.add(day)) days.put(day)
        }
        if (repeat == "weekly" && seen.isEmpty()) return null
        return JSONObject().put("id", id)
            .put("label", input.optString("label").take(60))
            .put("time", time).put("date", date).put("repeat", repeat)
            .put("days", days).put("enabled", input.optBoolean("enabled", false))
    }

    private fun deliveryIntent(context: Context, id: String): PendingIntent =
        PendingIntent.getBroadcast(context, id.hashCode() and Int.MAX_VALUE,
            Intent(context, PersonalAlarmReceiver::class.java).apply {
                action = ACTION
                data = Uri.parse("michelslife://personal-alarm/$id")
                putExtra("id", id)
            }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    private fun openIntent(context: Context, id: String): PendingIntent =
        PendingIntent.getActivity(context, id.hashCode() and Int.MAX_VALUE,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                action = "com.michelslab.michelslife.OPEN_ALARM"
                data = Uri.parse("michelslife://open-alarm/$id")
                putExtra(EXTRA_OPEN_ALARM, id)
            }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    private fun timestamp(item: JSONObject, after: Long): Long {
        val time = try { LocalTime.parse(item.getString("time")) } catch (_: Exception) { return 0L }
        val zone = ZoneId.systemDefault()
        if (item.optString("repeat") == "once") {
            val date = try { LocalDate.parse(item.getString("date"), formatter) } catch (_: Exception) { return 0L }
            return date.atTime(time).atZone(zone).toInstant().toEpochMilli().takeIf { it > after } ?: 0L
        }
        val weekly = item.optString("repeat") == "weekly"
        val days = mutableSetOf<Int>()
        val selected = item.optJSONArray("days") ?: JSONArray()
        for (j in 0 until selected.length()) days.add(selected.optInt(j, -1))
        val today = LocalDate.now(zone)
        for (offset in 0..7) {
            val date = today.plusDays(offset.toLong())
            val calendarDay = date.dayOfWeek.value % 7 // Sunday=0, Monday=1...
            if (weekly && !days.contains(calendarDay)) continue
            val candidate = date.atTime(time).atZone(zone).toInstant().toEpochMilli()
            if (candidate > after) return candidate
        }
        return 0L
    }

    private fun cancel(context: Context, id: String) {
        (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager)
            .cancel(deliveryIntent(context, id))
    }

    private fun schedule(context: Context, item: JSONObject) {
        if (!item.optBoolean("enabled")) return
        val date = timestamp(item, System.currentTimeMillis())
        if (date <= 0L) return
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pending = deliveryIntent(context, item.getString("id"))
        // Exact timing requires user-granted exact-alarm access on Android 12+.
        // Always fall back to an inexact wake-up, never falsely claim exact delivery.
        if (Build.VERSION.SDK_INT < 31 || manager.canScheduleExactAlarms()) {
            try {
                manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, date, pending)
                return
            } catch (_: SecurityException) { }
        }
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, date, pending)
    }

    fun status(context: Context): JSONObject {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = nm.getNotificationChannel(CHANNEL)
        return JSONObject().put("notificationsGranted", notificationAllowed(context))
            .put("channelEnabled", channel == null ||
                channel.importance != NotificationManager.IMPORTANCE_NONE)
            .put("exact", Build.VERSION.SDK_INT < 31 || alarmManager.canScheduleExactAlarms())
            .put("fullScreen", Build.VERSION.SDK_INT < 34 || nm.canUseFullScreenIntent())
    }

    fun sync(context: Context, input: JSONArray): JSONObject {
        if (input.length() > 80) return JSONObject().put("error", "Too many alarms")
        val cleanList = JSONArray()
        val unique = mutableSetOf<String>()
        for (i in 0 until input.length()) {
            val normalized = clean(input.optJSONObject(i) ?: continue) ?: continue
            if (unique.add(normalized.getString("id"))) cleanList.put(normalized)
        }
        val existing = list(context)
        for (i in 0 until existing.length()) {
            val old = existing.optJSONObject(i) ?: continue
            old.optString("id").takeIf { idPattern.matches(it) }?.let { cancel(context, it) }
        }
        // Commit before re-arming: a receiver can then validate the new configuration.
        prefs(context).edit().putString(KEY_ALARMS, cleanList.toString()).commit()
        createChannel(context)
        for (i in 0 until cleanList.length()) schedule(context, cleanList.getJSONObject(i))
        return status(context).put("count", cleanList.length())
    }

    fun recover(context: Context) {
        createChannel(context)
        val all = list(context)
        for (i in 0 until all.length()) {
            val item = all.optJSONObject(i) ?: continue
            if (item.optBoolean("enabled")) schedule(context, item)
        }
    }

    fun dismiss(context: Context, id: String) {
        if (!idPattern.matches(id)) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(id.hashCode() and Int.MAX_VALUE)
    }

    fun deliver(context: Context, id: String) {
        if (!idPattern.matches(id)) return
        val all = list(context)
        var target: JSONObject? = null
        for (i in 0 until all.length()) {
            val item = all.optJSONObject(i) ?: continue
            if (item.optString("id") == id && item.optBoolean("enabled")) {
                target = item;break
            }
        }
        if (target == null) return // Deleted/disabled alarm must never ring.
        val nextList = JSONArray()
        for (i in 0 until all.length()) {
            val item = all.optJSONObject(i) ?: continue
            if (item.optString("id") == id && item.optString("repeat") == "once")
                item.put("enabled", false)
            nextList.put(item)
        }
        prefs(context).edit().putString(KEY_ALARMS, nextList.toString()).commit()
        // Next recurrence is always scheduled from now, so it never doubles on clock changes.
        if (target.optString("repeat") != "once") {
            schedule(context, target)
        }
        if (!notificationAllowed(context)) return
        createChannel(context)
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val open = openIntent(context, id)
        val notificationBuilder = Notification.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_michels_focus)
            .setContentTitle(target.optString("label").ifBlank { "Michel's Life · Alarm" })
            .setContentText("Your scheduled alarm is ringing · tap to open")
            .setContentIntent(open)
            .setAutoCancel(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(Notification.CATEGORY_ALARM)
            .setPriority(Notification.PRIORITY_MAX)
        // Fullscreen intents are allowed only for eligible alarm apps and only
        // when Android grants access. If denied, a heads-up notification remains.
        if (Build.VERSION.SDK_INT < 34 || manager.canUseFullScreenIntent())
            notificationBuilder.setFullScreenIntent(open, true)
        manager.notify(id.hashCode() and Int.MAX_VALUE, notificationBuilder.build())
        // The channel carries sound/vibration. Do not bypass the user's blocked
        // channel, DND, or system accessibility preferences with forced media.
    }
}

class PersonalAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "com.michelslab.michelslife.PERSONAL_ALARM") return
        NativePersonalAlarms.deliver(context, intent.getStringExtra("id") ?: "")
    }
}
