import { useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import { Progress } from '../components/ui/Progress';
import { RadialScore } from '../components/charts/Charts';
import { Select, Checkbox } from '../components/ui/Input';
import { destinations } from '../data/destinations';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useAssistant } from '../context/AssistantContext';
import { cn } from '../lib/cn';

const EMERGENCY_NUMBERS = [
  { label: 'All-in-one emergency', number: '112', icon: 'alert', tone: 'danger' },
  { label: 'Police', number: '100', icon: 'shield', tone: 'brand' },
  { label: 'Ambulance', number: '108', icon: 'plus', tone: 'success' },
  { label: 'Fire', number: '101', icon: 'flame', tone: 'warning' },
  { label: 'Women helpline', number: '1091', icon: 'users', tone: 'violet' },
  { label: 'Tourist helpline', number: '1363', icon: 'compass', tone: 'accent' },
  { label: 'Railway (Rail Madad)', number: '139', icon: 'train', tone: 'brand' },
  { label: 'Cyber crime', number: '1930', icon: 'wifi', tone: 'neutral' },
];

const CHECKLIST = [
  { id: 'id', label: 'Digital + physical copy of ID', detail: 'DigiLocker or printed passport/Aadhaar copy' },
  { id: 'contact', label: 'Emergency contact shared', detail: 'One person knows your daily plan' },
  { id: 'location', label: 'Live location sharing enabled', detail: 'For late-night or remote travel' },
  { id: 'insurance', label: 'Travel insurance active', detail: 'Covers medical evacuation for mountain trips' },
  { id: 'cash', label: 'Backup cash + second card', detail: 'ATMs are unreliable in remote areas' },
  { id: 'offline', label: 'Offline maps downloaded', detail: 'Ghats and valleys lose signal' },
  { id: 'meds', label: 'Basic medical kit packed', detail: 'ORS, antiseptic, personal prescriptions' },
  { id: 'numbers', label: 'Local emergency numbers saved', detail: 'Add 112 to favourites' },
];

const SCENARIOS = [
  {
    icon: 'moon',
    title: 'Arriving late at night',
    steps: [
      'Pre-book an airport/station transfer instead of hailing on the street.',
      'Share your live location with a contact until you check in.',
      'Confirm your stay has 24×7 reception before booking a late arrival.',
    ],
  },
  {
    icon: 'users',
    title: 'Travelling solo',
    steps: [
      'Keep one dummy wallet with small change for crowded markets.',
      'Prefer stays with verified reviews from solo travellers.',
      'Check in with someone at a fixed time each day.',
    ],
  },
  {
    icon: 'mountain',
    title: 'High altitude routes',
    steps: [
      'Acclimatise for 24–48 hours before crossing 4,000 m passes.',
      'Carry a pulse oximeter and know the descent plan.',
      'Avoid alcohol and heavy meals on day one.',
    ],
  },
  {
    icon: 'wallet',
    title: 'Money and scams',
    steps: [
      'Insist on the meter or use an app-based cab with a shared trip link.',
      'Verify shop prices before agreeing to “tour guide” detours.',
      'Never hand your card over — pay at the terminal in front of you.',
    ],
  },
];

