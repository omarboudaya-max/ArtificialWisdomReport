-- =====================================================================
-- Artificial Wisdom 2.0 — core schema
-- Multi-tenant AI assurance platform with row-level security,
-- tamper-evident audit log and server-only writes for assessment results.
-- Run in the Supabase SQL editor (or `supabase db push`).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Organizations & memberships
-- ---------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  sector text,
  country text,
  alert_webhook_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','auditor')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships(user_id);

create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships where org_id = p_org and user_id = auth.uid());
$$;

create or replace function public.org_role(p_org uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.memberships where org_id = p_org and user_id = auth.uid();
$$;

create or replace function public.is_org_admin(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.org_role(p_org) in ('owner','admin'), false);
$$;

-- Create an organization and make the caller its owner.
create or replace function public.create_organization(p_name text, p_sector text default null, p_country text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.organizations (name, sector, country, created_by)
  values (trim(p_name), p_sector, p_country, auth.uid()) returning id into v_id;
  insert into public.memberships (org_id, user_id, role) values (v_id, auth.uid(), 'owner');
  return v_id;
end $$;

-- Add an existing user (by email) to an organization. Caller must be admin/owner.
create or replace function public.add_member_by_email(p_org uuid, p_email text, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.is_org_admin(p_org) then raise exception 'Only owners and admins can add members'; end if;
  if p_role not in ('admin','member','auditor') then raise exception 'Invalid role'; end if;
  select id into v_user from public.profiles where lower(email) = lower(trim(p_email));
  if v_user is null then raise exception 'No account found for %. Ask them to sign up first.', p_email; end if;
  insert into public.memberships (org_id, user_id, role) values (p_org, v_user, p_role)
  on conflict (org_id, user_id) do update set role = excluded.role;
end $$;

-- ---------------------------------------------------------------------
-- AI systems inventory
-- ---------------------------------------------------------------------
create table if not exists public.ai_systems (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text,
  system_type text not null default 'llm_app'
    check (system_type in ('llm_app','agent','rag','ml_model','website','other')),
  url text,
  endpoint_url text,
  provider text,
  model_name text,
  version text,
  use_case text,
  sector text,
  jurisdictions text[] not null default '{}',
  autonomy_level text default 'assistive' check (autonomy_level in ('assistive','supervised','autonomous')),
  risk_tier text check (risk_tier in ('prohibited','high','limited','minimal','gpai','gpai_systemic')),
  risk_answers jsonb not null default '{}'::jsonb,
  monitoring_enabled boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_systems_org_idx on public.ai_systems(org_id);

-- ---------------------------------------------------------------------
-- Evaluations: uploaded datasets / agent logs computed server-side
-- ---------------------------------------------------------------------
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  system_id uuid not null references public.ai_systems(id) on delete cascade,
  kind text not null check (kind in ('classification','agent_log')),
  label text,
  input_sha256 text not null,
  input_summary jsonb not null default '{}'::jsonb,
  results jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists evaluations_system_idx on public.evaluations(system_id, kind, created_at desc);

-- ---------------------------------------------------------------------
-- Governance control responses (self-declared, evidence-linked, auditor-verified)
-- ---------------------------------------------------------------------
create table if not exists public.governance_responses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  system_id uuid not null references public.ai_systems(id) on delete cascade,
  control_key text not null,
  answer text not null check (answer in ('yes','partial','no','na')),
  notes text,
  evidence_id uuid,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (system_id, control_key)
);

-- ---------------------------------------------------------------------
-- Assessments (audit runs) and their check results — server-only writes
-- ---------------------------------------------------------------------
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  system_id uuid not null references public.ai_systems(id) on delete cascade,
  profile text not null default 'rapid',
  status text not null default 'completed' check (status in ('running','completed','failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer,
  aw_gti numeric(5,2),
  rating text,
  technical_score numeric(5,2),
  governance_score numeric(5,2),
  coverage numeric(5,2),
  dimension_scores jsonb not null default '{}'::jsonb,
  gates jsonb not null default '[]'::jsonb,
  compliance jsonb not null default '[]'::jsonb,
  benchmark jsonb not null default '{}'::jsonb,
  scope jsonb not null default '{}'::jsonb,
  methodology_version text not null,
  suite_version text not null,
  system_version text,
  report_sha256 text,
  credential_status text not null default 'automated_assessment'
    check (credential_status in ('automated_assessment','provisional','reviewed','independently_certified')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists assessments_system_idx on public.assessments(system_id, created_at desc);
create index if not exists assessments_org_idx on public.assessments(org_id, created_at desc);

create table if not exists public.check_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  dimension text not null,
  check_key text not null,
  name text not null,
  source text not null,
  status text not null check (status in ('pass','warn','fail','untested','info')),
  score numeric(5,2),
  measured text,
  threshold text,
  severity text check (severity in ('critical','high','medium','low','info')),
  evidence jsonb not null default '{}'::jsonb,
  duration_ms integer,
  created_at timestamptz not null default now()
);
create index if not exists check_results_assessment_idx on public.check_results(assessment_id);

-- Findings double as the corrective-action tracker
create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  system_id uuid not null references public.ai_systems(id) on delete cascade,
  check_key text not null,
  dimension text not null,
  severity text not null check (severity in ('critical','high','medium','low')),
  title text not null,
  measured text,
  threshold text,
  recommendation jsonb not null default '{}'::jsonb,
  projected_uplift numeric(5,2),
  status text not null default 'open' check (status in ('open','in_progress','resolved','accepted_risk')),
  assignee text,
  due_date date,
  remediation_notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists findings_org_idx on public.findings(org_id, status);

-- ---------------------------------------------------------------------
-- Human reviews & credentials (Digital Trust Passports)
-- ---------------------------------------------------------------------
create table if not exists public.human_reviews (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approve','reject','request_changes')),
  comments text not null,
  conflict_of_interest_declared boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  system_id uuid not null references public.ai_systems(id) on delete cascade,
  tier text not null check (tier in ('automated_assessment','provisional','reviewed','independently_certified')),
  status text not null default 'active' check (status in ('active','revoked','expired','superseded')),
  aw_gti numeric(5,2),
  rating text,
  scope jsonb not null default '{}'::jsonb,
  report_sha256 text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_reason text,
  created_at timestamptz not null default now()
);
create index if not exists credentials_system_idx on public.credentials(system_id, issued_at desc);

-- ---------------------------------------------------------------------
-- Evidence vault, monitoring, incidents
-- ---------------------------------------------------------------------
create table if not exists public.evidence_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  system_id uuid references public.ai_systems(id) on delete set null,
  title text not null,
  kind text not null default 'document',
  storage_path text,
  external_url text,
  sha256 text,
  size_bytes bigint,
  mime_type text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists evidence_org_idx on public.evidence_records(org_id, created_at desc);

create table if not exists public.monitoring_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  system_id uuid references public.ai_systems(id) on delete cascade,
  kind text not null,
  severity text not null default 'info' check (severity in ('critical','high','medium','low','info')),
  message text not null,
  data jsonb not null default '{}'::jsonb,
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists monitoring_org_idx on public.monitoring_events(org_id, created_at desc);

create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  system_id uuid not null references public.ai_systems(id) on delete cascade,
  title text not null,
  severity text not null check (severity in ('critical','high','medium','low')),
  category text,
  description text,
  harm_type text,
  status text not null default 'open' check (status in ('open','investigating','mitigated','closed')),
  occurred_at timestamptz not null default now(),
  reported_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Tamper-evident audit log (SHA-256 hash chain per organization)
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  prev_hash text,
  hash text not null
);
create index if not exists audit_logs_org_idx on public.audit_logs(org_id, id);

create or replace function public.audit_log_payload(r public.audit_logs)
returns text language sql immutable as $$
  select coalesce(r.prev_hash,'') || '|' || r.org_id::text || '|' || coalesce(r.actor_id::text,'') || '|' ||
         r.action || '|' || r.entity || '|' || coalesce(r.entity_id,'') || '|' || r.data::text || '|' ||
         to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
$$;

create or replace function public.audit_logs_chain()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.org_id::text));
  select hash into new.prev_hash from public.audit_logs where org_id = new.org_id order by id desc limit 1;
  new.created_at := coalesce(new.created_at, now());
  new.hash := encode(extensions.digest(public.audit_log_payload(new), 'sha256'), 'hex');
  return new;
end $$;

drop trigger if exists audit_logs_chain_trg on public.audit_logs;
create trigger audit_logs_chain_trg before insert on public.audit_logs
  for each row execute function public.audit_logs_chain();

-- Verify the chain: returns rows that are broken (empty = intact)
create or replace function public.verify_audit_chain(p_org uuid)
returns table (id bigint, problem text) language plpgsql stable security definer set search_path = public, extensions as $$
declare r public.audit_logs; v_prev text := null;
begin
  if not public.is_org_member(p_org) and auth.role() <> 'service_role' then raise exception 'Forbidden'; end if;
  for r in select * from public.audit_logs a where a.org_id = p_org order by a.id loop
    if coalesce(r.prev_hash,'') <> coalesce(v_prev,'') then
      id := r.id; problem := 'prev_hash mismatch'; return next;
    end if;
    if r.hash <> encode(extensions.digest(public.audit_log_payload(r), 'sha256'), 'hex') then
      id := r.id; problem := 'hash mismatch (record altered)'; return next;
    end if;
    v_prev := r.hash;
  end loop;
end $$;

-- Generic change logger
create or replace function public.log_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_row jsonb; v_org uuid; v_actor uuid;
begin
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_org := (v_row->>'org_id')::uuid;
  if v_org is null then return null; end if;
  v_actor := coalesce(auth.uid(), nullif(v_row->>'created_by','')::uuid, nullif(v_row->>'reviewer_id','')::uuid,
                      nullif(v_row->>'updated_by','')::uuid, nullif(v_row->>'uploaded_by','')::uuid);
  insert into public.audit_logs (org_id, actor_id, action, entity, entity_id, data)
  values (v_org, v_actor, lower(tg_op), tg_table_name, v_row->>'id',
          case tg_table_name
            when 'assessments' then jsonb_build_object('aw_gti', v_row->'aw_gti', 'rating', v_row->'rating', 'report_sha256', v_row->'report_sha256', 'system_id', v_row->'system_id')
            when 'credentials' then jsonb_build_object('code', v_row->'code', 'tier', v_row->'tier', 'status', v_row->'status')
            when 'governance_responses' then jsonb_build_object('control_key', v_row->'control_key', 'answer', v_row->'answer', 'verified', v_row->'verified_at' is not null and v_row->>'verified_at' is not null)
            when 'findings' then jsonb_build_object('check_key', v_row->'check_key', 'status', v_row->'status')
            when 'human_reviews' then jsonb_build_object('assessment_id', v_row->'assessment_id', 'decision', v_row->'decision')
            when 'evidence_records' then jsonb_build_object('title', v_row->'title', 'sha256', v_row->'sha256')
            when 'ai_systems' then jsonb_build_object('name', v_row->'name', 'risk_tier', v_row->'risk_tier')
            when 'incident_reports' then jsonb_build_object('title', v_row->'title', 'severity', v_row->'severity', 'status', v_row->'status')
            when 'memberships' then jsonb_build_object('user_id', v_row->'user_id', 'role', v_row->'role')
            when 'evaluations' then jsonb_build_object('kind', v_row->'kind', 'input_sha256', v_row->'input_sha256')
            else '{}'::jsonb end);
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['ai_systems','assessments','credentials','governance_responses','findings','human_reviews',
                           'evidence_records','incident_reports','memberships','evaluations'] loop
    execute format('drop trigger if exists %I_audit on public.%I', t, t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.log_change()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.ai_systems enable row level security;
alter table public.evaluations enable row level security;
alter table public.governance_responses enable row level security;
alter table public.assessments enable row level security;
alter table public.check_results enable row level security;
alter table public.findings enable row level security;
alter table public.human_reviews enable row level security;
alter table public.credentials enable row level security;
alter table public.evidence_records enable row level security;
alter table public.monitoring_events enable row level security;
alter table public.incident_reports enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: see yourself and co-members
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from public.memberships m1 join public.memberships m2 on m1.org_id = m2.org_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid());

-- organizations
drop policy if exists orgs_select on public.organizations;
create policy orgs_select on public.organizations for select using (public.is_org_member(id));
drop policy if exists orgs_update on public.organizations;
create policy orgs_update on public.organizations for update using (public.is_org_admin(id));

-- memberships
drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships for select using (public.is_org_member(org_id));
drop policy if exists memberships_delete on public.memberships;
create policy memberships_delete on public.memberships for delete using (public.is_org_admin(org_id) and role <> 'owner');

-- ai_systems: members read; owner/admin/member write (auditors are read-only)
drop policy if exists systems_select on public.ai_systems;
create policy systems_select on public.ai_systems for select using (public.is_org_member(org_id));
drop policy if exists systems_insert on public.ai_systems;
create policy systems_insert on public.ai_systems for insert with check (public.org_role(org_id) in ('owner','admin','member'));
drop policy if exists systems_update on public.ai_systems;
create policy systems_update on public.ai_systems for update using (public.org_role(org_id) in ('owner','admin','member'));
drop policy if exists systems_delete on public.ai_systems;
create policy systems_delete on public.ai_systems for delete using (public.is_org_admin(org_id));

-- governance responses: members write their answers; auditors may verify (update)
drop policy if exists gov_select on public.governance_responses;
create policy gov_select on public.governance_responses for select using (public.is_org_member(org_id));
drop policy if exists gov_insert on public.governance_responses;
create policy gov_insert on public.governance_responses for insert with check (public.is_org_member(org_id));
drop policy if exists gov_update on public.governance_responses;
create policy gov_update on public.governance_responses for update using (public.is_org_member(org_id));

-- read-only for members (writes happen server-side with the service role)
do $$
declare t text;
begin
  foreach t in array array['evaluations','assessments','check_results','human_reviews','credentials','monitoring_events','audit_logs'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select using (public.is_org_member(org_id))', t, t);
  end loop;
end $$;

drop policy if exists monitoring_update on public.monitoring_events;
create policy monitoring_update on public.monitoring_events for update using (public.is_org_member(org_id));

-- findings: read + remediation updates by non-auditor members
drop policy if exists findings_select on public.findings;
create policy findings_select on public.findings for select using (public.is_org_member(org_id));
drop policy if exists findings_update on public.findings;
create policy findings_update on public.findings for update using (public.org_role(org_id) in ('owner','admin','member'));

-- evidence: read by members; metadata inserted server-side; admins may delete
drop policy if exists evidence_select on public.evidence_records;
create policy evidence_select on public.evidence_records for select using (public.is_org_member(org_id));
drop policy if exists evidence_delete on public.evidence_records;
create policy evidence_delete on public.evidence_records for delete using (public.is_org_admin(org_id));

-- incidents
drop policy if exists incidents_select on public.incident_reports;
create policy incidents_select on public.incident_reports for select using (public.is_org_member(org_id));
drop policy if exists incidents_insert on public.incident_reports;
create policy incidents_insert on public.incident_reports for insert with check (public.is_org_member(org_id));
drop policy if exists incidents_update on public.incident_reports;
create policy incidents_update on public.incident_reports for update using (public.is_org_member(org_id));

-- Protect immutable assessment fields: findings may only change remediation columns
create or replace function public.findings_guard()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'service_role' then new.updated_at := now(); return new; end if;
  if new.assessment_id <> old.assessment_id or new.check_key <> old.check_key or new.severity <> old.severity
     or new.title <> old.title or coalesce(new.measured,'') <> coalesce(old.measured,'')
     or new.recommendation <> old.recommendation or new.org_id <> old.org_id then
    raise exception 'Only remediation fields can be changed on findings';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists findings_guard_trg on public.findings;
create trigger findings_guard_trg before update on public.findings for each row execute function public.findings_guard();

-- Only auditors/admins may set verification on governance responses, and never for their own answer
create or replace function public.governance_guard()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if new.verified_by is distinct from old.verified_by or new.verified_at is distinct from old.verified_at then
    if public.org_role(new.org_id) not in ('auditor','admin','owner') then
      raise exception 'Only auditors can verify governance controls';
    end if;
    if new.verified_by is not null and new.verified_by = old.updated_by then
      raise exception 'A control cannot be verified by the person who answered it';
    end if;
  end if;
  -- changing the answer invalidates prior verification
  if new.answer is distinct from old.answer or new.notes is distinct from old.notes or new.evidence_id is distinct from old.evidence_id then
    new.verified_by := null; new.verified_at := null; new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists governance_guard_trg on public.governance_responses;
create trigger governance_guard_trg before update on public.governance_responses for each row execute function public.governance_guard();

-- updated_at helper for systems/incidents
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists ai_systems_touch on public.ai_systems;
create trigger ai_systems_touch before update on public.ai_systems for each row execute function public.touch_updated_at();
drop trigger if exists incidents_touch on public.incident_reports;
create trigger incidents_touch before update on public.incident_reports for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Private storage bucket for the Evidence Vault
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;
