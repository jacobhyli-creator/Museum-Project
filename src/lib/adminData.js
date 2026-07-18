// ===========================================================================
// adminData.js
// All admin database reads/writes in one module. Every function returns a
// uniform { data, error } shape so components can surface errors instead of
// failing silently.
//
// Writes depend on admin Row Level Security: if the signed-in user is not an
// admin/editor, the DB rejects the write and we return that error to the UI.
// ===========================================================================

import { supabase, isSupabaseEnabled } from './supabaseClient.js'

const NOT_CONFIGURED = { data: null, error: { message: 'Supabase is not configured.' } }

// The core scalar/jsonb fields the editor is allowed to change. Kept explicit so
// we never accidentally write server-managed columns (id, timestamps, etc.).
const EDITABLE_FIELDS = [
  'title',
  'artist',
  'year',
  'movement',
  'medium',
  'gallery_location',
  'themes', // jsonb array
  'tags', // jsonb array
  'difficulty_level',
  'conceptual_difficulty',
  'visual_intensity',
  'importance_score',
  'short_summary',
  'room_number', // canonical geographic order (required to publish/route)
  'is_published',
]

// List artworks for the dashboard table (lightweight columns only).
export async function listArtworks() {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('artworks')
    .select('id, code, title, artist, year, room_number, is_published')
    .order('code', { ascending: true })
}

// Full artwork row + its explanation variants, for the editor.
export async function getArtwork(id) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const artwork = await supabase.from('artworks').select('*').eq('id', id).single()
  if (artwork.error) return { data: null, error: artwork.error }

  const explanations = await supabase
    .from('artwork_explanations')
    .select('style, body, draft_body, is_published')
    .eq('artwork_id', id)
  if (explanations.error) return { data: null, error: explanations.error }

  return { data: { ...artwork.data, explanations: explanations.data || [] }, error: null }
}

// Update editable artwork fields. `patch` may contain any subset of EDITABLE_FIELDS.
export async function updateArtwork(id, patch) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const clean = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in patch) clean[key] = patch[key]
  }
  return supabase.from('artworks').update(clean).eq('id', id).select('id').single()
}

// Create or update one explanation variant. The table's unique key is
// (artwork_id, style, language_code) since 0012, so we conflict on all three
// (defaulting language_code to 'en') to update in place instead of duplicating.
export async function upsertExplanation(artworkId, style, body, languageCode = 'en') {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('artwork_explanations')
    .upsert(
      { artwork_id: artworkId, style, language_code: languageCode, body },
      { onConflict: 'artwork_id,style,language_code' }
    )
    .select('id')
    .single()
}

// Bulk create/update explanation variants from a CSV import. Each row is
// { artworkId, style, languageCode, body }. Conflicts on the real 3-column
// unique key so re-imports update in place. Chunks the payload so a large sheet
// doesn't exceed request limits. Runs under the admin session (RLS enforced).
// Returns { data: { upserted }, error }; stops at the first failing chunk.
export async function bulkUpsertExplanations(rows = [], chunkSize = 100) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const payload = (rows || [])
    .filter((r) => r && r.artworkId && r.style)
    .map((r) => ({
      artwork_id: r.artworkId,
      style: r.style,
      language_code: r.languageCode || 'en',
      body: r.body,
    }))
  if (!payload.length) return { data: { upserted: 0 }, error: null }

  let upserted = 0
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize)
    const { error } = await supabase
      .from('artwork_explanations')
      .upsert(chunk, { onConflict: 'artwork_id,style,language_code' })
    if (error) return { data: { upserted }, error }
    upserted += chunk.length
  }
  return { data: { upserted }, error: null }
}

// --- Literature & Music pairing --------------------------------------------
// One optional pairing row per artwork (unique artwork_id). Visitors see it
// only when review_status='approved' AND is_published=true; these admin helpers
// let an editor read, edit, review, and publish it. Writes ONLY artwork_pairings.

const PAIRING_FIELDS = [
  'literature_title',
  'literature_author',
  'literature_reason',
  'music_title',
  'music_artist',
  'music_genre',
  'music_reason',
]

// Fetch the pairing for an artwork (or null if none exists yet).
export async function getPairing(artworkId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('artwork_pairings')
    .select(
      'id, ' +
        PAIRING_FIELDS.join(', ') +
        ', review_status, is_published, updated_at'
    )
    .eq('artwork_id', artworkId)
    .maybeSingle()
}

// Create or update the pairing text for an artwork. Only the seven content
// fields are written here; review/publish state is managed by setPairingState.
export async function upsertPairing(artworkId, fields = {}) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const clean = { artwork_id: artworkId }
  for (const key of PAIRING_FIELDS) {
    if (key in fields) clean[key] = fields[key] === '' ? null : fields[key]
  }
  return supabase
    .from('artwork_pairings')
    .upsert(clean, { onConflict: 'artwork_id' })
    .select('id')
    .single()
}

// Set the review status and/or published flag for a pairing. Pass either or
// both. review_status must be one of draft | needs_review | approved.
export async function setPairingState(artworkId, { reviewStatus, isPublished } = {}) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const patch = {}
  if (typeof reviewStatus === 'string') {
    if (!['draft', 'needs_review', 'approved'].includes(reviewStatus)) {
      return { data: null, error: { message: `Invalid review status "${reviewStatus}".` } }
    }
    patch.review_status = reviewStatus
  }
  if (typeof isPublished === 'boolean') patch.is_published = isPublished
  if (Object.keys(patch).length === 0) {
    return { data: null, error: { message: 'Nothing to update.' } }
  }
  return supabase
    .from('artwork_pairings')
    .update(patch)
    .eq('artwork_id', artworkId)
    .select('id')
    .maybeSingle()
}

