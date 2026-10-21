package com.michelslab.michelslife

/** Executable pure Kotlin regression suite: no OAuth, provider, device or fixtures. */
fun main() {
    var assertions = 0
    fun ok(value: Boolean, why: String) { check(value) { why }; assertions++ }
    fun blocked(why: String, task: () -> Unit) {
        try { task(); error("Allowed unsafe input: " + why) }
        catch (e: IllegalArgumentException) { assertions++ }
        catch (e: java.time.DateTimeException) { assertions++ }
    }
    val mission = "mission_123"
    val id = CalendarSyncRules.eventId(mission)
    ok(id.matches(Regex("mlv[0-9a-f]{64}")), "Google-safe stable event id")
    ok(id == CalendarSyncRules.eventId(mission), "same mission cannot spawn random IDs")
    ok(id != CalendarSyncRules.eventId("mission_124"), "different missions remain distinct")
    ok(CalendarSyncRules.plan(mission, emptyList()).first == CalendarSyncRules.Operation.CREATE,
        "new mission should create")
    ok(CalendarSyncRules.plan(mission, emptyList()).second == id, "create must be deterministic")
    val tagged = mapOf(CalendarSyncRules.OWNER_KEY to CalendarSyncRules.OWNER_VALUE,
        CalendarSyncRules.MISSION_KEY to mission)
    val existing = CalendarSyncRules.ManagedRemote(id, tagged)
    ok(CalendarSyncRules.owned(tagged, mission), "canonical ownership")
    ok(!CalendarSyncRules.owned(tagged, "another"), "foreign mission rejected")
    ok(!CalendarSyncRules.owned(emptyMap(), mission), "untagged event rejected")
    ok(CalendarSyncRules.plan(mission, listOf(existing)).first == CalendarSyncRules.Operation.UPDATE,
        "single tagged event updates")
    ok(CalendarSyncRules.plan(mission, listOf(existing)).second == id, "existing event keeps id")
    blocked("foreign owner") {
        CalendarSyncRules.plan(mission, listOf(CalendarSyncRules.ManagedRemote(id,
            tagged + (CalendarSyncRules.OWNER_KEY to "other-app"))))
    }
    blocked("foreign mission") {
        CalendarSyncRules.plan(mission, listOf(CalendarSyncRules.ManagedRemote(id,
            tagged + (CalendarSyncRules.MISSION_KEY to "another"))))
    }
    blocked("empty event id") { CalendarSyncRules.plan(mission,
        listOf(CalendarSyncRules.ManagedRemote("", tagged))) }
    blocked("duplicate managed events") { CalendarSyncRules.plan(mission, listOf(existing, existing)) }
    blocked("empty mission id") { CalendarSyncRules.missionId(" ") }
    blocked("trimmed mission id collision") { CalendarSyncRules.missionId(" mission") }
    blocked("control char in mission id") { CalendarSyncRules.missionId("ab\u0000cd") }
    blocked("long mission id") { CalendarSyncRules.missionId("a".repeat(181)) }
    blocked("empty title") { CalendarSyncRules.title(" ") }
    blocked("long title") { CalendarSyncRules.title("x".repeat(501)) }
    blocked("control char in title") { CalendarSyncRules.title("x\u0001y") }
    ok(CalendarSyncRules.title("  Lunch  ") == "Lunch", "safe title trim")
    CalendarSyncRules.validateTiming("2026-10-21", "2026-10-22", true); assertions++
    CalendarSyncRules.validateTiming("2026-10-21T08:00:00-06:00",
        "2026-10-21T09:00:00-06:00", false); assertions++
    blocked("non-exclusive all-day end") {
        CalendarSyncRules.validateTiming("2026-10-21", "2026-10-21", true)
    }
    blocked("inverted all-day dates") {
        CalendarSyncRules.validateTiming("2026-10-22", "2026-10-21", true)
    }
    blocked("missing time offset") {
        CalendarSyncRules.validateTiming("2026-10-21T08:00:00", "2026-10-21T09:00:00", false)
    }
    blocked("equal instants with different zones") {
        CalendarSyncRules.validateTiming("2026-10-21T08:00:00-06:00",
            "2026-10-21T14:00:00Z", false)
    }
    blocked("long event") {
        CalendarSyncRules.validateTiming("2026-10-21", "2028-10-22", true)
    }
    CalendarSyncRules.validateReadWindow("2026-10-21T00:00:00Z", "2026-10-22T00:00:00Z")
    assertions++
    blocked("read invalid window") {
        CalendarSyncRules.validateReadWindow("2026-10-22T00:00:00Z", "2026-10-21T00:00:00Z")
    }
    blocked("oversized read window") {
        CalendarSyncRules.validateReadWindow("2026-10-21T00:00:00Z", "2028-10-21T00:00:00Z")
    }
    println("PASS: " + assertions + " calendar-domain safety assertions")
}
