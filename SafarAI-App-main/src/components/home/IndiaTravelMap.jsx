import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { Chip } from '../ui/Badge';
import { SectionHeader } from '../ui/Section';
import { destinations, allRegions } from '../../data/destinations';
import DestinationImage from '../DestinationImage';

/**
 * IndiaTravelMap — an interactive coverage map.
 *
 * The outline is a simplified India polygon projected from real
 * latitude/longitude, so destination markers sit in geographically
 * meaningful positions. Region filters, hover previews and keyboard
 * focus are all supported.
 */

const BOUNDS = { minLng: 67.5, maxLng: 98, minLat: 6.5, maxLat: 37.5 };
const VIEW = { w: 100, h: 118 };

const OUTLINE = [
  [35.5, 76.5], [34, 78.6], [32.5, 79.2], [30.5, 81], [28.2, 84], [27.5, 88.2],
  [27.3, 89.5], [26.8, 92], [27.8, 95.4], [28.2, 97.2], [27, 97], [25.5, 94.6],
  [24, 94.5], [23, 93.3], [21.9, 92.6], [22.5, 89.2], [21.6, 87.5], [19.5, 85.2],
  [16, 81.5], [13.5, 80.3], [11, 79.8], [8.1, 77.5], [9.5, 76.3], [12.8, 74.8],
  [15.5, 73.7], [19, 72.8], [21.7, 72.6], [22.5, 69], [23.8, 68.2], [25.2, 70.8],
  [27.7, 71.5], [30.2, 74.5], [32.4, 74.4], [34.5, 74.5],
];

function project(lat, lng) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * VIEW.w;
  const y = VIEW.h - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * VIEW.h;
  return { x, y };
}

const outlinePath = `${OUTLINE.map(([lat, lng], index) => {
  const { x, y } = project(lat, lng);
  return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
}).join(' ')} Z`;

const REGION_TONE = {
  North: { fill: '#6366f1', label: 'Himalaya & plains' },
  South: { fill: '#06b6d4', label: 'Coast & backwaters' },
  East: { fill: '#10b981', label: 'Hills & waterfalls' },
  West: { fill: '#f59e0b', label: 'Deserts & beaches' },
};

