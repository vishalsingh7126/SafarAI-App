import { useState, useEffect } from 'react';
import usePageMeta from '../hooks/usePageMeta';

const STYLE_ICONS = {
  adventure: '🏔️',
  relaxation: '🌊',
  cultural: '🏛️',
  food: '🍜',
  nature: '🌿',
};

const DAY_COLORS = [
  'from-brand-600 to-brand-400',
  'from-accent-500 to-accent-700',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-blue-600',
];

function TripCard({ trip, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(trip.dateCreated).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const styleLabel = trip.travelStyle
    ? trip.travelStyle.charAt(0).toUpperCase() + trip.travelStyle.slice(1)
    : '—';

  return (
    <article className="rounded-2xl border border-brand-100 bg-white/90 shadow-panel transition-all duration-300">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-ink">
              {STYLE_ICONS[trip.travelStyle] ?? '🗺️'} {trip.destination}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {trip.duration} {parseInt(trip.duration, 10) === 1 ? 'Day' : 'Days'} · {styleLabel} style
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
            {formattedDate}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="interactive rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2 text-xs font-semibold text-white shadow-float transition-all duration-200 hover:scale-[1.02]"
          >
            {expanded ? 'Hide Trip' : 'View Trip'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(trip.id)}
            className="interactive rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50"
          >
            Delete Trip
          </button>
        </div>
      </div>

      {/* Expanded itinerary */}
      {expanded && trip.itinerary && trip.itinerary.length > 0 && (
        <div className="border-t border-brand-100 px-5 pb-5 pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trip.itinerary.map((item, index) => (
              <div
                key={item.day}
                className="rounded-xl border border-brand-50 bg-brand-50/40 p-4"
              >
                <div
                  className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${DAY_COLORS[index % DAY_COLORS.length]} text-xs font-bold text-white`}
                >
                  D{item.day}
                </div>
                <p className="text-xs font-bold text-ink">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.activities}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function MyTrips() {
  usePageMeta('My Trips | SafarAI', 'View and manage your saved travel plans on SafarAI.');

  const [trips, setTrips] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('safarai_trips');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setTrips(Array.isArray(parsed) ? parsed : []);
    } catch {
      setTrips([]);
    }
  }, []);

  function handleDelete(id) {
    const updated = trips.filter((t) => t.id !== id);
    setTrips(updated);
    localStorage.setItem('safarai_trips', JSON.stringify(updated));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      {/* Header */}
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-600">
          🗂️ Saved Trips
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">My Trips</h1>
        <p className="mt-2 text-base text-slate-500">View and manage your saved travel plans.</p>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white/50 p-12 text-center">
          <p className="text-4xl">🧳</p>
          <p className="mt-4 text-base font-semibold text-slate-500">
            You have not saved any trips yet.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Generate an itinerary in the{' '}
            <a href="/trip-planner" className="font-semibold text-brand-600 hover:underline">
              Trip Planner
            </a>{' '}
            and click <span className="font-semibold text-brand-700">Save Trip</span> to save it here.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {trips.length} saved {trips.length === 1 ? 'trip' : 'trips'}
          </p>
          <div className="space-y-4">
            {trips
              .slice()
              .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
              .map((trip) => (
                <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}

export default MyTrips;
