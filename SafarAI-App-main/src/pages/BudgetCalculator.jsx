import { useEffect, useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select, RangeSlider } from '../components/ui/Input';
import { DonutChart } from '../components/charts/Charts';
import { destinationCosts } from '../data/budgetDatabase';
import { stateHotelCosts } from '../data/stateHotelCosts';
import { transportCosts } from '../data/transportCosts';
import { seasonMultipliers } from '../data/seasonMultipliers';
import { formatINR } from '../lib/format';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useAssistant } from '../context/AssistantContext';
import { cn } from '../lib/cn';

/* Configuration preserved from the original calculator ---------------------- */

const STYLE_CONFIG = {
  Budget: { multiplier: 0.8, tone: 'success', icon: 'leaf', blurb: 'Hostels, buses, street food' },
  Standard: { multiplier: 1, tone: 'brand', icon: 'compass', blurb: '3-star stays, mixed transport' },
  Luxury: { multiplier: 1.6, tone: 'violet', icon: 'sparkles', blurb: 'Premium hotels, private cabs' },
};

const DESTINATION_STATE_MAP = {
  goa: 'goa',
  manali: 'himachal_pradesh',
  jaipur: 'rajasthan',
  delhi: 'delhi',
  mumbai: 'maharashtra',
  kerala: 'kerala',
  'leh ladakh': 'ladakh',
  rishikesh: 'uttarakhand',
  udaipur: 'rajasthan',
  shimla: 'himachal_pradesh',
  darjeeling: 'west_bengal',
  gangtok: 'sikkim',
  amritsar: 'punjab',
  varanasi: 'uttar_pradesh',
  pondicherry: 'tamil_nadu',
  hampi: 'karnataka',
  ooty: 'tamil_nadu',
  munnar: 'kerala',
  andaman: 'andaman_nicobar',
  lakshadweep: 'lakshadweep',
};

const CATEGORY_META = {
  hotel: { label: 'Stay', icon: 'hotel', color: '#4f46e5' },
  food: { label: 'Food', icon: 'utensils', color: '#06b6d4' },
  travel: { label: 'Travel', icon: 'train', color: '#f59e0b' },
  activities: { label: 'Activities', icon: 'camera', color: '#10b981' },
};

const destinationOptions = Object.keys(destinationCosts).map((key) => ({
  value: key,
  label: key
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' '),
}));

const SEASON_LABELS = { off: 'Off season', normal: 'Normal season', peak: 'Peak season' };

