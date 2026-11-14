-- Idempotency ledger for Vercel Schedules runs.
-- A run can be delivered more than once; each executionId is recorded and repeats are skipped.
-- RLS is enabled with no policies: only the server (service role) can read or write it.
create table if not exists public.schedule_runs (
  execution_id text primary key,
  schedule_name text not null,
  scheduled_at timestamptz not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','completed','skipped','failed')),
  result jsonb not null default '{}'::jsonb
);
create index if not exists schedule_runs_name_idx on public.schedule_runs(schedule_name, started_at desc);
alter table public.schedule_runs enable row level security;
