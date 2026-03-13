import { useEffect, useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';

const STORAGE_KEY = 'safarai_events';

const CATEGORY_OPTIONS = [
  'Music',
  'Festival',
  'Food',
  'Sports',
  'Workshop',
  'Meetup',
  'Other',
];

const CATEGORY_STYLES = {
  Music: 'bg-purple-100 text-purple-700',
  Festival: 'bg-pink-100 text-pink-700',
  Food: 'bg-orange-100 text-orange-700',
  Sports: 'bg-emerald-100 text-emerald-700',
  Workshop: 'bg-blue-100 text-blue-700',
  Meetup: 'bg-cyan-100 text-cyan-700',
  Other: 'bg-slate-100 text-slate-700',
};

function loadEventsFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEventsToStorage(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(time) {
  if (!time) return '—';
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;

  const period = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, '0')} ${period}`;
}

function createEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function toMapLink(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
}

function EventCard({ event, onView }) {
  const badgeStyle = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.Other;

  return (
    <article className="group rounded-xl border border-brand-100 bg-white/95 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-base text-white shadow-md">
          🎉
        </div>
        <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {formatDate(event.date)}
        </div>
      </div>

      <h3 className="text-base font-bold text-ink">{event.eventName}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{event.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-semibold ${badgeStyle}`}>{event.category}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{event.city}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{formatTime(event.time)}</span>
      </div>

      <button
        type="button"
        onClick={() => onView(event)}
        className="interactive mt-4 text-sm font-semibold text-brand-700 transition-all duration-200 hover:scale-[1.02] hover:text-accent-700"
      >
        View Details
      </button>
    </article>
  );
}

function EventsExplorer() {
  usePageMeta('Events & Activities Finder | SafarAI', 'Discover nearby events, add your own activities, and explore what is happening in your city.');

  const [events, setEvents] = useState([]);
  const [cityInput, setCityInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [filters, setFilters] = useState({ city: '', date: '' });

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [eventForm, setEventForm] = useState({
    eventName: '',
    description: '',
    date: '',
    time: '',
    city: '',
    fullAddress: '',
    category: 'Music',
    organizer: '',
  });

  useEffect(() => {
    setEvents(loadEventsFromStorage());
  }, []);

  const filteredEvents = useMemo(() => {
    const cityNeedle = filters.city.trim().toLowerCase();

    return events
      .filter((event) => {
        const cityMatch = cityNeedle
          ? event.city.toLowerCase().includes(cityNeedle) || event.fullAddress.toLowerCase().includes(cityNeedle)
          : true;

        const dateMatch = filters.date ? event.date === filters.date : true;
        return cityMatch && dateMatch;
      })
      .sort((a, b) => {
        const aTime = `${a.date}T${a.time || '00:00'}`;
        const bTime = `${b.date}T${b.time || '00:00'}`;
        return aTime.localeCompare(bTime);
      });
  }, [events, filters.city, filters.date]);

  function handleSearch() {
    setFilters({ city: cityInput, date: dateInput });
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );
          const data = await response.json();
          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.address?.state_district ||
            '';

          if (city) {
            setCityInput(city);
          }
        } catch {
          setCityInput(`${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
        }
      },
      () => {}
    );
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCreateEvent(e) {
    e.preventDefault();

    const newEvent = {
      id: createEventId(),
      eventName: eventForm.eventName.trim(),
      description: eventForm.description.trim(),
      date: eventForm.date,
      time: eventForm.time,
      city: eventForm.city.trim(),
      fullAddress: eventForm.fullAddress.trim(),
      category: eventForm.category,
      organizer: eventForm.organizer.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [newEvent, ...events];
    setEvents(updated);
    saveEventsToStorage(updated);

    setEventForm({
      eventName: '',
      description: '',
      date: '',
      time: '',
      city: '',
      fullAddress: '',
      category: 'Music',
      organizer: '',
    });
    setShowAddModal(false);
  }

  const inputBase =
    'w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-ink placeholder-slate-400 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-300/50';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Events & Activities Finder</h1>
        <p className="mt-2 text-slate-600">Discover events happening around you.</p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-panel">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              City / Location
            </label>
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="e.g. Goa, Delhi, Mumbai"
              className={inputBase}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className={inputBase}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSearch}
              className="interactive w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-3 text-sm font-semibold text-white shadow-float transition-all duration-200 hover:scale-[1.01]"
            >
              Search Events
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="interactive rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-semibold text-brand-700 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50"
          >
            Use My Location
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="interactive rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-float transition-all duration-200 hover:scale-[1.02]"
          >
            Add Event
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Upcoming Events</h2>
          <p className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'} found
          </p>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white/50 p-10 text-center">
            <p className="text-base font-semibold text-slate-600">No events found in this location.</p>
            <p className="mt-1 text-sm text-slate-500">Be the first to add an event.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onView={setSelectedEvent} />
            ))}
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-brand-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-ink">Create Event</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Event Name</label>
                <input
                  required
                  name="eventName"
                  value={eventForm.eventName}
                  onChange={handleFormChange}
                  className={inputBase}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                <textarea
                  required
                  name="description"
                  rows={3}
                  value={eventForm.description}
                  onChange={handleFormChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Event Date</label>
                <input
                  required
                  type="date"
                  name="date"
                  value={eventForm.date}
                  onChange={handleFormChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Event Time</label>
                <input
                  required
                  type="time"
                  name="time"
                  value={eventForm.time}
                  onChange={handleFormChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">City</label>
                <input
                  required
                  name="city"
                  value={eventForm.city}
                  onChange={handleFormChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
                <select
                  name="category"
                  value={eventForm.category}
                  onChange={handleFormChange}
                  className={inputBase}
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Address</label>
                <input
                  required
                  name="fullAddress"
                  value={eventForm.fullAddress}
                  onChange={handleFormChange}
                  className={inputBase}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Organizer Name</label>
                <input
                  required
                  name="organizer"
                  value={eventForm.organizer}
                  onChange={handleFormChange}
                  className={inputBase}
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="interactive rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-float transition-all duration-200 hover:scale-[1.01]"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-brand-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-ink">{selectedEvent.eventName}</h3>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="text-sm leading-relaxed text-slate-600">{selectedEvent.description}</p>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold text-ink">Date:</span> {formatDate(selectedEvent.date)}</p>
              <p><span className="font-semibold text-ink">Time:</span> {formatTime(selectedEvent.time)}</p>
              <p><span className="font-semibold text-ink">Location:</span> {selectedEvent.fullAddress}</p>
              <p><span className="font-semibold text-ink">Organizer:</span> {selectedEvent.organizer}</p>
            </div>

            <div className="mt-5 flex justify-end">
              <a
                href={toMapLink(selectedEvent.fullAddress)}
                target="_blank"
                rel="noreferrer"
                className="interactive rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50"
              >
                View on Map
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventsExplorer;
