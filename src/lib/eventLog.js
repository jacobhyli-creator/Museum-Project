// ===========================================================================
// eventLog.js
// Opt-in behavior logging for the tour (spec Phase 7). EVERYTHING here is a
// no-op unless the visitor is BOTH signed in AND opted in
// (user_accounts.saved_history_opt_in = true). Anonymous or opted-out visitors
// write nothing — their state stays in the browser and is discarded.
//
// Design:
//  * enable({ optedIn }) is called by App after auth/consent resolves. Until
//    then _enabled stays false and every logger returns immediately.
//  * All writes are fire-and-forget and defensively wrapped so a logging
//    failure NEVER interrupts the tour. Errors are swallowed (dev-warned only).
//  * Each interaction writes to its purpose-built table AND mirrors a row into
//    behavior_events (the canonical ML stream). Artwork CODES ("A001") are
//    translated to uuids via the tour adapter's code->uuid map; the stable
//    `artwork_code` is also denormalized so rows survive artwork deletion.
// ===========================================================================

import { supabase, isSupabaseEnabled } from './supabaseClient.js'
import { getCodeToId } from './tourDataAdapter.js'

let _enabled = false // signed-in AND opted-in
let _exhibitionId = null // resolved uuid for behavior_events mirroring

const EXHIBITION_SLUG = 'ways-of-seeing-fourteen-artists'

// Called by App once auth + consent are known. Pass optedIn=false to disable
// (e.g. on sign-out or consent-off) which makes every logger a no-op again.
export function enableEventLogging({ optedIn }) {
  _enabled = isSupabaseEnabled() && optedIn === true
}

export function isEventLoggingEnabled() {
  return _enabled
}

// Resolve (and cache) the toured exhibition's uuid for event rows.
async function exhibitionId() {
  if (_exhibitionId || !_enabled) return _exhibitionId
  const { data } = await supabase
    .from('exhibitions')
    .select('id')
    .eq('slug', EXHIBITION_SLUG)
    .maybeSingle()
  _exhibitionId = data?.id ?? null
  return _exhibitionId
}

async function userId() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id ?? null
}

function codeToUuid(code) {
  return code ? getCodeToId().get(code) ?? null : null
}

// Swallow-and-warn wrapper so logging never throws into the tour.
async function safe(fn) {
  if (!_enabled) return null
  try {
    return await fn()
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[eventLog] write failed:', err?.message || err)
    return null
  }
}

// Mirror one row into the canonical behavior_events stream.
async function mirror({ uid, sessionId, code, eventType, payload }) {
  const exhId = await exhibitionId()
  await supabase.from('behavior_events').insert({
    user_id: uid,
    session_id: sessionId ?? null,
    exhibition_id: exhId,
    artwork_id: codeToUuid(code),
    artwork_code: code ?? null,
    event_type: eventType,
    payload: payload || {},
  })
}

// --- Session lifecycle ------------------------------------------------------

// Start a tour session. Returns the new session uuid (or null if disabled/failed)
// which the caller threads through subsequent log* calls.
export async function startSession({ exhibitionSlug, prefs, startMode, plannedLength } = {}) {
  return safe(async () => {
    const uid = await userId()
    if (!uid) return null
    const exhId = await exhibitionId()
    const { data, error } = await supabase
      .from('tour_sessions')
      .insert({
        user_id: uid,
        exhibition_id: exhId,
        preferences: prefs || {},
        start_mode: startMode || null,
        planned_length: typeof plannedLength === 'number' ? plannedLength : null,
        requested_minutes: typeof prefs?.time === 'number' ? prefs.time : null,
      })
      .select('id')
      .single()
    if (error) throw error
    await mirror({
      uid,
      sessionId: data.id,
      eventType: 'route_start',
      payload: { startMode: startMode || null, plannedLength: plannedLength ?? null, exhibitionSlug },
    })
    return data.id
  })
}

// Snapshot the planned route each time it is (re)built. `stops` is the ordered
// array of { code, room, position }; `trigger` records why the route changed
// ('initial' | 'skip' | 'like' | 'manual_choice' | 'preference_update').
// The version is 1-based and monotonically increasing within a session; the
// caller tracks it. Feeds route_versions (0010) for offline reroute evaluation.
export async function logRouteVersion({ sessionId, version, trigger, stops, currentRoom } = {}) {
  return safe(async () => {
    if (!sessionId) return null
    const normalized = Array.isArray(stops)
      ? stops.map((s, i) => ({
          code: s?.code ?? null,
          room: typeof s?.room === 'number' ? s.room : null,
          position: typeof s?.position === 'number' ? s.position : i + 1,
        }))
      : []
    await supabase.from('route_versions').insert({
      session_id: sessionId,
      version: typeof version === 'number' ? version : 1,
      trigger: trigger || 'initial',
      stops: normalized,
      current_room: typeof currentRoom === 'number' ? currentRoom : null,
    })
    const uid = await userId()
    await mirror({
      uid,
      sessionId,
      eventType: 'route_version',
      payload: { version, trigger, currentRoom, length: normalized.length },
    })
  })
}

// Record a visited/planned/skipped stop at a position (1-based).
export async function logStop({ sessionId, code, position, status, relevanceScore } = {}) {
  return safe(async () => {
    if (!sessionId) return null
    await supabase.from('tour_stops').upsert(
      {
        session_id: sessionId,
        artwork_id: codeToUuid(code),
        artwork_code: code ?? null,
        position,
        status: status || 'visited',
        relevance_score: typeof relevanceScore === 'number' ? relevanceScore : null,
      },
      { onConflict: 'session_id,position' }
    )
    const uid = await userId()
    await mirror({
      uid,
      sessionId,
      code,
      eventType: status === 'skipped' ? 'skip' : 'view',
      payload: { position, status: status || 'visited' },
    })
  })
}

