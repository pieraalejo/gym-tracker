export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'piernas'
  | 'piernas_cuadriceps'
  | 'piernas_femorales'
  | 'gluteos'
  | 'abdomen'
  | 'cardio';

export type DayType =
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'lower'
  | 'full'
  | 'cardio'
  | 'custom'
  | 'brazos'
  | 'musculo_pecho'
  | 'musculo_espalda'
  | 'musculo_hombros'
  | 'musculo_biceps'
  | 'musculo_triceps'
  | 'musculo_piernas'
  | 'musculo_piernas_cuadriceps'
  | 'musculo_piernas_femorales'
  | 'musculo_gluteos'
  | 'musculo_abdomen';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
}

export interface RoutineExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  notes?: string;
  alternatives?: string[]; // IDs de ejercicios alternativos para este slot
}

export interface Routine {
  id: string;
  name: string;
  dayType: DayType;
  exercises: RoutineExercise[];
  createdAt: string;
  color: string;
}

export interface SetLog {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  notes?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  password: string;
  weight: number;   // kg
  height: number;   // cm
  bodyFat?: number; // % opcional
  createdAt: string;
}

export interface BodyMeasurement {
  id: string;
  date: string;     // YYYY-MM-DD
  weight: number;   // kg
  bodyFat?: number; // %
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  notes: string;
  skipped: boolean;
  isExtra?: boolean; // true si fue agregado durante el entreno (no estaba en la rutina)
}

export interface WorkoutLog {
  id: string;
  routineId: string;
  date: string;
  exercises: ExerciseLog[];
  completed: boolean;
  notes: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  startTime?: string;
  endTime?: string;
}

export interface ActiveWorkoutExercise {
  exerciseId: string;
  sets: SetLog[];
  notes: string;
  skipped: boolean;
  isExtra?: boolean; // true si fue agregado durante el entreno
}

export interface ActiveWorkout {
  routineId: string;
  startTime: string;
  exercises: ActiveWorkoutExercise[];
  notes: string;
}

// 0=Domingo, 1=Lunes, ..., 6=Sábado
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type WeeklyPlan = Partial<Record<WeekDay, string>>; // weekday -> routineId

export type BearState =
  | 'fresh'
  | 'happy'
  | 'neutral'
  | 'sad'
  | 'workout_pecho'
  | 'workout_espalda'
  | 'workout_hombros'
  | 'workout_biceps'
  | 'workout_triceps'
  | 'workout_piernas'
  | 'workout_abdomen'
  | 'workout_cardio';
