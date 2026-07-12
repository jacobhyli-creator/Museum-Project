# Literature & Music pairings import

Source: `Artwork_Literature_Music_Pairings_Relatable_Edition.xlsx` (sheet **All Pairings**, 62 rows).

Writes **only** `public.artwork_pairings`. Never touches explanations, images, rooms,
artwork metadata, routing, or user/session data.

## Order

1. Apply migration **`0013_artwork_pairings.sql`** (creates the `artwork_pairings` table + RLS).
2. Run **`verify_pairings_match.sql`** in the Supabase SQL Editor. It is read-only.
   Confirm every row shows `match_count = 1`. If any row is `0` (no artwork) or `2+`
   (ambiguous), fix the artwork title/artist/year first — do **not** import until clean.
3. Run **`import_pairings.sql`**. It upserts 62 pairings as `review_status='approved'`,
   `is_published=true`, so they appear to visitors immediately (and stay editable in the admin).

## Matching

- Exact **artist + title**, with the trailing year normalized off the spreadsheet title.
- The 9 duplicate-title works (Cy Twombly `Untitled` ×2, Sigmar Polke `Ohne Titel (Untitled)`
  ×3, Agnes Martin `Untitled #5`/`#9` ×2 each) are disambiguated by **year**.
- Curly quotes / en/em dashes are normalized on both sides so punctuation differences
  (e.g. `"monument"` vs `“monument”`) still match.
- Nothing is guessed. A spreadsheet row that doesn't match exactly is simply not inserted.

## Re-running

`import_pairings.sql` is idempotent (unique `artwork_id`, `on conflict do update`), so it is
safe to re-run after editing the spreadsheet and regenerating.