// --- Look Closer (guided looking) ------------------------------------------
// One optional guided_looking_sets row per artwork (unique artwork_id) plus up
// to 3 guided_looking_hotspots (unique artwork_id + hotspot_number). Visitors
// see the panel only when the set is review_status='approved' AND
// is_published=true AND it has >=1 published hotspot with both coordinates.
// These admin helpers let an editor read, edit, review, and publish it. They
// write ONLY the two guided-looking tables.

const GUIDED_SET_FIELDS = [
  'whole_artwork_prompt',
  'step_back_reflection',
  'main_source_used',
  'additional_source_used',
  'source_notes',
  'confidence', // High | Medium | Low
  'human_reviewed', // boolean
  'admin_notes',
]

const GUIDED_HOTSPOT_FIELDS = [
  'title',
  'what_to_look_at',
  'why_it_matters',
  'visitor_question',
  'x_coordinate', // numeric 0..100
  'y_coordinate', // numeric 0..100
]

// List every artwork's guided-looking set with its hotspots, for the dashboard.
// Includes admin-only fields (sources/confidence) that the public adapter never
// exposes. Newest-updated first so recently-touched sets surface at the top.
export async function listGuidedLookingSets() {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('guided_looking_sets')
    .select(
      'id, artwork_id, whole_artwork_prompt, step_back_reflection, ' +
        'main_source_used, additional_source_used, source_notes, confidence, ' +
        'human_reviewed, admin_notes, review_status, is_published, updated_at, ' +
        'artworks ( code, title, artist, year ), ' +
        'guided_looking_hotspots ( id, hotspot_number, title, what_to_look_at, ' +
        'why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published )'
    )
    .order('updated_at', { ascending: false })
}

// Fetch the guided-looking set + hotspots for one artwork (or null if none).
export async function getGuidedLooking(artworkId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('guided_looking_sets')
    .select(
      'id, artwork_id, whole_artwork_prompt, step_back_reflection, ' +
        'main_source_used, additional_source_used, source_notes, confidence, ' +
        'human_reviewed, admin_notes, review_status, is_published, updated_at, ' +
        'guided_looking_hotspots ( id, hotspot_number, title, what_to_look_at, ' +
        'why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published )'
    )
    .eq('artwork_id', artworkId)
    .maybeSingle()
}

// Create or update the set-level fields for an artwork. Only the content fields
// above are written; review/publish state is managed by setGuidedLookingState.
export async function upsertGuidedLookingSet(artworkId, fields = {}) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const clean = { artwork_id: artworkId }
  for (const key of GUIDED_SET_FIELDS) {
    if (key in fields) clean[key] = fields[key] === '' ? null : fields[key]
  }
  return supabase
    .from('guided_looking_sets')
    .upsert(clean, { onConflict: 'artwork_id' })
    .select('id')
    .single()
}

// Create or update one hotspot (1..3) for an artwork. The hotspot's parent set
// must already exist (upsertGuidedLookingSet first); we look up set_id here so
// the denormalized set_id + artwork_id stay consistent. Conflicts on
// (artwork_id, hotspot_number) so re-saving updates in place.
export async function upsertGuidedLookingHotspot(artworkId, number, fields = {}) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  if (!Number.isInteger(number) || number < 1 || number > 3) {
    return { data: null, error: { message: `Invalid hotspot number "${number}".` } }
  }
  const set = await supabase
    .from('guided_looking_sets')
    .select('id')
    .eq('artwork_id', artworkId)
    .maybeSingle()
  if (set.error) return { data: null, error: set.error }
  if (!set.data) {
    return { data: null, error: { message: 'Create the set before adding hotspots.' } }
  }
  const clean = {
    set_id: set.data.id,
    artwork_id: artworkId,
    hotspot_number: number,
  }
  for (const key of GUIDED_HOTSPOT_FIELDS) {
    if (key in fields) clean[key] = fields[key] === '' ? null : fields[key]
  }
  return supabase
    .from('guided_looking_hotspots')
    .upsert(clean, { onConflict: 'artwork_id,hotspot_number' })
    .select('id')
    .single()
}

// Set the review status and/or published flag for a guided-looking set. Pass
// either or both. review_status must be one of draft | needs_review | approved.
export async function setGuidedLookingState(artworkId, { reviewStatus, isPublished } = {}) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const patch = {}
  if (typeof reviewStatus === 'string') {
    if (!['draft', 'needs_review', 'approved'].includes(reviewStatus)) {
      return { data: null, error: { message: `Invalid review status "${reviewStatus}".` } }
    }
    patch.review_status = reviewStatus
  }
  if (typeof isPublished === 'boolean') patch.is_published = isPublished
  if (Object.keys(patch).length === 0) {
    return { data: null, error: { message: 'Nothing to update.' } }
  }
  return supabase
    .from('guided_looking_sets')
    .update(patch)
    .eq('artwork_id', artworkId)
    .select('id')
    .maybeSingle()
}

// Publish or unpublish one hotspot (1..3) for an artwork. A hotspot is only
// shown publicly when it is published AND has both coordinates AND its parent
// set is approved+published — the last two are enforced by the set state and
// the public adapter, so this just flips the hotspot flag.
export async function setHotspotPublished(artworkId, number, isPublished) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  if (typeof isPublished !== 'boolean') {
    return { data: null, error: { message: 'isPublished must be a boolean.' } }
  }
  return supabase
    .from('guided_looking_hotspots')
    .update({ is_published: isPublished })
    .eq('artwork_id', artworkId)
    .eq('hotspot_number', number)
    .select('id')
    .maybeSingle()
}

// --- Image review -----------------------------------------------------------
// The tour shows one `is_current` image per artwork (enforced by the partial
// unique index uq_artwork_images_current). These helpers let an admin inspect
// the stored images + online candidates and switch which one is current.

