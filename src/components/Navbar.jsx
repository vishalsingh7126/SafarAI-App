import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/nearby', label: 'Nearby' },
  { to: '/trip-planner', label: 'Trip Planner' },
  { to: '/my-trips', label: 'My Trips' },
  { to: '/railway', label: 'Railway' },
  { to: '/safety', label: 'Safety' },
  { to: '/community', label: 'Community' },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-brand-100/80 bg-white/85 shadow-lg backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-4 px-4 py-3 md:px-6 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <NavLink to="/" className="justify-self-start">
          <BrandLogo />
        </NavLink>

        <ul className="mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-semibold text-brand-900 sm:gap-x-6">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `interactive rounded-full px-3 py-2 transition-all duration-200 hover:scale-[1.02] ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-lg'
                      : 'text-brand-900 hover:bg-white/80 hover:text-brand-600'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="justify-self-center sm:justify-self-end">
          <Link
            to="/auth"
            className="interactive inline-flex rounded-full border border-brand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-brand-700 shadow-md transition-all duration-200 hover:scale-[1.02] hover:border-brand-300 hover:bg-white hover:text-brand-600"
          >
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
