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

// Interests: { value (canonical key), label (shown in UI), tier, hint? }.
//   - `value` MUST match the keys in src/lib/aliasMap.js so interest matching
//     resolves correctly. It is the ONLY field the recommendation engine reads
//     (see interestMatch() in src/lib/scoring.js) — labels/tier/hint are
//     display-only and can be changed freely without affecting scoring.
//   - `tier`: 'popular' chips show first (always visible); 'more' chips live
//     behind the "More interests" expander in the quiz UI.
//   - `hint`: optional short tooltip, shown only for the least-familiar concepts.
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

  // More interests — behind the expander.
  { value: 'identity', label: 'Identity', tier: 'more' },
  { value: 'memory', label: 'Memory', tier: 'more' },
  { value: 'philosophy', label: 'Philosophy & big questions', tier: 'more' },
  { value: 'light', label: 'Light', tier: 'more' },
  { value: 'materials', label: 'Materials & how art is made', tier: 'more' },
  { value: 'photography', label: 'Photography & media', tier: 'more' },
  {
    value: 'time',
    label: 'Time & repetition',
    tier: 'more',
    hint: 'Works about change, cycles or repeated patterns over time.',
  },
  {
    value: 'scale',
    label: 'Scale & monumentality',
    tier: 'more',
    hint: 'Very large or imposing works built to command a room.',
  },
  {
    value: 'perception',
    label: 'Perception & ways of seeing',
    tier: 'more',
    hint: 'How we look — optical effects, viewpoint and attention.',
  },
  { value: 'gesture', label: 'Gesture & movement', tier: 'more' },
  { value: 'space', label: 'Space & environment', tier: 'more' },
  {
    value: 'process',
    label: 'Experimentation, chance & change',
    tier: 'more',
    hint: 'Art made through experiments, accident or transformation.',
  },
  { value: 'geometry', label: 'Geometry', tier: 'more' },
  { value: 'popular-culture', label: 'Popular culture & media', tier: 'more' },
  { value: 'death', label: 'Life & mortality', tier: 'more' },
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