// All stored images for an artwork (current first, then most recent).
export async function listArtworkImages(artworkId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('artwork_images')
    .select(
      'id, url, source_page, source_type, credit, match_confidence, selection_reason, is_current, human_reviewed, review_status, created_at'
    )
    .eq('artwork_id', artworkId)
    .order('is_current', { ascending: false })
    .order('created_at', { ascending: false })
}

// Online candidates found during resolution, best-scored first.
export async function listImageCandidates(artworkId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('image_candidates')
    .select(
      'id, url, source_page, source_type, credit, match_confidence, decision, notes, created_at'
    )
    .eq('artwork_id', artworkId)
    .order('match_confidence', { ascending: false, nullsFirst: false })
}

// Make one stored image the current display image. Because the partial unique
// index allows only one is_current per artwork, we must unset the old current
// first, then set the new one. Runs as two writes (no transaction in the JS
// client); the unset is scoped to the same artwork so it is safe to retry.
export async function setCurrentImage(imageId, artworkId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const unset = await supabase
    .from('artwork_images')
    .update({ is_current: false })
    .eq('artwork_id', artworkId)
    .eq('is_current', true)
  if (unset.error) return { data: null, error: unset.error }
  return supabase
    .from('artwork_images')
    .update({ is_current: true, human_reviewed: true, review_status: 'approved' })
    .eq('id', imageId)
    .eq('artwork_id', artworkId)
    .select('id')
    .single()
}

// Mark a stored image approved/rejected without changing which is current.
export async function reviewImage(imageId, status) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
    return { data: null, error: { message: `Invalid review status: ${status}` } }
  }
  return supabase
    .from('artwork_images')
    .update({ review_status: status, human_reviewed: true })
    .eq('id', imageId)
    .select('id')
    .single()
}

// Copy an online candidate into artwork_images and make it the current image.
// Returns { data, error }; on success data is the new image id.
export async function promoteCandidate(candidateId, artworkId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const cand = await supabase
    .from('image_candidates')
    .select('url, source_page, source_type, credit, match_confidence')
    .eq('id', candidateId)
    .eq('artwork_id', artworkId)
    .single()
  if (cand.error || !cand.data) {
    return { data: null, error: cand.error || { message: 'Candidate not found.' } }
  }
  const unset = await supabase
    .from('artwork_images')
    .update({ is_current: false })
    .eq('artwork_id', artworkId)
    .eq('is_current', true)
  if (unset.error) return { data: null, error: unset.error }
  return supabase
    .from('artwork_images')
    .insert({
      artwork_id: artworkId,
      url: cand.data.url,
      source_page: cand.data.source_page,
      source_type: cand.data.source_type,
      credit: cand.data.credit,
      match_confidence: cand.data.match_confidence,
      selection_reason: 'Promoted from candidate by admin',
      is_current: true,
      human_reviewed: true,
      review_status: 'approved',
    })
    .select('id')
    .single()
}

// --- Image versions (master prompt PART 3) ---------------------------------
// artwork_image_versions is the versioned history behind the image editor. An
// admin pastes/uploads a URL to create a DRAFT, previews + validates it, then
// PUBLISHES it — which marks it active and mirrors it into artwork_images
// (the "current" row the public adapter reads), so the change reaches the tour
// with no redeploy (PART 4). Archive/revert flip the flags; nothing is deleted.

// Basic http(s) URL validation shared by create/preview. Returns true/false.
export function isValidImageUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false
  try {
    const u = new URL(url.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// All versions for an artwork, active first then newest, for the history list.
export async function listImageVersions(artworkId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('artwork_image_versions')
    .select(
      'id, image_url, source_page, source_type, image_credit, match_confidence, status, is_active, created_at, updated_at'
    )
    .eq('artwork_id', artworkId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })
}

// Create a new DRAFT version from a pasted/uploaded URL (never auto-published).
// `meta` may carry source_page, source_type, image_credit, match_confidence.
export async function createImageVersion(artworkId, imageUrl, meta = {}) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  if (!isValidImageUrl(imageUrl)) {
    return { data: null, error: { message: 'Enter a valid http(s) image URL.' } }
  }
  const { data: userData } = await supabase.auth.getUser()
  return supabase
    .from('artwork_image_versions')
    .insert({
      artwork_id: artworkId,
      image_url: imageUrl.trim(),
      source_page: meta.source_page || null,
      source_type: meta.source_type || null,
      image_credit: meta.image_credit || null,
      match_confidence:
        typeof meta.match_confidence === 'number' ? meta.match_confidence : null,
      status: 'draft',
      is_active: false,
      created_by: userData?.user?.id || null,
    })
    .select('id')
    .single()
}

// Publish a version: mark it published + active (unsetting any prior active),
// then MIRROR it into artwork_images as the new current row so the public tour
// picks it up. Runs as sequential writes (no JS-client transaction); all scoped
// to the one artwork so retries are safe.
export async function publishImageVersion(versionId, artworkId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED

  const ver = await supabase
    .from('artwork_image_versions')
    .select('image_url, source_page, source_type, image_credit, match_confidence')
    .eq('id', versionId)
    .eq('artwork_id', artworkId)
    .single()
  if (ver.error || !ver.data) {
    return { data: null, error: ver.error || { message: 'Version not found.' } }
  }

  // Deactivate any currently-active version for this artwork.
  const unsetActive = await supabase
    .from('artwork_image_versions')
    .update({ is_active: false })
    .eq('artwork_id', artworkId)
    .eq('is_active', true)
  if (unsetActive.error) return { data: null, error: unsetActive.error }

  // Activate + publish the chosen version.
  const setActive = await supabase
    .from('artwork_image_versions')
    .update({ status: 'published', is_active: true })
    .eq('id', versionId)
    .eq('artwork_id', artworkId)
    .select('id')
    .single()
  if (setActive.error) return { data: null, error: setActive.error }

  // Mirror into artwork_images as the new current image (public read source).
  const unsetCurrent = await supabase
    .from('artwork_images')
    .update({ is_current: false })
    .eq('artwork_id', artworkId)
    .eq('is_current', true)
  if (unsetCurrent.error) return { data: null, error: unsetCurrent.error }

  const mirror = await supabase
    .from('artwork_images')
    .insert({
      artwork_id: artworkId,
      url: ver.data.image_url,
      source_page: ver.data.source_page,
      source_type: ver.data.source_type,
      credit: ver.data.image_credit,
      match_confidence: ver.data.match_confidence,
      selection_reason: 'Published from image version by admin',
      is_current: true,
      human_reviewed: true,
      review_status: 'approved',
    })
    .select('id')
    .single()
  if (mirror.error) return { data: null, error: mirror.error }

  return { data: { id: versionId }, error: null }
}

