// ---------------------------------------------------------------------------
// Approved interest -> dataset-theme alias map (spec §9–§10).
//
// Interest matching is EXPLICIT, not fuzzy. Each quiz interest maps to:
//   - `themes`  : dataset main-theme tokens that count as an EXACT theme match
//   - `tags`    : dataset tag tokens that count as a TAG match
//   - `aliases` : approved *related* theme/tag tokens that count as an ALIAS match
//
// Scoring weights (spec §9, applied in scoring.js):
//   exact main-theme match  = 1.0
//   exact tag match         = 0.7
//   approved alias match    = 0.5
//   no relationship         = 0.0
//
// This file is the single editable source for interest relationships. To adjust
// how an interest maps onto the real dataset vocabulary, edit here only — no
// fuzzy string matching happens anywhere in the engine.
//
// Dataset theme vocabulary (54 tokens) and tag vocabulary come from the real
// "Ways of Seeing: Fourteen Artists" data at SFMOMA.
// ---------------------------------------------------------------------------

// Interest key -> { themes, tags, aliases }. Keys are the canonical quiz
// interest `value`s defined in quizOptions.js (lowercase, hyphen-free words).
export const INTEREST_ALIAS_MAP = {
  color: {
    themes: ['color', 'light'],
    tags: ['saturation', 'palette', 'hue'],
    aliases: ['seeing', 'perception'],
  },
  abstraction: {
    themes: ['line', 'gesture', 'process', 'style'],
    tags: ['nonrepresentational', 'mark-making', 'abstraction'],
    aliases: ['rhythm', 'interval', 'balance', 'scale'],
  },
  figuration: {
    themes: ['body', 'identity', 'celebrity'],
    tags: ['portrait', 'figure', 'face'],
    aliases: ['photography', 'domestic life', 'everyday objects'],
  },
  gesture: {
    themes: ['gesture', 'touch', 'process'],
    tags: ['brushwork', 'mark-making', 'hand'],
    aliases: ['line', 'rhythm', 'weight'],
  },
  geometry: {
    themes: ['line', 'space', 'architecture', 'balance'],
    tags: ['grid', 'structure', 'geometry'],
    aliases: ['scale', 'interval', 'discipline'],
  },
  emotion: {
    themes: ['emotion', 'memory', 'death', 'anxiety'],
    tags: ['grief', 'longing', 'feeling'],
    aliases: ['contemplation', 'silence', 'violence'],
  },
  philosophy: {
    themes: ['perception', 'truth', 'doubt', 'seeing', 'ideology'],
    tags: ['skepticism', 'meaning', 'epistemology'],
    aliases: ['media', 'instability', 'self-doubt', 'time'],
  },
  'popular-culture': {
    themes: ['celebrity', 'mass media', 'media', 'consumption'],
    tags: ['advertising', 'appropriation', 'image reproduction'],
    aliases: ['image circulation', 'photography', 'parody', 'humor'],
  },
  identity: {
    themes: ['identity', 'body', 'memory'],
    tags: ['self', 'gender', 'autobiography'],
    aliases: ['celebrity', 'domestic life', 'history'],
  },
  materials: {
    themes: ['process', 'touch', 'transformation'],
    tags: ['chemicals', 'layering', 'medium', 'texture'],
    aliases: ['weight', 'gravity', 'scale', 'photography'],
  },
  light: {
    themes: ['light', 'color', 'space'],
    tags: ['luminous', 'atmosphere', 'glow'],
    aliases: ['seeing', 'perception', 'silence'],
  },
  history: {
    themes: ['history', 'ideology', 'myth'],
    tags: ['politics', 'era', 'archive'],
    aliases: ['mass media', 'memory', 'consumption', 'violence'],
  },
  perception: {
    themes: ['perception', 'seeing', 'light'],
    tags: ['optical', 'vision', 'illusion'],
    aliases: ['color', 'space', 'instability', 'truth'],
  },
  memory: {
    themes: ['memory', 'time', 'history'],
    tags: ['nostalgia', 'trace', 'archive'],
    aliases: ['death', 'identity', 'domestic life'],
  },
  death: {
    themes: ['death', 'violence', 'anxiety'],
    tags: ['mortality', 'loss', 'grief'],
    aliases: ['memory', 'emotion', 'time'],
  },
  time: {
    themes: ['time', 'process', 'interval', 'repetition'],
    tags: ['duration', 'sequence', 'change'],
    aliases: ['rhythm', 'memory', 'transformation'],
  },
  space: {
    themes: ['space', 'architecture', 'scale'],
    tags: ['spatial', 'installation', 'environment'],
    aliases: ['geometry', 'light', 'balance'],
  },
  'everyday-life': {
    themes: ['everyday objects', 'domestic life', 'consumption'],
    tags: ['ordinary', 'household', 'still life'],
    aliases: ['mass media', 'humor', 'photography'],
  },
  humor: {
    themes: ['humor', 'parody', 'absurdity'],
    tags: ['comic', 'satire', 'wit'],
    aliases: ['popular culture', 'style', 'transformation'],
  },
  nature: {
    themes: ['landscape', 'light'],
    tags: ['organic', 'natural world', 'weather'],
    aliases: ['space', 'color', 'serenity'],
  },
  photography: {
    themes: ['photography', 'media', 'image circulation'],
    tags: ['camera', 'reproduction', 'print'],
    aliases: ['mass media', 'seeing', 'truth'],
  },
  process: {
    themes: ['process', 'transformation', 'chance'],
    tags: ['method', 'experiment', 'material'],
    aliases: ['touch', 'gesture', 'instability'],
  },
  scale: {
    themes: ['scale', 'weight', 'gravity', 'mass'],
    tags: ['monumental', 'size', 'volume'],
    aliases: ['space', 'architecture', 'balance'],
  },
}

// All quiz interest keys, for validation / UI generation.
export const INTEREST_KEYS = Object.keys(INTEREST_ALIAS_MAP)

/**
 * Resolve a single quiz interest key to its approved theme/tag/alias sets.
 * Returns empty sets for an unknown key (safe missing handling, spec §34).
 */
export function resolveInterest(interestKey) {
  const entry = INTEREST_ALIAS_MAP[interestKey]
  if (!entry) {
    return { themes: new Set(), tags: new Set(), aliases: new Set() }
  }
  return {
    themes: new Set(entry.themes || []),
    tags: new Set(entry.tags || []),
    aliases: new Set(entry.aliases || []),
  }
}
