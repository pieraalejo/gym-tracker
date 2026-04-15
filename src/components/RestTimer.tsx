import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  duration: number; // seconds
  onClose: () => void;
}

const PRESETS = [60, 90, 120];

export function RestTimer({ duration, onClose }: Props) {
  const [remaining, setRemaining] = useState(duration);
  const done = remaining <= 0;

  useEffect(() => {
    if (done) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, done]);

  const pct = Math.max(0, remaining / duration);
  const circumference = 2 * Math.PI * 44;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
      <div className="card w-full max-w-xs text-center space-y-5">
        <p className="font-pixel text-textMuted" style={{ fontSize: '8px' }}>
          TIEMPO DE DESCANSO
        </p>

        {/* Circular countdown */}
        <div className="relative w-36 h-36 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#1e1e1e" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={done ? '#39ff14' : '#39ff14'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {done ? (
              <span className="font-pixel text-accent" style={{ fontSize: '11px' }}>¡LISTO!</span>
            ) : (
              <span className="font-pixel text-textPrimary" style={{ fontSize: '26px' }}>
                {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : secs}
              </span>
            )}
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex justify-center gap-2">
          {PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => setRemaining(s)}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface2 text-textMuted hover:text-textPrimary transition-colors font-pixel"
              style={{ fontSize: '8px' }}
            >
              {s}s
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 bg-surface border border-border text-textMuted font-pixel py-3 rounded-xl hover:text-textPrimary transition-colors"
          style={{ fontSize: '9px' }}
        >
          <X size={14} />
          {done ? 'CERRAR' : 'SALTAR'}
        </button>
      </div>
    </div>
  );
}
