// ---------------------------------------------------------------------------
// Quiz option definitions. Kept as data so the quiz UI and the recommendation
// engine stay in sync. Interest and route-type *values* are canonical keys that
// match src/lib/aliasMap.js and src/lib/routeTypeRules.js exactly.
// ---------------------------------------------------------------------------

export const timeOptions = [
  { value: 30, label: '30 minutes', artworks: 4 },
  { value: 60, label: '60 minutes', artworks: 6 },
  { value: 90, label: '90 minutes', artworks: 8 },
]

// Interests: { value (canonical key), label (shown in UI), tier, group?, hint? }.
//   - `value` MUST match the keys in src/lib/aliasMap.js so interest matching
//     resolves correctly. It is the ONLY field the recommendation engine reads
//     (see interestMatch() in src/lib/scoring.js) — label/tier/group/hint are
//     display-only and can be changed freely without affecting scoring.
//   - `tier`: 'popular' chips show first (always visible); 'more' chips live
//     behind the "More interests" expander in the quiz UI.
//   - `group`: for 'more' chips only — which labelled section they appear under
//     (see interestGroups below). Ignored for 'popular' chips.
//   - `hint`: short plain-English explanation, shown on demand (desktop hover +
//     the "What do these mean?" helper). Never shown by default.
export const interestOptions = [
  // Popular — always visible.
  { value: 'color', label: 'Color', tier: 'popular' },
  { value: 'figuration', label: 'People', tier: 'popular' },
  { value: 'emotion', label: 'Emotion', tier: 'popular' },
  { value: 'history', label: 'History', tier: 'popular' },
  { value: 'nature', label: 'Nature', tier: 'popular' },
  {
    value: 'abstraction',
    label: 'Abstraction',
    tier: 'popular',
    hint: 'Shapes, color and form rather than recognizable objects.',
  },
  { value: 'humor', label: 'Humor', tier: 'popular' },
  { value: 'everyday-life', label: 'Everyday life', tier: 'popular' },

  // More interests — behind the expander, organized into groups.
  // --- Visual ---
  {
    value: 'light',
    label: 'Light',
    tier: 'more',
    group: 'visual',
    hint: 'Art where brightness, shadow, glow, or atmosphere matters.',
  },
  {
    value: 'geometry',
    label: 'Geometry',
    tier: 'more',
    group: 'visual',
    hint: 'Art built around shapes, lines, grids, or structure.',
  },
  {
    value: 'gesture',
    label: 'Gesture & movement',
    tier: 'more',
    group: 'visual',
    hint: 'Art that feels energetic, physical, or made through visible motion.',
  },
  {
    value: 'scale',
    label: 'Scale & monumentality',
    tier: 'more',
    group: 'visual',
    hint: 'Art that feels large, heavy, powerful, or physically imposing.',
  },
  {
    value: 'space',
    label: 'Space & environment',
    tier: 'more',
    group: 'visual',
    hint: 'Art that changes how you experience the room or surrounding space.',
  },
  {
    value: 'photography',
    label: 'Photography & media',
    tier: 'more',
    group: 'visual',
    hint: 'Art involving photography, film, video, print, or mass media.',
  },

  // --- Ideas ---
  {
    value: 'identity',
    label: 'Identity',
    tier: 'more',
    group: 'ideas',
    hint: 'Art about selfhood, culture, gender, race, body, or personal experience.',
  },
  {
    value: 'memory',
    label: 'Memory',
    tier: 'more',
    group: 'ideas',
    hint: 'Art connected to remembering, loss, traces, or the past.',
  },
  {
    value: 'philosophy',
    label: 'Philosophy & big questions',
    tier: 'more',
    group: 'ideas',
    hint: 'Art that raises abstract questions about reality, meaning, perception, or existence.',
  },
  {
    value: 'time',
    label: 'Time & repetition',
    tier: 'more',
    group: 'ideas',
    hint: 'Art involving repeated forms, sequence, duration, rhythm, or change over time.',
  },
  {
    value: 'perception',
    label: 'Perception & ways of seeing',
    tier: 'more',
    group: 'ideas',
    hint: 'Art that makes you question how vision, illusion, or interpretation works.',
  },
  {
    value: 'death',
    label: 'Life & mortality',
    tier: 'more',
    group: 'ideas',
    hint: 'Art about the body, aging, death, fragility, or being human.',
  },

  // --- Culture & process ---
  {
    value: 'materials',
    label: 'Materials & how art is made',
    tier: 'more',
    group: 'culture',
    hint: 'Art where the process, surface, texture, or physical material is especially important.',
  },
  {
    value: 'popular-culture',
    label: 'Popular culture & media',
    tier: 'more',
    group: 'culture',
    hint: 'Art connected to advertising, celebrities, comics, consumer culture, TV, or mass images.',
  },
  {
    value: 'process',
    label: 'Experimentation, chance & change',
    tier: 'more',
    group: 'culture',
    hint: 'Art involving unusual methods, accidents, transformation, or rule-breaking.',
  },
]

