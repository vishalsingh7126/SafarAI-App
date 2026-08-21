import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import { Steps } from '../components/ui/Progress';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Field, Input, Select } from '../components/ui/Input';
import TripPreferences, { defaultPreferences, selectedPreferenceLabels } from '../components/SearchPanel';
import {
  STYLE_OPTIONS,
  STYLE_ICONS,
  DAY_COLORS,
  generateItinerary,
  formatTimelineActivities,
} from '../lib/itineraryEngine';
import { destinations, findDestination } from '../data/destinations';
import { destinationCosts } from '../data/budgetDatabase';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useAssistant } from '../context/AssistantContext';
import { formatINR, formatDate } from '../lib/format';
import { cn } from '../lib/cn';

const STYLE_META = {
  adventure: { icon: 'zap', blurb: 'Treks, water sports, adrenaline' },
  relaxation: { icon: 'leaf', blurb: 'Slow mornings, spas, sunsets' },
  cultural: { icon: 'building', blurb: 'Heritage, museums, old towns' },
  food: { icon: 'utensils', blurb: 'Street eats to fine dining' },
  nature: { icon: 'mountain', blurb: 'Wildlife, forests, waterfalls' },
};

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function DayCard({ item, index, total, expanded, onToggle }) {
  const activities = formatTimelineActivities(item.activities);

  return (
    <article className="relative pl-10 sm:pl-12">
      {index < total - 1 && (
        <span
          aria-hidden="true"
          className="absolute left-[1.15rem] top-11 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-brand-300 to-transparent sm:left-[1.4rem]"
        />
      )}
      <span
        className={cn(
          'absolute left-0 top-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-float sm:h-11 sm:w-11 sm:text-sm',
          DAY_COLORS[index % DAY_COLORS.length]
        )}
      >
        D{item.day}
      </span>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all duration-300 hover:border-brand-200 hover:shadow-lift">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <span className="min-w-0">
            <span className="block text-sm font-bold text-fg">
              {item.title} · {activities.length === 1 ? 'Full day plan' : `${activities.length} blocks`}
            </span>
            <span className="mt-0.5 block truncate text-xs text-fg-muted">{item.activities}</span>
          </span>
          <Icon
            name="chevronDown"
            size="sm"
            className={cn('shrink-0 text-fg-subtle transition-transform duration-300', expanded && 'rotate-180')}
          />
        </button>

        <div
          className={cn(
            'grid transition-all duration-300 ease-smooth',
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <ul className="space-y-2.5 border-t border-line px-5 py-4">
              {activities.map((activity, activityIndex) => (
                <li key={`${item.day}-${activityIndex}`} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 shrink-0 items-center rounded-full bg-brand-50 px-2 text-2xs font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-500/12 dark:text-brand-200">
                    {activity.label}
                  </span>
                  <p className="text-sm leading-6 text-fg-muted">{activity.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

function TripPlanner() {
  usePageMeta('Trip Planner | SafarAI', 'Generate AI-powered multi-day travel itineraries with SafarAI.');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addTrip, logActivity, preferences: workspacePrefs } = useWorkspace();
  const toast = useToast();
  const { send, openDock } = useAssistant();

  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [style, setStyle] = useState(searchParams.get('style') || workspacePrefs.travelStyle || 'cultural');
  const [prefs, setPrefs] = useState(defaultPreferences);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [expandedDays, setExpandedDays] = useState({ 1: true });
  const resultRef = useRef(null);

  /* ---------------------------------------------------------- date helpers */
  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate) - new Date(startDate);
    return diff < 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const days = calcDays();
  const invalidRange = Boolean(startDate && endDate && days <= 0);

  // Prefill dates from ?days= so hero search lands on a ready-to-generate form
  useEffect(() => {
    const requested = Number(searchParams.get('days'));
    if (!requested || startDate) return;
    const start = new Date();
    start.setDate(start.getDate() + 14);
    const end = new Date(start);
    end.setDate(end.getDate() + Math.max(1, requested) - 1);
    setStartDate(toISO(start));
    setEndDate(toISO(end));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (length) => {
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const end = new Date(start);
    end.setDate(end.getDate() + length - 1);
    setStartDate(toISO(start));
    setEndDate(toISO(end));
  };

  /* -------------------------------------------------------------- estimate */
  const matched = useMemo(() => findDestination(destination), [destination]);

  const estimate = useMemo(() => {
    if (!days) return null;
    const key = destination.trim().toLowerCase();
    const costs = destinationCosts[key] || {
      hotelCost: matched?.dailyCost ? Math.round(matched.dailyCost * 0.45) : 3200,
      foodCost: 1100,
      transportCost: 800,
      activityCost: 1300,
    };
    const travellers = Math.max(1, Number(prefs.travelers) || 1);
    const styleMultiplier =
      prefs.tripType === 'Luxury' ? 1.6 : prefs.tripType === 'Budget' || prefs.budgetFriendly ? 0.85 : 1;

    const total = Math.round(
      (costs.hotelCost * days +
        costs.foodCost * travellers * days +
        costs.activityCost * days +
        costs.transportCost * travellers) *
        styleMultiplier
    );

    return { total, perDay: Math.round(total / days), travellers, withinBudget: total <= prefs.budget };
  }, [days, destination, matched, prefs]);

  const suggestions = useMemo(() => {
    const needle = destination.trim().toLowerCase();
    const list = needle
      ? destinations.filter((item) => `${item.name} ${item.country}`.toLowerCase().includes(needle))
      : destinations;
    return list.slice(0, 5);
  }, [destination]);

  const currentStep = itinerary ? 2 : destination.trim() && days > 0 ? 1 : 0;

  /* -------------------------------------------------------------- handlers */
  const handleGenerate = () => {
    if (!destination.trim() || days <= 0) return;
    setLoading(true);
    setSavedMsg(false);

    // Small deliberate delay so the loading state reads as "working", not broken.
    setTimeout(() => {
      const result = generateItinerary(destination, String(days), style);
      setItinerary(result);
      setHasGenerated(true);
      setLoading(false);
      setExpandedDays({ 1: true });
      logActivity({
        type: 'plan',
        title: `Generated a ${days}-day ${style} plan for ${destination.trim()}`,
        href: '/trip-planner',
        icon: 'sparkles',
      });
      toast.success('Itinerary ready', { description: `${days} days in ${destination.trim()} mapped out.` });
      setTimeout(() => {
        if (typeof resultRef.current?.scrollIntoView === 'function') {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    }, 650);
  };

  const handleSaveTrip = () => {
    if (!itinerary) return;
    addTrip({
      destination: destination.trim(),
      startDate,
      endDate,
      days,
      travelStyle: style,
      itinerary,
      travellers: prefs.travelers,
      estimate: estimate?.total,
    });
    setSavedMsg(true);
    toast.success('Trip saved', {
      description: 'Open My Trips to review or delete it later.',
      action: { label: 'View my trips', onClick: () => navigate('/my-trips') },
    });
  };

  const planAsText = () =>
    [
      `SafarAI — ${days}-day ${style} trip to ${destination.trim()}`,
      startDate && endDate ? `${formatDate(startDate)} → ${formatDate(endDate)}` : '',
      estimate ? `Estimated cost: ${formatINR(estimate.total)} for ${estimate.travellers} traveller(s)` : '',
      '',
      ...itinerary.map((item) => `Day ${item.day}: ${item.activities}`),
    ]
      .filter(Boolean)
      .join('\n');

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(planAsText());
      toast.success('Itinerary copied to clipboard');
    } catch {
      toast.error('Could not copy the itinerary');
    }
  };

  const downloadPlan = () => {
    const blob = new Blob([planAsText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `safarai-${destination.trim().toLowerCase().replace(/\s+/g, '-')}-${days}d.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Itinerary downloaded');
  };

  const refineWithAI = () => {
    openDock();
    send(
      `Refine this ${days}-day ${style} itinerary for ${destination.trim()} for ${prefs.travelers} traveller(s) with a ${formatINR(
        prefs.budget
      )} budget. Current plan: ${itinerary.map((item) => `Day ${item.day}: ${item.activities}`).join(' | ')}`
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI planner"
        icon="sparkles"
        title="Build a complete itinerary in one pass"
        description="Pick a destination, set your dates and travel style. SafarAI drafts a realistic day-by-day plan you can save, refine or export."
        actions={
          <>
            <Button to="/my-trips" variant="secondary" leadingIcon="luggage">
              My trips
            </Button>
            <Button to="/budget" variant="ghost" leadingIcon="wallet">
              Budget tool
            </Button>
          </>
        }
      >
        <div className="mt-6 max-w-lg">
          <Steps steps={['Trip basics', 'Travel style', 'Your itinerary']} current={currentStep} />
        </div>
      </PageHeader>

      {/* ------------------------------------------------------------- form */}
      <Card padding="lg">
        <CardHeader
          icon={<Icon name="compass" size="md" />}
          title="Plan your trip"
          subtitle="Everything marked with * is required"
          action={
            <Button
              variant="ghost"
              size="sm"
              leadingIcon="settings"
              onClick={() => setPrefsOpen((prev) => !prev)}
              aria-expanded={prefsOpen}
            >
              {prefsOpen ? 'Hide preferences' : 'Preferences'}
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Field label="Destination" required htmlFor="tp-destination" hint={matched ? `${matched.country} · best ${matched.bestTime}` : 'Any city, country or region'}>
              <Input
                id="tp-destination"
                icon="mapPin"
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  setSuggestOpen(true);
                }}
                onFocus={() => setSuggestOpen(true)}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                onKeyDown={(event) => event.key === 'Enter' && handleGenerate()}
                placeholder="e.g. Goa, Tokyo, Lisbon"
                autoComplete="off"
              />
            </Field>

            {suggestOpen && suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-[4.6rem] z-40 overflow-hidden rounded-xl border border-line bg-surface-raised p-1.5 shadow-lift animate-slide-down">
                {suggestions.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setDestination(item.name);
                      setSuggestOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-surface-muted"
                  >
                    <img src={item.image} alt="" loading="lazy" className="h-7 w-7 rounded object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">{item.name}</span>
                      <span className="block truncate text-2xs text-fg-subtle">{item.tagline}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Field label="Start date" required htmlFor="tp-start">
            <Input
              id="tp-start"
              type="date"
              value={startDate}
              min={toISO(new Date())}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>

          <Field
            label="End date"
            required
            htmlFor="tp-end"
            error={invalidRange ? 'End date must be on or after the start date.' : undefined}
          >
            <Input
              id="tp-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              invalid={invalidRange}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Field>

          <Field label="Trip length" htmlFor="tp-length" hint="Quick presets">
            <Select
              id="tp-length"
              icon="calendar"
              value={days || ''}
              onChange={(event) => applyPreset(Number(event.target.value))}
            >
              <option value="">{days ? `${days} days selected` : 'Choose a preset'}</option>
              {[2, 3, 4, 5, 7, 10].map((value) => (
                <option key={value} value={value}>
                  {value} days from next week
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* style picker */}
        <fieldset className="mt-6">
          <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">Travel style</legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
            {STYLE_OPTIONS.map((option) => {
              const meta = STYLE_META[option.value] || { icon: 'compass', blurb: '' };
              const active = style === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStyle(option.value)}
                  aria-pressed={active}
                  className={cn(
                    'group flex flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition-all duration-200',
                    active
                      ? 'border-transparent bg-brand-gradient text-white shadow-float'
                      : 'border-line bg-surface text-fg-muted hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon name={meta.icon} size="md" className={active ? 'text-white' : 'text-brand-500'} />
                    <span className={cn('text-sm font-bold', active ? 'text-white' : 'text-fg')}>
                      {STYLE_ICONS[option.value]} {option.label}
                    </span>
                  </span>
                  <span className={cn('text-2xs leading-4', active ? 'text-white/80' : 'text-fg-subtle')}>
                    {meta.blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* preferences */}
        <div
          className={cn(
            'grid transition-all duration-300 ease-smooth',
            prefsOpen ? 'mt-6 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            <div className="rounded-2xl border border-line bg-surface-muted p-5">
              <TripPreferences values={prefs} onChange={setPrefs} />
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            {days > 0 && (
              <Badge tone="brand" icon="calendar">
                {days} {days === 1 ? 'day' : 'days'}
              </Badge>
            )}
            {estimate && (
              <Badge tone={estimate.withinBudget ? 'success' : 'warning'} icon="wallet">
                ≈ {formatINR(estimate.total)} {estimate.withinBudget ? 'within budget' : 'over budget cap'}
              </Badge>
            )}
            {prefs.travelers !== '1' && <Badge tone="neutral" icon="users">{prefs.travelers} travellers</Badge>}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!destination.trim() || days <= 0 || loading}
            loading={loading}
            leadingIcon={loading ? undefined : 'sparkles'}
            size="lg"
          >
            {loading ? 'Building your plan…' : itinerary ? 'Regenerate itinerary' : 'Generate itinerary'}
          </Button>
        </div>
      </Card>

      {/* --------------------------------------------------------- results */}
      <div ref={resultRef}>
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-4">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-20 flex-1 rounded-2xl" />
              </div>
            ))}
          </div>
        )}

        {!loading && itinerary && (
          <section className="space-y-5 animate-fade-up">
            <Card tone="gradient" padding="lg">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-2xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">
                    Your trip
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-fg">
                    {days} days in {destination.trim()}
                  </h2>
                  <p className="mt-1 text-sm text-fg-muted">
                    {formatDate(startDate)} → {formatDate(endDate)} · {STYLE_ICONS[style]}{' '}
                    {STYLE_OPTIONS.find((option) => option.value === style)?.label} ·{' '}
                    {selectedPreferenceLabels(prefs).slice(0, 2).join(', ') || 'Balanced plan'}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Days', value: days, icon: 'calendar' },
                    { label: 'Travellers', value: prefs.travelers, icon: 'users' },
                    { label: 'Est. cost', value: estimate ? formatINR(estimate.total, { compact: true }) : '—', icon: 'wallet' },
                    { label: 'Per day', value: estimate ? formatINR(estimate.perDay, { compact: true }) : '—', icon: 'trendUp' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-line bg-surface px-3.5 py-2.5">
                      <dt className="flex items-center gap-1 text-2xs font-semibold uppercase tracking-wide text-fg-subtle">
                        <Icon name={stat.icon} size="xs" />
                        {stat.label}
                      </dt>
                      <dd className="mt-1 text-base font-extrabold text-fg">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                <Button
                  onClick={handleSaveTrip}
                  variant={savedMsg ? 'success' : 'primary'}
                  leadingIcon={savedMsg ? 'check' : 'bookmark'}
                  disabled={savedMsg}
                  size="sm"
                >
                  {savedMsg ? 'Saved to My Trips' : 'Save trip'}
                </Button>
                <Button onClick={refineWithAI} variant="secondary" leadingIcon="bot" size="sm">
                  Refine with AI
                </Button>
                <Button onClick={copyPlan} variant="secondary" leadingIcon="copy" size="sm">
                  Copy
                </Button>
                <Button onClick={downloadPlan} variant="secondary" leadingIcon="download" size="sm">
                  Download
                </Button>
                <Button
                  onClick={() => {
                    setItinerary(null);
                    setHasGenerated(false);
                    setSavedMsg(false);
                  }}
                  variant="ghost"
                  leadingIcon="refresh"
                  size="sm"
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leadingIcon={Object.keys(expandedDays).length === itinerary.length ? 'minus' : 'plus'}
                  onClick={() =>
                    setExpandedDays((prev) =>
                      Object.keys(prev).length === itinerary.length
                        ? {}
                        : Object.fromEntries(itinerary.map((item) => [item.day, true]))
                    )
                  }
                >
                  {Object.keys(expandedDays).length === itinerary.length ? 'Collapse all' : 'Expand all'}
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              {itinerary.map((item, index) => (
                <DayCard
                  key={item.day}
                  item={item}
                  index={index}
                  total={itinerary.length}
                  expanded={Boolean(expandedDays[item.day])}
                  onToggle={() =>
                    setExpandedDays((prev) => {
                      const next = { ...prev };
                      if (next[item.day]) delete next[item.day];
                      else next[item.day] = true;
                      return next;
                    })
                  }
                />
              ))}
            </div>

            {matched && (
              <Card padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <img src={matched.image} alt="" loading="lazy" className="h-14 w-14 rounded-xl object-cover" />
                  <div>
                    <p className="text-sm font-bold text-fg">Keep planning {matched.name}</p>
                    <p className="text-xs text-fg-muted">Stays, food spots and safety notes for this destination.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button to={`/destination/${matched.slug}`} size="sm" variant="secondary" leadingIcon="compass">
                    Destination guide
                  </Button>
                  <Button to={`/hotels?city=${encodeURIComponent(matched.name)}`} size="sm" variant="secondary" leadingIcon="hotel">
                    Find stays
                  </Button>
                </div>
              </Card>
            )}
          </section>
        )}

        {!loading && !hasGenerated && (
          <EmptyState
            icon="map"
            title="Your itinerary will appear here"
            description="Add a destination and dates above, choose a travel style, then generate — you will get a day-by-day plan with morning, afternoon and evening blocks."
            action={{ label: 'Use a popular destination', onClick: () => setDestination('Goa'), icon: 'compass' }}
            secondaryAction={{ label: 'Ask the assistant instead', to: '/assistant', icon: 'bot' }}
          />
        )}
      </div>
    </div>
  );
}

export default TripPlanner;
