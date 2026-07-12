-- ===========================================================================
-- 0010_ml_behavior.sql
-- ML / behavior data infrastructure (master prompt PART 5).
--
-- Two new tables complement the existing behavior stream (0005):
--   route_versions     — a snapshot of the planned route each time it is (re)built
--                        (initial build, after a skip/like, or a manual choice).
--                        Lets us reconstruct how routing evolved within a session
--                        and evaluate reroute quality offline.
--   preference_updates — an append-only audit of every signal-driven change to a
--                        user's long-term preference_profiles (0004). Each row is
--                        one signal (like/skip/favorite/dwell/completed/feedback)
--                        with the weight deltas it produced, so historical
--                        learning is fully explainable + replayable.
--
-- PRIVACY: same opt-in model as 0005. route_versions belongs to a tour_session
-- (owner-only via the parent session). preference_updates is owner-only. Neither
-- is written for signed-out visitors.
-- ===========================================================================

-- Route versions ------------------------------------------------------------
-- One row per (re)plan of a session's route. `stops` is the ordered snapshot
-- (jsonb array of { code, room, position }) so we don't need a child table.
create table if not exists public.route_versions (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.tour_sessions(id) on delete cascade,
  version       integer not null,                 -- 1-based, increments per replan
  trigger       text not null
                  check (trigger in ('initial', 'skip', 'like', 'manual_choice',
                                     'preference_update')),
  stops         jsonb not null default '[]'::jsonb, -- [{ code, room, position }, ...]
  current_room  integer,                          -- room the visitor was in at replan
  created_at    timestamptz not null default now(),
  unique (session_id, version)
);
create index if not exists idx_route_versions_session on public.route_versions(session_id, version);

-- Preference updates --------------------------------------------------------
-- Append-only history of long-term preference learning (feeds + audits
-- preference_profiles). `weight_deltas` is the jsonb of per-dimension changes
-- applied for this one signal.
create table if not exists public.preference_updates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  source         text not null
                   check (source in ('like', 'skip', 'favorite', 'dwell',
                                     'completed', 'feedback')),
  artwork_code   text,
  weight_deltas  jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_preference_updates_user on public.preference_updates(user_id, created_at);

-- RLS -----------------------------------------------------------------------
-- route_versions: owner-only, enforced by joining to the parent session (mirrors
-- tour_stops in 0006).
alter table public.route_versions enable row level security;
drop policy if exists route_versions_owner on public.route_versions;
create policy route_versions_owner on public.route_versions
  for all
  using (
    exists (
      select 1 from public.tour_sessions s
      where s.id = route_versions.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tour_sessions s
      where s.id = route_versions.session_id and s.user_id = auth.uid()
    )
  );

-- preference_updates: owner-only (personal data tier).
alter table public.preference_updates enable row level security;
drop policy if exists preference_updates_owner on public.preference_updates;
create policy preference_updates_owner on public.preference_updates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
