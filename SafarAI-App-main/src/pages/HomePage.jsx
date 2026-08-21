import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import HeroSection from '../components/home/HeroSection';
import DestinationExplorer from '../components/home/DestinationExplorer';
import WorldMapSection from '../components/home/WorldMapSection';
import FeatureCards from '../components/home/FeatureCards';
import { HowItWorks, Testimonials, TrustBar } from '../components/home/Sections';
import { SectionHeader, Reveal } from '../components/ui/Section';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import DestinationImage from '../components/DestinationImage';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAssistant } from '../context/AssistantContext';
import { destinations } from '../data/destinations';

function ContinuePlanning() {
  const { recent, trips, favourites } = useWorkspace();
  const items = [
    ...trips.slice(-2).reverse().map((trip) => ({
      id: `trip-${trip.id}`,
      title: `${trip.destination} · ${trip.days} days`,
      subtitle: 'Saved itinerary',
      icon: 'luggage',
      href: '/my-trips',
    })),
    ...recent.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: 'Recently viewed',
      icon: 'history',
      href: item.href,
    })),
    ...favourites.slice(0, 2).map((item) => ({
      id: `fav-${item.id}`,
      title: item.title,
      subtitle: 'Saved',
      icon: 'heart',
      href: item.href,
    })),
  ].slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="Pick up where you left off"
        icon="history"
        title="Your travel workspace"
        action={
          <Button to="/profile" variant="secondary" size="sm" trailingIcon="arrowRight">
            Open dashboard
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href || '/'}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300">
              <Icon name={item.icon} size="md" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-fg">{item.title}</span>
              <span className="block truncate text-xs text-fg-muted">{item.subtitle}</span>
            </span>
            <Icon
              name="arrowRight"
              size="sm"
              className="shrink-0 text-fg-subtle transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-500"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

function AssistantPromo() {
  const { openDock } = useAssistant();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-slate-950 p-6 shadow-lift sm:p-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(50rem_28rem_at_15%_-10%,rgba(99,102,241,0.5),transparent),radial-gradient(40rem_24rem_at_90%_110%,rgba(6,182,212,0.4),transparent)]"
      />
      <div className="absolute inset-0 bg-hero-grid bg-[size:22px_22px] opacity-[0.15]" aria-hidden="true" />

      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-2xs font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur">
            <Icon name="bot" size="xs" /> AI assistant
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
            Ask anything. Get a plan, not a paragraph.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-white/75">
            SafarAI knows your saved trips, preferred style and recently viewed destinations — so answers arrive
            already tailored to the way you travel.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={openDock} variant="glass" leadingIcon="sparkles">
              Open the assistant
            </Button>
            <Button to="/assistant" variant="glass" trailingIcon="arrowUpRight">
              Full screen chat
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { q: 'Cheapest week in Ladakh?', a: 'Mid-September — permits open, ₹6.2k/day average, fewer crowds.' },
            { q: 'Kerala with parents, 6 days?', a: 'Kochi 2 · Munnar 2 · Alleppey 2, houseboat on night 5.' },
            { q: 'Is Goa safe in monsoon?', a: 'Yes, with caveats: red-flag beaches, safety score dips to 74.' },
          ].map((item, index) => (
            <div
              key={item.q}
              className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md animate-fade-up"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <p className="text-sm font-semibold text-white">{item.q}</p>
              <p className="mt-1.5 flex items-start gap-2 text-xs leading-5 text-white/75">
                <Icon name="sparkles" size="xs" className="mt-0.5 shrink-0 text-accent-300" />
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeasonalRail() {
  const month = new Date().getMonth() + 1;
  const inSeason = destinations.filter((item) => item.months.includes(month)).slice(0, 6);
  if (inSeason.length === 0) return null;

  const monthName = new Date().toLocaleDateString('en-IN', { month: 'long' });

  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="Right season"
        icon="calendar"
        title={`Perfect to visit in ${monthName}`}
        description="Weather, crowd levels and pricing all line up this month."
      />
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0">
        {inSeason.map((destination) => (
          <Link
            key={destination.slug}
            to={`/destination/${destination.slug}`}
            className="group relative h-56 w-64 shrink-0 overflow-hidden rounded-2xl border border-line shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <DestinationImage
              destination={destination}
              width={800}
              className="h-full w-full"
              imgClassName="transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-base font-extrabold text-white">{destination.name}</p>
              <p className="text-xs text-white/80">{destination.tagline}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-2xs font-bold text-white backdrop-blur">
                <Icon name="star" size="xs" filled className="text-gold-400" />
                {destination.rating} · {destination.budget}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HomePage() {
  usePageMeta(
    'SafarAI | AI-Powered Travel Planning Platform',
    'SafarAI helps travelers plan smarter and safer with AI itinerary generation, destination intelligence, transport tools, and personalized recommendations.'
  );

  return (
    <div>
      <HeroSection />

      <div className="content-grid space-y-20 pb-8 sm:space-y-24">
        <Reveal>
          <TrustBar />
        </Reveal>

        <ContinuePlanning />
        <DestinationExplorer />
        <SeasonalRail />
        <WorldMapSection />
        <HowItWorks />
        <FeatureCards />
        <Reveal>
          <AssistantPromo />
        </Reveal>
        <Testimonials />
      </div>
    </div>
  );
}

export default HomePage;