function SafetyPage() {
  usePageMeta('Safety | SafarAI', 'Get travel safety intelligence and context-aware alerts with SafarAI.');

  const { preferences } = useWorkspace();
  const toast = useToast();
  const { send, openDock } = useAssistant();

  const [tab, setTab] = useState('scores');
  const [selected, setSelected] = useState(destinations[0].slug);
  const [checked, setChecked] = useState({});

  const destination = destinations.find((item) => item.slug === selected) || destinations[0];
  const completion = Math.round((Object.values(checked).filter(Boolean).length / CHECKLIST.length) * 100);

  const [rankedLimit, setRankedLimit] = useState(12);
  const rankedAll = useMemo(() => [...destinations].sort((a, b) => b.safetyScore - a.safetyScore), []);
  const ranked = useMemo(() => rankedAll.slice(0, rankedLimit), [rankedAll, rankedLimit]);

  const scoreTone = (score) => (score >= 88 ? 'success' : score >= 80 ? 'brand' : score >= 72 ? 'warning' : 'danger');
  const scoreColor = (score) => (score >= 88 ? '#10b981' : score >= 80 ? '#4f46e5' : score >= 72 ? '#f59e0b' : '#f43f5e');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Safety intelligence"
        icon="shield"
        title="Travel confident, not cautious"
        description="Destination risk scores, an emergency toolkit that works offline, and scenario playbooks for the situations travellers actually hit."
        stats={[
          { label: 'Destinations scored', value: destinations.length },
          { label: 'Checklist done', value: `${completion}%` },
          { label: 'Emergency numbers', value: EMERGENCY_NUMBERS.length },
        ]}
        actions={
          <Button
            leadingIcon="bot"
            onClick={() => {
              openDock();
              send(`Give me safety advice for travelling to ${destination.name} from ${preferences.homeCity}.`);
            }}
          >
            Ask about a destination
          </Button>
        }
      />

      {/* SOS band */}
      <Card padding="lg" className="border-rose-200 bg-rose-50/60 dark:border-rose-500/25 dark:bg-rose-500/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-float">
              <span className="absolute inset-0 rounded-2xl bg-rose-500/50 animate-pulse-ring" aria-hidden="true" />
              <Icon name="alert" size="lg" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-fg">In an emergency in India, dial 112</p>
              <p className="text-xs text-fg-muted">One number for police, fire and ambulance — works without a SIM balance.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="tel:112" variant="danger" leadingIcon="phone">
              Call 112
            </Button>
            <Button
              variant="secondary"
              leadingIcon="share"
              onClick={async () => {
                if (!navigator.geolocation) {
                  toast.error('Location not supported on this device');
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  async ({ coords }) => {
                    const link = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
                    try {
                      if (navigator.share) await navigator.share({ title: 'My live location', url: link });
                      else {
                        await navigator.clipboard.writeText(link);
                        toast.success('Location link copied', { description: 'Send it to your emergency contact.' });
                      }
                    } catch {
                      /* dismissed */
                    }
                  },
                  () => toast.error('Could not get your location')
                );
              }}
            >
              Share my location
            </Button>
          </div>
        </div>
      </Card>

      <Tabs
        tabs={[
          { value: 'scores', label: 'Risk scores', icon: 'chart' },
          { value: 'toolkit', label: 'Emergency kit', icon: 'phone' },
          { value: 'checklist', label: 'Pre-trip checklist', icon: 'checkCircle' },
          { value: 'playbooks', label: 'Playbooks', icon: 'layers' },
        ]}
        value={tab}
        onChange={setTab}
        className="w-full overflow-x-auto"
      />

      {tab === 'scores' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <Card padding="lg">
            <label htmlFor="safety-dest" className="text-xs font-bold uppercase tracking-wide text-fg-subtle">
              Destination
            </label>
            <Select
              id="safety-dest"
              icon="mapPin"
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              className="mt-2"
            >
              {[...destinations]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name} · {item.country}
                  </option>
                ))}
            </Select>

            <div className="mt-6 flex flex-col items-center">
              <RadialScore value={destination.safetyScore} label="/ 100" size={150} tone={scoreColor(destination.safetyScore)} />
              <Badge tone={scoreTone(destination.safetyScore)} className="mt-3">
                {destination.safetyScore >= 88
                  ? 'Very safe'
                  : destination.safetyScore >= 80
                  ? 'Generally safe'
                  : destination.safetyScore >= 72
                  ? 'Stay alert'
                  : 'Extra caution'}
              </Badge>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { label: 'Night mobility', value: Math.min(100, destination.safetyScore + 4) },
                { label: 'Transport reliability', value: Math.max(45, destination.safetyScore - 6) },
                { label: 'Medical access', value: Math.max(50, destination.safetyScore - 2) },
                { label: 'Tourist support', value: Math.min(100, destination.safetyScore + 2) },
              ].map((row) => (
                <Progress key={row.label} label={row.label} value={row.value} showValue size="sm" tone={scoreTone(row.value)} />
              ))}
            </div>

            <Button
              to={`/destination/${destination.slug}`}
              variant="secondary"
              fullWidth
              className="mt-6"
              trailingIcon="arrowRight"
            >
              Open {destination.name} guide
            </Button>
          </Card>

          <Card padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-fg">Safest destinations right now</h2>
                <p className="mt-1 text-xs text-fg-muted">
                  Aggregated traveller reports, advisories and transport reliability.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-2xs font-bold text-fg-muted">
                top {ranked.length}
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {ranked.map((item, index) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => setSelected(item.slug)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition',
                      item.slug === selected
                        ? 'border-brand-300 bg-brand-50 dark:border-brand-400/30 dark:bg-brand-500/10'
                        : 'border-line bg-surface-muted hover:border-brand-200'
                    )}
                  >
                    <span className="w-5 text-2xs font-bold text-fg-subtle">{index + 1}</span>
                    <img src={item.image} alt="" loading="lazy" className="h-9 w-9 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">{item.name}</span>
                      <span className="block truncate text-2xs text-fg-subtle">{item.country}</span>
                    </span>
                    <span className="w-24">
                      <Progress value={item.safetyScore} size="sm" tone={scoreTone(item.safetyScore)} />
                    </span>
                    <span className="w-8 text-right text-xs font-extrabold text-fg">{item.safetyScore}</span>
                  </button>
                </li>
              ))}
            </ul>
            {rankedLimit < rankedAll.length && (
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                className="mt-4"
                leadingIcon="plus"
                onClick={() => setRankedLimit((prev) => prev + 20)}
              >
                Show more destinations
              </Button>
            )}
          </Card>
        </div>
      )}

      {tab === 'toolkit' && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {EMERGENCY_NUMBERS.map((item) => (
              <Card key={item.number} padding="md" interactive className="text-center">
                <span
                  className={cn(
                    'mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl',
                    item.tone === 'danger'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
                      : 'bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300'
                  )}
                >
                  <Icon name={item.icon} size="md" />
                </span>
                <p className="mt-3 text-xs font-semibold text-fg-muted">{item.label}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-fg">{item.number}</p>
                <div className="mt-3 flex justify-center gap-2">
                  <Button href={`tel:${item.number}`} size="xs" variant="secondary" leadingIcon="phone">
                    Call
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    iconOnly
                    leadingIcon="copy"
                    aria-label={`Copy ${item.label} number`}
                    onClick={async () => {
                      await navigator.clipboard.writeText(item.number);
                      toast.success(`${item.label} number copied`);
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>

          <Card padding="lg" tone="muted">
            <h2 className="text-base font-bold text-fg">Works without signal</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                'Emergency calls connect even with zero balance or a locked screen.',
                'Save 112 as a favourite contact so it survives Do Not Disturb.',
                'Screenshot this page before heading into low-connectivity regions.',
                'Rail Madad (139) covers medical and security help on any train.',
              ].map((tip) => (
                <li key={tip} className="flex gap-2.5 rounded-xl border border-line bg-surface p-3.5">
                  <Icon name="checkCircle" size="sm" className="mt-0.5 shrink-0 text-emerald-500" />
                  <p className="text-sm leading-6 text-fg-muted">{tip}</p>
                </li>
              ))}
            </ul>
            {rankedLimit < rankedAll.length && (
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                className="mt-4"
                leadingIcon="plus"
                onClick={() => setRankedLimit((prev) => prev + 20)}
              >
                Show more destinations
              </Button>
            )}
          </Card>
        </div>
      )}

      {tab === 'checklist' && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <Card padding="lg">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-fg">Pre-trip safety checklist</h2>
              <Badge tone={completion === 100 ? 'success' : 'brand'}>{completion}% done</Badge>
            </div>
            <Progress value={completion} className="mt-3" tone={completion === 100 ? 'success' : 'brand'} />

            <ul className="mt-5 space-y-2">
              {CHECKLIST.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    'rounded-xl border p-3.5 transition-colors duration-200',
                    checked[item.id]
                      ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/8'
                      : 'border-line bg-surface-muted'
                  )}
                >
                  <Checkbox
                    id={`check-${item.id}`}
                    checked={Boolean(checked[item.id])}
                    onChange={() => setChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                    label={
                      <span>
                        <span className={cn('block text-sm font-semibold', checked[item.id] ? 'text-emerald-700 dark:text-emerald-300' : 'text-fg')}>
                          {item.label}
                        </span>
                        <span className="block text-2xs text-fg-subtle">{item.detail}</span>
                      </span>
                    }
                  />
                </li>
              ))}
            </ul>

            {completion === 100 && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                <Icon name="checkCircle" size="md" className="text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  You are fully prepared. Have a great trip.
                </p>
              </div>
            )}
          </Card>

          <Card padding="lg" tone="muted">
            <h2 className="text-base font-bold text-fg">Why this matters</h2>
            <p className="mt-2 text-sm leading-6 text-fg-muted">
              Most travel emergencies are logistical, not dramatic: a lost card, a missed connection, a medical issue in a
              town without a hospital. The checklist covers the eight things that turn a crisis into an inconvenience.
            </p>
            <Button to="/community" variant="secondary" size="sm" className="mt-4" trailingIcon="arrowRight">
              Read traveller experiences
            </Button>
          </Card>
        </div>
      )}

      {tab === 'playbooks' && (
        <div className="grid gap-4 md:grid-cols-2">
          {SCENARIOS.map((scenario) => (
            <Card key={scenario.title} padding="lg" interactive>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-float">
                <Icon name={scenario.icon} size="md" />
              </span>
              <h3 className="mt-4 text-base font-bold text-fg">{scenario.title}</h3>
              <ol className="mt-3 space-y-2.5">
                {scenario.steps.map((step, index) => (
                  <li key={step} className="flex gap-2.5">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-2xs font-bold text-fg-muted">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-fg-muted">{step}</p>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default SafetyPage;