export async function logLike({ sessionId, code } = {}) {
  return safe(async () => {
    if (!sessionId) return null
    const uid = await userId()
    await supabase.from('tour_likes').upsert(
      { session_id: sessionId, user_id: uid, artwork_id: codeToUuid(code), artwork_code: code ?? null },
      { onConflict: 'session_id,artwork_id' }
    )
    await mirror({ uid, sessionId, code, eventType: 'like', payload: {} })
  })
}

export async function logSkip({ sessionId, code, position, currentRoom, remainingAfter } = {}) {
  return safe(async () => {
    if (!sessionId) return null
    const uid = await userId()
    await supabase.from('tour_skips').insert({
      session_id: sessionId,
      user_id: uid,
      artwork_id: codeToUuid(code),
      artwork_code: code ?? null,
      position: position ?? null,
      current_room: currentRoom ?? null,
      remaining_after: remainingAfter ?? null,
    })
    await mirror({ uid, sessionId, code, eventType: 'skip', payload: { position, currentRoom, remainingAfter } })
  })
}

export async function logDwell({ sessionId, code, dwellMs, enteredAt, leftAt } = {}) {
  return safe(async () => {
    if (!sessionId) return null
    const uid = await userId()
    await supabase.from('dwell_events').insert({
      session_id: sessionId,
      user_id: uid,
      artwork_id: codeToUuid(code),
      artwork_code: code ?? null,
      dwell_ms: typeof dwellMs === 'number' ? Math.round(dwellMs) : null,
      entered_at: enteredAt ?? null,
      left_at: leftAt ?? null,
    })
    await mirror({ uid, sessionId, code, eventType: 'dwell', payload: { dwellMs } })
  })
}

// Whole-route (or per-artwork) satisfaction rating + comment.
export async function logFeedback({ sessionId, scope, code, rating, comment } = {}) {
  return safe(async () => {
    if (!sessionId) return null
    const uid = await userId()
    await supabase.from('route_feedback').insert({
      session_id: sessionId,
      user_id: uid,
      scope: scope || 'route',
      artwork_id: codeToUuid(code),
      artwork_code: code ?? null,
      rating: typeof rating === 'number' ? rating : null,
      comment: comment || null,
    })
    await mirror({ uid, sessionId, code, eventType: 'rate', payload: { scope: scope || 'route', rating, comment } })
  })
}

// Mark a session complete + record its outcome counters.
export async function completeSession({ sessionId, counts } = {}) {
  return safe(async () => {
    if (!sessionId) return null
    const uid = await userId()
    await supabase
      .from('tour_sessions')
      .update({
        completed: true,
        ended_at: new Date().toISOString(),
        skipped_count: counts?.skipped ?? 0,
        liked_count: counts?.liked ?? 0,
      })
      .eq('id', sessionId)
    await mirror({ uid, sessionId, eventType: 'route_complete', payload: counts || {} })
  })
}

// --- Save / Look Closer / continuation analytics (master prompt PART 1/2/4) -
// All three write into the SAME opt-in behavior_events stream (and, for
// continuation, the recommendation_decisions log) so the ML foundation gets a
// clean signal history. No-op unless signed-in AND opted-in, like every logger
// here. Anonymous saves live only in localStorage (savedArtworks.js) and never
// reach these functions.

// A visitor saved (or unsaved) an artwork. `action` is 'save' | 'unsave'.
export async function logSaveEvent({ sessionId, code, action = 'save' } = {}) {
  return safe(async () => {
    const uid = await userId()
    await mirror({ uid, sessionId, code, eventType: `favorite_${action}`, payload: {} })
  })
}

// A visitor opened the guided-looking ("Look Closer") panel on an artwork — a
// moderate positive engagement signal.
export async function logLookCloserEvent({ sessionId, code } = {}) {
  return safe(async () => {
    const uid = await userId()
    await mirror({ uid, sessionId, code, eventType: 'look_closer_open', payload: {} })
  })
}

// A finished-early continuation decision. `mode` is 'forward' | 'missed_earlier'.
// Mirrors an event AND inserts a recommendation_decisions row carrying the full
// per-candidate continuationScore breakdowns for offline evaluation/debugging.
export async function logContinuation({ sessionId, mode = 'forward', currentRoom, candidates } = {}) {
  return safe(async () => {
    const uid = await userId()
    const normalized = Array.isArray(candidates) ? candidates : []
    await supabase.from('recommendation_decisions').insert({
      session_id: sessionId ?? null,
      mode,
      current_room: typeof currentRoom === 'number' ? currentRoom : null,
      candidates: normalized,
    })
    await mirror({
      uid,
      sessionId,
      eventType: `continuation_${mode}`,
      payload: { currentRoom, count: normalized.length },
    })
  })
}

// --- Audio narration analytics ---------------------------------------------
// Logs audio engagement into the SAME opt-in behavior_events stream. No-op
// unless signed-in AND opted-in (same as every other logger here). `action` is
// one of 'play' | 'pause' | 'complete' | 'stop'; the payload carries which
// language/voice/speed the visitor chose plus position/duration for completion
// and stop-rate analysis. Fire-and-forget.
export async function logAudioEvent({ sessionId, code, action, detail } = {}) {
  return safe(async () => {
    if (!action) return null
    const uid = await userId()
    await mirror({
      uid,
      sessionId,
      code,
      eventType: `audio_${action}`,
      payload: detail || {},
    })
  })
}
