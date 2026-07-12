# Supabase Backend — Setup & Migration Guide

This directory contains the **version-controlled backend** for the Museum Tour app:
a Supabase (Postgres + Auth + Row Level Security) project defined entirely as SQL
migrations, plus a seed script that loads the generated artwork dataset.

Nothing here runs automatically. You apply it to a Supabase project you create.
**The existing frontend keeps working the whole time** — it still reads its local
JSON until you explicitly wire it to Supabase in a later phase.

```
supabase/
  config.toml                     Supabase CLI project config
  migrations/
    0001_core_content.sql         museums, exhibitions, rooms, artworks, images,
                                  image_candidates, explanations (+revisions)
    0002_config.sql               quiz questions/options, recommendation rule sets,
                                  model/config versions
    0003_roles.sql                user_accounts, user_roles, role-check functions
    0004_user_profiles.sql        saved_preferences, preference_profiles, favorites
    0005_sessions_history.sql     tour_sessions, tour_stops, likes, skips,
                                  dwell_events, route_feedback, behavior_events
    0006_rls_policies.sql         Row Level Security for EVERY exposed table
    0007_indexes_review.sql       supplemental indexes + FK coverage audit
../scripts/
    seed-supabase.mjs             loads src/data/artworks.generated.json into the DB
```

---

## What you need to provide (the exact values)

After you create the project, send me these. They tell the app which project to
talk to and let the seed script write content.

| Value | Where to find it | Used by | Secret? |
|-------|------------------|---------|---------|
| **Project URL** (`https://<ref>.supabase.co`) | Dashboard → Project Settings → API → Project URL | frontend + seed | No — safe in frontend |
| **anon / publishable key** | Dashboard → Project Settings → API → `anon` `public` | frontend | No — safe in frontend (RLS protects data) |
| **service_role key** | Dashboard → Project Settings → API → `service_role` `secret` | **seed script only** | **YES — server secret. NEVER put in the frontend or commit it.** |
| **Project ref** (`<ref>` part of the URL) | Same page, or the URL | `supabase link` CLI | No |

I only need the **Project URL** and **anon key** to wire the running app. The
**service_role key** is used once, locally, by the seed script and is set as an
environment variable — it never enters the codebase or the browser bundle.

> Security rule enforced by this design: the frontend ships only the **anon**
> key. Every table has RLS (migration 0006), so even with that public key a
> visitor can only read published content and read/write **their own** rows.
> Admin writes require a real admin role. The powerful **service_role** key is
> never shipped.

---

## One-time setup (step by step)

### 1. Create the Supabase project
1. Go to <https://supabase.com> → **New project**.
2. Pick an org, name it (e.g. `museum-tour-app`), set a strong database password
   (save it in your password manager), choose a region near your users.
3. Wait for provisioning (~2 min).

### 2. Configure authentication
Anonymous visitors never sign in — only admins and opt-in users do (email/password).
1. Dashboard → **Authentication → Providers → Email**: ensure **Email** is enabled.
2. **Authentication → Sign In / Providers**: keep **Confirm email** ON for any
   public deployment. For a quick class demo you *may* turn it off, but turn it
   back on before sharing publicly.
3. Leave other providers off unless you want them.

### 3. Apply the migrations

**Option A — Supabase CLI (recommended, reproducible):**
```bash
# install once: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref <your-project-ref>
supabase db push          # applies migrations/000*.sql in order
```

**Option B — SQL editor (no CLI):**
Open Dashboard → **SQL Editor** and run the files **in numeric order**, one at a
time: `0001` → `0002` → `0003` → `0004` → `0005` → `0006` → `0007`.
Each file is idempotent (`if not exists`, `create or replace`, `drop policy if
exists`), so re-running is safe.

