import { useMemo, useState } from 'react';
import { Chip } from '../ui/Badge';
import Button from '../ui/Button';
import { SectionHeader, Reveal } from '../ui/Section';
import { SkeletonCard } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import DestinationCard from '../DestinationCard';
import { destinations, continents } from '../../data/destinations';

const SORTS = [
  { value: 'popularity', label: 'Most popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'budget', label: 'Lowest budget' },
  { value: 'safety', label: 'Safest' },
];

const CONTINENT_ICONS = {
  Asia: 'compass',
  Europe: 'building',
  Africa: 'leaf',
  'North America': 'mountain',
  'South America': 'plane',
  Oceania: 'camera',
  'Middle East': 'sun',
  'Central America': 'leaf',
  Caribbean: 'camera',
};

const FILTERS = [
  { value: 'all', label: 'Everywhere', icon: 'globe' },
  ...continents.map((continent) => ({
    value: continent,
    label: continent,
    icon: CONTINENT_ICONS[continent] || 'mapPin',
  })),
  { value: 'Beach', label: 'Beaches', icon: 'camera' },
  { value: 'Heritage', label: 'Heritage', icon: 'building' },
  { value: 'Adventure', label: 'Adventure', icon: 'zap' },
];

export default function DestinationExplorer({ loading = false }) {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('popularity');
  const [visible, setVisible] = useState(6);

  const results = useMemo(() => {
    let list = destinations;

    if (filter !== 'all') {
      list = continents.includes(filter)
        ? list.filter((item) => item.continent === filter)
        : list.filter((item) => item.tags.includes(filter));
    }

    const sorted = [...list];
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    if (sort === 'budget') sorted.sort((a, b) => a.budgetFrom - b.budgetFrom);
    if (sort === 'safety') sorted.sort((a, b) => b.safetyScore - a.safetyScore);
    if (sort === 'popularity') sorted.sort((a, b) => b.popularity - a.popularity);

    return sorted;
  }, [filter, sort]);

  const shown = results.slice(0, visible);

  return (
    <section aria-labelledby="explore-heading" className="space-y-6">
      <SectionHeader
        eyebrow="Discover"
        icon="compass"
        title="Destinations travellers are loving right now"
        description="Filtered from real trip data — budget bands, safety scores and the best window to go, across every continent."
        action={
          <>
            <Button to="/world" size="sm" variant="secondary" leadingIcon="globe">
              3D globe
            </Button>
            <Button to="/explore" variant="secondary" size="sm" trailingIcon="arrowRight">
              View all
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
          {FILTERS.map((item) => (
            <Chip
              key={item.value}
              icon={item.icon}
              active={filter === item.value}
              onClick={() => {
                setFilter(item.value);
                setVisible(6);
              }}
            >
              {item.label}
            </Chip>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label htmlFor="dest-sort" className="text-xs font-semibold text-fg-subtle">
            Sort
          </label>
          <select
            id="dest-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-9 cursor-pointer rounded-full border border-line bg-surface px-3 text-xs font-semibold text-fg outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
          >
            {SORTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon="compass"
          title="No destinations in this filter yet"
          description="Try another region or clear the filter to see everything we cover."
          action={{ label: 'Clear filter', onClick: () => setFilter('all'), icon: 'refresh' }}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((destination, index) => (
              <Reveal key={destination.slug} delay={(index % 3) * 70}>
                <DestinationCard destination={destination} priority={index < 3} />
              </Reveal>
            ))}
          </div>

          {visible < results.length && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={() => setVisible((prev) => prev + 6)} leadingIcon="plus">
                Show more destinations
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
