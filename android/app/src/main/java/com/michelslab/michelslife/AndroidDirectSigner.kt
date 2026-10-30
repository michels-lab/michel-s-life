package com.michelslab.michelslife

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build

/** Verify the OWN installed APK signer before claiming official Direct updates. */
internal object AndroidDirectSigner {
    @Suppress("DEPRECATION")
    fun isTrusted(context: Context): Boolean = try {
        val pm = context.packageManager
        val flags = if (Build.VERSION.SDK_INT >= 28)
            PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
        val info = if (Build.VERSION.SDK_INT >= 33)
            pm.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(flags.toLong()))
        else pm.getPackageInfo(context.packageName, flags)

        // SigningInfo is API 28+; older devices have the legacy signatures field.
        // Reject multiple, missing, rotated or unknown signers, fail closed.
        val signatures = if (Build.VERSION.SDK_INT >= 28)
            info.signingInfo?.apkContentsSigners else info.signatures
        AndroidDirectCertificate.matchesInstalledSigner(
            signatures?.map { it.toByteArray() }?.toTypedArray()
        )
    } catch (_: Exception) {
        false
    }
}
