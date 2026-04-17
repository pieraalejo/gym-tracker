import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { useGymStore } from '../store/gymStore';
import type { WeekDay } from '../types';

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const Calendar: React.FC = () => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const routines = useGymStore((s) => s.routines);
  const workoutLogs = useGymStore((s) => s.workoutLogs);
  const weeklyPlan = useGymStore((s) => s.weeklyPlan);
  const setDayRoutine = useGymStore((s) => s.setDayRoutine);
  const navigate = useNavigate();

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Date string -> routineId para entrenamientos completados
  const completedByDate = useMemo(() => {
    const map: Record<string, string> = {};
    workoutLogs.forEach((log) => {
      if (log.completed) map[log.date] = log.routineId;
    });
    return map;
  }, [workoutLogs]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const toDateStr = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  };

  const isToday = (day: number) =>
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  const getDayOfWeek = (day: number): WeekDay =>
    new Date(viewYear, viewMonth, day).getDay() as WeekDay;

  // Calcular % de cumplimiento del mes visible
  const totalPlannedThisMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (day) => weeklyPlan[getDayOfWeek(day)]
  ).length;
  const completedThisMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (day) => {
      const ds = toDateStr(day);
      const dow = getDayOfWeek(day);
      return weeklyPlan[dow] && completedByDate[ds];
    }
  ).length;
  const adherence = totalPlannedThisMonth > 0
    ? Math.round((completedThisMonth / totalPlannedThisMonth) * 100)
    : null;

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <button onClick={prevMonth} className="p-2 text-textMuted hover:text-textPrimary transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-pixel text-accent" style={{ fontSize: '11px' }}>
          {MONTHS_ES[viewMonth].toUpperCase()} {viewYear}
        </h1>
        <button onClick={nextMonth} className="p-2 text-textMuted hover:text-textPrimary transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Adherencia del mes */}
      {adherence !== null && (
        <div className="text-center mb-3">
          <span className="text-xs text-textMuted">
            Cumplimiento: <span className={adherence >= 70 ? 'text-accent' : 'text-yellow-400'}>{adherence}%</span>
            <span className="text-textMuted"> ({completedThisMonth}/{totalPlannedThisMonth} días)</span>
          </span>
        </div>
      )}

      {/* Encabezados días */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ES.map((d) => (
          <div
            key={d}
            className="text-center text-textMuted font-pixel py-1"
            style={{ fontSize: '8px' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid del mes */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const ds = toDateStr(day);
          const dow = getDayOfWeek(day);
          const plannedRoutineId = weeklyPlan[dow];
          const plannedRoutine = plannedRoutineId ? routines.find((r) => r.id === plannedRoutineId) : null;
          const completedRoutineId = completedByDate[ds];
          const isTodayDay = isToday(day);
          const isSelected = selectedDay === day;
          const wasPlannedAndMissed =
            plannedRoutine &&
            !completedRoutineId &&
            new Date(ds) < new Date(today.toISOString().split('T')[0]);

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`relative flex flex-col items-center justify-center rounded-lg py-1 transition-colors
                ${isTodayDay ? 'ring-2 ring-accent ring-offset-1 ring-offset-background' : ''}
                ${isSelected ? 'bg-surface' : 'hover:bg-surface/50'}
                ${wasPlannedAndMissed ? 'opacity-50' : ''}
              `}
              style={{ aspectRatio: '1' }}
            >
              <span
                className={`text-xs font-medium leading-none ${isTodayDay ? 'text-accent font-bold' : 'text-textPrimary'}`}
                style={{ fontSize: '11px' }}
              >
                {day}
              </span>
              <div className="flex gap-0.5 mt-0.5 h-1.5">
                {completedRoutineId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                )}
                {plannedRoutine && !completedRoutineId && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: plannedRoutine.color, opacity: 0.6 }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-xs text-textMuted" style={{ fontSize: '9px' }}>Completado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 opacity-60" />
          <span className="text-xs text-textMuted" style={{ fontSize: '9px' }}>Planificado</span>
        </div>
      </div>

      {/* Detalle día seleccionado */}
      {selectedDay !== null && (() => {
        const ds = toDateStr(selectedDay);
        const dow = getDayOfWeek(selectedDay);
        const plannedRoutineId = weeklyPlan[dow];
        const plannedRoutine = plannedRoutineId ? routines.find((r) => r.id === plannedRoutineId) : null;
        const completedRoutineId = completedByDate[ds];
        const completedRoutine = completedRoutineId ? routines.find((r) => r.id === completedRoutineId) : null;

        return (
          <div className="mt-4 p-3 bg-surface rounded-xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="font-pixel text-textPrimary" style={{ fontSize: '10px' }}>
                {DAYS_ES[dow]} {selectedDay} de {MONTHS_ES[viewMonth]}
              </span>
              <button onClick={() => setSelectedDay(null)} className="text-textMuted hover:text-textPrimary">
                <X size={16} />
              </button>
            </div>

            {completedRoutine && (
              <div className="mb-3 flex items-center gap-2 p-2 bg-accent/10 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <div>
                  <span className="text-xs text-accent font-medium">Entrenamiento completado</span>
                  <p className="text-xs text-textMuted">{completedRoutine.name}</p>
                </div>
              </div>
            )}

            {routines.length === 0 ? (
              <p className="text-xs text-textMuted text-center py-2">
                No hay rutinas creadas aún.{' '}
                <button onClick={() => navigate('/rutinas')} className="text-accent underline">
                  Crear una
                </button>
              </p>
            ) : (
              <div className="mb-3">
                <label className="text-xs text-textMuted block mb-1.5 font-pixel" style={{ fontSize: '9px' }}>
                  RUTINA PARA TODOS LOS {DAYS_ES[dow].toUpperCase()}S
                </label>
                <select
                  value={plannedRoutineId ?? ''}
                  onChange={(e) => setDayRoutine(dow, e.target.value || null)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
                >
                  <option value="">— Descanso —</option>
                  {routines.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {plannedRoutine && isToday(selectedDay) && !completedRoutineId && (
              <button
                onClick={() => navigate('/entrenar')}
                className="w-full flex items-center justify-center gap-2 bg-accent text-background font-pixel py-2.5 rounded-lg transition-opacity hover:opacity-90"
                style={{ fontSize: '10px' }}
              >
                <Play size={14} />
                EMPEZAR ENTRENAMIENTO
              </button>
            )}
          </div>
        );
      })()}

      {/* Plan semanal */}
      <div className="mt-6">
        <h2 className="font-pixel text-textMuted mb-3" style={{ fontSize: '9px' }}>
          PLAN SEMANAL
        </h2>
        <div className="space-y-1.5">
          {DAYS_ES.map((dayName, dow) => {
            const routineId = weeklyPlan[dow as WeekDay];
            const routine = routineId ? routines.find((r) => r.id === routineId) : null;
            return (
              <div
                key={dow}
                className="flex items-center gap-3 px-3 py-2.5 bg-surface rounded-lg border border-border"
              >
                <span
                  className="text-textMuted w-7 font-pixel flex-shrink-0"
                  style={{ fontSize: '9px' }}
                >
                  {dayName}
                </span>
                {routine ? (
                  <>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: routine.color }}
                    />
                    <span className="text-xs text-textPrimary flex-1 truncate">{routine.name}</span>
                    <button
                      onClick={() => setDayRoutine(dow as WeekDay, null)}
                      className="text-textMuted hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-textMuted italic flex-1">Descanso</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
