import { NavLink } from 'react-router-dom';

const quickLinks = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/plan-trip', label: 'Plan Trip' },
  { to: '/safety', label: 'Safety' },
  { to: '/community', label: 'Community' },
];

function Footer() {
  return (
    <footer className="mt-20 bg-brand-900 text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <section>
          <p className="brand-title text-lg font-bold text-white">SafarAI</p>
          <p className="text-sm font-medium text-brand-200">Travel Smart. Travel Safe.</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-brand-100/80">AI-guided travel planning for safer, smarter, and richer journeys with destination intelligence, itinerary tools, and railway-focused travel assistance.</p>
        </section>

        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-100">Quick Links</p>
          <ul className="mt-3 space-y-2">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <NavLink className="interactive text-sm text-brand-100/80 transition-colors duration-200 hover:text-white" to={link.to}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-100">Social</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button className="interactive inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-white/10">in</button>
            <button className="interactive inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-white/10">X</button>
            <button className="interactive inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-white/10">IG</button>
          </div>
          <p className="mt-4 text-sm text-brand-100/70">Follow SafarAI for product updates, destination inspiration, and smarter travel tools.</p>
        </section>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-white/70">
        © 2026 SafarAI • A TravelCore Product
      </div>
    </footer>
  );
}

export default Footer;