// Archive a version (soft-remove). If it was active, also clear is_active so the
// artwork has no dangling active pointer; the admin then publishes another.
export async function archiveImageVersion(versionId, artworkId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('artwork_image_versions')
    .update({ status: 'archived', is_active: false })
    .eq('id', versionId)
    .eq('artwork_id', artworkId)
    .select('id')
    .single()
}

// Revert to a prior version = republish it (re-uses publishImageVersion so the
// active flag + artwork_images mirror stay consistent).
export async function revertToVersion(versionId, artworkId) {
  return publishImageVersion(versionId, artworkId)
}

// --- Image audit + verification (admin-only bulk tool) ---------------------
// A reusable audit that scans every artwork's CURRENT image for problems and,
// for a pasted/chosen candidate, scores it against the artwork metadata using
// the "Official-source + metadata match" standard. All writes go through the
// SAME authenticated admin session used elsewhere (publishImageVersion etc.),
// so Row Level Security is preserved and no service-role key is ever required.
//
// NOTE ON SEARCH: browsers cannot cross-origin fetch museum/search pages (CORS)
// and there is no image-search API wired in, so this tool does NOT auto-scrape
// candidates. Instead it (a) machine-checks loadability of the current image in
// the browser, and (b) scores an admin-provided candidate URL + source page.
// The admin uses the generated official-source search links to find candidates.

// Host classification for the verification standard. OFFICIAL = museum/major
// institution; FOUNDATION = artist estate/foundation/archive; STOCK = never
// auto-approve. Extend as sources are confirmed. `d1hhug17qm51in.cloudfront.net`
// is SFMOMA's image CDN, hence OFFICIAL.
const OFFICIAL_HOSTS = [
  'sfmoma.org', 'd1hhug17qm51in.cloudfront.net', 'customprints.sfmoma.org',
  'moma.org', 'metmuseum.org', 'whitney.org', 'guggenheim.org', 'tate.org.uk',
  'nga.gov', 'si.edu', 'artic.edu', 'getty.edu', 'lacma.org',
  'nationalgallery.org.uk', 'wikimedia.org', 'wikipedia.org',
]
const FOUNDATION_HOSTS = [
  'foundation', 'estate', 'archive', 'artstor', 'joanmitchellfoundation.org',
]
const STOCK_HOSTS = [
  'gettyimages', 'shutterstock', 'alamy', 'istockphoto', 'dreamstime',
  'adobestock', '123rf',
]

// Classify a URL's host into OFFICIAL / FOUNDATION / STOCK / OTHER / LOCAL.
export function classifyImageSource(url) {
  if (typeof url !== 'string' || !url.trim()) return { tier: 'MISSING', host: null }
  if (url.startsWith('/')) return { tier: 'LOCAL', host: 'local' }
  let host
  try {
    host = new URL(url).host.toLowerCase()
  } catch {
    return { tier: 'INVALID', host: null }
  }
  const h = host
  if (OFFICIAL_HOSTS.some((d) => h === d || h.endsWith('.' + d) || h.includes(d)))
    return { tier: 'OFFICIAL', host }
  if (FOUNDATION_HOSTS.some((d) => h.includes(d))) return { tier: 'FOUNDATION', host }
  if (STOCK_HOSTS.some((d) => h.includes(d))) return { tier: 'STOCK', host }
  return { tier: 'OTHER', host }
}

// Load an image URL in a real <img> to confirm it renders (no CORS problem for
// pixels) and read its natural dimensions. Resolves to
// { ok, width, height, reason }. Never rejects. Times out after `timeoutMs`.
export function probeImage(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    if (typeof url !== 'string' || !url.trim()) {
      resolve({ ok: false, width: 0, height: 0, reason: 'missing url' })
      return
    }
    if (url.startsWith('/')) {
      resolve({ ok: false, width: 0, height: 0, reason: 'local reference photo (not an official online image)' })
      return
    }
    if (typeof window === 'undefined' || typeof window.Image === 'undefined') {
      resolve({ ok: false, width: 0, height: 0, reason: 'no browser image loader' })
      return
    }
    const img = new window.Image()
    let done = false
    const finish = (r) => {
      if (done) return
      done = true
      window.clearTimeout(timer)
      img.onload = img.onerror = null
      resolve(r)
    }
    const timer = window.setTimeout(
      () => finish({ ok: false, width: 0, height: 0, reason: `timed out after ${timeoutMs}ms` }),
      timeoutMs
    )
    img.onload = () =>
      finish({ ok: true, width: img.naturalWidth, height: img.naturalHeight, reason: 'ok' })
    img.onerror = () =>
      finish({ ok: false, width: 0, height: 0, reason: 'failed to load (403/404/blocked/not an image)' })
    img.referrerPolicy = 'no-referrer'
    img.src = url
  })
}

