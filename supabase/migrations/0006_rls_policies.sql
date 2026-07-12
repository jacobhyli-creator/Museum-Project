-- ===========================================================================
-- 0006_rls_policies.sql
-- Row Level Security for EVERY exposed table. This is the security boundary:
-- with RLS on, the anon/authenticated API keys can only do what these policies
-- allow, even though the frontend ships a public key.
--
-- THREE ACCESS TIERS (spec §33–§35, §47–§49):
--   1. CONTENT (museums, exhibitions, rooms, artworks, images, candidates,
--      explanations, quiz, active rule/model config):
--        * SELECT: world-readable (anon + authenticated) so the tour works
--          WITHOUT an account. (Optionally gated to is_published — see notes.)
--        * INSERT/UPDATE/DELETE: admins/editors only (can_edit_content()).
--   2. PERSONAL DATA (user_accounts, saved_preferences, preference_profiles,
--      favorite_artworks, tour_sessions, tour_stops, likes, skips, dwell,
--      route_feedback):
--        * Each user sees/writes ONLY their own rows (user_id = auth.uid()).
--        * Admins do NOT get blanket read of a named person's history.
--   3. ML SIGNAL (behavior_events):
--        * A user may INSERT/SELECT their own rows.
--        * Admins may SELECT ALL rows for aggregate training (this is the one
--          place admins can read across users — it's the training corpus).
--
-- NOTE ON ANONYMOUS WRITES: The frontend does NOT write personal rows for
-- signed-out visitors (their state is browser-only). These policies therefore
-- do NOT grant anon INSERT on personal tables; a signed-out client simply keeps
-- everything client-side. If you later want anonymized analytics for anon users,
-- add explicit anon-insert policies keyed on anon_session_id — intentionally
-- omitted here to stay privacy-preserving by default.
-- ===========================================================================

-- Helper: enable RLS on a table and (re)create a permissive world-read +
-- admin-write policy set. Done inline per-table for clarity/auditability.

-- ---------------------------------------------------------------------------
-- TIER 1: CONTENT — world-readable, admin/editor-writable
-- ---------------------------------------------------------------------------

-- museums --------------------------------------------------------------------
alter table public.museums enable row level security;
drop policy if exists museums_read on public.museums;
create policy museums_read on public.museums
  for select using (true);
drop policy if exists museums_write on public.museums;
create policy museums_write on public.museums
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- exhibitions ----------------------------------------------------------------
alter table public.exhibitions enable row level security;
drop policy if exists exhibitions_read on public.exhibitions;
create policy exhibitions_read on public.exhibitions
  for select using (true);
drop policy if exists exhibitions_write on public.exhibitions;
create policy exhibitions_write on public.exhibitions
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- rooms ----------------------------------------------------------------------
alter table public.rooms enable row level security;
drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms
  for select using (true);
drop policy if exists rooms_write on public.rooms;
create policy rooms_write on public.rooms
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- artworks -------------------------------------------------------------------
alter table public.artworks enable row level security;
drop policy if exists artworks_read on public.artworks;
create policy artworks_read on public.artworks
  for select using (true);
drop policy if exists artworks_write on public.artworks;
create policy artworks_write on public.artworks
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- artwork_images -------------------------------------------------------------
alter table public.artwork_images enable row level security;
drop policy if exists artwork_images_read on public.artwork_images;
create policy artwork_images_read on public.artwork_images
  for select using (true);
drop policy if exists artwork_images_write on public.artwork_images;
create policy artwork_images_write on public.artwork_images
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- image_candidates -----------------------------------------------------------
-- Candidates are an admin review surface. Readable by everyone is harmless
-- (they're just URLs), but writes are admin-only.
alter table public.image_candidates enable row level security;
drop policy if exists image_candidates_read on public.image_candidates;
create policy image_candidates_read on public.image_candidates
  for select using (true);
drop policy if exists image_candidates_write on public.image_candidates;
create policy image_candidates_write on public.image_candidates
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- artwork_explanations -------------------------------------------------------
alter table public.artwork_explanations enable row level security;
drop policy if exists artwork_explanations_read on public.artwork_explanations;
create policy artwork_explanations_read on public.artwork_explanations
  for select using (true);
drop policy if exists artwork_explanations_write on public.artwork_explanations;
create policy artwork_explanations_write on public.artwork_explanations
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- explanation_revisions ------------------------------------------------------
-- History of edits. Read is admin-only (editorial trail), write admin-only.
alter table public.explanation_revisions enable row level security;
drop policy if exists explanation_revisions_read on public.explanation_revisions;
create policy explanation_revisions_read on public.explanation_revisions
  for select using (public.can_edit_content());
drop policy if exists explanation_revisions_write on public.explanation_revisions;
create policy explanation_revisions_write on public.explanation_revisions
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- quiz_questions -------------------------------------------------------------
alter table public.quiz_questions enable row level security;
drop policy if exists quiz_questions_read on public.quiz_questions;
create policy quiz_questions_read on public.quiz_questions
  for select using (true);
drop policy if exists quiz_questions_write on public.quiz_questions;
create policy quiz_questions_write on public.quiz_questions
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- quiz_options ---------------------------------------------------------------
alter table public.quiz_options enable row level security;
drop policy if exists quiz_options_read on public.quiz_options;
create policy quiz_options_read on public.quiz_options
  for select using (true);
drop policy if exists quiz_options_write on public.quiz_options;
create policy quiz_options_write on public.quiz_options
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- recommendation_rule_sets ---------------------------------------------------
-- The running app needs to read the ACTIVE rule set to score routes, so read is
-- world-readable. (Weights aren't secret.) Writes admin-only.
alter table public.recommendation_rule_sets enable row level security;
drop policy if exists rule_sets_read on public.recommendation_rule_sets;
create policy rule_sets_read on public.recommendation_rule_sets
  for select using (true);
drop policy if exists rule_sets_write on public.recommendation_rule_sets;
create policy rule_sets_write on public.recommendation_rule_sets
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- model_versions -------------------------------------------------------------
-- Admin ML dashboard surface. Read admin-only (implementation detail), write
-- admin-only. The app doesn't need to read raw model config from the client.
alter table public.model_versions enable row level security;
drop policy if exists model_versions_read on public.model_versions;
create policy model_versions_read on public.model_versions
  for select using (public.can_edit_content());
drop policy if exists model_versions_write on public.model_versions;
create policy model_versions_write on public.model_versions
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- ---------------------------------------------------------------------------
-- TIER 1b: ROLES / ACCOUNTS
-- ---------------------------------------------------------------------------

-- user_accounts --------------------------------------------------------------
-- A user reads/updates their OWN account row (e.g. to toggle saved_history_opt_in
-- or set display_name). Admins may read all accounts (needed to grant roles /
-- manage users) but this is account metadata, NOT tour history.
alter table public.user_accounts enable row level security;
drop policy if exists user_accounts_select_own on public.user_accounts;
create policy user_accounts_select_own on public.user_accounts
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists user_accounts_update_own on public.user_accounts;
create policy user_accounts_update_own on public.user_accounts
  for update using (id = auth.uid()) with check (id = auth.uid());
-- Inserts happen via the SECURITY DEFINER handle_new_user() trigger, so no
-- direct client INSERT policy is granted.

-- user_roles -----------------------------------------------------------------
-- A user may READ their own roles (so the app can show admin UI). Only admins
-- may grant/revoke roles.
alter table public.user_roles enable row level security;
drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write on public.user_roles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- TIER 2: PERSONAL DATA — owner-only (user_id = auth.uid())
-- Admins do NOT get read access here.
-- ---------------------------------------------------------------------------

-- saved_preferences ----------------------------------------------------------
alter table public.saved_preferences enable row level security;
drop policy if exists saved_preferences_owner on public.saved_preferences;
create policy saved_preferences_owner on public.saved_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- preference_profiles --------------------------------------------------------
alter table public.preference_profiles enable row level security;
drop policy if exists preference_profiles_owner on public.preference_profiles;
create policy preference_profiles_owner on public.preference_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- favorite_artworks ----------------------------------------------------------
alter table public.favorite_artworks enable row level security;
drop policy if exists favorite_artworks_owner on public.favorite_artworks;
create policy favorite_artworks_owner on public.favorite_artworks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- tour_sessions --------------------------------------------------------------
-- Owner-only. Anonymous sessions (user_id IS NULL) are not client-writable
-- under these policies; the app keeps anon sessions in the browser.
alter table public.tour_sessions enable row level security;
drop policy if exists tour_sessions_owner on public.tour_sessions;
create policy tour_sessions_owner on public.tour_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- tour_stops -----------------------------------------------------------------
-- A stop belongs to a session; ownership is enforced by joining to the parent
-- session and checking its user_id.
alter table public.tour_stops enable row level security;
drop policy if exists tour_stops_owner on public.tour_stops;
create policy tour_stops_owner on public.tour_stops
  for all
  using (
    exists (
      select 1 from public.tour_sessions s
      where s.id = tour_stops.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tour_sessions s
      where s.id = tour_stops.session_id and s.user_id = auth.uid()
    )
  );

-- tour_likes -----------------------------------------------------------------
alter table public.tour_likes enable row level security;
drop policy if exists tour_likes_owner on public.tour_likes;
create policy tour_likes_owner on public.tour_likes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- tour_skips -----------------------------------------------------------------
alter table public.tour_skips enable row level security;
drop policy if exists tour_skips_owner on public.tour_skips;
create policy tour_skips_owner on public.tour_skips
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- dwell_events ---------------------------------------------------------------
alter table public.dwell_events enable row level security;
drop policy if exists dwell_events_owner on public.dwell_events;
create policy dwell_events_owner on public.dwell_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- route_feedback -------------------------------------------------------------
alter table public.route_feedback enable row level security;
drop policy if exists route_feedback_owner on public.route_feedback;
create policy route_feedback_owner on public.route_feedback
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- TIER 3: ML SIGNAL — behavior_events
-- Owner may insert/read own rows; admins may read ALL (training corpus).
-- ---------------------------------------------------------------------------
alter table public.behavior_events enable row level security;

drop policy if exists behavior_events_insert_own on public.behavior_events;
create policy behavior_events_insert_own on public.behavior_events
  for insert with check (user_id = auth.uid());

drop policy if exists behavior_events_select_own on public.behavior_events;
create policy behavior_events_select_own on public.behavior_events
  for select using (user_id = auth.uid());

-- Admin read-across-users, exclusively for aggregate ML training.
drop policy if exists behavior_events_admin_read on public.behavior_events;
create policy behavior_events_admin_read on public.behavior_events
  for select using (public.is_admin());
