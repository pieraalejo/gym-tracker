import React, { useState } from 'react';
import { Dumbbell, ChevronRight, User, Mail, Lock, Weight, Ruler, Percent } from 'lucide-react';
import { useGymStore } from '../store/gymStore';

type Step = 'perfil' | 'medidas';

export default function Onboarding() {
  const setUserProfile = useGymStore((s) => s.setUserProfile);

  const [step, setStep] = useState<Step>('perfil');

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Ingresá tu nombre';
    if (!email.trim() || !email.includes('@')) e.email = 'Email inválido';
    if (password.length < 4) e.password = 'Mínimo 4 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!weight || isNaN(w) || w < 20 || w > 300) e.weight = 'Peso inválido (20-300 kg)';
    if (!height || isNaN(h) || h < 100 || h > 250) e.height = 'Altura inválida (100-250 cm)';
    if (bodyFat) {
      const bf = parseFloat(bodyFat);
      if (isNaN(bf) || bf < 1 || bf > 60) e.bodyFat = '% grasa inválido (1-60%)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleStep1() {
    if (validateStep1()) setStep('medidas');
  }

  function handleFinish() {
    if (!validateStep2()) return;
    setUserProfile({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      weight: parseFloat(weight),
      height: parseFloat(height),
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-accent/10 border border-accent/30 rounded-2xl flex items-center justify-center mb-4">
          <Dumbbell size={32} className="text-accent" />
        </div>
        <h1 className="font-pixel text-accent" style={{ fontSize: '16px' }}>GYM TRACKER</h1>
        <p className="text-textMuted text-sm mt-1">Tu compañero de entrenamiento</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`w-8 h-1.5 rounded-full ${step === 'perfil' ? 'bg-accent' : 'bg-accent'}`} />
        <div className={`w-8 h-1.5 rounded-full ${step === 'medidas' ? 'bg-accent' : 'bg-surface2'}`} />
      </div>

      <div className="w-full max-w-sm">
        {step === 'perfil' ? (
          <div className="space-y-5">
            <div>
              <h2 className="font-pixel text-textPrimary mb-1" style={{ fontSize: '12px' }}>CREAR CUENTA</h2>
              <p className="text-textMuted text-xs">Tus datos se guardan solo en este dispositivo</p>
            </div>

            <Field
              icon={<User size={16} />}
              label="Nombre"
              placeholder="¿Cómo te llamás?"
              value={name}
              onChange={setName}
              error={errors.name}
            />
            <Field
              icon={<Mail size={16} />}
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />
            <Field
              icon={<Lock size={16} />}
              label="Contraseña"
              type="password"
              placeholder="Mínimo 4 caracteres"
              value={password}
              onChange={setPassword}
              error={errors.password}
            />

            <button
              onClick={handleStep1}
              className="w-full bg-accent text-background font-pixel py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform mt-2"
              style={{ fontSize: '10px' }}
            >
              SIGUIENTE
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="font-pixel text-textPrimary mb-1" style={{ fontSize: '12px' }}>TUS MEDIDAS</h2>
              <p className="text-textMuted text-xs">Para calcular tu progreso físico con el tiempo</p>
            </div>

            <Field
              icon={<Weight size={16} />}
              label="Peso actual"
              type="number"
              placeholder="70"
              suffix="kg"
              value={weight}
              onChange={setWeight}
              error={errors.weight}
            />
            <Field
              icon={<Ruler size={16} />}
              label="Altura"
              type="number"
              placeholder="175"
              suffix="cm"
              value={height}
              onChange={setHeight}
              error={errors.height}
            />
            <Field
              icon={<Percent size={16} />}
              label="% Grasa corporal"
              type="number"
              placeholder="Opcional"
              suffix="%"
              value={bodyFat}
              onChange={setBodyFat}
              error={errors.bodyFat}
              optional
            />

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep('perfil')}
                className="flex-1 bg-surface border border-border text-textMuted font-pixel py-3.5 rounded-xl active:scale-95 transition-transform"
                style={{ fontSize: '10px' }}
              >
                ATRÁS
              </button>
              <button
                onClick={handleFinish}
                className="flex-[2] bg-accent text-background font-pixel py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ fontSize: '10px' }}
              >
                EMPEZAR
                <Dumbbell size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
        {optional && <span className="text-textMuted opacity-50 ml-1">(OPCIONAL)</span>}
      </label>
      <div className={`flex items-center bg-surface border rounded-xl px-3 gap-2 transition-colors ${error ? 'border-red-500' : 'border-border focus-within:border-accent'}`}>
        <span className="text-textMuted flex-shrink-0">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent py-3 text-sm text-textPrimary outline-none placeholder:text-textMuted/50"
        />
        {suffix && <span className="text-textMuted text-xs flex-shrink-0">{suffix}</span>}
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
