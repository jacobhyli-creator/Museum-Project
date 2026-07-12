// ---------------------------------------------------------------------------
// Small numeric helpers shared across the recommendation modules.
// Keeping them here avoids circular imports between scoring files.
// ---------------------------------------------------------------------------

/** Clamp a number to the 0–1 range. Non-numbers collapse to 0. */
export function clamp01(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

/** Clamp to an arbitrary [min, max]. */
export function clamp(n, min, max) {
  if (typeof n !== 'number' || Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

/** Round to `places` decimals (for tidy debug output). */
export function round(n, places = 3) {
  const f = 10 ** places
  return Math.round((n + Number.EPSILON) * f) / f
}
