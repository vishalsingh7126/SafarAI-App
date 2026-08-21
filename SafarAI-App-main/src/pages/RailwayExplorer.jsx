import { useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Field, Input, Select } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatINR } from '../lib/format';
import { cn } from '../lib/cn';

/* Original mock dataset preserved ------------------------------------------ */

const MOCK_TRAINS = [
  {
    name: 'Rajdhani Express',
    number: '12301',
    departure: '16:55',
    arrival: '10:00+1',
    duration: '17h 05m',
    from: 'New Delhi',
    to: 'Howrah',
    classes: ['3A', '2A', '1A'],
    fare: 2455,
    days: 'Daily',
  },
  {
    name: 'Shatabdi Express',
    number: '12001',
    departure: '06:00',
    arrival: '14:00',
    duration: '8h 00m',
    from: 'New Delhi',
    to: 'Bhopal',
    classes: ['CC', 'EC'],
    fare: 1520,
    days: 'Except Fri',
  },
  {
    name: 'Duronto Express',
    number: '12213',
    departure: '23:15',
    arrival: '15:30+1',
    duration: '16h 15m',
    from: 'Mumbai Central',
    to: 'New Delhi',
    classes: ['SL', '3A', '2A'],
    fare: 1890,
    days: 'Tue, Fri, Sun',
  },
  {
    name: 'Vande Bharat Express',
    number: '22436',
    departure: '06:00',
    arrival: '14:00',
    duration: '8h 00m',
    from: 'New Delhi',
    to: 'Varanasi',
    classes: ['CC', 'EC'],
    fare: 1805,
    days: 'Except Thu',
  },
];

const STATIONS = [
  { name: 'New Delhi', code: 'NDLS', city: 'New Delhi', platforms: 16, daily: 380 },
  { name: 'Mumbai Central', code: 'BCT', city: 'Mumbai', platforms: 9, daily: 210 },
  { name: 'Chennai Central', code: 'MAS', city: 'Chennai', platforms: 12, daily: 260 },
  { name: 'Howrah Junction', code: 'HWH', city: 'Kolkata', platforms: 23, daily: 410 },
  { name: 'KSR Bengaluru City', code: 'SBC', city: 'Bengaluru', platforms: 10, daily: 195 },
];

const STATION_NAMES = [...new Set([...STATIONS.map((s) => s.name), ...MOCK_TRAINS.flatMap((t) => [t.from, t.to])])].sort();

