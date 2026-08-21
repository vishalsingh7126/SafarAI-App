import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Progress } from '../components/ui/Progress';
import { Select, Checkbox } from '../components/ui/Input';
import useLocalStorage from '../hooks/useLocalStorage';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAssistant } from '../context/AssistantContext';
import { findDestination } from '../data/destinations';
import { formatDate, formatINR } from '../lib/format';
import { cn } from '../lib/cn';
import DestinationImage from '../components/DestinationImage';

/**
 * Planning workspace — the "between planning and packing" surface.
 * Turns a saved itinerary into an actionable prep timeline with a
 * destination-aware packing list.
 */

const PHASES = [
  {
    id: 'booking',
    label: 'Book it',
    window: '4–6 weeks out',
    icon: 'ticket',
    tasks: [
      'Lock travel dates with everyone in the group',
      'Book long-distance transport (fares climb fast)',
      'Reserve the first two nights of accommodation',
      'Check permits or entry passes for restricted areas',
    ],
  },
  {
    id: 'prep',
    label: 'Prepare',
    window: '1–2 weeks out',
    icon: 'layers',
    tasks: [
      'Confirm the full itinerary and share it with a contact',
      'Download offline maps and ticket PDFs',
      'Arrange travel insurance and emergency cash',
      'Book any timed experiences or guided tours',
    ],
  },
  {
    id: 'pack',
    label: 'Pack',
    window: '2 days out',
    icon: 'luggage',
    tasks: [
      'Work through the packing list below',
      'Charge power banks and pack the right adapters',
      'Print or screenshot IDs, tickets and reservations',
      'Set alarms for early departures',
    ],
  },
  {
    id: 'travel',
    label: 'On the road',
    window: 'During the trip',
    icon: 'compass',
    tasks: [
      'Check in with your emergency contact daily',
      'Track spend against your budget estimate',
      'Save receipts for reimbursements or splitting',
      'Note what to change for the next trip',
    ],
  },
];

const BASE_PACKING = [
  'Government ID + copies',
  'Bank cards and backup cash',
  'Phone, charger, power bank',
  'Basic medical kit and prescriptions',
  'Reusable water bottle',
  'Toiletries and sunscreen',
];

const STYLE_PACKING = {
  adventure: ['Trail shoes', 'Dry bag', 'Headlamp', 'Quick-dry layers'],
  relaxation: ['Swimwear', 'Beach towel', 'A book', 'Sandals'],
  cultural: ['Modest clothing for temples', 'Comfortable walking shoes', 'Small daypack'],
  food: ['Antacids', 'Wet wipes', 'Cash for street stalls'],
  nature: ['Insect repellent', 'Binoculars', 'Rain shell', 'Refillable snacks'],
};

const REGION_PACKING = {
  North: ['Warm layers for evenings', 'Lip balm'],
  South: ['Light cotton clothing', 'Umbrella for sudden rain'],
  East: ['Rain jacket', 'Waterproof phone pouch'],
  West: ['Sun hat', 'Extra hydration salts'],
};

