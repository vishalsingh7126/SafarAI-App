import { useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { cities, hotelsDatabase } from '../data/hotelsDatabase';

const AMENITY_LABELS = {
  wifi: 'Free WiFi',
  pool: 'Pool',
  breakfast: 'Breakfast Included',
  parking: 'Parking',
};

const AMENITY_ICONS = {
  wifi: '📶',
  pool: '🏊',
  breakfast: '🍳',
  parking: '🅿️',
};

const TIER_LABELS = {
  budget: 'Budget',
  standard: 'Standard',
  luxury: 'Luxury',
};

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-slate-200'}>
          ★
        </span>
      ))}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder-slate-400 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 transition';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500';

function FilterCheckbox({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded accent-brand-600"
      />
      {label}
    </label>
  );
}

function HotelsFinderPage() {
  usePageMeta('Hotels & Stay Finder | SafarAI', 'Search and discover hotels across popular Indian destinations with SafarAI.');

  // Search inputs
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [tiers, setTiers] = useState({ budget: false, standard: false, luxury: false });
  const [ratings, setRatings] = useState({ 3: false, 4: false, 5: false });
  const [amenities, setAmenities] = useState({ wifi: false, pool: false, breakfast: false, parking: false });

  const toggleTier = (key) => setTiers((p) => ({ ...p, [key]: !p[key] }));
  const toggleRating = (key) => setRatings((p) => ({ ...p, [key]: !p[key] }));
  const toggleAmenity = (key) => setAmenities((p) => ({ ...p, [key]: !p[key] }));

  const handleSearch = () => setHasSearched(true);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut) - new Date(checkIn);
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  }, [checkIn, checkOut]);

  const results = useMemo(() => {
    if (!hasSearched) return [];

    const activeTiers = Object.keys(tiers).filter((k) => tiers[k]);
    const activeRatings = Object.keys(ratings).filter((k) => ratings[k]).map(Number);
    const activeAmenities = Object.keys(amenities).filter((k) => amenities[k]);

    return hotelsDatabase.filter((hotel) => {
      if (city.trim() && hotel.city.toLowerCase() !== city.trim().toLowerCase()) return false;
      if (activeTiers.length && !activeTiers.includes(hotel.tier)) return false;
      if (activeRatings.length && !activeRatings.includes(hotel.rating)) return false;
      if (activeAmenities.length && !activeAmenities.every((a) => hotel.amenities.includes(a))) return false;
      return true;
    });
  }, [hasSearched, city, tiers, ratings, amenities]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">Hotels &amp; Stay Finder</h1>
        <p className="mt-2 text-slate-600">Discover the best places to stay during your trip.</p>
      </div>

      {/* Search Section */}
      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-xs font-bold text-white shadow-md">
            HS
          </div>
          <h2 className="text-xl font-bold text-ink">Search Hotels</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelClass}>Destination / City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Check-in Date</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Check-out Date</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || undefined}
              onChange={(e) => setCheckOut(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Guests</label>
            <select value={guests} onChange={(e) => setGuests(e.target.value)} className={inputClass}>
              {Array.from({ length: 8 }, (_, i) => String(i + 1)).map((n) => (
                <option key={n} value={n}>{n} Guest{n !== '1' ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className="interactive mt-5 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
        >
          Search Hotels
        </button>
      </section>

      {/* Results + Filters */}
      {hasSearched && (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filter Panel */}
          <aside className="space-y-5 rounded-2xl border border-brand-100 bg-white p-5 shadow-xl self-start">
            <h3 className="text-sm font-bold text-ink">Filters</h3>

            <div>
              <p className={labelClass}>Price Range</p>
              <div className="space-y-2.5 mt-1">
                {Object.keys(TIER_LABELS).map((key) => (
                  <FilterCheckbox
                    key={key}
                    id={`tier-${key}`}
                    checked={tiers[key]}
                    onChange={() => toggleTier(key)}
                    label={TIER_LABELS[key]}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-brand-50 pt-4">
              <p className={labelClass}>Hotel Rating</p>
              <div className="space-y-2.5 mt-1">
                {[5, 4, 3].map((r) => (
                  <FilterCheckbox
                    key={r}
                    id={`rating-${r}`}
                    checked={ratings[r]}
                    onChange={() => toggleRating(r)}
                    label={`${r}★ and above`}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-brand-50 pt-4">
              <p className={labelClass}>Amenities</p>
              <div className="space-y-2.5 mt-1">
                {Object.keys(AMENITY_LABELS).map((key) => (
                  <FilterCheckbox
                    key={key}
                    id={`amenity-${key}`}
                    checked={amenities[key]}
                    onChange={() => toggleAmenity(key)}
                    label={AMENITY_LABELS[key]}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* Hotel Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">
                {results.length > 0
                  ? `${results.length} hotel${results.length !== 1 ? 's' : ''} found${city ? ` in ${city}` : ''}`
                  : 'No hotels match your filters'}
              </p>
              {checkIn && checkOut && nights > 0 && (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {nights} night{nights !== 1 ? 's' : ''} · {guests} guest{guests !== '1' ? 's' : ''}
                </span>
              )}
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-200 bg-white/50 p-10 text-center">
                <p className="text-3xl">🏨</p>
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No hotels match the selected filters. Try adjusting your search.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                {results.map((hotel) => {
                  const totalCost = nights > 0 ? hotel.pricePerNight * nights : null;
                  return (
                    <article
                      key={hotel.id}
                      className="interactive group rounded-2xl border border-brand-100 bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="truncate text-base font-bold text-ink">{hotel.name}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{hotel.city}</p>
                        </div>
                        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          hotel.tier === 'luxury'
                            ? 'bg-amber-50 text-amber-700'
                            : hotel.tier === 'standard'
                            ? 'bg-brand-50 text-brand-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {TIER_LABELS[hotel.tier]}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <StarRating rating={hotel.rating} />
                        <span className="text-xs text-slate-500">{hotel.rating}-star hotel</span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">{hotel.description}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {hotel.amenities.map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-100 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
                          >
                            {AMENITY_ICONS[a]} {AMENITY_LABELS[a]}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-brand-50 pt-4">
                        <div>
                          <p className="text-xs text-slate-500">Per night</p>
                          <p className="text-xl font-bold text-ink">
                            ₹{hotel.pricePerNight.toLocaleString('en-IN')}
                          </p>
                          {totalCost && (
                            <p className="text-xs text-slate-500">
                              ₹{totalCost.toLocaleString('en-IN')} total · {nights} night{nights !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="interactive rounded-full border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-brand-300 hover:bg-brand-50"
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            className="interactive rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
                          >
                            Book Stay
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pre-search empty state */}
      {!hasSearched && (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white/50 p-10 text-center">
          <p className="text-3xl">🏨</p>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Select a destination above and click <span className="text-brand-700">Search Hotels</span> to find available stays.
          </p>
        </div>
      )}
    </div>
  );
}

export default HotelsFinderPage;
