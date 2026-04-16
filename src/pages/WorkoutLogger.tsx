import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check, X, Plus, Minus, ChevronDown, ChevronUp, Dumbbell, Flag, MessageSquare, Shuffle,
} from 'lucide-react';
import { useGymStore } from '../store/gymStore';
import {
  DEFAULT_EXERCISES,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_ORDER,
} from '../data/exercises';
import { RestTimer } from '../components/RestTimer';
import type { SetLog, MuscleGroup } from '../types';

type Phase = 'select' | 'workout' | 'complete';

const MOOD_LABELS = ['😴', '😕', '😐', '💪', '🔥'];

export default function WorkoutLogger() {
  const navigate = useNavigate();
  const location = useLocation();
  void location;

  const {
    routines, exercises, activeWorkout,
    startWorkout, updateActiveSet, updateActiveExercise,
    addSetToActiveExercise, removeSetFromActiveExercise,
    addExerciseToActiveWorkout, swapActiveExercise,
    finishWorkout, cancelWorkout,
    restTimerDuration,
  } = useGymStore();

  const allExercises = [...DEFAULT_EXERCISES, ...exercises.filter((e) => e.isCustom)];

  const [phase, setPhase] = useState<Phase>(activeWorkout ? 'workout' : 'select');
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [elapsed, setElapsed] = useState('');
  const [showRestTimer, setShowRestTimer] = useState(false);

  // Swap alternatives modal
  const [swapForExId, setSwapForExId] = useState<string | null>(null);

  // Extra exercise modal
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraMuscle, setExtraMuscle] = useState<MuscleGroup>('pecho');
  const [extraExercise, setExtraExercise] = useState('');
  const [extraSets, setExtraSets] = useState('3');
  const [extraReps, setExtraReps] = useState('12');
  const [extraWeight, setExtraWeight] = useState('0');

  useEffect(() => {
    if (activeWorkout) setPhase('workout');
  }, [activeWorkout]);

  // Timer
  useEffect(() => {
    if (phase !== 'workout' || !activeWorkout) return;
    const update = () => {
      const start = new Date(activeWorkout.startTime).getTime();
      const diff  = Date.now() - start;
      const mins  = Math.floor(diff / 60000);
      const secs  = Math.floor((diff % 60000) / 1000);
      setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [phase, activeWorkout]);

  function getExName(id: string) {
    return allExercises.find((e) => e.id === id)?.name ?? id;
  }

  function handleSelectRoutine(routineId: string) {
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
        completed: false,
      })),
    }));
    startWorkout(routineId, exs);
    setPhase('workout');
    setExpandedEx(exs[0]?.exerciseId ?? null);
  }

  function handleFinish() {
    finishWorkout(notes, mood);
    navigate('/');
  }

  function handleCancel() {
    if (confirm('¿Cancelar el entreno? Se perderá el progreso.')) {
      cancelWorkout();
      setPhase('select');
    }
  }

  function handleSetToggle(exerciseId: string, set: SetLog) {
    const newCompleted = !set.completed;
    updateActiveSet(exerciseId, set.setNumber, { completed: newCompleted });
    if (newCompleted && restTimerDuration > 0) {
      setShowRestTimer(true);
    }
  }

  function handleAddExtra() {
    if (!extraExercise) return;
    addExerciseToActiveWorkout(
      extraExercise,
      parseInt(extraSets) || 3,
      parseInt(extraReps) || 12,
      parseFloat(extraWeight) || 0,
    );
    setShowExtraModal(false);
    setExtraExercise('');
    setExtraSets('3');
    setExtraReps('12');
    setExtraWeight('0');
  }

  // Datos de alternativas del ejercicio actual (desde la rutina)
  function getAlternatives(exerciseId: string): string[] {
    if (!activeWorkout) return [];
    const routine = routines.find((r) => r.id === activeWorkout.routineId);
    if (!routine) return [];
    const re = routine.exercises.find((e) => e.exerciseId === exerciseId);
    // También buscar si el ejercicio activo es una alternativa del slot original
    if (re) return re.alternatives ?? [];
    // Si el ejerciseId fue swapeado, buscar el slot original
    for (const slot of routine.exercises) {
      if ((slot.alternatives ?? []).includes(exerciseId)) {
        const others = [slot.exerciseId, ...(slot.alternatives ?? []).filter((a) => a !== exerciseId)];
        return others;
      }
    }
    return [];
  }

  // Ejercicios extra filtrados (no están ya en el workout)
  const extraFiltered = allExercises.filter(
    (e) => e.muscleGroup === extraMuscle &&
      !activeWorkout?.exercises.some((ae) => ae.exerciseId === e.id)
  );

  // ── SELECT PHASE ──────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-background">
        <div className="page-header">
          <h1 className="font-pixel text-accent" style={{ fontSize: '13px' }}>
            ENTRENAR
          </h1>
        </div>

        <div className="px-4 py-4 space-y-4">
          {routines.length === 0 ? (
            <div className="card flex flex-col items-center py-12 gap-4 text-center">
              <Dumbbell size={48} className="text-textMuted" />
              <div>
                <p className="font-pixel text-textMuted" style={{ fontSize: '10px' }}>
                  SIN RUTINAS
                </p>
                <p className="text-textMuted text-sm mt-2">
                  Primero creá una rutina desde la sección RUTINAS
                </p>
              </div>
              <button
                onClick={() => navigate('/rutinas')}
                className="bg-accent text-background font-pixel px-5 py-2 rounded-lg active:scale-95 transition-transform"
                style={{ fontSize: '9px' }}
              >
                IR A RUTINAS
              </button>
            </div>
          ) : (
            <>
              <p className="text-textMuted text-sm">Elegí la rutina de hoy:</p>
              <div className="space-y-3">
                {routines.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRoutine(r.id)}
                    className="card w-full text-left flex items-center gap-4 active:scale-95 transition-transform"
                    style={{ borderLeft: `4px solid ${r.color}` }}
                  >
                    <div className="flex-1">
                      <p className="text-textPrimary font-semibold">{r.name}</p>
                      <p className="text-textMuted text-xs mt-0.5">
                        {r.exercises.length} ejercicios
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.exercises.slice(0, 4).map((re) => (
                          <span
                            key={re.exerciseId}
                            className="text-xs bg-surface2 text-textMuted px-2 py-0.5 rounded"
                          >
                            {getExName(re.exerciseId).split(' ').slice(0, 2).join(' ')}
                          </span>
                        ))}
                        {r.exercises.length > 4 && (
                          <span className="text-xs text-textMuted">
                            +{r.exercises.length - 4} más
                          </span>
                        )}
                      </div>
                    </div>
                    <Dumbbell size={20} className="text-accent flex-shrink-0" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── COMPLETE PHASE ────────────────────────────────────────────────────────
  if (phase === 'complete') {
    const totalSets = activeWorkout?.exercises.reduce(
      (s, e) => s + e.sets.filter((st) => st.completed).length, 0
    ) ?? 0;

    return (
      <div className="min-h-screen bg-background">
        <div className="page-header">
          <h1 className="font-pixel text-accent" style={{ fontSize: '13px' }}>
            FINALIZAR
          </h1>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div className="card text-center py-6">
            <p className="text-5xl mb-3">🏆</p>
            <p className="font-pixel text-accent" style={{ fontSize: '14px' }}>
              ¡SESIÓN COMPLETADA!
            </p>
            <p className="text-textMuted text-sm mt-2">
              {totalSets} series · {elapsed}
            </p>
          </div>

          {/* Mood */}
          <div className="card">
            <p className="font-pixel text-textMuted mb-3" style={{ fontSize: '8px' }}>
              ¿CÓMO TE SENTISTE?
            </p>
            <div className="flex justify-around">
              {MOOD_LABELS.map((label, i) => {
                const val = (i + 1) as 1 | 2 | 3 | 4 | 5;
                return (
                  <button
                    key={val}
                    onClick={() => setMood(val)}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      mood === val ? 'bg-accent/20 scale-125' : 'opacity-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <p className="font-pixel text-textMuted mb-2" style={{ fontSize: '8px' }}>
              NOTAS DE LA SESIÓN
            </p>
            <textarea
              className="input-base resize-none"
              rows={3}
              placeholder="¿Cómo fue el entreno? ¿Algo que destacar?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            onClick={handleFinish}
            className="w-full bg-accent text-background font-pixel py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ fontSize: '11px' }}
          >
            <Flag size={16} />
            GUARDAR SESIÓN
          </button>

          <button
            onClick={() => setPhase('workout')}
            className="w-full text-textMuted text-sm py-2"
          >
            ← Volver al entreno
          </button>
        </div>
      </div>
    );
  }

  // ── WORKOUT PHASE ─────────────────────────────────────────────────────────
  if (!activeWorkout) return null;

  const activeRoutine = routines.find((r) => r.id === activeWorkout.routineId);
  const totalCompleted = activeWorkout.exercises.reduce(
    (s, e) => s + e.sets.filter((st) => st.completed).length, 0
  );
  const totalSets = activeWorkout.exercises.reduce((s, e) => s + e.sets.length, 0);
  const progress = totalSets > 0 ? totalCompleted / totalSets : 0;

  return (
    <div className="min-h-screen bg-background">
      {showRestTimer && (
        <RestTimer
          duration={restTimerDuration}
          onClose={() => setShowRestTimer(false)}
        />
      )}

      {/* Modal de swap alternativas */}
      {swapForExId && (() => {
        const alts = getAlternatives(swapForExId);
        return (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            onClick={() => setSwapForExId(null)}
          >
            <div
              className="bg-surface border-t border-border rounded-t-2xl p-5 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-pixel text-accent text-center" style={{ fontSize: '10px' }}>
                CAMBIAR EJERCICIO
              </p>
              <p className="text-textMuted text-xs text-center mb-2">
                Elegí qué hiciste hoy
              </p>

              {/* Opción actual */}
              <button
                onClick={() => setSwapForExId(null)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-accent bg-accent/10 text-accent text-sm"
              >
                <span>{getExName(swapForExId)}</span>
                <Check size={16} />
              </button>

              {/* Alternativas */}
              {alts.map((altId) => (
                <button
                  key={altId}
                  onClick={() => {
                    swapActiveExercise(swapForExId, altId);
                    setSwapForExId(null);
                    if (expandedEx === swapForExId) setExpandedEx(altId);
                  }}
                  className="w-full flex items-center p-3 rounded-xl border border-border bg-surface2 text-textPrimary text-sm text-left"
                >
                  <Shuffle size={14} className="text-accent mr-2 flex-shrink-0" />
                  {getExName(altId)}
                </button>
              ))}

              <button
                onClick={() => setSwapForExId(null)}
                className="w-full text-textMuted text-xs py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        );
      })()}

      {/* Modal de ejercicio extra */}
      {showExtraModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setShowExtraModal(false)}
        >
          <div
            className="bg-surface border-t border-border rounded-t-2xl p-5 space-y-3 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-pixel text-accent text-center" style={{ fontSize: '10px' }}>
              EJERCICIO EXTRA
            </p>
            <p className="text-textMuted text-xs text-center">
              Se suma a esta sesión sin modificar tu rutina
            </p>

            <div>
              <label className="text-xs text-textMuted mb-1 block">Grupo muscular</label>
              <select
                className="input-base"
                value={extraMuscle}
                onChange={(e) => {
                  setExtraMuscle(e.target.value as MuscleGroup);
                  setExtraExercise('');
                }}
              >
                {MUSCLE_GROUP_ORDER.map((mg) => (
                  <option key={mg} value={mg}>{MUSCLE_GROUP_LABELS[mg]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-textMuted mb-1 block">Ejercicio</label>
              <select
                className="input-base"
                value={extraExercise}
                onChange={(e) => setExtraExercise(e.target.value)}
              >
                <option value="">— Seleccioná un ejercicio —</option>
                {extraFiltered.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-textMuted mb-1 block">Series</label>
                <input
                  type="number" min="1" max="20"
                  className="input-base text-center"
                  value={extraSets}
                  onChange={(e) => setExtraSets(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-textMuted mb-1 block">Reps</label>
                <input
                  type="number" min="1" max="100"
                  className="input-base text-center"
                  value={extraReps}
                  onChange={(e) => setExtraReps(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-textMuted mb-1 block">Peso (kg)</label>
                <input
                  type="number" min="0" step="0.5"
                  className="input-base text-center"
                  value={extraWeight}
                  onChange={(e) => setExtraWeight(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleAddExtra}
              disabled={!extraExercise}
              className="w-full bg-accent text-background font-pixel py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-transform"
              style={{ fontSize: '9px' }}
            >
              <Plus size={14} />
              AGREGAR A LA SESIÓN
            </button>
            <button
              onClick={() => setShowExtraModal(false)}
              className="w-full text-textMuted text-xs py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-accent" style={{ fontSize: '11px' }}>
              {activeRoutine?.name ?? 'ENTRENANDO'}
            </h1>
            <p className="text-textMuted text-xs mt-0.5">⏱ {elapsed}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="p-2 text-textMuted hover:text-danger transition-colors"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => setPhase('complete')}
              className="bg-accent text-background font-pixel px-3 py-2 rounded-lg active:scale-95 transition-transform"
              style={{ fontSize: '8px' }}
            >
              TERMINAR
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-textMuted text-xs mt-1">
          {totalCompleted} / {totalSets} series completadas
        </p>
      </div>

      {/* Exercises */}
      <div className="px-4 py-3 space-y-3">
        {activeWorkout.exercises.map((exLog, exIdx) => {
          const routine = activeRoutine?.exercises.find((re) => re.exerciseId === exLog.exerciseId);
          const isExpanded = expandedEx === exLog.exerciseId;
          const completedSets = exLog.sets.filter((s) => s.completed).length;
          const totalEx = exLog.sets.length;
          const isAllDone = completedSets === totalEx && totalEx > 0;
          const alternatives = getAlternatives(exLog.exerciseId);
          const hasAlts = alternatives.length > 0;

          return (
            <div
              key={exLog.exerciseId}
              className={`card transition-all ${exLog.skipped ? 'opacity-50' : ''} ${
                isAllDone ? 'border-accent/40' : ''
              } ${exLog.isExtra ? 'border-dashed border-accent/30' : ''}`}
            >
              {/* Exercise header */}
              <button
                className="w-full flex items-center gap-3"
                onClick={() => setExpandedEx(isExpanded ? null : exLog.exerciseId)}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-pixel text-xs ${
                    isAllDone ? 'bg-accent text-background' : 'bg-surface2 text-textMuted'
                  }`}
                  style={{ fontSize: '10px' }}
                >
                  {isAllDone ? <Check size={14} /> : exIdx + 1}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-textPrimary font-medium text-sm">
                      {getExName(exLog.exerciseId)}
                    </p>
                    {exLog.isExtra && (
                      <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded font-pixel" style={{ fontSize: '7px' }}>
                        EXTRA
                      </span>
                    )}
                  </div>
                  <p className="text-textMuted text-xs">
                    {completedSets}/{totalEx} series
                    {routine && ` · objetivo: ${routine.targetReps} reps`}
                    {routine?.targetWeight && routine.targetWeight > 0 && ` @ ${routine.targetWeight}kg`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {/* Botón swap si tiene alternativas */}
                  {hasAlts && !exLog.isExtra && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSwapForExId(exLog.exerciseId);
                      }}
                      className="p-1.5 text-accent/70 hover:text-accent transition-colors"
                      title="Cambiar por alternativa"
                    >
                      <Shuffle size={15} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateActiveExercise(exLog.exerciseId, { skipped: !exLog.skipped });
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      exLog.skipped
                        ? 'bg-warning/20 text-warning'
                        : 'bg-surface2 text-textMuted'
                    }`}
                  >
                    {exLog.skipped ? 'SALTADO' : 'SALTAR'}
                  </button>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-textMuted" />
                  ) : (
                    <ChevronDown size={16} className="text-textMuted" />
                  )}
                </div>
              </button>

              {/* Sets */}
              {isExpanded && !exLog.skipped && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-[28px_1fr_1fr_36px_28px] gap-1.5 text-center">
                    <span className="text-textMuted text-xs">SET</span>
                    <span className="text-textMuted text-xs">REPS</span>
                    <span className="text-textMuted text-xs">KG</span>
                    <span className="text-textMuted text-xs">✓</span>
                    <span className="text-textMuted text-xs"><MessageSquare size={11} className="mx-auto" /></span>
                  </div>

                  {exLog.sets.map((s) => (
                    <SetRow
                      key={s.setNumber}
                      set={s}
                      onRepsChange={(v) =>
                        updateActiveSet(exLog.exerciseId, s.setNumber, { reps: v })
                      }
                      onWeightChange={(v) =>
                        updateActiveSet(exLog.exerciseId, s.setNumber, { weight: v })
                      }
                      onToggle={() => handleSetToggle(exLog.exerciseId, s)}
                      onNotesChange={(notes) =>
                        updateActiveSet(exLog.exerciseId, s.setNumber, { notes })
                      }
                      onRemove={
                        exLog.sets.length > 1
                          ? () => removeSetFromActiveExercise(exLog.exerciseId, s.setNumber)
                          : undefined
                      }
                    />
                  ))}

                  {/* Add set */}
                  <button
                    onClick={() => addSetToActiveExercise(exLog.exerciseId)}
                    className="w-full text-accent text-xs flex items-center justify-center gap-1 py-2 border border-dashed border-accent/30 rounded-lg mt-1"
                  >
                    <Plus size={13} />
                    Agregar serie
                  </button>

                  {/* Exercise notes */}
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5 text-textMuted text-xs mb-1">
                      <MessageSquare size={12} />
                      Nota del ejercicio
                    </div>
                    <input
                      className="input-base text-sm py-2"
                      placeholder="Ej: bajé el peso, rodilla molestó..."
                      value={exLog.notes}
                      onChange={(e) =>
                        updateActiveExercise(exLog.exerciseId, { notes: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Botón ejercicio extra */}
        <button
          onClick={() => setShowExtraModal(true)}
          className="w-full text-accent text-xs flex items-center justify-center gap-1.5 py-3 border border-dashed border-accent/30 rounded-xl mt-1"
        >
          <Plus size={14} />
          <span className="font-pixel" style={{ fontSize: '9px' }}>AGREGAR EJERCICIO EXTRA</span>
        </button>

        {/* Finish button */}
        <button
          onClick={() => setPhase('complete')}
          className="w-full bg-accent text-background font-pixel py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform mt-2"
          style={{ fontSize: '11px' }}
        >
          <Flag size={16} />
          TERMINAR SESIÓN
        </button>
      </div>
    </div>
  );
}

// ─── SetRow component ─────────────────────────────────────────────────────────
interface SetRowProps {
  set: SetLog;
  onRepsChange: (v: number) => void;
  onWeightChange: (v: number) => void;
  onToggle: () => void;
  onNotesChange: (notes: string) => void;
  onRemove?: () => void;
}

function SetRow({ set, onRepsChange, onWeightChange, onToggle, onNotesChange, onRemove }: SetRowProps) {
  const [showNote, setShowNote] = useState(!!set.notes);
  const [repsStr, setRepsStr] = useState(set.reps === 0 ? '' : String(set.reps));
  const [weightStr, setWeightStr] = useState(set.weight === 0 ? '' : String(set.weight));
  const prevReps = useRef(set.reps);
  const prevWeight = useRef(set.weight);

  useEffect(() => {
    if (set.reps !== prevReps.current) {
      setRepsStr(set.reps === 0 ? '' : String(set.reps));
      prevReps.current = set.reps;
    }
  }, [set.reps]);

  useEffect(() => {
    if (set.weight !== prevWeight.current) {
      setWeightStr(set.weight === 0 ? '' : String(set.weight));
      prevWeight.current = set.weight;
    }
  }, [set.weight]);

  return (
    <div>
      <div
        className={`grid grid-cols-[28px_1fr_1fr_36px_28px] gap-1.5 items-center transition-all ${
          set.completed ? 'opacity-70' : ''
        }`}
      >
        {/* Set number / remove */}
        <div className="text-center">
          {onRemove ? (
            <button onClick={onRemove} className="text-textMuted hover:text-danger transition-colors">
              <Minus size={14} />
            </button>
          ) : (
            <span className="text-textMuted text-xs">{set.setNumber}</span>
          )}
        </div>

        {/* Reps */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={`input-base text-center py-2 text-sm ${
            set.completed ? 'border-accent/60 text-accent' : ''
          }`}
          value={repsStr}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            setRepsStr(raw);
            prevReps.current = raw === '' ? 0 : parseInt(raw);
            onRepsChange(raw === '' ? 0 : parseInt(raw));
          }}
        />

        {/* Weight */}
        <input
          type="text"
          inputMode="decimal"
          className={`input-base text-center py-2 text-sm ${
            set.completed ? 'border-accent/60 text-accent' : ''
          }`}
          value={weightStr}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '');
            setWeightStr(raw);
            const num = raw === '' ? 0 : parseFloat(raw) || 0;
            prevWeight.current = num;
            onWeightChange(num);
          }}
        />

        {/* Complete toggle */}
        <button
          onClick={onToggle}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
            set.completed
              ? 'bg-accent text-background'
              : 'bg-surface2 border border-border text-textMuted'
          }`}
        >
          <Check size={14} />
        </button>

        {/* Note toggle */}
        <button
          onClick={() => setShowNote((v) => !v)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
            set.notes ? 'text-accent' : 'text-textMuted hover:text-textPrimary'
          }`}
        >
          <MessageSquare size={13} />
        </button>
      </div>

      {/* Inline note */}
      {showNote && (
        <input
          className="input-base text-xs py-1.5 mt-1"
          placeholder="Nota del set (ej: mala forma, subí peso)..."
          value={set.notes ?? ''}
          onChange={(e) => onNotesChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}
