-- Spor Takip — Supabase schema.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- One shared family account signs in on both phones. Row level security keeps
-- the data private to that account (`owner`); `user_id` says whose row it is
-- ('mert' or 'simge'), and the app shows each person only their own rows.

create table if not exists profiles (
  id text primary key,
  owner uuid not null default auth.uid(),
  user_id text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  name text not null,
  sex text not null,
  birth_year integer not null,
  height_cm double precision not null,
  plan_key text not null,
  kcal_target integer not null,
  protein_target integer not null
);

create table if not exists programs (
  id text primary key,
  owner uuid not null default auth.uid(),
  user_id text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  name text not null,
  active boolean not null default true
);

create table if not exists program_days (
  id text primary key,
  owner uuid not null default auth.uid(),
  user_id text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  program_id text not null,
  position integer not null,
  name text not null,
  weekday integer,
  optional boolean not null default false
);

create table if not exists program_items (
  id text primary key,
  owner uuid not null default auth.uid(),
  user_id text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  day_id text not null,
  position integer not null,
  exercise_id text not null,
  block text not null,
  sets integer not null,
  rep_min integer not null,
  rep_max integer not null,
  rest_sec integer not null,
  duration_min double precision,
  note text not null default ''
);

create table if not exists exercise_notes (
  id text primary key,
  owner uuid not null default auth.uid(),
  user_id text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  exercise_id text not null,
  youtube_url text not null default '',
  note text not null default ''
);

create table if not exists sessions (
  id text primary key,
  owner uuid not null default auth.uid(),
  user_id text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  program_day_id text,
  day_name text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  note text not null default ''
);

create table if not exists set_logs (
  id text primary key,
  owner uuid not null default auth.uid(),
  user_id text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  session_id text not null,
  exercise_id text not null,
  item_id text,
  set_no integer not null,
  weight_kg double precision not null,
  reps integer not null,
  done_at timestamptz not null
);

create table if not exists cardio_logs (
  id text primary key,
  owner uuid not null default auth.uid(),
  user_id text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  session_id text not null,
  exercise_id text not null,
  item_id text,
  duration_min double precision not null,
  distance_km double precision,
  note text not null default '',
  done_at timestamptz not null
);

create table if not exists body_weights (
  id text primary key,
  owner uuid not null default auth.uid(),
  user_id text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  date date not null,
  kg double precision not null
);

create table if not exists body_measurements (
  id text primary key,
  owner uuid not null default auth.uid(),
  user_id text not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  date date not null,
  waist double precision,
  hip double precision,
  chest double precision,
  arm double precision,
  thigh double precision,
  shoulder double precision
);

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','programs','program_days','program_items','exercise_notes',
    'sessions','set_logs','cardio_logs','body_weights','body_measurements'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists own_rows on %I', t);
    execute format(
      'create policy own_rows on %I for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid())', t);
    execute format('create index if not exists %I on %I (owner, updated_at)', t || '_sync_idx', t);
  end loop;
end $$;
