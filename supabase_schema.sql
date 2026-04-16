-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  weight numeric,
  height numeric,
  body_fat numeric,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy if not exists "Users can manage own profile"
  on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- ── Routines ──────────────────────────────────────────────────────────────────
create table if not exists routines (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  day_type text,
  color text,
  created_at timestamptz default now()
);
alter table routines enable row level security;
create policy if not exists "Users can manage own routines"
  on routines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Routine exercises ─────────────────────────────────────────────────────────
create table if not exists routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines(id) on delete cascade,
  exercise_id text,
  target_sets int,
  target_reps int,
  target_weight numeric,
  notes text,
  order_index int
);
alter table routine_exercises enable row level security;
create policy if not exists "Users can manage own routine exercises"
  on routine_exercises for all
  using (exists (select 1 from routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from routines r where r.id = routine_id and r.user_id = auth.uid()));

-- ── Workout logs ──────────────────────────────────────────────────────────────
create table if not exists workout_logs (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  routine_id uuid,
  date date,
  completed boolean default true,
  notes text,
  mood int,
  start_time timestamptz,
  end_time timestamptz
);
alter table workout_logs enable row level security;
create policy if not exists "Users can manage own workout logs"
  on workout_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Exercise logs ─────────────────────────────────────────────────────────────
create table if not exists exercise_logs (
  id uuid primary key,
  workout_log_id uuid references workout_logs(id) on delete cascade,
  exercise_id text,
  notes text,
  skipped boolean default false
);
alter table exercise_logs enable row level security;
create policy if not exists "Users can manage own exercise logs"
  on exercise_logs for all
  using (exists (select 1 from workout_logs w where w.id = workout_log_id and w.user_id = auth.uid()))
  with check (exists (select 1 from workout_logs w where w.id = workout_log_id and w.user_id = auth.uid()));

-- ── Set logs ──────────────────────────────────────────────────────────────────
create table if not exists set_logs (
  id uuid primary key,
  exercise_log_id uuid references exercise_logs(id) on delete cascade,
  set_number int,
  reps int,
  weight numeric,
  completed boolean default true,
  notes text
);
alter table set_logs enable row level security;
create policy if not exists "Users can manage own set logs"
  on set_logs for all
  using (exists (
    select 1 from exercise_logs el
    join workout_logs w on w.id = el.workout_log_id
    where el.id = exercise_log_id and w.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from exercise_logs el
    join workout_logs w on w.id = el.workout_log_id
    where el.id = exercise_log_id and w.user_id = auth.uid()
  ));

-- ── Body measurements ─────────────────────────────────────────────────────────
create table if not exists body_measurements (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date,
  weight numeric,
  body_fat numeric
);
alter table body_measurements enable row level security;
create policy if not exists "Users can manage own measurements"
  on body_measurements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Custom exercises ─────────────────────────────────────────────────────────
create table if not exists custom_exercises (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text not null
);
alter table custom_exercises enable row level security;
create policy if not exists "Users can manage own custom exercises"
  on custom_exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Weekly plan ───────────────────────────────────────────────────────────────
create table if not exists weekly_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  day_of_week int,
  routine_id uuid,
  unique(user_id, day_of_week)
);
alter table weekly_plan enable row level security;
create policy if not exists "Users can manage own weekly plan"
  on weekly_plan for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