// Bulk audit: list every artwork with its current image, probe each image in the
// browser, and flag problems. Returns { data: rows[], error } where each row is
// { id, code, title, artist, year, room_number, is_published, imageUrl,
//   sourceTier, sourceHost, ok, width, height, lowRes, problems[] }.
// `onProgress(done, total)` is called as probes complete so the UI can show a bar.
export async function auditArtworkImages(onProgress) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const exh = await exhibitionId()

  const res = await supabase
    .from('artworks')
    .select(
      `id, code, title, artist, year, room_number, is_published,
       artwork_images ( url, is_current, human_reviewed, review_status )`
    )
    .eq('exhibition_id', exh)
    .is('archived_at', null)
    .order('code', { ascending: true })
  if (res.error) return { data: null, error: res.error }

  const rows = res.data || []
  const total = rows.length
  let done = 0
  const out = []

  for (const a of rows) {
    const current = (a.artwork_images || []).find((i) => i.is_current) || null
    const imageUrl = current?.url || null
    const { tier, host } = classifyImageSource(imageUrl)
    const probe = await probeImage(imageUrl)
    const lowRes = probe.ok && (probe.width < 800 || probe.height < 800)

    const problems = []
    if (!imageUrl) problems.push('Missing image URL')
    else if (tier === 'LOCAL') problems.push('Local-only placeholder (no online image)')
    else if (tier === 'INVALID') problems.push('Malformed image URL')
    else if (!probe.ok) problems.push(`Image does not load (${probe.reason})`)
    if (lowRes) problems.push(`Low resolution (${probe.width}×${probe.height}px)`)
    if (probe.ok && tier === 'STOCK') problems.push('Stock-photo source (not an approved reproduction)')
    if (probe.ok && (tier === 'OTHER') && !current?.human_reviewed)
      problems.push('Unverified source (not an official/foundation host, not human-reviewed)')

    out.push({
      id: a.id,
      code: a.code,
      title: a.title,
      artist: a.artist,
      year: a.year,
      room_number: a.room_number ?? null,
      is_published: a.is_published,
      imageUrl,
      sourceTier: tier,
      sourceHost: host,
      reviewStatus: current?.review_status || null,
      humanReviewed: current?.human_reviewed === true,
      ok: probe.ok,
      width: probe.width,
      height: probe.height,
      lowRes,
      problems,
    })

    done += 1
    if (typeof onProgress === 'function') onProgress(done, total)
  }

  return { data: out, error: null }
}

// Score a candidate image (its source PAGE url + metadata assertions the admin
// filled in) against an artwork, per the "Official-source + metadata match"
// standard. Returns { verdict, confidence, tier, matches, reasons } where
// verdict ∈ 'approve' | 'review' | 'reject'. This NEVER auto-writes — it only
// advises; the admin still chooses the action.
//
// Rules (from the user's standard):
//  - Non-official/foundation source  -> never 'approve' (cap at 'review').
//  - Stock source                    -> 'reject'.
//  - Exact official-source metadata match (artist+title+year all confirmed on an
//    official/foundation host) -> 'approve'.
//  - One minor discrepancy on an official host -> 'review'.
//  - Ambiguous title ("Untitled") without an accession/collection confirmation
//    -> 'review' at best.
//  - Conflicting artist/title/year -> 'reject'.
//  - Any meaningful doubt -> 'review'. Do not guess.
export function scoreCandidateMatch(artwork, candidate = {}) {
  const sourcePage = candidate.sourcePage || candidate.source_page || ''
  const { tier } = classifyImageSource(sourcePage)
  const matches = {
    artist: candidate.artistMatch ?? null, // true|false|null(unknown)
    title: candidate.titleMatch ?? null,
    year: candidate.yearMatch ?? null,
    museum: candidate.museumMatch ?? null,
    accession: candidate.accessionMatch ?? null,
  }
  const reasons = []

  // Hard rejects first.
  if (tier === 'STOCK') {
    reasons.push('Source is a stock-photo host — never an approved reproduction.')
    return { verdict: 'reject', confidence: 0, tier, matches, reasons }
  }
  if (matches.artist === false) {
    reasons.push('Artist conflicts with the catalog record.')
    return { verdict: 'reject', confidence: 0, tier, matches, reasons }
  }
  if (matches.title === false && matches.accession !== true) {
    reasons.push('Title conflicts and no accession match confirms it.')
    return { verdict: 'reject', confidence: 0, tier, matches, reasons }
  }
  if (matches.year === false && matches.accession !== true) {
    reasons.push('Year conflicts and no accession match confirms it.')
    return { verdict: 'reject', confidence: 0, tier, matches, reasons }
  }

  const official = tier === 'OFFICIAL' || tier === 'FOUNDATION'
  if (!official) {
    reasons.push('Source is not an official museum/foundation host — cannot auto-approve.')
  } else {
    reasons.push(`Source host classified ${tier}.`)
  }

  const ambiguousTitle = /^untitled\b/i.test((artwork.title || '').trim())
  const confirmed = (v) => v === true
  const artistOk = confirmed(matches.artist)
  const titleOk = confirmed(matches.title)
  const yearOk = confirmed(matches.year)

  // Count confirmed pillars (artist/title/year), museum + accession as boosters.
  let confirmedCount = [artistOk, titleOk, yearOk].filter(Boolean).length
  const boosters = [confirmed(matches.museum), confirmed(matches.accession)].filter(Boolean).length

  // Approve ONLY when official + all three pillars confirmed, and if the title is
  // ambiguous ("Untitled") only when an accession/collection match backs it.
  let verdict = 'review'
  if (official && artistOk && titleOk && yearOk) {
    if (ambiguousTitle && !confirmed(matches.accession) && !confirmed(matches.museum)) {
      verdict = 'review'
      reasons.push('Title is "Untitled" — needs an accession/collection match to auto-approve.')
    } else {
      verdict = 'approve'
      reasons.push('Official source with artist, title, and year all confirmed.')
    }
  } else if (official && confirmedCount >= 2) {
    verdict = 'review'
    reasons.push('Official source but not every field is confirmed — one minor discrepancy.')
  } else {
    verdict = 'review'
    if (confirmedCount < 2) reasons.push('Too few fields confirmed to approve.')
  }

  // A rough confidence score for display (0–100). Not used for auto-approval on
  // its own; the verdict above governs that.
  const tierWeight = tier === 'OFFICIAL' ? 40 : tier === 'FOUNDATION' ? 35 : tier === 'OTHER' ? 10 : 0
  const confidence = Math.min(
    100,
    tierWeight + confirmedCount * 15 + boosters * 5
  )

  return { verdict, confidence, tier, matches, reasons }
}

