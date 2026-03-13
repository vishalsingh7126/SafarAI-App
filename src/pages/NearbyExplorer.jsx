import { useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';

const CATEGORY_OPTIONS = ['Attractions', 'Restaurants', 'Hotels', 'Cafes'];

const PLACE_DATA = {
  goa: [
    {
      name: 'Baga Beach',
      category: 'Attractions',
      description: 'Popular beach with water sports, nightlife, and lively local markets.',
    },
    {
      name: 'Fort Aguada',
      category: 'Attractions',
      description: 'Historic Portuguese fort with sea views and scenic sunset points.',
    },
    {
      name: 'Cafe Mambo',
      category: 'Cafes',
      description: 'Beachside cafe known for music, bites, and late-evening ambience.',
    },
  ],
  delhi: [
    {
      name: 'Red Fort',
      category: 'Attractions',
      description: 'Iconic Mughal-era fort complex with museums and architecture.',
    },
    {
      name: 'India Gate',
      category: 'Attractions',
      description: 'Landmark war memorial surrounded by gardens and evening food stalls.',
    },
    {
      name: 'Chandni Chowk',
      category: 'Restaurants',
      description: 'Historic market lane famous for authentic street food and old-city vibes.',
    },
  ],
  mumbai: [
    {
      name: 'Gateway of India',
      category: 'Attractions',
      description: 'Waterfront monument and city icon with ferry access and photo spots.',
    },
    {
      name: 'Marine Drive',
      category: 'Attractions',
      description: 'Scenic seaside promenade perfect for evening walks and city views.',
    },
    {
      name: 'Leopold Cafe',
      category: 'Cafes',
      description: 'Historic cafe in Colaba known for global travelers and classic ambience.',
    },
  ],
};

function NearbyExplorer() {
  usePageMeta(
    'Nearby Places Explorer | SafarAI',
    'Discover nearby attractions, restaurants, hotels, and cafes in your destination with SafarAI.'
  );

  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState('Attractions');
  const [searchedDestination, setSearchedDestination] = useState('');

  const places = useMemo(() => {
    const key = searchedDestination.trim().toLowerCase();
    const allPlaces = PLACE_DATA[key] || [];
    return allPlaces.filter((place) => place.category === category);
  }, [searchedDestination, category]);

  const handleSearch = () => {
    setSearchedDestination(destination);
  };

  const hasSearch = searchedDestination.trim().length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Nearby Places Explorer</h1>
        <p className="mt-2 text-slate-600">Allow users to discover nearby places in a destination.</p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3 md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Destination
            </label>
            <input
              type="text"
              placeholder="e.g. Goa, Delhi, Mumbai"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-xl border border-brand-100 bg-white/80 px-4 py-2.5 text-sm text-ink placeholder-slate-400 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-brand-100 bg-white/80 px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSearch}
          disabled={!destination.trim()}
          className="interactive mt-5 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-2.5 text-sm font-semibold text-white shadow-float hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Search Places
        </button>
      </section>

      {hasSearch && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Results</h2>
            <p className="text-sm text-slate-500">
              {category} near <span className="font-semibold text-brand-700">{searchedDestination.trim()}</span>
            </p>
          </div>

          {places.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white/50 p-8 text-center">
              <p className="text-sm font-semibold text-slate-500">
                No mock places found for this destination and category.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place) => (
                <article
                  key={place.name}
                  className="interactive rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-panel hover:-translate-y-1 hover:shadow-float"
                >
                  <h3 className="text-base font-bold text-ink">{place.name}</h3>
                  <p className="mt-1 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
                    {place.category}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{place.description}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default NearbyExplorer;
