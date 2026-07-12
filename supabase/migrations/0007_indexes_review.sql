-- ===========================================================================
-- 0007_indexes_review.sql
-- Supplemental indexes + a foreign-key COVERAGE review.
--
-- Postgres auto-indexes PRIMARY KEYs and UNIQUE constraints, but NOT the
-- referencing side of a foreign key. Unindexed FK columns make cascade
-- deletes and parent lookups do sequential scans. 0001–0005 already added an
-- index for most FK columns; this file:
--   (a) documents the full FK -> index mapping so it can be audited, and
--   (b) creates the few remaining composite / lookup indexes that the app's
--       hot query paths need but that no single-column FK index covers.
-- Everything is `if not exists`, so re-running is safe and this file is purely
-- additive relative to 0001–0005.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- FK COVERAGE MAP (referencing column -> index that covers it)
-- ---------------------------------------------------------------------------
--  exhibitions.museum_id                -> idx_exhibitions_museum        (0001)
--  rooms.exhibition_id                  -> idx_rooms_exhibition          (0001)
--  artworks.exhibition_id               -> idx_artworks_exhibition       (0001)
--  artworks.room_id                     -> idx_artworks_room             (0001)
--  artwork_images.artwork_id            -> idx_artwork_images_artwork    (0001)
--  image_candidates.artwork_id          -> idx_image_candidates_artwork  (0001)
--  artwork_explanations.artwork_id      -> idx_explanations_artwork      (0001)
--  explanation_revisions.explanation_id -> idx_explanation_revisions_exp (0001)
--  quiz_questions.exhibition_id         -> idx_quiz_questions_exhibition (0002)
--  quiz_options.question_id             -> idx_quiz_options_question     (0002)
--  recommendation_rule_sets.exhibition_id -> idx_rule_sets_exhibition    (0002)
--  model_versions.exhibition_id         -> idx_model_versions_exhibition (0002)
--  user_roles.user_id                   -> idx_user_roles_user           (0003)
--  saved_preferences.user_id            -> idx_saved_prefs_user          (0004)
--  saved_preferences.exhibition_id      -> idx_saved_prefs_exhibition    (0004)
--  favorite_artworks.user_id            -> idx_favorites_user            (0004)
--  favorite_artworks.artwork_id         -> idx_favorites_artwork         (0004)
--  tour_sessions.user_id                -> idx_tour_sessions_user        (0005)
--  tour_sessions.exhibition_id          -> idx_tour_sessions_exhibition  (0005)
--  tour_stops.session_id                -> idx_tour_stops_session        (0005)
--  tour_stops.artwork_id                -> idx_tour_stops_artwork        (0005)
--  tour_likes.session_id/user_id/artwork_id -> idx_tour_likes_*          (0005)
--  tour_skips.session_id/user_id/artwork_id -> idx_tour_skips_*          (0005)
--  dwell_events.session_id/user_id/artwork_id -> idx_dwell_events_*      (0005)
--  route_feedback.session_id/user_id    -> idx_route_feedback_*          (0005)
--  behavior_events.*                    -> idx_behavior_events_*         (0005)
--
-- REMAINING UNINDEXED FK COLUMNS (intentionally left unindexed — low
-- cardinality / rarely the delete driver; add later only if EXPLAIN shows a
-- hot seq-scan):
--  user_accounts.id (also the PK -> already indexed)
--  user_roles.granted_by            (admin audit column, tiny table)
--  artworks/*.created_by-style cols (none are FKs)
--  tour_sessions.model_version_id   (nullable analytics link)
--  tour_sessions.rule_set_id        (nullable analytics link)
--  *_feedback.artwork_id            (per-artwork ratings are low volume)
-- ---------------------------------------------------------------------------

-- Composite / hot-path indexes ----------------------------------------------

-- Content read path: the app loads all published, non-archived artworks for an
-- exhibition ordered by room. 0001 has idx_artworks_room_number(exhibition,room)
-- and a partial published index; add an explicit ordered composite for the
-- "walk the route in room order" scan.
create index if not exists idx_artworks_exhibition_room_order
  on public.artworks(exhibition_id, room_number, code)
  where is_published and archived_at is null;

-- Admin catalog filters: search by artist within an exhibition.
create index if not exists idx_artworks_artist_trgm
  on public.artworks using gin (artist gin_trgm_ops);

-- One-active-config lookups already have partial unique indexes (0002); add a
-- plain lookup for "the active rule set / model" fast path used on every route
-- generation and dashboard load.
create index if not exists idx_rule_sets_active
  on public.recommendation_rule_sets(exhibition_id) where is_active;
create index if not exists idx_model_versions_active
  on public.model_versions(exhibition_id) where is_active;

-- Current image lookup: the app needs the single current image per artwork.
-- uq_artwork_images_current (0001) already enforces + indexes this, but add a
-- covering index that also filters approved so the join is index-only.
create index if not exists idx_artwork_images_current_approved
  on public.artwork_images(artwork_id)
  where is_current and review_status = 'approved';

-- ML batch reads: pull a user's full timeline in order (profile rebuild §42).
create index if not exists idx_behavior_events_user_time
  on public.behavior_events(user_id, created_at);

-- Session analytics: recent sessions for an exhibition, newest first (§45).
create index if not exists idx_tour_sessions_exhibition_started
  on public.tour_sessions(exhibition_id, started_at desc);

-- Favorites -> for "who favorited this artwork" aggregate signal (§43).
create index if not exists idx_favorites_artwork_created
  on public.favorite_artworks(artwork_id, created_at);
