# Plan: Related Literature & Music pairings + route room-diversity

Two independent features. Neither rebuilds the app, changes existing explanations,
images, admin auth, user flow, or the existing Supabase tables. All additions are
new columns/tables/components + a scoring tweak.

---

## FEATURE A — Related Literature & Music pairings

### Data source
`Artwork_Literature_Music_Pairings_Relatable_Edition.xlsx` → sheet **All Pairings**,
62 rows. Columns: Room, Artwork (`"Artist — Title"`), Literature Pairing, Author,
Why the Literature Fits, Music Pairing, Artist / Composer, Music Genre, Why the Music Fits.

### A1. New DB table (migration `0013_artwork_pairings.sql`)
A dedicated `artwork_pairings` table (one row per artwork), NOT touching `artworks`
or `artwork_explanations`:

```
public.artwork_pairings (
  id uuid pk default gen_random_uuid(),
  artwork_id uuid not null references artworks(id) on delete cascade unique,
  literature_title text,
  literature_author text,
  literature_reason text,
  music_title text,
  music_artist text,          -- Artist / Composer
  music_genre text,
  music_reason text,
  review_status text not null default 'draft',  -- 'draft'|'needs_review'|'approved'
  is_published boolean not null default false,
  updated_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```
- RLS mirrors `artwork_explanations`: world-readable; admin-writable via `can_edit_content()`.
- Visitor query will additionally filter `is_published = true AND review_status = 'approved'`.

### A2. Import SQL (`scripts/pairing-import/import_pairings.sql`)
Generated from the xlsx by a small local Node/Python step. Each statement:
```
insert into public.artwork_pairings (artwork_id, literature_title, ...)
select a.id, $lit$...$lit$, ...
from public.artworks a
where a.title = $t$<title>$t$ and coalesce(a.artist,'') = $ar$<artist>$ar$
on conflict (artwork_id) do update set ... , updated_at = now();
```
- Matched by **exact title + artist** (parsed from the `"Artist — Title"` key, split on ` — `).
  No title-only fallback; no fuzzy matching; nothing guessed.
- Rows imported as `review_status='approved'`, `is_published=true` per your choice, so
  matched pairings appear to visitors immediately (still fully editable in the admin).
- A pre-flight SELECT lists any spreadsheet rows that DON'T match an artwork exactly, so
  we can see unmatched pairings — **we do NOT invent matches**. Unmatched rows are simply
  not inserted. If any near-miss needs manual attention it stays out of the import and is
  reported for you to add via the admin (where it'd sit as needs_review).
- Import only writes `artwork_pairings`. Never explanations/images/rooms/metadata.

### A3. Visitor read path
- `src/lib/tourDataAdapter.js`: extend the `.select()` to join
  `artwork_pairings ( literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason, review_status, is_published )`.
- `mapDbArtwork()`: add `pairing` to the returned object, but ONLY when the row is
  present AND `is_published === true` AND `review_status === 'approved'`; otherwise
  `pairing: null`. (Gate = approved AND published, per your choice.)

### A4. Visitor UI (`src/components/ArtworkTour.jsx`)
Directly below the explanation `<p>` (line ~117), before `<AudioControls>`, add a new
`RelatedLiteratureMusic` section rendered ONLY when `art.pairing` is present:
```
Related Literature & Music
  Literature:  [title] by [author]   Why it fits: [reason]
  Music:       [title] by [artist/composer]   Genre: [genre]   Why it fits: [reason]
```
If any single field is blank it's hidden; if the whole pairing is absent the section
does not render. No audio playback — text only.

### A5. Admin editor (`src/components/admin/ArtworkEditor.jsx` + `adminData.js`)
- `adminData.js`: add `getPairing(artworkId)`, `upsertPairing(artworkId, fields)`,
  `setPairingReview(artworkId, status)`, `setPairingPublished(artworkId, bool)`.
- `ArtworkEditor.jsx`: add a "Literature & Music" panel with fields for all 7 pairing
  values + a review-status control (needs_review / approved) and publish toggle, so the
  admin can review/edit/approve later. Save calls `upsertPairing`.

---

## FEATURE B — Route room-diversity (soft)

All changes in `src/lib/roomRoutePlanner.js` (+ small helper). No change to
forward-only filtering, Room 1 forcing, roomOrder validation, or quality threshold.

### B1. New next-stop weights (requested formula)
```
nextStopScore =
  0.50 * personalRelevance
+ 0.20 * forwardProximity
+ 0.10 * narrativeConnection
+ 0.10 * diversityContribution   (now room-aware)
+ 0.10 * normalizedImportance    (NEW term)
```
Replace `NEXT_WEIGHTS = { relevance:0.6, proximity:0.25, narrative:0.1, diversity:0.05 }`
with `{ relevance:0.5, proximity:0.2, narrative:0.1, diversity:0.1, importance:0.1 }`.

### B2. Room-diversity contribution
Add a `roomDiversityBoost(candidate, picked, currentRoom)` that returns a 0..1 signal
combining the existing content diversityDelta with a room term that rewards:
- entering a NEW room when the route so far is clustered (few distinct rooms for the
  number of stops taken),
- underrepresented future rooms.
The boost only grows "after the first few artworks" (e.g. once `picked.length >= 2`),
so early stops still follow relevance/proximity. Same-room stays allowed.

### B3. Guardrails (all preserved / added)
1. `forwardOnly()` still runs first (candidate.roomOrder >= currentRoom) — unchanged.
2. No backward routes — unchanged (hard filter + assertions).
3. Don't jump far just for diversity: keep Rule C, and only apply the room boost when
   it does NOT require a jump larger than a strong nearby candidate already offers.
4. If two candidates have similar personal relevance, the room boost breaks the tie
   toward the diversity-improving one.
5. If one candidate is much more relevant (relevance dominates via 0.50 weight), it
   still wins — the 0.10 diversity term can't override a large relevance gap.
6. Avoid all-8-in-2-rooms: because room boost accumulates as clustering rises, a third+
   room becomes attractive unless no good forward candidate exists there.
7. Debug: extend `_planStep.breakdown` to include personalRelevance, roomProximity,
   narrativeConnection, diversityContribution (with room component), normalizedImportance,
   finalNextStopScore, and a `reason` string; add optional `console.debug` gated behind
   a `DEBUG_ROUTE` flag.

### B4. Reroutes
Skip (`rebuildRemaining`→`planFromRoom`) and Like (`rescoreRemaining`) both go through
the same `scoreNextStop`/`planFromRoom` path, so they inherit the room-diversity boost
automatically while still forward-only.

### B5. Tests (`src/lib/__tests__`)
Add/extend tests:
- 8-stop route across a 12-room fixture covers >2 rooms (usually 4–6).
- never goes backward.
- Start-from-Room-1 still opens in Room 1.
- skip/like keep forward-only + diversity.
- missing roomOrder still throws (validation unchanged).

---

## Build / verify
- `npm run build` (bundle only; no redeploy needed for frontend).
- `npm test` for route logic.
- Migration `0013` + `import_pairings.sql` are run by the user in Supabase SQL Editor
  (same workflow as the explanation import). I'll generate both files and a pre-flight
  match report.

## Explicit non-goals / safety
- No edits to existing explanations, images, room data, admin auth, Supabase existing
  tables, or user flow.
- No music playback.
- No invented pairings; unmatched → not inserted, uncertain → needs_review.
