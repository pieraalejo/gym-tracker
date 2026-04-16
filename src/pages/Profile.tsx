import { useState } from 'react';
import { Edit2, Check, X, Scale, Ruler, Percent, Dumbbell, Flame, Calendar, TrendingUp, LogOut } from 'lucide-react';
import BearAvatar from '../components/bear/BearAvatarV2';
import {
  useGymStore,
  getBearState,
  getCurrentStreak,
  getDaysSinceLastWorkout,
} from '../store/gymStore';
import { supabase } from '../lib/supabase';
import type { BearState } from '../types';

const BEAR_GREETING: Record<BearState, string> = {
  fresh:           '¡Eso es dedicación pura! 💪',
  happy:           '¡Vas muy bien, seguí así! 🔥',
  neutral:         'Cuando quieras, acá estoy 🐻',
  sad:             'Te extraño en el gym... 😢',
  workout_pecho:   '¡Día de pecho, vamos! 🏋️',
  workout_espalda: '¡Tirando fuerte con la espalda! 💪',
  workout_hombros: '¡Press militar al techo! 🏆',
  workout_biceps:  '¡Curlando con todo el corazón! 💪',
  workout_triceps: '¡Extensiones al máximo! 🔥',
  workout_piernas: '¡Las sentadillas nunca mienten! 🦵',
  workout_abdomen: '¡Planchas y crunches! 🎯',
  workout_cardio:  '¡El oso corre sin parar! 🏃',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Profile() {
  const {
    userProfile,
    updateUserProfile,
    workoutLogs,
    routines,
    activeWorkout,
    bodyMeasurements,
    addBodyMeasurement,
  } = useGymStore();

  const bearState = getBearState(workoutLogs, activeWorkout, routines);
  const streak = getCurrentStreak(workoutLogs);
  const daysSince = getDaysSinceLastWorkout(workoutLogs);

  const [editing, setEditing] = useState(false);
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editBodyFat, setEditBodyFat] = useState('');
  const [editName, setEditName] = useState('');

  // New measurement form
  const [showMeasForm, setShowMeasForm] = useState(false);
  const [measWeight, setMeasWeight] = useState('');
  const [measBodyFat, setMeasBodyFat] = useState('');

  function openEdit() {
    setEditName(userProfile?.name ?? '');
    setEditWeight(userProfile?.weight ? String(userProfile.weight) : '');
    setEditHeight(userProfile?.height ? String(userProfile.height) : '');
    setEditBodyFat(userProfile?.bodyFat ? String(userProfile.bodyFat) : '');
    setEditing(true);
  }

  function saveEdit() {
    updateUserProfile({
      name: editName.trim() || userProfile?.name,
      weight: parseFloat(editWeight) || userProfile?.weight,
      height: parseFloat(editHeight) || userProfile?.height,
      bodyFat: editBodyFat ? parseFloat(editBodyFat) : undefined,
    });
    setEditing(false);
  }

  function handleAddMeasurement() {
    if (!measWeight) return;
    addBodyMeasurement({
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(measWeight),
      bodyFat: measBodyFat ? parseFloat(measBodyFat) : undefined,
    });
    setMeasWeight('');
    setMeasBodyFat('');
    setShowMeasForm(false);
  }

  // Stats calculados
  const totalWorkouts = workoutLogs.length;
  const totalVolume = workoutLogs.reduce(
    (sum, log) =>
      sum +
      log.exercises.reduce(
        (s, e) => s + e.sets.filter((st) => st.completed).reduce((sv, st) => sv + st.reps * st.weight, 0),
        0
      ),
    0
  );

  // Promedio de sesiones por semana (últimas 4 semanas)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentLogs = workoutLogs.filter((l) => new Date(l.date) >= fourWeeksAgo);
  const avgPerWeek = recentLogs.length > 0 ? (recentLogs.length / 4).toFixed(1) : '0';

  // Última medición de peso
  const sortedMeasurements = [...bodyMeasurements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestMeasurement = sortedMeasurements[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '¡Buenos días' : hour < 19 ? '¡Buenas tardes' : '¡Buenas noches';

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header flex items-center justify-between">
        <h1 className="font-pixel text-accent" style={{ fontSize: '13px' }}>
          PERFIL
        </h1>
        {!editing && (
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 bg-surface2 text-textMuted border border-border px-3 py-2 rounded-lg active:scale-95 transition-transform"
          >
            <Edit2 size={14} />
            <span className="font-pixel" style={{ fontSize: '8px' }}>EDITAR</span>
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="p-2 text-textMuted"
            >
              <X size={18} />
            </button>
            <button
              onClick={saveEdit}
              className="flex items-center gap-1 bg-accent text-background px-3 py-1.5 rounded-lg font-pixel active:scale-95 transition-transform"
              style={{ fontSize: '9px' }}
            >
              <Check size={14} />
              GUARDAR
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Bear + saludo */}
        <div className="card flex flex-col items-center py-6 text-center">
          <BearAvatar state={bearState} size={100} />
          <div className="mt-4">
            <p className="font-pixel text-accent" style={{ fontSize: '13px' }}>
              {greeting}, {userProfile?.name?.toUpperCase() ?? 'ATLETA'}!
            </p>
            <p className="text-textMuted text-sm mt-1">
              {BEAR_GREETING[bearState]}
            </p>
            {daysSince !== null && (
              <p className="text-textMuted text-xs mt-2 flex items-center justify-center gap-1">
                <Calendar size={11} />
                {daysSince === 0
                  ? 'Entrenaste hoy'
                  : daysSince === 1
                  ? 'Último entreno: ayer'
                  : `Último entreno: hace ${daysSince} días`}
              </p>
            )}
          </div>
        </div>

        {/* Datos del usuario */}
        {editing ? (
          <div className="card space-y-3">
            <p className="font-pixel text-textMuted" style={{ fontSize: '8px' }}>
              EDITAR DATOS
            </p>
            <div>
              <label className="text-xs text-textMuted block mb-1">Nombre</label>
              <input
                className="input-base"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-textMuted block mb-1">Peso (kg)</label>
                <input
                  type="number" min="0" step="0.1"
                  className="input-base text-center"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  placeholder="70"
                />
              </div>
              <div>
                <label className="text-xs text-textMuted block mb-1">Altura (cm)</label>
                <input
                  type="number" min="0"
                  className="input-base text-center"
                  value={editHeight}
                  onChange={(e) => setEditHeight(e.target.value)}
                  placeholder="175"
                />
              </div>
              <div>
                <label className="text-xs text-textMuted block mb-1">G. corporal (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  className="input-base text-center"
                  value={editBodyFat}
                  onChange={(e) => setEditBodyFat(e.target.value)}
                  placeholder="15"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="font-pixel text-textMuted mb-3" style={{ fontSize: '8px' }}>
              MIS DATOS
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1">
                <Scale size={18} className="text-accent" />
                <p className="font-pixel text-textPrimary" style={{ fontSize: '16px' }}>
                  {latestMeasurement?.weight ?? userProfile?.weight ?? '—'}
                </p>
                <p className="text-textMuted text-xs">kg</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Ruler size={18} className="text-accent" />
                <p className="font-pixel text-textPrimary" style={{ fontSize: '16px' }}>
                  {userProfile?.height ?? '—'}
                </p>
                <p className="text-textMuted text-xs">cm</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Percent size={18} className="text-accent" />
                <p className="font-pixel text-textPrimary" style={{ fontSize: '16px' }}>
                  {latestMeasurement?.bodyFat ?? userProfile?.bodyFat ?? '—'}
                </p>
                <p className="text-textMuted text-xs">grasa %</p>
              </div>
            </div>
            {userProfile?.email && (
              <p className="text-textMuted text-xs text-center mt-3 border-t border-border pt-3">
                {userProfile.email}
              </p>
            )}
          </div>
        )}

        {/* Stats de entrenamiento */}
        <div>
          <p className="font-pixel text-textMuted mb-2" style={{ fontSize: '8px' }}>
            MIS ESTADÍSTICAS
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="card flex flex-col items-center py-4 gap-1">
              <Flame size={18} className="text-warning" />
              <p className="font-pixel text-accent" style={{ fontSize: '22px' }}>{streak}</p>
              <p className="text-textMuted text-xs">días de racha</p>
            </div>
            <div className="card flex flex-col items-center py-4 gap-1">
              <Dumbbell size={18} className="text-accent" />
              <p className="font-pixel text-accent" style={{ fontSize: '22px' }}>{totalWorkouts}</p>
              <p className="text-textMuted text-xs">entrenamientos</p>
            </div>
            <div className="card flex flex-col items-center py-4 gap-1">
              <TrendingUp size={18} className="text-green-400" />
              <p className="font-pixel text-green-400" style={{ fontSize: '22px' }}>{avgPerWeek}</p>
              <p className="text-textMuted text-xs">sesiones/semana</p>
            </div>
            <div className="card flex flex-col items-center py-4 gap-1">
              <Scale size={18} className="text-blue-400" />
              <p className="font-pixel text-blue-400" style={{ fontSize: '16px' }}>
                {totalVolume >= 1000
                  ? `${(totalVolume / 1000).toFixed(1)}t`
                  : `${Math.round(totalVolume)}kg`}
              </p>
              <p className="text-textMuted text-xs">volumen total</p>
            </div>
          </div>
        </div>

        {/* Mediciones corporales */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-pixel text-textMuted" style={{ fontSize: '8px' }}>
              MEDICIONES
            </p>
            <button
              onClick={() => setShowMeasForm((v) => !v)}
              className="text-xs text-accent flex items-center gap-1"
            >
              <TrendingUp size={12} />
              {showMeasForm ? 'Cancelar' : 'Registrar'}
            </button>
          </div>

          {showMeasForm && (
            <div className="card space-y-3 mb-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-textMuted block mb-1">Peso (kg)</label>
                  <input
                    type="number" min="0" step="0.1"
                    className="input-base text-center"
                    value={measWeight}
                    onChange={(e) => setMeasWeight(e.target.value)}
                    placeholder="70.5"
                  />
                </div>
                <div>
                  <label className="text-xs text-textMuted block mb-1">G. corporal (%)</label>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    className="input-base text-center"
                    value={measBodyFat}
                    onChange={(e) => setMeasBodyFat(e.target.value)}
                    placeholder="15"
                  />
                </div>
              </div>
              <button
                onClick={handleAddMeasurement}
                disabled={!measWeight}
                className="w-full bg-accent text-background font-pixel py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95"
                style={{ fontSize: '9px' }}
              >
                <Check size={14} />
                GUARDAR MEDICIÓN
              </button>
            </div>
          )}

          {sortedMeasurements.length === 0 ? (
            <div className="card text-center py-6">
              <p className="text-textMuted text-sm">Sin mediciones registradas</p>
              <p className="text-textMuted text-xs mt-1">
                Registrá tu peso y grasa corporal para hacer seguimiento
              </p>
            </div>
          ) : (
            <div className="card space-y-2">
              {sortedMeasurements.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <p className="text-textMuted text-xs">{formatDate(m.date)}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-textPrimary text-sm font-medium">{m.weight} kg</span>
                    {m.bodyFat !== undefined && (
                      <span className="text-textMuted text-xs">{m.bodyFat}% grasa</span>
                    )}
                  </div>
                </div>
              ))}
              {sortedMeasurements.length > 5 && (
                <p className="text-textMuted text-xs text-center pt-1">
                  +{sortedMeasurements.length - 5} mediciones anteriores
                </p>
              )}
            </div>
          )}
        </div>

        {/* Miembro desde */}
        {userProfile?.createdAt && (
          <p className="text-textMuted text-xs text-center">
            Miembro desde {formatDate(userProfile.createdAt)}
          </p>
        )}

        {/* Cerrar sesión */}
        <button
          onClick={async () => {
            if (confirm('¿Cerrar sesión?')) {
              await supabase.auth.signOut();
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-3 text-red-400 border border-red-400/20 rounded-xl bg-red-400/5 active:scale-95 transition-transform"
        >
          <LogOut size={16} />
          <span className="font-pixel" style={{ fontSize: '9px' }}>CERRAR SESIÓN</span>
        </button>
      </div>
    </div>
  );
}
