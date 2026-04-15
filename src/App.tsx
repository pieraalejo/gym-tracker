import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Routines from './pages/Routines';
import WorkoutLogger from './pages/WorkoutLogger';
import Metrics from './pages/Metrics';
import BearPreview from './pages/BearPreview';
import Calendar from './pages/Calendar';
import Onboarding from './pages/Onboarding';
import { useGymStore } from './store/gymStore';
import { supabase } from './lib/supabase';

function App() {
  const { loadUserData, resetStore, isLoading, userProfile, userId } = useGymStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Use onAuthStateChange exclusively — it fires INITIAL_SESSION on mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          resetStore();
        }
        // Mark auth as resolved after the initial state is known
        if (event === 'INITIAL_SESSION') {
          setAuthChecked(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="font-pixel text-textMuted" style={{ fontSize: '9px' }}>CARGANDO...</p>
      </div>
    );
  }

  if (!userId || !userProfile?.name) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/rutinas"     element={<Routines />} />
          <Route path="/entrenar"    element={<WorkoutLogger />} />
          <Route path="/calendario"  element={<Calendar />} />
          <Route path="/metricas"    element={<Metrics />} />
          <Route path="/bears"       element={<BearPreview />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
