import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListChecks, Dumbbell, BarChart2, CalendarDays, LogOut, User } from 'lucide-react';
import { useGymStore } from '../store/gymStore';
import { supabase } from '../lib/supabase';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeWorkout = useGymStore((s) => s.activeWorkout);
  const userProfile = useGymStore((s) => s.userProfile);
  const [showMenu, setShowMenu] = useState(false);

  async function handleLogout() {
    setShowMenu(false);
    await supabase.auth.signOut();
    // resetStore is called by onAuthStateChange in App.tsx
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-textPrimary">
      {/* Profile menu overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowMenu(false)}>
          <div className="bg-surface border-t border-border rounded-t-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                <User size={18} className="text-accent" />
              </div>
              <div>
                <p className="text-textPrimary font-semibold text-sm">{userProfile?.name}</p>
                <p className="text-textMuted text-xs">{userProfile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-3 text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut size={18} />
              <span className="font-pixel" style={{ fontSize: '10px' }}>CERRAR SESIÓN</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1" style={{ gap: 0 }}>
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

          <button
            onClick={() => setShowMenu(true)}
            className="flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors text-textMuted hover:text-textPrimary"
          >
            <User size={22} />
            <span className="text-xs font-pixel" style={{ fontSize: '8px' }}>
              PERFIL
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
