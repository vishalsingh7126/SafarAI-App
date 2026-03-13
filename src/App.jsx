import { Navigate, Route, Routes } from 'react-router-dom';
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
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;