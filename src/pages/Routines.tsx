import { useState } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Edit2, X, Check,
} from 'lucide-react';
import { useGymStore } from '../store/gymStore';
import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_ORDER,
  DAY_TYPE_LABELS,
  DAY_TYPE_COLORS,
  DEFAULT_EXERCISES,
} from '../data/exercises';
import type { DayType, MuscleGroup, RoutineExercise } from '../types';

type View = 'list' | 'create' | 'edit';

interface RoutineForm {
  name: string;
  dayType: DayType;
  exercises: RoutineExercise[];
}

const EMPTY_FORM: RoutineForm = {
  name: '',
  dayType: 'push',
  exercises: [],
};

export default function Routines() {
  const { routines, exercises, addRoutine, updateRoutine, deleteRoutine } = useGymStore();

  const [view, setView] = useState<View>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoutineForm>(EMPTY_FORM);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);

  // Exercise picker state
  const [pickMuscle, setPickMuscle] = useState<MuscleGroup>('pecho');
  const [pickExercise, setPickExercise] = useState<string>('');
  const [pickSets, setPickSets] = useState('3');
  const [pickReps, setPickReps] = useState('12');
  const [pickWeight, setPickWeight] = useState('0');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customExName, setCustomExName] = useState('');

  // All exercises (default + custom)
  const allExercises = [...DEFAULT_EXERCISES, ...exercises.filter((e) => e.isCustom)];
  const filteredExercises = allExercises.filter((e) => e.muscleGroup === pickMuscle);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setView('create');
  }

  function openEdit(id: string) {
    const r = routines.find((r) => r.id === id);
    if (!r) return;
    setForm({ name: r.name, dayType: r.dayType, exercises: [...r.exercises] });
    setEditingId(id);
    setView('edit');
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const color = DAY_TYPE_COLORS[form.dayType];
    if (editingId) {
      updateRoutine(editingId, { ...form, color });
    } else {
      addRoutine({ ...form, color });
    }
    setView('list');
  }

  function addExerciseToForm() {
    if (!pickExercise && !showCustomInput) return;
    if (showCustomInput && !customExName.trim()) return;

    let exId = pickExercise;

    if (showCustomInput && customExName.trim()) {
      // Add custom exercise to store and use its id
      const { addExercise } = useGymStore.getState();
      addExercise({ name: customExName.trim(), muscleGroup: pickMuscle });
      // We'll get the id from the store after the add
      const updated = useGymStore.getState().exercises;
      const newEx = updated[updated.length - 1];
      exId = newEx.id;
      setCustomExName('');
      setShowCustomInput(false);
    }

    if (!exId) return;

    const alreadyIn = form.exercises.find((e) => e.exerciseId === exId);
    if (alreadyIn) return;

    setForm((f) => ({
      ...f,
      exercises: [
        ...f.exercises,
        {
          exerciseId: exId,
          targetSets: parseInt(pickSets) || 3,
          targetReps: parseInt(pickReps) || 12,
          targetWeight: parseFloat(pickWeight) || 0,
        },
      ],
    }));
    setPickExercise('');
  }

  function removeExerciseFromForm(exerciseId: string) {
    setForm((f) => ({
      ...f,
      exercises: f.exercises.filter((e) => e.exerciseId !== exerciseId),
    }));
  }

  function updateExerciseInForm(exerciseId: string, field: keyof RoutineExercise, value: number) {
    setForm((f) => ({
      ...f,
      exercises: f.exercises.map((e) =>
        e.exerciseId === exerciseId ? { ...e, [field]: value } : e
      ),
    }));
  }

  function getExName(id: string) {
    return allExercises.find((e) => e.id === id)?.name ?? id;
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-background">
        <div className="page-header flex items-center justify-between">
          <h1 className="font-pixel text-accent" style={{ fontSize: '13px' }}>
            MIS RUTINAS
          </h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-accent text-background px-3 py-2 rounded-lg font-pixel active:scale-95 transition-transform"
            style={{ fontSize: '9px' }}
          >
            <Plus size={14} />
            NUEVA
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          {routines.length === 0 ? (
            <div className="card flex flex-col items-center py-12 gap-4">
              <div className="text-6xl">📋</div>
              <div className="text-center">
                <p className="font-pixel text-textMuted" style={{ fontSize: '10px' }}>
                  SIN RUTINAS
                </p>
                <p className="text-textMuted text-sm mt-2">
                  Creá tu primera rutina para empezar a entrenar
                </p>
              </div>
              <button
                onClick={openCreate}
                className="bg-accent text-background font-pixel px-5 py-2 rounded-lg active:scale-95 transition-transform"
                style={{ fontSize: '9px' }}
              >
                CREAR RUTINA
              </button>
            </div>
          ) : (
            routines.map((r) => {
              const isExpanded = expandedRoutine === r.id;
              return (
                <div key={r.id} className="card overflow-hidden">
                  <div
                    className="w-full flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedRoutine(isExpanded ? null : r.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedRoutine(isExpanded ? null : r.id)}
                  >
                    <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                    <div className="flex-1 text-left">
                      <p className="text-textPrimary font-semibold">{r.name}</p>
                      <p className="text-textMuted text-xs mt-0.5">
                        {r.exercises.length} ejercicios ·{' '}
                        <span style={{ color: r.color }}>
                          {DAY_TYPE_LABELS[r.dayType].split('—')[0].trim()}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(r.id); }}
                        className="p-1.5 text-textMuted hover:text-accent transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar "${r.name}"?`)) deleteRoutine(r.id);
                        }}
                        className="p-1.5 text-textMuted hover:text-danger transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      {isExpanded ? <ChevronUp size={16} className="text-textMuted" /> : <ChevronDown size={16} className="text-textMuted" />}
                    </div>
                  </div>

                  {isExpanded && r.exercises.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {r.exercises.map((re, idx) => (
                        <div key={re.exerciseId} className="flex items-center gap-2 text-sm">
                          <span className="text-textMuted text-xs w-5">{idx + 1}.</span>
                          <span className="flex-1 text-textPrimary truncate">{getExName(re.exerciseId)}</span>
                          <span className="text-textMuted text-xs whitespace-nowrap">
                            {re.targetSets}×{re.targetReps}
                            {re.targetWeight > 0 && ` @ ${re.targetWeight}kg`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── CREATE / EDIT VIEW ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="page-header flex items-center justify-between">
        <button onClick={() => setView('list')} className="p-1 text-textMuted">
          <X size={20} />
        </button>
        <h1 className="font-pixel text-accent" style={{ fontSize: '11px' }}>
          {view === 'edit' ? 'EDITAR RUTINA' : 'NUEVA RUTINA'}
        </h1>
        <button
          onClick={handleSave}
          disabled={!form.name.trim()}
          className="flex items-center gap-1 bg-accent text-background px-3 py-1.5 rounded-lg font-pixel disabled:opacity-40 active:scale-95 transition-transform"
          style={{ fontSize: '9px' }}
        >
          <Check size={14} />
          GUARDAR
        </button>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-textMuted text-xs font-pixel mb-2" style={{ fontSize: '8px' }}>
            NOMBRE DE LA RUTINA
          </label>
          <input
            className="input-base"
            placeholder="ej: Push — Pecho/Hombros/Tríceps"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        {/* Day type */}
        <div>
          <label className="block text-textMuted text-xs font-pixel mb-2" style={{ fontSize: '8px' }}>
            TIPO DE DÍA
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(DAY_TYPE_LABELS) as DayType[]).map((dt) => (
              <button
                key={dt}
                onClick={() => setForm((f) => ({ ...f, dayType: dt }))}
                className={`py-2 px-3 rounded-lg text-xs border transition-all text-left ${
                  form.dayType === dt
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface2 text-textMuted'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block mr-1.5"
                  style={{ backgroundColor: DAY_TYPE_COLORS[dt] }}
                />
                {DAY_TYPE_LABELS[dt].split('—')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise picker */}
        <div className="card space-y-3">
          <p className="font-pixel text-textMuted" style={{ fontSize: '8px' }}>
            AGREGAR EJERCICIO
          </p>

          {/* Muscle group selector */}
          <div>
            <label className="text-xs text-textMuted mb-1 block">Grupo muscular</label>
            <select
              className="input-base"
              value={pickMuscle}
              onChange={(e) => {
                setPickMuscle(e.target.value as MuscleGroup);
                setPickExercise('');
              }}
            >
              {MUSCLE_GROUP_ORDER.map((mg) => (
                <option key={mg} value={mg}>
                  {MUSCLE_GROUP_LABELS[mg]}
                </option>
              ))}
            </select>
          </div>

          {/* Exercise selector */}
          {!showCustomInput ? (
            <div>
              <label className="text-xs text-textMuted mb-1 block">Ejercicio</label>
              <select
                className="input-base"
                value={pickExercise}
                onChange={(e) => setPickExercise(e.target.value)}
              >
                <option value="">— Seleccioná un ejercicio —</option>
                {filteredExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              <button
                className="text-xs text-accent mt-1.5"
                onClick={() => setShowCustomInput(true)}
              >
                + Agregar ejercicio personalizado
              </button>
            </div>
          ) : (
            <div>
              <label className="text-xs text-textMuted mb-1 block">Nombre del ejercicio nuevo</label>
              <input
                className="input-base"
                placeholder="ej: Press en máquina Smith"
                value={customExName}
                onChange={(e) => setCustomExName(e.target.value)}
              />
              <button
                className="text-xs text-textMuted mt-1.5"
                onClick={() => setShowCustomInput(false)}
              >
                ← Usar ejercicio de la lista
              </button>
            </div>
          )}

          {/* Sets / Reps / Weight */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-textMuted mb-1 block">Series</label>
              <input
                type="number"
                min="1"
                max="20"
                className="input-base text-center"
                value={pickSets}
                onChange={(e) => setPickSets(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-textMuted mb-1 block">Reps</label>
              <input
                type="number"
                min="1"
                max="100"
                className="input-base text-center"
                value={pickReps}
                onChange={(e) => setPickReps(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-textMuted mb-1 block">Peso (kg)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="input-base text-center"
                value={pickWeight}
                onChange={(e) => setPickWeight(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={addExerciseToForm}
            disabled={!pickExercise && !customExName.trim()}
            className="w-full bg-accent text-background font-pixel py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-transform"
            style={{ fontSize: '9px' }}
          >
            <Plus size={14} />
            AGREGAR AL PLAN
          </button>
        </div>

        {/* Exercises in routine */}
        {form.exercises.length > 0 && (
          <div>
            <p className="font-pixel text-textMuted mb-2" style={{ fontSize: '8px' }}>
              EJERCICIOS EN LA RUTINA ({form.exercises.length})
            </p>
            <div className="space-y-2">
              {form.exercises.map((re, idx) => (
                <div key={re.exerciseId} className="card flex items-start gap-3">
                  <span className="text-textMuted text-xs mt-1 w-5">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-textPrimary text-sm font-medium truncate">
                      {getExName(re.exerciseId)}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { label: 'Series', field: 'targetSets' as const, min: 1 },
                        { label: 'Reps', field: 'targetReps' as const, min: 1 },
                        { label: 'kg', field: 'targetWeight' as const, min: 0 },
                      ].map(({ label, field, min }) => (
                        <div key={field}>
                          <label className="text-xs text-textMuted block mb-1">{label}</label>
                          <input
                            type="number"
                            min={min}
                            step={field === 'targetWeight' ? 0.5 : 1}
                            className="input-base text-center text-sm py-1"
                            value={re[field]}
                            onChange={(e) =>
                              updateExerciseInForm(re.exerciseId, field, parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeExerciseFromForm(re.exerciseId)}
                    className="text-textMuted hover:text-danger transition-colors mt-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
