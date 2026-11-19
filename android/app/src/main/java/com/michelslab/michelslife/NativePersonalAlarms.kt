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
import android.util.Base64
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.PI
import kotlin.math.sin
import android.net.Uri
import android.provider.Settings
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
    private const val KEY_CUSTOM_FILE = "customAudioFile"
    private const val KEY_WALLPAPER = "wallpaper"
    private const val KEY_MOTIVATION = "motivationalCopy.v1"
    private const val LAST_DELIVERED_PREFIX = "lastDelivered."
    private const val CHANNEL = "michelslife-personal-alarms-v1"
    private const val SILENT_CHANNEL = "michelslife-personal-alarms-immersive-v1"
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

    fun wasDelivered(context: Context, id: String): Boolean {
        if (!idPattern.matches(id)) return false
        val at = prefs(context).getLong(LAST_DELIVERED_PREFIX + id, 0L)
        return at > 0L && System.currentTimeMillis() - at in 0..15 * 60 * 1000L
    }

    /**
     * A bounded, sanitized selection of the owner's NON-hidden affirmations and
     * already-visible application phrases, available to AlarmManager if the
     * WebView process is not alive. This never replaces the user's board.
     * An empty payload erases old account-specific copy on sign-out.
     */
    fun rememberMotivation(context: Context, raw: String): Boolean {
        if (raw.length > 10000) return false
        return try {
            val input = JSONObject(raw)
            val output = JSONObject()
            for ((field, limit) in listOf("affirmations" to 24, "phrases" to 20)) {
                val values = input.optJSONArray(field) ?: JSONArray()
                val cleaned = JSONArray()
                val distinct = HashSet<String>()
                for (i in 0 until minOf(values.length(), 100)) {
                    val line = values.optString(i, "")
                        .replace(Regex("[\\u0000-\\u001f\\u007f]"), " ")
                        .replace(Regex("\\s+"), " ")
                        .trim().take(180)
                    if (line.isNotEmpty() && distinct.add(line.lowercase())) cleaned.put(line)
                    if (cleaned.length() >= limit) break
                }
                output.put(field, cleaned)
            }
            prefs(context).edit().putString(KEY_MOTIVATION, output.toString()).commit()
        } catch (_: Exception) { false }
    }

    fun motivationForAlarm(context: Context, id: String): Pair<String, String> {
        val data = try {
            JSONObject(prefs(context).getString(KEY_MOTIVATION, "{}") ?: "{}")
        } catch (_: Exception) { JSONObject() }
        fun choose(name: String): String {
            val pool = data.optJSONArray(name) ?: return ""
            if (pool.length() == 0) return ""
            val key = id.hashCode().toLong() + LocalDate.now().toEpochDay() +
                if (name == "phrases") 43L else 0L
            return pool.optString(Math.floorMod(key, pool.length().toLong()).toInt(), "")
                .take(180)
        }
        return Pair(choose("affirmations"), choose("phrases"))
    }

    fun wallpaper(context: Context): String =
        prefs(context).getString(KEY_WALLPAPER, "") ?: ""

    fun rememberWallpaper(context: Context, path: String): Boolean {
        // Only bundled app images; never let user/HTML input read arbitrary files.
        if (!Regex("^assets/[A-Za-z0-9_./-]{1,240}\\.(?i:jpg|jpeg|png|webp)$").matches(path) ||
            path.contains("..")) return false
        prefs(context).edit().putString(KEY_WALLPAPER, path).apply()
        return true
    }

    /** The web file picker never grants arbitrary filesystem access to JavaScript.
     * We validate MIME, bound the file to 6 MiB, and copy it to private app storage
     * so OS alarm delivery can read it after WebView closes. */
    fun installCustomSound(context: Context, dataUrl: String): JSONObject {
        try {
            if (dataUrl.length > 8_500_000) return JSONObject().put("error", "Audio exceeds 6 MB")
            val delimiter = dataUrl.indexOf(";base64,")
            if (!dataUrl.startsWith("data:audio/") || delimiter < 6) return JSONObject().put("error", "Unsupported audio")
            val mime = dataUrl.substring(5, delimiter).lowercase()
            val ext = when (mime) {
                "audio/mpeg", "audio/mp3", "audio/x-mpeg" -> "mp3"
                "audio/wav", "audio/x-wav", "audio/wave" -> "wav"
                "audio/ogg" -> "ogg"
                else -> return JSONObject().put("error", "Only MP3, WAV and OGG allowed")
            }
            val bytes = Base64.decode(dataUrl.substring(delimiter + 8), Base64.DEFAULT)
            if (bytes.size !in 128..(6 * 1024 * 1024)) return JSONObject().put("error", "Invalid audio size")
            val validHeader = when(ext){
                "mp3" -> (bytes.size >= 3 && String(bytes, 0, 3, Charsets.US_ASCII) == "ID3") ||
                    (bytes.size >= 2 && bytes[0] == 0xFF.toByte() && (bytes[1].toInt() and 0xE0) == 0xE0)
                "wav" -> bytes.size > 12 && String(bytes, 0, 4, Charsets.US_ASCII) == "RIFF" &&
                    String(bytes, 8, 4, Charsets.US_ASCII) == "WAVE"
                else -> bytes.size > 4 && String(bytes, 0, 4, Charsets.US_ASCII) == "OggS"
            }
            if (!validHeader) return JSONObject().put("error", "Audio header does not match file type")
            val dir = File(context.filesDir, "personal-alarm-audio").apply { mkdirs() }
            val output = File(dir, "custom.$ext")
            val staging = File(dir, "custom.staging")
            staging.writeBytes(bytes)
            if (!staging.renameTo(output)) { staging.delete(); return JSONObject().put("error", "Could not save audio") }
            // Preserve the previous audio until replacement is verified.
            if (!prefs(context).edit().putString(KEY_CUSTOM_FILE, output.name).commit())
                return JSONObject().put("error", "Could not persist audio selection")
            dir.listFiles()?.filter { it.name.startsWith("custom.") && it.name != output.name }
                ?.forEach { it.delete() }
            return JSONObject().put("ok", true).put("bytes", bytes.size)
        } catch (_: Exception) { return JSONObject().put("error", "Audio import failed") }
    }

    /** Per-alarm sound used by the native overlay and the lock-screen Activity.
     * The notification channel remains the OS-safe fallback when not authorized. */
    fun alarmSoundUri(context: Context, alarmId: String): Uri? {
        val items = list(context)
        for (i in 0 until items.length()) {
            val item = items.optJSONObject(i) ?: continue
            if (item.optString("id") == alarmId)
                return soundUri(context, item.optString("sound", "system"))
        }
        return soundUri(context, "system")
    }

    fun soundUri(context: Context, selected: String): Uri? {
        val dir = File(context.filesDir, "personal-alarm-audio")
        if (selected == "custom") {
            val name = prefs(context).getString(KEY_CUSTOM_FILE, "") ?: ""
            if (!Regex("^custom\\.(mp3|wav|ogg)$").matches(name)) return defaultSound()
            val file = File(dir, name)
            return if (file.isFile && file.length() > 128L) Uri.fromFile(file) else defaultSound()
        }
        if (selected in setOf("classic","soft","digital","gentle","pulse","radar")) {
            return try {
                dir.mkdirs()
                val file = File(dir, "preset-v3-$selected.wav")
                synchronized(presetRenderLock) {
                    if (!file.isFile || file.length() < 44L + 24L * 22050L * 4L) {
                        // Commit completed PCM atomically: no partial or old v2 file.
                        val pending = File(dir, "preset-v3-$selected.wav.partial")
                        try {
                            generatePreset(pending, selected)
                            if (!pending.renameTo(file)) {
                                pending.copyTo(file, overwrite = true)
                                pending.delete()
                            }
                        } finally { if (pending.exists()) pending.delete() }
                    }
                }
                Uri.fromFile(file)
            } catch (_: Exception) { defaultSound() }
        }
        return defaultSound()
    }

    private fun defaultSound(): Uri? =
        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

    /** Michel's Life exclusive soundscapes v3.
     * 24 seconds, 22.05 kHz stereo PCM, four changing harmonic chapters;
     * no third-party audio and no network at alarm time. Cache is versioned,
     * so v2 calculator-like clips are never reused by the upgraded app.
     * The actual selection IDs and all native alarm scheduling stay intact. */
    private data class SoundScene(
        val roots: DoubleArray, val minor: Boolean, val pattern: IntArray,
        val offsets: DoubleArray, val timbre: String, val drift: Double, val accent: Double
    )
    private val presetRenderLock = Any()

    private fun scene(id: String): SoundScene = when (id) {
        "classic" -> SoundScene(doubleArrayOf(174.61,130.81,146.83,174.61),false,
            intArrayOf(2,4,3,1,2,4,3),doubleArrayOf(.17,1.02,1.89,2.83,3.71,4.53,5.27),"bell",.17,.90)
        "soft" -> SoundScene(doubleArrayOf(146.83,116.54,130.81,146.83),true,
            intArrayOf(3,4,2,3,4),doubleArrayOf(.28,1.55,2.73,3.9,5.15),"glass",.26,.72)
        "digital" -> SoundScene(doubleArrayOf(164.81,130.81,146.83,164.81),true,
            intArrayOf(4,2,3,1,2,4,3,2,4),doubleArrayOf(.14,.67,1.23,1.82,2.49,3.18,3.84,4.51,5.19),"shimmer",.38,.92)
        "gentle" -> SoundScene(doubleArrayOf(130.81,174.61,146.83,196.00),false,
            intArrayOf(1,2,3,4),doubleArrayOf(.42,1.78,3.28,4.8),"bell",.14,.78)
        "pulse" -> SoundScene(doubleArrayOf(110.00,87.31,98.00,110.00),true,
            intArrayOf(2,3,4,1,3),doubleArrayOf(.32,1.14,2.66,4.12,5.09),"bell",.23,.83)
        "radar" -> SoundScene(doubleArrayOf(82.41,110.00,98.00,82.41),true,
            intArrayOf(3,2,4,1),doubleArrayOf(.22,1.65,3.31,4.82),"shimmer",.45,.77)
        else -> scene("gentle")
    }

    private fun generatePreset(file: File, preset: String) {
        val sampleRate = 22050
        val durationSeconds = 24
        val samples = sampleRate * durationSeconds
        val score = scene(preset)
        val left = FloatArray(samples)
        val right = FloatArray(samples)
        val chord = if (score.minor) doubleArrayOf(1.0,1.18921,1.49831,1.78180,2.24492)
                    else doubleArrayOf(1.0,1.25992,1.49831,2.0,2.24492)

        fun voice(start: Double, length: Double, hz: Double,
                  level: Double, kind: String, pan: Double) {
            if (length <= 0.0 || hz <= 0.0 || level <= 0.0) return
            val from = kotlin.math.max(0, kotlin.math.ceil(start * sampleRate).toInt())
            val to = kotlin.math.min(samples, kotlin.math.floor((start + length) * sampleRate).toInt())
            val leftGain = kotlin.math.sqrt((1.0 - pan) * .5)
            val rightGain = kotlin.math.sqrt((1.0 + pan) * .5)
            val attack = when (kind) {
                "pad" -> .88
                "sub" -> .11
                "swell" -> .9
                else -> .018
            }
            val release = when (kind) {
                "pad", "swell" -> 1.2
                "sub" -> .22
                else -> .55
            }
            for (i in from until to) {
                val t = i.toDouble() / sampleRate - start
                val envelope = kotlin.math.min(1.0,t / attack) *
                        kotlin.math.min(1.0,(length - t) / release)
                if (envelope <= 0.0) continue
                val angle = 2.0 * PI * hz *
                        (t + .0018 * sin(2.0 * PI * score.drift * t))
                val wave = when (kind) {
                    "pad" -> sin(angle) + .25 * sin(angle * 2.002 + .4) +
                        .07 * sin(angle * 3.014 + .9)
                    "sub" -> sin(angle) + .13 * sin(angle * 2.0)
                    "glass" -> sin(angle) + .36 * sin(angle * 2.76 + .5) +
                        .11 * sin(angle * 4.18)
                    "shimmer", "swell" -> sin(angle) + .31 * sin(angle * .997 + .8) +
                        .12 * sin(angle * 1.503)
                    else -> sin(angle) + .36 * sin(angle * 2.009 + .45) +
                        .12 * sin(angle * 3.981)
                }
                val tail = if (kind == "bell" || kind == "glass" || kind == "shimmer")
                    kotlin.math.exp(-t / (if (kind == "glass") 1.23 else 1.75))
                    else 1.0
                val value = wave * envelope * tail * level
                left[i] = (left[i] + value * leftGain).toFloat()
                right[i] = (right[i] + value * rightGain).toFloat()
            }
        }

        val pans = doubleArrayOf(-.48,.26,.58,-.34,.41,-.58,.18)
        val pads = doubleArrayOf(-.56,.41,-.24,.62)
        for (bar in 0..3) {
            val start = bar * 6.0
            val root = score.roots[bar]
            for (degree in 0..3)
                voice(start,5.98,root*chord[degree],
                    .064*(if (degree==0) 1.25 else 1.0),"pad",pads[degree])
            voice(start,5.96,root*.5,.060,"sub",-.05)
            voice(start+.65,4.65,root*3.01,.020,"swell",
                if (bar%2==1) .55 else -.55)
            for (step in score.pattern.indices) {
                val t = start+score.offsets[step]
                val hz = root*2*chord[score.pattern[step]]
                val gain = (.10+.028*(if (step%3==0) 1 else 0))*score.accent*
                    (if (bar==3) 1.08 else 1.0)
                val pan = pans[step%pans.size]
                voice(t,2.12,hz,gain,score.timbre,pan)
                voice(t+.31,1.78,hz*.998,gain*.27,score.timbre,-pan*.7)
                voice(t+.64,1.38,hz*1.002,gain*.12,score.timbre,pan*.4)
            }
            if (preset == "pulse") {
                for (beat in doubleArrayOf(.15,1.65,3.15,4.65))
                    voice(start+beat,.80,root*.48,.062,"sub",
                        if (beat%3.0!=0.0) -.30 else .30)
            }
            if (preset == "radar") {
                voice(start+.20,5.4,root*2.26,.038,"swell",-.69)
                voice(start+1.35,4.3,root*2.98,.030,"swell",.69)
            }
        }

        var peak = 0.0
        for (i in 0 until samples) {
            val t = i.toDouble()/sampleRate
            val rise = .64+.36*kotlin.math.min(1.0,t/18.0)
            val edge = kotlin.math.min(1.0,kotlin.math.min(t/.21,(durationSeconds-t)/.34))
            left[i] = (kotlin.math.tanh(left[i].toDouble()*rise)*edge).toFloat()
            right[i] = (kotlin.math.tanh(right[i].toDouble()*rise)*edge).toFloat()
            peak = kotlin.math.max(peak,
                kotlin.math.max(kotlin.math.abs(left[i].toDouble()),
                    kotlin.math.abs(right[i].toDouble())))
        }
        val master = if (peak>0.0) .81/peak else 1.0

        // RIFF PCM stereo: two independent channels for quiet spatial motion.
        val buffer = ByteBuffer.allocate(44 + samples*4).order(ByteOrder.LITTLE_ENDIAN)
        buffer.put("RIFF".toByteArray(Charsets.US_ASCII))
        buffer.putInt(36+samples*4)
        buffer.put("WAVE".toByteArray(Charsets.US_ASCII))
        buffer.put("fmt ".toByteArray(Charsets.US_ASCII))
        buffer.putInt(16)
        buffer.putShort(1.toShort())
        buffer.putShort(2.toShort())
        buffer.putInt(sampleRate)
        buffer.putInt(sampleRate*4)
        buffer.putShort(4.toShort())
        buffer.putShort(16.toShort())
        buffer.put("data".toByteArray(Charsets.US_ASCII))
        buffer.putInt(samples*4)
        for (i in 0 until samples) {
            buffer.putShort((left[i]*master*Short.MAX_VALUE).toInt().coerceIn(
                Short.MIN_VALUE.toInt(),Short.MAX_VALUE.toInt()).toShort())
            buffer.putShort((right[i]*master*Short.MAX_VALUE).toInt().coerceIn(
                Short.MIN_VALUE.toInt(),Short.MAX_VALUE.toInt()).toShort())
        }
        file.writeBytes(buffer.array())
    }

    fun snooze(context: Context, id: String) {
        val original = list(context)
        var selected: JSONObject? = null
        for (index in 0 until original.length()) {
            val entry = original.optJSONObject(index)
            if (entry?.optString("id") == id) { selected = entry;break }
        }
        if (selected == null) return
        // A five-minute snooze is an exact epoch deadline. HH:mm is only a
        // display field; rounding it forward used to delay alarms by ~6 min.
        val dueAt = System.currentTimeMillis() + 5L * 60_000L
        val next = LocalDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(dueAt), ZoneId.systemDefault())
        val replacement = JSONObject()
            .put("id", "s" + System.currentTimeMillis().toString(36))
            .put("label", selected.optString("label"))
            .put("time", next.format(DateTimeFormatter.ofPattern("HH:mm")))
            .put("date", next.toLocalDate().toString())
            .put("dueAt", dueAt)
            .put("repeat", "once")
            .put("sound", selected.optString("sound", "system"))
            .put("days", JSONArray())
            .put("enabled", true)
        if (original.length() >= 80) return
        original.put(replacement)
        sync(context, original)
    }

    private fun notificationAllowed(context: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    fun createChannel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val audio = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
        // Keep the existing v1 channel (and the owner's channel preferences).
        if (manager.getNotificationChannel(CHANNEL) == null) {
            val sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
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
        // Android 8+ channels own their sounds permanently. A Notification.Builder
        // cannot silence an existing audible channel per-notification.
        // Only when the actual immersive MediaPlayer is playing do we use this
        // distinct, persistently silent channel. Locked/no-overlay falls back to
        // the original audible channel with user's settings untouched.
        if (manager.getNotificationChannel(SILENT_CHANNEL) == null) {
            manager.createNotificationChannel(
                NotificationChannel(SILENT_CHANNEL, "Immersive personal alarms", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Visible alarm overlay already plays the selected sound"
                    setSound(null, null)
                    enableVibration(false)
                    lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                }
            )
        }
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
        val sound = input.optString("sound", "system").takeIf {
            it in setOf("system","classic","soft","digital","gentle","pulse","radar","custom")
        } ?: "system"
        val dueAt = input.optLong("dueAt",0L).takeIf {
            repeat == "once" && it > 0L && it < System.currentTimeMillis()+366L*86400000L
        } ?: 0L
        return JSONObject().put("id", id)
            .put("sound", sound).put("dueAt", dueAt)
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
            val precise = item.optLong("dueAt", 0L)
            if (precise > 0L) return precise.takeIf { it > after } ?: 0L
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
            .put("overlayGranted", Settings.canDrawOverlays(context))
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
        if (PersonalAlarmOverlay.isRinging(id)) PersonalAlarmOverlay.stop(context)
        prefs(context).edit().remove(LAST_DELIVERED_PREFIX + id).apply()
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
        prefs(context).edit().putString(KEY_ALARMS, nextList.toString())
            .putLong(LAST_DELIVERED_PREFIX + id, System.currentTimeMillis()).commit()
        // Next recurrence is always scheduled from now, so it never doubles on clock changes.
        if (target.optString("repeat") != "once") {
            schedule(context, target)
        }
        // An explicitly authorized overlay is the only Android-supported route
        // above other UNLOCKED apps; full-screen notifications show a heads-up
        // while unlocked even when their permission is granted.
        val immersiveOverlayActive = PersonalAlarmOverlay.show(
            context, id, target.optString("label"), target.optString("time"))
        if (!notificationAllowed(context)) return
        createChannel(context)
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val open = openIntent(context, id)
        val selectedChannel = if (immersiveOverlayActive &&
            PersonalAlarmOverlay.hasAudibleRingtone(id)) SILENT_CHANNEL else CHANNEL
        val notificationBuilder = Notification.Builder(context, selectedChannel)
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
