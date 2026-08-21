import { useEffect, useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge, { Chip } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/format';
import { cn } from '../lib/cn';

const STORAGE_KEY = 'safarai_events';

const CATEGORY_OPTIONS = ['Music', 'Festival', 'Food', 'Sports', 'Workshop', 'Meetup', 'Other'];

const CATEGORY_STYLES = {
  Music: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  Festival: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  Food: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  Sports: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Workshop: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  Meetup: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  Other: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
};

const CATEGORY_ICONS = {
  Music: 'zap',
  Festival: 'sparkles',
  Food: 'utensils',
  Sports: 'target',
  Workshop: 'edit',
  Meetup: 'users',
  Other: 'ticket',
};

/* ------------------------------------------------------- storage utilities */

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

function futureDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

/**
 * Illustrative example listings used by the "Load examples" action. The venues
 * are real places; the listings are demonstrations of the format and are
 * labelled as examples in the UI.
 */
const SAMPLE_EVENTS = [
  {
    eventName: 'Example: Vagator Beach sunset session',
    description: 'Sunset electronic sets on the sand with local food trucks and a night market.',
    date: futureDate(6),
    time: '17:00',
    city: 'Goa',
    fullAddress: 'Vagator Beach, North Goa',
    category: 'Music',
    organizer: 'Sample listing',
  },
  {
    eventName: 'Example: Old Delhi food walk',
    description: 'Guided six-stop street food crawl through Chandni Chowk with a local historian.',
    date: futureDate(3),
    time: '18:30',
    city: 'Delhi',
    fullAddress: 'Chandni Chowk Metro Gate 5, Delhi',
    category: 'Food',
    organizer: 'Sample listing',
  },
  {
    eventName: 'Example: Jaipur literature evening',
    description: 'Readings, poetry and a rooftop conversation series in the Pink City.',
    date: futureDate(12),
    time: '19:00',
    city: 'Jaipur',
    fullAddress: 'Diggi Palace, Jaipur',
    category: 'Workshop',
    organizer: 'Sample listing',
  },
];

/* ------------------------------------------------------------------- cards */

function EventCard({ event, onView, onDelete }) {
  const badgeStyle = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.Other;
  const isPast = new Date(`${event.date}T23:59`) < new Date();

  return (
    <Card padding="lg" interactive className="flex flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-float',
            isPast ? 'bg-slate-400' : 'bg-brand-gradient'
          )}
        >
          <Icon name={CATEGORY_ICONS[event.category] || 'ticket'} size="md" />
        </span>
        <div className="text-right">
          <p className="text-xs font-bold text-fg">{formatDate(event.date)}</p>
          <p className="text-2xs text-fg-subtle">{formatTime(event.time)}</p>
        </div>
      </div>

      <h3 className="text-base font-bold text-fg">{event.eventName}</h3>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-fg-muted">{event.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-2.5 py-1 text-2xs font-bold', badgeStyle)}>{event.category}</span>
        <Badge tone="neutral" size="sm" icon="mapPin">
          {event.city}
        </Badge>
        {isPast && (
          <Badge tone="warning" size="sm">
            Past
          </Badge>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
        <Button size="xs" variant="secondary" leadingIcon="eye" onClick={() => onView(event)}>
          Details
        </Button>
        <Button size="xs" variant="ghost" leadingIcon="mapPin" href={toMapLink(event.fullAddress)} target="_blank" rel="noreferrer">
          Map
        </Button>
        <Button
          size="xs"
          variant="ghost"
          iconOnly
          leadingIcon="trash"
          className="ml-auto text-rose-500"
          aria-label={`Delete ${event.eventName}`}
          onClick={() => onDelete(event)}
        />
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------- page */

function EventsExplorer() {
  usePageMeta(
    'Events & Activities Finder | SafarAI',
    'Discover nearby events, add your own activities, and explore what is happening in your city.'
  );

  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [cityInput, setCityInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [filters, setFilters] = useState({ city: '', date: '' });
  const [category, setCategory] = useState('All');
  const [locating, setLocating] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [formError, setFormError] = useState('');

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

  const persist = (next) => {
    setEvents(next);
    saveEventsToStorage(next);
  };

  const filteredEvents = useMemo(() => {
    const cityNeedle = filters.city.trim().toLowerCase();

    return events
      .filter((event) => {
        const cityMatch = cityNeedle
          ? event.city.toLowerCase().includes(cityNeedle) || event.fullAddress.toLowerCase().includes(cityNeedle)
          : true;
        const dateMatch = filters.date ? event.date === filters.date : true;
        const categoryMatch = category === 'All' ? true : event.category === category;
        return cityMatch && dateMatch && categoryMatch;
      })
      .sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));
  }, [events, filters.city, filters.date, category]);

  const upcomingCount = events.filter((event) => new Date(`${event.date}T23:59`) >= new Date()).length;

  function handleSearch() {
    setFilters({ city: cityInput, date: dateInput });
    toast.info('Filters applied', {
      description: [cityInput && `City: ${cityInput}`, dateInput && `Date: ${formatDate(dateInput)}`]
        .filter(Boolean)
        .join(' · ') || 'Showing all events',
    });
  }

  function clearFilters() {
    setCityInput('');
    setDateInput('');
    setCategory('All');
    setFilters({ city: '', date: '' });
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) {
      toast.error('Location unavailable', { description: 'Your browser does not support geolocation.' });
      return;
    }
    setLocating(true);

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
            setFilters((prev) => ({ ...prev, city }));
            toast.success(`Showing events near ${city}`);
          } else {
            toast.info('Could not resolve your city', { description: 'Type a city name instead.' });
          }
        } catch {
          const fallback = `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`;
          setCityInput(fallback);
          toast.info('Using coordinates', { description: fallback });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error('Location permission denied', { description: 'Enter a city manually to continue.' });
      },
      { timeout: 8000 }
    );
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  }

  function handleCreateEvent(event) {
    event.preventDefault();

    if (!eventForm.eventName.trim() || !eventForm.date || !eventForm.city.trim()) {
      setFormError('Event name, date and city are required.');
      return;
    }

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

    persist([newEvent, ...events]);
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
    toast.success('Event published', { description: `${newEvent.eventName} is now listed for ${newEvent.city}.` });
  }

  function loadSamples() {
    const seeded = SAMPLE_EVENTS.map((event) => ({
      ...event,
      id: createEventId(),
      createdAt: new Date().toISOString().slice(0, 10),
    }));
    persist([...seeded, ...events]);
    toast.success('Example listings added', {
      description: 'Format examples at real venues — edit or delete them any time.',
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Events"
        icon="ticket"
        title="What is happening while you are there"
        description="Search community events by city and date, or publish your own — everything is stored on your device."
        stats={[
          { label: 'Listed', value: events.length },
          { label: 'Upcoming', value: upcomingCount },
          { label: 'In view', value: filteredEvents.length },
        ]}
        actions={
          <>
            <Button leadingIcon="plus" onClick={() => setShowAddModal(true)}>
              Add event
            </Button>
            <Button variant="secondary" leadingIcon="target" onClick={handleUseMyLocation} loading={locating}>
              Use my location
            </Button>
          </>
        }
      />

      <Card padding="lg">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto] lg:items-end">
          <Field label="City / location" htmlFor="ev-city">
            <Input
              id="ev-city"
              icon="mapPin"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              placeholder="e.g. Goa, Delhi, Mumbai"
            />
          </Field>

          <Field label="Date" htmlFor="ev-date">
            <Input id="ev-date" type="date" value={dateInput} onChange={(event) => setDateInput(event.target.value)} />
          </Field>

          <div className="flex gap-2">
            <Button onClick={handleSearch} leadingIcon="search" className="flex-1">
              Search
            </Button>
            {(filters.city || filters.date || category !== 'All') && (
              <Button variant="secondary" onClick={clearFilters} iconOnly leadingIcon="close" aria-label="Clear filters" />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Chip active={category === 'All'} onClick={() => setCategory('All')} count={events.length}>
            All
          </Chip>
          {CATEGORY_OPTIONS.map((option) => (
            <Chip
              key={option}
              icon={CATEGORY_ICONS[option]}
              active={category === option}
              onClick={() => setCategory(option)}
              count={events.filter((event) => event.category === option).length}
            >
              {option}
            </Chip>
          ))}
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-fg">Upcoming events</h2>
          <Badge tone="brand">
            {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}
          </Badge>
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon="ticket"
            title="No events listed yet"
            description="Publish the first event for your city, or load a few example listings to see how the board works."
            action={{ label: 'Add an event', onClick: () => setShowAddModal(true), icon: 'plus' }}
            secondaryAction={{ label: 'Load example listings', onClick: loadSamples, icon: 'sparkles' }}
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            compact
            icon="search"
            title="No events match these filters"
            description="Try a different city, clear the date, or switch category."
            action={{ label: 'Clear filters', onClick: clearFilters, icon: 'refresh' }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onView={setSelectedEvent} onDelete={setPendingDelete} />
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------- create modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create an event"
        description="Share something happening in your city with other travellers."
        icon="plus"
        size="lg"
      >
        <form onSubmit={handleCreateEvent} className="grid gap-4 sm:grid-cols-2">
          <Field label="Event name" required htmlFor="f-name" className="sm:col-span-2">
            <Input
              id="f-name"
              name="eventName"
              data-autofocus
              value={eventForm.eventName}
              onChange={handleFormChange}
              placeholder="Sunset jazz at the pier"
              required
            />
          </Field>

          <Field label="Description" htmlFor="f-desc" className="sm:col-span-2" hint="What should people expect?">
            <Textarea
              id="f-desc"
              name="description"
              rows={3}
              value={eventForm.description}
              onChange={handleFormChange}
              placeholder="Live sets, food stalls, entry details…"
            />
          </Field>

          <Field label="Date" required htmlFor="f-date">
            <Input id="f-date" type="date" name="date" value={eventForm.date} onChange={handleFormChange} required />
          </Field>

          <Field label="Time" htmlFor="f-time">
            <Input id="f-time" type="time" name="time" value={eventForm.time} onChange={handleFormChange} />
          </Field>

          <Field label="City" required htmlFor="f-city">
            <Input id="f-city" name="city" icon="mapPin" value={eventForm.city} onChange={handleFormChange} required />
          </Field>

          <Field label="Category" htmlFor="f-category">
            <Select id="f-category" name="category" value={eventForm.category} onChange={handleFormChange}>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Full address" htmlFor="f-address" className="sm:col-span-2">
            <Input id="f-address" name="fullAddress" value={eventForm.fullAddress} onChange={handleFormChange} placeholder="Venue, street, area" />
          </Field>

          <Field label="Organiser" htmlFor="f-org" className="sm:col-span-2">
            <Input id="f-org" name="organizer" value={eventForm.organizer} onChange={handleFormChange} placeholder="Who is hosting?" />
          </Field>

          {formError && (
            <p className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <Icon name="alert" size="sm" />
              {formError}
            </p>
          )}

          <div className="sm:col-span-2 flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" leadingIcon="checkCircle">
              Publish event
            </Button>
          </div>
        </form>
      </Modal>

      {/* ----------------------------------------------------- detail modal */}
      <Modal
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.eventName}
        icon={CATEGORY_ICONS[selectedEvent?.category] || 'ticket'}
        size="md"
        footer={
          selectedEvent && (
            <>
              <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              <Button href={toMapLink(selectedEvent.fullAddress)} target="_blank" rel="noreferrer" leadingIcon="mapPin">
                Open in maps
              </Button>
            </>
          )
        }
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={cn('rounded-full px-2.5 py-1 text-2xs font-bold', CATEGORY_STYLES[selectedEvent.category])}>
                {selectedEvent.category}
              </span>
              <Badge tone="neutral" icon="calendar">
                {formatDate(selectedEvent.date)} · {formatTime(selectedEvent.time)}
              </Badge>
              <Badge tone="neutral" icon="mapPin">
                {selectedEvent.city}
              </Badge>
            </div>

            <p className="text-sm leading-6 text-fg-muted">{selectedEvent.description || 'No description provided.'}</p>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface-muted p-3">
                <dt className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">Venue</dt>
                <dd className="mt-1 text-sm font-medium text-fg">{selectedEvent.fullAddress || '—'}</dd>
              </div>
              <div className="rounded-xl border border-line bg-surface-muted p-3">
                <dt className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">Organiser</dt>
                <dd className="mt-1 text-sm font-medium text-fg">{selectedEvent.organizer || '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      {/* ----------------------------------------------------- delete modal */}
      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this event?"
        icon="trash"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Keep
            </Button>
            <Button
              variant="danger"
              leadingIcon="trash"
              onClick={() => {
                persist(events.filter((event) => event.id !== pendingDelete.id));
                toast.success('Event deleted');
                setPendingDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">
          <span className="font-semibold text-fg">{pendingDelete?.eventName}</span> will be removed from this device.
        </p>
      </Modal>
    </div>
  );
}

export default EventsExplorer;
