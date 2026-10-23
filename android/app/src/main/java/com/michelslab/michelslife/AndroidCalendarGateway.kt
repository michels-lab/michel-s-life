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
 * Google Calendar REST boundary for a future explicitly consented Android
 * Calendar sync. Intentionally NOT connected to AndroidBridge until the
 * active Developer Twin PR releases ownership of its bridge/UI files.
 *
 * No tokens are persisted or logged. No arbitrary user events are written.
 * The caller must obtain a calendar.events token via user-driven OAuth.
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
    private val maxResponseChars = 2_000_000

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
            val content = response.body?.string().orEmpty()
            if (!response.isSuccessful) throw HttpFailure(response.code)
            if (content.length > maxResponseChars)
                throw IOException("Google Calendar response exceeded the safe size limit.")
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
        for (event in listAll(accessToken, url)) {
            val privateTags = event.optJSONObject("extendedProperties")?.optJSONObject("private")
            events.put(JSONObject()
                .put("id", event.optString("id"))
                .put("summary", event.optString("summary"))
                .put("start", event.optJSONObject("start"))
                .put("end", event.optJSONObject("end"))
                .put("allDay", event.optJSONObject("start")?.has("date") == true)
                .put("managed", privateTags?.optString(CalendarSyncRules.OWNER_KEY) ==
                    CalendarSyncRules.OWNER_VALUE))
        }
        return JSONObject().put("events", events)
            .put("googleEventCount", events.length())
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
            request(accessToken, "GET", endpoint("calendars", "primary", "events", eventId))
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
                return JSONObject().put("action", "created").put("eventId", created.optString("id"))
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
        val updated = request(accessToken, "PATCH",
            endpoint("calendars", "primary", "events", id), body,
            managedEvent.optString("etag"))
        return JSONObject().put("action", "updated").put("eventId", updated.optString("id"))
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
        if (plan.first == CalendarSyncRules.Operation.CREATE)
            return JSONObject().put("action", "already-absent").put("removed", false)
        val remote = detail(accessToken, plan.second)
            ?: return JSONObject().put("action", "already-absent").put("removed", false)
        requireOwned(remote, mission)
        request(accessToken, "DELETE",
            endpoint("calendars", "primary", "events", plan.second),
            ifMatch = remote.optString("etag"))
        return JSONObject().put("action", "removed").put("removed", true)
    }
}
