package com.michelslab.michelslife

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

/**
 * User-authorized alarm-only overlay over unlocked applications.
 *
 * Android 13+ intentionally shows a persistent heads-up notification, rather
 * than launching full-screen activity over an unlocked foreground app.
 * TYPE_APPLICATION_OVERLAY is therefore strictly opt-in and used ONLY while
 * a scheduled personal alarm rings. It is never used by Pomodoro or navigation.
 * On locked devices, the system FullScreenIntent handles the alarm instead.
 */
internal object PersonalAlarmOverlay {
    private var owner: Context? = null
    private var manager: WindowManager? = null
    private var view: FrameLayout? = null
    private var activeId: String? = null
    private var player: MediaPlayer? = null
    private var vibrator: Vibrator? = null

    fun isRinging(id: String): Boolean = activeId == id && view != null

    fun show(context: Context, id: String, title: String, time: String): Boolean {
        val app = context.applicationContext
        if (!Settings.canDrawOverlays(app)) return false
        val locked = (app.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager).isDeviceLocked
        if (locked) return false
        if (activeId == id && view != null) return true
        stop(app)
        try {
            val window = app.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val root = FrameLayout(app)
            root.setBackgroundColor(Color.rgb(7, 12, 22))

            val image = ImageView(app).apply {
                scaleType = ImageView.ScaleType.CENTER_CROP
            }
            val asset = NativePersonalAlarms.wallpaper(app)
            if (asset.isNotEmpty()) {
                try {
                    app.assets.open("app/" + asset).use { stream ->
                        image.setImageBitmap(BitmapFactory.decodeStream(stream))
                    }
                } catch (_: Exception) {
                    // An absent theme asset must never prevent a due alarm.
                }
            }
            root.addView(image, FrameLayout.LayoutParams(-1, -1))
            val shade = View(app)
            shade.background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(0xb0030813.toInt(), 0x65060812, 0xb0030813.toInt())
            )
            root.addView(shade, FrameLayout.LayoutParams(-1, -1))

            val content = LinearLayout(app).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                setPadding(dp(app, 22), dp(app, 40), dp(app, 22), dp(app, 40))
            }
            root.addView(content, FrameLayout.LayoutParams(-1, -1, Gravity.CENTER))

            fun label(text: String, sp: Float, bold: Boolean = false): TextView {
                return TextView(app).apply {
                    this.text = text
                    textSize = sp
                    setTextColor(Color.WHITE)
                    gravity = Gravity.CENTER
                    if (bold) typeface = Typeface.DEFAULT_BOLD
                    setShadowLayer(14f, 0f, 3f, Color.BLACK)
                }
            }
            content.addView(label("MICHEL'S LIFE  ·  ALARMA", 14f, true))
            content.addView(label("⏰", 70f))
            content.addView(label(time, 68f, true))
            content.addView(label(title.ifBlank { "Es la hora" }, 23f, true))
            val (affirmation, phrase) = NativePersonalAlarms.motivationForAlarm(app, id)
            if (affirmation.isNotEmpty()) {
                content.addView(label("AFIRMACIÓN", 10f, true).apply {
                    setPadding(0, dp(app, 15), 0, dp(app, 4))
                    letterSpacing = 0.13f
                })
                content.addView(label(affirmation, 17f, true).apply {
                    maxLines = 3
                    ellipsize = android.text.TextUtils.TruncateAt.END
                    setPadding(dp(app, 8), 0, dp(app, 8), 0)
                })
            }
            if (phrase.isNotEmpty()) {
                content.addView(label("FRASE", 10f, true).apply {
                    setPadding(0, dp(app, 11), 0, dp(app, 4))
                    letterSpacing = 0.13f
                })
                content.addView(label(phrase, 16f).apply {
                    maxLines = 3
                    ellipsize = android.text.TextUtils.TruncateAt.END
                    setPadding(dp(app, 8), 0, dp(app, 8), 0)
                })
            }

            val buttons = LinearLayout(app).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                setPadding(0, dp(app, 28), 0, 0)
            }
            val close = Button(app).apply {
                text = "Descartar"
                minHeight = dp(app, 54)
                setOnClickListener {
                    stop(app)
                    NativePersonalAlarms.dismiss(app, id)
                }
            }
            val snooze = Button(app).apply {
                text = "Posponer 5 min"
                minHeight = dp(app, 54)
                setOnClickListener {
                    NativePersonalAlarms.snooze(app, id)
                    stop(app)
                    NativePersonalAlarms.dismiss(app, id)
                }
            }
            buttons.addView(close)
            buttons.addView(snooze)
            content.addView(buttons)
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                PixelFormat.TRANSLUCENT
            )
            window.addView(root, params)
            owner = app;manager = window;view = root;activeId = id
            startAttention(app)
            // User sees the app wallpaper + alarm UI over ANY foreground app.
            return true
        } catch (e: Exception) {
            stop(app)
            return false // Fall back to OS full-screen / heads-up notification.
        }
    }

    private fun dp(context: Context, value: Int): Int =
        (value * context.resources.displayMetrics.density).toInt()

    private fun startAttention(context: Context) {
        try {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val sound = MediaPlayer()
            sound.setAudioAttributes(AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build())
            sound.setDataSource(context, uri)
            sound.isLooping = true
            sound.prepare()
            sound.start()
            player = sound
        } catch (_: Exception) {
            try { player?.release() } catch (_: Exception) { }
            player = null
        }
        try {
            val motor = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            if (motor.hasVibrator()) {
                motor.vibrate(VibrationEffect.createWaveform(
                    longArrayOf(0, 600, 300, 600, 300), 0
                ))
                vibrator = motor
            }
        } catch (_: Exception) { }
    }

    fun stop(context: Context) {
        try { player?.stop() } catch (_: Exception) { }
        try { player?.release() } catch (_: Exception) { }
        player = null
        try { vibrator?.cancel() } catch (_: Exception) { }
        vibrator = null
        try { view?.let { manager?.removeViewImmediate(it) } } catch (_: Exception) { }
        view = null;manager = null;owner = null;activeId = null
    }
}
