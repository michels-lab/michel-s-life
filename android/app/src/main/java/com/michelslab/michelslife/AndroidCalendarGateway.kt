package com.michelslab.michelslife

import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Google Calendar REST boundary for explicit Android per-mission operations.
 * Read views use calendar.events.readonly; individual create/update/removal
 * uses a separate calendar.events OAuth grant after two-tap UI confirmation.
 * No tokens are persisted or logged. Existing foreign events are never
 * modified or deleted; only events with Michel's Life private owner tags.
 * Background/bulk publication is intentionally unavailable on Android.
 */
internal class AndroidCalendarGateway(
    private val http: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
) {
    private val base = "https://www.googleapis.com/calendar/v3".toHttpUrl()
    private val jsonType = "application/json; charset=utf-8".toMediaType()
    private val maxPages = 20
    private val maxEvents = 3000
    private val maxResponseBytes = 2_000_000L

    private class HttpFailure(val status: Int) :
        IOException("Google Calendar request failed (HTTP " + status + ").")

    private fun endpoint(vararg components: String): HttpUrl {
        val builder = base.newBuilder()
        for (component in components) builder.addPathSegment(component)
        return builder.build()
    }

    private fun token(value: String): String {
        require(value.isNotBlank()) { "Google Calendar authorization is required." }
        return value
    }

    private fun request(
        accessToken: String,
        method: String,
        url: HttpUrl,
        body: JSONObject? = null,
        ifMatch: String? = null
    ): JSONObject {
        val builder = Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + token(accessToken))
            .header("Accept", "application/json")
        if (!ifMatch.isNullOrBlank()) builder.header("If-Match", ifMatch)
        val bytes = body?.toString()?.toRequestBody(jsonType)
        val req = when (method) {
            "GET" -> builder.get()
            "POST" -> builder.post(requireNotNull(bytes))
            "PATCH" -> builder.patch(requireNotNull(bytes))
            "DELETE" -> builder.delete()
            else -> throw IllegalArgumentException("Unsupported Calendar operation.")
        }.build()
        http.newCall(req).execute().use { response ->
            if (!response.isSuccessful) throw HttpFailure(response.code)
            // Bound bytes before allocating the response string, including
            // chunked/transparent-gzip responses with unknown content length.
            val source = response.body?.source()
            if (source?.request(maxResponseBytes + 1L) == true)
                throw IOException("Google Calendar response exceeded the safe size limit.")
            val content = source?.readUtf8().orEmpty()
            if (content.isBlank()) {
                if (response.code == 204) return JSONObject()
                throw IOException("Google Calendar returned an empty response.")
            }
            return try { JSONObject(content) }
            catch (_: Exception) { throw IOException("Google Calendar returned invalid JSON.") }
        }
    }

    private fun listAll(accessToken: String, url: HttpUrl): List<JSONObject> {
        val collected = ArrayList<JSONObject>()
        var pageToken = ""
        val visited = HashSet<String>()
        var pages = 0
        do {
            if (++pages > maxPages) throw IOException("Google Calendar pagination exceeded its safe limit.")
            val pageUrl = if (pageToken.isEmpty()) url
                else url.newBuilder().addQueryParameter("pageToken", pageToken).build()
            val payload = request(accessToken, "GET", pageUrl)
            val batch = payload.optJSONArray("items") ?: JSONArray()
            for (i in 0 until batch.length()) {
                val event = batch.optJSONObject(i) ?: continue
                if (event.optString("status") == "cancelled") continue
                if (collected.size == maxEvents)
                    throw IOException("Google Calendar event count exceeded its safe limit.")
                collected.add(event)
            }
            pageToken = payload.optString("nextPageToken")
            if (pageToken.isNotBlank() && !visited.add(pageToken))
                throw IOException("Google Calendar returned a repeated page token.")
        } while (pageToken.isNotBlank())
        return collected
    }

    /** Real provider read, capped and with explicit UTC time-window bounds. */
    fun readEvents(accessToken: String, fromUtc: String, toUtc: String): JSONObject {
        CalendarSyncRules.validateReadWindow(fromUtc, toUtc)
        val url = endpoint("calendars", "primary", "events").newBuilder()
            .addQueryParameter("timeMin", fromUtc)
            .addQueryParameter("timeMax", toUtc)
            .addQueryParameter("singleEvents", "true")
            .addQueryParameter("showDeleted", "false")
            .addQueryParameter("maxResults", "250")
            .addQueryParameter("orderBy", "startTime").build()
        val events = JSONArray()
        var managedCount = 0
        for (event in listAll(accessToken, url)) {
            val privateTags = event.optJSONObject("extendedProperties")?.optJSONObject("private")
            val allDay = event.optJSONObject("start")?.has("date") == true
            val start = event.optJSONObject("start")?.optString(if (allDay) "date" else "dateTime").orEmpty()
            val end = event.optJSONObject("end")?.optString(if (allDay) "date" else "dateTime").orEmpty()
            if (start.isBlank() || end.isBlank()) continue
            val managed = privateTags?.optString(CalendarSyncRules.OWNER_KEY) ==
                CalendarSyncRules.OWNER_VALUE
            if (managed) managedCount++
            // The shared calendar expects a title + ISO string, not Google's
            // nested {date,dateTime} shape. These are read-only view records:
            // no mission, XP, Journal or cloud state is modified here.
            val link = event.optString("htmlLink")
            val safeLink = if (link.startsWith("https://calendar.google.com/") ||
                link.startsWith("https://www.google.com/calendar/")) link
                else "https://calendar.google.com/"
            events.put(JSONObject()
                .put("id", event.optString("id").take(180))
                .put("title", event.optString("summary").take(500))
                .put("start", start)
                .put("end", end)
                .put("allDay", allDay)
                .put("htmlLink", safeLink)
                .put("managed", managed))
        }
        return JSONObject().put("events", events)
            .put("googleEventCount", events.length())
            .put("managedEventCount", managedCount)
            .put("provider", "google-calendar")
    }

    private fun properties(event: JSONObject): Map<String, String> {
        val obj = event.optJSONObject("extendedProperties")?.optJSONObject("private")
            ?: return emptyMap()
        return mapOf(
            CalendarSyncRules.OWNER_KEY to obj.optString(CalendarSyncRules.OWNER_KEY),
            CalendarSyncRules.MISSION_KEY to obj.optString(CalendarSyncRules.MISSION_KEY)
        )
    }

    private fun managed(accessToken: String, mission: String): List<JSONObject> {
        CalendarSyncRules.missionId(mission)
        val url = endpoint("calendars", "primary", "events").newBuilder()
            .addQueryParameter("privateExtendedProperty",
                CalendarSyncRules.MISSION_KEY + "=" + mission)
            .addQueryParameter("showDeleted", "false")
            .addQueryParameter("maxResults", "250").build()
        return listAll(accessToken, url)
    }

    private fun detail(accessToken: String, eventId: String): JSONObject? =
        try {
            request(accessToken, "GET", endpoint("calendars", "primary", "events", eventId)).also {
                CalendarSyncRules.verifyResponseId(eventId, it.optString("id"))
            }
        } catch (e: HttpFailure) {
            if (e.status == 404) null else throw e
        }

    private fun requireOwned(event: JSONObject, mission: String) {
        require(CalendarSyncRules.owned(properties(event), mission)) {
            "Refusing to modify a Google Calendar event not owned by this mission."
        }
    }

    private fun eventBody(
        mission: String, summary: String, start: String, end: String, allDay: Boolean
    ): JSONObject {
        CalendarSyncRules.validateTiming(start, end, allDay)
        val dateKey = if (allDay) "date" else "dateTime"
        return JSONObject()
            .put("summary", CalendarSyncRules.title(summary))
            .put("start", JSONObject().put(dateKey, start))
            .put("end", JSONObject().put(dateKey, end))
            .put("extendedProperties", JSONObject().put("private", JSONObject()
                .put(CalendarSyncRules.OWNER_KEY, CalendarSyncRules.OWNER_VALUE)
                .put(CalendarSyncRules.MISSION_KEY, CalendarSyncRules.missionId(mission))))
    }

    /**
     * Safe, repeatable mission publishing. Deterministic event IDs prevent
     * duplicate creates by concurrent devices; 409 is resolved by verifying
     * real provider ownership, never by overwriting an unrelated event.
     */
    fun upsertMission(
        accessToken: String, mission: String, summary: String,
        start: String, end: String, allDay: Boolean
    ): JSONObject {
        val body = eventBody(mission, summary, start, end, allDay)
        val matches = managed(accessToken, mission)
        val rule = CalendarSyncRules.plan(mission, matches.map {
            CalendarSyncRules.ManagedRemote(it.optString("id"), properties(it))
        })
        var existing = if (rule.first == CalendarSyncRules.Operation.UPDATE) {
            detail(accessToken, rule.second)
                ?: throw IOException("The managed Calendar event disappeared; retry after refreshing.")
        } else {
            detail(accessToken, rule.second)
        }
        if (existing != null) requireOwned(existing, mission)
        if (existing == null) {
            body.put("id", rule.second)
            try {
                val created = request(accessToken, "POST",
                    endpoint("calendars", "primary", "events"), body)
                requireOwned(created, mission)
                return JSONObject().put("action", "created")
                    .put("eventId", CalendarSyncRules.verifyResponseId(rule.second, created.optString("id")))
            } catch (e: HttpFailure) {
                if (e.status != 409) throw e
                existing = detail(accessToken, rule.second)
                    ?: throw IOException("Calendar event ID conflict could not be verified.")
                requireOwned(existing, mission)
            }
        }
        val managedEvent = requireNotNull(existing)
        requireOwned(managedEvent, mission)
        val id = managedEvent.optString("id")
        require(id.isNotBlank()) { "Calendar event is missing an identifier." }
        // Never modify a previously read event without its optimistic lock:
        // omission of an ETag must fail closed instead of overwriting concurrent edits.
        val etag = managedEvent.optString("etag")
        if (etag.isBlank()) throw IOException("Calendar event has no ETag; refresh before editing.")
        // The POST-only deterministic identifier must not leak into a PATCH
        // when a concurrent create returned HTTP 409.
        body.remove("id")
        val updated = request(accessToken, "PATCH",
            endpoint("calendars", "primary", "events", id), body, etag)
        requireOwned(updated, mission)
        return JSONObject().put("action", "updated")
            .put("eventId", CalendarSyncRules.verifyResponseId(id, updated.optString("id")))
    }

    /**
     * Removes only the app's own managed event. Never deletes a foreign
     * calendar entry, even when an event ID or mission key collides.
     */
    fun removeMission(accessToken: String, mission: String): JSONObject {
        val matches = managed(accessToken, mission)
        val plan = CalendarSyncRules.plan(mission, matches.map {
            CalendarSyncRules.ManagedRemote(it.optString("id"), properties(it))
        })
        // A filtered list can lag a concurrent deterministic create. Verify
        // the canonical ID directly, even when the list returned no matches.
        val remote = detail(accessToken, plan.second)
            ?: return JSONObject().put("action", "already-absent").put("removed", false)
        requireOwned(remote, mission)
        val etag = remote.optString("etag")
        if (etag.isBlank()) throw IOException("Calendar event has no ETag; refresh before removal.")
        request(accessToken, "DELETE",
            endpoint("calendars", "primary", "events", plan.second),
            ifMatch = etag)
        return JSONObject().put("action", "removed").put("removed", true)
    }
}
