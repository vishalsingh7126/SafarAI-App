import { useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import { Field, Select, RangeSlider } from '../components/ui/Input';
import { Progress } from '../components/ui/Progress';
import { BarChart } from '../components/charts/Charts';
import { transportCosts } from '../data/transportCosts';
import { formatINR } from '../lib/format';
import { cn } from '../lib/cn';

/**
 * Transport hub — compares realistic cost, duration, comfort and carbon
 * footprint across modes, using the same transport cost data as the budget
 * calculator so numbers stay consistent across the product.
 */

const DISTANCE_PRESETS = {
  short: { label: 'Short hop', km: 350 },
  medium: { label: 'Medium haul', km: 900 },
  long: { label: 'Long distance', km: 1600 },
};

const MODES = [
  {
    key: 'train',
    label: 'Train',
    icon: 'train',
    speed: 60,
    comfort: 78,
    co2: 0.041,
    color: '#4f46e5',
    pros: ['Best value per km', 'City centre to city centre', 'Sleeper options save a hotel night'],
    cons: ['Books out early in peak season', 'Delays on monsoon routes'],
  },
  {
    key: 'flight',
    label: 'Flight',
    icon: 'plane',
    speed: 520,
    comfort: 84,
    co2: 0.158,
    color: '#06b6d4',
    pros: ['Fastest over 800 km', 'Frequent metro connections'],
    cons: ['Airport transfers add 3–4 hours', 'Highest carbon footprint'],
  },
  {
    key: 'bus',
    label: 'Bus',
    icon: 'car',
    speed: 45,
    comfort: 58,
    co2: 0.068,
    color: '#f59e0b',
    pros: ['Reaches towns trains skip', 'Cheap overnight sleepers'],
    cons: ['Hill routes are tiring', 'Fewer comfort guarantees'],
  },
  {
    key: 'car',
    label: 'Self-drive / cab',
    icon: 'compass',
    speed: 55,
    comfort: 88,
    co2: 0.121,
    color: '#10b981',
    pros: ['Total flexibility and stops', 'Best for groups of four'],
    cons: ['Tolls and fuel add up', 'Driver fatigue on long hauls'],
  },
];

function estimateFare(modeKey, distanceKey, km, travellers) {
  const base = transportCosts[distanceKey] || transportCosts.medium;
  if (modeKey === 'train') return base.train * travellers;
  if (modeKey === 'flight') return base.flight * travellers;
  if (modeKey === 'bus') return Math.round(base.train * 0.75) * travellers;
  // self-drive: fuel + tolls, split across travellers in one vehicle
  return Math.round(km * 9.5 + km * 1.2);
}

const LOCAL_TIPS = [
  { icon: 'train', title: 'Metro first', body: 'Delhi, Mumbai, Bengaluru, Kolkata and Chennai metros beat traffic and cost under ₹60 per ride.' },
  { icon: 'car', title: 'App cabs after 10pm', body: 'Share the trip link, verify the plate, and prefer the in-app SOS over street hailing.' },
  { icon: 'ticket', title: 'Day passes', body: 'Most metro networks sell tourist day passes — worth it above three rides a day.' },
  { icon: 'wallet', title: 'Keep small change', body: 'Autos, ferries and local buses rarely have change for ₹500 notes.' },
];

function TransportPage() {
  usePageMeta('Transport | SafarAI', 'Railway and transport planning tools for smoother trip movement with SafarAI.');

  const [distanceKey, setDistanceKey] = useState('medium');
  const [travellers, setTravellers] = useState(2);
  const [priority, setPriority] = useState('balanced');

  const km = DISTANCE_PRESETS[distanceKey].km;

  const rows = useMemo(() => {
    const computed = MODES.map((mode) => {
      const fare = estimateFare(mode.key, distanceKey, km, travellers);
      const hours = km / mode.speed + (mode.key === 'flight' ? 3.5 : mode.key === 'train' ? 1 : 0.5);
      const co2 = Math.round(km * mode.co2 * (mode.key === 'car' ? 1 : travellers));
      return { ...mode, fare, hours, co2 };
    });

    const maxFare = Math.max(...computed.map((row) => row.fare));
    const maxHours = Math.max(...computed.map((row) => row.hours));
    const maxCo2 = Math.max(...computed.map((row) => row.co2));

    return computed
      .map((row) => {
        const costScore = 1 - row.fare / maxFare;
        const timeScore = 1 - row.hours / maxHours;
        const greenScore = 1 - row.co2 / maxCo2;
        const comfortScore = row.comfort / 100;

        const weights =
          priority === 'cost'
            ? { costScore: 0.55, timeScore: 0.15, greenScore: 0.15, comfortScore: 0.15 }
            : priority === 'time'
            ? { costScore: 0.15, timeScore: 0.55, greenScore: 0.1, comfortScore: 0.2 }
            : priority === 'green'
            ? { costScore: 0.2, timeScore: 0.1, greenScore: 0.55, comfortScore: 0.15 }
            : { costScore: 0.3, timeScore: 0.3, greenScore: 0.2, comfortScore: 0.2 };

        const score = Math.round(
          (costScore * weights.costScore +
            timeScore * weights.timeScore +
            greenScore * weights.greenScore +
            comfortScore * weights.comfortScore) *
            100
        );

        return { ...row, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [distanceKey, travellers, km, priority]);

  const best = rows[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Transport"
        icon="car"
        title="Pick the right way to get there"
        description="Compare cost, journey time, comfort and carbon across train, flight, bus and road for the distance you are covering."
        actions={
          <>
            <Button to="/railway" leadingIcon="train">
              Railway explorer
            </Button>
            <Button to="/budget" variant="secondary" leadingIcon="wallet">
              Budget tool
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
        <Card padding="lg" className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
          <h2 className="text-base font-bold text-fg">Your journey</h2>

          <div className="mt-4 space-y-4">
            <Field label="Distance band" htmlFor="tr-distance" hint={`≈ ${km} km`}>
              <Select id="tr-distance" icon="map" value={distanceKey} onChange={(event) => setDistanceKey(event.target.value)}>
                {Object.entries(DISTANCE_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.label} (~{preset.km} km)
                  </option>
                ))}
              </Select>
            </Field>

            <RangeSlider
              id="tr-travellers"
              label="Travellers"
              min={1}
              max={8}
              value={travellers}
              onChange={setTravellers}
              format={(value) => `${value}`}
            />

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">Optimise for</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'balanced', label: 'Balanced', icon: 'target' },
                  { value: 'cost', label: 'Lowest cost', icon: 'wallet' },
                  { value: 'time', label: 'Fastest', icon: 'zap' },
                  { value: 'green', label: 'Greenest', icon: 'leaf' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    aria-pressed={priority === option.value}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200',
                      priority === option.value
                        ? 'border-transparent bg-brand-gradient text-white shadow-float'
                        : 'border-line bg-surface text-fg-muted hover:border-brand-300'
                    )}
                  >
                    <Icon name={option.icon} size="sm" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {best && (
            <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-400/25 dark:bg-brand-500/10">
              <p className="text-2xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-200">
                Recommended
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-base font-extrabold text-fg">
                <Icon name={best.icon} size="md" className="text-brand-600 dark:text-brand-300" />
                {best.label}
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                {formatINR(best.fare)} · {best.hours.toFixed(1)}h · {best.co2} kg CO₂
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((row, index) => (
              <Card key={row.key} padding="lg" interactive className={cn(index === 0 && 'ring-2 ring-brand-500/25')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-float"
                      style={{ background: row.color }}
                    >
                      <Icon name={row.icon} size="md" />
                    </span>
                    <div>
                      <p className="text-base font-bold text-fg">{row.label}</p>
                      <p className="text-2xs text-fg-subtle">
                        {travellers} traveller{travellers > 1 ? 's' : ''} · {km} km
                      </p>
                    </div>
                  </div>
                  {index === 0 && <Badge tone="brand" icon="star">Best match</Badge>}
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-surface-muted p-3 text-center">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">Cost</dt>
                    <dd className="mt-0.5 text-sm font-extrabold text-fg">{formatINR(row.fare, { compact: true })}</dd>
                  </div>
                  <div className="border-x border-line">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">Time</dt>
                    <dd className="mt-0.5 text-sm font-extrabold text-fg">{row.hours.toFixed(1)}h</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">CO₂</dt>
                    <dd className="mt-0.5 text-sm font-extrabold text-fg">{row.co2}kg</dd>
                  </div>
                </dl>

                <div className="mt-4 space-y-2">
                  <Progress label="Match score" value={row.score} showValue size="sm" tone={index === 0 ? 'brand' : 'success'} />
                  <Progress label="Comfort" value={row.comfort} size="sm" tone="violet" />
                </div>

                <div className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
                  <ul className="space-y-1.5">
                    {row.pros.slice(0, 2).map((pro) => (
                      <li key={pro} className="flex gap-1.5 text-2xs leading-5 text-fg-muted">
                        <Icon name="check" size="xs" className="mt-0.5 shrink-0 text-emerald-500" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1.5">
                    {row.cons.map((con) => (
                      <li key={con} className="flex gap-1.5 text-2xs leading-5 text-fg-muted">
                        <Icon name="minus" size="xs" className="mt-0.5 shrink-0 text-rose-400" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>

          <Card padding="lg">
            <h2 className="text-base font-bold text-fg">Cost comparison</h2>
            <p className="mt-1 text-xs text-fg-muted">Total for {travellers} traveller{travellers > 1 ? 's' : ''} over {km} km.</p>
            <div className="mt-5">
              <BarChart
                data={rows.map((row) => ({ label: row.label, value: row.fare, color: row.color }))}
                height={180}
                valueFormatter={(value) => formatINR(value)}
              />
            </div>
          </Card>

          <Card padding="lg" tone="muted">
            <h2 className="text-base font-bold text-fg">Getting around once you arrive</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {LOCAL_TIPS.map((tip) => (
                <div key={tip.title} className="flex gap-3 rounded-xl border border-line bg-surface p-3.5">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300">
                    <Icon name={tip.icon} size="sm" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-fg">{tip.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-fg-muted">{tip.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TransportPage;
