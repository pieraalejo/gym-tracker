import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useGymStore } from '../store/gymStore';

const THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4h
const AUTO_FINISH_SECONDS = 60; // sin respuesta → cierra solo

export function AbandonedSessionGuard() {
  const activeWorkout = useGymStore((s) => s.activeWorkout);
  const finishWorkout = useGymStore((s) => s.finishWorkout);
  const cancelWorkout = useGymStore((s) => s.cancelWorkout);

  const [snoozedUntil, setSnoozedUntil] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(AUTO_FINISH_SECONDS);
  const autoFiringRef = useRef(false);

  const check = useCallback(() => {
    if (!activeWorkout) {
      setOpen(false);
      return;
    }
    const elapsed = Date.now() - new Date(activeWorkout.startTime).getTime();
    if (elapsed >= THRESHOLD_MS && Date.now() >= snoozedUntil) {
      setOpen(true);
    }
  }, [activeWorkout, snoozedUntil]);

  // Run on mount and whenever the active workout changes.
  useEffect(() => {
    check();
  }, [check]);

  // Re-check when the tab/app comes back to foreground.
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [check]);

  // Periodic check while the app is open.
  useEffect(() => {
    if (!activeWorkout) return;
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [activeWorkout, check]);

  // Reset countdown + auto-fire flag whenever the modal toggles.
  useEffect(() => {
    if (open) {
      setCountdown(AUTO_FINISH_SECONDS);
      autoFiringRef.current = false;
    }
  }, [open]);

  // Tick the countdown while open. Auto-finish when it reaches zero.
  useEffect(() => {
    if (!open || busy) return;
    if (countdown <= 0) {
      if (!autoFiringRef.current) {
        autoFiringRef.current = true;
        void finishNow();
      }
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, busy, countdown]);

  if (!open || !activeWorkout) return null;

  const hours = Math.floor(
    (Date.now() - new Date(activeWorkout.startTime).getTime()) / (60 * 60 * 1000)
  );

  function keepGoing() {
    setSnoozedUntil(Date.now() + THRESHOLD_MS);
    setError(null);
    setOpen(false);
  }

  async function finishNow() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await finishWorkout(
        `Sesión cerrada automáticamente — superó las ${hours}h de duración`,
        undefined
      );
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar';
      setError(`${msg}. Tu progreso sigue acá — reintentá cuando tengas conexión.`);
    } finally {
      setBusy(false);
    }
  }

  function discard() {
    if (!confirm('¿Descartar esta sesión? Se perderá todo el progreso.')) return;
    cancelWorkout();
    setError(null);
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="abandoned-session-title"
    >
      <div className="bg-surface border border-border rounded-2xl p-5 max-w-sm w-full space-y-4">
        <div className="text-center">
          <p className="text-4xl mb-2">⏰</p>
          <p
            id="abandoned-session-title"
            className="font-pixel text-accent"
            style={{ fontSize: '11px' }}
          >
            ¿SEGUÍS ENTRENANDO?
          </p>
          <p className="text-textMuted text-sm mt-2">
            Tu sesión empezó hace <strong className="text-textPrimary">{hours}h</strong>.
            ¿Querés seguir o cerrarla?
          </p>
          {!busy && !error && (
            <p className="text-warning text-xs mt-2" aria-live="polite">
              Se cerrará automáticamente en {countdown}s
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="text-danger text-xs bg-danger/10 border border-danger/40 rounded-lg p-2">
            {error}
          </div>
        )}

        <button
          onClick={keepGoing}
          disabled={busy}
          className="w-full bg-accent text-background font-pixel py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          style={{ fontSize: '10px' }}
        >
          SÍ, SIGO ENTRENANDO
        </button>

        <button
          onClick={finishNow}
          disabled={busy}
          className="w-full border border-border bg-surface2 text-textPrimary font-pixel py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          style={{ fontSize: '10px' }}
        >
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              GUARDANDO...
            </>
          ) : (
            'TERMINAR Y GUARDAR'
          )}
        </button>

        <button
          onClick={discard}
          disabled={busy}
          className="w-full text-danger text-xs py-2 disabled:opacity-50"
        >
          Descartar sesión
        </button>
      </div>
    </div>
  );
}
