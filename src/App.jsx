import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { supabase } from './lib/supabase';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import BudgetCalculator from './pages/BudgetCalculator';
import EventsExplorer from './pages/EventsExplorer';
import MyTrips from './pages/MyTrips';
import NearbyExplorer from './pages/NearbyExplorer';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import PlanTripPage from './pages/PlanTripPage';
import TransportPage from './pages/TransportPage';
import SafetyPage from './pages/SafetyPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import RailwayExplorer from './pages/RailwayExplorer';
import TripPlanner from './pages/TripPlanner';
import DestinationDetails from './pages/DestinationDetails';
import HotelsFinder from './pages/HotelsFinder';
import AIAssistant from './pages/AIAssistant';
import AuthPage from './pages/AuthPage';

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isAdminAccess = localStorage.getItem('safarai_admin') === 'true';

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;
        setSession(session);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (!isMounted) return;
        setSession(null);
      } finally {
        if (!isMounted) return;
        setAuthLoading(false);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      setSession(session);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={authLoading ? null : session || isAdminAccess ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route
        path="/auth"
        element={authLoading ? null : session || isAdminAccess ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route element={<ProtectedRoute session={session} loading={authLoading} isAdmin={isAdminAccess} />}>
        <Route element={<MainLayout user={session?.user ?? null} authLoading={authLoading} isAdmin={isAdminAccess} />}>
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/nearby" element={<NearbyExplorer />} />
          <Route path="/plan-trip" element={<PlanTripPage />} />
          <Route path="/transport" element={<TransportPage />} />
          <Route path="/railway" element={<RailwayExplorer />} />
          <Route path="/trip-planner" element={<TripPlanner />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/destination/:name" element={<DestinationDetails />} />
          <Route path="/hotels" element={<HotelsFinder />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/budget" element={<BudgetCalculator />} />
          <Route path="/events" element={<EventsExplorer />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;