#!/usr/bin/env python3
"""GRANADA native Google Drive privacy contract review, synthetic only.

These contract tests inspect the exact Android Kotlin production source and
shareable-key canonical web policy; they do not impersonate a signed APK,
run a Google account or validate physical-device runtime behavior.
"""
import json
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[1]
FRONT=(ROOT/"src/MichelsLife/frontend/index.html").read_text(encoding="utf8")
NATIVE=(ROOT/"android/app/src/main/java/com/michelslab/michelslife/CloudSync.kt").read_text(encoding="utf8")
ANDROID_BRIDGE=(ROOT/"android/app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt").read_text(encoding="utf8")
POLICY=re.search(r'const MLV_SHARED_STORAGE_KEYS=new Set\((\[[^\]]+\])\);',FRONT)
NATIVE_KEYS=re.search(r'private val sharedStorageKeys = setOf\((.*?)\n    \)',NATIVE,re.S)
assert POLICY and NATIVE_KEYS,"Both canonical front end and native allowlists required."
SHARED_WEB=set(json.loads(POLICY.group(1)))
SHARED_NATIVE=set(re.findall(r'"([^"]+)"',NATIVE_KEYS.group(1)))

def segment(start,end):
    a=NATIVE.index(start)
    b=NATIVE.index(end,a+len(start))
    return NATIVE[a:b]

class NativeGoogleDriveBoundaryTests(unittest.TestCase):
    def test_01_match_exact_frontend_allowlist(self):
        self.assertEqual(SHARED_NATIVE,SHARED_WEB)
        self.assertGreater(len(SHARED_NATIVE),10)

    def test_02_exclude_credentials_and_device_state(self):
        for key in ["michelsLife.supabase.session.v30216",
                    "michelsLife.supabase.meta.v30216",
                    "michelsLife.supabase.device.v30216",
                    "michelsLife.supabase.boardOwner.v30218",
                    "michelsLife.supabase.localGuest.v30218",
                    "michelsLife.google.auth","michelsLife.local.notification.id"]:
            self.assertNotIn(key,SHARED_NATIVE)

    def test_03_accept_shareable_journal_theme_progress(self):
        for key in ["vida_rpg_personal_progress_v2",
                    "michelsLife.journal.v30184",
                    "michelsLife.theme.v342","michelsLife.language.v1"]:
            self.assertIn(key,SHARED_NATIVE)

    def test_04_no_unknown_top_level_upload(self):
        source=segment("private fun validateBackup(raw: String, forUpload: Boolean): String", "\n    private fun execute(")
        self.assertIn("if (key !in sharedRootKeys)",source)
        self.assertIn('if (forUpload) throw IllegalArgumentException("Cloud payload contains private or unsupported metadata.")',source)
        self.assertIn("return if (forUpload) raw else filtered.toString()",source)

    def test_05_no_foreign_local_storage_upload(self):
        source=segment("private fun validateBackup(raw: String, forUpload: Boolean): String", "\n    private fun execute(")
        self.assertIn("storedKey !in sharedStorageKeys",source)
        self.assertIn('if (forUpload) throw IllegalArgumentException("Cloud payload contains unsafe device-local storage.")',source)
        self.assertIn("cleanStorage.put(storedKey, storage.getString(storedKey))",source)

    def test_06_size_and_state_shape_checked(self):
        source=segment("private fun validateBackup(raw: String, forUpload: Boolean): String", "\n    private fun execute(")
        self.assertIn("raw.toByteArray(Charsets.UTF_8).size",source)
        self.assertIn("10 * 1024 * 1024",source)
        self.assertIn('root.optJSONObject("state")',source)
        self.assertIn('root.optJSONObject("localStorage")',source)
        self.assertIn("root.optString(" + chr(34) + "app" + chr(34) + ", " + chr(34) + chr(34) + ") != " + chr(34) + "Michel's Life" + chr(34),source)

    def test_07_first_network_call_after_upload_validation(self):
        source=segment("fun sync(accessToken: String, account: String, backupJson: String", "\n    fun overview(")
        call=source.index("validateBackup(backupJson, forUpload = true)")
        network=source.index("findCloudFile(accessToken)")
        self.assertLess(call,network)
        self.assertIn('uploadCloudFile(accessToken, remote?.id, backupJson',source)

    def test_08_restore_sanitizes_legacy_but_keeps_remote_hash(self):
        source=segment("fun restoreCloudBackup(accessToken: String, fileId: String)", "\n    private fun conflict(")
        self.assertIn("val safeContent = validateBackup(content, forUpload = false)",source)
        self.assertIn('.put("backupJson", safeContent)',source)
        self.assertIn("val hash = hashText(content)",source)

    def test_09_automatic_cloud_download_does_not_replay_device_keys(self):
        source=segment("private fun downloadCloudFile", "\n    private fun downloadText(")
        self.assertIn("validateBackup(content, forUpload = false)",source)
        self.assertIn("return safeContent to hashText(content)",source)

    def test_10_before_overwrite_backup_is_mandatory(self):
        source=segment("private fun createHistoryBackup", "\n    private fun pruneBackups(")
        self.assertIn("uploadJson(accessToken, null, name, current.first, props)",source)
        self.assertNotIn("catch (_: Exception)",source)
        self.assertNotIn("catch (",source)

    def test_11_history_hash_matches_sanitized_bytes(self):
        source=segment("private fun createHistoryBackup", "\n    private fun pruneBackups(")
        self.assertIn('put("michelsLifeHash", hashText(current.first))',source)
        self.assertNotIn('put("michelsLifeHash", current.second)',source)

    def test_12_no_native_login_bypass_or_session_copy(self):
        self.assertIn('"cloudSync"',ANDROID_BRIDGE)
        self.assertIn('"cloudRestoreBackup"',ANDROID_BRIDGE)
        boundary=segment("private fun validateBackup(raw: String, forUpload: Boolean): String", "\n    private fun execute(")
        self.assertNotIn("localStorage.setItem",boundary)
        self.assertNotIn("SESSION_KEY",boundary)
        self.assertNotIn("accessToken",boundary)

if __name__=="__main__":
    unittest.main()
