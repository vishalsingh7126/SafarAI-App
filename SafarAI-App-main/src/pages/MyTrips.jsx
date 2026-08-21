import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge, { Chip } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/Input';
import { STYLE_ICONS, DAY_COLORS, formatTimelineActivities } from '../lib/itineraryEngine';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { formatDate, formatINR, formatRelative } from '../lib/format';
import { cn } from '../lib/cn';

function TripCard({ trip, onDelete, onDuplicate, onExport }) {
  const [expanded, setExpanded] = useState(false);
  const styleLabel = trip.travelStyle
    ? trip.travelStyle.charAt(0).toUpperCase() + trip.travelStyle.slice(1)
    : '—';
  const dayCount = trip.days || trip.itinerary?.length || 0;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">
                {STYLE_ICONS[trip.travelStyle] ?? '🗺️'}
              </span>
              <h2 className="truncate text-lg font-extrabold text-fg">{trip.destination}</h2>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
              <span className="inline-flex items-center gap-1">
                <Icon name="calendar" size="xs" />
                {trip.startDate && trip.endDate
                  ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`
                  : `${dayCount} day plan`}
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="target" size="xs" />
                {styleLabel} style
              </span>
              {trip.travellers && (
                <span className="inline-flex items-center gap-1">
                  <Icon name="users" size="xs" />
                  {trip.travellers}
                </span>
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {trip.estimate && <Badge tone="success" icon="wallet">{formatINR(trip.estimate, { compact: true })}</Badge>}
            <Badge tone="neutral" size="sm">
              saved {formatRelative(trip.dateCreated)}
            </Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant={expanded ? 'secondary' : 'primary'} onClick={() => setExpanded((prev) => !prev)} leadingIcon={expanded ? 'chevronUp' : 'eye'}>
            {expanded ? 'Hide itinerary' : 'View itinerary'}
          </Button>
          <Button size="sm" variant="secondary" leadingIcon="sparkles" onClick={() => onDuplicate(trip)}>
            Re-plan
          </Button>
          <Button size="sm" variant="secondary" leadingIcon="download" onClick={() => onExport(trip)}>
            Export
          </Button>
          <Button size="sm" variant="dangerSoft" leadingIcon="trash" onClick={() => onDelete(trip)}>
            Delete
          </Button>
        </div>
      </div>

      <div className={cn('grid transition-all duration-300 ease-smooth', expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="border-t border-line bg-surface-muted p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(trip.itinerary || []).map((item, index) => (
                <div key={item.day} className="rounded-xl border border-line bg-surface p-4">
                  <span
                    className={cn(
                      'mb-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-2xs font-bold text-white',
                      DAY_COLORS[index % DAY_COLORS.length]
                    )}
                  >
                    D{item.day}
                  </span>
                  <p className="text-xs font-bold text-fg">{item.title}</p>
                  <ul className="mt-2 space-y-1.5">
                    {formatTimelineActivities(item.activities).map((activity, activityIndex) => (
                      <li key={activityIndex} className="text-xs leading-5 text-fg-muted">
                        <span className="font-semibold text-fg">{activity.label}:</span> {activity.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MyTrips() {
  usePageMeta('My Trips | SafarAI', 'View and manage your saved travel plans on SafarAI.');

  const { trips, deleteTrip } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [pendingDelete, setPendingDelete] = useState(null);

  const styles = useMemo(() => [...new Set(trips.map((trip) => trip.travelStyle).filter(Boolean))], [trips]);

  const visible = useMemo(() => {
    let list = trips.filter((trip) => {
      if (styleFilter !== 'all' && trip.travelStyle !== styleFilter) return false;
      if (query.trim() && !String(trip.destination).toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });

    list = [...list];
    if (sort === 'recent') list.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
    if (sort === 'oldest') list.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
    if (sort === 'longest') list.sort((a, b) => (b.days || 0) - (a.days || 0));
    if (sort === 'destination') list.sort((a, b) => String(a.destination).localeCompare(String(b.destination)));
    return list;
  }, [trips, query, styleFilter, sort]);

  const totalDays = trips.reduce((sum, trip) => sum + (trip.days || trip.itinerary?.length || 0), 0);
  const totalBudget = trips.reduce((sum, trip) => sum + (trip.estimate || 0), 0);

  const exportTrip = (trip) => {
    const text = [
      `SafarAI — ${trip.days}-day ${trip.travelStyle} trip to ${trip.destination}`,
      trip.startDate && trip.endDate ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}` : '',
      '',
      ...(trip.itinerary || []).map((item) => `Day ${item.day}: ${item.activities}`),
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safarai-${String(trip.destination).toLowerCase().replace(/\s+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Trip exported');
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteTrip(pendingDelete.id);
    toast.success('Trip deleted', { description: `${pendingDelete.destination} removed from your saved plans.` });
    setPendingDelete(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Saved trips"
        icon="luggage"
        title="My trips"
        description="Every itinerary you saved, ready to review, re-plan or export before you travel."
        stats={[
          { label: 'Trips', value: trips.length },
          { label: 'Days planned', value: totalDays },
          { label: 'Est. spend', value: totalBudget ? formatINR(totalBudget, { compact: true }) : '—' },
        ]}
        actions={
          <Button to="/trip-planner" leadingIcon="plus">
            New itinerary
          </Button>
        }
      />

      {trips.length === 0 ? (
        <EmptyState
          icon="luggage"
          title="No saved trips yet"
          description="Generate an itinerary in the Trip Planner and hit Save trip — it will show up here with the full day-by-day plan."
          action={{ label: 'Open Trip Planner', to: '/trip-planner', icon: 'sparkles' }}
          secondaryAction={{ label: 'Browse destinations', to: '/explore', icon: 'compass' }}
        />
      ) : (
        <>
          <Card padding="md">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                icon="search"
                placeholder="Search your trips by destination…"
                aria-label="Search saved trips"
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Select value={sort} onChange={(event) => setSort(event.target.value)} icon="sort" className="w-48">
                  <option value="recent">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="longest">Longest trip</option>
                  <option value="destination">Destination A → Z</option>
                </Select>
              </div>
            </div>

            {styles.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                <Chip active={styleFilter === 'all'} onClick={() => setStyleFilter('all')} count={trips.length}>
                  All styles
                </Chip>
                {styles.map((style) => (
                  <Chip
                    key={style}
                    active={styleFilter === style}
                    onClick={() => setStyleFilter(style)}
                    count={trips.filter((trip) => trip.travelStyle === style).length}
                  >
                    {STYLE_ICONS[style]} {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Chip>
                ))}
              </div>
            )}
          </Card>

          {visible.length === 0 ? (
            <EmptyState
              compact
              icon="search"
              title="No trips match this filter"
              description="Try a different destination or clear the style filter."
              action={{
                label: 'Clear filters',
                onClick: () => {
                  setQuery('');
                  setStyleFilter('all');
                },
                icon: 'refresh',
              }}
            />
          ) : (
            <div className="space-y-4">
              {visible.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDelete={setPendingDelete}
                  onExport={exportTrip}
                  onDuplicate={(item) =>
                    navigate(
                      `/trip-planner?destination=${encodeURIComponent(item.destination)}&days=${item.days || 3}&style=${
                        item.travelStyle || 'cultural'
                      }`
                    )
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this trip?"
        description="This removes the saved itinerary from this device. It cannot be undone."
        icon="trash"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Keep trip
            </Button>
            <Button variant="danger" leadingIcon="trash" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">
          <span className="font-semibold text-fg">{pendingDelete?.destination}</span> ·{' '}
          {pendingDelete?.days || pendingDelete?.itinerary?.length} day plan saved{' '}
          {formatRelative(pendingDelete?.dateCreated)}.
        </p>
      </Modal>
    </div>
  );
}

export default MyTrips;
