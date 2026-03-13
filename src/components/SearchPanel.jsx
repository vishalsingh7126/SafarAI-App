import { useMemo, useState } from 'react';

const tripTypeOptions = ['Adventure', 'Relaxation', 'Cultural', 'Budget', 'Luxury'];

const initialPreferences = {
  safetyPriority: true,
  foodExploration: true,
  localCulture: true,
  fastTransport: false,
  budgetFriendly: true,
};

function PreferenceToggle({ label, enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`interactive flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
        enabled
          ? 'border-brand-300 bg-brand-50 text-brand-800 shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:shadow-md'
      }`}
      aria-pressed={enabled}
    >
      <span>{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          enabled ? 'bg-brand-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

function SearchPanel() {
  const [destination, setDestination] = useState('Bali, Indonesia');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState('2');
  const [tripType, setTripType] = useState('Adventure');
  const [budget, setBudget] = useState(2200);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [showResult, setShowResult] = useState(false);

  const selectedPreferences = useMemo(
    () =>
      Object.entries(preferences)
        .filter(([, isEnabled]) => isEnabled)
        .map(([key]) =>
          key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (char) => char.toUpperCase())
        ),
    [preferences]
  );

  const onGeneratePlan = () => {
    setShowResult(true);
  };

  const togglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <section className="mx-auto w-full rounded-2xl border border-brand-100 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl md:px-8 md:py-8">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Trip Planning Command Center</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink md:text-3xl">Trip Planning Command Center</h2>
        <p className="mt-2 text-sm text-slate-600 md:text-base">Plan your journey before generating the itinerary.</p>
      </header>

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Destination</span>
          <input
            className="interactive w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="Where do you want to go?"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Start date</span>
          <input
            type="date"
            className="interactive w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">End date</span>
          <input
            type="date"
            className="interactive w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Number of travelers</span>
          <select
            className="interactive w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            value={travelers}
            onChange={(event) => setTravelers(event.target.value)}
          >
            {Array.from({ length: 10 }, (_, index) => {
              const value = String(index + 1);
              return (
                <option key={value} value={value}>
                  {value}
                </option>
              );
            })}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Trip type</span>
          <select
            className="interactive w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            value={tripType}
            onChange={(event) => setTripType(event.target.value)}
          >
            {tripTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Budget</span>
            <span className="text-xs font-semibold text-brand-700">${budget}</span>
          </div>
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value))}
            className="accent-brand-700"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>$100</span>
            <span>$5000</span>
          </div>
        </label>
      </div>

      <section className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">Travel Preferences</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <PreferenceToggle
            label="Safety priority"
            enabled={preferences.safetyPriority}
            onToggle={() => togglePreference('safetyPriority')}
          />
          <PreferenceToggle
            label="Food exploration"
            enabled={preferences.foodExploration}
            onToggle={() => togglePreference('foodExploration')}
          />
          <PreferenceToggle
            label="Local culture"
            enabled={preferences.localCulture}
            onToggle={() => togglePreference('localCulture')}
          />
          <PreferenceToggle
            label="Fast transport"
            enabled={preferences.fastTransport}
            onToggle={() => togglePreference('fastTransport')}
          />
          <PreferenceToggle
            label="Budget friendly"
            enabled={preferences.budgetFriendly}
            onToggle={() => togglePreference('budgetFriendly')}
          />
        </div>
      </section>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onGeneratePlan}
          className="interactive w-full rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl md:w-auto"
        >
          Generate Smart Travel Plan
        </button>
      </div>

      {showResult && (
        <section className="mt-8 grid gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-5 shadow-lg md:grid-cols-3 md:p-6">
          <article className="rounded-2xl border border-brand-100 bg-white p-5 shadow-lg md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Destination Overview</p>
            <h4 className="mt-2 text-2xl font-bold text-ink">{destination || 'Your selected destination'}</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Curated for a {tripType.toLowerCase()} experience with {travelers} traveler{travelers === '1' ? '' : 's'} and balanced planning signals.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <li className="rounded-xl bg-mist px-3 py-2">Sunrise viewpoint walk</li>
              <li className="rounded-xl bg-mist px-3 py-2">Local street food trail</li>
              <li className="rounded-xl bg-mist px-3 py-2">Cultural heritage district tour</li>
              <li className="rounded-xl bg-mist px-3 py-2">Signature evening event</li>
            </ul>
          </article>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Estimated Budget</p>
              <p className="mt-1 text-xl font-bold text-ink">${budget}</p>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Estimated Duration</p>
              <p className="mt-1 text-xl font-bold text-ink">6 Days / 5 Nights</p>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Suggested Highlights</p>
              <p className="mt-1 text-sm text-slate-700">{selectedPreferences.length > 0 ? selectedPreferences.join(', ') : 'General balanced itinerary'}</p>
            </div>
          </aside>
        </section>
      )}
    </section>
  );
}

export default SearchPanel;
