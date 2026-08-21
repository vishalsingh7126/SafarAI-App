import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import DestinationImage from '../DestinationImage';
import InteractiveGlobe from './InteractiveGlobe';

/** The photoreal globe (three.js) is deferred until the browser is idle so it
 *  never blocks first paint; the lightweight canvas globe stands in meanwhile. */
const RealisticGlobe = lazy(() => import('../geo/RealisticGlobe'));
import useCountUp from '../../hooks/useCountUp';
import { destinations } from '../../data/destinations';
import { cn } from '../../lib/cn';

const ROTATING_WORDS = ['smarter', 'safer', 'cheaper', 'together'];

const HERO_STATS = [
  { value: 120, suffix: '+', label: 'Destinations mapped' },
  { value: 38, suffix: 'k', label: 'Itineraries generated' },
  { value: 94, suffix: '%', label: 'Plan-to-trip rate' },
];

function Stat({ value, suffix, label }) {
  const [ref, animated] = useCountUp(value);
  return (
    <div ref={ref}>
      <p className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
        {animated}
        <span className="text-brand-500">{suffix}</span>
      </p>
      <p className="mt-0.5 text-xs font-medium text-fg-muted">{label}</p>
    </div>
  );
}

function FloatingCard({ className, style, children, delay = 0 }) {
  return (
    <div
      className={cn(
        'absolute hidden rounded-2xl border border-line bg-surface/90 p-3.5 shadow-lift backdrop-blur-md animate-float-slow lg:block',
        className
      )}
      style={{ animationDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [days, setDays] = useState('4');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const parallaxRef = useRef(null);
  const globeRef = useRef(null);
  const [heavyGlobe, setHeavyGlobe] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length), 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const node = parallaxRef.current;
    if (!node) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const onMove = (event) => {
      const { innerWidth, innerHeight } = window;
      const x = (event.clientX / innerWidth - 0.5) * 2;
      const y = (event.clientY / innerHeight - 0.5) * 2;
      node.style.setProperty('--px', x.toFixed(3));
      node.style.setProperty('--py', y.toFixed(3));
    };

    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Memoised: a new array each render would rebuild the globe's GPU buffers.
  const heroDestinations = useMemo(
    () => [...destinations].sort((a, b) => b.popularity - a.popularity).slice(0, 40),
    []
  );

  const suggestions = query.trim()
    ? destinations
        .filter((item) => `${item.name} ${item.country} ${item.state || ''} ${item.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
    : destinations.slice(0, 5);

  const startPlanning = (destinationName) => {
    const value = (destinationName || query).trim();
    navigate(
      `/trip-planner?${new URLSearchParams({
        ...(value ? { destination: value } : {}),
        days,
      }).toString()}`
    );
  };

  return (
    <section
      ref={parallaxRef}
      className="relative overflow-hidden pb-10 pt-6 sm:pb-16 sm:pt-10"
      style={{ '--px': 0, '--py': 0 }}
    >
      {/* animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-400/25 blur-[90px] dark:bg-brand-500/20"
          style={{ transform: 'translate3d(calc(var(--px) * 18px), calc(var(--py) * 18px), 0)' }}
        />
        <div
          className="absolute -right-24 top-10 h-[24rem] w-[24rem] rounded-full bg-accent-400/25 blur-[90px] dark:bg-accent-500/15"
          style={{ transform: 'translate3d(calc(var(--px) * -22px), calc(var(--py) * -14px), 0)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-gold-300/20 blur-[100px] dark:bg-gold-500/10"
          style={{ transform: 'translate3d(calc(var(--px) * 12px), calc(var(--py) * -18px), 0)' }}
        />
        <div className="absolute inset-0 bg-dot-grid bg-[size:26px_26px] opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />
      </div>

      <div className="content-grid">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ---------------------------------------------------------- copy */}
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200/70 bg-surface/80 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur dark:border-brand-400/25 dark:text-brand-200">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-gradient px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-white">
                <Icon name="sparkles" size="xs" /> New
              </span>
              Context-aware itineraries powered by Llama 3.3
            </span>

            <h1 className="display-heading mt-5 text-fg">
              Plan your next journey{' '}
              <span className="relative inline-flex h-[1.05em] overflow-hidden align-bottom">
                <span className="invisible">together</span>
                {ROTATING_WORDS.map((word, index) => (
                  <span
                    key={word}
                    className={cn(
                      'text-gradient absolute inset-0 transition-all duration-500 ease-smooth',
                      index === wordIndex
                        ? 'translate-y-0 opacity-100'
                        : index === (wordIndex - 1 + ROTATING_WORDS.length) % ROTATING_WORDS.length
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-full opacity-0'
                    )}
                  >
                    {word}
                  </span>
                ))}
              </span>
              <br className="hidden sm:block" /> with SafarAI.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-fg-muted sm:text-lg">
              One workspace for itineraries, live budgets, stays, trains and safety intelligence — grounded in
              real destination data, not generic tips.
            </p>

            {/* Instant planning search */}
            <div className="relative mt-8 max-w-xl">
              <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-2 shadow-card sm:flex-row sm:items-center">
                <div className="relative flex flex-1 items-center gap-2 px-2">
                  <Icon name="search" size="md" className="text-fg-subtle" />
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSuggestOpen(true);
                    }}
                    onFocus={() => setSuggestOpen(true)}
                    onBlur={() => setTimeout(() => setSuggestOpen(false), 140)}
                    onKeyDown={(event) => event.key === 'Enter' && startPlanning()}
                    placeholder="Where to? Try Goa, Ladakh, Kerala…"
                    aria-label="Destination"
                    className="h-11 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
                  />
                </div>

                <div className="flex items-center gap-2 border-line pl-2 sm:border-l">
                  <label htmlFor="hero-days" className="sr-only">
                    Trip length in days
                  </label>
                  <select
                    id="hero-days"
                    value={days}
                    onChange={(event) => setDays(event.target.value)}
                    className="h-11 cursor-pointer rounded-xl border-0 bg-transparent px-2 text-sm font-semibold text-fg outline-none"
                  >
                    {[2, 3, 4, 5, 6, 7, 10].map((value) => (
                      <option key={value} value={value}>
                        {value} days
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => startPlanning()} leadingIcon="sparkles" className="shrink-0">
                    Plan trip
                  </Button>
                </div>
              </div>

              {suggestOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-surface-raised p-2 shadow-lift animate-slide-down">
                  <p className="px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-fg-subtle">
                    {query.trim() ? 'Matching destinations' : 'Trending this season'}
                  </p>
                  {suggestions.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setQuery(item.name);
                        startPlanning(item.name);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-surface-muted"
                    >
                      <DestinationImage
                        destination={item}
                        width={160}
                        compact
                        rounded="rounded-lg"
                        className="h-9 w-9 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-fg">{item.name}</span>
                        <span className="block truncate text-xs text-fg-muted">{item.tagline}</span>
                      </span>
                      <span className="hidden text-xs font-semibold text-brand-600 sm:block dark:text-brand-300">
                        {item.bestTime}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button to="/explore" variant="secondary" trailingIcon="arrowRight">
                Explore destinations
              </Button>
              <Button to="/assistant" variant="ghost" leadingIcon="bot">
                Ask the AI assistant
              </Button>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
              {HERO_STATS.map((stat) => (
                <Stat key={stat.label} {...stat} />
              ))}
            </div>
          </div>

          {/* --------------------------------------------------------- visual */}
          <div className="relative">
            <div
              className="relative"
              style={{ transform: 'translate3d(calc(var(--px) * -10px), calc(var(--py) * -10px), 0)' }}
            >
              <div className="relative mx-auto aspect-square w-full max-w-[27rem]">
                {heavyGlobe ? (
                  <Suspense fallback={<InteractiveGlobe />}>
                    <RealisticGlobe
                      ref={globeRef}
                      destinations={heroDestinations}
                      onSelect={(destination) => navigate(`/destination/${destination.slug}`)}
                      showLabels={false}
                      className="animate-fade-in"
                    />
                  </Suspense>
                ) : (
                  <InteractiveGlobe />
                )}
              </div>

              <FloatingCard className="-left-2 top-6 w-48" delay={0}>
                <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-fg-subtle">
                  <Icon name="sparkles" size="xs" className="text-brand-500" /> AI itinerary
                </p>
                <p className="mt-1.5 text-sm font-bold text-fg">Day 3 · Munnar</p>
                <p className="mt-0.5 text-xs text-fg-muted">Tea estate sunrise, Eravikulam trek</p>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full w-3/4 rounded-full bg-brand-gradient" />
                </div>
              </FloatingCard>

              <FloatingCard className="-right-2 top-24 w-44" delay={900}>
                <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-fg-subtle">
                  <Icon name="wallet" size="xs" className="text-emerald-500" /> Live budget
                </p>
                <p className="mt-1.5 text-lg font-extrabold text-fg">₹42,800</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">12% under your cap</p>
              </FloatingCard>

              <FloatingCard className="bottom-8 left-6 w-44" delay={1800}>
                <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-fg-subtle">
                  <Icon name="shield" size="xs" className="text-accent-500" /> Safety score
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-lg font-extrabold text-fg">91</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    Very safe
                  </span>
                </div>
              </FloatingCard>
            </div>

            <p className="mt-4 text-center text-2xs font-medium text-fg-subtle lg:mt-2">
              {heavyGlobe ? 'Live satellite globe · drag to rotate, click a marker' : 'Drag the globe · click a marker'}
              {' · '}
              <Link to="/world" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
                open world explorer
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
