import { Link } from 'react-router-dom';
import { modules } from '../data/modules';

function FeatureCards() {
  return (
    <section className="space-y-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Feature Highlights</h2>
        <p className="text-sm text-slate-600">{modules.length} core modules</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <article
            key={module.id}
            className="interactive group rounded-2xl border border-brand-100 bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-xs font-bold text-white shadow-md transition-all duration-200 group-hover:scale-105">
                {module.code}
              </div>
              <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                Module
              </span>
            </div>
            <h3 className="text-base font-semibold text-ink">{module.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{module.description}</p>
            <Link
              to={module.route}
              className="interactive mt-4 inline-block text-sm font-semibold text-brand-700 transition-all duration-200 hover:scale-[1.02] hover:text-accent-700"
            >
              Explore module
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeatureCards;
