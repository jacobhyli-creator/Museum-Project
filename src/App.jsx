import { useState, useMemo, useEffect, useRef } from 'react'
import { getMuseum, getExhibition } from './data/museums.js'
import { loadArtworks, refreshArtworks } from './data/artworks.js'
import {
  buildRoute as buildRouteEngine,
  rescoreRemaining,
  rebuildRemaining,
  checkRoom1Match,
  ROOM1_RELEVANCE_THRESHOLD,
} from './lib/recommendationEngine.js'
import { routeLengthForTime } from './lib/quizPreferenceMapper.js'
import {
  createAdaptiveState,
  applyLike,
  applySkip,
} from './lib/adaptivePreferences.js'
import { generateRouteNarrative } from './lib/narrative.js'

import MuseumSelection from './components/MuseumSelection.jsx'
import ExhibitionSelection from './components/ExhibitionSelection.jsx'
import PreferenceQuiz from './components/PreferenceQuiz.jsx'
import Room1NoMatchChoice from './components/Room1NoMatchChoice.jsx'
import RoutePreview from './components/RoutePreview.jsx'
import ArtworkTour from './components/ArtworkTour.jsx'
import RouteAdjustmentModal from './components/RouteAdjustmentModal.jsx'
import TourComplete from './components/TourComplete.jsx'
import FeedbackForm from './components/FeedbackForm.jsx'
import RecommendationDebug from './components/RecommendationDebug.jsx'
import AdminApp from './components/admin/AdminApp.jsx'
import UserAuthPanel from './components/UserAuthPanel.jsx'
import {
  loadSavedPreferences,
  saveCurrentPreferences,
  saveAudioPreferences,
  listFavorites,
} from './lib/userData.js'
import {
  loadPreferenceProfile,
  recordPreferenceSignal,
} from './lib/preferenceProfile.js'
import {
  enableEventLogging,
  startSession,
  logStop,
  logLike,
  logSkip,
  logDwell,
  logRouteVersion,
  logFeedback,
  completeSession,
  logSaveEvent,
  logLookCloserEvent,
  logContinuation,
} from './lib/eventLog.js'
import { createSessionProfile, applySignal } from './lib/sessionProfile.js'
import {
  saveArtwork,
  unsaveArtwork,
  listSaved,
  readLocal,
  importLocalToAccount,
} from './lib/savedArtworks.js'
import {
  isFinishedEarly,
  extraCountForRemaining,
  buildContinuation,
  buildMissedEarlier,
} from './lib/continuation.js'
import SavedArtworks from './components/SavedArtworks.jsx'

// Hidden admin entry: visiting a URL whose path ends in /admin renders the
// admin area instead of the public tour. Evaluated once at module load so it
// can't change hook ordering inside the component. Visitors never see this;
// there's no link.
const IS_ADMIN_MODE =
  typeof window !== 'undefined' && /\/admin\/?$/.test(window.location.pathname)

// Screen identifiers for the simple front-end router.
const SCREENS = {
  MUSEUM: 'museum',
  EXHIBITION: 'exhibition',
  QUIZ: 'quiz',
  ROOM1_CHOICE: 'room1Choice',
  PREVIEW: 'preview',
  TOUR: 'tour',
  COMPLETE: 'complete',
  FEEDBACK: 'feedback',
}

const emptyPrefs = {
  museumId: null,
  exhibitionId: null,
  time: 60,
  interests: [],
  style: null,
  mood: null,
  knowledge: null,
  routeType: null,
}

// DEV-only forward-only invariant check (master prompt PART 1). Any produced or
// mutated route must have NON-DECREASING roomNumbers — the visitor never walks
// backward. In production this is a no-op; in dev it surfaces a loud console
// error naming the offending step so regressions are caught immediately.
function assertForwardOnly(route, label = 'route') {
  if (!import.meta.env.DEV || !Array.isArray(route)) return
  for (let i = 1; i < route.length; i++) {
    const prev = route[i - 1]?.roomNumber
    const cur = route[i]?.roomNumber
    if (typeof prev === 'number' && typeof cur === 'number' && cur < prev) {
      // eslint-disable-next-line no-console
      console.error(
        `[forward-only] ${label}: step ${i} moves BACKWARD ` +
          `(Room ${prev} -> Room ${cur}) for "${route[i]?.title}". ` +
          `This violates the forward-only routing invariant.`,
        route.map((a) => ({ id: a.id, room: a.roomNumber, title: a.title }))
      )
      break
    }
  }
}

// Snapshot a route array into the compact ordered form route_versions stores:
// [{ code, room, position }, ...] (1-based positions). Used for logRouteVersion
// so we can reconstruct how the plan evolved within a session (master prompt
// PART 5). Null-safe: missing rooms serialize as null (never fabricated).
function routeSnapshot(route) {
  if (!Array.isArray(route)) return []
  return route.map((a, i) => ({
    code: a?.id ?? null,
    room: typeof a?.roomNumber === 'number' ? a.roomNumber : null,
    position: i + 1,
  }))
}

// Top-level branch. Kept free of hooks so the admin/tour split never affects
// hook ordering in either subtree. The public tour lives in <TourApp/> below.
export default function App() {
  if (IS_ADMIN_MODE) return <AdminApp />
  return <TourApp />
}

