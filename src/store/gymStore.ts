import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Exercise,
  Routine,
  WorkoutLog,
  ActiveWorkout,
  ActiveWorkoutExercise,
  SetLog,
  BearState,
  MuscleGroup,
  WeekDay,
  WeeklyPlan,
  UserProfile,
  BodyMeasurement,
} from '../types';
import { DEFAULT_EXERCISES, DAY_TYPE_PRIMARY_MUSCLE } from '../data/exercises';
import {
  loadAllUserData,
  upsertProfileDb,
  syncRoutineDb,
  deleteRoutineDb,
  syncWorkoutLogDb,
  deleteWorkoutLogDb,
  insertBodyMeasurementDb,
  deleteBodyMeasurementDb,
  upsertWeeklyPlanDayDb,
  upsertCustomExerciseDb,
  deleteCustomExerciseDb,
} from '../lib/db';

const genId = (): string => crypto.randomUUID();

const PERSIST_VERSION = 1;

function sync(fn: () => Promise<void>) {
  fn().catch((err) => {
    console.error('[Supabase sync error]', err);
    const message =
      err instanceof Error ? err.message : 'No se pudo sincronizar con el servidor';
    useGymStore.setState({ syncError: message });
  });
}

interface GymStore {
  // Auth
  userId: string | null;
  isLoading: boolean;
  loadUserData: (userId: string) => Promise<void>;
  resetStore: () => void;

  // Sync errors
  syncError: string | null;
  clearSyncError: () => void;

  // Profile
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;

  // Body measurements
  bodyMeasurements: BodyMeasurement[];
  addBodyMeasurement: (m: Omit<BodyMeasurement, 'id'>) => void;
  deleteBodyMeasurement: (id: string) => void;

  // Rest timer (persisted locally)
  restTimerDuration: number;
  setRestTimerDuration: (s: number) => void;

  // Exercises
  exercises: Exercise[];
  addExercise: (exercise: Omit<Exercise, 'id' | 'isCustom'>) => void;
  updateExercise: (id: string, updates: Partial<Omit<Exercise, 'id'>>) => void;
  deleteExercise: (id: string) => void;

