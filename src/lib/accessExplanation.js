// ===========================================================================
// accessExplanation.js
// One-line, non-creepy explanation of WHERE a saved artwork lives, so the Save
// UI can set honest expectations (master prompt PART 1/7).
//
//   * signed-in + opted-in -> saved to the account, available on future visits.
//   * everyone else        -> saved on this device for this session only.
// ===========================================================================

export function accessExplanationFor({ optedIn } = {}) {
  return optedIn
    ? 'Saved to your account — available on future visits.'
    : 'Saved on this device for this session.'
}
