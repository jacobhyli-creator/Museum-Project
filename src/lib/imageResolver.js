// ---------------------------------------------------------------------------
// Image resolution (spec §27–§33).
//
// Decides which image to show for an artwork and how much to trust it. Verified
// online images are resolved at BUILD time (scripts/verified-images.json ->
// normalizeArtworkData), so the fields already live on the artwork here and the
// UI never makes a network call. The LOCAL converted visitor photo
// (public/artworks/<ID>.jpg) is REFERENCE-ONLY and is never the default display
// image — it is only used as a last resort before the placeholder.
//
// resolveArtworkImage() returns:
//   { url, sourceType, confidence, needsReview, reason, sourcePage, credit }
//
// Source-type priority (spec §29):
//   1. Verified online image (>=90 confidence)  → preferredImageUrl
//   2. Lower-confidence verified online match (75–89) → preferredImageUrl, flagged
//   3. Local reference photo — ONLY if verified to depict this work → imageUrl
//   4. Placeholder                              → elegant "image forthcoming" tile
//
// NOTE on (3): the local photo library was bulk-assigned by position, not
// matched per artwork, so an unverified local photo is almost always a
// different artist's work. It is therefore never displayed unless explicitly
// verified. A moved museum URL is repaired for real by
// scripts/refresh-images.mjs, which re-finds the image on the museum's own
// object page.
// ---------------------------------------------------------------------------

// Confidence bands (0–1). Verified online images carry their own 0–100 match
// confidence (converted to 0–1). Local converted photos are visitor snapshots,
// not official reproductions, so they cap below 1.0.
const CONFIDENCE = {
  driveFallback: 0.7, // local converted visitor photo (reference-only)
  driveFallbackUnreviewed: 0.55,
  placeholder: 0.0,
}

// Below this (0–1), a work is flagged into the human review queue (spec §31–§33).
// Verified online images at >=0.90 (90/100) are accepted outright.
const REVIEW_THRESHOLD = 0.9

/**
 * Resolve the best available image for a normalized artwork.
 * Pure + synchronous — uses only fields already on the artwork.
 */
export function resolveArtworkImage(artwork) {
  if (!artwork) {
    return {
      url: null,
      sourceType: 'Placeholder',
      confidence: CONFIDENCE.placeholder,
      needsReview: true,
      reason: 'No artwork provided.',
    }
  }

  // -- 1 & 2: verified online image (build-time match OR admin-published) ----
  // Two ways an artwork gets a trusted display image:
  //   (a) a build-time verified match (scripts/verified-images.json) that
  //       carries its own 0–100 match confidence, and
  //   (b) an image an admin explicitly published in the backend, which is a
  //       human decision and carries humanImageReviewed=true but often NO
  //       numeric match_confidence.
  // Both live on preferredImageUrl. Previously we required a confidence >=75,
  // which silently DROPPED admin-published images (their confidence is null),
  // so backend image changes never reached the tour. An admin-reviewed image is
  // trusted on its own; auto-matched images still need >=75 to be shown.
  const verifiedUrl = artwork.preferredImageUrl
  const reviewed = artwork.humanImageReviewed === true
  const rawConfidence =
    typeof artwork.imageMatchConfidence === 'number'
      ? artwork.imageMatchConfidence
      : null
  const hasUrl = typeof verifiedUrl === 'string' && verifiedUrl.length > 0
  const trustedByConfidence = rawConfidence != null && rawConfidence >= 75
  if (hasUrl && (reviewed || trustedByConfidence)) {
    // Confidence for display/flagging: use the numeric score when present;
    // otherwise an admin-published image is fully trusted (1.0).
    const confidence = rawConfidence != null ? rawConfidence / 100 : 1
    return {
      url: verifiedUrl,
      sourceType: artwork.preferredImageSourceType || 'Online',
      confidence,
      needsReview: !reviewed && confidence < REVIEW_THRESHOLD,
      reason:
        artwork.imageSelectionReason ||
        (reviewed
          ? 'Image published/approved by an admin.'
          : 'Verified online image resolved at build time.'),
      sourcePage: artwork.preferredImageSourcePage || null,
      credit: artwork.preferredImageCredit || artwork.imageCredit || null,
    }
  }

  // -- 3: local reference photo (only when no verified online image) --------
  // The local converted visitor photo is reference-only. It is shown ONLY when
  // someone has confirmed it actually depicts THIS artwork (see
  // hasVerifiedLocalPhoto) — the photo library was bulk-assigned by position,
  // so an unverified local photo is usually a different artist's work entirely.
  const local = artwork.imageUrl
  const isLocal = typeof local === 'string' && local.startsWith('/artworks/')
  if (isLocal && !artwork.imagePlaceholderFallback && hasVerifiedLocalPhoto(artwork)) {
    const confidence = CONFIDENCE.driveFallbackUnreviewed
    return {
      url: local,
      sourceType: 'Local Reference Photo',
      confidence,
      needsReview: true,
      reason:
        'No verified online image found; showing a reference visitor photo (needs image review).',
      sourcePage: null,
      credit: artwork.imageCredit || null,
    }
  }

  // -- 4: placeholder -------------------------------------------------------
  return {
    url: null,
    sourceType: 'Placeholder',
    confidence: CONFIDENCE.placeholder,
    needsReview: true,
    reason: 'No usable image found; showing placeholder. Needs image review.',
    sourcePage: null,
    credit: null,
  }
}

