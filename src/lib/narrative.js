// ---------------------------------------------------------------------------
// Route narrative generation (front-end template logic only — NO live AI).
//
// Turns a generated route + the user's preferences into a connected story:
//   - routeTheme            one-line theme label for the whole route
//   - routeThroughLine      the question / thread the route follows
//   - personalizedRouteReason  3-5 sentence "why this route" paragraph
//   - builtFor              short human labels (mood / style / knowledge)
//   - sequenceExplanation   how the sequence develops beginning -> end
//   - stopConnectionNotes   per-stop notes: reason, connection to prev, hint to next
//
// Everything is derived deterministically from selected interests, mood,
// style, knowledge level, and the chosen artworks' themes / artists / order.
// ---------------------------------------------------------------------------

import {
  moodOptions,
  explanationStyles,
  interestOptions,
} from '../data/quizOptions.js'

// -- small helpers ----------------------------------------------------------

function labelFor(list, value) {
  const found = list.find((o) => o.value === value)
  return found ? found.label : value
}

// Interest keys (e.g. "popular-culture") -> readable lowercase phrase for prose.
function interestPhrase(key) {
  return String(labelFor(interestOptions, key)).toLowerCase()
}

// Count theme frequency across the chosen works.
function themeFrequency(route) {
  const counts = {}
  route.forEach((art) => {
    ;(art.themes || []).forEach((t) => {
      counts[t] = (counts[t] || 0) + 1
    })
  })
  return counts
}

// Top N themes across the route, most common first.
function topThemes(route, n = 3) {
  const counts = themeFrequency(route)
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .slice(0, n)
}

