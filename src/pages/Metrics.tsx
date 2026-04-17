import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Award, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useGymStore, getExerciseProgress, getCurrentStreak } from '../store/gymStore';
import { DEFAULT_EXERCISES } from '../data/exercises';

type Tab = 'graficas' | 'cuerpo' | 'historial';

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

function formatWeight(v: number) {
  return v % 1 === 0 ? v.toString() : v.toFixed(1);
}

function formatDateLong(d: string) {
  return new Date(d).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getDuration(start?: string, end?: string): string {
  if (!start || !end) return '';
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface TooltipPayloadItem {
  name?: string;
  color?: string;
  value?: number | string;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg p-2 text-xs">
      <p className="text-textMuted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={p.name ?? i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Metrics() {
  const workoutLogs = useGymStore((s) => s.workoutLogs);
  const exercises = useGymStore((s) => s.exercises);
  const routines = useGymStore((s) => s.routines);
  const bodyMeasurements = useGymStore((s) => s.bodyMeasurements);
  const addBodyMeasurement = useGymStore((s) => s.addBodyMeasurement);
  const deleteBodyMeasurement = useGymStore((s) => s.deleteBodyMeasurement);
  const userProfile = useGymStore((s) => s.userProfile);
  const allExercises = useMemo(
    () => [...DEFAULT_EXERCISES, ...exercises.filter((e) => e.isCustom)],
    [exercises]
  );

  const [tab, setTab] = useState<Tab>('graficas');

  // ── Graphs tab state ──────────────────────────────────────────────────────
  const loggedExerciseIds = useMemo(() => {
    const ids = new Set<string>();
    workoutLogs.forEach((log) => log.exercises.forEach((e) => {
      if (!e.skipped && e.sets.some((s) => s.completed)) ids.add(e.exerciseId);
    }));
    return [...ids];
  }, [workoutLogs]);

  const [selectedExId, setSelectedExId] = useState<string>(loggedExerciseIds[0] ?? '');

  const progress = useMemo(
    () => getExerciseProgress(workoutLogs, selectedExId),
    [workoutLogs, selectedExId]
  );

  const streak = getCurrentStreak(workoutLogs);

  const weeklyVolume = useMemo(() => {
    const weeks: Record<string, number> = {};
    workoutLogs.forEach((log) => {
      const d = new Date(log.date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().split('T')[0];
      const vol = log.exercises.reduce((s, e) =>
        s + e.sets.filter((st) => st.completed).reduce((sv, st) => sv + st.reps * st.weight, 0), 0
      );
      weeks[key] = (weeks[key] ?? 0) + vol;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([date, volume]) => ({ week: formatDate(date), volume: Math.round(volume) }));
  }, [workoutLogs]);

  const workoutsPerWeek = useMemo(() => {
    const weeks: Record<string, number> = {};
    workoutLogs.forEach((log) => {
      const d = new Date(log.date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().split('T')[0];
      weeks[key] = (weeks[key] ?? 0) + 1;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([date, count]) => ({ week: formatDate(date), count }));
  }, [workoutLogs]);

  const personalRecords = useMemo(() => {
    type PR = { exerciseId: string; maxWeight: number; maxVolume: number };
    const records: PR[] = [];
    for (const id of loggedExerciseIds) {
      const prog = getExerciseProgress(workoutLogs, id);
      if (prog.length === 0) continue;
      records.push({
        exerciseId: id,
        maxWeight: Math.max(...prog.map((p) => p.maxWeight)),
        maxVolume: Math.max(...prog.map((p) => p.totalVolume)),
      });
    }
    return records.sort((a, b) => b.maxWeight - a.maxWeight).slice(0, 5);
  }, [workoutLogs, loggedExerciseIds]);

  const trend = useMemo(() => {
    if (progress.length < 2) return 0;
    return progress[progress.length - 1].maxWeight - progress[progress.length - 2].maxWeight;
  }, [progress]);

  // ── Body tab state ────────────────────────────────────────────────────────
  const [showAddMeasure, setShowAddMeasure] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  function handleAddMeasurement() {
    const w = parseFloat(newWeight);
    if (!newWeight || isNaN(w) || w < 20 || w > 300) return;
    addBodyMeasurement({
      date: newDate,
      weight: w,
      bodyFat: newBodyFat ? parseFloat(newBodyFat) : undefined,
    });
    setNewWeight('');
    setNewBodyFat('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setShowAddMeasure(false);
  }

  const sortedMeasurements = useMemo(
    () => [...bodyMeasurements].sort((a, b) => a.date.localeCompare(b.date)),
    [bodyMeasurements]
  );

  const latestMeasurement = sortedMeasurements[sortedMeasurements.length - 1];
  const firstMeasurement = sortedMeasurements[0];
  const weightDelta = latestMeasurement && firstMeasurement && latestMeasurement !== firstMeasurement
    ? latestMeasurement.weight - firstMeasurement.weight
    : null;

  // BMI
  const bmi = latestMeasurement && userProfile?.height
    ? latestMeasurement.weight / Math.pow(userProfile.height / 100, 2)
    : null;

  // ── History tab state ─────────────────────────────────────────────────────
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const sortedLogs = useMemo(
    () => [...workoutLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [workoutLogs]
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: 'graficas', label: 'GRÁFICAS' },
    { id: 'cuerpo', label: 'CUERPO' },
    { id: 'historial', label: 'HISTORIAL' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header">
        <h1 className="font-pixel text-accent" style={{ fontSize: '13px' }}>
          MÉTRICAS
        </h1>
        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 rounded-lg font-pixel transition-colors ${
                tab === t.id
                  ? 'bg-accent text-background'
                  : 'bg-surface2 text-textMuted hover:text-textPrimary'
              }`}
              style={{ fontSize: '8px' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">

        {/* ── GRÁFICAS TAB ── */}
        {tab === 'graficas' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="card flex flex-col gap-1">
                <p className="font-pixel text-accent" style={{ fontSize: '20px' }}>{streak}</p>
                <p className="text-textMuted text-xs">días de racha</p>
                <p className="font-pixel text-textMuted" style={{ fontSize: '7px' }}>RACHA ACTUAL</p>
              </div>
              <div className="card flex flex-col gap-1">
                <p className="font-pixel text-textPrimary" style={{ fontSize: '20px' }}>{workoutLogs.length}</p>
                <p className="text-textMuted text-xs">entrenamientos</p>
                <p className="font-pixel text-textMuted" style={{ fontSize: '7px' }}>TOTAL</p>
              </div>
            </div>

            {workoutLogs.length === 0 ? (
              <div className="card flex flex-col items-center py-12 gap-3 text-center">
                <TrendingUp size={48} className="text-textMuted" />
                <p className="font-pixel text-textMuted" style={{ fontSize: '10px' }}>SIN DATOS AÚN</p>
                <p className="text-textMuted text-sm">Completá tu primer entreno para ver tus métricas</p>
              </div>
            ) : (
              <>
                {workoutsPerWeek.length > 1 && (
                  <div className="card">
                    <p className="font-pixel text-textMuted mb-3" style={{ fontSize: '8px' }}>FRECUENCIA SEMANAL</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={workoutsPerWeek} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                        <XAxis dataKey="week" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#39ff14" radius={[3, 3, 0, 0]} name="entrenos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {loggedExerciseIds.length > 0 && (
                  <div className="card space-y-3">
                    <p className="font-pixel text-textMuted" style={{ fontSize: '8px' }}>PROGRESO POR EJERCICIO</p>
                    <select
                      className="input-base"
                      value={selectedExId}
                      onChange={(e) => setSelectedExId(e.target.value)}
                    >
                      {loggedExerciseIds.map((id) => (
                        <option key={id} value={id}>
                          {allExercises.find((e) => e.id === id)?.name ?? id}
                        </option>
                      ))}
                    </select>

                    {progress.length > 0 && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 text-sm font-semibold ${
                            trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-textMuted'
                          }`}>
                            {trend > 0 ? <TrendingUp size={16} /> : trend < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                            {trend > 0 ? `+${formatWeight(trend)}kg` : trend < 0 ? `${formatWeight(trend)}kg` : 'Sin cambio'}
                          </div>
                          <span className="text-textMuted text-xs">vs. sesión anterior</span>
                        </div>
                        <div>
                          <p className="text-textMuted text-xs mb-2">Peso máximo (kg)</p>
                          <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={progress.map((p) => ({ ...p, date: formatDate(p.date) }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                              <Tooltip content={<CustomTooltip />} />
                              <Line type="monotone" dataKey="maxWeight" stroke="#39ff14" strokeWidth={2} dot={{ fill: '#39ff14', r: 3 }} activeDot={{ r: 5 }} name="peso (kg)" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        {progress.length > 1 && (
                          <div>
                            <p className="text-textMuted text-xs mb-2">Volumen total (reps × kg)</p>
                            <ResponsiveContainer width="100%" height={120}>
                              <BarChart data={progress.map((p) => ({ ...p, date: formatDate(p.date) }))} barSize={14}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="totalVolume" fill="#3b82f6" radius={[3, 3, 0, 0]} name="volumen" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                          {[
                            { label: 'MEJOR PESO', value: `${formatWeight(Math.max(...progress.map(p => p.maxWeight)))}kg` },
                            { label: 'MEJOR VOL.', value: Math.round(Math.max(...progress.map(p => p.totalVolume))).toString() },
                            { label: 'SESIONES', value: progress.length.toString() },
                          ].map(({ label, value }) => (
                            <div key={label} className="text-center">
                              <p className="font-pixel text-accent" style={{ fontSize: '12px' }}>{value}</p>
                              <p className="font-pixel text-textMuted mt-0.5" style={{ fontSize: '6px' }}>{label}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {progress.length === 0 && (
                      <p className="text-textMuted text-sm text-center py-4">Sin datos para este ejercicio</p>
                    )}
                  </div>
                )}

                {weeklyVolume.length > 1 && (
                  <div className="card">
                    <p className="font-pixel text-textMuted mb-3" style={{ fontSize: '8px' }}>VOLUMEN SEMANAL TOTAL</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={weeklyVolume} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                        <XAxis dataKey="week" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="volume" fill="#f59e0b" radius={[3, 3, 0, 0]} name="volumen" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {personalRecords.length > 0 && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <Award size={16} className="text-warning" />
                      <p className="font-pixel text-textMuted" style={{ fontSize: '8px' }}>MEJORES PESOS</p>
                    </div>
                    <div className="space-y-2">
                      {personalRecords.map((pr) => {
                        const name = allExercises.find((e) => e.id === pr.exerciseId)?.name ?? pr.exerciseId;
                        return (
                          <div key={pr.exerciseId} className="flex items-center gap-3">
                            <p className="text-textPrimary text-sm flex-1 truncate">{name}</p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="font-pixel text-warning" style={{ fontSize: '12px' }}>{formatWeight(pr.maxWeight)}</span>
                              <span className="text-textMuted text-xs">kg</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── CUERPO TAB ── */}
        {tab === 'cuerpo' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card flex flex-col gap-1">
                <p className="font-pixel text-accent" style={{ fontSize: '20px' }}>
                  {latestMeasurement ? formatWeight(latestMeasurement.weight) : (userProfile?.weight ? formatWeight(userProfile.weight) : '—')}
                </p>
                <p className="text-textMuted text-xs">kg actuales</p>
                {weightDelta !== null && (
                  <p className={`text-xs font-semibold ${weightDelta < 0 ? 'text-green-400' : weightDelta > 0 ? 'text-orange-400' : 'text-textMuted'}`}>
                    {weightDelta > 0 ? '+' : ''}{formatWeight(weightDelta)} kg total
                  </p>
                )}
              </div>
              <div className="card flex flex-col gap-1">
                <p className="font-pixel text-textPrimary" style={{ fontSize: '20px' }}>
                  {bmi ? bmi.toFixed(1) : '—'}
                </p>
                <p className="text-textMuted text-xs">IMC</p>
                {bmi && (
                  <p className="text-xs text-textMuted">
                    {bmi < 18.5 ? 'Bajo peso' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Sobrepeso' : 'Obesidad'}
                  </p>
                )}
              </div>
            </div>

            {/* Weight chart */}
            {sortedMeasurements.length > 1 && (
              <div className="card">
                <p className="font-pixel text-textMuted mb-3" style={{ fontSize: '8px' }}>EVOLUCIÓN DE PESO</p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={sortedMeasurements.map((m) => ({ date: formatDate(m.date), weight: m.weight }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={35} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="weight" stroke="#39ff14" strokeWidth={2} dot={{ fill: '#39ff14', r: 3 }} activeDot={{ r: 5 }} name="peso (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Body fat chart */}
            {sortedMeasurements.filter((m) => m.bodyFat !== undefined).length > 1 && (
              <div className="card">
                <p className="font-pixel text-textMuted mb-3" style={{ fontSize: '8px' }}>% GRASA CORPORAL</p>
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={sortedMeasurements.filter((m) => m.bodyFat !== undefined).map((m) => ({ date: formatDate(m.date), bodyFat: m.bodyFat }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} width={30} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} activeDot={{ r: 5 }} name="% grasa" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Add measurement */}
            {showAddMeasure ? (
              <div className="card space-y-3">
                <p className="font-pixel text-textMuted" style={{ fontSize: '9px' }}>REGISTRAR MEDIDA</p>
                <div>
                  <label className="text-xs text-textMuted block mb-1">Fecha</label>
                  <input
                    type="date"
                    className="input-base"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted block mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    min="20" max="300" step="0.1"
                    className="input-base"
                    placeholder="70.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted block mb-1">% Grasa corporal <span className="opacity-50">(opcional)</span></label>
                  <input
                    type="number"
                    min="1" max="60" step="0.1"
                    className="input-base"
                    placeholder="15.0"
                    value={newBodyFat}
                    onChange={(e) => setNewBodyFat(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddMeasure(false)}
                    className="flex-1 bg-surface border border-border text-textMuted font-pixel py-2.5 rounded-xl"
                    style={{ fontSize: '9px' }}
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={handleAddMeasurement}
                    disabled={!newWeight}
                    className="flex-[2] bg-accent text-background font-pixel py-2.5 rounded-xl disabled:opacity-40"
                    style={{ fontSize: '9px' }}
                  >
                    GUARDAR
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddMeasure(true)}
                className="w-full card flex items-center justify-center gap-2 border-dashed border-accent/40 hover:border-accent/70 transition-colors py-4"
              >
                <Plus size={18} className="text-accent" />
                <span className="font-pixel text-accent" style={{ fontSize: '9px' }}>REGISTRAR PESO DE HOY</span>
              </button>
            )}

            {/* Measurements list */}
            {sortedMeasurements.length > 0 && (
              <div className="card">
                <p className="font-pixel text-textMuted mb-3" style={{ fontSize: '8px' }}>REGISTROS</p>
                <div className="space-y-2">
                  {[...sortedMeasurements].reverse().map((m) => (
                    <div key={m.id} className="flex items-center gap-3 py-1">
                      <div className="flex-1">
                        <p className="text-textPrimary text-sm font-medium">{formatWeight(m.weight)} kg</p>
                        <p className="text-textMuted text-xs">
                          {formatDateLong(m.date)}
                          {m.bodyFat !== undefined && ` · ${formatWeight(m.bodyFat)}% grasa`}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteBodyMeasurement(m.id)}
                        className="text-textMuted hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sortedMeasurements.length === 0 && !showAddMeasure && (
              <p className="text-textMuted text-sm text-center py-4">
                Todavía no registraste ninguna medida. ¡Empezá hoy!
              </p>
            )}
          </>
        )}

        {/* ── HISTORIAL TAB ── */}
        {tab === 'historial' && (
          <>
            {sortedLogs.length === 0 ? (
              <div className="card flex flex-col items-center py-12 gap-3 text-center">
                <TrendingUp size={48} className="text-textMuted" />
                <p className="font-pixel text-textMuted" style={{ fontSize: '10px' }}>SIN ENTRENAMIENTOS</p>
                <p className="text-textMuted text-sm">Completá tu primer entreno para verlo aquí</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedLogs.map((log) => {
                  const routine = routines.find((r) => r.id === log.routineId);
                  const totalSets = log.exercises.reduce((s, e) => s + e.sets.filter((st) => st.completed).length, 0);
                  const duration = getDuration(log.startTime, log.endTime);
                  const isExpanded = expandedLog === log.id;
                  const moodEmoji = log.mood ? ['😴', '😕', '😐', '💪', '🔥'][log.mood - 1] : null;

                  return (
                    <div key={log.id} className="card">
                      <button
                        className="w-full flex items-center gap-3"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        <div
                          className="w-2 h-12 rounded-full flex-shrink-0"
                          style={{ backgroundColor: routine?.color ?? '#39ff14' }}
                        />
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-textPrimary font-semibold text-sm truncate">
                            {routine?.name ?? 'Entreno'}
                          </p>
                          <p className="text-textMuted text-xs mt-0.5">
                            {formatDateLong(log.date)}
                            {duration && ` · ${duration}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {moodEmoji && <span className="text-base">{moodEmoji}</span>}
                          <div className="text-right">
                            <p className="font-pixel text-accent" style={{ fontSize: '12px' }}>{totalSets}</p>
                            <p className="text-textMuted text-xs">series</p>
                          </div>
                          {isExpanded ? <ChevronUp size={16} className="text-textMuted" /> : <ChevronDown size={16} className="text-textMuted" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          {log.exercises.filter((e) => !e.skipped).map((e) => {
                            const exName = allExercises.find((ex) => ex.id === e.exerciseId)?.name ?? e.exerciseId;
                            const doneSets = e.sets.filter((s) => s.completed);
                            if (doneSets.length === 0) return null;
                            return (
                              <div key={e.exerciseId} className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-textPrimary text-xs font-medium truncate">{exName}</p>
                                  <p className="text-textMuted text-xs">
                                    {doneSets.map((s) => `${s.reps}×${s.weight}kg`).join(', ')}
                                  </p>
                                  {e.notes && <p className="text-textMuted text-xs italic mt-0.5">"{e.notes}"</p>}
                                </div>
                              </div>
                            );
                          })}
                          {log.notes && (
                            <p className="text-textMuted text-xs italic pt-1 border-t border-border">
                              "{log.notes}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
