import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListChecks, Dumbbell, BarChart2, CalendarDays, User } from 'lucide-react';
import { useGymStore } from '../store/gymStore';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeWorkout = useGymStore((s) => s.activeWorkout);

  return (
    <div className="flex flex-col min-h-screen bg-background text-textPrimary">

      <main className="flex-1 overflow-auto pb-20">{children}</main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50"
        aria-label="Navegación principal"
      >
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1" style={{ gap: 0 }}>
          <NavLink
            to="/"
            end
            aria-label="Inicio"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <Home size={22} aria-hidden="true" />
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              INICIO
            </span>
          </NavLink>

          <NavLink
            to="/rutinas"
            aria-label="Rutinas"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <ListChecks size={22} aria-hidden="true" />
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              RUTINAS
            </span>
          </NavLink>

          <NavLink
            to="/entrenar"
            aria-label={activeWorkout ? 'Entrenar (sesión activa)' : 'Entrenar'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors relative ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <div className="relative">
              <Dumbbell size={22} aria-hidden="true" />
              {activeWorkout && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              ENTRENAR
            </span>
          </NavLink>

          <NavLink
            to="/calendario"
            aria-label="Plan semanal"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <CalendarDays size={22} aria-hidden="true" />
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              PLAN
            </span>
          </NavLink>

          <NavLink
            to="/metricas"
            aria-label="Métricas"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <BarChart2 size={22} aria-hidden="true" />
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              METRICAS
            </span>
          </NavLink>

          <NavLink
            to="/perfil"
            aria-label="Perfil"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <User size={22} aria-hidden="true" />
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              PERFIL
            </span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
