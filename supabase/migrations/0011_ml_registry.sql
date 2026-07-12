-- ===========================================================================
-- 0011_ml_registry.sql
-- ML training-run registry (master prompt PART 6).
--
-- The MODEL registry itself already exists as `model_versions` (0002): one
-- append-only row per model iteration, with `stage` (rule_based -> weighted ->
-- predictive -> embedding -> collaborative -> hybrid), `config` hyperparams,
-- `training_rows`, `accuracy`, and a single `is_active` per exhibition. We do
-- NOT duplicate it. These two tables add the RUN + METRIC history that hangs off
-- a model version so the admin ML dashboard can show training lineage and every
-- offline run's evaluation numbers.
--
--   ml_training_runs — one row per offline training attempt for a model_version
--                      (queued/running/succeeded/failed, rows used, timing).
--   ml_metrics       — per-run evaluation metrics (metric name -> numeric value),
--                      e.g. { "ndcg@5": 0.71 }, { "skip_rate": 0.18 }.
--
-- Stage 1 (rule-based) runs live in the app today; ML only ever adjusts the
-- RELEVANCE term, which still passes THROUGH the hard forward-only geography
-- filter — a model can never override room order.
--
-- ACCESS: admin-only (is_admin()) for both read and write. These are operational
-- tables, not visitor content, so they are NOT world-readable.
-- ===========================================================================

-- Training runs -------------------------------------------------------------
create table if not exists public.ml_training_runs (
  id                uuid primary key default gen_random_uuid(),
  model_version_id  uuid not null references public.model_versions(id) on delete cascade,
  status            text not null default 'queued'
                      check (status in ('queued', 'running', 'succeeded', 'failed')),
  rows_used         integer,                 -- labeled behavior rows consumed
  started_at        timestamptz,
  finished_at       timestamptz,
  notes             text,
  created_by        uuid,
  created_at        timestamptz not null default now()
);
create index if not exists idx_ml_training_runs_model
  on public.ml_training_runs(model_version_id, created_at);

-- Per-run metrics -----------------------------------------------------------
-- Long/narrow so new metrics never need a schema change. One row per
-- (run, metric) pair.
create table if not exists public.ml_metrics (
  id               uuid primary key default gen_random_uuid(),
  training_run_id  uuid not null references public.ml_training_runs(id) on delete cascade,
  metric           text not null,           -- 'ndcg@5', 'skip_rate', 'auc', ...
  value            numeric not null,
  created_at       timestamptz not null default now()
);
create index if not exists idx_ml_metrics_run on public.ml_metrics(training_run_id);

-- RLS -----------------------------------------------------------------------
-- Admin-only read + write (operational tables, not visitor content).
alter table public.ml_training_runs enable row level security;
drop policy if exists ml_training_runs_admin on public.ml_training_runs;
create policy ml_training_runs_admin on public.ml_training_runs
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.ml_metrics enable row level security;
drop policy if exists ml_metrics_admin on public.ml_metrics;
create policy ml_metrics_admin on public.ml_metrics
  for all using (public.is_admin()) with check (public.is_admin());