function TourApp() {
  const [screen, setScreen] = useState(SCREENS.MUSEUM)

  // Kick off the (fetched) real dataset load at startup. The app is usable on
  // the fallback dataset immediately; the real data swaps in when ready — well
  // before the user reaches route generation. See data/artworks.js.
  useEffect(() => {
    loadArtworks()
  }, [])

  // Hydrate any device-local saves (anon path) on mount so the Saved Artworks
  // list and the Save toggle reflect prior device saves immediately. Pure read
  // of localStorage — no network, safe for anonymous visitors.
  useEffect(() => {
    const local = readLocal()
    if (local.length) setSavedCodes((codes) => Array.from(new Set([...codes, ...local])))
  }, [])

  // Backend -> public sync (master prompt PART 4): whenever the visitor returns
  // to the museum screen (the start of a NEW session), re-fetch live content so
  // admin-published changes appear without a redeploy. Fire-and-forget; a failed
  // refresh silently keeps the currently-loaded dataset.
  useEffect(() => {
    if (screen === SCREENS.MUSEUM) refreshArtworks()
  }, [screen])

  // Selection state
  const [museumId, setMuseumId] = useState(null)
  const [exhibitionId, setExhibitionId] = useState(null)

  // Quiz preferences
  const [prefs, setPrefs] = useState(emptyPrefs)

  // Route + tour state
  const [route, setRoute] = useState([])
  const [scoredAll, setScoredAll] = useState([]) // every scored candidate (debug)
  // The explicit start strategy the current route was built with (AUTO /
  // FORCE_ROOM_1 / START_AT_BEST_MATCH). Surfaced in the debug panel so the
  // binding "Start from Room 1" choice is visible/verifiable (bug-fix §13).
  const [startStrategy, setStartStrategy] = useState(null)
  const [tourIndex, setTourIndex] = useState(0)
  // Adaptive like/skip state (spec §23–§24): accumulates theme/tag/tone/medium
  // weights that re-score the upcoming, unvisited stops.
  const [adaptiveState, setAdaptiveState] = useState(() => createAdaptiveState())
  const [likedIds, setLikedIds] = useState([])
  const [completedIds, setCompletedIds] = useState([])
  const [skippedCount, setSkippedCount] = useState(0)

  // ---- Personalization / Save / continuation state (PART 1/3/4/5/6/7) ------
  // In-memory session preference profile — works for EVERYONE (anon or signed
  // in). Pure data carried in state for the length of one tour; never persisted
  // for anon/opted-out visitors. Rebuilt on reset.
  const [sessionProfile, setSessionProfile] = useState(() => createSessionProfile())
  // The visitor's saved artwork CODES (Set-deduped). Hydrated from localStorage
  // on mount (anon) and from the account on sign-in + opt-in. Distinct from
  // likedIds — Save is the explicit "keep this" action.
  const [savedCodes, setSavedCodes] = useState([])
  // Finished-early continuation: minutes remaining vs the chosen time, the
  // forward-only extras the visitor can add, and the SEPARATE behind-you list.
  const [finishedEarlyRemaining, setFinishedEarlyRemaining] = useState(0)
  const [continuationExtra, setContinuationExtra] = useState([])
  const [missedEarlier, setMissedEarlier] = useState([])
  // Wall-clock start of the tour, used to compute elapsed/remaining time.
  const tourStartRef = useRef(null)

  // Consumer account state. `optedIn` is the master consent flag; when false we
  // persist nothing (event logging stays disabled, favorites/prefs not saved).
  // `tourSessionId` holds the DB tour_sessions id for the active tour, used to
  // attach events; null for anonymous/opted-out visitors.
  const [optedIn, setOptedIn] = useState(false)
  const [tourSessionId, setTourSessionId] = useState(null)

  // Session-only audio narration preferences (language/voice/speed). Restored
  // from saved_preferences for opted-in returning visitors; otherwise defaults
  // are chosen in AudioControls. Persisted only when opted in.
  const [audioPrefs, setAudioPrefs] = useState(null)

  // Long-term learned preference profile for an opt-in returning visitor (master
  // prompt PART 5). null for anonymous/opted-out/first-time users, in which case
  // scoring uses the current session only. When present it blends into route
  // scoring (default 0.75 session / 0.25 historical).
  const [historicalProfile, setHistoricalProfile] = useState(null)

  // Monotonic route-version counter within a session (master prompt PART 5).
  // Bumped + logged whenever the plan is (re)built: initial start, skip, like.
  // A ref (not state) because it never drives rendering and must stay in sync
  // across the fire-and-forget log calls.
  const routeVersionRef = useRef(0)

  // Per-stop dwell timer. Records when the visitor arrived at the current stop
  // so we can log elapsed dwell_ms when they advance/skip/leave (moderate ML
  // signal). Holds { code, enteredAt } for the stop currently on screen.
  const dwellRef = useRef(null)

  // Per-stop dwell timer (master prompt PART 5). While viewing a stop on the
  // TOUR screen, remember when the visitor arrived; the cleanup flushes the
  // elapsed dwell when they move to the next stop or leave the tour. Opt-in
  // only (flushDwell no-ops otherwise). Keyed on the visible stop + screen.
  // NOTE: declared AFTER route/tourIndex/dwellRef so it never reads them in the
  // temporal dead zone (reading route before its useState ran crashed the app
  // to a blank screen the moment the TOUR screen mounted — i.e. "Start route").
  const currentStopId = screen === SCREENS.TOUR ? route[tourIndex]?.id ?? null : null
  useEffect(() => {
    if (screen !== SCREENS.TOUR || !currentStopId) {
      dwellRef.current = null
      return
    }
    dwellRef.current = {
      code: currentStopId,
      enteredAt: new Date().toISOString(),
      enteredAtMs: Date.now(),
    }
    return () => {
      flushDwell()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStopId, screen])

  // Theme -> like-count map, derived from the adaptive state, for the narrative
  // layer (which expects a simple weight map).
  const likedThemes = adaptiveState.likedThemes

  // Room 1 match-check result (spec §3–§4): populated when the quiz produces no
  // strong Room 1 opener, so we can show the A/B start choice screen.
  const [room1Choice, setRoom1Choice] = useState(null)

  // Modal state
  const [modal, setModal] = useState({ type: null, data: null })

  // Resolve names for the recommendation engine (which filters by name strings).
  const museum = getMuseum(museumId)
  const exhibition = getExhibition(exhibitionId)

  // Full preference object passed to the engine + presented in the UI.
  const enginePrefs = useMemo(
    () => ({
      museum: museum?.name,
      exhibition: exhibition?.title,
      time: prefs.time,
      interests: prefs.interests,
      style: prefs.style,
      mood: prefs.mood,
      knowledge: prefs.knowledge,
      routeType: prefs.routeType,
    }),
    [museum, exhibition, prefs]
  )

  // ---- Consumer account / consent -----------------------------------------

  // Called by UserAuthPanel on mount and on every auth/consent change. When the
  // user is signed in AND opted in we (a) enable behavior-event logging and
  // (b) restore their saved preferences + favorites. When they sign out or opt
  // out we disable logging so nothing further is persisted.
  const handleAccountChange = async ({ session, optedIn: nextOptedIn }) => {
    const active = !!session && nextOptedIn === true
    setOptedIn(active)
    enableEventLogging({ optedIn: active })

    if (!active) {
      // Opted out / signed out: forget the historical profile so scoring reverts
      // to session-only immediately. Audio prefs also revert to session defaults.
      setHistoricalProfile(null)
      setAudioPrefs(null)
      return
    }

    // Load the visitor's long-term learned profile (best-effort). A returning
    // opted-in user's historical taste then blends into route scoring; a brand
    // new user simply has none (null), leaving scoring session-only.
    loadPreferenceProfile()
      .then((prof) => setHistoricalProfile(prof))
      .catch(() => setHistoricalProfile(null))

    // Restore saved quiz preferences (merged over defaults) so a returning
    // visitor starts from where they left off. Best-effort: ignore failures.
    const savedPrefs = await loadSavedPreferences()
    if (savedPrefs?.data) {
      setPrefs((p) => ({ ...p, ...savedPrefs.data }))
      if (savedPrefs.data.audio) setAudioPrefs(savedPrefs.data.audio)
    }
    // Restore favorites as liked ids (they surface on the completion screen).
    const favs = await listFavorites()
    if (Array.isArray(favs?.data) && favs.data.length) {
      setLikedIds((ids) => Array.from(new Set([...ids, ...favs.data])))
    }

    // Auto-import any device-local saves into the account (confirmed product
    // decision), then hydrate savedCodes from the union of account + local so
    // the Saved Artworks list reflects everything. Best-effort; failures leave
    // the local saves intact for a later retry.
    await importLocalToAccount()
    const saved = await listSaved({ optedIn: true })
    if (Array.isArray(saved?.data)) {
      setSavedCodes((codes) => Array.from(new Set([...codes, ...saved.data])))
    }
  }

  // When a visitor changes their audio language/voice/speed, keep it for the
  // session and persist it for opted-in users (fire-and-forget). Merges over any
  // prior audio prefs so a partial change never clears the others.
  const handleAudioPrefsChange = (next) => {
    setAudioPrefs((prev) => {
      const merged = { ...(prev || {}), ...(next || {}) }
      if (optedIn) saveAudioPreferences(merged)
      return merged
    })
  }

  // ---- Save / Look Closer / audio signals (PART 1/5/6) ---------------------

  // Save an artwork (explicit "keep this" — stronger than Like). Optimistically
  // dedupes into savedCodes, feeds the in-memory session profile a 'favorite'
  // signal (anon-safe), and persists per the visitor's consent: opted-in +
  // signed-in writes to the account (favorite_artworks) + the long-term profile
  // + the behavior_events stream; everyone else keeps it device-local only.
  const handleSave = (art) => {
    if (!art?.id) return
    setSavedCodes((codes) => (codes.includes(art.id) ? codes : [...codes, art.id]))
    setSessionProfile((p) => applySignal(p, art, 'favorite'))
    if (optedIn) {
      saveArtwork(art.id, { optedIn: true })
      recordPreferenceSignal(art, 'favorite')
      logSaveEvent({ sessionId: tourSessionId, code: art.id, action: 'save' })
    } else {
      saveArtwork(art.id, { optedIn: false })
    }
  }

  // Unsave an artwork. Mirrors handleSave: removes locally + (opted-in) from the
  // account, and logs the unsave. The session profile is left as-is — the visit
  // still expressed interest at the moment of saving.
  const handleUnsave = (code) => {
    if (!code) return
    setSavedCodes((codes) => codes.filter((c) => c !== code))
    if (optedIn) {
      unsaveArtwork(code, { optedIn: true })
      logSaveEvent({ sessionId: tourSessionId, code, action: 'unsave' })
    } else {
      unsaveArtwork(code, { optedIn: false })
    }
  }

  // A visitor opened the "Look Closer" guided-looking panel — a moderate
  // positive engagement signal. Feeds the session profile (anon-safe) and the
  // opt-in behavior_events stream.
  const handleLookCloserOpen = (art) => {
    if (!art?.id) return
    setSessionProfile((p) => applySignal(p, art, 'lookCloser'))
    if (optedIn) logLookCloserEvent({ sessionId: tourSessionId, code: art.id })
  }

  // A visitor played the audio narration — a moderate positive engagement
  // signal. The AudioControls component already logs the granular audio_play
  // event; here we only fold it into the session profile (anon-safe).
  const handleAudioPlay = (art) => {
    if (!art?.id) return
    setSessionProfile((p) => applySignal(p, art, 'audio'))
  }

  // ---- Navigation handlers -------------------------------------------------

  const buildRoute = (adaptive = adaptiveState, options = {}) => {
    // Discard any previously-built route BEFORE regenerating so a stale route can
    // never leak into the new one (bug-fix §5/§10). The user's start choice is
    // authoritative; we rebuild the entire sequence from scratch.
    setRoute([])
    setTourIndex(0)
    setCompletedIds([])
    setSkippedCount(0)

    const {
      route: generated,
      scoredAll: all,
      strategy,
    } = buildRouteEngine(
      enginePrefs,
      adaptive,
      // Blend the opt-in visitor's long-term profile into scoring (PART 5); null
      // for anonymous users leaves scoring session-only.
      { historicalProfile, ...options }
    )
    // The engine already asserts the strategy + forward-only invariants (throws
    // on violation); this DEV-only console check is a redundant safety net.
    assertForwardOnly(generated, `initial build (${strategy})`)
    setRoute(generated)
    setScoredAll(all)
    setStartStrategy(strategy)
    setTourIndex(0)
    setCompletedIds([])
    setSkippedCount(0)
    return generated
  }

  const handleGenerate = async () => {
    // Ensure the real dataset is in place before building the route (it is
    // usually already loaded; this awaits only on a cold/slow first load).
    await loadArtworks()

    // Persist the chosen quiz preferences for opt-in users so a future visit can
    // restore them (fire-and-forget; no-op otherwise).
    if (optedIn) saveCurrentPreferences(prefs)

    // Room 1 match-check (spec §3): if Room 1 has no sufficiently relevant work,
    // ask the visitor how to open the route (§4) instead of silently starting
    // them in a distant room. Otherwise open in Room 1 as normal (§2).
    const check = checkRoom1Match(
      enginePrefs,
      adaptiveState,
      undefined,
      historicalProfile
    )
    if (!check.hasRoom1Match) {
      setRoom1Choice({
        strongestRoom: check.strongestRoom,
        scoredAll: check.scoredAll,
      })
      setScoredAll(check.scoredAll)
      setScreen(SCREENS.ROOM1_CHOICE)
      return
    }

    setRoom1Choice(null)
    buildRoute(adaptiveState, { startMode: 'room1', scoredAll: check.scoredAll })
    setScreen(SCREENS.PREVIEW)
  }

  // Room 1 no-match choice (spec §4). Option A: begin at the strongest matches
  // (§5). Option B: rebuild starting from Room 1, moving toward strong matches
  // (§6). Both reuse the already-scored pool from the check to avoid re-scoring.
  const handleStartBestMatches = () => {
    buildRoute(adaptiveState, {
      startMode: 'bestMatches',
      scoredAll: room1Choice?.scoredAll,
    })
    setRoom1Choice(null)
    setScreen(SCREENS.PREVIEW)
  }

  const handleStartFromRoom1 = () => {
    buildRoute(adaptiveState, {
      startMode: 'room1',
      scoredAll: room1Choice?.scoredAll,
    })
    setRoom1Choice(null)
    setScreen(SCREENS.PREVIEW)
  }

  const handleRegenerate = () => buildRoute()

  // Bump the session's route-version counter and persist a snapshot of the
  // given route (opt-in only; no-op otherwise). `trigger` explains the replan
  // ('initial' | 'skip' | 'like' | 'manual_choice' | 'preference_update').
  // Accepts an explicit sessionId so it can run on the very first build before
  // tourSessionId state has settled.
  const recordRouteVersion = (routeArr, trigger, currentRoom, sessionId = tourSessionId) => {
    if (!optedIn || !sessionId) return
    routeVersionRef.current += 1
    logRouteVersion({
      sessionId,
      version: routeVersionRef.current,
      trigger,
      stops: routeSnapshot(routeArr),
      currentRoom: typeof currentRoom === 'number' ? currentRoom : null,
    })
  }

  // Flush the current stop's dwell time (opt-in only). Called before we leave a
  // stop (advance/skip) or when the tour view unmounts. Clears the timer so a
  // stop is never double-counted.
  const flushDwell = () => {
    const d = dwellRef.current
    dwellRef.current = null
    if (!d?.enteredAt || !d?.enteredAtMs) return
    const dwellMs = Date.now() - d.enteredAtMs
    const art = route.find((a) => a.id === d.code)

    // In-memory session profile learns from EVERY dwell (anon-safe). A long
    // dwell nudges the work's dimensions up; short glances are neutral (the
    // shared signalMagnitude returns 0 for them) so applySignal only bumps the
    // count. This runs for anonymous visitors too — nothing is persisted.
    if (art) setSessionProfile((p) => applySignal(p, art, 'dwell', { dwellMs }))

    // Persistence + long-term learning stay opt-in only.
    if (!optedIn || !tourSessionId) return
    const enteredAt = d.enteredAt
    const leftAt = new Date().toISOString()
    logDwell({ sessionId: tourSessionId, code: d.code, dwellMs, enteredAt, leftAt })
    // Learn long-term from a LONG dwell only (moderate positive signal); short
    // glances are neutral and recordPreferenceSignal no-ops on them (PART 5).
    if (art) recordPreferenceSignal(art, 'dwell', { dwellMs })
  }

  const startTour = () => {
    setScreen(SCREENS.TOUR)
    setTourIndex(0)
    setCompletedIds([])
    routeVersionRef.current = 0
    dwellRef.current = null
    // Anchor the wall clock for finished-early time accounting (PART 3).
    tourStartRef.current = Date.now()
    // Clear any continuation state from a prior tour so the completion screen
    // starts fresh.
    setContinuationExtra([])
    setMissedEarlier([])
    setFinishedEarlyRemaining(0)

    // Open a DB tour session for opt-in users (no-op otherwise). Fire-and-forget:
    // the tour UI never waits on logging. The first stop is recorded once the
    // session id is known.
    if (optedIn) {
      startSession({
        exhibitionSlug: exhibition?.title,
        prefs: enginePrefs,
        startMode: 'room1',
        plannedLength: route.length,
      }).then((sid) => {
        if (!sid) return
        setTourSessionId(sid)
        const first = route[0]
        if (first) logStop({ sessionId: sid, code: first.id, position: 1, status: 'visited' })
        // Snapshot the initial plan now that we have a session id.
        recordRouteVersion(route, 'initial', first?.roomNumber, sid)
      })
    }
  }

  const advance = () => {
    // Mark current as completed.
    const current = route[tourIndex]
    setCompletedIds((ids) =>
      ids.includes(current.id) ? ids : [...ids, current.id]
    )

    const atEnd = tourIndex >= route.length - 1

    // On the final stop: fold a 'completed' signal into the in-memory session
    // profile for every work seen (anon-safe) and compute how much time remains
    // versus the selected tour time so the completion screen can offer to keep
    // exploring (PART 3). Elapsed uses the wall clock anchored in startTour.
    if (atEnd) {
      setSessionProfile((p) => {
        let next = p
        for (const art of route) next = applySignal(next, art, 'completed')
        return next
      })
      const startedMs = tourStartRef.current
      const elapsedMin = startedMs ? (Date.now() - startedMs) / 60000 : 0
      const selectedMin = typeof enginePrefs.time === 'number' ? enginePrefs.time : 0
      setFinishedEarlyRemaining(Math.max(0, selectedMin - elapsedMin))
    }

    // Log the just-completed stop, and on the final stop close out the session
    // with its outcome counters (opt-in only; no-ops otherwise).
    if (optedIn && tourSessionId) {
      logStop({
        sessionId: tourSessionId,
        code: current?.id,
        position: tourIndex + 1,
        status: 'visited',
      })
      if (!atEnd) {
        const next = route[tourIndex + 1]
        if (next) {
          logStop({
            sessionId: tourSessionId,
            code: next.id,
            position: tourIndex + 2,
            status: 'visited',
          })
        }
      } else {
        completeSession({
          sessionId: tourSessionId,
          counts: { skipped: skippedCount, liked: likedIds.length },
        })
        // Completing the tour is a mild positive signal for every work seen
        // (PART 5): the visitor stayed through the whole route.
        for (const art of route) recordPreferenceSignal(art, 'completed')
      }
    }

    if (atEnd) {
      setScreen(SCREENS.COMPLETE)
    } else {
      setTourIndex((i) => i + 1)
    }
  }

  // Skip (spec §19–§22). The old behavior only swapped a single stop, which
  // could leave the rest of the route pointing backward. Now a skip invalidates
  // the ENTIRE unvisited tail and rebuilds it forward from where the visitor is
  // standing:
  //   1. record the skip + adjust preference weights (§21)
  //   2. keep the already-visited stops fixed (§20)
  //   3. preserve the current physical location (the skipped work's room)
  //   4. drop every not-yet-visited stop and rescore all unused works
  //   5. rebuild the remaining route forward, enforcing room progression (§22)
  const handleSkip = () => {
    const current = route[tourIndex]

    const nextAdaptive = applySkip(adaptiveState, current)
    setAdaptiveState(nextAdaptive)
    setSkippedCount((c) => c + 1)

    // Completed stops are everything strictly before the current index.
    const visited = route.slice(0, tourIndex)
    // The visitor is physically standing at the skipped work's room; rebuild
    // forward from there. Fall back to the last visited room, then Room 1.
    const currentRoom =
      current?.roomNumber ??
      visited[visited.length - 1]?.roomNumber ??
      1

    // Target total length stays anchored to the visitor's chosen time (§17);
    // the tail we still need is the target minus what's already been seen.
    const targetTotal = routeLengthForTime(enginePrefs.time)
    const remainingCount = Math.max(1, targetTotal - visited.length)

    const rebuiltTail = rebuildRemaining(
      enginePrefs,
      visited,
      current,
      nextAdaptive,
      currentRoom,
      remainingCount,
      historicalProfile
    )

    // Log the skip + its reroute outcome (opt-in only; no-op otherwise).
    if (optedIn && tourSessionId) {
      logSkip({
        sessionId: tourSessionId,
        code: current?.id,
        position: tourIndex + 1,
        currentRoom,
        remainingAfter: rebuiltTail.length,
      })
      // Learn long-term: a skip pushes this work's dimensions DOWN. An immediate
      // skip (little dwell) is a stronger negative than a considered one (PART 5).
      const dwellMs =
        dwellRef.current?.code === current?.id && dwellRef.current?.enteredAtMs
          ? Date.now() - dwellRef.current.enteredAtMs
          : undefined
      recordPreferenceSignal(current, 'skip', { dwellMs })
    }

    if (rebuiltTail.length) {
      // The rebuilt tail slots in at the current index; the visitor now views
      // the first rebuilt stop in place of the skipped one.
      const nextRoute = [...visited, ...rebuiltTail]
      assertForwardOnly(nextRoute, 'after skip')
      setRoute(nextRoute)
      recordRouteVersion(nextRoute, 'skip', currentRoom)
      setModal({ type: 'skip', data: { replacement: rebuiltTail[0] } })
    } else {
      // Nothing left to rebuild: the skip ends the tour after the visited stops.
      setRoute(visited)
      recordRouteVersion(visited, 'skip', currentRoom)
      setModal({ type: 'skip', data: { replacement: null, endsTour: true } })
    }
  }

  const handleLike = (art) => {
    // Record the like in the adaptive state (spec §23): boosts theme/tag/tone/
    // medium weights that re-score the upcoming stops.
    const nextAdaptive = applyLike(adaptiveState, art)
    setAdaptiveState(nextAdaptive)
    reorderUpcoming(nextAdaptive)

    setLikedIds((ids) => (ids.includes(art.id) ? ids : [...ids, art.id]))
    setModal({ type: 'like', data: { themes: art.themes } })

    // A Like is now a LIGHTER, in-the-moment reaction (PART 1 confirmed
    // decision): saving is owned by the explicit Save button. Feed the
    // in-memory session profile a 'like' signal for everyone (anon-safe).
    setSessionProfile((p) => applySignal(p, art, 'like'))

    // Persist the like as a behavior event (opt-in only). NOTE: no longer adds
    // a favorite — Save owns Saved Artworks now — and records only the 'like'
    // long-term signal, not 'favorite'.
    if (optedIn && tourSessionId) {
      logLike({ sessionId: tourSessionId, code: art.id })
      recordPreferenceSignal(art, 'like')
    }
  }

  // Re-rank the upcoming (unvisited) stops using the updated adaptive state,
  // keeping visited stops fixed so the walk stays coherent. Only reorders the
  // works already in the route — it does not swap in new works mid-tour.
  const reorderUpcoming = (adaptive) => {
    setRoute((r) => {
      if (tourIndex >= r.length - 1) return r
      const visited = r.slice(0, tourIndex + 1)
      const upcoming = r.slice(tourIndex + 1)
      // Re-score AND re-order the upcoming works room-aware, starting from the
      // room the visitor is currently standing in, so proximity/backtracking
      // still shape the remaining walk (spec §20). The rescorer returns the
      // works already ordered for the forward walk — do not re-sort.
      const currentRoom = r[tourIndex]?.roomNumber ?? null
      const rescored = rescoreRemaining(
        enginePrefs,
        upcoming,
        adaptive,
        currentRoom,
        historicalProfile
      )
      const nextRoute = [...visited, ...rescored]
      assertForwardOnly(nextRoute, 'after like/reorder')
      recordRouteVersion(nextRoute, 'like', currentRoom)
      return nextRoute
    })
  }

  const closeModal = () => setModal({ type: null, data: null })

  const continueAfterModal = () => {
    // A skip with a replacement stays on the same index to view the new work.
    // A skip that removed the last stop with no replacement ends the tour.
    if (modal.type === 'skip' && modal.data?.endsTour) {
      setScreen(SCREENS.COMPLETE)
    }
    closeModal()
  }

  const resetAll = () => {
    setPrefs(emptyPrefs)
    setRoute([])
    setScoredAll([])
    setStartStrategy(null)
    setTourIndex(0)
    setAdaptiveState(createAdaptiveState())
    setLikedIds([])
    setCompletedIds([])
    setSkippedCount(0)
    setTourSessionId(null)
    // Reset in-memory personalization + continuation state for a fresh tour.
    // NOTE: deliberately keep `savedCodes` so device (anon) saves survive a
    // "new tour" — the visitor's saved artworks are not tour-scoped.
    setSessionProfile(createSessionProfile())
    setContinuationExtra([])
    setMissedEarlier([])
    setFinishedEarlyRemaining(0)
    tourStartRef.current = null
  }

  const startNewTour = () => {
    resetAll()
    setMuseumId(null)
    setExhibitionId(null)
    setScreen(SCREENS.MUSEUM)
  }

  const changeExhibition = () => {
    resetAll()
    setExhibitionId(null)
    setScreen(SCREENS.EXHIBITION)
  }

  // End-of-tour feedback. The FeedbackForm collects star ratings (clear/helpful/
  // enjoyable) plus free-text. For opt-in users we persist the average as a
  // whole-route rating with the comments; no-op otherwise.
  const handleFeedbackSubmit = (feedback) => {
    if (!optedIn || !tourSessionId) return
    const ratingVals = Object.values(feedback?.ratings || {}).filter((n) => typeof n === 'number')
    const avg = ratingVals.length
      ? Math.round(ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length)
      : null
    const comment = [feedback?.confusing, feedback?.comments].filter(Boolean).join(' | ') || null
    logFeedback({ sessionId: tourSessionId, scope: 'route', rating: avg, comment })
    // Fold the whole-route rating into the historical profile as a weak signal
    // across every work on the route (PART 5). Neutral (rating 3) is a no-op.
    if (typeof avg === 'number') {
      for (const art of route) recordPreferenceSignal(art, 'feedback', { rating: avg })
    }
  }

  // ---- Finished-early continuation (PART 4/5/10) ---------------------------

  // The room the visitor is physically standing in at the end of the route —
  // the last stop's room. Continuation is anchored here so extras are always
  // same-room-or-forward (the forward-only routing rule is ABSOLUTE, PART 10).
  const endRoom = () => {
    for (let i = route.length - 1; i >= 0; i--) {
      const r = route[i]?.roomNumber
      if (typeof r === 'number') return r
    }
    return 1
  }

  // Build the FORWARD "keep exploring" set. The ML/session profile only ranks
  // PREFERENCE; buildContinuation hard-excludes anything behind the visitor and
  // sequences the extras forward-only. We assert the invariant on the combined
  // route as a DEV safety net, then surface the extras for the visitor to add.
  const handleRecommendMore = () => {
    const currentRoom = endRoom()
    const count = extraCountForRemaining(finishedEarlyRemaining)
    const visitedIds = route.map((a) => a.id)
    const { extras, ranked } = buildContinuation({
      scoredPool: scoredAll,
      visitedIds,
      currentRoom,
      count,
      sessionProfile,
    })
    assertForwardOnly([...route, ...extras], 'finished-early continuation')
    setContinuationExtra(extras)
    // Log the decision with per-candidate breakdowns for offline evaluation
    // (opt-in only; no-op otherwise).
    if (optedIn) {
      logContinuation({
        sessionId: tourSessionId,
        mode: 'forward',
        currentRoom,
        candidates: ranked.map((r) => ({
          code: r.art?.id ?? null,
          score: r.score,
          breakdown: r.breakdown,
        })),
      })
    }
  }

  // Accept one forward extra: append it to the route and RE-ENTER the tour at
  // the appended index (confirmed decision). Forward-only holds because the
  // extra was drawn from buildContinuation's forward-sequenced set.
  const handleAddExtra = (art) => {
    if (!art?.id) return
    setRoute((r) => {
      if (r.some((a) => a.id === art.id)) return r
      const next = [...r, art]
      assertForwardOnly(next, 'after add-extra')
      setTourIndex(next.length - 1)
      return next
    })
    // Drop the accepted work from the offered lists so it can't be added twice.
    setContinuationExtra((xs) => xs.filter((a) => a.id !== art.id))
    setMissedEarlier((xs) => xs.filter((a) => a.id !== art.id))
    tourStartRef.current = tourStartRef.current || Date.now()
    setScreen(SCREENS.TOUR)
  }

  // Build the SEPARATE "missed earlier (behind you)" list. Never merged into the
  // forward continuation — these are explicitly behind the visitor and the UI
  // warns they'd need to walk back.
  const handleShowMissedEarlier = () => {
    const currentRoom = endRoom()
    const count = extraCountForRemaining(finishedEarlyRemaining)
    const visitedIds = route.map((a) => a.id)
    const behind = buildMissedEarlier({
      scoredPool: scoredAll,
      visitedIds,
      currentRoom,
      count,
      sessionProfile,
    })
    setMissedEarlier(behind)
    if (optedIn) {
      logContinuation({
        sessionId: tourSessionId,
        mode: 'missed_earlier',
        currentRoom,
        candidates: behind.map((a) => ({ code: a.id })),
      })
    }
  }

  // End the tour from the finished-early prompt — proceed to feedback like a
  // normal completion.
  const handleEndTour = () => setScreen(SCREENS.FEEDBACK)

  // ---- Derived narrative (front-end template logic, recomputed on change) --

  // Route story: theme, through-line, per-stop connections. Recomputed whenever
  // the route, preferences, or accumulated likes change (covers skip/like).
  const narrative = useMemo(
    () => generateRouteNarrative(route, enginePrefs, likedThemes),
    [route, enginePrefs, likedThemes]
  )

  // ---- Derived stats for completion screen ---------------------------------

  const completedArtworks = route.filter((a) => completedIds.includes(a.id))

  const favoriteThemes = useMemo(() => {
    // Top themes by accumulated likes.
    return Object.entries(likedThemes)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
      .slice(0, 6)
  }, [likedThemes])

  const stats = {
    completed: completedArtworks.length || route.length,
    liked: likedIds.length,
    skipped: skippedCount,
    favoriteThemes,
    // Post-tour recap fields (PART 11). `viewed` counts stops actually seen;
    // `saved` the current saved set; times are the elapsed vs chosen minutes.
    viewed: completedArtworks.length || route.length,
    saved: savedCodes.length,
    totalTimeMin: tourStartRef.current
      ? Math.max(0, Math.round((Date.now() - tourStartRef.current) / 60000))
      : undefined,
    selectedTimeMin: typeof enginePrefs.time === 'number' ? enginePrefs.time : undefined,
  }

  // ---- Render --------------------------------------------------------------

  return (
    <>
      {screen === SCREENS.MUSEUM && (
        <MuseumSelection
          selected={museumId}
          onSelect={setMuseumId}
          onContinue={() => setScreen(SCREENS.EXHIBITION)}
        />
      )}

      {screen === SCREENS.EXHIBITION && (
        <ExhibitionSelection
          museumId={museumId}
          selected={exhibitionId}
          onSelect={setExhibitionId}
          onContinue={() => setScreen(SCREENS.QUIZ)}
          onBack={() => setScreen(SCREENS.MUSEUM)}
        />
      )}

      {screen === SCREENS.QUIZ && (
        <PreferenceQuiz
          museumId={museumId}
          exhibitionId={exhibitionId}
          prefs={prefs}
          setPrefs={setPrefs}
          onGenerate={handleGenerate}
          onBack={() => setScreen(SCREENS.EXHIBITION)}
          onChangeExhibition={changeExhibition}
        />
      )}

      {screen === SCREENS.ROOM1_CHOICE && (
        <Room1NoMatchChoice
          strongestRoom={room1Choice?.strongestRoom}
          prefs={enginePrefs}
          onStartBestMatches={handleStartBestMatches}
          onStartRoom1={handleStartFromRoom1}
          onBack={() => setScreen(SCREENS.QUIZ)}
        />
      )}

      {screen === SCREENS.PREVIEW && (
        <RoutePreview
          route={route}
          prefs={enginePrefs}
          narrative={narrative}
          onStart={startTour}
          onRegenerate={handleRegenerate}
          onEditPreferences={() => setScreen(SCREENS.QUIZ)}
          onChangeExhibition={changeExhibition}
        />
      )}

      {screen === SCREENS.TOUR && route.length > 0 && (
        <ArtworkTour
          route={route}
          index={Math.min(tourIndex, route.length - 1)}
          prefs={enginePrefs}
          narrative={narrative}
          onNext={advance}
          onSkip={handleSkip}
          onLike={handleLike}
          sessionId={tourSessionId}
          audioPrefs={audioPrefs}
          onAudioPrefsChange={handleAudioPrefsChange}
          onSave={handleSave}
          saved={savedCodes.includes(route[Math.min(tourIndex, route.length - 1)]?.id)}
          onLookCloserOpen={handleLookCloserOpen}
          onAudioPlay={handleAudioPlay}
        />
      )}

      {screen === SCREENS.COMPLETE && (
        <TourComplete
          prefs={enginePrefs}
          stats={stats}
          narrative={narrative}
          completedArtworks={completedArtworks.length ? completedArtworks : route}
          onFeedback={() => setScreen(SCREENS.FEEDBACK)}
          onNewTour={startNewTour}
          onChangeExhibition={changeExhibition}
          sessionProfile={sessionProfile}
          savedCodes={savedCodes}
          optedIn={optedIn}
          onUnsave={handleUnsave}
          remaining={finishedEarlyRemaining}
          onRecommendMore={handleRecommendMore}
          onShowMissedEarlier={handleShowMissedEarlier}
          continuationExtra={continuationExtra}
          missedEarlier={missedEarlier}
          onAddExtra={handleAddExtra}
          onEndTour={handleEndTour}
        />
      )}

      {screen === SCREENS.FEEDBACK && (
        <FeedbackForm
          completedArtworks={completedArtworks.length ? completedArtworks : route}
          onSubmit={handleFeedbackSubmit}
          onBack={() => setScreen(SCREENS.COMPLETE)}
          onNewTour={startNewTour}
        />
      )}

      {/* Consumer account panel (sign-in/up + save-history consent). Shown only
          on the entry screen so it never overlaps tour controls. Optional — the
          tour works fully without an account. */}
      {screen === SCREENS.MUSEUM && <UserAuthPanel onAccountChange={handleAccountChange} />}

      {/* Route adjustment modal overlays the tour */}
      <RouteAdjustmentModal
        type={modal.type}
        data={modal.data}
        onContinue={continueAfterModal}
      />

      {/* Dev-only recommendation transparency panel (spec §26). */}
      <RecommendationDebug
        scoredAll={scoredAll}
        route={route}
        startStrategy={startStrategy}
        room1Threshold={ROOM1_RELEVANCE_THRESHOLD}
      />
    </>
  )
}
