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

// Interests: { value (canonical key), label (shown in UI) }. Values must match
// the keys in src/lib/aliasMap.js so interest matching resolves correctly.
export const interestOptions = [
  { value: 'color', label: 'Color' },
  { value: 'abstraction', label: 'Abstraction' },
  { value: 'figuration', label: 'Figuration' },
  { value: 'gesture', label: 'Gesture' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'emotion', label: 'Emotion' },
  { value: 'philosophy', label: 'Philosophy' },
  { value: 'popular-culture', label: 'Popular culture' },
  { value: 'identity', label: 'Identity' },
  { value: 'materials', label: 'Materials & process' },
  { value: 'light', label: 'Light' },
  { value: 'history', label: 'History' },
  { value: 'perception', label: 'Perception & seeing' },
  { value: 'memory', label: 'Memory' },
  { value: 'death', label: 'Mortality' },
  { value: 'time', label: 'Time & repetition' },
  { value: 'space', label: 'Space & scale' },
  { value: 'everyday-life', label: 'Everyday life' },
  { value: 'humor', label: 'Humor & the absurd' },
  { value: 'nature', label: 'Nature & landscape' },
  { value: 'photography', label: 'Photography & media' },
  { value: 'process', label: 'Chance & transformation' },
  { value: 'scale', label: 'Weight & monumentality' },
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
