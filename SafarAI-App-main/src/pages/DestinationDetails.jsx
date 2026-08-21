import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import Rating from '../components/ui/Rating';
import EmptyState from '../components/ui/EmptyState';
import { SectionHeader, Reveal } from '../components/ui/Section';
import { BarChart, RadialScore } from '../components/charts/Charts';
import DestinationCard from '../components/DestinationCard';
import DestinationImage from '../components/DestinationImage';
import { destinationBySlug, destinations, nearbyDestinations } from '../data/destinations';
import { POI_CATEGORIES, poisFor } from '../data/pointsOfInterest';
import { hotelsDatabase } from '../data/hotelsDatabase';
import { foodCultureDatabase } from '../data/foodCultureDatabase';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useAssistant } from '../context/AssistantContext';
import { formatINR } from '../lib/format';

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function DestinationDetails() {
  const { name } = useParams();
  const navigate = useNavigate();
  const slug = String(name || '').toLowerCase();
  const destination = destinationBySlug[slug];

  const { trackView, toggleFavourite, isFavourite } = useWorkspace();
  const toast = useToast();
  const { send, openDock } = useAssistant();
  const [tab, setTab] = useState('overview');

  usePageMeta(
    destination ? `${destination.name} | SafarAI` : 'Destination Details | SafarAI',
    destination
      ? `Explore attractions, budget expectations, and the best time to visit ${destination.name} with SafarAI.`
      : 'Explore destination details with SafarAI.'
  );

  useEffect(() => {
    if (!destination) return;
    trackView({
      id: `dest-${destination.slug}`,
      type: 'destination',
      title: destination.name,
      href: `/destination/${destination.slug}`,
    });
  }, [destination, trackView]);

  const stays = useMemo(() => {
    if (!destination) return [];
    return hotelsDatabase.filter(
      (hotel) =>
        hotel.destination === destination.slug ||
        hotel.city.toLowerCase() === destination.name.toLowerCase()
    );
  }, [destination]);

  const attractions = useMemo(() => (destination ? poisFor(destination.slug) : []), [destination]);

  const food = useMemo(
    () =>
      destination
        ? foodCultureDatabase.filter((item) => item.city.toLowerCase().includes(destination.name.toLowerCase()))
        : [],
    [destination]
  );

  const similar = useMemo(() => {
    if (!destination) return [];
    const tagMatches = destinations.filter(
      (item) => item.slug !== destination.slug && item.tags.some((tag) => destination.tags.includes(tag))
    );
    const byInterest = tagMatches
      .filter((item) => item.continent === destination.continent)
      .sort((a, b) => b.rating - a.rating);
    const merged = [...byInterest, ...tagMatches.filter((item) => !byInterest.includes(item))];
    return merged.slice(0, 3);
  }, [destination]);

  const nearby = useMemo(() => (destination ? nearbyDestinations(destination, 4) : []), [destination]);

  if (!destination) {
    return (
      <EmptyState
        icon="mapPin"
        tone="danger"
        title="Destination not found"
        description="We do not cover this destination yet — but the explorer has 12 fully mapped places with budgets, stays and safety data."
        action={{ label: 'Browse destinations', to: '/explore', icon: 'compass' }}
        secondaryAction={{ label: 'Back home', to: '/', icon: 'arrowLeft' }}
      />
    );
  }

  const saved = isFavourite(`dest-${destination.slug}`);

  const itinerary = [
    `Start with ${destination.topAttractions[0]} and get familiar with the local vibe.`,
    `Reserve the next stretch for ${destination.topAttractions[1]} and nearby food or market stops.`,
    `Wrap up with ${destination.topAttractions[2]} and a relaxed evening around the area.`,
  ];

  const seasonData = MONTH_LABELS.map((label, index) => ({
    label,
    value: destination.months.includes(index + 1) ? 100 : 38,
    color: destination.months.includes(index + 1) ? '#4f46e5' : 'rgb(var(--c-line-strong))',
  }));

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${destination.name} · SafarAI`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const tabs = [
    { value: 'overview', label: 'Overview', icon: 'compass' },
    { value: 'attractions', label: 'Attractions', icon: 'camera', count: attractions.length || destination.topAttractions.length },
    { value: 'stays', label: 'Stays', icon: 'hotel', count: stays.length },
    { value: 'food', label: 'Food', icon: 'utensils', count: food.length },
    { value: 'practical', label: 'Practical', icon: 'info' },
  ];

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl border border-line shadow-card">
        <DestinationImage
          destination={destination}
          width={1600}
          eager
          className="h-72 w-full sm:h-96"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/45 to-slate-950/20" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-slate-950/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-slate-950/55"
          >
            <Icon name="arrowLeft" size="xs" /> Back
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={share}
              aria-label="Share destination"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-slate-950/35 text-white backdrop-blur transition hover:bg-slate-950/55"
            >
              <Icon name="share" size="sm" />
            </button>
            <button
              type="button"
              onClick={() => {
                const added = toggleFavourite({
                  id: `dest-${destination.slug}`,
                  type: 'destination',
                  title: destination.name,
                  subtitle: destination.tagline,
                  image: destination.image,
                  href: `/destination/${destination.slug}`,
                });
                toast[added ? 'success' : 'info'](added ? `${destination.name} saved` : 'Removed from saved');
              }}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from saved' : 'Save destination'}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition ${
                saved
                  ? 'border-rose-300 bg-rose-500 text-white'
                  : 'border-white/25 bg-slate-950/35 text-white hover:bg-slate-950/55'
              }`}
            >
              <Icon name="heart" size="sm" filled={saved} />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-2xs font-semibold text-white/70">
            <Link to="/" className="hover:text-white">
              Home
            </Link>
            <Icon name="chevronRight" size="xs" />
            <Link to="/explore" className="hover:text-white">
              Explore
            </Link>
            <Icon name="chevronRight" size="xs" />
            <span className="text-white">{destination.name}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-white backdrop-blur">
                  {destination.country} · {destination.continent}
                </span>
                {destination.unesco && (
                  <span className="rounded-full bg-gold-400/90 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-slate-900">
                    UNESCO
                  </span>
                )}
                <Rating value={destination.rating} showValue count={destination.reviews} className="text-white [&_span]:text-white" />
              </div>
              <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-5xl">{destination.name}</h1>
              <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">{destination.tagline}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button to={`/trip-planner?destination=${encodeURIComponent(destination.name)}`} leadingIcon="sparkles">
                Plan this trip
              </Button>
              <Button
                variant="glass"
                leadingIcon="bot"
                onClick={() => {
                  openDock();
                  send(`Give me a 4-day plan for ${destination.name} with local food stops and a budget breakdown.`);
                }}
              >
                Ask AI
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- kpi strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Best time', value: destination.bestTime, icon: 'calendar', tone: 'brand' },
          { label: 'Ideal length', value: destination.duration, icon: 'clock', tone: 'accent' },
          { label: 'Budget range', value: destination.budget, icon: 'wallet', tone: 'success' },
          { label: 'Cost per day', value: formatINR(destination.dailyCost), icon: 'trendUp', tone: 'warning' },
        ].map((item) => (
          <Card key={item.label} padding="md" className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300">
              <Icon name={item.icon} size="md" />
            </span>
            <div className="min-w-0">
              <p className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">{item.label}</p>
              <p className="mt-0.5 truncate text-sm font-extrabold text-fg">{item.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="w-full overflow-x-auto" />

      {/* ------------------------------------------------------------ panels */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-lg font-bold text-fg">About {destination.name}</h2>
              <p className="mt-3 text-sm leading-7 text-fg-muted">{destination.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {destination.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card padding="lg">
              <h2 className="text-lg font-bold text-fg">Do not miss</h2>
              <ul className="mt-4 space-y-3">
                {destination.highlights.map((highlight, index) => (
                  <li key={highlight} className="flex items-start gap-3 rounded-xl border border-line bg-surface-muted p-3.5">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-2xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-fg-muted">{highlight}</p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card padding="lg">
              <h2 className="text-lg font-bold text-fg">Suggested three-stop route</h2>
              <ol className="mt-4 space-y-3">
                {itinerary.map((item, index) => (
                  <li key={item} className="flex gap-3.5 rounded-xl border border-line bg-surface-muted p-4">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-fg-muted">{item}</p>
                  </li>
                ))}
              </ol>
              <Button
                to={`/trip-planner?destination=${encodeURIComponent(destination.name)}`}
                className="mt-5"
                leadingIcon="sparkles"
              >
                Generate a full itinerary
              </Button>
            </Card>
          </div>

          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-base font-bold text-fg">When to visit</h2>
              <p className="mt-1 text-xs text-fg-muted">Highlighted months are the recommended window.</p>
              <div className="mt-4">
                <BarChart data={seasonData} height={120} valueFormatter={(value) => (value === 100 ? 'Ideal' : 'Off season')} />
              </div>
            </Card>

            <Card padding="lg" className="text-center">
              <h2 className="text-base font-bold text-fg">Safety score</h2>
              <div className="mt-4 flex justify-center">
                <RadialScore
                  value={destination.safetyScore}
                  label="/ 100"
                  tone={destination.safetyScore >= 85 ? '#10b981' : destination.safetyScore >= 75 ? '#f59e0b' : '#f43f5e'}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-fg-muted">
                Aggregated from traveller reports, local advisories and transport reliability.
              </p>
              <Button to="/safety" variant="secondary" size="sm" className="mt-4" leadingIcon="shield">
                Safety toolkit
              </Button>
            </Card>

            <Card padding="lg">
              <h2 className="text-base font-bold text-fg">Closest destinations</h2>
              <p className="mt-1 text-xs text-fg-muted">Great add-ons if you are already in the region.</p>
              <ul className="mt-3 space-y-2">
                {nearby.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/destination/${item.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-line bg-surface-muted px-3 py-2 transition hover:border-brand-300"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-fg">{item.name}</span>
                        <span className="block truncate text-2xs text-fg-subtle">{item.country}</span>
                      </span>
                      <span className="shrink-0 text-2xs font-bold text-brand-600 dark:text-brand-300">
                        {item.distanceKm.toLocaleString('en-IN')} km
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Button to="/world" size="sm" variant="secondary" className="mt-4" leadingIcon="globe">
                Open in world explorer
              </Button>
            </Card>

            <Card padding="lg">
              <h2 className="text-base font-bold text-fg">Quick actions</h2>
              <div className="mt-3 space-y-2">
                {[
                  { label: 'Find stays', to: `/hotels?city=${encodeURIComponent(destination.name)}`, icon: 'hotel' },
                  { label: 'Estimate the budget', to: '/budget', icon: 'wallet' },
                  { label: 'Trains and transport', to: '/railway', icon: 'train' },
                  { label: 'Events happening there', to: '/events', icon: 'ticket' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="group flex items-center gap-3 rounded-xl border border-line bg-surface-muted px-3.5 py-2.5 text-sm font-semibold text-fg-muted transition hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-200"
                  >
                    <Icon name={action.icon} size="sm" />
                    {action.label}
                    <Icon
                      name="arrowRight"
                      size="sm"
                      className="ml-auto transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'attractions' && attractions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {attractions.map((place, index) => {
            const meta = POI_CATEGORIES[place.category] || POI_CATEGORIES.landmark;
            return (
              <Reveal key={place.id} delay={(index % 3) * 60}>
                <Card padding="none" interactive className="h-full overflow-hidden">
                  <DestinationImage
                    destination={{ ...place, country: destination.country, continent: destination.continent }}
                    width={640}
                    className="h-36 w-full"
                  />
                  <div className="p-5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-bold text-white"
                      style={{ background: meta.color }}
                    >
                      <Icon name={meta.icon} size="xs" />
                      {meta.label}
                    </span>
                    <h3 className="mt-3 text-base font-bold text-fg">{place.name}</h3>
                    {place.note && <p className="mt-1 text-xs text-fg-muted">{place.note}</p>}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        href={`https://www.google.com/maps/search/?api=1&query=${place.coords.lat},${place.coords.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        size="xs"
                        variant="secondary"
                        leadingIcon="mapPin"
                      >
                        Directions
                      </Button>
                      {place.wiki && (
                        <Button
                          href={`https://en.wikipedia.org/wiki/${place.wiki}`}
                          target="_blank"
                          rel="noreferrer"
                          size="xs"
                          variant="ghost"
                          trailingIcon="arrowUpRight"
                        >
                          About
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      {tab === 'attractions' && attractions.length === 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {destination.topAttractions.map((attraction, index) => (
            <Reveal key={attraction} delay={index * 60}>
              <Card padding="lg" interactive className="h-full">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-float">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-fg">{attraction}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-muted">
                  A high-interest stop commonly included in {destination.name} itineraries.
                </p>
                <Button
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${attraction} ${destination.name}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  variant="secondary"
                  className="mt-4"
                  leadingIcon="mapPin"
                >
                  Open in maps
                </Button>
              </Card>
            </Reveal>
          ))}
        </div>
      )}

      {tab === 'stays' && (
        <>
          {stays.length === 0 ? (
            <EmptyState
              icon="hotel"
              title={`No curated stays for ${destination.name} yet`}
              description="Our hotel index covers Goa, Manali, Delhi, Mumbai, Jaipur and Kerala today — more cities are being added."
              action={{ label: 'Open hotel finder', to: '/hotels', icon: 'hotel' }}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {stays.map((hotel) => (
                <Card key={hotel.id} padding="lg" interactive>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-fg">{hotel.name}</h3>
                      <p className="mt-0.5 truncate text-2xs text-fg-subtle">{hotel.address}</p>
                      <Rating value={hotel.rating} className="mt-1" />
                    </div>
                    <Badge tone={hotel.tier === 'luxury' ? 'warning' : hotel.tier === 'standard' ? 'brand' : 'success'}>
                      {hotel.tier}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-fg-muted">{hotel.description}</p>
                  <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                    <div>
                      <p className="text-2xs uppercase tracking-wide text-fg-subtle">Per night</p>
                      <p className="text-xl font-extrabold text-fg">{formatINR(hotel.pricePerNight)}</p>
                    </div>
                    <Button to={`/hotels?city=${encodeURIComponent(hotel.city)}`} size="sm" variant="secondary">
                      Compare stays
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'food' && (
        <>
          {food.length === 0 ? (
            <EmptyState
              icon="utensils"
              title={`No food guide for ${destination.name} yet`}
              description="Browse the full food and culture explorer for cities we have mapped."
              action={{ label: 'Food & culture', to: '/food-culture', icon: 'utensils' }}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {food.map((item) => (
                <Card key={item.id} padding="lg" interactive>
                  <h3 className="text-base font-bold text-fg">{item.dish}</h3>
                  <p className="mt-0.5 text-xs text-fg-subtle">{item.place}</p>
                  <p className="mt-3 text-sm leading-6 text-fg-muted">{item.description}</p>
                  <Button
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place)}`}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    variant="secondary"
                    className="mt-4"
                    leadingIcon="mapPin"
                  >
                    View location
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'practical' && (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: 'Getting there',
              icon: 'plane',
              body: `Most travellers reach ${destination.name} by train or a short domestic flight. Compare modes and typical fares in the transport hub.`,
              action: { label: 'Compare transport', to: '/transport' },
            },
            {
              title: 'Money & budget',
              icon: 'wallet',
              body: `Plan for roughly ${formatINR(destination.dailyCost)} per person per day at a mid-range pace, excluding long-distance travel.`,
              action: { label: 'Open budget tool', to: '/budget' },
            },
            {
              title: 'Staying safe',
              icon: 'shield',
              body: `Safety score ${destination.safetyScore}/100. Save local emergency numbers and share your live location for late-night travel.`,
              action: { label: 'Safety toolkit', to: '/safety' },
            },
            {
              title: 'Local etiquette',
              icon: 'users',
              body: 'Dress modestly at religious sites, ask before photographing people, and carry small change for local transport and markets.',
              action: { label: 'Community tips', to: '/community' },
            },
          ].map((item) => (
            <Card key={item.title} padding="lg">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300">
                <Icon name={item.icon} size="md" />
              </span>
              <h3 className="mt-4 text-base font-bold text-fg">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-fg-muted">{item.body}</p>
              <Button to={item.action.to} size="sm" variant="secondary" className="mt-4" trailingIcon="arrowRight">
                {item.action.label}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------ similar */}
      {similar.length > 0 && (
        <section className="space-y-5 border-t border-line pt-10">
          <SectionHeader
            eyebrow="You might also like"
            icon="sparkles"
            title={`Similar to ${destination.name}`}
            description="Matched on experience type, budget band and season."
          />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {similar.map((item) => (
              <DestinationCard key={item.slug} destination={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default DestinationDetails;