function BudgetCalculator() {
  usePageMeta('Budget Calculator | SafarAI', 'Estimate destination-based travel cost using smart trip budget calculations.');

  const { logActivity } = useWorkspace();
  const toast = useToast();
  const { send, openDock } = useAssistant();

  const [form, setForm] = useState({
    destination: destinationOptions[0]?.value || '',
    days: '3',
    travelers: '2',
    style: 'Standard',
    travelMode: 'train',
    distance: 'medium',
    season: 'normal',
  });
  const [cap, setCap] = useState(60000);
  const [result, setResult] = useState(null);

  const selectedDestinationLabel = useMemo(
    () => destinationOptions.find((option) => option.value === form.destination)?.label || form.destination,
    [form.destination]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* Calculation logic preserved verbatim from the original implementation. */
  function computeResult() {
    const days = Math.max(1, parseInt(form.days, 10) || 1);
    const travelers = Math.max(1, parseInt(form.travelers, 10) || 1);

    const destination = destinationCosts[form.destination];
    const destinationState = DESTINATION_STATE_MAP[form.destination];
    const hotelCost = stateHotelCosts[destinationState] || destination?.hotelCost || 0;
    const styleMultiplier = STYLE_CONFIG[form.style]?.multiplier || 1;
    const seasonMultiplier = seasonMultipliers[form.season] || 1;

    const modeKey = form.travelMode === 'flight' ? 'flight' : 'train';
    const distanceKey = form.distance in transportCosts ? form.distance : 'medium';
    const transportCost = transportCosts[distanceKey]?.[modeKey] || 0;

    if (!destination) return null;

    const dailyCost = hotelCost + destination.foodCost * travelers + destination.activityCost;
    const travelCost = transportCost * travelers;

    const baseHotel = hotelCost * days;
    const baseFood = destination.foodCost * travelers * days;
    const baseActivities = destination.activityCost * days;

    const hotel = Math.round(baseHotel * styleMultiplier * seasonMultiplier);
    const food = Math.round(baseFood * styleMultiplier * seasonMultiplier);
    const activities = Math.round(baseActivities * styleMultiplier * seasonMultiplier);
    const travel = Math.round(travelCost * styleMultiplier * seasonMultiplier);

    const total = Math.round((dailyCost * days + travelCost) * styleMultiplier * seasonMultiplier);

    return {
      hotel,
      food,
      travel,
      activities,
      total,
      days,
      travelers,
      style: form.style,
      destination: selectedDestinationLabel,
      travelMode: form.travelMode === 'flight' ? 'Flight' : 'Train',
      distance: form.distance.charAt(0).toUpperCase() + form.distance.slice(1),
      season: SEASON_LABELS[form.season] || 'Normal season',
      styleMultiplier,
      seasonMultiplier,
    };
  }

  function handleCalculate(event) {
    event.preventDefault();
    const next = computeResult();
    if (!next) return;
    setResult(next);
    logActivity({
      type: 'budget',
      title: `Estimated ${formatINR(next.total)} for ${next.destination}`,
      href: '/budget',
      icon: 'wallet',
    });
    toast.success('Budget calculated', {
      description: `${formatINR(next.total)} for ${next.days} days · ${next.travelers} traveller(s).`,
    });
  }

  // Live preview keeps the summary card in sync while the user tweaks inputs.
  const preview = useMemo(computeResult, [form, selectedDestinationLabel]);
  const shown = result || preview;

  useEffect(() => {
    if (result) setResult(computeResult());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const donutData = shown
    ? Object.entries(CATEGORY_META).map(([key, meta]) => ({
        label: meta.label,
        value: shown[key],
        display: formatINR(shown[key], { compact: true }),
        color: meta.color,
      }))
    : [];

  const perPerson = shown ? Math.round(shown.total / shown.travelers) : 0;
  const perDay = shown ? Math.round(shown.total / shown.days) : 0;
  const capUsage = shown ? Math.min(100, Math.round((shown.total / cap) * 100)) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Budget planner"
        icon="wallet"
        title="Know the real cost before you book"
        description="Destination averages, state-level stay pricing, transport mode and season multipliers combined into one live estimate."
        actions={
          <>
            <Button to="/trip-planner" variant="secondary" leadingIcon="sparkles">
              Plan itinerary
            </Button>
            <Button to="/hotels" variant="ghost" leadingIcon="hotel">
              Compare stays
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        {/* ------------------------------------------------------------ form */}
        <Card padding="lg" as="form" onSubmit={handleCalculate}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Destination" htmlFor="destination" className="sm:col-span-2">
              <Select id="destination" name="destination" icon="mapPin" value={form.destination} onChange={handleChange}>
                {destinationOptions.map((destination) => (
                  <option key={destination.value} value={destination.value}>
                    {destination.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Number of days" htmlFor="days">
              <Input id="days" name="days" type="number" min="1" max="60" value={form.days} onChange={handleChange} icon="calendar" />
            </Field>

            <Field label="Number of travellers" htmlFor="travelers">
              <Input
                id="travelers"
                name="travelers"
                type="number"
                min="1"
                max="50"
                value={form.travelers}
                onChange={handleChange}
                icon="users"
              />
            </Field>
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">Travel style</legend>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {Object.entries(STYLE_CONFIG).map(([key, config]) => {
                const active = form.style === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, style: key }))}
                    aria-pressed={active}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all duration-200',
                      active
                        ? 'border-transparent bg-brand-gradient text-white shadow-float'
                        : 'border-line bg-surface hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon name={config.icon} size="md" className={active ? 'text-white' : 'text-brand-500'} />
                      <span className={cn('text-sm font-bold', active ? 'text-white' : 'text-fg')}>{key}</span>
                    </span>
                    <span className={cn('text-2xs', active ? 'text-white/80' : 'text-fg-subtle')}>{config.blurb}</span>
                    <span className={cn('text-2xs font-bold', active ? 'text-white' : 'text-brand-600 dark:text-brand-300')}>
                      ×{config.multiplier}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field label="Travel mode" htmlFor="travelMode">
              <Select id="travelMode" name="travelMode" icon="train" value={form.travelMode} onChange={handleChange}>
                <option value="train">Train</option>
                <option value="flight">Flight</option>
              </Select>
            </Field>

            <Field label="Distance" htmlFor="distance">
              <Select id="distance" name="distance" icon="map" value={form.distance} onChange={handleChange}>
                <option value="short">Short (&lt; 500 km)</option>
                <option value="medium">Medium (500–1200 km)</option>
                <option value="long">Long (&gt; 1200 km)</option>
              </Select>
            </Field>

            <Field label="Season" htmlFor="season">
              <Select id="season" name="season" icon="sun" value={form.season} onChange={handleChange}>
                <option value="off">Off season (×0.85)</option>
                <option value="normal">Normal (×1)</option>
                <option value="peak">Peak (×1.35)</option>
              </Select>
            </Field>
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-surface-muted p-4">
            <RangeSlider
              id="budget-cap"
              label="Your budget cap"
              min={10000}
              max={300000}
              step={5000}
              value={cap}
              onChange={setCap}
              format={(value) => formatINR(value, { compact: true })}
            />
            {shown && (
              <div className="mt-3">
                <Progress
                  value={capUsage}
                  tone={shown.total <= cap ? 'success' : 'danger'}
                  label={shown.total <= cap ? 'Within your cap' : 'Over your cap'}
                  showValue
                />
                <p className="mt-1.5 text-xs text-fg-muted">
                  {shown.total <= cap
                    ? `${formatINR(cap - shown.total)} left for shopping and extras.`
                    : `${formatINR(shown.total - cap)} above your cap — try off-season dates or the budget style.`}
                </p>
              </div>
            )}
          </div>

          <Button type="submit" size="lg" fullWidth className="mt-5" leadingIcon="chart">
            Calculate budget
          </Button>
        </Card>

        {/* --------------------------------------------------------- results */}
        <div className="space-y-4 lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
          {!shown ? (
            <EmptyState
              icon="wallet"
              title="Pick a destination to see the estimate"
              description="We combine state-level hotel pricing, per-day food and activity averages, and your transport mode."
            />
          ) : (
            <>
              <Card tone="gradient" padding="lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
                      Estimated total
                    </p>
                    <p className="mt-2 text-4xl font-extrabold tracking-tight text-fg">{formatINR(shown.total)}</p>
                    <p className="mt-1 text-sm text-fg-muted">
                      {shown.destination} · {shown.days} days · {shown.travelers} traveller
                      {shown.travelers > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge tone={STYLE_CONFIG[shown.style]?.tone || 'brand'} icon={STYLE_CONFIG[shown.style]?.icon}>
                    {shown.style}
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-line bg-surface px-4 py-3">
                    <p className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">Per person</p>
                    <p className="mt-1 text-lg font-extrabold text-fg">{formatINR(perPerson)}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-surface px-4 py-3">
                    <p className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">Per day</p>
                    <p className="mt-1 text-lg font-extrabold text-fg">{formatINR(perDay)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-2xs">
                  <Badge tone="neutral" icon="train">
                    {shown.travelMode} · {shown.distance}
                  </Badge>
                  <Badge tone="neutral" icon="sun">
                    {shown.season} (×{shown.seasonMultiplier})
                  </Badge>
                  <Badge tone="neutral" icon="target">
                    Style ×{shown.styleMultiplier}
                  </Badge>
                </div>
              </Card>

              <Card padding="lg">
                <h2 className="text-base font-bold text-fg">Where the money goes</h2>
                <div className="mt-4">
                  <DonutChart
                    data={donutData}
                    size={150}
                    thickness={20}
                    centerLabel="Total"
                    centerValue={formatINR(shown.total, { compact: true })}
                  />
                </div>
              </Card>

              <Card padding="lg">
                <h2 className="text-base font-bold text-fg">Line items</h2>
                <ul className="mt-3 space-y-2.5">
                  {Object.entries(CATEGORY_META).map(([key, meta]) => (
                    <li key={key} className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted p-3">
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ background: meta.color }}
                      >
                        <Icon name={meta.icon} size="sm" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-fg">{meta.label}</span>
                        <span className="block text-2xs text-fg-subtle">
                          {key === 'hotel' && `${shown.days} night${shown.days > 1 ? 's' : ''} stay`}
                          {key === 'food' && `${shown.days} days × ${shown.travelers} traveller${shown.travelers > 1 ? 's' : ''}`}
                          {key === 'travel' && `${shown.travelMode} (${shown.distance}) × ${shown.travelers}`}
                          {key === 'activities' && `${shown.days} day${shown.days > 1 ? 's' : ''} of experiences`}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-extrabold text-fg">{formatINR(shown[key])}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    leadingIcon="bot"
                    onClick={() => {
                      openDock();
                      send(
                        `How can I reduce a ${formatINR(shown.total)} budget for ${shown.days} days in ${
                          shown.destination
                        } with ${shown.travelers} travellers? Give specific swaps.`
                      );
                    }}
                  >
                    Ask AI to cut costs
                  </Button>
                  <Button size="sm" variant="ghost" leadingIcon="copy"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        `${shown.destination} · ${shown.days} days · ${shown.travelers} travellers = ${formatINR(shown.total)}`
                      );
                      toast.success('Estimate copied');
                    }}
                  >
                    Copy estimate
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BudgetCalculator;
