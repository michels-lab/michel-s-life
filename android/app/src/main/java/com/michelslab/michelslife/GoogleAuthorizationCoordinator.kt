package com.michelslab.michelslife

import android.app.Activity
import android.content.Intent
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.AuthorizationResult
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.Scopes
import com.google.android.gms.common.api.Scope

data class AuthSession(val accessToken: String, val grantedScopes: List<String>)

class GoogleAuthorizationCoordinator(private val activity: Activity) {
    companion object {
        private const val REQUEST_AUTH = 4107
    }

    private val client = Identity.getAuthorizationClient(activity)
    private val requestedScopes = listOf(
        Scope(Scopes.DRIVE_APPFOLDER),
        Scope("openid"),
        Scope("email")
    )
    private var pendingCallback: ((Result<AuthSession?>) -> Unit)? = null

    fun authorize(interactive: Boolean, callback: (Result<AuthSession?>) -> Unit) {
        val request = AuthorizationRequest.builder()
            .setRequestedScopes(requestedScopes)
            .build()

        client.authorize(request)
            .addOnSuccessListener { result ->
                if (result.hasResolution()) {
                    if (!interactive) {
                        callback(Result.success(null))
                        return@addOnSuccessListener
                    }
                    val pending = result.pendingIntent
                    if (pending == null) {
                        callback(Result.failure(IllegalStateException("Google authorization needs a resolution but none was provided.")))
                        return@addOnSuccessListener
                    }
                    pendingCallback = callback
                    try {
                        activity.startIntentSenderForResult(
                            pending.intentSender,
                            REQUEST_AUTH,
                            null,
                            0,
                            0,
                            0
                        )
                    } catch (e: Exception) {
                        pendingCallback = null
                        callback(Result.failure(e))
                    }
                } else {
                    callback(sessionFrom(result))
                }
            }
            .addOnFailureListener { callback(Result.failure(it)) }
    }

    fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
        if (requestCode != REQUEST_AUTH) return false
        val callback = pendingCallback
        pendingCallback = null
        if (callback == null) return true
        if (resultCode != Activity.RESULT_OK || data == null) {
            callback(Result.failure(IllegalStateException("Google authorization was cancelled.")))
            return true
        }
        try {
            callback(sessionFrom(client.getAuthorizationResultFromIntent(data)))
        } catch (e: Exception) {
            callback(Result.failure(e))
        }
        return true
    }

    private fun sessionFrom(result: AuthorizationResult): Result<AuthSession?> {
        val token = result.accessToken
        if (token.isNullOrBlank()) return Result.success(null)
        return Result.success(AuthSession(token, result.grantedScopes ?: emptyList()))
    }
}
