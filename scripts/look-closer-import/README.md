# Look Closer guided-looking import

Source: `Look_Closer_Guided_Looking_Content.xlsx` (sheet **Guided Looking Data**,
62 rows).

Writes **only** `public.guided_looking_sets` and `public.guided_looking_hotspots`.
Never touches explanations, images, pairings, audio, artwork metadata, routing, or
user/session data.

## Order

1. Apply migration **`0015_look_closer.sql`** (creates the two tables + RLS).
2. Run **`verify_lookcloser_match.sql`** in the Supabase SQL Editor. It is read-only.
   Confirm every row shows `match_count = 1`. If any row is `0` (no artwork) or `2+`
   (ambiguous), fix the artwork title/artist/year first — do **not** import until clean.
3. Run **`import_lookcloser.sql`**. It upserts the guided-looking sets and their
   hotspots. High/Medium-confidence sets are `review_status='approved'`,
   `is_published=true`, so they appear to visitors immediately (and stay editable in
   the admin). Low/blank-confidence sets import as `needs_review` and unpublished.

## Matching

- Normalized **artist + title** (lowercased; curly quotes and en/em dashes folded to
  ASCII; whitespace collapsed; a trailing `(YYYY)` stripped from the title).
- Where the catalog holds several works with the same normalized artist+title, the row
  is disambiguated by **year**.
- Nothing is guessed. A spreadsheet row that doesn't match exactly one artwork is
  reported below and simply not inserted.

## Publishing rules

- A **set** is publishable only when confidence is `High` or `Medium`.
- A **hotspot** is `is_published=true` only when its set is published AND it has both
  X and Y coordinates.
- The public app shows Look Closer only when the set is approved + published AND at
  least one hotspot is published.

## Re-running

`import_lookcloser.sql` is idempotent (`on conflict (artwork_id)` for sets;
`on conflict (artwork_id, hotspot_number)` for hotspots, both `do update`), so it is
safe to re-run after editing the spreadsheet and regenerating.

## Report (last generated)

- Rows read: **62**
- Matched to an artwork: **62**
- Unmatched (no artwork): **0**
- Ambiguous (2+ artworks): **0**
- Sets emitted: **62**  (published: 62, needs_review: 0)
- Hotspots emitted: **186**  (missing coordinates: 0)
