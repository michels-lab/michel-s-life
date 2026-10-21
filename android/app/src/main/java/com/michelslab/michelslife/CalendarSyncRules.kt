package com.michelslab.michelslife

import java.security.MessageDigest
import java.time.Instant
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.temporal.ChronoUnit

/**
 * Pure, device-independent safety rules for an eventual opt-in Google Calendar
 * adapter. This file has no Android, Google account, storage, or UI side effects.
 * It does not grant permission or enable calendar sync in the shipped bridge.
 */
internal object CalendarSyncRules {
    const val EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events"
    const val OWNER_KEY = "michelsLifeOwner"
    const val OWNER_VALUE = "michels-life"
    const val MISSION_KEY = "michelsLifeMissionId"
    private const val MAX_ID_LENGTH = 180
    private const val MAX_TITLE_LENGTH = 500

    data class ManagedRemote(val id: String, val properties: Map<String, String>)
    enum class Operation { CREATE, UPDATE }

    fun missionId(value: String): String {
        require(value.isNotBlank() && value.length <= MAX_ID_LENGTH) { "Invalid mission identifier." }
        require(value == value.trim() && value.none { it.isISOControl() }) { "Invalid mission identifier." }
        return value
    }

    fun eventId(mission: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(missionId(mission).toByteArray(Charsets.UTF_8))
        // Google's supplied event IDs accept 0-9 and a-v. Hex is a strict subset.
        return "mlv" + digest.joinToString("") { "%02x".format(it) }
    }

    fun title(value: String): String {
        require(value.isNotBlank() && value.length <= MAX_TITLE_LENGTH) { "Invalid calendar title." }
        require(value.none { it.isISOControl() && it != '\n' }) { "Invalid calendar title." }
        return value.trim()
    }

    fun owned(properties: Map<String, String>, mission: String): Boolean =
        properties[OWNER_KEY] == OWNER_VALUE &&
            properties[MISSION_KEY] == missionId(mission)

    fun plan(mission: String, matching: List<ManagedRemote>): Pair<Operation, String> {
        missionId(mission)
        require(matching.size <= 1) { "Duplicate managed Calendar events need manual resolution." }
        if (matching.isEmpty()) return Operation.CREATE to eventId(mission)
        val single = matching.single()
        require(owned(single.properties, mission)) { "Refusing to modify a foreign Calendar event." }
        require(single.id.isNotBlank()) { "Calendar returned a managed event without an identifier." }
        return Operation.UPDATE to single.id
    }

    fun validateTiming(start: String, end: String, allDay: Boolean) {
        if (allDay) {
            val first = LocalDate.parse(start)
            val last = LocalDate.parse(end)
            require(last.isAfter(first)) { "All-day Calendar end must be exclusive." }
            require(ChronoUnit.DAYS.between(first, last) <= 366) { "Calendar duration is too long." }
        } else {
            // OffsetDateTime demands an explicit UTC offset; never guess device zone.
            val first = OffsetDateTime.parse(start).toInstant()
            val last = OffsetDateTime.parse(end).toInstant()
            require(last.isAfter(first)) { "Calendar event end must follow start." }
            require(ChronoUnit.DAYS.between(first, last) <= 366) { "Calendar duration is too long." }
        }
    }

    fun validateReadWindow(start: String, end: String) {
        val first = Instant.parse(start)
        val last = Instant.parse(end)
        require(last.isAfter(first)) { "Invalid Calendar read window." }
        require(ChronoUnit.DAYS.between(first, last) <= 366) { "Calendar read window is too long." }
    }
}