function PlanTripPage() {
  usePageMeta('Plan Trip | SafarAI', 'Build AI-powered itineraries and save personalized travel plans with SafarAI.');

  const { trips } = useWorkspace();
  const { send, openDock } = useAssistant();
  const [checklists, setChecklists] = useLocalStorage('safarai_trip_checklists', {});
  const [activeId, setActiveId] = useState('');

  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)),
    [trips]
  );

  useEffect(() => {
    if (!activeId && sortedTrips.length) setActiveId(sortedTrips[0].id);
  }, [sortedTrips, activeId]);

  const trip = sortedTrips.find((item) => item.id === activeId);
  const destination = trip ? findDestination(trip.destination) : null;

  const daysUntil = useMemo(() => {
    if (!trip?.startDate) return null;
    const diff = new Date(`${trip.startDate}T00:00:00`) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [trip]);

  const tripChecks = (trip && checklists[trip.id]) || {};

  const toggleTask = (taskId) => {
    if (!trip) return;
    setChecklists((prev) => ({
      ...prev,
      [trip.id]: { ...(prev[trip.id] || {}), [taskId]: !(prev[trip.id] || {})[taskId] },
    }));
  };

  const allTasks = PHASES.flatMap((phase) => phase.tasks.map((task) => `${phase.id}:${task}`));
  const completion = allTasks.length
    ? Math.round((allTasks.filter((task) => tripChecks[task]).length / allTasks.length) * 100)
    : 0;

  const packingList = useMemo(() => {
    if (!trip) return BASE_PACKING;
    return [
      ...BASE_PACKING,
      ...(STYLE_PACKING[trip.travelStyle] || []),
      ...(destination ? REGION_PACKING[destination.region] || [] : []),
    ];
  }, [trip, destination]);

  const packingChecks = (trip && checklists[`${trip.id}_pack`]) || {};
  const packingDone = packingList.filter((item) => packingChecks[item]).length;

  const togglePacking = (item) => {
    if (!trip) return;
    setChecklists((prev) => ({
      ...prev,
      [`${trip.id}_pack`]: { ...(prev[`${trip.id}_pack`] || {}), [item]: !(prev[`${trip.id}_pack`] || {})[item] },
    }));
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Planning workspace"
        icon="layers"
        title="Turn a plan into a trip that actually happens"
        description="Track bookings, prep tasks and packing against your saved itineraries — everything in one checklist that remembers where you left off."
        stats={
          trip
            ? [
                { label: 'Trip readiness', value: `${completion}%` },
                { label: 'Days to go', value: daysUntil === null ? '—' : daysUntil >= 0 ? daysUntil : 'Started' },
                { label: 'Packed', value: `${packingDone}/${packingList.length}` },
              ]
            : undefined
        }
        actions={
          <>
            <Button to="/trip-planner" leadingIcon="sparkles">
              Generate itinerary
            </Button>
            <Button to="/my-trips" variant="secondary" leadingIcon="luggage">
              My trips
            </Button>
          </>
        }
      />

      {sortedTrips.length === 0 ? (
        <EmptyState
          icon="layers"
          title="No trips to prepare yet"
          description="Generate and save an itinerary first — this workspace then turns it into a booking, prep and packing checklist."
          action={{ label: 'Open Trip Planner', to: '/trip-planner', icon: 'sparkles' }}
          secondaryAction={{ label: 'Browse destinations', to: '/explore', icon: 'compass' }}
        />
      ) : (
        <>
          {/* active trip */}
          <Card padding="lg">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                {destination && (
                  <DestinationImage
                    destination={destination}
                    width={320}
                    compact
                    rounded="rounded-2xl"
                    className="h-20 w-full sm:h-16 sm:w-24"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold text-fg">{trip?.destination}</h2>
                    <Badge tone="brand" size="sm">
                      {trip?.travelStyle}
                    </Badge>
                    {daysUntil !== null && daysUntil >= 0 && (
                      <Badge tone={daysUntil <= 7 ? 'warning' : 'neutral'} icon="clock">
                        {daysUntil === 0 ? 'Departs today' : `${daysUntil} days to go`}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    {trip?.startDate ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}` : 'Dates not set'} ·{' '}
                    {trip?.days} days
                    {trip?.estimate ? ` · ${formatINR(trip.estimate)} estimated` : ''}
                  </p>
                  <div className="mt-3 max-w-sm">
                    <Progress value={completion} label="Trip readiness" showValue size="sm" tone={completion === 100 ? 'success' : 'brand'} />
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-64">
                <label htmlFor="active-trip" className="text-2xs font-bold uppercase tracking-wide text-fg-subtle">
                  Active trip
                </label>
                <Select
                  id="active-trip"
                  icon="luggage"
                  value={activeId}
                  onChange={(event) => setActiveId(event.target.value)}
                  className="mt-1.5"
                >
                  {sortedTrips.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.destination} · {item.days} days
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          {/* phases */}
          <div className="grid gap-4 md:grid-cols-2">
            {PHASES.map((phase) => {
              const phaseTasks = phase.tasks.map((task) => `${phase.id}:${task}`);
              const done = phaseTasks.filter((task) => tripChecks[task]).length;
              const complete = done === phaseTasks.length;

              return (
                <Card key={phase.id} padding="lg" className={cn(complete && 'border-emerald-200 dark:border-emerald-500/25')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-float',
                          complete ? 'bg-emerald-500' : 'bg-brand-gradient'
                        )}
                      >
                        <Icon name={complete ? 'check' : phase.icon} size="md" />
                      </span>
                      <div>
                        <p className="text-base font-bold text-fg">{phase.label}</p>
                        <p className="text-2xs text-fg-subtle">{phase.window}</p>
                      </div>
                    </div>
                    <Badge tone={complete ? 'success' : 'neutral'} size="sm">
                      {done}/{phaseTasks.length}
                    </Badge>
                  </div>

                  <ul className="mt-4 space-y-1.5">
                    {phase.tasks.map((task) => {
                      const id = `${phase.id}:${task}`;
                      return (
                        <li key={id} className="rounded-lg px-1 py-1 transition-colors hover:bg-surface-muted">
                          <Checkbox
                            id={id}
                            checked={Boolean(tripChecks[id])}
                            onChange={() => toggleTask(id)}
                            label={
                              <span className={cn('text-sm', tripChecks[id] && 'text-fg-subtle line-through')}>{task}</span>
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })}
          </div>

          {/* packing + shortcuts */}
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
            <Card padding="lg">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-fg">Packing list</h2>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    Tailored to a {trip?.travelStyle} trip{destination ? ` in ${destination.region} India` : ''}.
                  </p>
                </div>
                <Badge tone={packingDone === packingList.length ? 'success' : 'brand'}>
                  {packingDone}/{packingList.length}
                </Badge>
              </div>

              <Progress
                value={(packingDone / packingList.length) * 100}
                className="mt-3"
                tone={packingDone === packingList.length ? 'success' : 'brand'}
                size="sm"
              />

              <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                {packingList.map((item) => (
                  <li key={item} className="rounded-lg px-1 py-1 transition-colors hover:bg-surface-muted">
                    <Checkbox
                      id={`pack-${item}`}
                      checked={Boolean(packingChecks[item])}
                      onChange={() => togglePacking(item)}
                      label={<span className={cn('text-sm', packingChecks[item] && 'text-fg-subtle line-through')}>{item}</span>}
                    />
                  </li>
                ))}
              </ul>

              <Button
                variant="secondary"
                size="sm"
                className="mt-5"
                leadingIcon="bot"
                onClick={() => {
                  openDock();
                  send(
                    `What else should I pack for a ${trip?.days}-day ${trip?.travelStyle} trip to ${trip?.destination}? Keep it to items most people forget.`
                  );
                }}
              >
                Ask AI what I am missing
              </Button>
            </Card>

            <div className="space-y-4">
              <Card padding="lg">
                <h2 className="text-base font-bold text-fg">Finish the details</h2>
                <div className="mt-3 space-y-2">
                  {[
                    { label: 'Estimate the budget', to: '/budget', icon: 'wallet' },
                    { label: `Find stays in ${trip?.destination || 'your city'}`, to: `/hotels?city=${encodeURIComponent(trip?.destination || '')}`, icon: 'hotel' },
                    { label: 'Compare transport options', to: '/transport', icon: 'car' },
                    { label: 'Check safety intelligence', to: '/safety', icon: 'shield' },
                    { label: 'Events on your dates', to: '/events', icon: 'ticket' },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="group flex items-center gap-3 rounded-xl border border-line bg-surface-muted px-3.5 py-2.5 text-sm font-semibold text-fg-muted transition hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-200"
                    >
                      <Icon name={item.icon} size="sm" />
                      <span className="truncate">{item.label}</span>
                      <Icon
                        name="arrowRight"
                        size="sm"
                        className="ml-auto shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </Link>
                  ))}
                </div>
              </Card>

              {trip?.itinerary?.length > 0 && (
                <Card padding="lg" tone="muted">
                  <h2 className="text-base font-bold text-fg">Day one preview</h2>
                  <p className="mt-2 text-sm leading-6 text-fg-muted">{trip.itinerary[0].activities}</p>
                  <Button to="/my-trips" size="sm" variant="secondary" className="mt-4" trailingIcon="arrowRight">
                    See full itinerary
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PlanTripPage;
