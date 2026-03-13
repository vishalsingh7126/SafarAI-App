import { useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { foodCultureDatabase } from '../data/foodCultureDatabase';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder-slate-400 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 transition';

function FoodCultureExplorer() {
  usePageMeta(
    'Food & Culture Explorer | SafarAI',
    'Explore local dishes, restaurants, and cultural experiences across destinations with SafarAI.'
  );

  const [destination, setDestination] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [tripItems, setTripItems] = useState({});

  const handleSearch = () => {
    setHasSearched(true);
  };

  const filteredItems = useMemo(() => {
    if (!hasSearched) return [];

    const query = destination.trim().toLowerCase();
    if (!query) return foodCultureDatabase;

    return foodCultureDatabase.filter((item) => item.city.toLowerCase().includes(query));
  }, [hasSearched, destination]);

  const handleAddToTrip = (id) => {
    setTripItems((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Food &amp; Culture Explorer</h1>
        <p className="mt-2 text-slate-600">Explore local dishes, restaurants, and cultural experiences.</p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-xs font-bold text-white shadow-md">
            FC
          </div>
          <h2 className="text-xl font-bold text-ink">Find Food &amp; Culture</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Destination / City"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleSearch}
            className="interactive rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
          >
            Search
          </button>
        </div>
      </section>

      {!hasSearched && (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white/50 p-10 text-center">
          <p className="text-3xl">🍽️</p>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Enter a destination and click <span className="text-brand-700">Search</span> to discover local experiences.
          </p>
        </div>
      )}

      {hasSearched && (
        <section className="space-y-4">
          <p className="text-sm font-semibold text-slate-600">
            {filteredItems.length > 0
              ? `${filteredItems.length} food & culture spot${filteredItems.length !== 1 ? 's' : ''} found`
              : 'No food & culture spots match your search'}
          </p>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white/50 p-10 text-center">
              <p className="text-3xl">🗺️</p>
              <p className="mt-3 text-sm font-semibold text-slate-500">Try another city like Goa, Delhi, or Jaipur.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => {
                const isAdded = Boolean(tripItems[item.id]);
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place)}`;

                return (
                  <article
                    key={item.id}
                    className="interactive group rounded-2xl border border-brand-100 bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-ink">{item.dish}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{item.place}</p>
                      </div>
                      <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                        {item.city}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">{item.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-brand-50 pt-4">
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="interactive rounded-full border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-brand-300 hover:bg-brand-50"
                      >
                        View Location
                      </a>
                      <button
                        type="button"
                        onClick={() => handleAddToTrip(item.id)}
                        className={`interactive rounded-full px-3 py-2 text-xs font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
                          isAdded
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gradient-to-r from-brand-600 to-accent-600 text-white'
                        }`}
                      >
                        {isAdded ? 'Added to Trip' : 'Add to Trip'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default FoodCultureExplorer;
