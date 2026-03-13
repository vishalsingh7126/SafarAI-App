import { Link } from 'react-router-dom';

function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50 px-8 py-10 shadow-xl md:px-14 md:py-12">
      <div className="absolute inset-0 bg-hero-grid bg-[size:18px_18px] opacity-20" />
      <div className="absolute -right-10 -top-14 h-52 w-52 rounded-full bg-brand-200/45 blur-3xl" />
      <div className="absolute -bottom-10 left-1/3 h-44 w-44 rounded-full bg-accent-200/45 blur-3xl" />
      <div className="absolute inset-x-12 top-10 h-40 rounded-full bg-brand-200/35 blur-3xl" />
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-brand-700 sm:text-sm">AI-Powered Travel Planning Platform</p>
        <div className="relative inline-block">
          <div className="absolute inset-x-10 bottom-2 h-10 rounded-full bg-accent-200/60 blur-2xl" />
          <h1 className="display-heading relative text-ink">Plan Smarter Journeys with SafarAI</h1>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-700 sm:text-lg">Discover destinations, plan trips, and travel with confidence.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/trip-planner"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-3 text-white font-semibold shadow-md hover:scale-105 transition-all duration-200"
          >
            Start Planning
          </Link>
          <Link
            to="/explore"
            className="inline-flex items-center justify-center rounded-full border border-brand-300 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50 transition-all duration-200"
          >
            Explore Destinations
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
