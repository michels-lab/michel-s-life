#!/usr/bin/env python3
"""Compile and execute the exact production CloudMeta/CloudMetaStore section.
Fake SharedPreferences is in-memory; no Android device, account or provider.
"""
from pathlib import Path
import subprocess
import tempfile

ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/"android/app/src/main/java/com/michelslab/michelslife/CloudSync.kt").read_text()
start=source.index("data class CloudMeta(")
end=source.index("class DriveCloudEngine(",start)
production="package com.michelslab.michelslife\nimport android.content.Context\nimport java.time.Instant\nimport java.util.UUID\n"+source[start:end]
stub=r'''
package android.content
class Context {
    companion object { const val MODE_PRIVATE = 0 }
    private val shared = Preferences()
    fun getSharedPreferences(name: String, mode: Int): Preferences = shared
}
class Preferences {
    private var data = mutableMapOf<String, Any>()
    fun getString(key: String, fallback: String?): String? = data[key] as? String ?: fallback
    fun getLong(key: String, fallback: Long): Long = data[key] as? Long ?: fallback
    fun edit(): Editor = Editor()
    inner class Editor {
        private val edits=mutableMapOf<String, Any?>()
        private var clearAll=false
        fun putString(key: String, value: String?): Editor { edits[key]=value; return this }
        fun putLong(key: String, value: Long): Editor { edits[key]=value; return this }
        fun clear(): Editor { clearAll=true; return this }
        fun commit(): Boolean {
            if(clearAll) data.clear()
            for((key,value) in edits) { if(value==null) data.remove(key) else data[key]=value }
            return true
        }
    }
}
'''
spec=r'''
package com.michelslab.michelslife
import android.content.Context
import java.time.Instant
fun denied(block: () -> Unit) {
    var failed=false
    try { block() } catch (_: IllegalStateException) { failed=true }
    check(failed)
}
fun main() {
    val context=Context()
    val a=CloudMetaStore(context)
    val b=CloudMetaStore(context) // same prefs, separate Activity instances
    val time=Instant.parse("2026-11-27T12:00:00Z")
    val h1="a".repeat(64);val h2="b".repeat(64)
    fun begin(account: String="a@example.invalid"): CloudMeta {
        val snapshot=a.load()
        return a.beginSync(account,null,snapshot.generation,snapshot.dirtyRevision)
    }
    val first=begin()
    a.markDirty(time)
    b.markDirty(time.plusSeconds(1))
    a.commitUploaded(first,h1,time)
    check(a.load().lastSyncedHash==h1 && a.load().lastLocalDirtyAt==time.plusSeconds(1))
    println("PASS late edits and second store survive upload receipt")
    val stale=a.load()
    b.markDirty(time.plusSeconds(2))
    denied { a.beginSync(stale.account,null,stale.generation,stale.dirtyRevision) }
    println("PASS queued stale upload rejected before provider call")
    val request=begin()
    b.resetForDisconnect()
    denied { a.commitUploaded(request,h2,time) }
    denied { a.beginSync(request.account,null,request.generation,request.dirtyRevision) }
    check(a.load().account.isEmpty() && a.load().lastSyncedHash.isEmpty())
    println("PASS disconnect invalidates queued and in-flight receipts")
    val old=begin()
    val other=begin("b@example.invalid")
    denied { a.commitUploaded(old,h1,time) }
    check(a.load().account==other.account)
    println("PASS account switch cannot restore an old baseline")
    val restore=begin("b@example.invalid")
    b.markDirty(time.plusSeconds(3))
    denied { a.registerRestore(restore,h2,time) }
    println("PASS changed local revision rejects stale download")
    val pending=begin("b@example.invalid")
    a.registerRestore(pending,h2,time)
    denied { a.acceptRestore(h1,time) }
    denied { a.acceptRestore(h2,time.plusSeconds(2)) }
    b.markDirty(time.plusSeconds(4))
    a.acceptRestore(h2,time)
    check(a.load().lastSyncedHash==h2 && a.load().lastLocalDirtyAt==time.plusSeconds(4))
    denied { a.acceptRestore(h2,time) }
    println("PASS exact restore receipt, late edit preserved, no duplicate ACK")
    val next=begin("b@example.invalid")
    a.registerRestore(next,h1,time)
    b.resetForDisconnect()
    denied { a.acceptRestore(h1,time) }
    println("PASS stale restore receipt cannot reattach disconnected account")
    println("7/7 actual CloudMetaStore behavioral scenarios passed")
}
'''
with tempfile.TemporaryDirectory() as temp:
    d=Path(temp)
    for name,content in [("CloudMetaStore.kt",production),("AndroidStub.kt",stub),("CloudMetaStoreSpec.kt",spec)]:
        (d/name).write_text(content,encoding="utf-8")
    jar=d/"spec.jar"
    subprocess.run(["kotlinc",str(d/"CloudMetaStore.kt"),str(d/"AndroidStub.kt"),str(d/"CloudMetaStoreSpec.kt"),"-include-runtime","-d",str(jar)],check=True)
    subprocess.run(["java","-jar",str(jar)],check=True)