function TrainCard({ train, onTrack }) {
  const [open, setOpen] = useState(false);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-float">
                <Icon name="train" size="sm" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-fg">{train.name}</p>
                <p className="text-2xs text-fg-subtle">#{train.number} · {train.days}</p>
              </div>
            </div>
          </div>
          <Badge tone="brand" icon="clock">
            {train.duration}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="text-center">
            <p className="text-lg font-extrabold text-fg">{train.departure}</p>
            <p className="text-2xs text-fg-subtle">{train.from}</p>
          </div>
          <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            <span className="h-px flex-1 border-t-2 border-dashed border-line-strong" />
            <Icon name="train" size="xs" className="text-brand-400" />
            <span className="h-px flex-1 border-t-2 border-dashed border-line-strong" />
            <span className="h-2 w-2 rounded-full bg-accent-500" />
          </div>
          <div className="text-center">
            <p className="text-lg font-extrabold text-fg">{train.arrival}</p>
            <p className="text-2xs text-fg-subtle">{train.to}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex flex-wrap gap-1.5">
            {train.classes.map((cls) => (
              <span
                key={cls}
                className="rounded-lg border border-line bg-surface-muted px-2 py-1 text-2xs font-bold text-fg-muted"
              >
                {cls}
              </span>
            ))}
            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-2xs font-bold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
              from {formatINR(train.fare)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="xs" variant="ghost" onClick={() => setOpen((prev) => !prev)} trailingIcon={open ? 'chevronUp' : 'chevronDown'}>
              {open ? 'Less' : 'Details'}
            </Button>
            <Button size="xs" variant="secondary" leadingIcon="bookmark" onClick={() => onTrack(train)}>
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className={cn('grid transition-all duration-300 ease-smooth', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="grid gap-3 border-t border-line bg-surface-muted p-5 sm:grid-cols-3">
            {[
              { label: 'Runs on', value: train.days, icon: 'calendar' },
              { label: 'Journey time', value: train.duration, icon: 'clock' },
              { label: 'Starting fare', value: formatINR(train.fare), icon: 'wallet' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-surface p-3">
                <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-fg-subtle">
                  <Icon name={item.icon} size="xs" />
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-bold text-fg">{item.value}</p>
              </div>
            ))}
            <p className="text-2xs text-fg-subtle sm:col-span-3">
              Timings are indicative. Confirm live status and seat availability on IRCTC before booking.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RailwayExplorer() {
  usePageMeta('Railway Explorer | SafarAI', 'Search trains, check PNR status, and explore Indian railway stations with SafarAI.');

  const toast = useToast();
  const { toggleFavourite, isFavourite } = useWorkspace();

  const [tab, setTab] = useState('search');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [sort, setSort] = useState('departure');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [pnrNumber, setPnrNumber] = useState('');

  const pnrValid = pnrNumber.length === 10;

  const handleSearchTrains = () => {
    setLoading(true);
    setTimeout(() => {
      const needleFrom = from.trim().toLowerCase();
      const needleTo = to.trim().toLowerCase();

      const exact = MOCK_TRAINS.filter(
        (train) =>
          (!needleFrom || train.from.toLowerCase().includes(needleFrom)) &&
          (!needleTo || train.to.toLowerCase().includes(needleTo))
      );

      setSearchResults({ trains: exact.length ? exact : MOCK_TRAINS, exact: exact.length > 0 });
      setLoading(false);
      toast.success(
        exact.length ? `${exact.length} train${exact.length > 1 ? 's' : ''} found` : 'Showing sample services',
        {
          description: exact.length
            ? undefined
            : 'No exact match in our sample index — here are popular routes instead.',
        }
      );
    }, 500);
  };

  const sortedTrains = useMemo(() => {
    if (!searchResults) return [];
    const list = [...searchResults.trains];
    if (sort === 'departure') list.sort((a, b) => a.departure.localeCompare(b.departure));
    if (sort === 'duration') list.sort((a, b) => parseInt(a.duration, 10) - parseInt(b.duration, 10));
    if (sort === 'fare') list.sort((a, b) => a.fare - b.fare);
    return list;
  }, [searchResults, sort]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Rail"
        icon="train"
        title="Indian Railway Explorer"
        description="Search services, jump to official PNR status, and explore major stations — built alongside Railverse."
        stats={[
          { label: 'Sample services', value: MOCK_TRAINS.length },
          { label: 'Stations', value: STATIONS.length },
          { label: 'Live PNR', value: 'IRCTC' },
        ]}
      />

      <Tabs
        tabs={[
          { value: 'search', label: 'Train search', icon: 'search' },
          { value: 'pnr', label: 'PNR status', icon: 'ticket' },
          { value: 'stations', label: 'Stations', icon: 'building', count: STATIONS.length },
        ]}
        value={tab}
        onChange={setTab}
        className="w-full sm:w-auto"
      />

      {tab === 'search' && (
        <div className="space-y-6">
          <Card padding="lg">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_1fr] sm:items-end">
              <Field label="From station" htmlFor="rail-from">
                <Input
                  id="rail-from"
                  icon="mapPin"
                  list="station-list"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  placeholder="e.g. New Delhi"
                />
              </Field>

              <button
                type="button"
                onClick={swap}
                aria-label="Swap origin and destination"
                className="mx-auto mb-1 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-fg-muted transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600"
              >
                <Icon name="refresh" size="sm" />
              </button>

              <Field label="To station" htmlFor="rail-to">
                <Input
                  id="rail-to"
                  icon="mapPin"
                  list="station-list"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  placeholder="e.g. Mumbai Central"
                />
              </Field>

              <Field label="Travel date" htmlFor="rail-date">
                <Input id="rail-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </Field>

              <datalist id="station-list">
                {STATION_NAMES.map((station) => (
                  <option key={station} value={station} />
                ))}
              </datalist>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <div className="flex flex-wrap gap-2">
                {[
                  ['New Delhi', 'Howrah'],
                  ['Mumbai Central', 'New Delhi'],
                  ['New Delhi', 'Varanasi'],
                ].map(([a, b]) => (
                  <button
                    key={`${a}-${b}`}
                    type="button"
                    onClick={() => {
                      setFrom(a);
                      setTo(b);
                    }}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-2xs font-semibold text-fg-muted transition hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-200"
                  >
                    {a} → {b}
                  </button>
                ))}
              </div>
              <Button onClick={handleSearchTrains} leadingIcon="search" loading={loading}>
                Search trains
              </Button>
            </div>
          </Card>

          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {!loading && searchResults && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-fg-muted">
                  {sortedTrains.length} {sortedTrains.length === 1 ? 'service' : 'services'}
                  {searchResults.exact ? '' : ' (sample routes)'}
                  {date ? ` · ${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                </p>
                <Select value={sort} onChange={(event) => setSort(event.target.value)} icon="sort" size="sm" className="w-44">
                  <option value="departure">Earliest departure</option>
                  <option value="duration">Shortest journey</option>
                  <option value="fare">Lowest fare</option>
                </Select>
              </div>

              {sortedTrains.map((train) => (
                <TrainCard
                  key={train.number}
                  train={train}
                  onTrack={(item) => {
                    const added = toggleFavourite({
                      id: `train-${item.number}`,
                      type: 'train',
                      title: `${item.name} (${item.number})`,
                      subtitle: `${item.from} → ${item.to}`,
                      href: '/railway',
                    });
                    toast[added ? 'success' : 'info'](added ? 'Train saved' : 'Train removed');
                  }}
                />
              ))}
            </div>
          )}

          {!loading && !searchResults && (
            <EmptyState
              icon="train"
              title="Search a route to see services"
              description="Enter an origin and destination, or tap one of the popular routes above."
              action={{ label: 'Show popular services', onClick: handleSearchTrains, icon: 'search' }}
            />
          )}
        </div>
      )}

      {tab === 'pnr' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card padding="lg">
            <h2 className="text-base font-bold text-fg">Check PNR status</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Enter your 10-digit PNR. We hand off to the official Indian Railways enquiry service — no credentials are
              stored by SafarAI.
            </p>

            <div className="mt-5">
              <Field
                label="PNR number"
                htmlFor="pnr"
                hint={`${pnrNumber.length}/10 digits`}
                error={pnrNumber.length > 0 && !pnrValid ? 'A PNR is exactly 10 digits.' : undefined}
                success={pnrValid ? 'Valid format — open the official checker below.' : undefined}
              >
                <Input
                  id="pnr"
                  icon="ticket"
                  inputMode="numeric"
                  placeholder="Enter 10-digit PNR"
                  maxLength={10}
                  value={pnrNumber}
                  invalid={pnrNumber.length > 0 && !pnrValid}
                  onChange={(event) => setPnrNumber(event.target.value.replace(/\D/g, ''))}
                />
              </Field>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                href="https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html"
                target="_blank"
                rel="noopener noreferrer"
                trailingIcon="arrowUpRight"
              >
                Check on Indian Railways
              </Button>
              <Button
                variant="secondary"
                leadingIcon="copy"
                disabled={!pnrValid}
                onClick={async () => {
                  await navigator.clipboard.writeText(pnrNumber);
                  toast.success('PNR copied');
                }}
              >
                Copy PNR
              </Button>
            </div>
          </Card>

          <Card padding="lg" tone="muted">
            <h2 className="text-base font-bold text-fg">Before you board</h2>
            <ul className="mt-4 space-y-3">
              {[
                { icon: 'clock', text: 'Reach the platform 30 minutes early — coach positions change without notice.' },
                { icon: 'shield', text: 'Keep a digital and printed copy of your ID; TTEs accept DigiLocker documents.' },
                { icon: 'wifi', text: 'Download offline maps — connectivity drops on long ghat sections.' },
                { icon: 'phone', text: 'Rail Madad helpline 139 handles complaints, medical help and security.' },
              ].map((item) => (
                <li key={item.text} className="flex gap-3 rounded-xl border border-line bg-surface p-3.5">
                  <Icon name={item.icon} size="md" className="mt-0.5 shrink-0 text-brand-500" />
                  <p className="text-sm leading-6 text-fg-muted">{item.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'stations' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {STATIONS.map((station) => {
            const saved = isFavourite(`station-${station.code}`);
            return (
              <Card key={station.code} padding="lg" interactive>
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-xs font-bold text-white shadow-float">
                    {station.code.slice(0, 2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const added = toggleFavourite({
                        id: `station-${station.code}`,
                        type: 'station',
                        title: station.name,
                        subtitle: `${station.code} · ${station.city}`,
                        href: '/railway',
                      });
                      toast[added ? 'success' : 'info'](added ? 'Station saved' : 'Station removed');
                    }}
                    aria-pressed={saved}
                    aria-label={saved ? `Remove ${station.name}` : `Save ${station.name}`}
                    className="rounded-full p-1.5 text-fg-subtle transition hover:bg-surface-muted"
                  >
                    <Icon name="heart" size="sm" filled={saved} className={saved ? 'text-rose-500' : undefined} />
                  </button>
                </div>
                <h3 className="mt-4 text-base font-bold text-fg">{station.name}</h3>
                <p className="text-xs font-bold tracking-[0.2em] text-brand-600 dark:text-brand-300">{station.code}</p>
                <p className="mt-0.5 text-xs text-fg-muted">{station.city}</p>

                <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 text-center">
                  <div>
                    <dt className="text-2xs uppercase tracking-wide text-fg-subtle">Platforms</dt>
                    <dd className="mt-0.5 text-sm font-bold text-fg">{station.platforms}</dd>
                  </div>
                  <div className="border-l border-line">
                    <dt className="text-2xs uppercase tracking-wide text-fg-subtle">Daily trains</dt>
                    <dd className="mt-0.5 text-sm font-bold text-fg">{station.daily}</dd>
                  </div>
                </dl>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RailwayExplorer;