### 4. Seed the content
```bash
# from the museum-tour-app/ directory
npm i -D @supabase/supabase-js         # one-time dev dependency (not shipped)

export SUPABASE_URL="https://<ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service_role secret>"

node scripts/seed-supabase.mjs --dry-run   # preview: no writes
node scripts/seed-supabase.mjs             # actually load the data
```
Seeds: 1 museum, 1 exhibition, 12 rooms, 63 artworks, 63 current images, 441
explanation variants. The script **upserts on stable keys** (museum slug,
exhibition slug, room_number, artwork code, explanation style), so you can edit
the JSON and re-run to reconcile without creating duplicates.

### 5. Grant yourself the admin role
Admin roles are **not** auto-granted on signup (by design). After you sign up
(or create a user in Dashboard → Authentication → Users), run this once in the
SQL Editor, replacing the email:
```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict do nothing;
```
Now `is_admin()` returns true for you, unlocking content writes and the future
admin UI.

---

## Security model (how RLS protects each tier)

| Tier | Tables | Read | Write |
|------|--------|------|-------|
| **Content** | museums, exhibitions, rooms, artworks, artwork_images, image_candidates, artwork_explanations, quiz_*, recommendation_rule_sets | Everyone (anon + auth) so the tour works without an account | Admins/editors only (`can_edit_content()`) |
| **Admin-only content** | explanation_revisions, model_versions | Admins/editors | Admins/editors |
| **Accounts/roles** | user_accounts, user_roles | Own row (+ admins) | Own account fields; roles admin-only |
| **Personal data** | saved_preferences, preference_profiles, favorite_artworks, tour_sessions, tour_stops, tour_likes, tour_skips, dwell_events, route_feedback | **Owner only** (`user_id = auth.uid()`); admins get **no** blanket read | Owner only |
| **ML signal** | behavior_events | Owner reads own; **admins read all** (training corpus) | Owner inserts own |

**Anonymous visitors:** the frontend does not write personal rows for signed-out
users — their tour state stays in the browser and is discarded. RLS grants no
anon INSERT on personal tables, so this is enforced server-side too.

**Opt-in:** persistent history is written only when
`user_accounts.saved_history_opt_in = true`. The flag is the master consent gate.

---

## Phased migration plan (so the app never breaks)

We are on **Phase 1** now. Each phase is shippable on its own.

1. **Phase 1 — Schema (this delivery).** Migrations + seed script authored and
   version-controlled. App still runs on local JSON. *Nothing in the frontend
   changes.* ← you are here
2. **Phase 2 — Connect (read-only).** Add `@supabase/supabase-js` + a
   `src/lib/supabaseClient.js` using `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
   Add a data adapter that reads artworks from Supabase but **falls back to the
   JSON** if env vars are absent — so nothing breaks if the backend is down.
3. **Phase 3 — Content source of truth.** Flip the adapter to prefer Supabase.
   JSON remains the offline fallback.
4. **Phase 4 — Admin auth.** Login screen; `is_admin()` gates an admin area.
5. **Phase 5 — Admin editing UI.** CRUD for artworks/images/explanations/quiz/
   rule sets, writing through the anon key under admin RLS.
6. **Phase 6 — Opt-in profiles.** Consent toggle writes `saved_history_opt_in`;
   save/restore `saved_preferences` and `favorite_artworks`.
7. **Phase 7 — History + behavior events.** Log sessions/stops/likes/skips/dwell
   and mirror them into `behavior_events` (opt-in only).
8. **Phase 8 — ML.** Batch-read `behavior_events` to evolve `preference_profiles`
   and populate `model_versions`. Stages 3–6 of the ML roadmap are scaffolding
   until real data accumulates.

---

## Environment variables (for the app, added in Phase 2)

Create `museum-tour-app/.env.local` (git-ignored — do **not** commit):
```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```
Vite only exposes vars prefixed `VITE_`. The **service_role** key must never be
prefixed `VITE_` and never placed in any `.env` the frontend reads.

---

## Re-running / rollback

- Migrations are additive and idempotent; re-running `db push` is safe.
- The seed upserts; re-running reconciles rather than duplicates.
- To reset a *local* dev DB entirely: `supabase db reset` (re-applies all
  migrations from scratch — **never** run against production).
