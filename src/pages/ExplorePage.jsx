import { useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { foodCultureDatabase } from '../data/foodCultureDatabase';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder-slate-400 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 transition';

function PlaceholderSection({ title, subtitle }) {
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
          Coming Soon
        </span>
      </div>
      <div className="rounded-2xl border border-dashed border-brand-200 bg-gradient-to-br from-brand-50/50 via-white to-accent-50/40 p-8 text-center">
        <p className="text-sm font-semibold text-slate-500">This discovery module will appear here soon.</p>
      </div>
    </section>
  );
}

function ExplorePage() {
  usePageMeta('Explore | SafarAI', 'Discover destinations, food, events, and local stories with SafarAI.');

  const [destinationSearch, setDestinationSearch] = useState('');
  const [foodCity, setFoodCity] = useState('');
  const [hasSearchedFood, setHasSearchedFood] = useState(false);
  const [tripItems, setTripItems] = useState({});

  const handleFoodSearch = () => {
    setHasSearchedFood(true);
  };

  const filteredFoodItems = useMemo(() => {
    if (!hasSearchedFood) return [];

    const query = foodCity.trim().toLowerCase();
    if (!query) return foodCultureDatabase;

    return foodCultureDatabase.filter((item) => item.city.toLowerCase().includes(query));
  }, [hasSearchedFood, foodCity]);

  const handleAddToTrip = (id) => {
    setTripItems((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-ink">Destination Explorer</h1>
        <p className="mt-2 text-slate-600">
          Starter page for destination insights, events discovery, food and culture guides, and local recommendations.
        </p>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-xs font-bold text-white shadow-md">
            DE
          </div>
          <h2 className="text-xl font-bold text-ink">Find Destinations</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={destinationSearch}
            onChange={(event) => setDestinationSearch(event.target.value)}
            placeholder="Destination / City"
            className={inputClass}
          />
          <button
            type="button"
            className="interactive rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
          >
            Search
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-ink">Food &amp; Culture Explorer</h2>
          <p className="mt-1 text-sm text-slate-600">
            Explore local dishes, restaurants, and cultural experiences.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={foodCity}
            onChange={(event) => setFoodCity(event.target.value)}
            placeholder="Destination / City"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleFoodSearch}
            className="interactive rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
          >
            Search
          </button>
        </div>

        {!hasSearchedFood && (
          <div className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-white/60 p-8 text-center">
            <p className="text-sm font-semibold text-slate-500">
              Enter a destination and click Search to discover local experiences.
            </p>
          </div>
        )}

        {hasSearchedFood && (
          <div className="mt-5 space-y-4">
            <p className="text-sm font-semibold text-slate-600">
              {filteredFoodItems.length > 0
                ? `${filteredFoodItems.length} food & culture spot${filteredFoodItems.length !== 1 ? 's' : ''} found`
                : 'No food & culture spots match your search'}
            </p>

            {filteredFoodItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-200 bg-white/60 p-8 text-center">
                <p className="text-sm font-semibold text-slate-500">Try another city like Goa, Delhi, or Jaipur.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredFoodItems.map((item) => {
                  const isAdded = Boolean(tripItems[item.id]);
                  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place)}`;

                  return (
                    <article
                      key={item.id}
                      className="interactive rounded-2xl border border-brand-100 bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
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
                          View on Map
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
          </div>
        )}
      </section>

      <PlaceholderSection
        title="Events & Activities"
        subtitle="Discover local happenings, festivals, and curated destination activities."
      />
      <PlaceholderSection
        title="Hotels & Stay"
        subtitle="Compare stays, amenities, and neighborhood options for your travel style."
      />
      <PlaceholderSection
        title="Nearby Attractions"
        subtitle="Find must-visit spots, hidden gems, and quick detours near your destination."
      />
    </div>
  );
}

export default ExplorePage;
