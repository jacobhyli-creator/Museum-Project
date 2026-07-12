# AI Personalized Museum Tour Guide — Prototype

A mobile-first, clickable front-end prototype that turns a museum visit into a
personalized guided journey. Active sample exhibition: SFMOMA's
**Ways of Seeing: Fourteen Artists**.

> Noncommercial educational prototype. **Not** an official SFMOMA product.
> Artwork images and credits are sourced from the official exhibition page and
> are displayed with citations that must not be removed or altered.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```

## User flow

Museum → Exhibition → Preference Quiz → Route Preview → Artwork Tour
(Skip / Like adjustments) → Tour Complete → Feedback.

## Project structure

```
src/
  data/
    museums.js       # museums + exhibitions catalog
    artworks.js      # built-in artwork dataset (SWAP-OUT POINT)
    quizOptions.js   # quiz options + mood→theme map
  lib/
    recommendation.js# scoring, route generation, skip/like logic
  components/        # one file per screen + shared UI
  App.jsx            # front-end router + all state
```

## Swapping in real data later

The prototype uses a built-in dataset so nothing is hard-coded into the UI.
To move to real data, replace the `artworks` array in `src/data/artworks.js`
with any source that returns the same object shape, e.g.:

```js
const artworks = await fetch('/artworks.json').then(r => r.json())
```

This can be a JSON file, a Google Sheets export, a Supabase table, or an
approved museum API. The museum/exhibition catalog in `src/data/museums.js`
can be swapped the same way. No component changes are required.

## Route recommendation logic

`src/lib/recommendation.js` filters by museum → exhibition, scores each work
(`importance + interest match + mood match + knowledge adjustment + liked-theme
boost − difficulty penalty`), picks N works by available time (30→4, 60→6,
90→8), then sorts the chosen works by `galleryOrder` for a physically logical
walk. Skip inserts a nearby, thematically similar replacement; Like boosts
matching themes for later stops.

## Not included (by design)

No backend, database, Supabase, authentication, AR, camera, GPS, or local image
storage. Explanations are prototype text, not final museum scholarship.