// Groups for the "More interests" expander. `key` matches interestOptions.group.
// `blurb` is a short plain-English explanation shown when the user taps the "?".
// Display-only — never read by the recommendation engine.
export const interestGroups = [
  {
    key: 'visual',
    label: 'Visual',
    blurb:
      'Art chosen for how it looks — light, shape, movement, scale, space, or visual impact.',
  },
  {
    key: 'ideas',
    label: 'Ideas',
    blurb:
      'Art chosen for what it makes you think or feel — identity, memory, time, perception, mortality, or deeper questions.',
  },
  {
    key: 'culture',
    label: 'Culture & process',
    blurb:
      'Art chosen for how it connects to materials, popular culture, media, experimentation, or how artists make things.',
  },
]

export const explanationStyles = [
  { value: 'beginnerFriendly', label: 'Beginner-friendly' },
  { value: 'apArtHistory', label: 'AP Art History' },
  { value: 'philosophical', label: 'Philosophical' },
  { value: 'historicalContext', label: 'Historical context' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'musicConnected', label: 'Music-connected' },
  { value: 'humorous', label: 'Humorous' },
]

export const moodOptions = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'curious', label: 'Curious' },
  { value: 'deep', label: 'Deep / thoughtful' },
  { value: 'efficient', label: 'Fast and efficient' },
  { value: 'emotional', label: 'Emotional / story-focused' },
]

export const knowledgeLevels = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
]

// Route types: { value (canonical key), label, description }. Values must match
// the keys in src/lib/routeTypeRules.js.
export const routeTypeOptions = [
  {
    value: 'highlights',
    label: 'Highlights',
    description: 'The must-see, signature works of the show.',
  },
  {
    value: 'beginner-friendly',
    label: 'Beginner-friendly',
    description: 'The most approachable, easy-to-connect-with works.',
  },
  {
    value: 'deep-philosophical',
    label: 'Deep & philosophical',
    description: 'Idea-dense works that reward slow thinking.',
  },
  {
    value: 'visually-striking',
    label: 'Visually striking',
    description: 'Bold, high-impact works that command the room.',
  },
  {
    value: 'weird-surprising',
    label: 'Weird & surprising',
    description: 'Strange, uncanny, unexpected works.',
  },
  {
    value: 'emotionally-powerful',
    label: 'Emotionally powerful',
    description: 'Works that hit hard emotionally.',
  },
  {
    value: 'historically-important',
    label: 'Historically important',
    description: 'Works tied to key historical moments.',
  },
  {
    value: 'music-connected',
    label: 'Music-connected',
    description: 'Works with strong ties to rhythm and music.',
  },
]

// ---------------------------------------------------------------------------
// Legacy exports kept for the fallback engine (src/lib/recommendation.js) so
// nothing breaks if the app ever falls back to the old scoring path. The new
// weighted engine (recommendationEngine.js) uses aliasMap.js instead.
// ---------------------------------------------------------------------------
export const moodThemeMap = {
  relaxed: ['light', 'space', 'color', 'silence', 'nature'],
  curious: ['history', 'popular culture', 'image-making', 'materials'],
  deep: ['philosophy', 'abstraction', 'identity', 'perception'],
  efficient: [],
  emotional: ['emotion', 'gesture', 'figuration', 'everyday life'],
}

export const interestToThemes = {
  color: ['color'],
  abstraction: ['abstraction'],
  figuration: ['figuration'],
  gesture: ['gesture'],
  geometry: ['geometry'],
  emotion: ['emotion'],
  philosophy: ['philosophy'],
  'popular-culture': ['popular culture'],
  identity: ['identity'],
  materials: ['materials'],
  light: ['light'],
  history: ['history'],
}