// Mark an artwork's CURRENT image as needing review (no reliable replacement was
// found). Writes review_status='pending' + human_reviewed=false on the current
// artwork_images row via the authenticated session (RLS enforced). If there is
// no current image row, it's a no-op success (nothing to flag).
export async function markImageNeedsReview(artworkId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const cur = await supabase
    .from('artwork_images')
    .select('id')
    .eq('artwork_id', artworkId)
    .eq('is_current', true)
    .maybeSingle()
  if (cur.error) return { data: null, error: cur.error }
  if (!cur.data) return { data: { id: null }, error: null }
  return supabase
    .from('artwork_images')
    .update({ review_status: 'pending', human_reviewed: false })
    .eq('id', cur.data.id)
    .select('id')
    .single()
}

// Approve + publish a verified candidate URL as the new current image, recording
// provenance. Creates a published image version (which mirrors into
// artwork_images as current) AND touches artworks.updated_at so the public
// content-version fingerprint changes and new sessions pick it up. Runs entirely
// under the admin's authenticated session — RLS decides whether the write is
// allowed. `meta` carries { source_page, source_type, image_credit,
// match_confidence, selection_reason }.
export async function approveAndPublishImage(artworkId, imageUrl, meta = {}) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  if (!isValidImageUrl(imageUrl)) {
    return { data: null, error: { message: 'Enter a valid http(s) image URL.' } }
  }
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id || null

  // Create a published+active version directly (bypasses the two-step draft flow
  // but re-uses the same publish semantics for consistency).
  const created = await createImageVersion(artworkId, imageUrl, {
    source_page: meta.source_page || null,
    source_type: meta.source_type || 'Official Museum',
    image_credit: meta.image_credit || null,
    match_confidence:
      typeof meta.match_confidence === 'number' ? meta.match_confidence : null,
  })
  if (created.error) return { data: null, error: created.error }

  const pub = await publishImageVersion(created.data.id, artworkId)
  if (pub.error) return { data: null, error: pub.error }

  // Touch the artwork so getContentVersion() changes (cache/version bump) and
  // record who made the change if the column exists. updated_at is maintained by
  // the set_updated_at trigger; the explicit write here forces the trigger to run
  // even when no visible column changed.
  const touch = await supabase
    .from('artworks')
    .update({ updated_by: uid })
    .eq('id', artworkId)
    .select('id')
    .maybeSingle()
  // If `updated_by` doesn't exist, fall back to a harmless no-op touch so the
  // updated_at trigger still fires; never fail the publish over provenance.
  if (touch.error) {
    await supabase
      .from('artworks')
      .update({ is_published: true }) // idempotent for published rows; fires trigger
      .eq('id', artworkId)
      .eq('is_published', true)
  }

  return { data: { versionId: created.data.id }, error: null }
}

// Build precise official-source search links for an artwork so the admin can
// find a correct reproduction fast. Pure string builder — no network. Returns an
// array of { label, url } opening museum/foundation/Wikimedia searches.
export function buildSearchLinks(artwork = {}) {
  const title = (artwork.title || '').trim()
  const artist = (artwork.artist || '').trim()
  const year = artwork.year ? String(artwork.year).trim() : ''
  const q = [artist, title, year].filter(Boolean).join(' ')
  const enc = encodeURIComponent
  const links = [
    {
      label: 'SFMOMA collection',
      url: `https://www.sfmoma.org/search/?q=${enc([artist, title].filter(Boolean).join(' '))}`,
    },
    {
      label: 'Wikimedia Commons',
      url: `https://commons.wikimedia.org/w/index.php?search=${enc(q)}&title=Special:MediaSearch&type=image`,
    },
    {
      label: 'Google Arts & Culture',
      url: `https://artsandculture.google.com/search?q=${enc(q)}`,
    },
    {
      label: 'Google Images',
      url: `https://www.google.com/search?tbm=isch&q=${enc(q + ' painting official museum')}`,
    },
  ]
  return links
}

// --- Exhibition resolution (shared by model/analytics helpers) -------------
// The toured exhibition slug (matches tourDataAdapter's EXHIBITION_SLUG).
const EXHIBITION_SLUG = 'ways-of-seeing-fourteen-artists'
let _exhId = null
async function exhibitionId() {
  if (_exhId) return _exhId
  const { data } = await supabase
    .from('exhibitions')
    .select('id')
    .eq('slug', EXHIBITION_SLUG)
    .maybeSingle()
  _exhId = data?.id ?? null
  return _exhId
}

// --- ML model registry + training runs (master prompt PART 6) --------------
// model_versions (0002) IS the registry; these helpers list/activate versions
// and read their training-run + metric lineage (0011). Activation flips the one
// is_active row per exhibition (rollback = activate an older version).

