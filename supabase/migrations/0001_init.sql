-- Single shared access link for the app (not tied to a specific athlete).
create table access_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- One row per person (Joe, partner, extensible to more later).
create table athletes (
  id uuid primary key default gen_random_uuid(),
  label text not null,

  hr_max integer,
  resting_hr integer,
  hr_zones jsonb,

  goal_marathon_time_seconds integer,
  race_date date,

  vo2max_manual numeric,
  vo2max_manual_confidence text check (vo2max_manual_confidence in ('low', 'med', 'high')),
  lt1_manual_pace_sec_per_km numeric,
  lt1_manual_confidence text check (lt1_manual_confidence in ('low', 'med', 'high')),
  lt2_manual_pace_sec_per_km numeric,
  lt2_manual_confidence text check (lt2_manual_confidence in ('low', 'med', 'high')),

  strava_athlete_id bigint unique,
  strava_access_token text,
  strava_refresh_token text,
  strava_token_expires_at timestamptz,
  strava_scope text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  strava_id bigint unique,
  name text,
  start_date timestamptz not null,
  distance_m numeric not null,
  moving_time_s integer not null,
  elapsed_time_s integer,
  avg_hr numeric,
  max_hr numeric,
  avg_cadence numeric,
  avg_pace_sec_per_km numeric,

  streams jsonb,

  session_load numeric,
  is_hard_effort boolean not null default false,
  hard_effort_reason text,

  note text,

  created_at timestamptz not null default now()
);

create index activities_athlete_date_idx on activities (athlete_id, start_date desc);

-- No stored `weeks` table for MVP: ACWR/volume are computed on-demand from `activities`
-- in lib/running/snapshot.ts. If this ever needs caching, add a materialized `weeks` table
-- with the same shape (athlete_id, iso_year, iso_week, total_volume_m, acute_load,
-- chronic_load, acwr, injury_risk_score) without changing acwr.ts's function contracts.
