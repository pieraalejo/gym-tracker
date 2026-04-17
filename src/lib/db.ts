import { supabase } from './supabase';
import type { Exercise, Routine, WorkoutLog, BodyMeasurement, UserProfile, WeeklyPlan, WeekDay, MuscleGroup, DayType } from '../types';

// ─── Row types (raw Supabase shape, snake_case) ───────────────────────────────
interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  weight: number | null;
  height: number | null;
  body_fat: number | null;
  created_at: string | null;
}

interface RoutineExerciseRow {
  exercise_id: string;
  target_sets: number;
  target_reps: number;
  target_weight: number;
  notes: string | null;
  order_index: number;
}

interface RoutineRow {
  id: string;
  name: string;
  day_type: DayType;
  color: string;
  created_at: string;
  routine_exercises: RoutineExerciseRow[] | null;
}

interface SetLogRow {
  set_number: number;
  reps: number;
  weight: number;
  completed: boolean;
  notes: string | null;
}

interface ExerciseLogRow {
  exercise_id: string;
  notes: string | null;
  skipped: boolean;
  set_logs: SetLogRow[] | null;
}

interface WorkoutLogRow {
  id: string;
  routine_id: string | null;
  date: string;
  completed: boolean;
  notes: string | null;
  mood: 1 | 2 | 3 | 4 | 5 | null;
  start_time: string | null;
  end_time: string | null;
  exercise_logs: ExerciseLogRow[] | null;
}

interface BodyMeasurementRow {
  id: string;
  date: string;
  weight: number;
  body_fat: number | null;
}

interface WeeklyPlanRow {
  day_of_week: number;
  routine_id: string | null;
}

interface CustomExerciseRow {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<ProfileRow>();
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
    .order('created_at')
    .returns<RoutineRow[]>();
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    dayType: r.day_type,
    color: r.color,
    createdAt: r.created_at,
    exercises: (r.routine_exercises ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map((e) => ({
        exerciseId: e.exercise_id,
        targetSets: e.target_sets,
        targetReps: e.target_reps,
        targetWeight: e.target_weight,
        notes: e.notes ?? '',
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
    .order('date', { ascending: false })
    .returns<WorkoutLogRow[]>();
  if (!data) return [];
  return data.map((log) => ({
    id: log.id,
    routineId: log.routine_id ?? '',
    date: log.date,
    completed: log.completed,
    notes: log.notes ?? '',
    mood: log.mood ?? undefined,
    startTime: log.start_time ?? undefined,
    endTime: log.end_time ?? undefined,
    exercises: (log.exercise_logs ?? []).map((e) => ({
      exerciseId: e.exercise_id,
      notes: e.notes ?? '',
      skipped: e.skipped,
      sets: (e.set_logs ?? [])
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({
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
    .order('date')
    .returns<BodyMeasurementRow[]>();
  if (!data) return [];
  return data.map((m) => ({
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
    .eq('user_id', userId)
    .returns<WeeklyPlanRow[]>();
  if (!data) return {};
  const plan: WeeklyPlan = {};
  data.forEach((row) => {
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

// ─── Custom exercises ─────────────────────────────────────────────────────────

export async function fetchCustomExercises(userId: string): Promise<Exercise[]> {
  const { data } = await supabase
    .from('custom_exercises')
    .select('*')
    .eq('user_id', userId)
    .returns<CustomExerciseRow[]>();
  if (!data) return [];
  return data.map((e) => ({
    id: e.id,
    name: e.name,
    muscleGroup: e.muscle_group,
    isCustom: true,
  }));
}

export async function upsertCustomExerciseDb(userId: string, exercise: Exercise) {
  await supabase.from('custom_exercises').upsert({
    id: exercise.id,
    user_id: userId,
    name: exercise.name,
    muscle_group: exercise.muscleGroup,
  });
}

export async function deleteCustomExerciseDb(id: string) {
  await supabase.from('custom_exercises').delete().eq('id', id);
}

// ─── Load all user data ───────────────────────────────────────────────────────

export async function loadAllUserData(userId: string) {
  const [profile, routines, workoutLogs, bodyMeasurements, weeklyPlan, customExercises] = await Promise.all([
    fetchProfile(userId),
    fetchRoutines(userId),
    fetchWorkoutLogs(userId),
    fetchBodyMeasurements(userId),
    fetchWeeklyPlan(userId),
    fetchCustomExercises(userId),
  ]);
  return { profile, routines, workoutLogs, bodyMeasurements, weeklyPlan, customExercises };
}
