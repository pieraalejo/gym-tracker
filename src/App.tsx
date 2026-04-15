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

function App() {
  const userProfile = useGymStore((s) => s.userProfile);

  if (!userProfile) {
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
