import React, { useState } from 'react';
import { Dumbbell, ChevronRight, User, Mail, Lock, Weight, Ruler, Percent, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { upsertProfileDb } from '../lib/db';
import { useGymStore } from '../store/gymStore';

type View = 'login' | 'signup-creds' | 'signup-profile';

export default function Onboarding() {
  const { userId, loadUserData } = useGymStore();
  const needsProfile = !!userId;

  const [view, setView] = useState<View>(needsProfile ? 'signup-profile' : 'login');

  // Shared fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Profile fields
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // ── LOGIN ────────────────────────────────────────────────────────────────
  async function handleLogin() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Ingresá tu email';
    if (!password) e.password = 'Ingresá tu contraseña';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setServerError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setServerError('Email o contraseña incorrectos');
    // onAuthStateChange in App.tsx handles the rest
  }

  // ── SIGNUP step 1 → step 2 ───────────────────────────────────────────────
  function handleSignupStep1() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Ingresá tu nombre';
    if (!email.trim() || !email.includes('@')) e.email = 'Email inválido';
    if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setView('signup-profile');
  }

  // ── SIGNUP step 2: create account ────────────────────────────────────────
  async function handleSignupFinish() {
    const e: Record<string, string> = {};
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!weight || isNaN(w) || w < 20 || w > 300) e.weight = 'Peso inválido (20-300 kg)';
    if (!height || isNaN(h) || h < 100 || h > 250) e.height = 'Altura inválida (100-250 cm)';
    if (bodyFat) {
      const bf = parseFloat(bodyFat);
      if (isNaN(bf) || bf < 1 || bf > 60) e.bodyFat = '% grasa inválido (1-60)';
    }
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setServerError('');

    // If user already authenticated (needsProfile), just save profile
    const currentUserId = userId;
    if (currentUserId) {
      await upsertProfileDb(currentUserId, {
        name: name.trim() || 'Usuario',
        email: email || '',
        password: '',
        weight: w,
        height: h,
        bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
        createdAt: new Date().toISOString(),
      });
      await loadUserData(currentUserId);
      setLoading(false);
      return;
    }

    // New user: sign up
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error || !data.user) {
      setServerError(error?.message ?? 'Error al crear cuenta');
      setLoading(false);
      return;
    }

    await upsertProfileDb(data.user.id, {
      name: name.trim(),
      email: email.trim(),
      password: '',
      weight: w,
      height: h,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      createdAt: new Date().toISOString(),
    });

    await loadUserData(data.user.id);
    setLoading(false);
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-accent/10 border border-accent/30 rounded-2xl flex items-center justify-center mb-4">
          <Dumbbell size={32} className="text-accent" />
        </div>
        <h1 className="font-pixel text-accent" style={{ fontSize: '16px' }}>GYM TRACKER</h1>
        <p className="text-textMuted text-sm mt-1">Tu compañero de entrenamiento</p>
      </div>

      {/* Step dots (only for signup) */}
      {(view === 'signup-creds' || view === 'signup-profile') && (
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-1.5 rounded-full bg-accent" />
          <div className={`w-8 h-1.5 rounded-full ${view === 'signup-profile' ? 'bg-accent' : 'bg-surface2'}`} />
        </div>
      )}

      <div className="w-full max-w-sm">

        {/* ── LOGIN ── */}
        {view === 'login' && (
          <div className="space-y-4">
            <h2 className="font-pixel text-textPrimary mb-4" style={{ fontSize: '12px' }}>INICIAR SESIÓN</h2>

            <Field icon={<Mail size={16} />} label="Email" type="email"
              placeholder="tu@email.com" value={email} onChange={setEmail} error={errors.email} />
            <PasswordField label="Contraseña" value={password} onChange={setPassword}
              show={showPass} onToggle={() => setShowPass(!showPass)} error={errors.password} />

            {serverError && <p className="text-red-400 text-xs text-center">{serverError}</p>}

            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-accent text-background font-pixel py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 mt-2"
              style={{ fontSize: '10px' }}>
              {loading ? 'CARGANDO...' : 'ENTRAR'}
            </button>

            <p className="text-center text-textMuted text-sm pt-2">
              ¿No tenés cuenta?{' '}
              <button onClick={() => { setErrors({}); setServerError(''); setView('signup-creds'); }}
                className="text-accent underline">Crear cuenta</button>
            </p>
          </div>
        )}

        {/* ── SIGNUP STEP 1 ── */}
        {view === 'signup-creds' && (
          <div className="space-y-4">
            <h2 className="font-pixel text-textPrimary mb-4" style={{ fontSize: '12px' }}>CREAR CUENTA</h2>

            <Field icon={<User size={16} />} label="Nombre" placeholder="¿Cómo te llamás?"
              value={name} onChange={setName} error={errors.name} />
            <Field icon={<Mail size={16} />} label="Email" type="email"
              placeholder="tu@email.com" value={email} onChange={setEmail} error={errors.email} />
            <PasswordField label="Contraseña" value={password} onChange={setPassword}
              show={showPass} onToggle={() => setShowPass(!showPass)} error={errors.password}
              hint="Mínimo 6 caracteres" />

            {serverError && <p className="text-red-400 text-xs text-center">{serverError}</p>}

            <button onClick={handleSignupStep1}
              className="w-full bg-accent text-background font-pixel py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform mt-2"
              style={{ fontSize: '10px' }}>
              SIGUIENTE <ChevronRight size={16} />
            </button>

            <p className="text-center text-textMuted text-sm pt-2">
              ¿Ya tenés cuenta?{' '}
              <button onClick={() => { setErrors({}); setServerError(''); setView('login'); }}
                className="text-accent underline">Iniciar sesión</button>
            </p>
          </div>
        )}

        {/* ── SIGNUP STEP 2 (profile) ── */}
        {view === 'signup-profile' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-pixel text-textPrimary mb-1" style={{ fontSize: '12px' }}>
                {needsProfile ? 'COMPLETÁ TU PERFIL' : 'TUS MEDIDAS'}
              </h2>
              <p className="text-textMuted text-xs">Para calcular tu progreso con el tiempo</p>
            </div>

            <Field icon={<Weight size={16} />} label="Peso actual" type="number"
              placeholder="70" suffix="kg" value={weight} onChange={setWeight} error={errors.weight} />
            <Field icon={<Ruler size={16} />} label="Altura" type="number"
              placeholder="175" suffix="cm" value={height} onChange={setHeight} error={errors.height} />
            <Field icon={<Percent size={16} />} label="% Grasa corporal" type="number"
              placeholder="Opcional" suffix="%" value={bodyFat} onChange={setBodyFat}
              error={errors.bodyFat} optional />

            {serverError && <p className="text-red-400 text-xs text-center">{serverError}</p>}

            <div className="flex gap-3 mt-2">
              {!needsProfile && (
                <button onClick={() => { setErrors({}); setView('signup-creds'); }}
                  className="flex-1 bg-surface border border-border text-textMuted font-pixel py-3.5 rounded-xl active:scale-95 transition-transform"
                  style={{ fontSize: '10px' }}>
                  ATRÁS
                </button>
              )}
              <button onClick={handleSignupFinish} disabled={loading}
                className="flex-[2] bg-accent text-background font-pixel py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                style={{ fontSize: '10px' }}>
                {loading ? 'GUARDANDO...' : <><Dumbbell size={14} /> EMPEZAR</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Field components ─────────────────────────────────────────────────────────

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  type?: string;
  placeholder?: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: boolean;
}

function Field({ icon, label, type = 'text', placeholder, suffix, value, onChange, error, optional }: FieldProps) {
  return (
    <div>
      <label className="block text-xs text-textMuted mb-1.5 font-pixel" style={{ fontSize: '9px' }}>
        {label.toUpperCase()}
        {optional && <span className="opacity-50 ml-1">(OPCIONAL)</span>}
      </label>
      <div className={`flex items-center bg-surface border rounded-xl px-3 gap-2 transition-colors ${error ? 'border-red-500' : 'border-border focus-within:border-accent'}`}>
        <span className="text-textMuted flex-shrink-0">{icon}</span>
        <input type={type} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent py-3 text-sm text-textPrimary outline-none placeholder:text-textMuted/50" />
        {suffix && <span className="text-textMuted text-xs flex-shrink-0">{suffix}</span>}
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
  hint?: string;
}

function PasswordField({ label, value, onChange, show, onToggle, error, hint }: PasswordFieldProps) {
  return (
    <div>
      <label className="block text-xs text-textMuted mb-1.5 font-pixel" style={{ fontSize: '9px' }}>
        {label.toUpperCase()}
      </label>
      <div className={`flex items-center bg-surface border rounded-xl px-3 gap-2 transition-colors ${error ? 'border-red-500' : 'border-border focus-within:border-accent'}`}>
        <span className="text-textMuted flex-shrink-0"><Lock size={16} /></span>
        <input type={show ? 'text' : 'password'} placeholder={hint ?? '••••••'}
          value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent py-3 text-sm text-textPrimary outline-none placeholder:text-textMuted/50" />
        <button type="button" onClick={onToggle} className="text-textMuted flex-shrink-0">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