export default function IndiaTravelMap() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('All');
  const [hovered, setHovered] = useState(null);

  const filtered = useMemo(
    () => (region === 'All' ? destinations : destinations.filter((item) => item.region === region)),
    [region]
  );

  const active = hovered ? destinations.find((item) => item.slug === hovered) : null;

  return (
    <section aria-labelledby="map-heading" className="space-y-6">
      <SectionHeader
        eyebrow="Coverage"
        icon="map"
        title="Explore India by region"
        description="Every marker is a fully mapped destination with costs, stays, transport and safety data."
        action={
          <Button to="/explore" size="sm" variant="secondary" trailingIcon="arrowRight">
            Open explorer
          </Button>
        }
      />

      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-6">
          <Chip active={region === 'All'} onClick={() => setRegion('All')} count={destinations.length}>
            All India
          </Chip>
          {allRegions.map((item) => (
            <Chip
              key={item}
              active={region === item}
              onClick={() => setRegion(item)}
              count={destinations.filter((d) => d.region === item).length}
            >
              {item}
            </Chip>
          ))}
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* map */}
          <div className="relative bg-gradient-to-br from-brand-50/60 via-surface to-accent-50/50 p-4 dark:from-brand-500/5 dark:to-accent-500/5 sm:p-6">
            <div className="relative mx-auto w-full max-w-md">
              <svg
                viewBox={`-4 -4 ${VIEW.w + 8} ${VIEW.h + 8}`}
                className="h-auto w-full"
                role="group"
                aria-label="Map of India with SafarAI destinations"
              >
                <defs>
                  <linearGradient id="india-fill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.14" />
                  </linearGradient>
                  <filter id="marker-glow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="1.6" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* graticule */}
                <g opacity="0.25">
                  {[10, 15, 20, 25, 30, 35].map((lat) => {
                    const { y } = project(lat, BOUNDS.minLng);
                    return (
                      <line
                        key={`lat-${lat}`}
                        x1="0"
                        x2={VIEW.w}
                        y1={y}
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="0.2"
                        strokeDasharray="1 2"
                        className="text-brand-400"
                      />
                    );
                  })}
                  {[70, 78, 86, 94].map((lng) => {
                    const { x } = project(BOUNDS.minLat, lng);
                    return (
                      <line
                        key={`lng-${lng}`}
                        y1="0"
                        y2={VIEW.h}
                        x1={x}
                        x2={x}
                        stroke="currentColor"
                        strokeWidth="0.2"
                        strokeDasharray="1 2"
                        className="text-brand-400"
                      />
                    );
                  })}
                </g>

                <path
                  d={outlinePath}
                  fill="url(#india-fill)"
                  stroke="currentColor"
                  strokeWidth="0.7"
                  strokeLinejoin="round"
                  className="text-brand-500/70"
                />

                {destinations.map((destination) => {
                  const { x, y } = project(destination.coords.lat, destination.coords.lng);
                  const dimmed = region !== 'All' && destination.region !== region;
                  const isHovered = hovered === destination.slug;
                  const tone = REGION_TONE[destination.region]?.fill || '#6366f1';

                  return (
                    <g
                      key={destination.slug}
                      transform={`translate(${x} ${y})`}
                      opacity={dimmed ? 0.22 : 1}
                      className="cursor-pointer transition-opacity duration-300"
                      onMouseEnter={() => setHovered(destination.slug)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => navigate(`/destination/${destination.slug}`)}
                      role="button"
                      tabIndex={dimmed ? -1 : 0}
                      aria-label={`${destination.name}, ${destination.region} India`}
                      onFocus={() => setHovered(destination.slug)}
                      onBlur={() => setHovered(null)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/destination/${destination.slug}`);
                        }
                      }}
                    >
                      {isHovered && <circle r="4.5" fill={tone} opacity="0.25" />}
                      <circle
                        r={isHovered ? 2.4 : 1.7}
                        fill={tone}
                        filter={isHovered ? 'url(#marker-glow)' : undefined}
                        className="transition-all duration-200"
                      />
                      <circle r="0.7" fill="#fff" />
                    </g>
                  );
                })}
              </svg>

              {active && (
                <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-xl border border-line bg-surface/95 p-3 shadow-lift backdrop-blur animate-fade-up sm:inset-x-6">
                  <div className="flex items-center gap-3">
                    <DestinationImage
                      destination={active}
                      width={160}
                      compact
                      rounded="rounded-lg"
                      className="h-11 w-11 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-fg">{active.name}</p>
                      <p className="truncate text-xs text-fg-muted">{active.tagline}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-50 px-2 py-1 text-2xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                      {active.bestTime}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {Object.entries(REGION_TONE).map(([key, tone]) => (
                <span key={key} className="inline-flex items-center gap-1.5 text-2xs font-semibold text-fg-subtle">
                  <span className="h-2 w-2 rounded-full" style={{ background: tone.fill }} />
                  {key} · {tone.label}
                </span>
              ))}
            </div>
          </div>

          {/* list */}
          <div className="border-t border-line lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-bold text-fg">
                {region === 'All' ? 'All destinations' : `${region} India`}
              </p>
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-2xs font-bold text-fg-muted">
                {filtered.length}
              </span>
            </div>

            <ul className="max-h-[26rem] divide-y divide-line overflow-y-auto">
              {filtered.map((destination) => (
                <li key={destination.slug}>
                  <button
                    type="button"
                    onMouseEnter={() => setHovered(destination.slug)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(destination.slug)}
                    onBlur={() => setHovered(null)}
                    onClick={() => navigate(`/destination/${destination.slug}`)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
                      hovered === destination.slug ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-surface-muted'
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: REGION_TONE[destination.region]?.fill }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">{destination.name}</span>
                      <span className="block truncate text-xs text-fg-muted">{destination.state}</span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-brand-600 dark:text-brand-300">
                      ₹{(destination.dailyCost / 1000).toFixed(1)}k/day
                    </span>
                    <Icon name="chevronRight" size="sm" className="shrink-0 text-fg-subtle" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
