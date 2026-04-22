import type { Exercise, MuscleGroup, DayType } from '../types';

export function isCardio(muscleGroup: MuscleGroup | undefined): boolean {
  return muscleGroup === 'cardio';
}

export function secToMmss(s: number): string {
  if (!s || s <= 0) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Accepts "mm:ss", "m:s", or a bare number (interpreted as minutes).
export function mmssToSec(str: string): number {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  if (trimmed.includes(':')) {
    const [m, s] = trimmed.split(':');
    const mins = parseInt(m, 10) || 0;
    const secs = parseInt(s, 10) || 0;
    return mins * 60 + Math.min(secs, 59);
  }
  const n = parseInt(trimmed, 10) || 0;
  return n * 60;
}

export const DEFAULT_EXERCISES: Exercise[] = [
  // PECHO
  { id: 'pe001', name: 'Press de banca plano con barra', muscleGroup: 'pecho', isCustom: false },
  { id: 'pe002', name: 'Press inclinado con mancuernas', muscleGroup: 'pecho', isCustom: false },
  { id: 'pe003', name: 'Aperturas con mancuernas', muscleGroup: 'pecho', isCustom: false },
  { id: 'pe004', name: 'Press de banca plano con mancuernas', muscleGroup: 'pecho', isCustom: false },
  { id: 'pe005', name: 'Press declinado con barra', muscleGroup: 'pecho', isCustom: false },
  { id: 'pe006', name: 'Fondos en paralelas (pecho)', muscleGroup: 'pecho', isCustom: false },
  { id: 'pe007', name: 'Crossover en polea', muscleGroup: 'pecho', isCustom: false },
  { id: 'pe008', name: 'Pullover con mancuerna', muscleGroup: 'pecho', isCustom: false },
  { id: 'pe009', name: 'Press inclinado con barra', muscleGroup: 'pecho', isCustom: false },

  // ESPALDA
  { id: 'es001', name: 'Peso muerto convencional', muscleGroup: 'espalda', isCustom: false },
  { id: 'es002', name: 'Remo con barra', muscleGroup: 'espalda', isCustom: false },
  { id: 'es003', name: 'Dominadas', muscleGroup: 'espalda', isCustom: false },
  { id: 'es004', name: 'Remo en polea baja', muscleGroup: 'espalda', isCustom: false },
  { id: 'es005', name: 'Jalón al pecho en polea alta', muscleGroup: 'espalda', isCustom: false },
  { id: 'es006', name: 'Remo con mancuerna unilateral', muscleGroup: 'espalda', isCustom: false },
  { id: 'es007', name: 'Jalón trasnuca', muscleGroup: 'espalda', isCustom: false },
  { id: 'es008', name: 'Hiperextensiones en banco', muscleGroup: 'espalda', isCustom: false },
  { id: 'es009', name: 'Remo en máquina', muscleGroup: 'espalda', isCustom: false },

  // HOMBROS
  { id: 'ho001', name: 'Press militar con barra', muscleGroup: 'hombros', isCustom: false },
  { id: 'ho002', name: 'Press con mancuernas sentado', muscleGroup: 'hombros', isCustom: false },
  { id: 'ho003', name: 'Elevaciones laterales con mancuernas', muscleGroup: 'hombros', isCustom: false },
  { id: 'ho004', name: 'Elevaciones frontales', muscleGroup: 'hombros', isCustom: false },
  { id: 'ho005', name: 'Pájaros (hombro posterior)', muscleGroup: 'hombros', isCustom: false },
  { id: 'ho006', name: 'Encogimientos (trapecios)', muscleGroup: 'hombros', isCustom: false },
  { id: 'ho007', name: 'Arnold press', muscleGroup: 'hombros', isCustom: false },
  { id: 'ho008', name: 'Face pull en polea', muscleGroup: 'hombros', isCustom: false },

  // BICEPS
  { id: 'bi001', name: 'Curl con barra', muscleGroup: 'biceps', isCustom: false },
  { id: 'bi002', name: 'Curl con mancuernas alternado', muscleGroup: 'biceps', isCustom: false },
  { id: 'bi003', name: 'Curl martillo', muscleGroup: 'biceps', isCustom: false },
  { id: 'bi004', name: 'Curl en banco Scott', muscleGroup: 'biceps', isCustom: false },
  { id: 'bi005', name: 'Curl en polea baja', muscleGroup: 'biceps', isCustom: false },
  { id: 'bi006', name: 'Curl concentrado', muscleGroup: 'biceps', isCustom: false },
  { id: 'bi007', name: 'Curl inclinado en banco', muscleGroup: 'biceps', isCustom: false },

  // TRICEPS
  { id: 'tr001', name: 'Press francés (Skull crusher)', muscleGroup: 'triceps', isCustom: false },
  { id: 'tr002', name: 'Extensión en polea alta', muscleGroup: 'triceps', isCustom: false },
  { id: 'tr003', name: 'Fondos en banco (tríceps)', muscleGroup: 'triceps', isCustom: false },
  { id: 'tr004', name: 'Press cerrado con barra', muscleGroup: 'triceps', isCustom: false },
  { id: 'tr005', name: 'Patada de tríceps con mancuerna', muscleGroup: 'triceps', isCustom: false },
  { id: 'tr006', name: 'Extensión sobre cabeza con mancuerna', muscleGroup: 'triceps', isCustom: false },
  { id: 'tr007', name: 'Fondos en paralelas (tríceps)', muscleGroup: 'triceps', isCustom: false },

  // PIERNAS - CUÁDRICEPS
  { id: 'pi001', name: 'Sentadilla con barra', muscleGroup: 'piernas_cuadriceps', isCustom: false },
  { id: 'pi002', name: 'Prensa de piernas', muscleGroup: 'piernas_cuadriceps', isCustom: false },
  { id: 'pi003', name: 'Extensión de cuádriceps en máquina', muscleGroup: 'piernas_cuadriceps', isCustom: false },
  { id: 'pi006', name: 'Zancadas con mancuernas', muscleGroup: 'piernas_cuadriceps', isCustom: false },
  { id: 'pi007', name: 'Sentadilla búlgara', muscleGroup: 'piernas_cuadriceps', isCustom: false },
  { id: 'pi008', name: 'Gemelos de pie (pantorrillas)', muscleGroup: 'piernas_cuadriceps', isCustom: false },
  { id: 'pi009', name: 'Sentadilla hack', muscleGroup: 'piernas_cuadriceps', isCustom: false },

  // PIERNAS - FEMORALES
  { id: 'pi004', name: 'Curl de femoral acostado', muscleGroup: 'piernas_femorales', isCustom: false },
  { id: 'pi005', name: 'Peso muerto rumano', muscleGroup: 'piernas_femorales', isCustom: false },

  // GLUTEOS
  { id: 'gl001', name: 'Hip thrust con barra', muscleGroup: 'gluteos', isCustom: false },
  { id: 'gl002', name: 'Patada de glúteo en polea', muscleGroup: 'gluteos', isCustom: false },
  { id: 'gl003', name: 'Puente de glúteo', muscleGroup: 'gluteos', isCustom: false },
  { id: 'gl004', name: 'Abducción en máquina', muscleGroup: 'gluteos', isCustom: false },
  { id: 'gl005', name: 'Hip thrust con mancuerna', muscleGroup: 'gluteos', isCustom: false },

  // ABDOMEN
  { id: 'ab001', name: 'Crunches en el suelo', muscleGroup: 'abdomen', isCustom: false },
  { id: 'ab002', name: 'Plancha (isométrica)', muscleGroup: 'abdomen', isCustom: false },
  { id: 'ab003', name: 'Elevación de piernas colgado', muscleGroup: 'abdomen', isCustom: false },
  { id: 'ab004', name: 'Rueda abdominal (ab roller)', muscleGroup: 'abdomen', isCustom: false },
  { id: 'ab005', name: 'Crunch en polea alta', muscleGroup: 'abdomen', isCustom: false },
  { id: 'ab006', name: 'Russian twist', muscleGroup: 'abdomen', isCustom: false },
  { id: 'ab007', name: 'Tijeras', muscleGroup: 'abdomen', isCustom: false },

  // CARDIO
  { id: 'ca001', name: 'Cinta de correr', muscleGroup: 'cardio', isCustom: false },
  { id: 'ca002', name: 'Bicicleta estática', muscleGroup: 'cardio', isCustom: false },
  { id: 'ca003', name: 'Elíptica', muscleGroup: 'cardio', isCustom: false },
  { id: 'ca004', name: 'Saltar la cuerda', muscleGroup: 'cardio', isCustom: false },
  { id: 'ca005', name: 'HIIT (alta intensidad)', muscleGroup: 'cardio', isCustom: false },
  { id: 'ca006', name: 'Remo ergómetro', muscleGroup: 'cardio', isCustom: false },
];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  piernas: 'Piernas',
  piernas_cuadriceps: 'Piernas (Cuádriceps)',
  piernas_femorales: 'Piernas (Femorales)',
  gluteos: 'Glúteos',
  abdomen: 'Abdomen',
  cardio: 'Cardio',
};

