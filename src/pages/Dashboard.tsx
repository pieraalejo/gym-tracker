import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Calendar, Dumbbell, ChevronRight, Plus, Moon, Undo2, History } from 'lucide-react';
import BearAvatar from '../components/bear/BearAvatarV2';
import {
  useGymStore,
  getBearState,
  getDaysSinceLastWorkout,
  getCurrentStreak,
} from '../store/gymStore';
import { DAY_TYPE_LABELS } from '../data/exercises';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { BearState, Routine } from '../types';

const todayDateKey = (): string => new Date().toISOString().split('T')[0];

function yesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

const BEAR_MESSAGE: Record<BearState, { title: string; sub: string }> = {
  fresh:             { title: '¡ENTRENASTE HOY!', sub: 'El oso está en su máximo poder 💪' },
  happy:             { title: 'BUEN RITMO', sub: 'Ayer entrenaste, ¡seguí así!' },
  neutral:           { title: 'DESCANSANDO', sub: 'Hace 2-3 días que no entrenás' },
  sad:               { title: 'EL OSO ESTÁ TRISTE', sub: 'Hace 4+ días sin entrenar... volvé al gym!' },
  workout_pecho:     { title: 'DÍA DE PECHO', sub: 'El oso está presionando 🏋️' },
  workout_espalda:   { title: 'DÍA DE ESPALDA', sub: 'Tirando fuerte con la espalda 💪' },
  workout_hombros:   { title: 'DÍA DE HOMBROS', sub: 'Arriba ese press militar! 🏆' },
  workout_biceps:    { title: 'DÍA DE BÍCEPS', sub: 'Curlando con todo el corazón 💪' },
  workout_triceps:   { title: 'DÍA DE TRÍCEPS', sub: 'Extensiones al máximo! 🔥' },
  workout_piernas:   { title: 'DÍA DE PIERNAS', sub: 'Las sentadillas nunca mienten 🦵' },
  workout_abdomen:   { title: 'DÍA DE ABDOMEN', sub: 'Planchas y crunches, vamos! 🎯' },
  workout_cardio:    { title: 'CARDIO TIME', sub: 'El oso corre sin parar 🏃' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getDuration(start?: string, end?: string): string {
  if (!start || !end) return '';
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const workoutLogs = useGymStore((s) => s.workoutLogs);
  const routines = useGymStore((s) => s.routines);
  const activeWorkout = useGymStore((s) => s.activeWorkout);
  const userProfile = useGymStore((s) => s.userProfile);
  const restDays = useGymStore((s) => s.restDays);
  const toggleRestDay = useGymStore((s) => s.toggleRestDay);
  const startWorkout = useGymStore((s) => s.startWorkout);

  const [showPastModal, setShowPastModal] = useState(false);

  const today = todayDateKey();
  const isRestToday = restDays.includes(today);
  const trainedToday = workoutLogs.some((l) => l.date === today);

  const bearState = getBearState(workoutLogs, activeWorkout, routines, restDays);
  const days      = getDaysSinceLastWorkout(workoutLogs);
  const streak    = getCurrentStreak(workoutLogs, restDays);
  const msg       = isRestToday && !activeWorkout
    ? { title: 'DÍA DE DESCANSO', sub: 'El oso recupera fuerzas 😴 La racha sigue en pie' }
    : BEAR_MESSAGE[bearState];

  const recentLogs = [...workoutLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'BUENOS DÍAS' : hour < 19 ? 'BUENAS TARDES' : 'BUENAS NOCHES';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <p className="text-textMuted text-xs font-pixel" style={{ fontSize: '8px' }}>
            {greeting}
          </p>
          <h1 className="font-pixel text-accent mt-1" style={{ fontSize: '14px' }}>
            {userProfile?.name ? userProfile.name.toUpperCase() : 'GYM TRACKER'}
          </h1>
        </div>
        <div className="flex items-center gap-1 bg-surface2 px-3 py-1.5 rounded-full border border-border">
          <Flame size={14} className="text-warning" />
          <span className="font-pixel text-textPrimary" style={{ fontSize: '10px' }}>
            {streak}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Bear section */}
        <div
          className={`card flex flex-col items-center py-6 relative overflow-hidden ${
            bearState === 'fresh' ? 'neon-border' : ''
          }`}
        >
          {bearState === 'fresh' && (
            <div className="absolute inset-0 bg-accent opacity-5 pointer-events-none" />
          )}
          {bearState === 'sad' && (
            <div className="absolute inset-0 bg-blue-900 opacity-10 pointer-events-none" />
          )}

          <BearAvatar state={bearState} size={110} className={bearState === 'neutral' ? 'bear-idle' : ''} />

          <div className="mt-4 text-center">
            <p className="font-pixel text-accent" style={{ fontSize: '11px' }}>
              {msg.title}
            </p>
            <p className="text-textMuted text-sm mt-1">{msg.sub}</p>
          </div>

          {days !== null && !activeWorkout && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-textMuted">
              <Calendar size={12} />
              {days === 0
                ? 'Entrenaste hoy'
                : days === 1
                ? 'Último entreno: ayer'
                : `Último entreno: hace ${days} días`}
            </div>
          )}

          {!activeWorkout && !trainedToday && (
            isRestToday ? (
              <button
                onClick={() => toggleRestDay(today)}
                className="mt-4 bg-surface2 text-textPrimary border border-border font-pixel px-5 py-2 rounded-lg text-xs flex items-center gap-2 active:scale-95 transition-transform"
                style={{ fontSize: '9px' }}
              >
                <Undo2 size={14} />
                DESHACER DESCANSO
              </button>
            ) : (
              <button
                onClick={() => toggleRestDay(today)}
                className="mt-4 bg-surface2 text-textPrimary border border-border font-pixel px-5 py-2 rounded-lg text-xs flex items-center gap-2 active:scale-95 transition-transform hover:border-accent/60"
                style={{ fontSize: '9px' }}
              >
                <Moon size={14} className="text-accent" />
                MARCAR HOY COMO DESCANSO
              </button>
            )
          )}

          {activeWorkout && (
            <button
              onClick={() => navigate('/entrenar')}
              className="mt-4 bg-accent text-background font-pixel px-6 py-2 rounded-lg text-xs flex items-center gap-2 active:scale-95 transition-transform"
              style={{ fontSize: '9px' }}
            >
              <Dumbbell size={14} />
              CONTINUAR SESIÓN
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="RACHA"
            value={streak.toString()}
            sub="días"
            color="#39ff14"
          />
          <StatCard
            label="TOTAL"
            value={workoutLogs.length.toString()}
            sub="entrenos"
            color="#f59e0b"
          />
          <StatCard
            label="RUTINAS"
            value={routines.length.toString()}
            sub="creadas"
            color="#3b82f6"
          />
        </div>

        {/* Quick actions */}
        {!activeWorkout && (
          <div>
            <p className="font-pixel text-textMuted mb-3" style={{ fontSize: '9px' }}>
              ACCIÓN RÁPIDA
            </p>
            {routines.length === 0 ? (
              <button
                onClick={() => navigate('/rutinas')}
                className="card w-full flex items-center justify-between border-dashed border-accent/40 hover:border-accent/80 transition-colors active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Plus size={20} className="text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="text-textPrimary font-medium text-sm">Crear primera rutina</p>
                    <p className="text-textMuted text-xs">Empezá a registrar tus entrenos</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-textMuted" />
              </button>
            ) : (
              <div className="space-y-2">
                {routines.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate('/entrenar', { state: { routineId: r.id } })}
                    className="card w-full flex items-center justify-between active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-10 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <div className="text-left">
                        <p className="text-textPrimary font-semibold text-sm">{r.name}</p>
                        <p className="text-textMuted text-xs">
                          {r.exercises.length} ejercicios · {DAY_TYPE_LABELS[r.dayType].split('—')[0].trim()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dumbbell size={14} className="text-accent" />
                      <ChevronRight size={18} className="text-textMuted" />
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => setShowPastModal(true)}
                  className="card w-full flex items-center justify-between border-dashed border-warning/40 active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                      <History size={18} className="text-warning" />
                    </div>
                    <div className="text-left">
                      <p className="text-textPrimary font-semibold text-sm">Registrar entreno pasado</p>
                      <p className="text-textMuted text-xs">¿Te olvidaste de marcar uno?</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-textMuted" />
                </button>
              </div>
            )}
          </div>
        )}

        {showPastModal && (
          <PastWorkoutModal
            routines={routines}
            onClose={() => setShowPastModal(false)}
            onConfirm={(routineId, date) => {
              const routine = routines.find((r) => r.id === routineId);
              if (!routine) return;
              const exs = routine.exercises.map((re) => ({
                exerciseId: re.exerciseId,
                skipped: false,
                notes: '',
                sets: Array.from({ length: re.targetSets }, (_, i) => ({
                  setNumber: i + 1,
                  reps: re.targetReps,
                  weight: re.targetWeight,
                  completed: true, // pre-marcadas: ya las hiciste
                })),
              }));
              startWorkout(routineId, exs, { forDate: date });
              setShowPastModal(false);
              navigate('/entrenar');
            }}
          />
        )}

        {/* Recent workouts */}
        {recentLogs.length > 0 && (
          <div>
            <p className="font-pixel text-textMuted mb-3" style={{ fontSize: '9px' }}>
              HISTORIAL RECIENTE
            </p>
            <div className="space-y-2">
              {recentLogs.map((log) => {
                const routine = routines.find((r) => r.id === log.routineId);
                const totalSets = log.exercises.reduce((s, e) => s + e.sets.filter((st) => st.completed).length, 0);
                const duration = getDuration(log.startTime, log.endTime);
                return (
                  <div key={log.id} className="card flex items-center gap-3">
                    <div
                      className="w-2 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: routine?.color ?? '#39ff14' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-textPrimary font-semibold text-sm truncate">
                        {routine?.name ?? 'Entreno'}
                      </p>
                      <p className="text-textMuted text-xs mt-0.5">
                        {formatDate(log.date)}
                        {duration && ` · ${duration}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-accent font-pixel" style={{ fontSize: '12px' }}>
                        {totalSets}
                      </p>
                      <p className="text-textMuted text-xs">series</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="card flex flex-col items-center py-3 gap-1">
      <p className="font-pixel" style={{ fontSize: '18px', color }}>
        {value}
      </p>
      <p className="text-textMuted text-xs">{sub}</p>
      <p className="font-pixel text-textMuted" style={{ fontSize: '7px' }}>
        {label}
      </p>
    </div>
  );
}

// ─── PastWorkoutModal ─────────────────────────────────────────────────────────
interface PastWorkoutModalProps {
  routines: Routine[];
  onClose: () => void;
  onConfirm: (routineId: string, date: string) => void;
}

function PastWorkoutModal({ routines, onClose, onConfirm }: PastWorkoutModalProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  const [date, setDate] = useState(yesterdayDateKey());
  const [routineId, setRoutineId] = useState(routines[0]?.id ?? '');

  const today = todayDateKey();
  const isFuture = date > today;
  const canConfirm = !!routineId && !isFuture;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="past-workout-title"
    >
      <div
        ref={panelRef}
        className="bg-surface border-t border-border rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="past-workout-title" className="font-pixel text-accent text-center" style={{ fontSize: '11px' }}>
          REGISTRAR ENTRENO PASADO
        </p>
        <p className="text-textMuted text-xs text-center">
          Vas a poder editar pesos, reps y ejercicios antes de guardar
        </p>

        <div>
          <label htmlFor="past-date" className="text-xs text-textMuted mb-1 block">
            Fecha del entreno
          </label>
          <input
            id="past-date"
            type="date"
            className="input-base"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {isFuture && (
            <p className="text-danger text-xs mt-1">No podés registrar un entreno en el futuro</p>
          )}
        </div>

        <div>
          <label htmlFor="past-routine" className="text-xs text-textMuted mb-1 block">
            ¿Qué rutina hiciste?
          </label>
          <select
            id="past-routine"
            className="input-base"
            value={routineId}
            onChange={(e) => setRoutineId(e.target.value)}
          >
            {routines.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {DAY_TYPE_LABELS[r.dayType].split('—')[0].trim()}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onConfirm(routineId, date)}
          disabled={!canConfirm}
          className="w-full bg-accent text-background font-pixel py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
          style={{ fontSize: '10px' }}
        >
          CONTINUAR →
        </button>
        <button onClick={onClose} className="w-full text-textMuted text-xs py-2">
          Cancelar
        </button>
      </div>
    </div>
  );
}