/**
 * Has a human confirmed that this artwork's device-local photo actually shows
 * THIS work?
 *
 * This gate exists because the local library in public/artworks/<CODE>.jpg was
 * bulk-assigned: each artwork got the next visitor photo in sequence, not a
 * photo matched to it. Every catalogued work's `sourcePhoto` is filed under a
 * DIFFERENT artist than the work it is attached to (e.g. Agnes Martin's "Wheat"
 * points at a photo shot in the Sigmar Polke room). Displaying one of these as
 * though it were the artwork is worse than showing nothing: the visitor is told
 * they are looking at a painting they are not.
 *
 * So an unverified local photo is never displayed. Set `localPhotoVerified` on
 * an artwork (or mark it human-reviewed in the backend) once someone has
 * actually looked at the photo and confirmed the match.
 */
export function hasVerifiedLocalPhoto(artwork) {
  return artwork?.localPhotoVerified === true
}

/**
 * The device-local reference photo URL for an artwork, if one exists AND has
 * been verified to depict that artwork — otherwise null.
 *
 * Used as a RUNTIME fallback: hotlinked museum images (SFMOMA's CDN, foundation
 * sites) periodically move and start returning 403/404 at load time. When that
 * happens the display components consult this before giving up. Because the
 * local photos are unverified by default this normally returns null, and the
 * component shows the honest "image forthcoming" placeholder instead of a
 * confidently-wrong painting.
 *
 * The real repair for a moved URL is scripts/refresh-images.mjs, which
 * re-discovers the image's new location from the museum's own object page.
 */
export function localFallbackImage(artwork) {
  const local = artwork?.imageUrl
  if (typeof local === 'string' && local.startsWith('/artworks/') && hasVerifiedLocalPhoto(artwork)) {
    // Respect Vite's base path so it resolves under any deploy sub-path.
    const base = (import.meta.env && import.meta.env.BASE_URL) || '/'
    return base.replace(/\/$/, '') + local
  }
  return null
}

/**
 * Build the human review queue (spec §31–§33): every artwork whose resolved
 * image is low-confidence or missing, with the reason, so a curator can fix it.
 */
export function buildImageReviewQueue(artworks = []) {
  return artworks
    .map((a) => ({ artwork: a, resolution: resolveArtworkImage(a) }))
    .filter(({ resolution }) => resolution.needsReview)
    .map(({ artwork, resolution }) => ({
      id: artwork.id,
      title: artwork.title,
      artist: artwork.artist,
      sourceType: resolution.sourceType,
      confidence: resolution.confidence,
      matchConfidence: artwork.imageMatchConfidence ?? null,
      reason: resolution.reason,
      preferredImageUrl: artwork.preferredImageUrl || null,
      preferredImageSourcePage: artwork.preferredImageSourcePage || null,
      sourcePhoto: artwork.sourcePhoto || null,
    }))
}
