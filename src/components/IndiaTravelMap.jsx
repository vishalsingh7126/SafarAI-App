import { useMemo, useState } from 'react';

const regionData = {
  North: ['Manali', 'Shimla', 'Leh Ladakh'],
  South: ['Kerala', 'Goa', 'Hampi'],
  East: ['Darjeeling', 'Gangtok', 'Kolkata'],
  West: ['Jaipur', 'Udaipur', 'Jaisalmer'],
  Central: ['Khajuraho', 'Bhopal', 'Pachmarhi'],
  'North-East': ['Shillong', 'Tawang', 'Kaziranga'],
};

const regionTone = {
  North: 'from-brand-600 to-brand-700',
  South: 'from-accent-600 to-accent-700',
  East: 'from-sky-500 to-sky-600',
  West: 'from-indigo-500 to-indigo-600',
  Central: 'from-cyan-500 to-cyan-600',
  'North-East': 'from-violet-500 to-violet-600',
};

const regionLayout = [
  { key: 'North', classes: 'col-span-2 row-span-1' },
  { key: 'North-East', classes: 'col-span-1 row-span-1' },
  { key: 'West', classes: 'col-span-1 row-span-1' },
  { key: 'Central', classes: 'col-span-1 row-span-1' },
  { key: 'East', classes: 'col-span-1 row-span-1' },
  { key: 'South', classes: 'col-span-3 row-span-1' },
];

function IndiaTravelMap() {
  const [activeRegion, setActiveRegion] = useState('North');

  const destinations = useMemo(() => regionData[activeRegion] ?? [], [activeRegion]);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">Explore India by Map</h2>
        <p className="mt-1 text-sm text-slate-600 md:text-base">Click a region to discover destinations.</p>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-white via-mist to-brand-50 p-4 shadow-xl md:p-6">
        <div className="grid gap-3 rounded-2xl bg-white/70 p-3 md:grid-cols-2 xl:grid-cols-3 sm:grid-rows-4 sm:p-4">
          {regionLayout.map((region) => {
            const isActive = activeRegion === region.key;
            return (
              <button
                key={region.key}
                type="button"
                onClick={() => setActiveRegion(region.key)}
                className={`interactive ${region.classes} relative min-h-16 rounded-xl border px-4 py-3 text-left shadow-md transition-all duration-200 hover:scale-105 sm:min-h-20 ${
                  isActive
                    ? `bg-gradient-to-br ${regionTone[region.key]} ring-2 ring-brand-500 border-transparent text-white shadow-xl`
                    : 'border-brand-100 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                <span className="text-sm font-semibold sm:text-base">{region.key}</span>
                <span
                  className={`mt-1 block text-xs ${
                    isActive ? 'text-white/90' : 'text-slate-500'
                  }`}
                >
                  {regionData[region.key].length} top destinations
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-brand-100 bg-white p-4 shadow-lg md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-ink md:text-xl">{activeRegion} India</h3>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {destinations.length} destinations
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <article
                key={destination}
                className="interactive rounded-xl border border-brand-100 bg-mist p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:bg-white hover:shadow-lg"
              >
                <p className="text-base font-semibold text-ink">{destination}</p>
                <p className="mt-1 text-sm text-slate-600">Popular in {activeRegion.toLowerCase()} region itineraries.</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default IndiaTravelMap;
