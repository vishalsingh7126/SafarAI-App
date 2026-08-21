import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { Chip } from '../ui/Badge';
import { SectionHeader } from '../ui/Section';
import DestinationImage from '../DestinationImage';
import { destinations, continents, continentCounts } from '../../data/destinations';
import { formatINR } from '../../lib/format';
import { cn } from '../../lib/cn';

const WorldMap = lazy(() => import('../geo/WorldMap'));

/**
 * WorldMapSection — the real cartographic map on the landing page.
 * Leaflet and its tiles are only requested once the section scrolls into
 * view, so the map never costs anything on first paint.
 */
export default function WorldMapSection() {
  const [continent, setContinent] = useState('All');
  const [selected, setSelected] = useState(null);
  const [inView, setInView] = useState(false);
  const wrapRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '250px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const visible = useMemo(
    () => (continent === 'All' ? destinations : destinations.filter((item) => item.continent === continent)),
    [continent]
  );

  const topPicks = useMemo(
    () => [...visible].sort((a, b) => b.popularity - a.popularity).slice(0, 5),
    [visible]
  );

  return (
    <section aria-labelledby="worldmap-heading" className="space-y-6">
      <SectionHeader
        eyebrow="Coverage"
        icon="map"
        title={`${destinations.length} destinations, mapped for real`}
        description="Satellite and terrain basemaps with live clustering — click any marker to see the brief, or open the 3D globe."
        action={
          <Button to="/world" size="sm" leadingIcon="globe">
            Open 3D world explorer
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Chip active={continent === 'All'} onClick={() => setContinent('All')} count={destinations.length}>
          All continents
        </Chip>
        {continents.map((item) => (
          <Chip
            key={item}
            active={continent === item}
            onClick={() => setContinent(item)}
            count={continentCounts[item]}
          >
            {item}
          </Chip>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div
          ref={wrapRef}
          className="relative h-[24rem] overflow-hidden rounded-3xl border border-line bg-surface-muted shadow-card sm:h-[30rem]"
        >
          {inView ? (
            <Suspense
              fallback={
                <div className="grid h-full place-items-center">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-500" />
                </div>
              }
            >
              <WorldMap
                ref={mapRef}
                destinations={visible}
                selectedSlug={selected?.slug || null}
                onSelect={setSelected}
                initialView={{ center: [22, 30], zoom: 2 }}
              />
            </Suspense>
          ) : (
            <div className="grid h-full place-items-center text-fg-subtle">
              <div className="flex flex-col items-center gap-2">
                <Icon name="map" size={28} />
                <p className="text-xs font-semibold">Map loads as you scroll</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {selected ? (
            <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card animate-fade-up">
              <DestinationImage destination={selected} width={640} className="h-32 w-full" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-fg">{selected.name}</h3>
                    <p className="truncate text-xs text-fg-muted">
                      {selected.country} · {selected.continent}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Clear selection"
                    className="rounded-full p-1 text-fg-subtle transition hover:bg-surface-muted"
                  >
                    <Icon name="close" size="sm" />
                  </button>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-fg-muted">{selected.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-2xs font-semibold text-fg-muted">
                  <span className="rounded-full bg-surface-muted px-2 py-1">{selected.bestTime}</span>
                  <span className="rounded-full bg-surface-muted px-2 py-1">
                    {formatINR(selected.dailyCost, { compact: true })}/day
                  </span>
                  <span className="rounded-full bg-surface-muted px-2 py-1">{selected.rating}★</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button to={`/destination/${selected.slug}`} size="sm" variant="secondary">
                    Full guide
                  </Button>
                  <Button to={`/world?focus=${selected.slug}`} size="sm" leadingIcon="globe">
                    On the globe
                  </Button>
                </div>
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-5 text-center">
              <Icon name="mapPin" size={26} className="mx-auto text-brand-500" />
              <p className="mt-2 text-sm font-semibold text-fg">Click a marker</p>
              <p className="mt-1 text-xs text-fg-muted">
                Clusters split as you zoom, right down to individual destinations.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <p className="text-2xs font-bold uppercase tracking-wider text-fg-subtle">
              Most searched {continent === 'All' ? 'worldwide' : `in ${continent}`}
            </p>
            <ul className="mt-3 space-y-1">
              {topPicks.map((item, index) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      mapRef.current?.flyTo(item.coords.lat, item.coords.lng, 5);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition',
                      selected?.slug === item.slug ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-surface-muted'
                    )}
                  >
                    <span className="w-4 text-2xs font-bold text-fg-subtle">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">{item.name}</span>
                      <span className="block truncate text-2xs text-fg-subtle">{item.country}</span>
                    </span>
                    <Icon name="arrowUpRight" size="sm" className="shrink-0 text-fg-subtle" />
                  </button>
                </li>
              ))}
            </ul>
            <Link
              to="/world"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
            >
              Explore all {destinations.length} destinations
              <Icon name="arrowRight" size="xs" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