// List model versions for the toured exhibition, newest first.
export async function listModelVersions() {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const exh = await exhibitionId()
  return supabase
    .from('model_versions')
    .select('id, version, stage, config, training_rows, accuracy, is_active, notes, created_at')
    .eq('exhibition_id', exh)
    .order('version', { ascending: false })
}

// Activate one model version (unset the prior active first — partial unique
// index allows only one active per exhibition). Rollback uses the same call
// with an older version id.
export async function activateModelVersion(versionId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const exh = await exhibitionId()
  const unset = await supabase
    .from('model_versions')
    .update({ is_active: false })
    .eq('exhibition_id', exh)
    .eq('is_active', true)
  if (unset.error) return { data: null, error: unset.error }
  return supabase
    .from('model_versions')
    .update({ is_active: true })
    .eq('id', versionId)
    .select('id')
    .single()
}

// List training runs for a model version (newest first) with their metrics.
export async function listTrainingRuns(modelVersionId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('ml_training_runs')
    .select('id, status, rows_used, started_at, finished_at, notes, created_at, ml_metrics ( metric, value )')
    .eq('model_version_id', modelVersionId)
    .order('created_at', { ascending: false })
}

// --- Configurable scoring: active rule set (master prompt PART 7) -----------
// recommendation_rule_sets (0002) holds versioned weights/blend/exploration.
// The ML dashboard reads the active set and writes a NEW version (then activates
// it) when the admin edits weights — code is never edited to retune scoring.

export async function getActiveRuleSet() {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const exh = await exhibitionId()
  return supabase
    .from('recommendation_rule_sets')
    .select('id, version, label, weights, rules, is_active, created_at')
    .eq('exhibition_id', exh)
    .eq('is_active', true)
    .maybeSingle()
}

// Create a NEW rule-set version (version = max+1) and activate it, carrying the
// given weights/rules. The prior active version is deactivated. Append-only:
// old versions remain for rollback.
export async function saveRuleSetVersion({ weights, rules, label } = {}) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const exh = await exhibitionId()
  const { data: userData } = await supabase.auth.getUser()

  const latest = await supabase
    .from('recommendation_rule_sets')
    .select('version')
    .eq('exhibition_id', exh)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextVersion = (latest.data?.version || 0) + 1

  const unset = await supabase
    .from('recommendation_rule_sets')
    .update({ is_active: false })
    .eq('exhibition_id', exh)
    .eq('is_active', true)
  if (unset.error) return { data: null, error: unset.error }

  return supabase
    .from('recommendation_rule_sets')
    .insert({
      exhibition_id: exh,
      version: nextVersion,
      label: label || `Weights v${nextVersion}`,
      weights: weights || {},
      rules: rules || {},
      is_active: true,
      created_by: userData?.user?.id || null,
    })
    .select('id, version')
    .single()
}

// --- Analytics aggregates (master prompt PART 7) ---------------------------
// Admin RLS grants read access across sessions/stops/likes/skips/dwell for
// the toured exhibition. These return raw rows the AnalyticsDashboard reduces
// into counts/rates — kept as reads so the dashboard owns the presentation.

export async function getAnalyticsSummary() {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const exh = await exhibitionId()

  const sessions = await supabase
    .from('tour_sessions')
    .select('id, completed, skipped_count, liked_count, planned_length, started_at')
    .eq('exhibition_id', exh)
  if (sessions.error) return { data: null, error: sessions.error }

  const sessionIds = (sessions.data || []).map((s) => s.id)
  const total = sessionIds.length
  const completed = (sessions.data || []).filter((s) => s.completed).length
  const totalSkips = (sessions.data || []).reduce((a, s) => a + (s.skipped_count || 0), 0)
  const totalLikes = (sessions.data || []).reduce((a, s) => a + (s.liked_count || 0), 0)

  // Average dwell across all dwell events for these sessions.
  let avgDwellMs = null
  if (sessionIds.length) {
    const dwell = await supabase
      .from('dwell_events')
      .select('dwell_ms')
      .in('session_id', sessionIds)
    if (!dwell.error && dwell.data?.length) {
      const vals = dwell.data.map((d) => d.dwell_ms).filter((n) => typeof n === 'number')
      avgDwellMs = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
    }
  }

  // Reroute count = route_versions rows with a non-initial trigger.
  let rerouteCount = 0
  if (sessionIds.length) {
    const rv = await supabase
      .from('route_versions')
      .select('trigger', { count: 'exact', head: false })
      .in('session_id', sessionIds)
      .neq('trigger', 'initial')
    if (!rv.error) rerouteCount = rv.data?.length ?? 0
  }

  return {
    data: {
      sessions: total,
      completed,
      completionRate: total ? completed / total : 0,
      totalSkips,
      totalLikes,
      avgDwellMs,
      rerouteCount,
    },
    error: null,
  }
}

