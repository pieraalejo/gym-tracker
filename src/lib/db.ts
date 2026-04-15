import { supabase } from './supabase';
import type { Routine, WorkoutLog, BodyMeasurement, UserProfile, WeeklyPlan, WeekDay } from '../types';

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (!data) return null;
  return {
    name: data.name ?? '',
    email: data.email ?? '',
    password: '',
    weight: data.weight ?? 0,
    height: data.height ?? 0,
    bodyFat: data.body_fat ?? undefined,
    createdAt: data.created_at ?? new Date().toISOString(),
  };
}

export async function upsertProfileDb(userId: string, profile: UserProfile) {
  await supabase.from('profiles').upsert({
    id: userId,
    name: profile.name,
    email: profile.email,
    weight: profile.weight,
    height: profile.height,
    body_fat: profile.bodyFat ?? null,
  });
}

// ─── Routines ─────────────────────────────────────────────────────────────────

export async function fetchRoutines(userId: string): Promise<Routine[]> {
  const { data } = await supabase
    .from('routines')
    .select('*, routine_exercises(*)')
    .eq('user_id', userId)
    .order('created_at');
  if (!data) return [];
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    dayType: r.day_type,
    color: r.color,
    createdAt: r.created_at,
    exercises: (r.routine_exercises ?? [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((e: any) => ({
        exerciseId: e.exercise_id,
        targetSets: e.target_sets,
        targetReps: e.target_reps,
        targetWeight: e.target_weight,
        notes: e.notes,
      })),
  }));
}

export async function syncRoutineDb(userId: string, routine: Routine) {
  await supabase.from('routines').upsert({
    id: routine.id,
    user_id: userId,
    name: routine.name,
    day_type: routine.dayType,
    color: routine.color,
    created_at: routine.createdAt,
  });
  await supabase.from('routine_exercises').delete().eq('routine_id', routine.id);
  if (routine.exercises.length > 0) {
    await supabase.from('routine_exercises').insert(
      routine.exercises.map((e, i) => ({
        routine_id: routine.id,
        exercise_id: e.exerciseId,
        target_sets: e.targetSets,
        target_reps: e.targetReps,
        target_weight: e.targetWeight,
        notes: e.notes ?? '',
        order_index: i,
      }))
    );
  }
}

export async function deleteRoutineDb(routineId: string) {
  await supabase.from('routines').delete().eq('id', routineId);
}

// ─── Workout Logs ─────────────────────────────────────────────────────────────

export async function fetchWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
  const { data } = await supabase
    .from('workout_logs')
    .select('*, exercise_logs(*, set_logs(*))')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (!data) return [];
  return data.map((log: any) => ({
    id: log.id,
    routineId: log.routine_id ?? '',
    date: log.date,
    completed: log.completed,
    notes: log.notes ?? '',
    mood: log.mood,
    startTime: log.start_time,
    endTime: log.end_time,
    exercises: (log.exercise_logs ?? []).map((e: any) => ({
      exerciseId: e.exercise_id,
      notes: e.notes ?? '',
      skipped: e.skipped,
      sets: (e.set_logs ?? [])
        .sort((a: any, b: any) => a.set_number - b.set_number)
        .map((s: any) => ({
          setNumber: s.set_number,
          reps: s.reps,
          weight: s.weight,
          completed: s.completed,
          notes: s.notes ?? undefined,
        })),
    })),
  }));
}

export async function syncWorkoutLogDb(userId: string, log: WorkoutLog) {
  await supabase.from('workout_logs').upsert({
    id: log.id,
    user_id: userId,
    routine_id: log.routineId || null,
    date: log.date,
    completed: log.completed,
    notes: log.notes,
    mood: log.mood ?? null,
    start_time: log.startTime ?? null,
    end_time: log.endTime ?? null,
  });

  // Delete old and re-insert exercises + sets
  await supabase.from('exercise_logs').delete().eq('workout_log_id', log.id);

  if (log.exercises.length === 0) return;

  const exRows = log.exercises.map((ex) => ({
    id: crypto.randomUUID(),
    workout_log_id: log.id,
    exercise_id: ex.exerciseId,
    notes: ex.notes,
    skipped: ex.skipped,
  }));

  await supabase.from('exercise_logs').insert(exRows);

  const setRows = log.exercises.flatMap((ex, i) =>
    ex.sets.map((s) => ({
      id: crypto.randomUUID(),
      exercise_log_id: exRows[i].id,
      set_number: s.setNumber,
      reps: s.reps,
      weight: s.weight,
      completed: s.completed,
      notes: s.notes ?? null,
    }))
  );

  if (setRows.length > 0) {
    await supabase.from('set_logs').insert(setRows);
  }
}

export async function deleteWorkoutLogDb(logId: string) {
  await supabase.from('workout_logs').delete().eq('id', logId);
}

// ─── Body Measurements ────────────────────────────────────────────────────────

export async function fetchBodyMeasurements(userId: string): Promise<BodyMeasurement[]> {
  const { data } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('date');
  if (!data) return [];
  return data.map((m: any) => ({
    id: m.id,
    date: m.date,
    weight: m.weight,
    bodyFat: m.body_fat ?? undefined,
  }));
}

export async function insertBodyMeasurementDb(userId: string, m: BodyMeasurement) {
  await supabase.from('body_measurements').insert({
    id: m.id,
    user_id: userId,
    date: m.date,
    weight: m.weight,
    body_fat: m.bodyFat ?? null,
  });
}

export async function deleteBodyMeasurementDb(id: string) {
  await supabase.from('body_measurements').delete().eq('id', id);
}

// ─── Weekly Plan ──────────────────────────────────────────────────────────────

export async function fetchWeeklyPlan(userId: string): Promise<WeeklyPlan> {
  const { data } = await supabase
    .from('weekly_plan')
    .select('*')
    .eq('user_id', userId);
  if (!data) return {};
  const plan: WeeklyPlan = {};
  data.forEach((row: any) => {
    if (row.routine_id) plan[row.day_of_week as WeekDay] = row.routine_id;
  });
  return plan;
}

export async function upsertWeeklyPlanDayDb(userId: string, day: WeekDay, routineId: string | null) {
  if (routineId === null) {
    await supabase.from('weekly_plan').delete().eq('user_id', userId).eq('day_of_week', day);
  } else {
    await supabase.from('weekly_plan').upsert({ user_id: userId, day_of_week: day, routine_id: routineId });
  }
}

// ─── Load all user data ───────────────────────────────────────────────────────

export async function loadAllUserData(userId: string) {
  const [profile, routines, workoutLogs, bodyMeasurements, weeklyPlan] = await Promise.all([
    fetchProfile(userId),
    fetchRoutines(userId),
    fetchWorkoutLogs(userId),
    fetchBodyMeasurements(userId),
    fetchWeeklyPlan(userId),
  ]);
  return { profile, routines, workoutLogs, bodyMeasurements, weeklyPlan };
}
