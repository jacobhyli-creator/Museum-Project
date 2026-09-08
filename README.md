# Personalized Museum Tour Guide

A mobile-first web app that turns a museum visit into a personalized guided
journey: the visitor answers a short preference quiz, and the app builds a
walkable route through the galleries with an explanation pitched at their level,
room by room. Active exhibition: SFMOMA's **Ways of Seeing: Fourteen Artists**
(62 works).

> Noncommercial educational project. **Not** an official SFMOMA product.
> Artwork images and credits come from official museum sources and are displayed
> with citations that must not be removed or altered.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # production build
npm test               # unit tests (vitest)
```

Create `.env.local` with your Supabase project credentials:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable key>
```

Without these the app still runs, falling back to bundled sample data.

## Visitor flow

Museum → Exhibition → Preference Quiz → Route Preview → Artwork Tour →
Tour Complete → Feedback.

Along the way: **Look Closer** detail prompts, **Save** an artwork for later,
**read-aloud / narration** audio, mid-tour **route adjustment**, a
**finished-early** continuation offer (forward-only, with a separate opt-in for
works behind you), and a **post-tour recap**.

## Where the data lives

Content is stored in **Supabase** and read live, so edits published in the admin
area reach visitors without a redeploy. `src/data/artworks.js` resolves the
dataset in this order:

1. **Supabase** — preferred, live content
2. **`public/artworks-dataset.json`** — generated static asset, offline fallback
3. **`src/data/artworks.fallback.js`** — small bundled sample, last resort

## Project structure

```
src/
  App.jsx                    front-end router + tour state
  data/
    museums.js               museums + exhibitions catalog
    artworks.js              dataset entry point + load/refresh chain
    artworks.fallback.js     bundled last-resort sample data
    quizOptions.js           quiz options + mood-to-theme map
  lib/
    recommendationEngine.js  route building, scoring, skip/like rescoring
    roomRoutePlanner.js      room-aware next-stop selection + diversity
    scoring.js, diversity.js, difficultyRules.js, moodRules.js
    imageResolver.js         which image to show, and how much to trust it
    tourDataAdapter.js       Supabase rows to frontend artwork shape
    supabaseClient.js, adminAuth.js, userAuth.js, adminData.js
    savedArtworks.js, sessionProfile.js, preferenceProfile.js
    narrative.js             route narrative text (templates, no model calls)
    audio/                   narration player + read-aloud
  components/                one file per screen + shared UI
  components/admin/          admin dashboard (content, images, audio, analytics)
  hooks/                     narration + read-aloud hooks
supabase/migrations/         schema, RLS policies, seed structure
scripts/                     data import, image audit + auto-repair
```

## Route logic

`src/lib/recommendationEngine.js` filters by museum then exhibition and scores
each work on importance, interest match, mood match, knowledge level,
liked-theme boost and a difficulty penalty. `roomRoutePlanner.js` then picks
each next stop with room proximity and thematic diversity in mind, so the route
stays physically walkable instead of zig-zagging between floors. Skip inserts a
nearby, thematically similar replacement; Like boosts matching themes for later
stops.

> `src/lib/recommendation.js` is the older, superseded engine. It is no longer
> imported by the app and is kept only for reference.

## Artwork images

Images are hotlinked from museum CDNs. SFMOMA re-uploads files to new
date-stamped paths periodically, which makes previously-good URLs return HTTP
403.

```bash
npm run images:check   # report broken links and what they would be repaired to
npm run images:fix     # apply the repairs
npm run images:audit   # read-only audit of the current image per artwork
```

`scripts/refresh-images.mjs` re-finds a moved image on the artwork's own museum
object page, accepting a replacement **only** when it provably belongs to the
same artwork (identical filename, or matching accession number). A GitHub Action
runs this weekly and stays quiet unless a link needs a human.

Applying repairs needs a key that bypasses RLS (`SUPABASE_SERVICE_ROLE_KEY`);
without one the script emits SQL to run instead.

## Admin area

Supabase Auth gates the admin UI, but the real enforcement is **Row Level
Security** — `is_admin()` runs in the database and every admin write is checked
by RLS policies independently of the UI.

Admin tools cover artwork editing, image review and audit, Look Closer content,
audio narration, explanation import, and analytics.

## Testing

107 unit tests across routing, diversity, saved artworks, session profile, Look
Closer, explanation parsing, continuation, and image resolution.

```bash
npm test
```