export const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  'pecho', 'espalda', 'hombros', 'biceps', 'triceps',
  'piernas_cuadriceps', 'piernas_femorales', 'piernas', 'gluteos', 'abdomen', 'cardio',
];

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  push: 'PUSH — Pecho / Hombros / Tríceps',
  pull: 'PULL — Espalda / Bíceps',
  legs: 'PIERNAS — Cuádriceps / Glúteos / Femoral',
  upper: 'TREN SUPERIOR',
  lower: 'TREN INFERIOR',
  full: 'FULL BODY',
  cardio: 'CARDIO',
  custom: 'PERSONALIZADO',
  brazos: 'BRAZOS — Bíceps / Tríceps',
  musculo_pecho: 'PECHO',
  musculo_espalda: 'ESPALDA',
  musculo_hombros: 'HOMBROS',
  musculo_biceps: 'BÍCEPS',
  musculo_triceps: 'TRÍCEPS',
  musculo_piernas: 'PIERNAS',
  musculo_piernas_cuadriceps: 'PIERNAS CUÁDRICEPS',
  musculo_piernas_femorales: 'PIERNAS FEMORALES',
  musculo_gluteos: 'GLÚTEOS',
  musculo_abdomen: 'ABDOMEN',
};

export const DAY_TYPE_COLORS: Record<DayType, string> = {
  push: '#ef4444',
  pull: '#3b82f6',
  legs: '#22c55e',
  upper: '#f59e0b',
  lower: '#8b5cf6',
  full: '#ec4899',
  cardio: '#06b6d4',
  custom: '#39ff14',
  brazos: '#a78bfa',
  musculo_pecho: '#ef4444',
  musculo_espalda: '#3b82f6',
  musculo_hombros: '#f59e0b',
  musculo_biceps: '#8b5cf6',
  musculo_triceps: '#ec4899',
  musculo_piernas: '#22c55e',
  musculo_piernas_cuadriceps: '#4ade80',
  musculo_piernas_femorales: '#86efac',
  musculo_gluteos: '#06b6d4',
  musculo_abdomen: '#39ff14',
};

export const DAY_TYPE_PRIMARY_MUSCLE: Record<DayType, MuscleGroup> = {
  push: 'pecho',
  pull: 'espalda',
  legs: 'piernas_cuadriceps',
  upper: 'pecho',
  lower: 'piernas_cuadriceps',
  full: 'pecho',
  cardio: 'cardio',
  custom: 'pecho',
  brazos: 'biceps',
  musculo_pecho: 'pecho',
  musculo_espalda: 'espalda',
  musculo_hombros: 'hombros',
  musculo_biceps: 'biceps',
  musculo_triceps: 'triceps',
  musculo_piernas: 'piernas',
  musculo_piernas_cuadriceps: 'piernas_cuadriceps',
  musculo_piernas_femorales: 'piernas_femorales',
  musculo_gluteos: 'gluteos',
  musculo_abdomen: 'abdomen',
};
