import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AuthProvider } from './context/AuthContext';
import { AssistantProvider } from './context/AssistantContext';
import RouteFallback from './components/RouteFallback';

/**
 * The landing page ships in the main bundle (it is the most common entry
 * point); every other route is code-split so first paint stays fast.
 */
import HomePage from './pages/HomePage';

const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const WorldExplorer = lazy(() => import('./pages/WorldExplorer'));
const NearbyExplorer = lazy(() => import('./pages/NearbyExplorer'));
const PlanTripPage = lazy(() => import('./pages/PlanTripPage'));
const TransportPage = lazy(() => import('./pages/TransportPage'));
const SafetyPage = lazy(() => import('./pages/SafetyPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RailwayExplorer = lazy(() => import('./pages/RailwayExplorer'));
const TripPlanner = lazy(() => import('./pages/TripPlanner'));
const MyTrips = lazy(() => import('./pages/MyTrips'));
const DestinationDetails = lazy(() => import('./pages/DestinationDetails'));
const HotelsFinder = lazy(() => import('./pages/HotelsFinder'));
const FoodCultureExplorer = lazy(() => import('./pages/FoodCultureExplorer'));
const BudgetCalculator = lazy(() => import('./pages/BudgetCalculator'));
const EventsExplorer = lazy(() => import('./pages/EventsExplorer'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <WorkspaceProvider>
          <AuthProvider>
            <AssistantProvider>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/world" element={<WorldExplorer />} />
                    <Route path="/nearby" element={<NearbyExplorer />} />
                    <Route path="/plan-trip" element={<PlanTripPage />} />
                    <Route path="/transport" element={<TransportPage />} />
                    <Route path="/railway" element={<RailwayExplorer />} />
                    <Route path="/trip-planner" element={<TripPlanner />} />
                    <Route path="/my-trips" element={<MyTrips />} />
                    <Route path="/destination/:name" element={<DestinationDetails />} />
                    <Route path="/hotels" element={<HotelsFinder />} />
                    <Route path="/food-culture" element={<FoodCultureExplorer />} />
                    <Route path="/assistant" element={<AIAssistant />} />
                    <Route path="/safety" element={<SafetyPage />} />
                    <Route path="/budget" element={<BudgetCalculator />} />
                    <Route path="/events" element={<EventsExplorer />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </Suspense>
            </AssistantProvider>
          </AuthProvider>
        </WorkspaceProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
