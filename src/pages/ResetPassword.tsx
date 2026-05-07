import { useState } from 'react';
import { Dumbbell, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onDone: () => void;
}

export default function ResetPassword({ onDone }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError('');
    if (password.length < 6) {
      setError('Mínimo 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message ?? 'No se pudo actualizar la contraseña');
      return;
    }
    setSuccess(true);
    // Pequeña pausa para que el usuario vea el mensaje y después seguimos al app.
    setTimeout(onDone, 1200);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-accent/10 border border-accent/30 rounded-2xl flex items-center justify-center mb-4">
          <Dumbbell size={32} className="text-accent" />
        </div>
        <h1 className="font-pixel text-accent" style={{ fontSize: '16px' }}>GYM TRACKER</h1>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <h2 className="font-pixel text-textPrimary mb-1" style={{ fontSize: '12px' }}>
            NUEVA CONTRASEÑA
          </h2>
          <p className="text-textMuted text-xs">
            Elegí una nueva contraseña para entrar a tu cuenta.
          </p>
        </div>

        {success ? (
          <div className="card border-accent/40 bg-accent/5 text-center py-6 space-y-2">
            <Check size={32} className="text-accent mx-auto" />
            <p className="font-pixel text-accent" style={{ fontSize: '10px' }}>
              CONTRASEÑA ACTUALIZADA
            </p>
            <p className="text-textMuted text-sm">Entrando...</p>
          </div>
        ) : (
          <>
            <PasswordInput
              label="Nueva contraseña"
              value={password}
              onChange={setPassword}
              show={show}
              onToggle={() => setShow(!show)}
              hint="Mínimo 6 caracteres"
            />
            <PasswordInput
              label="Confirmar contraseña"
              value={confirm}
              onChange={setConfirm}
              show={show}
              onToggle={() => setShow(!show)}
            />

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-accent text-background font-pixel py-3.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
              style={{ fontSize: '10px' }}
            >
              {loading ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  hint?: string;
}

function PasswordInput({ label, value, onChange, show, onToggle, hint }: PasswordInputProps) {
  return (
    <div>
      <label className="block text-xs text-textMuted mb-1.5 font-pixel" style={{ fontSize: '9px' }}>
        {label.toUpperCase()}
      </label>
      <div className="flex items-center bg-surface border border-border rounded-xl px-3 gap-2 focus-within:border-accent transition-colors">
        <span className="text-textMuted flex-shrink-0">
          <Lock size={16} />
        </span>
        <input
          type={show ? 'text' : 'password'}
          placeholder={hint ?? '••••••'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent py-3 text-sm text-textPrimary outline-none placeholder:text-textMuted/50"
        />
        <button
          type="button"
          onClick={onToggle}
          className="text-textMuted flex-shrink-0"
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