  // Routines
  routines: Routine[];
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt'>) => void;
  updateRoutine: (id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => void;
  deleteRoutine: (id: string) => void;

  // Workout logs
  workoutLogs: WorkoutLog[];
  addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => string;
  updateWorkoutLog: (id: string, updates: Partial<Omit<WorkoutLog, 'id'>>) => void;
  deleteWorkoutLog: (id: string) => void;

  // Active workout
  activeWorkout: ActiveWorkout | null;
  startWorkout: (routineId: string, exercises: ActiveWorkoutExercise[]) => void;
  updateActiveNote: (notes: string) => void;
  updateActiveExercise: (exerciseId: string, updates: Partial<ActiveWorkoutExercise>) => void;
  updateActiveSet: (exerciseId: string, setNumber: number, updates: Partial<SetLog>) => void;
  addSetToActiveExercise: (exerciseId: string) => void;
  removeSetFromActiveExercise: (exerciseId: string, setNumber: number) => void;
  addExerciseToActiveWorkout: (exerciseId: string, sets: number, reps: number, weight: number) => void;
  swapActiveExercise: (oldExerciseId: string, newExerciseId: string) => void;
  reorderActiveExercises: (fromIndex: number, toIndex: number) => void;
  finishWorkout: (notes: string, mood?: 1 | 2 | 3 | 4 | 5) => string | null;
  cancelWorkout: () => void;

  // Weekly plan
  weeklyPlan: WeeklyPlan;
  setDayRoutine: (day: WeekDay, routineId: string | null) => void;
}

export const useGymStore = create<GymStore>()(
  persist(
    (set, get) => ({
      userId: null,
      isLoading: false,
      syncError: null,

      clearSyncError: () => set({ syncError: null }),

      loadUserData: async (userId: string) => {
        set({ isLoading: true, userId });
        try {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 25000)
          );
          const load = loadAllUserData(userId);
          const { profile, routines, workoutLogs, bodyMeasurements, weeklyPlan, customExercises } =
            await Promise.race([load, timeout]);

          // If the locally-persisted activeWorkout was already finished on another device,
          // clear it (match by startTime against loaded workout logs).
          const currentActive = get().activeWorkout;
          const alreadyLogged =
            currentActive != null &&
            workoutLogs.some((l) => l.startTime === currentActive.startTime);

          set({
            userProfile: profile,
            routines,
            workoutLogs,
            bodyMeasurements,
            weeklyPlan,
            // Supabase is authoritative for custom exercises — always replace local ones
            exercises: [...DEFAULT_EXERCISES, ...customExercises],
            isLoading: false,
            ...(alreadyLogged ? { activeWorkout: null } : {}),
          });
        } catch (err) {
          console.error('Failed to load user data:', err);
          set({ isLoading: false });
        }
      },

      resetStore: () =>
        set({
          userId: null,
          userProfile: null,
          routines: [],
          workoutLogs: [],
          bodyMeasurements: [],
          weeklyPlan: {},
          activeWorkout: null,
          isLoading: false,
          // exercises are NOT reset so custom exercises survive logout/login
        }),

      // ── Profile ──────────────────────────────────────────────────────────
      userProfile: null,

      setUserProfile: (profile) => {
        set({ userProfile: profile });
        const userId = get().userId;
        if (userId) sync(() => upsertProfileDb(userId, profile));
      },

      updateUserProfile: (updates) => {
        set((state) => ({
          userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null,
        }));
        const userId = get().userId;
        const profile = get().userProfile;
        if (userId && profile) sync(() => upsertProfileDb(userId, profile));
      },

      // ── Body measurements ─────────────────────────────────────────────────
      bodyMeasurements: [],

      addBodyMeasurement: (m) => {
        const measurement: BodyMeasurement = { ...m, id: genId() };
        set((state) => ({ bodyMeasurements: [...state.bodyMeasurements, measurement] }));
        const userId = get().userId;
        if (userId) sync(() => insertBodyMeasurementDb(userId, measurement));
      },

      deleteBodyMeasurement: (id) => {
        set((state) => ({ bodyMeasurements: state.bodyMeasurements.filter((m) => m.id !== id) }));
        sync(() => deleteBodyMeasurementDb(id));
      },

      // ── Rest timer ────────────────────────────────────────────────────────
      restTimerDuration: 180,
      setRestTimerDuration: (s) => set({ restTimerDuration: s }),

      // ── Exercises ─────────────────────────────────────────────────────────
      exercises: DEFAULT_EXERCISES,

      addExercise: (exercise) => {
        const newExercise = { ...exercise, id: genId(), isCustom: true };
        set((state) => ({ exercises: [...state.exercises, newExercise] }));
        const userId = get().userId;
        if (userId) sync(() => upsertCustomExerciseDb(userId, newExercise));
      },

      updateExercise: (id, updates) => {
        set((state) => ({
          exercises: state.exercises.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));
        const userId = get().userId;
        const exercise = get().exercises.find((e) => e.id === id);
        if (userId && exercise?.isCustom) sync(() => upsertCustomExerciseDb(userId, exercise));
      },

      deleteExercise: (id) => {
        set((state) => ({
          exercises: state.exercises.filter((e) => !(e.id === id && e.isCustom)),
        }));
        sync(() => deleteCustomExerciseDb(id));
      },

      // ── Routines ──────────────────────────────────────────────────────────
      routines: [],

      addRoutine: (routine) => {
        const newRoutine: Routine = { ...routine, id: genId(), createdAt: new Date().toISOString() };
        set((state) => ({ routines: [...state.routines, newRoutine] }));
        const userId = get().userId;
        if (userId) sync(() => syncRoutineDb(userId, newRoutine));
      },

      updateRoutine: (id, updates) => {
        set((state) => ({
          routines: state.routines.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        }));
        const userId = get().userId;
        const routine = get().routines.find((r) => r.id === id);
        if (userId && routine) sync(() => syncRoutineDb(userId, routine));
      },

      deleteRoutine: (id) => {
        set((state) => ({ routines: state.routines.filter((r) => r.id !== id) }));
        sync(() => deleteRoutineDb(id));
      },

      // ── Workout logs ──────────────────────────────────────────────────────
      workoutLogs: [],

      addWorkoutLog: (log) => {
        const id = genId();
        const newLog: WorkoutLog = { ...log, id };
        set((state) => ({ workoutLogs: [...state.workoutLogs, newLog] }));
        const userId = get().userId;
        if (userId) sync(() => syncWorkoutLogDb(userId, newLog));
        return id;
      },

      updateWorkoutLog: (id, updates) =>
        set((state) => ({
          workoutLogs: state.workoutLogs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),

      deleteWorkoutLog: (id) => {
        set((state) => ({ workoutLogs: state.workoutLogs.filter((l) => l.id !== id) }));
        sync(() => deleteWorkoutLogDb(id));
      },

      // ── Active workout ────────────────────────────────────────────────────
      activeWorkout: null,

      startWorkout: (routineId, exercises) =>
        set({
          activeWorkout: {
            routineId,
            startTime: new Date().toISOString(),
            exercises,
            notes: '',
          },
        }),

      updateActiveNote: (notes) =>
        set((state) => ({
          activeWorkout: state.activeWorkout ? { ...state.activeWorkout, notes } : null,
        })),

      updateActiveExercise: (exerciseId, updates) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) =>
                e.exerciseId === exerciseId ? { ...e, ...updates } : e
              ),
            },
          };
        }),

      updateActiveSet: (exerciseId, setNumber, updates) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) =>
                e.exerciseId === exerciseId
                  ? {
                      ...e,
                      sets: e.sets.map((s) =>
                        s.setNumber === setNumber ? { ...s, ...updates } : s
                      ),
                    }
                  : e
              ),
            },
          };
        }),

      addSetToActiveExercise: (exerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.exerciseId !== exerciseId) return e;
                const lastSet = e.sets[e.sets.length - 1];
                const newSet: SetLog = {
                  setNumber: e.sets.length + 1,
                  reps: lastSet?.reps ?? 10,
                  weight: lastSet?.weight ?? 0,
                  completed: false,
                };
                return { ...e, sets: [...e.sets, newSet] };
              }),
            },
          };
        }),

      removeSetFromActiveExercise: (exerciseId, setNumber) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.exerciseId !== exerciseId) return e;
                const filtered = e.sets.filter((s) => s.setNumber !== setNumber);
                return { ...e, sets: filtered.map((s, i) => ({ ...s, setNumber: i + 1 })) };
              }),
            },
          };
        }),

      finishWorkout: (notes, mood) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return null;
        const id = genId();
        const log: WorkoutLog = {
          id,
          routineId: activeWorkout.routineId,
          date: new Date().toISOString().split('T')[0],
          exercises: activeWorkout.exercises,
          completed: true,
          notes,
          mood,
          startTime: activeWorkout.startTime,
          endTime: new Date().toISOString(),
        };
        set((state) => ({ workoutLogs: [...state.workoutLogs, log], activeWorkout: null }));
        const userId = get().userId;
        if (userId) sync(() => syncWorkoutLogDb(userId, log));
        return id;
      },

      addExerciseToActiveWorkout: (exerciseId, sets, reps, weight) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          // Evitar duplicados
          if (state.activeWorkout.exercises.some((e) => e.exerciseId === exerciseId)) return state;
          const newExercise: ActiveWorkoutExercise = {
            exerciseId,
            skipped: false,
            notes: '',
            isExtra: true,
            sets: Array.from({ length: sets }, (_, i) => ({
              setNumber: i + 1,
              reps,
              weight,
              completed: false,
            })),
          };
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: [...state.activeWorkout.exercises, newExercise],
            },
          };
        }),

      swapActiveExercise: (oldExerciseId, newExerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          if (oldExerciseId === newExerciseId) return state;
          // Evitar duplicados: si el nuevo ejercicio ya está en el workout, no hacer nada
          if (state.activeWorkout.exercises.some((e) => e.exerciseId === newExerciseId)) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) =>
                e.exerciseId === oldExerciseId ? { ...e, exerciseId: newExerciseId } : e
              ),
            },
          };
        }),

      reorderActiveExercises: (fromIndex, toIndex) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const exs = state.activeWorkout.exercises;
          if (
            fromIndex === toIndex ||
            fromIndex < 0 || fromIndex >= exs.length ||
            toIndex < 0 || toIndex >= exs.length
          ) return state;
          const next = [...exs];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return {
            activeWorkout: { ...state.activeWorkout, exercises: next },
          };
        }),

      cancelWorkout: () => set({ activeWorkout: null }),

      // ── Weekly plan ───────────────────────────────────────────────────────
      weeklyPlan: {},

      setDayRoutine: (day, routineId) => {
        set((state) => {
          const plan = { ...state.weeklyPlan };
          if (routineId === null) delete plan[day];
          else plan[day] = routineId;
          return { weeklyPlan: plan };
        });
        const userId = get().userId;
        if (userId) sync(() => upsertWeeklyPlanDayDb(userId, day, routineId));
      },
    }),
    {
      name: 'gym-tracker-v3',
      version: PERSIST_VERSION,
      migrate: (persisted, version) => {
        if (version !== PERSIST_VERSION) {
          return {
            activeWorkout: null,
            restTimerDuration: 180,
            exercises: DEFAULT_EXERCISES,
          };
        }
        return persisted as { activeWorkout: ActiveWorkout | null; restTimerDuration: number; exercises: Exercise[] };
      },
      // Only persist active workout and local preferences
      partialize: (state) => ({
        activeWorkout: state.activeWorkout,
        restTimerDuration: state.restTimerDuration,
        exercises: state.exercises, // keep custom exercises local
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Always use the latest DEFAULT_EXERCISES for built-in exercises,
        // keeping only user-created custom exercises from localStorage.
        const customExercises = state.exercises.filter((e) => e.isCustom);
        state.exercises = [...DEFAULT_EXERCISES, ...customExercises];
      },
    }
  )
);