// Most-liked and most-skipped artwork codes (top N each), for the dashboard.
export async function getArtworkEngagement(limit = 10) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const exh = await exhibitionId()

  const sessions = await supabase
    .from('tour_sessions')
    .select('id')
    .eq('exhibition_id', exh)
  if (sessions.error) return { data: null, error: sessions.error }
  const ids = (sessions.data || []).map((s) => s.id)
  if (!ids.length) return { data: { liked: [], skipped: [], dropOff: [] }, error: null }

  const [likes, skips, stops] = await Promise.all([
    supabase.from('tour_likes').select('artwork_code').in('session_id', ids),
    supabase.from('tour_skips').select('artwork_code, position').in('session_id', ids),
    supabase.from('tour_stops').select('position, status').in('session_id', ids),
  ])

  const tally = (rows, key = 'artwork_code') => {
    const m = new Map()
    for (const r of rows || []) {
      const k = r?.[key]
      if (k) m.set(k, (m.get(k) || 0) + 1)
    }
    return [...m.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  // Drop-off by position: how many skips happened at each 1-based stop position.
  const dropMap = new Map()
  for (const r of skips.data || []) {
    if (typeof r.position === 'number') dropMap.set(r.position, (dropMap.get(r.position) || 0) + 1)
  }
  const dropOff = [...dropMap.entries()]
    .map(([position, skips]) => ({ position, skips }))
    .sort((a, b) => a.position - b.position)

  return {
    data: { liked: tally(likes.data), skipped: tally(skips.data), dropOff },
    error: null,
  }
}

// --- Learning & Personalization reads (master prompt PART 8) ---------------
// Read-only aggregates for the admin "Learning & Personalization" dashboard.
// All are admin-RLS scoped (is_admin()) and return the uniform { data, error }
// shape. They read only the additive 0016 tables plus behavior_events, so they
// never affect the tour or the existing analytics.

// Save/favorite engagement: how many saves exist and the most-saved works.
// Reads the reused favorite_artworks table joined to artwork codes/titles.
export async function getSavedArtworkStats(limit = 10) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const favs = await supabase
    .from('favorite_artworks')
    .select('artwork_id, artworks ( code, title, artist )')
  if (favs.error) return { data: null, error: favs.error }

  const m = new Map()
  for (const r of favs.data || []) {
    const a = r.artworks || {}
    const code = a.code || r.artwork_id
    if (!code) continue
    const cur = m.get(code) || { code, title: a.title || null, artist: a.artist || null, count: 0 }
    cur.count += 1
    m.set(code, cur)
  }
  const top = [...m.values()].sort((a, b) => b.count - a.count).slice(0, limit)
  return { data: { totalSaves: favs.data?.length || 0, top }, error: null }
}

// Recommendation decisions log (forward continuation + missed-earlier), newest
// first, with the per-candidate continuationScore breakdowns for debugging.
export async function listRecommendationDecisions(limit = 25) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('recommendation_decisions')
    .select('id, session_id, mode, current_room, candidates, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
}

// Session preference trends: reads persisted per-session profiles and reduces
// them into the most-common leaned-toward themes/tones across sessions, so the
// admin can see aggregate taste without inspecting any single visitor.
export async function getSessionProfileTrends(limit = 200) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const res = await supabase
    .from('session_preference_profile')
    .select('theme_weights, emotional_tone_weights, signal_counts, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (res.error) return { data: null, error: res.error }

  const themeTally = new Map()
  const toneTally = new Map()
  const signalTally = new Map()
  const addPositive = (map, weights) => {
    for (const [k, v] of Object.entries(weights || {})) {
      if (typeof v === 'number' && v > 0) map.set(k, (map.get(k) || 0) + 1)
    }
  }
  for (const row of res.data || []) {
    addPositive(themeTally, row.theme_weights)
    addPositive(toneTally, row.emotional_tone_weights)
    for (const [k, v] of Object.entries(row.signal_counts || {})) {
      if (typeof v === 'number') signalTally.set(k, (signalTally.get(k) || 0) + v)
    }
  }
  const top = (map) =>
    [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count)

  return {
    data: {
      sessions: res.data?.length || 0,
      topThemes: top(themeTally).slice(0, 10),
      topTones: top(toneTally).slice(0, 10),
      signalCounts: top(signalTally),
    },
    error: null,
  }
}

// --- Offline training dataset export (master prompt PART 6) ----------------
// Pull the behavior stream joined with artwork features into a flat array an
// admin can download as JSON/CSV for offline Stage-2+ model training. Read-only;
// admin RLS scopes it. Returns { data: rows[], error }.
export async function exportTrainingDataset() {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const exh = await exhibitionId()

  const events = await supabase
    .from('behavior_events')
    .select('user_id, session_id, artwork_code, event_type, payload, created_at')
    .eq('exhibition_id', exh)
    .order('created_at', { ascending: true })
  if (events.error) return { data: null, error: events.error }

  // Artwork feature lookup by code (the label targets join to these features).
  const feats = await supabase
    .from('artworks')
    .select('code, themes, tags, movement, medium, room_number, importance_score, conceptual_difficulty, visual_intensity')
    .eq('exhibition_id', exh)
  if (feats.error) return { data: null, error: feats.error }
  const byCode = new Map((feats.data || []).map((a) => [a.code, a]))

  const rows = (events.data || []).map((e) => {
    const f = byCode.get(e.artwork_code) || {}
    return {
      user_id: e.user_id,
      session_id: e.session_id,
      artwork_code: e.artwork_code,
      event_type: e.event_type,
      created_at: e.created_at,
      payload: e.payload || {},
      // Features (for supervised training against the event as a label).
      themes: f.themes || [],
      tags: f.tags || [],
      movement: f.movement || null,
      medium: f.medium || null,
      room_number: f.room_number ?? null,
      importance_score: f.importance_score ?? null,
      conceptual_difficulty: f.conceptual_difficulty ?? null,
      visual_intensity: f.visual_intensity ?? null,
    }
  })

  return { data: rows, error: null }
}

// Serialize an exported dataset to a CSV string (flat columns; arrays joined
// with '|'). Used by the ML dashboard's "Download CSV" action.
export function datasetToCsv(rows = []) {
  if (!Array.isArray(rows) || !rows.length) return ''
  const cols = [
    'user_id', 'session_id', 'artwork_code', 'event_type', 'created_at',
    'movement', 'medium', 'room_number', 'importance_score',
    'conceptual_difficulty', 'visual_intensity', 'themes', 'tags',
  ]
  const esc = (v) => {
    const s = Array.isArray(v) ? v.join('|') : v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = cols.join(',')
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n')
  return `${header}\n${body}`
}
