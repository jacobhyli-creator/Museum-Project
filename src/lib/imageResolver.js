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
//   3. Local reference photo (only if no verified image)  → imageUrl
//   4. Placeholder                              → elegant "image forthcoming" tile
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
  // The local converted visitor photo is reference-only; it's used here solely
  // as a fallback so a work isn't a bare placeholder, and it's always flagged
  // for review since it's not an official reproduction.
  const local = artwork.imageUrl
  const isLocal = typeof local === 'string' && local.startsWith('/artworks/')
  if (isLocal && !artwork.imagePlaceholderFallback) {
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
 * The device-local reference photo URL for an artwork, if one exists, else null.
 * Used as a RUNTIME fallback: verified online images (SFMOMA CDN, foundation
 * sites) are hotlinked and periodically move, returning 403/404 at load time.
 * When that happens the display components fall back to this local photo before
 * the placeholder, so a moved remote URL never blanks out an image. Distinct
 * from resolveArtworkImage's build-time choice — this is only consulted after a
 * remote image actually fails to load in the browser.
 */
export function localFallbackImage(artwork) {
  const local = artwork?.imageUrl
  if (typeof local === 'string' && local.startsWith('/artworks/')) {
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
