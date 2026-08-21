import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { SectionHeader, Reveal } from '../ui/Section';
import { Avatar } from '../ui/Rating';
import Rating from '../ui/Rating';
import { cn } from '../../lib/cn';

/* ------------------------------------------------------------------ how it works */

const STEPS = [
  {
    icon: 'search',
    title: 'Tell us where and when',
    body: 'Type a destination and your dates. No account needed to start planning.',
    visual: ['Goa', '4 days', 'Relaxation'],
  },
  {
    icon: 'sparkles',
    title: 'Get a real itinerary',
    body: 'A day-by-day plan built from destination data — not generic filler text.',
    visual: ['Day 1 · Beaches', 'Day 2 · Old Goa', 'Day 3 · Spice trail'],
  },
  {
    icon: 'wallet',
    title: 'See the true cost',
    body: 'Stay, food, transport and activities priced by season and travel style.',
    visual: ['₹42,800 total', '₹4,800 / day', '12% under cap'],
  },
  {
    icon: 'shield',
    title: 'Travel with backup',
    body: 'Safety scores, emergency contacts and transport options stay one tap away.',
    visual: ['Safety 91/100', 'SOS ready', 'Train + cab'],
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    timer.current = setInterval(() => setActive((prev) => (prev + 1) % STEPS.length), 4200);
    return () => clearInterval(timer.current);
  }, []);

  const stop = () => clearInterval(timer.current);

  return (
    <section aria-labelledby="how-heading" className="space-y-8">
      <SectionHeader
        eyebrow="How it works"
        icon="target"
        align="center"
        title="From idea to itinerary in four steps"
        description="No spreadsheets, no twenty open tabs. SafarAI keeps the whole trip in one place."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
        <ol className="space-y-3">
          {STEPS.map((step, index) => {
            const isActive = index === active;
            return (
              <li key={step.title}>
                <button
                  type="button"
                  onClick={() => {
                    stop();
                    setActive(index);
                  }}
                  onMouseEnter={() => {
                    stop();
                    setActive(index);
                  }}
                  aria-current={isActive}
                  className={cn(
                    'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-300',
                    isActive
                      ? 'border-brand-200 bg-surface shadow-card dark:border-brand-400/25'
                      : 'border-transparent bg-transparent hover:bg-surface-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                      isActive
                        ? 'bg-brand-gradient text-white shadow-float'
                        : 'bg-surface-muted text-fg-muted'
                    )}
                  >
                    <Icon name={step.icon} size="md" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-2xs font-bold uppercase tracking-wider text-fg-subtle">
                        Step {index + 1}
                      </span>
                      {isActive && (
                        <span className="h-1 w-8 overflow-hidden rounded-full bg-line">
                          <span className="block h-full w-full origin-left animate-[fade-in_0.4s_ease] bg-brand-500" />
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-sm font-bold text-fg">{step.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-fg-muted">{step.body}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-50 via-surface to-accent-50 p-6 shadow-card dark:from-brand-500/10 dark:to-accent-500/10 sm:p-8">
          <div className="absolute inset-0 bg-dot-grid bg-[size:22px_22px] opacity-40" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
                <Icon name={STEPS[active].icon} size="sm" />
              </span>
              <p className="text-sm font-bold text-fg">{STEPS[active].title}</p>
            </div>

            <div className="mt-5 space-y-2.5" key={active}>
              {STEPS[active].visual.map((line, index) => (
                <div
                  key={line}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface/90 px-4 py-3 shadow-xs animate-fade-up backdrop-blur"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <span className="text-sm font-semibold text-fg">{line}</span>
                  <Icon name="checkCircle" size="sm" className="text-emerald-500" />
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <Button to="/trip-planner" size="sm" leadingIcon="sparkles">
                Try it now
              </Button>
              <Button to="/explore" size="sm" variant="secondary">
                See destinations
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ testimonials */

const REVIEWS = [
  {
    name: 'Ananya Rao',
    role: 'Solo traveller · Bengaluru',
    rating: 5,
    text: 'The safety scores and emergency kit made my first solo trip to Varanasi genuinely stress-free. The itinerary was realistic — not a 14-stop fantasy.',
    trip: 'Varanasi · 3 days',
  },
  {
    name: 'Rahul & Meera',
    role: 'Couple · Mumbai',
    rating: 5,
    text: 'We planned Ladakh in twenty minutes. The budget calculator was within ₹3,000 of what we actually spent, including the Nubra permits.',
    trip: 'Leh Ladakh · 8 days',
  },
  {
    name: 'Dev Sharma',
    role: 'Backpacker · Delhi',
    rating: 4,
    text: 'Train search plus hostel filters in one place is the whole reason I stopped using four different apps. Saved trips sync across my devices.',
    trip: 'Hampi · 3 days',
  },
  {
    name: 'Priya Nair',
    role: 'Family trip · Kochi',
    rating: 5,
    text: 'Food and culture recommendations were exactly what locals suggest. The kids loved the Munnar plan and we never felt rushed.',
    trip: 'Kerala · 6 days',
  },
];

export function Testimonials() {
  return (
    <section aria-labelledby="reviews-heading" className="space-y-8">
      <SectionHeader
        eyebrow="Travellers"
        icon="heart"
        align="center"
        title="Trips people actually took"
        description="Real plans, real budgets — feedback from the SafarAI community."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {REVIEWS.map((review, index) => (
          <Reveal key={review.name} delay={index * 70}>
            <figure className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <Rating value={review.rating} />
              <blockquote className="mt-3 flex-1 text-sm leading-6 text-fg-muted">“{review.text}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                <Avatar name={review.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-fg">{review.name}</p>
                  <p className="truncate text-2xs text-fg-subtle">{review.role}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-surface-muted px-2 py-1 text-2xs font-semibold text-fg-muted">
                  {review.trip}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ trust bar */

const SIGNALS = [
  { icon: 'shield', label: 'Safety-first planning', value: 'Risk scores on every destination' },
  { icon: 'zap', label: 'Instant itineraries', value: 'Under 60 seconds, no signup' },
  { icon: 'wallet', label: 'Honest budgets', value: 'Season and style aware' },
  { icon: 'train', label: 'Rail-native', value: 'Built with Railverse data' },
];

export function TrustBar() {
  return (
    <div className="grid gap-3 rounded-3xl border border-line bg-surface p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
      {SIGNALS.map((signal) => (
        <div key={signal.label} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-surface-muted">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300">
            <Icon name={signal.icon} size="md" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-fg">{signal.label}</span>
            <span className="block truncate text-xs text-fg-muted">{signal.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
