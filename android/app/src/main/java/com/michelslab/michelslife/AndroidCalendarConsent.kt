package com.michelslab.michelslife

import android.app.Activity
import android.content.Intent
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.AuthorizationResult
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.api.Scope

/**
 * Separate per-action Google Calendar consent. This does not reuse Drive's
 * app-folder credential, persist tokens, or automatically request permissions.
 *
 * Future bridge integration must forward onActivityResult(requestCode, ...) and
 * verify the resulting Google identity belongs to the currently selected user
 * before any publish/remove action. The bridge/UI are currently owned by #134.
 */
internal class AndroidCalendarConsent(private val activity: Activity) {
    companion object { private const val REQUEST_CALENDAR_CONSENT = 4192 }

    data class Session(val accessToken: String, val grantedScopes: List<String>)
    private val client = Identity.getAuthorizationClient(activity)
    private val scopes = listOf(
        Scope(CalendarSyncRules.READ_SCOPE),
        Scope("openid"),
        Scope("email")
    )
    private var pending: ((Result<Session>) -> Unit)? = null
    private var busy = false

    /** Explicit entry point only. Noninteractive checks must not display consent. */
    fun authorize(interactive: Boolean, callback: (Result<Session?>) -> Unit) {
        if (busy || pending != null) {
            callback(Result.failure(IllegalStateException(
                "A Calendar permission request is already in progress.")))
            return
        }
        busy = true
        val request = AuthorizationRequest.builder().setRequestedScopes(scopes).build()
        client.authorize(request)
            .addOnSuccessListener { result ->
                if (!result.hasResolution()) {
                    busy = false
                    callback(session(result).map { it })
                    return@addOnSuccessListener
                }
                if (!interactive) {
                    busy = false
                    callback(Result.success(null))
                    return@addOnSuccessListener
                }
                val intent = result.pendingIntent
                if (intent == null) {
                    busy = false
                    callback(Result.failure(IllegalStateException(
                        "Google Calendar needs interactive consent.")))
                    return@addOnSuccessListener
                }
                pending = { pendingResult ->
                    busy = false
                    pendingResult.fold(
                        onSuccess = { callback(Result.success(it)) },
                        onFailure = { callback(Result.failure(it)) }
                    )
                }
                try {
                    activity.startIntentSenderForResult(
                        intent.intentSender, REQUEST_CALENDAR_CONSENT, null, 0, 0, 0
                    )
                } catch (e: Exception) {
                    pending = null
                    busy = false
                    callback(Result.failure(e))
                }
            }
            .addOnFailureListener { busy = false; callback(Result.failure(it)) }
    }

    /** Returns true only when this coordinator owns the Android activity result. */
    fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
        if (requestCode != REQUEST_CALENDAR_CONSENT) return false
        val callback = pending
        pending = null
        if (callback == null) { busy = false; return true }
        if (resultCode != Activity.RESULT_OK || data == null) {
            callback(Result.failure(IllegalStateException(
                "Google Calendar permission was declined or cancelled.")))
            return true
        }
        try { callback(session(client.getAuthorizationResultFromIntent(data))) }
        catch (e: Exception) { callback(Result.failure(e)) }
        return true
    }

    private fun session(result: AuthorizationResult): Result<Session> {
        val granted = result.grantedScopes ?: emptyList()
        if (!granted.contains(CalendarSyncRules.READ_SCOPE))
            return Result.failure(SecurityException("Google Calendar read permission was not granted."))
        val access = result.accessToken
        if (access.isNullOrBlank())
            return Result.failure(SecurityException("Google Calendar returned no access token."))
        return Result.success(Session(access, granted))
    }
}
