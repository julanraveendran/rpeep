create extension if not exists pgcrypto;

create type scope_status as enum ('in_scope', 'not_in_scope', 'cannot_confirm');

create table public.reports (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  first_name         text not null check (char_length(first_name) between 1 and 60),
  email              text not null check (char_length(email) <= 254),
  organisation       text not null check (char_length(organisation) between 1 and 120),
  role               text not null,
  role_other         text check (char_length(role_other) <= 60),
  org_type           text not null,
  buildings_band     text not null,
  building_ref       text check (char_length(building_ref) <= 80),
  answers            jsonb not null,          -- Answers object, as validated
  status             scope_status not null,   -- from the SERVER engine run
  criteria_met       text[] not null default '{}',
  missing            text[] not null default '{}',
  engine_version     text not null,
  readiness_answers  jsonb,                   -- null if Part B skipped
  readiness_score    smallint check (readiness_score between 0 and 12),
  marketing_consent  boolean not null default false,
  consent_text_ver   text not null,           -- e.g. 'report-form-v1'
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  ip_hash            text,                    -- sha256(ip + IP_HASH_SALT), never the raw IP
  email_sent_at      timestamptz,
  email_error        text
);
create index reports_created_at_idx on public.reports (created_at desc);
create index reports_email_idx on public.reports (email);

create table public.pilot_applications (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  first_name         text not null check (char_length(first_name) between 1 and 60),
  last_name          text not null check (char_length(last_name) between 1 and 60),
  email              text not null check (char_length(email) <= 254),
  organisation       text not null check (char_length(organisation) between 1 and 120),
  role               text not null,
  org_type           text not null,
  buildings_band     text not null,
  current_methods    text[] not null check (array_length(current_methods, 1) >= 1),
  current_software   text check (char_length(current_software) <= 80),
  hardest_part       text not null check (char_length(hardest_part) between 10 and 800),
  top_features       text[] not null default '{}' check (coalesce(array_length(top_features, 1), 0) <= 3),
  wants_fra_tracker  text not null,
  price_band         text not null,
  willing_to_pay     boolean not null default false,
  start_timing       text not null,
  marketing_consent  boolean not null default false,
  consent_text_ver   text not null,
  report_id          uuid references public.reports(id) on delete set null,
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  ip_hash            text,
  status             text not null default 'new'  -- new | contacted | accepted | declined
);
create index pilot_created_at_idx on public.pilot_applications (created_at desc);

create table public.email_suppressions (
  email       text primary key,
  created_at  timestamptz not null default now(),
  reason      text not null default 'unsubscribe'
);

alter table public.reports            enable row level security;
alter table public.pilot_applications enable row level security;
alter table public.email_suppressions enable row level security;
-- Deliberately NO policies: only the service role (server) can read or write.
