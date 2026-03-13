import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TravelAssistantChat from '../components/TravelAssistantChat';

function MainLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 md:pt-8 lg:px-8">
        <Outlet />
      </main>
      <Footer />
      {location.pathname !== '/assistant' && <TravelAssistantChat />}
    </div>
  );
}

export default MainLayout;
