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
    private const val SCHEDULED_PREFIX = "scheduledOccurrence."
    internal const val EXTRA_OCCURRENCE = "scheduledOccurrence"
    private const val CHANNEL = "michelslife-personal-alarms-v1"
    private const val SILENT_CHANNEL = "michelslife-personal-alarms-immersive-v1"
    private const val ACTION = "com.michelslab.michelslife.PERSONAL_ALARM"
    const val EXTRA_OPEN_ALARM = "com.michelslab.michelslife.OPEN_PERSONAL_ALARM"
    private val timePattern = Regex("^(?:[01]\\d|2[0-3]):[0-5]\\d$")
    private val idPattern = Regex("^[A-Za-z0-9_-]{1,64}$")
    private val formatter = DateTimeFormatter.ISO_LOCAL_DATE

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun readRegistry(context: Context): JSONArray =
        JSONArray(prefs(context).getString(KEY_ALARMS, "[]") ?: "[]")

    fun list(context: Context): JSONArray =
        try { readRegistry(context) } catch (_: Exception) { JSONArray() }

    @Synchronized
    fun registrySnapshot(context: Context): String = readRegistry(context).toString()

    @Synchronized
    fun syncIfUnchanged(context: Context, input: JSONArray, expected: String): JSONObject {
        // Delivery may disable a one-time alarm while the WebView is editing.
        // Do not overwrite a newer native registry with an old whole-list copy.
        if (registrySnapshot(context) != expected)
            return JSONObject().put("error", "Alarm list changed; reload before editing")
        return sync(context, input)
    }

    fun wasDelivered(context: Context, id: String): Boolean {
        if (!idPattern.matches(id)) return false
        val at = prefs(context).getLong(LAST_DELIVERED_PREFIX + id, 0L)
        if (at <= 0L || System.currentTimeMillis() - at !in 0..15 * 60 * 1000L) return false
        val registry = try { readRegistry(context) } catch (_: Exception) { return false }
        return (0 until registry.length()).any { registry.optJSONObject(it)?.optString("id") == id }
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
        return Pair(choose("affirmations").ifBlank { "Actúo con propósito, un paso a la vez." },
            choose("phrases").ifBlank { "Una sesión. Un paso que importa." })
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

    /** Import a user-selected file in bounded transport chunks, with no fixed total limit.
     * The active audio is never overwritten before the complete file is verified. */
    private const val AUDIO_CHUNK_BYTES = 256 * 1024
    private data class AudioImport(val token: String, val extension: String, val expected: Long, val file: File, var written: Long = 0L)
    private var audioImport: AudioImport? = null
    private fun audioError(message: String) = JSONObject().put("error", message)
    @Synchronized
    fun beginCustomSound(context: Context, extension: String, sizeText: String): JSONObject {
        val size = sizeText.toLongOrNull() ?: return audioError("Invalid audio size")
        if (extension !in setOf("mp3", "wav", "ogg") || size < 128L) return audioError("Invalid audio file")
        return try {
            val dir = File(context.filesDir, "personal-alarm-audio").apply { mkdirs() }
            audioImport?.file?.delete()
            audioImport = null
            dir.listFiles()?.filter { it.name.startsWith("import-") && it.name.endsWith(".part") }?.forEach { it.delete() }
            if (dir.usableSpace < size) return audioError("Not enough available storage")
            val token = java.util.UUID.randomUUID().toString()
            val staging = File(dir, "import-$token.part")
            if (!staging.createNewFile()) return audioError("Could not create audio staging file")
            audioImport = AudioImport(token, extension, size, staging)
            JSONObject().put("ok", true).put("token", token)
        } catch (_: Exception) { audioError("Could not start audio import") }
    }
    @Synchronized
    fun appendCustomSound(token: String, offsetText: String, encoded: String): JSONObject {
        val transfer = audioImport ?: return audioError("No audio import in progress")
        if (transfer.token != token) return audioError("Invalid audio transfer")
        val offset = offsetText.toLongOrNull()
        if (offset != transfer.written || encoded.length > ((AUDIO_CHUNK_BYTES + 2) / 3) * 4)
            return audioError("Invalid audio chunk sequence")
        return try {
            val bytes = Base64.decode(encoded, Base64.NO_WRAP)
            if (bytes.isEmpty() || bytes.size > AUDIO_CHUNK_BYTES || bytes.size.toLong() > transfer.expected - transfer.written)
                return audioError("Invalid audio chunk")
            transfer.file.appendBytes(bytes)
            transfer.written += bytes.size.toLong()
            JSONObject().put("ok", true).put("written", transfer.written.toString())
        } catch (_: Exception) { audioError("Could not write audio; check available storage") }
    }
    @Synchronized
    fun cancelCustomSound(token: String): Boolean {
        val transfer = audioImport ?: return false
        if (transfer.token != token) return false
        transfer.file.delete()
        audioImport = null
        return true
    }
    @Synchronized
    fun finishCustomSound(context: Context, token: String): JSONObject {
        val transfer = audioImport ?: return audioError("No audio import in progress")
        if (token != transfer.token) return audioError("Invalid audio transfer")
        var output: File? = null
        var published = false
        return try {
            if (transfer.written != transfer.expected || transfer.file.length() != transfer.expected)
                return audioError("Incomplete audio import")
            val header = ByteArray(12)
            val count = transfer.file.inputStream().use { it.read(header) }
            val validHeader = when (transfer.extension) {
                "mp3" -> (count >= 3 && String(header, 0, 3, Charsets.US_ASCII) == "ID3") ||
                    (count >= 2 && header[0] == 0xFF.toByte() && (header[1].toInt() and 0xE0) == 0xE0)
                "wav" -> count >= 12 && String(header, 0, 4, Charsets.US_ASCII) == "RIFF" &&
                    String(header, 8, 4, Charsets.US_ASCII) == "WAVE"
                else -> count >= 4 && String(header, 0, 4, Charsets.US_ASCII) == "OggS"
            }
            if (!validHeader) return audioError("Audio header does not match file type")
            val media = android.media.MediaMetadataRetriever()
            try {
                media.setDataSource(transfer.file.absolutePath)
                val duration = media.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull()
                if (duration == null || duration <= 0L) return audioError("Audio cannot be decoded")
            } finally { media.release() }
            val target = File(transfer.file.parentFile, "custom-$token.${transfer.extension}")
            output = target
            if (!transfer.file.renameTo(target)) return audioError("Could not save audio")
            if (!prefs(context).edit().putString(KEY_CUSTOM_FILE, target.name).commit())
                return audioError("Could not persist audio selection")
            published = true
            // Old files are deleted only after the new selection was persisted.
            target.parentFile?.listFiles()?.filter { (it.name.startsWith("custom.") || it.name.startsWith("custom-")) && it.name != target.name }?.forEach { it.delete() }
            JSONObject().put("ok", true).put("bytes", transfer.written.toString())
        } catch (_: Exception) { audioError("Audio import failed") }
        finally {
            if (!published) output?.delete()
            transfer.file.delete()
            audioImport = null
        }
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

    // One native playback catalog also owns persistence validation.
    private fun recordedResource(selected: String): Int = when (selected) {
        "mozart_k545" -> R.raw.mlv_focus_mozart_k545
        "tchaikovsky_op39" -> R.raw.mlv_focus_tchaikovsky_op39
        "sb_meanwhile" -> R.raw.mlv_focus_sb_meanwhile
        "sb_moonlight" -> R.raw.mlv_focus_sb_moonlight
        "sb_cobalt" -> R.raw.mlv_focus_sb_cobalt
        "sb_skyward" -> R.raw.mlv_focus_sb_skyward
        "sb_life_is" -> R.raw.mlv_focus_sb_life_is
        "sb_first_snow" -> R.raw.mlv_focus_sb_first_snow
        "sb_midsommar" -> R.raw.mlv_focus_sb_midsommar
        "sb_at_the_end_of_all_things" -> R.raw.mlv_focus_sb_at_the_end_of_all_things
        "sb_in_this_moment" -> R.raw.mlv_focus_sb_in_this_moment
        "sb_hyperion" -> R.raw.mlv_focus_sb_hyperion
        "sb_ascension" -> R.raw.mlv_focus_sb_ascension
        "sb_bring_me_the_sky" -> R.raw.mlv_focus_sb_bring_me_the_sky
        "debussy_clair_de_lune" -> R.raw.mlv_focus_debussy_clair_de_lune
        "chopin_nocturne_op9" -> R.raw.mlv_focus_chopin_nocturne_op9
        "satie_gymnopedie_1" -> R.raw.mlv_focus_satie_gymnopedie_1
        "bach_prelude_bwv846" -> R.raw.mlv_focus_bach_prelude_bwv846
        else -> 0
    }

    private val generatedSounds = setOf("classic","soft","digital","gentle","pulse","radar",
        "focus_moonlight","focus_celestial","focus_orbit","focus_aurora",
        "focus_observatory","focus_library","focus_afterglow","focus_silver")

    private fun normalizeSound(selected: String): String =
        if (selected == "system" || selected == "custom" ||
            selected in generatedSounds || recordedResource(selected) != 0) selected else "system"

    fun soundUri(context: Context, selected: String): Uri? {
        val dir = File(context.filesDir, "personal-alarm-audio")
        val recorded = recordedResource(selected)
        if (recorded != 0) return Uri.parse("android.resource://" + context.packageName + "/" + recorded)
        if (selected == "custom") {
            val name = prefs(context).getString(KEY_CUSTOM_FILE, "") ?: ""
            if (!Regex("^custom(?:-[a-f0-9-]{36})?\\.(mp3|wav|ogg)$").matches(name)) return defaultSound()
            val file = File(dir, name)
            return if (file.isFile && file.length() > 128L) Uri.fromFile(file) else defaultSound()
        }
        if (selected in generatedSounds) {
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
        val offsets: DoubleArray, val timbre: String, val drift: Double, val accent: Double,
        val phrases: Array<Array<String>>? = null,
        val ambientNotes: DoubleArray? = null
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
        // Native offline 24s arrangements of the eight original Focus motifs.
        "focus_moonlight" -> SoundScene(doubleArrayOf(220.0,174.61,196.0,220.0),false,
            intArrayOf(0,2,1,3,2),doubleArrayOf(),"glass",.16,.73,
            ambientNotes=doubleArrayOf(220.0,329.63,440.0,493.88))
        "focus_celestial" -> SoundScene(doubleArrayOf(196.0,174.61,220.0,196.0),false,
            intArrayOf(0,3,2,1,3),doubleArrayOf(),"shimmer",.22,.78,
            ambientNotes=doubleArrayOf(196.0,293.66,392.0,587.33))
        "focus_orbit" -> SoundScene(doubleArrayOf(174.61,146.83,196.0,174.61),true,
            intArrayOf(1,2,0,2,3,2),doubleArrayOf(),"glass",.31,.72,
            ambientNotes=doubleArrayOf(174.61,261.63,349.23,523.25))
        "focus_aurora" -> SoundScene(doubleArrayOf(164.81,146.83,174.61,164.81),true,
            intArrayOf(3,2,1,0,1),doubleArrayOf(),"shimmer",.28,.75,
            ambientNotes=doubleArrayOf(164.81,246.94,329.63,493.88))
        "focus_observatory" -> SoundScene(doubleArrayOf(146.83,130.81,164.81,146.83),false,
            intArrayOf(0,1,3,2,0),doubleArrayOf(),"bell",.13,.75,
            ambientNotes=doubleArrayOf(146.83,220.0,293.66,440.0))
        "focus_library" -> SoundScene(doubleArrayOf(130.81,116.54,146.83,130.81),true,
            intArrayOf(0,2,1,0,3,1),doubleArrayOf(),"glass",.18,.69,
            ambientNotes=doubleArrayOf(130.81,196.0,261.63,392.0))
        "focus_afterglow" -> SoundScene(doubleArrayOf(174.61,164.81,196.0,174.61),false,
            intArrayOf(2,3,1,0,2),doubleArrayOf(),"bell",.19,.77,
            ambientNotes=doubleArrayOf(174.61,220.0,349.23,440.0))
        "focus_silver" -> SoundScene(doubleArrayOf(196.0,174.61,220.0,196.0),true,
            intArrayOf(3,1,2,0,3,2),doubleArrayOf(),"glass",.23,.79,
            ambientNotes=doubleArrayOf(196.0,246.94,392.0,493.88))
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
        val semitones = mapOf('C' to 0,'D' to 2,'E' to 4,'F' to 5,
            'G' to 7,'A' to 9,'B' to 11)
        fun pitch(note: String): Double {
            if (note.length !in 2..3) return 0.0
            val base = semitones[note[0]] ?: return 0.0
            val octave = note.last().toString().toIntOrNull() ?: return 0.0
            val midi = 12 * (octave + 1) + base + if (note.contains('#')) 1 else 0
            return 440.0 * Math.pow(2.0,(midi-69)/12.0)
        }
        for (bar in 0..3) {
            val start = bar * 6.0
            val root = score.roots[bar]
            for (degree in 0..3)
                voice(start,5.98,root*chord[degree],
                    .064*(if (degree==0) 1.25 else 1.0),"pad",pads[degree])
            voice(start,5.96,root*.5,.060,"sub",-.05)
            voice(start+.65,4.65,root*3.01,.020,"swell",
                if (bar%2==1) .55 else -.55)
            val phrase = score.phrases?.get(bar)
            val notes = score.ambientNotes
            val melodyCount = phrase?.size ?: score.pattern.size
            for (step in 0 until melodyCount) {
                val t = when {
                    phrase != null -> start+.18+step*5.34/phrase.size
                    notes != null -> start+.20+step*5.4/score.pattern.size
                    else -> start+score.offsets[step]
                }
                val hz = when {
                    phrase != null -> pitch(phrase[step])
                    notes != null -> notes[score.pattern[step]]
                    else -> root*2*chord[score.pattern[step]]
                }
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

    @Synchronized
    fun snooze(context: Context, id: String): Boolean {
        if (!wasDelivered(context, id)) return false
        val original = try { readRegistry(context) } catch (_: Exception) { return false }
        val originalRaw = original.toString()
        val deliveryKey = LAST_DELIVERED_PREFIX + id
        val deliveredAt = prefs(context).getLong(deliveryKey, 0L)
        var selected: JSONObject? = null
        for (index in 0 until original.length()) {
            val entry = original.optJSONObject(index)
            if (entry?.optString("id") == id) { selected = entry;break }
        }
        if (selected == null) return false
        // A five-minute snooze is an exact epoch deadline. HH:mm is only a
        // display field; rounding it forward used to delay alarms by ~6 min.
        val dueAt = System.currentTimeMillis() + 5L * 60_000L
        val next = LocalDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(dueAt), ZoneId.systemDefault())
        val replacement = JSONObject()
            .put("id", "s" + java.util.UUID.randomUUID().toString())
            .put("label", selected.optString("label"))
            .put("time", next.format(DateTimeFormatter.ofPattern("HH:mm")))
            .put("date", next.toLocalDate().toString())
            .put("dueAt", dueAt)
            .put("repeat", "once")
            .put("sound", selected.optString("sound", "system"))
            .put("days", JSONArray())
            .put("enabled", true)
        if (original.length() >= 80) return false
        original.put(replacement)
        // Claim this delivered occurrence once and persist only the new snooze.
        // Scheduling a snooze must not touch unrelated delayed alarms.
        val replacementId = replacement.getString("id")
        try {
            // Arm the new identity before committing both the registry and
            // the acknowledgement. A crash cannot persist an unarmed snooze.
            armOccurrence(context, replacementId, dueAt)
            val saved = prefs(context).edit().putString(KEY_ALARMS, original.toString())
                .putLong(SCHEDULED_PREFIX + replacementId, dueAt)
                .remove(deliveryKey).commit()
            if (saved) return true
        } catch (_: Exception) { }
        retireOccurrence(context, replacementId, dueAt)
        prefs(context).edit().putString(KEY_ALARMS, originalRaw)
            .remove(SCHEDULED_PREFIX + replacementId)
            .putLong(deliveryKey, deliveredAt).commit()
        return false
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
        val sound = normalizeSound(input.optString("sound", "system"))
        val dueAt = input.optLong("dueAt",0L).takeIf {
            repeat == "once" && it > 0L && it < System.currentTimeMillis()+366L*86400000L
        } ?: 0L
        return JSONObject().put("id", id)
            .put("sound", sound).put("dueAt", dueAt)
            .put("label", input.optString("label").take(60))
            .put("time", time).put("date", date).put("repeat", repeat)
            .put("days", days).put("enabled", input.optBoolean("enabled", false))
    }

    private fun occurrenceIntent(context: Context, id: String, occurrence: Long): Intent =
        Intent(context, PersonalAlarmReceiver::class.java).apply {
            action = ACTION
            // Extras alone do not participate in PendingIntent identity.
            // Preserve the legacy URI only to cancel pre-upgrade alarms.
            data = Uri.parse(if (occurrence > 0L) "michelslife://personal-alarm/$id/$occurrence"
                else "michelslife://personal-alarm/$id")
            putExtra("id", id)
            putExtra(EXTRA_OCCURRENCE, occurrence)
        }

    private fun deliveryIntent(context: Context, id: String, occurrence: Long): PendingIntent =
        PendingIntent.getBroadcast(context, id.hashCode() and Int.MAX_VALUE,
            occurrenceIntent(context, id, occurrence),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    private fun cancelOccurrence(context: Context, id: String, occurrence: Long) {
        val pending = PendingIntent.getBroadcast(context, id.hashCode() and Int.MAX_VALUE,
            occurrenceIntent(context, id, occurrence),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE) ?: return
        (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(pending)
        pending.cancel()
    }

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
        val today = java.time.Instant.ofEpochMilli(after).atZone(zone).toLocalDate()
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
        val occurrence = prefs(context).getLong(SCHEDULED_PREFIX + id, 0L)
        cancelOccurrence(context, id, occurrence)
        if (occurrence > 0L) cancelOccurrence(context, id, 0L)
        prefs(context).edit().remove(SCHEDULED_PREFIX + id).apply()
    }

    private fun sameSchedule(previous: JSONObject, current: JSONObject): Boolean =
        listOf("enabled", "time", "repeat", "date", "days", "dueAt")
            .all { previous.optString(it) == current.optString(it) }

    private fun armOccurrence(context: Context, id: String, date: Long) {
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pending = deliveryIntent(context, id, date)
        var exactScheduled = false
        if (Build.VERSION.SDK_INT < 31 || manager.canScheduleExactAlarms()) {
            try {
                manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, date, pending)
                exactScheduled = true
            } catch (_: SecurityException) { }
        }
        if (!exactScheduled) manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, date, pending)
    }

    private fun retireOccurrence(context: Context, id: String, date: Long) {
        try { cancelOccurrence(context, id, date) }
        catch (e: Exception) { android.util.Log.w("MLVPersonalAlarms", "Could not retire stale occurrence", e) }
    }

    private fun schedule(context: Context, item: JSONObject) {
        if (!item.optBoolean("enabled")) return
        val date = timestamp(item, System.currentTimeMillis())
        if (date <= 0L) return
        val id = item.getString("id")
        val key = SCHEDULED_PREFIX + id
        val previous = prefs(context).getLong(key, 0L)
        try {
            armOccurrence(context, id, date)
            if (!prefs(context).edit().putLong(key, date).commit())
                throw IllegalStateException("Could not persist alarm occurrence")
        } catch (e: Exception) {
            if (previous != date) retireOccurrence(context, id, date)
            val restore = prefs(context).edit()
            if (previous > 0L) restore.putLong(key, previous) else restore.remove(key)
            restore.commit()
            throw e
        }
        if (previous != date) retireOccurrence(context, id, previous)
        if (previous > 0L) retireOccurrence(context, id, 0L)
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

    @Synchronized
    fun sync(context: Context, input: JSONArray): JSONObject {
        if (input.length() > 80) return JSONObject().put("error", "Too many alarms")
        val cleanList = JSONArray()
        val unique = mutableSetOf<String>()
        for (i in 0 until input.length()) {
            val row = input.optJSONObject(i)
                ?: return JSONObject().put("error", "Invalid alarm record")
            val normalized = clean(row)
                ?: return JSONObject().put("error", "Invalid alarm record")
            if (!unique.add(normalized.getString("id")))
                return JSONObject().put("error", "Duplicate alarm identifier")
            cleanList.put(normalized)
        }
        val existing = readRegistry(context)
        val previousById = (0 until existing.length()).mapNotNull { existing.optJSONObject(it) }
            .associateBy { it.optString("id") }
        val currentById = (0 until cleanList.length()).map { cleanList.getJSONObject(it) }
            .associateBy { it.optString("id") }
        val ids = (previousById.keys + currentById.keys).filter { idPattern.matches(it) }
        val oldOccurrences = ids.associateWith { prefs(context).getLong(SCHEDULED_PREFIX + it, 0L) }
        val newOccurrences = linkedMapOf<String, Long>()
        val now = System.currentTimeMillis()
        // Plan every occurrence before touching AlarmManager or preferences.
        for ((id, item) in currentById) {
            if (!item.optBoolean("enabled")) continue
            val old = previousById[id]
            val previous = oldOccurrences[id] ?: 0L
            val next = if (old != null && sameSchedule(old, item) && previous > 0L) previous
                else timestamp(item, now)
            if (next <= 0L) {
                // Old one-shot entries left enabled after a missed alarm must
                // not prevent unrelated edits. Never silently accept a new
                // or deliberately rescheduled one-shot in the past.
                if (old != null && sameSchedule(old, item) && item.optString("repeat") == "once") {
                    item.put("enabled", false)
                    continue
                }
                return JSONObject().put("error", "An enabled alarm has no future occurrence")
            }
            newOccurrences[id] = next
        }
        val armed = mutableListOf<Pair<String, Long>>()
        try {
            createChannel(context)
            // Stage only changed PendingIntents. The receiver is synchronized
            // with this transaction and ignores any uncommitted occurrence.
            for ((id, date) in newOccurrences) {
                if (oldOccurrences[id] == date) continue
                armed.add(id to date)
                armOccurrence(context, id, date)
            }
            val edit = prefs(context).edit().putString(KEY_ALARMS, cleanList.toString())
            for (id in ids) {
                val date = newOccurrences[id]
                if (date != null) edit.putLong(SCHEDULED_PREFIX + id, date)
                else edit.remove(SCHEDULED_PREFIX + id)
            }
            if (!edit.commit()) {
                // SharedPreferences may update memory even when disk commit fails.
                val rollback = prefs(context).edit().putString(KEY_ALARMS, existing.toString())
                for ((id, date) in oldOccurrences) {
                    if (date > 0L) rollback.putLong(SCHEDULED_PREFIX + id, date)
                    else rollback.remove(SCHEDULED_PREFIX + id)
                }
                rollback.commit()
                throw IllegalStateException("Could not persist alarms")
            }
        } catch (e: Exception) {
            for ((id, date) in armed) retireOccurrence(context, id, date)
            android.util.Log.w("MLVPersonalAlarms", "Alarm transaction not committed", e)
            return JSONObject().put("error", "Could not schedule alarms; previous list retained")
        }
        // Commit is complete: retire only replaced or removed identities.
        // A stale OS broadcast cannot ring because its stored marker differs.
        for ((id, previous) in oldOccurrences) {
            if (previous != newOccurrences[id]) retireOccurrence(context, id, previous)
            if (previous > 0L) retireOccurrence(context, id, 0L)
        }
        return status(context).put("count", cleanList.length())
            .put("registry", registrySnapshot(context))
    }

    @Synchronized
    fun recover(context: Context) {
        createChannel(context)
        val all = readRegistry(context)
        val now = System.currentTimeMillis()
        // Android clears its alarm queue on boot. A past single occurrence
        // has no next delivery; keep the historical row but mark it inactive.
        // Do not retroactively ring a missed alarm after boot or clock change.
        val expired = mutableListOf<Pair<String, Long>>()
        for (i in 0 until all.length()) {
            val item = all.optJSONObject(i) ?: continue
            if (item.optBoolean("enabled") && item.optString("repeat") == "once" &&
                timestamp(item, now) <= 0L) {
                val id = item.optString("id")
                if (!idPattern.matches(id)) continue
                expired.add(id to prefs(context).getLong(SCHEDULED_PREFIX + id, 0L))
                item.put("enabled", false)
            }
        }
        if (expired.isNotEmpty()) {
            val edit = prefs(context).edit().putString(KEY_ALARMS, all.toString())
            for ((id, _) in expired) edit.remove(SCHEDULED_PREFIX + id)
            if (!edit.commit()) {
                android.util.Log.w("MLVPersonalAlarms", "Could not persist expired alarm recovery")
                return
            }
            for ((id, previous) in expired) {
                retireOccurrence(context, id, previous)
                if (previous > 0L) retireOccurrence(context, id, 0L)
            }
        }
        for (i in 0 until all.length()) {
            val item = all.optJSONObject(i) ?: continue
            if (item.optBoolean("enabled")) {
                try { schedule(context, item) } catch (e: Exception) {
                    android.util.Log.w("MLVPersonalAlarms", "Could not restore one scheduled alarm", e)
                }
            }
        }
        PersonalAlarmOverlay.restoreRecent(context)
    }

    private const val NOTIFICATION_ID = 4710
    private fun notificationTag(id: String) = "personal-alarm:$id"

    // The existing persisted delivery markers also recover unacknowledged
    // alarms after process death. Never revive an old notification indefinitely.
    internal fun recentDelivered(context: Context): List<JSONObject> {
        val records = list(context)
        return (0 until records.length()).mapNotNull { records.optJSONObject(it) }
            .filter { wasDelivered(context, it.optString("id")) }
            .sortedBy { prefs(context).getLong(LAST_DELIVERED_PREFIX + it.optString("id"), 0L) }
    }

    @Synchronized
    fun dismiss(context: Context, id: String) {
        if (!idPattern.matches(id)) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(notificationTag(id), NOTIFICATION_ID)
        prefs(context).edit().remove(LAST_DELIVERED_PREFIX + id).apply()
        PersonalAlarmOverlay.dismiss(context, id)
        PersonalAlarmOverlay.restoreRecent(context)
    }

    @Synchronized
    fun deliver(context: Context, id: String, occurrence: Long) {
        if (!idPattern.matches(id)) return
        val stored = prefs(context).getLong(SCHEDULED_PREFIX + id, 0L)
        // Dismissal never resets occurrence identity. Ignore obsolete, early or duplicate broadcasts.
        if (occurrence <= 0L || stored != occurrence || occurrence > System.currentTimeMillis()) return
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
        if (!prefs(context).edit().putString(KEY_ALARMS, nextList.toString())
            .remove(SCHEDULED_PREFIX + id)
            .putLong(LAST_DELIVERED_PREFIX + id, System.currentTimeMillis()).commit()) return
        // Next recurrence is always scheduled from now, so it never doubles on clock changes.
        if (target.optString("repeat") != "once") {
            try { schedule(context, target) } catch (e: Exception) {
                android.util.Log.w("MLVPersonalAlarms", "Could not schedule next occurrence", e)
            }
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
        if (!PersonalAlarmOverlay.isQueued(id) && (Build.VERSION.SDK_INT < 34 || manager.canUseFullScreenIntent()))
            notificationBuilder.setFullScreenIntent(open, true)
        manager.notify(notificationTag(id), NOTIFICATION_ID, notificationBuilder.build())
        // The channel carries sound/vibration. Do not bypass the user's blocked
        // channel, DND, or system accessibility preferences with forced media.
    }
}

class PersonalAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "com.michelslab.michelslife.PERSONAL_ALARM") return
        NativePersonalAlarms.deliver(context, intent.getStringExtra("id") ?: "",
            intent.getLongExtra(NativePersonalAlarms.EXTRA_OCCURRENCE, 0L))
    }
}
