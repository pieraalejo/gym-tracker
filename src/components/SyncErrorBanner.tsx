import { X, AlertCircle } from 'lucide-react';
import { useGymStore } from '../store/gymStore';

export function SyncErrorBanner() {
  const syncError = useGymStore((s) => s.syncError);
  const clearSyncError = useGymStore((s) => s.clearSyncError);

  if (!syncError) return null;

  return (
    <div
      className="fixed top-2 left-2 right-2 z-[60] max-w-lg mx-auto bg-danger/15 border border-danger/40 rounded-lg p-3 flex items-start gap-2 shadow-lg"
      role="alert"
    >
      <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-danger text-xs font-semibold">Error de sincronización</p>
        <p className="text-textMuted text-xs mt-0.5 truncate">{syncError}</p>
        <p className="text-textMuted text-xs mt-1 italic">
          Tus cambios están guardados localmente. Reintentá cuando recuperes conexión.
        </p>
      </div>
      <button
        onClick={clearSyncError}
        className="text-textMuted hover:text-textPrimary p-0.5 flex-shrink-0"
        aria-label="Cerrar aviso"
      >
        <X size={14} />
      </button>
    </div>
  );
}
