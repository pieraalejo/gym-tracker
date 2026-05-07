# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## App GYM

App de seguimiento de entrenamientos con rutinas, registro de sesiones, métricas corporales y calendario semanal. Frontend React con backend Supabase.

## Comandos

```bash
npm run dev       # Dev server (Vite)
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm run preview   # Preview del build
```

## Variables de Entorno

```
VITE_SUPABASE_URL=
VITE_SUPABASE_KEY=   # anon/public key
```

## Arquitectura

### Estado global — `src/store/gymStore.ts`
Zustand con `persist` middleware. Solo se persiste en localStorage: `activeWorkout`, `restTimerDuration` y `exercises` (para conservar ejercicios custom offline). Todo lo demás (rutinas, logs, perfil) viene de Supabase al hacer login vía `loadUserData(userId)`.

**Patrón de sync:** cada mutación actualiza el store local primero y luego llama a `sync(() => fn())` que ejecuta la operación en Supabase en background sin bloquear la UI.

### Base de datos — `src/lib/db.ts`
Funciones puras de Supabase (sin estado). Tablas: `profiles`, `routines`, `routine_exercises`, `workout_logs`, `exercise_logs`, `set_logs`, `body_measurements`, `weekly_plan`, `custom_exercises`, `rest_days`.

### Días de descanso
`rest_days` (PK compuesta `user_id + date`) guarda los días que el usuario marcó como descanso desde el Dashboard. Funcionan como **puentes** en `getCurrentStreak`: no suman a la racha pero tampoco la rompen. `getBearState` los considera "actividad" para que el oso no se entristezca en días de descanso planificados. Server-authoritative (no se persisten en localStorage).

### Ejercicios
`DEFAULT_EXERCISES` en `src/data/exercises.ts` son los ejercicios built-in (hardcodeados). Al rehydratar localStorage, siempre se reemplazan los built-in con la versión del código y se conservan solo los `isCustom: true`. Al cargar datos de Supabase, los custom exercises del servidor son autoritativos.

### Autenticación
Supabase Auth. El `userId` se guarda en el store. `resetStore()` limpia todo excepto `exercises` (para no perder custom exercises).

### Routing
React Router v7. Rutas en español: `/rutinas`, `/entrenar`, `/calendario`, `/metricas`, `/perfil`. Onboarding en `/`.

### BearAvatar
Mascota oso cuyo estado (`BearState`) refleja el estado de entrenamiento del usuario — calculado por `getBearState()` en el store según días desde último entreno o músculo activo en el workout en curso.
