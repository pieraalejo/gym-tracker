import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Routines from './pages/Routines';
import WorkoutLogger from './pages/WorkoutLogger';
import Onboarding from './pages/Onboarding';
import { useGymStore } from './store/gymStore';
import { supabase } from './lib/supabase';

const Metrics = lazy(() => import('./pages/Metrics'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Profile = lazy(() => import('./pages/Profile'));
const BearPreview = lazy(() => import('./pages/BearPreview'));

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const loadUserData = useGymStore((s) => s.loadUserData);
  const resetStore = useGymStore((s) => s.resetStore);
  const isLoading = useGymStore((s) => s.isLoading);
  const userId = useGymStore((s) => s.userId);
  const userProfileName = useGymStore((s) => s.userProfile?.name);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // getSession() reads from local cache — nearly instant, no network needed
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id); // fire and forget — has 8s timeout built in
      }
      setAuthChecked(true);
    });

    // Listen for future auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          resetStore();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData, resetStore]);

  // Show spinner while: auth unknown, OR user is authenticated but profile still loading
  if (!authChecked || (userId && !userProfileName && isLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="font-pixel text-textMuted" style={{ fontSize: '9px' }}>CARGANDO...</p>
      </div>
    );
  }

  if (!userId || !userProfileName) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/rutinas"     element={<Routines />} />
            <Route path="/entrenar"    element={<WorkoutLogger />} />
            <Route path="/calendario"  element={<Calendar />} />
            <Route path="/metricas"    element={<Metrics />} />
            <Route path="/perfil"      element={<Profile />} />
            <Route path="/bears"       element={<BearPreview />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