// Join a list into readable prose: [a] -> "a", [a,b] -> "a and b",
// [a,b,c] -> "a, b, and c".
function proseList(items) {
  const list = items.filter(Boolean)
  if (list.length === 0) return ''
  if (list.length === 1) return list[0]
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

// "a" / "an" based on the following word's first sound (vowel heuristic).
function article(word = '') {
  return /^[aeiou]/i.test(word.trim()) ? 'an' : 'a'
}

// -- theme + mood -> descriptive phrasing -----------------------------------

// A short, human phrase describing what a theme "does" in a route. Falls back
// to the theme name itself for any theme not explicitly mapped.
const THEME_PHRASES = {
  color: 'how color shapes what we feel and see',
  abstraction: 'how abstraction lets form carry meaning',
  figuration: 'how the human figure holds attention',
  gesture: 'the trace of the artist\u2019s hand and movement',
  geometry: 'order, structure, and geometric clarity',
  emotion: 'the emotional charge behind the surface',
  philosophy: 'the ideas and questions a work provokes',
  'popular culture': 'how art absorbs the images of everyday life',
  identity: 'how images shape a sense of self and modern identity',
  materials: 'the physical materials the work is made from',
  light: 'light as a medium and a subject',
  history: 'the historical moment that shaped the work',
  perception: 'how artists change the way we see',
  space: 'the way a work occupies and defines space',
  'everyday life': 'the ordinary world made worth looking at',
  'image-making': 'how images are built, copied, and reinvented',
  silence: 'stillness and quiet attention',
  nature: 'the natural world as a source of form',
}

function themePhrase(theme) {
  return THEME_PHRASES[theme] || theme
}

// Mood -> a phrase describing the *pace / posture* of the walk.
const MOOD_PACING = {
  relaxed: 'an unhurried walk that leaves room to simply look',
  curious: 'a route built to spark questions and connections',
  deep: 'a slower, more reflective sequence that rewards attention',
  efficient: 'a focused route that hits the highest-impact works first',
  emotional: 'a route that follows feeling and story more than chronology',
}

// -- public: build the full narrative --------------------------------------

/**
 * Build the route-level narrative from the ordered route + preferences.
 * @param {Array} route  ordered artworks (already scored + sorted)
 * @param {Object} prefs { museum, exhibition, time, interests[], style, mood, knowledge }
 * @param {Object} likedThemes  theme -> weight (optional; reflects Likes so far)
 */
export function generateRouteNarrative(route = [], prefs = {}, likedThemes = {}) {
  if (!route.length) {
    return {
      routeTheme: '',
      routeThroughLine: '',
      personalizedRouteReason: '',
      builtFor: [],
      sequenceExplanation: '',
      stopConnectionNotes: [],
      topThemes: [],
    }
  }

  const interests = prefs.interests || []
  const moodLabel = labelFor(moodOptions, prefs.mood)
  const styleLabel = labelFor(explanationStyles, prefs.style)

  const routeTopThemes = topThemes(route, 3)

  // ---- routeTheme ---------------------------------------------------------
  // Prefer the user's own interests as the headline; fall back to the route's
  // most common themes so a route always has a theme.
  const themeSource = interests.length
    ? interests.map(interestPhrase)
    : routeTopThemes
  const routeTheme = capitalize(
    proseList(themeSource.slice(0, 3).map(capitalize))
  )

  // ---- routeThroughLine ---------------------------------------------------
  // The "question" the route follows. Anchored on the single most prominent
  // theme, phrased as a through-line.
  const anchorTheme = routeTopThemes[0] || themeSource[0] || 'perception'
  const routeThroughLine = `${capitalize(themePhrase(anchorTheme))}.`

  // ---- personalizedRouteReason (3-5 sentences) ----------------------------
  const pacing = MOOD_PACING[prefs.mood] || MOOD_PACING.curious
  const interestSentence = interests.length
    ? `You told us you're drawn to ${proseList(
        interests.map(interestPhrase)
      )}, so this route leans into works where those ideas are strongest.`
    : `You kept your interests open, so this route samples the strongest and most varied works in the exhibition.`

  const themeSentence = routeTopThemes.length
    ? `Across the ${route.length} stops, ${proseList(
        routeTopThemes.map(themePhrase)
      )} keep returning as a shared thread.`
    : ''

  const knowledgeWord = String(prefs.knowledge || 'curious').toLowerCase()
  // styleLabel is null when the visitor didn't pick an explanation style; in
  // that case describe the voice by their knowledge level alone.
  const styleSentence = styleLabel
    ? `Explanations are written in ${article(
        styleLabel
      )} ${styleLabel.toLowerCase()} voice for ${article(
        knowledgeWord
      )} ${knowledgeWord} visitor.`
    : `Explanations are pitched for ${article(
        knowledgeWord
      )} ${knowledgeWord} visitor.`

  const orderSentence = roomOrderSentence(route)

  const personalizedRouteReason = [
    `This is ${pacing}.`,
    interestSentence,
    themeSentence,
    styleSentence,
    orderSentence,
  ]
    .filter(Boolean)
    .join(' ')

  // ---- builtFor labels ----------------------------------------------------
  const builtFor = [
    prefs.mood ? `${moodLabel} mood` : null,
    prefs.style ? `${styleLabel} style` : null,
    prefs.knowledge ? `${prefs.knowledge} level` : null,
  ].filter(Boolean)

  // ---- per-stop connection notes ------------------------------------------
  const stopConnectionNotes = route.map((art, i) => {
    const prev = route[i - 1]
    const next = route[i + 1]
    const isFirst = i === 0
    const isLast = i === route.length - 1
    const primaryTheme = (art.themes && art.themes[0]) || anchorTheme

    // Short "why this stop" reason for the preview card.
    const reason = isFirst
      ? `Starts the route: a strong entry point into ${themePhrase(
          primaryTheme
        )}.`
      : isLast
      ? `Closes the route by pulling the exhibition's ideas together.`
      : `Continues the thread of ${themePhrase(primaryTheme)}.`

    // Connection to the previous stop.
    let connectionToPrev = ''
    if (!isFirst && prev) {
      const shared = (art.themes || []).filter((t) =>
        (prev.themes || []).includes(t)
      )
      if (shared.length) {
        connectionToPrev = `Picks up ${proseList(
          shared.map(themePhrase)
        )} from ${prev.artist}'s ${prev.title}, seen at the last stop.`
      } else {
        connectionToPrev = `Shifts gears from ${prev.artist}'s ${prev.title} to a different way of working — a deliberate contrast.`
      }
    }

    // Hint toward the next stop.
    let hintToNext = ''
    if (!isLast && next) {
      const sharedNext = (art.themes || []).filter((t) =>
        (next.themes || []).includes(t)
      )
      hintToNext = sharedNext.length
        ? `Next, ${next.artist} carries ${proseList(
            sharedNext.map(themePhrase)
          )} further.`
        : `Next, the route turns to ${next.artist} for a new angle on the theme.`
    }

    // Reminder of the route theme / interest, tailored to position.
    const themeReminder = isFirst
      ? `Keep the route's thread in mind as you go: ${routeThroughLine}`
      : isLast
      ? `This is where the route's thread — ${themePhrase(
          anchorTheme
        )} — comes together.`
      : `Still following the route's thread: ${anchorThemeReminder(
          anchorTheme
        )}.`

    return {
      id: art.id,
      reason,
      connectionToPrev,
      hintToNext,
      themeReminder,
    }
  })

  // ---- sequenceExplanation (for the completion summary) -------------------
  const first = route[0]
  const last = route[route.length - 1]
  const likedThemeKeys = Object.keys(likedThemes || {})
  const likeSentence = likedThemeKeys.length
    ? `Along the way you responded to ${proseList(
        likedThemeKeys.slice(0, 3).map(themePhrase)
      )}, and the route leaned further into those as it went.`
    : ''

  const sequenceExplanation = [
    `The route opened with ${first.artist}'s ${first.title} to set up ${themePhrase(
      (first.themes && first.themes[0]) || anchorTheme
    )}.`,
    routeTopThemes.length
      ? `From there, ${proseList(
          routeTopThemes.map(themePhrase)
        )} tied the stops together.`
      : '',
    likeSentence,
    `It closed with ${last.artist}'s ${last.title}, bringing the exhibition's ideas to a resting point.`,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    routeTheme,
    routeThroughLine,
    personalizedRouteReason,
    builtFor,
    sequenceExplanation,
    stopConnectionNotes,
    topThemes: routeTopThemes,
  }
}

function anchorThemeReminder(theme) {
  return themePhrase(theme)
}

// Describe the physical room progression (spec §19): which rooms the route
// moves through and why it keeps walking to a minimum. Numeric room number is
// the true gallery sequence (visitor starts at Room 1), so a route that mostly
// moves forward and stays close together spends time looking, not walking.
function roomOrderSentence(route) {
  // Deduped room sequence in visiting order, ignoring works without a room.
  const rooms = []
  route.forEach((art) => {
    const n = art.roomNumber
    if (typeof n === 'number' && rooms[rooms.length - 1] !== n) {
      rooms.push(n)
    }
  })

  if (rooms.length === 0) {
    return 'Stops are ordered to keep the walk between works short.'
  }
  if (rooms.length === 1) {
    return `Every stop sits in Room ${rooms[0]}, so you barely move between works and can focus on looking.`
  }

  // Count backward steps to describe how much the route avoids backtracking.
  let backSteps = 0
  for (let i = 1; i < rooms.length; i++) {
    if (rooms[i] < rooms[i - 1]) backSteps++
  }

  const roomList = proseList(rooms.map((n) => `Room ${n}`))
  const flow =
    backSteps === 0
      ? 'moving steadily forward without doubling back'
      : 'grouping nearby works together so backtracking stays minimal'

  return `The route runs through ${roomList}, ${flow}, so you spend your time looking rather than walking.`
}

/** Look up a single stop's connection note by artwork id. */
export function noteForStop(narrative, artId) {
  if (!narrative || !narrative.stopConnectionNotes) return null
  return narrative.stopConnectionNotes.find((n) => n.id === artId) || null
}
