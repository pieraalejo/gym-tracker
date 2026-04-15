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
  WeekDay,
  WeeklyPlan,
  UserProfile,
  BodyMeasurement,
} from '../types';
import { DEFAULT_EXERCISES, DAY_TYPE_PRIMARY_MUSCLE } from '../data/exercises';

const genId = (): string => crypto.randomUUID();

interface GymStore {
  // Profile
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;

  // Body measurements
  bodyMeasurements: BodyMeasurement[];
  addBodyMeasurement: (m: Omit<BodyMeasurement, 'id'>) => void;
  deleteBodyMeasurement: (id: string) => void;

  // Rest timer
  restTimerDuration: number; // seconds
  setRestTimerDuration: (s: number) => void;

  exercises: Exercise[];
  routines: Routine[];
  workoutLogs: WorkoutLog[];
  activeWorkout: ActiveWorkout | null;
  weeklyPlan: WeeklyPlan;

  // Exercise actions
  addExercise: (exercise: Omit<Exercise, 'id' | 'isCustom'>) => void;
  updateExercise: (id: string, updates: Partial<Omit<Exercise, 'id'>>) => void;
  deleteExercise: (id: string) => void;

  // Routine actions
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt'>) => void;
  updateRoutine: (id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => void;
  deleteRoutine: (id: string) => void;

  // Workout log actions
  addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => string;
  updateWorkoutLog: (id: string, updates: Partial<Omit<WorkoutLog, 'id'>>) => void;
  deleteWorkoutLog: (id: string) => void;

  // Weekly plan actions
  setDayRoutine: (day: WeekDay, routineId: string | null) => void;

  // Active workout actions
  startWorkout: (routineId: string, exercises: ActiveWorkoutExercise[]) => void;
  updateActiveNote: (notes: string) => void;
  updateActiveExercise: (exerciseId: string, updates: Partial<ActiveWorkoutExercise>) => void;
  updateActiveSet: (exerciseId: string, setNumber: number, updates: Partial<SetLog>) => void;
  addSetToActiveExercise: (exerciseId: string) => void;
  removeSetFromActiveExercise: (exerciseId: string, setNumber: number) => void;
  finishWorkout: (notes: string, mood?: 1 | 2 | 3 | 4 | 5) => string | null;
  cancelWorkout: () => void;
}

export const useGymStore = create<GymStore>()(
  persist(
    (set, get) => ({
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      updateUserProfile: (updates) =>
        set((state) => ({
          userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null,
        })),

      bodyMeasurements: [],
      addBodyMeasurement: (m) => {
        const id = genId();
        set((state) => ({
          bodyMeasurements: [...state.bodyMeasurements, { ...m, id }],
        }));
      },
      deleteBodyMeasurement: (id) =>
        set((state) => ({
          bodyMeasurements: state.bodyMeasurements.filter((m) => m.id !== id),
        })),

      restTimerDuration: 90,
      setRestTimerDuration: (s) => set({ restTimerDuration: s }),

      exercises: DEFAULT_EXERCISES,
      routines: [],
      workoutLogs: [],
      activeWorkout: null,
      weeklyPlan: {},

      addExercise: (exercise) =>
        set((state) => ({
          exercises: [...state.exercises, { ...exercise, id: genId(), isCustom: true }],
        })),

      updateExercise: (id, updates) =>
        set((state) => ({
          exercises: state.exercises.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      deleteExercise: (id) =>
        set((state) => ({
          exercises: state.exercises.filter((e) => !(e.id === id && e.isCustom)),
        })),

      addRoutine: (routine) =>
        set((state) => ({
          routines: [
            ...state.routines,
            { ...routine, id: genId(), createdAt: new Date().toISOString() },
          ],
        })),

      updateRoutine: (id, updates) =>
        set((state) => ({
          routines: state.routines.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      deleteRoutine: (id) =>
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
        })),

      addWorkoutLog: (log) => {
        const id = genId();
        set((state) => ({
          workoutLogs: [...state.workoutLogs, { ...log, id }],
        }));
        return id;
      },

      updateWorkoutLog: (id, updates) =>
        set((state) => ({
          workoutLogs: state.workoutLogs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),

      deleteWorkoutLog: (id) =>
        set((state) => ({
          workoutLogs: state.workoutLogs.filter((l) => l.id !== id),
        })),

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
                const renumbered = filtered.map((s, i) => ({ ...s, setNumber: i + 1 }));
                return { ...e, sets: renumbered };
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
        set((state) => ({
          workoutLogs: [...state.workoutLogs, log],
          activeWorkout: null,
        }));
        return id;
      },

      cancelWorkout: () => set({ activeWorkout: null }),

      setDayRoutine: (day, routineId) =>
        set((state) => {
          const plan = { ...state.weeklyPlan };
          if (routineId === null) {
            delete plan[day];
          } else {
            plan[day] = routineId;
          }
          return { weeklyPlan: plan };
        }),
    }),
    {
      name: 'gym-tracker-v1',
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

export const getBearState = (
  workoutLogs: WorkoutLog[],
  activeWorkout: ActiveWorkout | null,
  routines: Routine[]
): BearState => {
  if (activeWorkout) {
    const routine = routines.find((r) => r.id === activeWorkout.routineId);
    if (routine) {
      const primary = DAY_TYPE_PRIMARY_MUSCLE[routine.dayType];
      return `workout_${primary}` as BearState;
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
  const uniqueDates = [
    ...new Set(workoutLogs.map((l) => l.date)),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDates.length; i++) {
    const d = new Date(uniqueDates[i]);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (d.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
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