// ─── Selector helpers ────────────────────────────────────────────────────────

export const getDaysSinceLastWorkout = (workoutLogs: WorkoutLog[]): number | null => {
  if (workoutLogs.length === 0) return null;
  const sorted = [...workoutLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastDate = new Date(sorted[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
};

const MUSCLE_TO_BEAR_STATE: Record<MuscleGroup, BearState> = {
  pecho: 'workout_pecho',
  espalda: 'workout_espalda',
  hombros: 'workout_hombros',
  biceps: 'workout_biceps',
  triceps: 'workout_triceps',
  piernas: 'workout_piernas',
  piernas_cuadriceps: 'workout_piernas',
  piernas_femorales: 'workout_piernas',
  gluteos: 'workout_piernas',
  abdomen: 'workout_abdomen',
  cardio: 'workout_cardio',
};

export const getBearState = (
  workoutLogs: WorkoutLog[],
  activeWorkout: ActiveWorkout | null,
  routines: Routine[]
): BearState => {
  if (activeWorkout) {
    const routine = routines.find((r) => r.id === activeWorkout.routineId);
    if (routine) {
      const primary = DAY_TYPE_PRIMARY_MUSCLE[routine.dayType];
      return MUSCLE_TO_BEAR_STATE[primary] ?? 'workout_pecho';
    }
    return 'workout_pecho';
  }
  const days = getDaysSinceLastWorkout(workoutLogs);
  if (days === null) return 'neutral';
  if (days === 0) return 'fresh';
  if (days === 1) return 'happy';
  if (days <= 3) return 'neutral';
  return 'sad';
};

export const getCurrentStreak = (workoutLogs: WorkoutLog[]): number => {
  if (workoutLogs.length === 0) return 0;
  const uniqueDates = [...new Set(workoutLogs.map((l) => l.date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < uniqueDates.length; i++) {
    const d = new Date(uniqueDates[i]);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (d.getTime() === expected.getTime()) streak++;
    else break;
  }
  return streak;
};

export const getExerciseProgress = (
  workoutLogs: WorkoutLog[],
  exerciseId: string
): Array<{ date: string; maxWeight: number; totalVolume: number; maxReps: number }> => {
  const sorted = [...workoutLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const result: Array<{ date: string; maxWeight: number; totalVolume: number; maxReps: number }> = [];
  for (const log of sorted) {
    const exLog = log.exercises.find((e) => e.exerciseId === exerciseId);
    if (!exLog || exLog.skipped) continue;
    const done = exLog.sets.filter((s) => s.completed);
    if (done.length === 0) continue;
    result.push({
      date: log.date,
      maxWeight: Math.max(...done.map((s) => s.weight)),
      totalVolume: done.reduce((sum, s) => sum + s.reps * s.weight, 0),
      maxReps: Math.max(...done.map((s) => s.reps)),
    });
  }
  return result;
};
