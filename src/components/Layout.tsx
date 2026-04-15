import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListChecks, Dumbbell, BarChart2, CalendarDays } from 'lucide-react';
import { useGymStore } from '../store/gymStore';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeWorkout = useGymStore((s) => s.activeWorkout);

  return (
    <div className="flex flex-col min-h-screen bg-background text-textPrimary">
      <main className="flex-1 overflow-auto pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <Home size={22} />
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              INICIO
            </span>
          </NavLink>

          <NavLink
            to="/rutinas"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <ListChecks size={22} />
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              RUTINAS
            </span>
          </NavLink>

          <NavLink
            to="/entrenar"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors relative ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <div className="relative">
              <Dumbbell size={22} />
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
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <CalendarDays size={22} />
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              PLAN
            </span>
          </NavLink>

          <NavLink
            to="/metricas"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-textMuted'
              }`
            }
          >
            <BarChart2 size={22} />
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              METRICAS
            </span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
