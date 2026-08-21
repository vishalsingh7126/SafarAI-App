import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useMediaQuery from '../hooks/useMediaQuery';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge, { Chip } from '../components/ui/Badge';
import Rating from '../components/ui/Rating';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Input, Select, Checkbox, RangeSlider } from '../components/ui/Input';
import DestinationImage from '../components/DestinationImage';
import { CONTINENT_COLORS } from '../components/geo/WorldMap';
import { POI_CATEGORIES, poisFor } from '../data/pointsOfInterest';
import { hotelsByDestination } from '../data/hotelsDatabase';
import {
  destinations as allDestinations,
  continents,
  continentCounts,
  allTags,
  filterDestinations,
  nearbyDestinations,
  maxDailyCost,
  minDailyCost,
} from '../data/destinations';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useAssistant } from '../context/AssistantContext';
import { formatINR } from '../lib/format';
import { cn } from '../lib/cn';

const RealisticGlobe = lazy(() => import('../components/geo/RealisticGlobe'));
const WorldMap = lazy(() => import('../components/geo/WorldMap'));

const SORTS = [
  { value: 'popularity', label: 'Most popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'cost-asc', label: 'Cheapest first' },
  { value: 'cost-desc', label: 'Most premium' },
  { value: 'safety', label: 'Safest' },
  { value: 'name', label: 'A → Z' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TRAVEL_TYPES = [
  { value: 'beach', label: 'Beaches', icon: 'camera' },
  { value: 'mountains', label: 'Mountains', icon: 'mountain' },
  { value: 'heritage', label: 'Heritage', icon: 'building' },
  { value: 'nature', label: 'Nature', icon: 'leaf' },
  { value: 'adventure', label: 'Adventure', icon: 'zap' },
  { value: 'food', label: 'Food', icon: 'utensils' },
  { value: 'wildlife', label: 'Wildlife', icon: 'compass' },
  { value: 'culture', label: 'Culture', icon: 'users' },
  { value: 'wellness', label: 'Wellness', icon: 'leaf' },
  { value: 'nightlife', label: 'Nightlife', icon: 'zap' },
];

function ViewportFallback({ label }) {
  return (
    <div className="grid h-full w-full place-items-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
        <p className="text-xs font-semibold text-white/60">{label}</p>
      </div>
    </div>
  );
}

function DetailPanel({ destination, onClose, onZoomToMap, view }) {
  const { isFavourite, toggleFavourite, trackView } = useWorkspace();
  const toast = useToast();
  const { send, openDock } = useAssistant();
  const saved = isFavourite(`dest-${destination.slug}`);
  const nearby = useMemo(() => nearbyDestinations(destination, 3), [destination]);

  useEffect(() => {
    trackView({
      id: `dest-${destination.slug}`,
      type: 'destination',
      title: destination.name,
      href: `/destination/${destination.slug}`,
    });
  }, [destination, trackView]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
      <div className="relative">
        <DestinationImage destination={destination} width={800} className="h-40 w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close destination panel"
          className="absolute right-2 top-2 rounded-full border border-white/25 bg-slate-950/50 p-1.5 text-white backdrop-blur transition hover:bg-slate-950/75"
        >
          <Icon name="close" size="sm" />
        </button>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: CONTINENT_COLORS[destination.continent] || '#6366f1' }}
            />
            <p className="text-2xs font-bold uppercase tracking-wider text-white/80">
              {destination.country} · {destination.continent}
            </p>
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-white">{destination.name}</h2>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Rating value={destination.rating} showValue count={destination.reviews} />
          {destination.unesco && <Badge tone="warning" size="sm">UNESCO</Badge>}
          <Badge tone="neutral" size="sm" icon="shield">
            Safety {destination.safetyScore}
          </Badge>
        </div>

        <p className="text-sm leading-6 text-fg-muted">{destination.description}</p>

        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-surface-muted p-3 text-center">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">Best time</dt>
            <dd className="mt-0.5 text-xs font-bold text-fg">{destination.bestTime}</dd>
          </div>
          <div className="border-x border-line">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">Stay</dt>
            <dd className="mt-0.5 text-xs font-bold text-fg">{destination.duration}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">Per day</dt>
            <dd className="mt-0.5 text-xs font-bold text-fg">{formatINR(destination.dailyCost, { compact: true })}</dd>
          </div>
        </dl>

        <div>
          <p className="text-2xs font-bold uppercase tracking-wider text-fg-subtle">Key attractions</p>
          <ul className="mt-2 space-y-1.5">
            {destination.topAttractions.map((attraction) => (
              <li key={attraction} className="flex items-start gap-2 text-sm text-fg-muted">
                <Icon name="mapPin" size="xs" className="mt-1 shrink-0 text-brand-500" />
                {attraction}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-2xs font-bold uppercase tracking-wider text-fg-subtle">Popular activities</p>
          <ul className="mt-2 space-y-1.5">
            {destination.activities.map((activity) => (
              <li key={activity} className="flex items-start gap-2 text-sm text-fg-muted">
                <Icon name="sparkles" size="xs" className="mt-1 shrink-0 text-accent-500" />
                {activity}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {destination.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-line bg-surface-muted px-2 py-0.5 text-2xs font-semibold text-fg-muted">
              {tag}
            </span>
          ))}
        </div>

        {nearby.length > 0 && (
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-fg-subtle">Nearby</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {nearby.map((item) => (
                <span key={item.slug} className="rounded-full bg-surface-muted px-2.5 py-1 text-2xs font-semibold text-fg-muted">
                  {item.name} · {item.distanceKm.toLocaleString('en-IN')} km
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-line bg-surface-muted p-3">
        {view === 'globe' && (
          <Button fullWidth size="sm" leadingIcon="map" onClick={onZoomToMap}>
            Zoom into the map
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button to={`/destination/${destination.slug}`} size="sm" variant="secondary" leadingIcon="compass">
            Full guide
          </Button>
          <Button
            to={`/trip-planner?destination=${encodeURIComponent(destination.name)}`}
            size="sm"
            variant="secondary"
            leadingIcon="sparkles"
          >
            Plan trip
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant={saved ? 'success' : 'ghost'}
            leadingIcon="heart"
            onClick={() => {
              const added = toggleFavourite({
                id: `dest-${destination.slug}`,
                type: 'destination',
                title: destination.name,
                subtitle: `${destination.country} · ${destination.continent}`,
                image: destination.image || null,
                href: `/destination/${destination.slug}`,
              });
              toast[added ? 'success' : 'info'](added ? `${destination.name} saved` : 'Removed from saved');
            }}
          >
            {saved ? 'Saved' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leadingIcon="bot"
            onClick={() => {
              openDock();
              send(`Plan a trip to ${destination.name}, ${destination.country}. Best time, budget and a day-by-day outline.`);
            }}
          >
            Ask AI
          </Button>
        </div>
      </div>
    </div>
  );
}

function WorldExplorer() {
  usePageMeta(
    'World Explorer | SafarAI',
    'Spin a photoreal 3D globe, zoom into a real terrain map, and explore 150+ destinations across every continent.'
  );

  const [searchParams] = useSearchParams();
  const [view, setView] = useState(searchParams.get('view') === 'map' ? 'map' : 'globe');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const debouncedQuery = useDebouncedValue(query, 220);
  const [continentFilter, setContinentFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [maxCost, setMaxCost] = useState(maxDailyCost);
  const [minSafety, setMinSafety] = useState(0);
  const [month, setMonth] = useState('any');
  const [unescoOnly, setUnescoOnly] = useState(false);
  const [sort, setSort] = useState('popularity');
  const [selected, setSelected] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showClouds, setShowClouds] = useState(true);
  const [basemap, setBasemap] = useState('satellite');

  const [showRoute, setShowRoute] = useState(true);
  const globeRef = useRef(null);
  const mapRef = useRef(null);
  const pendingFocus = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { trackSearch, preferences } = useWorkspace();

  // If the traveller's home city is in the catalogue we can draw the real
  // great-circle route from home to the selected destination.
  const homeDestination = useMemo(() => {
    const home = (preferences?.homeCity || '').trim().toLowerCase();
    if (!home) return null;
    return (
      allDestinations.find((item) => item.name.toLowerCase() === home) ||
      allDestinations.find((item) => item.name.toLowerCase().includes(home)) ||
      null
    );
  }, [preferences?.homeCity]);

  // Real attractions, airports and hotels for whichever place is selected.
  const activePois = useMemo(() => {
    if (!selected) return [];
    const attractions = poisFor(selected.slug);
    const stays = (hotelsByDestination[selected.slug] || []).map((hotel) => ({
      id: `hotel-${hotel.id}`,
      destination: selected.slug,
      name: hotel.name,
      category: 'hotel',
      coords: hotel.coords,
      wiki: hotel.wiki,
      note: `${hotel.rating}★ · from ₹${hotel.pricePerNight.toLocaleString('en-IN')} per night`,
    }));
    return [...attractions, ...stays];
  }, [selected]);

  const route = useMemo(() => {
    if (!showRoute || !selected || !homeDestination || homeDestination.slug === selected.slug) return null;
    return {
      from: homeDestination.coords,
      to: selected.coords,
      fromName: homeDestination.name,
      toName: selected.name,
    };
  }, [showRoute, selected, homeDestination]);

  /* ------------------------------------------------------------- filtering */
  const results = useMemo(() => {
    const list = filterDestinations({
      query: debouncedQuery,
      continents: continentFilter,
      interests: typeFilter,
      maxDailyCost: maxCost,
      minSafety,
      month: month === 'any' ? null : month,
      unescoOnly,
    });

    const sorted = [...list];
    if (sort === 'popularity') sorted.sort((a, b) => b.popularity - a.popularity);
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    if (sort === 'cost-asc') sorted.sort((a, b) => a.dailyCost - b.dailyCost);
    if (sort === 'cost-desc') sorted.sort((a, b) => b.dailyCost - a.dailyCost);
    if (sort === 'safety') sorted.sort((a, b) => b.safetyScore - a.safetyScore);
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [debouncedQuery, continentFilter, typeFilter, maxCost, minSafety, month, unescoOnly, sort]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 2) trackSearch(debouncedQuery.trim());
  }, [debouncedQuery, trackSearch]);

  const activeFilters =
    continentFilter.length +
    typeFilter.length +
    (maxCost < maxDailyCost ? 1 : 0) +
    (minSafety > 0 ? 1 : 0) +
    (month !== 'any' ? 1 : 0) +
    (unescoOnly ? 1 : 0);

  const resetFilters = () => {
    setContinentFilter([]);
    setTypeFilter([]);
    setMaxCost(maxDailyCost);
    setMinSafety(0);
    setMonth('any');
    setUnescoOnly(false);
  };

  /* ------------------------------------------------------------- selection */
  const focusDestination = useCallback(
    (destination, { zoomIn = false } = {}) => {
      setSelected(destination);
      setListOpen(false);
      if (view === 'globe') {
        globeRef.current?.flyTo(destination.coords.lat, destination.coords.lng, {
          altitude: zoomIn ? 1.45 : 1.75,
          duration: 1500,
        });
      } else {
        mapRef.current?.flyTo(destination.coords.lat, destination.coords.lng, zoomIn ? 9 : 6);
      }
    },
    [view]
  );

  // Globe → map hand-off: fly the globe in, then swap views and land the map
  // on the same coordinate so the transition reads as one continuous zoom.
  const zoomIntoMap = useCallback(() => {
    if (!selected) return;
    globeRef.current?.flyTo(selected.coords.lat, selected.coords.lng, { altitude: 1.36, duration: 900 });
    pendingFocus.current = { ...selected.coords, zoom: 9 };
    setTimeout(() => setView('map'), 780);
  }, [selected]);

  useEffect(() => {
    if (view !== 'map' || !pendingFocus.current) return undefined;
    const focus = pendingFocus.current;
    pendingFocus.current = null;
    const timer = setTimeout(() => {
      mapRef.current?.invalidate();
      mapRef.current?.flyTo(focus.lat, focus.lng, focus.zoom);
    }, 260);
    return () => clearTimeout(timer);
  }, [view]);

  // Deep link: /world?focus=tokyo
  useEffect(() => {
    const slug = searchParams.get('focus');
    if (!slug) return;
    const destination = allDestinations.find((item) => item.slug === slug);
    if (destination) {
      setSelected(destination);
      setTimeout(() => focusDestination(destination), 900);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----------------------------------------------------------------- panes */
  const filterPanel = (prefix) => (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">Continent</p>
        <div className="space-y-1">
          {continents.map((continent) => (
            <Checkbox
              key={continent}
              id={`${prefix}-continent-${continent}`}
              checked={continentFilter.includes(continent)}
              onChange={() =>
                setContinentFilter((prev) =>
                  prev.includes(continent) ? prev.filter((item) => item !== continent) : [...prev, continent]
                )
              }
              label={
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: CONTINENT_COLORS[continent] || '#6366f1' }}
                  />
                  {continent}
                </span>
              }
              count={continentCounts[continent]}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">Travel type</p>
        <div className="flex flex-wrap gap-1.5">
          {TRAVEL_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              aria-pressed={typeFilter.includes(type.value)}
              onClick={() =>
                setTypeFilter((prev) =>
                  prev.includes(type.value) ? prev.filter((item) => item !== type.value) : [...prev, type.value]
                )
              }
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs font-semibold transition',
                typeFilter.includes(type.value)
                  ? 'border-transparent bg-brand-gradient text-white shadow-float'
                  : 'border-line bg-surface text-fg-muted hover:border-brand-300'
              )}
            >
              <Icon name={type.icon} size="xs" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-4">
        <RangeSlider
          id={`${prefix}-cost`}
          label="Max daily budget"
          min={minDailyCost}
          max={maxDailyCost}
          step={500}
          value={maxCost}
          onChange={setMaxCost}
          format={(value) => formatINR(value, { compact: true })}
        />
      </div>

      <div className="border-t border-line pt-4">
        <RangeSlider
          id={`${prefix}-safety`}
          label="Minimum safety score"
          min={0}
          max={95}
          step={5}
          value={minSafety}
          onChange={setMinSafety}
          format={(value) => (value === 0 ? 'Any' : `${value}+`)}
        />
      </div>

      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">Travelling in</p>
        <Select
          id={`${prefix}-month`}
          aria-label="Filter by travel month"
          icon="calendar"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        >
          <option value="any">Any month</option>
          {MONTHS.map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="border-t border-line pt-4">
        <Checkbox
          id={`${prefix}-unesco`}
          checked={unescoOnly}
          onChange={() => setUnescoOnly((prev) => !prev)}
          label="UNESCO World Heritage only"
        />
      </div>

      <Button variant="secondary" fullWidth size="sm" leadingIcon="refresh" onClick={resetFilters} disabled={!activeFilters}>
        Reset filters
      </Button>
    </div>
  );

  const resultList = (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          icon="search"
          placeholder="Search any country, city or landmark…"
          aria-label="Search destinations"
          trailing={
            query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="rounded-full p-1 hover:bg-surface-muted">
                <Icon name="close" size="sm" />
              </button>
            ) : null
          }
        />
        <div className="mt-2 flex items-center gap-2">
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            icon="sort"
            size="sm"
            aria-label="Sort destinations"
            className="flex-1"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            variant="secondary"
            leadingIcon="filter"
            aria-label={`Open filters${activeFilters ? ` (${activeFilters} active)` : ''}`}
            onClick={() => setFiltersOpen(true)}
            className="shrink-0 lg:hidden"
          >
            Filters{activeFilters ? ` (${activeFilters})` : ''}
          </Button>
        </div>
        <p className="mt-2 text-2xs font-semibold text-fg-subtle">
          {results.length} of {allDestinations.length} destinations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <EmptyState
            compact
            className="m-3"
            icon="search"
            title="Nothing matches those filters"
            description="Try widening the budget or clearing a continent."
            action={{ label: 'Reset filters', onClick: resetFilters, icon: 'refresh' }}
          />
        ) : (
          <ul className="divide-y divide-line">
            {results.map((destination) => (
              <li key={destination.slug}>
                <button
                  type="button"
                  onClick={() => focusDestination(destination)}
                  className={cn(
                    'flex w-full items-center gap-3 p-3 text-left transition',
                    selected?.slug === destination.slug ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-surface-muted'
                  )}
                >
                  <DestinationImage destination={destination} width={160} compact className="h-12 w-12 shrink-0" rounded="rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: CONTINENT_COLORS[destination.continent] || '#6366f1' }}
                      />
                      <span className="truncate text-sm font-bold text-fg">{destination.name}</span>
                    </span>
                    <span className="block truncate text-2xs text-fg-muted">
                      {destination.country} · {destination.bestTime}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-2xs font-bold text-fg">{destination.rating}★</span>
                    <span className="block text-[10px] text-fg-subtle">
                      {formatINR(destination.dailyCost, { compact: true })}/d
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ---------------------------------------------------------- header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/80 px-3 py-1 text-2xs font-bold uppercase tracking-[0.2em] text-brand-700 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-200">
            <Icon name="globe" size="xs" /> World explorer
          </p>
          <h1 className="text-[clamp(1.7rem,1.2rem+2vw,2.4rem)] font-extrabold tracking-tight text-fg">
            Spin the planet. Pick your next trip.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted sm:text-base">
            {allDestinations.length} destinations across {continents.length} regions on a photoreal globe — drag to
            rotate, click a marker, then zoom straight into the terrain map.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-line bg-surface-muted p-1">
            {[
              { value: 'globe', label: 'Globe', icon: 'globe' },
              { value: 'map', label: 'Map', icon: 'map' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setView(option.value)}
                aria-pressed={view === option.value}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition',
                  view === option.value ? 'bg-brand-gradient text-white shadow-float' : 'text-fg-muted hover:text-fg'
                )}
              >
                <Icon name={option.icon} size="sm" />
                {option.label}
              </button>
            ))}
          </div>

          {view === 'map' && homeDestination && (
            <Button
              size="sm"
              variant={showRoute ? 'soft' : 'secondary'}
              leadingIcon="plane"
              onClick={() => setShowRoute((prev) => !prev)}
            >
              Route from {homeDestination.name}
            </Button>
          )}

          {view === 'globe' && (
            <>
              <Button
                size="sm"
                variant={autoRotate ? 'soft' : 'secondary'}
                leadingIcon="refresh"
                onClick={() => setAutoRotate((prev) => !prev)}
              >
                {autoRotate ? 'Rotating' : 'Paused'}
              </Button>
              <Button
                size="sm"
                variant={showClouds ? 'soft' : 'secondary'}
                leadingIcon="wifi"
                onClick={() => setShowClouds((prev) => !prev)}
              >
                Clouds
              </Button>
            </>
          )}

          <Button size="sm" variant="secondary" leadingIcon="list" onClick={() => setListOpen(true)} className="lg:hidden">
            List
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------- workspace */}
      <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="hidden lg:flex lg:flex-col lg:gap-4">
          <Card padding="none" className="h-[26rem] overflow-hidden">
            {resultList}
          </Card>
          <Card padding="md" className="max-h-[28rem] overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-fg">Filters</h2>
              {activeFilters > 0 && <Badge tone="brand" size="sm">{activeFilters}</Badge>}
            </div>
            {filterPanel('desktop')}
          </Card>
        </aside>

        <div className="relative">
          <div
            className={cn(
              'relative overflow-hidden rounded-3xl border border-line bg-slate-950 shadow-lift',
              'h-[60vh] min-h-[26rem] lg:h-[calc(100vh-14rem)] lg:min-h-[34rem]'
            )}
          >
            <Suspense fallback={<ViewportFallback label={view === 'globe' ? 'Loading globe…' : 'Loading map…'} />}>
              {view === 'globe' ? (
                <RealisticGlobe
                  ref={globeRef}
                  destinations={results}
                  selectedSlug={selected?.slug || null}
                  onSelect={(destination) => focusDestination(destination)}
                  autoRotate={autoRotate && !selected}
                  showClouds={showClouds}
                />
              ) : (
                <WorldMap
                  ref={mapRef}
                  destinations={results}
                  selectedSlug={selected?.slug || null}
                  onSelect={(destination) => focusDestination(destination)}
                  basemap={basemap}
                  onBasemapChange={setBasemap}
                  route={route}
                  pois={activePois}
                  fitOnChange={!selected}
                />
              )}
            </Suspense>

            {view === 'map' && activePois.length > 0 && (
              <div className="pointer-events-none absolute bottom-10 left-3 z-[500] hidden max-w-[15rem] flex-wrap gap-x-3 gap-y-1 rounded-xl border border-line bg-surface/92 p-2.5 shadow-lift backdrop-blur sm:flex">
                <p className="w-full text-[10px] font-bold uppercase tracking-wider text-fg-subtle">
                  {activePois.length} places in {selected?.name} · zoom in to see them
                </p>
                {[...new Set(activePois.map((item) => item.category))].map((category) => {
                  const meta = POI_CATEGORIES[category] || { label: 'Hotel', color: '#ec4899' };
                  return (
                    <span key={category} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-fg-muted">
                      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                      {meta.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* legend */}
            {view === 'globe' && (
              <div className="pointer-events-none absolute bottom-3 left-3 hidden flex-wrap gap-2 rounded-xl border border-white/10 bg-slate-950/60 p-2 backdrop-blur sm:flex">
                {continents.slice(0, 5).map((continent) => (
                  <span key={continent} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: CONTINENT_COLORS[continent] }} />
                    {continent}
                  </span>
                ))}
              </div>
            )}

            {/* detail panel */}
            {selected && isDesktop && (
              <div className="absolute right-4 top-4 z-[600] w-[20rem] max-h-[calc(100%-2rem)] animate-fade-up">
                <DetailPanel
                  destination={selected}
                  view={view}
                  onClose={() => setSelected(null)}
                  onZoomToMap={zoomIntoMap}
                />
              </div>
            )}

            {view === 'globe' && !selected && (
              <div className="pointer-events-none absolute right-4 top-4 hidden rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-2xs text-white/70 backdrop-blur lg:block">
                Drag to rotate · scroll to zoom · click a marker
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- mobile sheets */}
      {selected && !isDesktop && (
        <div className="fixed inset-x-0 bottom-0 z-[600] max-h-[72vh] p-3 lg:hidden">
          <DetailPanel destination={selected} view={view} onClose={() => setSelected(null)} onZoomToMap={zoomIntoMap} />
        </div>
      )}

      <Modal open={listOpen} onClose={() => setListOpen(false)} title="Destinations" icon="list" size="md">
        <div className="-m-5 h-[65vh]">{resultList}</div>
      </Modal>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        icon="filter"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Show {results.length} places</Button>
          </>
        }
      >
        {filterPanel('mobile')}
      </Modal>

      {/* ------------------------------------------------------- continents */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-fg">Jump to a continent</h2>
        <div className="flex flex-wrap gap-2">
          {continents.map((continent) => (
            <Chip
              key={continent}
              active={continentFilter.length === 1 && continentFilter[0] === continent}
              count={continentCounts[continent]}
              onClick={() => {
                const next = continentFilter.length === 1 && continentFilter[0] === continent ? [] : [continent];
                setContinentFilter(next);
                setSelected(null);
              }}
            >
              {continent}
            </Chip>
          ))}
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-fg-muted transition hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-200"
          >
            <Icon name="grid" size="sm" />
            Browse as cards
          </Link>
        </div>
      </section>
    </div>
  );
}

export default WorldExplorer;
