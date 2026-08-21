import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useSyncedSearchParams from '../hooks/useSyncedSearchParams';
import { PageHeader, SectionHeader } from '../components/ui/Section';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge, { Chip } from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Input, Checkbox, RangeSlider, Select } from '../components/ui/Input';
import DestinationCard from '../components/DestinationCard';
import DestinationImage from '../components/DestinationImage';
import { destinations, continents, continentCounts, allTags } from '../data/destinations';
import { foodCultureDatabase } from '../data/foodCultureDatabase';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../lib/format';
import { cn } from '../lib/cn';

const SORTS = [
  { value: 'trending', label: 'Trending' },
  { value: 'rating', label: 'Top rated' },
  { value: 'budget-asc', label: 'Budget: low to high' },
  { value: 'budget-desc', label: 'Budget: high to low' },
  { value: 'safety', label: 'Safest first' },
  { value: 'name', label: 'A → Z' },
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/* ------------------------------------------------------------ food & culture */

function FoodCultureTab() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 200);
  const { toggleFavourite, isFavourite } = useWorkspace();
  const toast = useToast();

  const cities = useMemo(() => [...new Set(foodCultureDatabase.map((item) => item.city))].sort(), []);

  const results = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    if (!needle) return foodCultureDatabase;
    return foodCultureDatabase.filter((item) =>
      `${item.city} ${item.dish} ${item.place}`.toLowerCase().includes(needle)
    );
  }, [debounced]);

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            icon="search"
            placeholder="Search a city, dish or place — e.g. Goa, bebinca…"
            aria-label="Search food and culture"
            className="flex-1"
          />
          <Button variant="secondary" leadingIcon="close" onClick={() => setQuery('')} disabled={!query}>
            Clear
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {cities.map((city) => (
            <Chip key={city} active={query.toLowerCase() === city.toLowerCase()} onClick={() => setQuery(city)}>
              {city}
            </Chip>
          ))}
        </div>
      </Card>

      <p className="text-sm font-semibold text-fg-muted">
        {results.length} food &amp; culture {results.length === 1 ? 'spot' : 'spots'}
      </p>

      {results.length === 0 ? (
        <EmptyState
          icon="utensils"
          title={`No dishes match “${query}”`}
          description="Try a city we cover — Goa, Delhi, Jaipur, Mumbai or Kerala."
          action={{ label: 'Reset search', onClick: () => setQuery(''), icon: 'refresh' }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => {
            const saved = isFavourite(`food-${item.id}`);
            return (
              <article
                key={item.id}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-fg">{item.dish}</h3>
                    <p className="mt-0.5 truncate text-xs text-fg-subtle">{item.place}</p>
                  </div>
                  <Badge tone="brand" size="sm" uppercase>
                    {item.city}
                  </Badge>
                </div>
                <p className="flex-1 text-sm leading-6 text-fg-muted">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place)}`}
                    target="_blank"
                    rel="noreferrer"
                    size="xs"
                    variant="secondary"
                    leadingIcon="mapPin"
                  >
                    View location
                  </Button>
                  <Button
                    size="xs"
                    variant={saved ? 'success' : 'soft'}
                    leadingIcon={saved ? 'check' : 'plus'}
                    onClick={() => {
                      const added = toggleFavourite({
                        id: `food-${item.id}`,
                        type: 'food',
                        title: item.dish,
                        subtitle: `${item.place}, ${item.city}`,
                        href: '/food-culture',
                      });
                      toast[added ? 'success' : 'info'](added ? 'Added to your trip list' : 'Removed from list');
                    }}
                  >
                    {saved ? 'Added to trip' : 'Add to trip'}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- comparison */

function CompareModal({ open, onClose, items, onRemove }) {
  const rows = [
    { label: 'Best time', get: (d) => d.bestTime },
    { label: 'Ideal length', get: (d) => d.duration },
    { label: 'Budget range', get: (d) => d.budget },
    { label: 'Cost / day', get: (d) => formatINR(d.dailyCost) },
    { label: 'Rating', get: (d) => `${d.rating} / 5` },
    { label: 'Safety score', get: (d) => `${d.safetyScore} / 100` },
    { label: 'Region', get: (d) => `${d.region} India` },
    { label: 'Known for', get: (d) => d.tags.join(', ') },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Compare destinations" icon="layers" size="xl">
      {items.length === 0 ? (
        <EmptyState
          compact
          icon="layers"
          title="Nothing to compare yet"
          description="Select up to three destinations to see them side by side."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-32 p-2 text-left text-2xs font-bold uppercase tracking-wider text-fg-subtle">
                  Metric
                </th>
                {items.map((item) => (
                  <th key={item.slug} className="p-2 text-left align-top">
                    <div className="rounded-xl border border-line bg-surface-muted p-3">
                      <DestinationImage
                        destination={item}
                        width={320}
                        rounded="rounded-lg"
                        className="mb-2 h-20 w-full"
                      />
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-fg">{item.name}</span>
                        <button
                          type="button"
                          onClick={() => onRemove(item.slug)}
                          aria-label={`Remove ${item.name} from comparison`}
                          className="rounded p-1 text-fg-subtle transition hover:bg-surface hover:text-rose-500"
                        >
                          <Icon name="close" size="xs" />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <th className="p-3 text-left text-xs font-semibold text-fg-subtle">{row.label}</th>
                  {items.map((item) => (
                    <td key={item.slug} className="p-3 text-sm font-medium text-fg">
                      {row.get(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

/* --------------------------------------------------------------------- page */

function ExplorePage() {
  usePageMeta('Explore | SafarAI', 'Discover destinations, food, events, and local stories with SafarAI.');

  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'food' ? 'food' : 'destinations');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const debouncedQuery = useDebouncedValue(query, 220);
  const [regions, setRegions] = useState([]);
  const [tags, setTags] = useState([]);
  const [maxBudget, setMaxBudget] = useState(200000);
  const [month, setMonth] = useState('any');
  const [minSafety, setMinSafety] = useState(0);
  const [sort, setSort] = useState('trending');
  const [view, setView] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compare, setCompare] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const { trackSearch, recentSearches, recent } = useWorkspace();
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 240);
    return () => clearTimeout(id);
  }, [debouncedQuery, regions, tags, maxBudget, month, minSafety, sort]);

  useSyncedSearchParams({ q: debouncedQuery, tab: tab === 'food' ? 'food' : '' });

  useEffect(() => {
    if (debouncedQuery.trim().length > 2) trackSearch(debouncedQuery.trim());
  }, [debouncedQuery, trackSearch]);

  const results = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    let list = destinations.filter((destination) => {
      if (
        needle &&
        !`${destination.name} ${destination.country} ${destination.continent} ${destination.region} ${destination.tagline} ${destination.tags.join(' ')}`
          .toLowerCase()
          .includes(needle)
      )
        return false;
      if (regions.length && !regions.includes(destination.continent)) return false;
      if (tags.length && !tags.some((tag) => destination.tags.includes(tag))) return false;
      if (destination.budgetFrom > maxBudget) return false;
      if (month !== 'any' && !destination.months.includes(Number(month))) return false;
      if (destination.safetyScore < minSafety) return false;
      return true;
    });

    list = [...list];
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'budget-asc') list.sort((a, b) => a.budgetFrom - b.budgetFrom);
    if (sort === 'budget-desc') list.sort((a, b) => b.budgetFrom - a.budgetFrom);
    if (sort === 'safety') list.sort((a, b) => b.safetyScore - a.safetyScore);
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'trending') list.sort((a, b) => b.trend.at(-1) - a.trend.at(-1));
    return list;
  }, [debouncedQuery, regions, tags, maxBudget, month, minSafety, sort]);

  const activeFilterCount =
    regions.length + tags.length + (month !== 'any' ? 1 : 0) + (minSafety > 0 ? 1 : 0) + (maxBudget < 200000 ? 1 : 0);

  const resetFilters = () => {
    setRegions([]);
    setTags([]);
    setMaxBudget(200000);
    setMonth('any');
    setMinSafety(0);
    toast.info('Filters cleared');
  };

  const toggleCompare = (destination) => {
    setCompare((prev) => {
      if (prev.includes(destination.slug)) return prev.filter((slug) => slug !== destination.slug);
      if (prev.length >= 3) {
        toast.info('Compare up to 3 destinations', { description: 'Remove one to add another.' });
        return prev;
      }
      return [...prev, destination.slug];
    });
  };

  const compareItems = compare
    .map((slug) => destinations.find((item) => item.slug === slug))
    .filter(Boolean);

  const renderFilters = (prefix) => (
    <div className="space-y-6">
      <div>
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-fg-subtle">Continent</p>
        <div className="space-y-1.5">
          {continents.map((continent) => (
            <Checkbox
              key={continent}
              id={`${prefix}-region-${continent}`}
              checked={regions.includes(continent)}
              onChange={() =>
                setRegions((prev) =>
                  prev.includes(continent) ? prev.filter((r) => r !== continent) : [...prev, continent]
                )
              }
              label={continent}
              count={continentCounts[continent]}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <RangeSlider
          id={`${prefix}-budget-filter`}
          label="Max starting budget"
          min={8000}
          max={200000}
          step={4000}
          value={maxBudget}
          onChange={setMaxBudget}
          format={(value) => formatINR(value, { compact: true })}
        />
      </div>

      <div className="border-t border-line pt-5">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-fg-subtle">Travel month</p>
        <Select
          id={`${prefix}-month-filter`}
          aria-label="Filter by travel month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          icon="calendar"
        >
          <option value="any">Any month</option>
          {MONTHS.map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="border-t border-line pt-5">
        <RangeSlider
          id={`${prefix}-safety-filter`}
          label="Minimum safety score"
          min={0}
          max={95}
          step={5}
          value={minSafety}
          onChange={setMinSafety}
          format={(value) => (value === 0 ? 'Any' : `${value}+`)}
        />
      </div>

      <div className="border-t border-line pt-5">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-fg-subtle">Experience</p>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))}
              aria-pressed={tags.includes(tag)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                tags.includes(tag)
                  ? 'border-transparent bg-brand-gradient text-white shadow-float'
                  : 'border-line bg-surface text-fg-muted hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-200'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <Button variant="secondary" fullWidth leadingIcon="refresh" onClick={resetFilters} disabled={!activeFilterCount}>
        Reset all filters
      </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Discover"
        icon="compass"
        title="Find the destination that fits your trip"
        description="Search, filter and compare destinations worldwide by budget, season, safety and the kind of travel you enjoy."
        stats={[
          { label: 'Destinations', value: destinations.length },
          { label: 'In results', value: results.length },
          { label: 'Comparing', value: compare.length },
        ]}
        actions={
          <>
            <Button to="/world" leadingIcon="globe">
              3D globe view
            </Button>
            <Button to="/trip-planner" variant="secondary" leadingIcon="sparkles">
              Plan a trip
            </Button>
            <Button variant="secondary" leadingIcon="layers" onClick={() => setCompareOpen(true)} disabled={!compare.length}>
              Compare ({compare.length})
            </Button>
          </>
        }
      />

      <Tabs
        tabs={[
          { value: 'destinations', label: 'Destinations', icon: 'compass', count: destinations.length },
          { value: 'food', label: 'Food & Culture', icon: 'utensils', count: foodCultureDatabase.length },
        ]}
        value={tab}
        onChange={setTab}
        className="w-full sm:w-auto"
      />

      {tab === 'food' ? (
        <FoodCultureTab />
      ) : (
        <>
          {/* search bar */}
          <Card padding="md" className="sticky top-[calc(var(--nav-h)+0.5rem)] z-30 backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                icon="search"
                placeholder="Search destinations, states or experiences…"
                aria-label="Search destinations"
                className="flex-1"
                trailing={
                  query ? (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="rounded-full p-1 transition hover:bg-surface-muted"
                    >
                      <Icon name="close" size="sm" />
                    </button>
                  ) : null
                }
              />

              <div className="flex items-center gap-2">
                <Select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  icon="sort"
                  aria-label="Sort results"
                  className="w-full lg:w-56"
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>

                <div className="hidden items-center gap-1 rounded-xl border border-line bg-surface-muted p-1 sm:flex">
                  {[
                    { value: 'grid', icon: 'grid', label: 'Grid view' },
                    { value: 'list', icon: 'list', label: 'List view' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setView(option.value)}
                      aria-label={option.label}
                      aria-pressed={view === option.value}
                      className={cn(
                        'rounded-lg p-2 transition',
                        view === option.value ? 'bg-surface text-brand-600 shadow-xs' : 'text-fg-subtle hover:text-fg'
                      )}
                    >
                      <Icon name={option.icon} size="sm" />
                    </button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  leadingIcon="filter"
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden"
                >
                  Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
                </Button>
              </div>
            </div>

            {!query && recentSearches.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <span className="text-2xs font-bold uppercase tracking-wider text-fg-subtle">Recent searches</span>
                {recentSearches.slice(0, 5).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-fg-muted transition hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-200"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
            <aside className="hidden lg:block">
              <Card padding="md" className="sticky top-[calc(var(--nav-h)+7rem)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-fg">Filters</h2>
                  {activeFilterCount > 0 && (
                    <Badge tone="brand" size="sm">
                      {activeFilterCount} active
                    </Badge>
                  )}
                </div>
                {renderFilters('desktop')}
              </Card>
            </aside>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-fg-muted">
                  {loading ? 'Searching…' : `${results.length} ${results.length === 1 ? 'destination' : 'destinations'}`}
                  {debouncedQuery && !loading && (
                    <span className="text-fg-subtle"> for “{debouncedQuery}”</span>
                  )}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
                  >
                    <Icon name="close" size="xs" /> Clear filters
                  </button>
                )}
              </div>

              {loading ? (
                <div className={cn('grid gap-5', view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonCard key={index} media={view === 'grid'} />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <EmptyState
                  icon="search"
                  title="No destinations match those filters"
                  description="Widen your budget, pick another month, or clear a filter or two — we cover destinations on every continent."
                  action={{ label: 'Reset filters', onClick: resetFilters, icon: 'refresh' }}
                  secondaryAction={{ label: 'Ask the AI assistant', to: '/assistant', icon: 'bot' }}
                />
              ) : (
                <div className={cn('grid gap-5', view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
                  {results.map((destination) => (
                    <div key={destination.slug} className="group relative">
                      {view === 'grid' ? (
                        <DestinationCard destination={destination} />
                      ) : (
                        <DestinationCard destination={destination} layout="row" />
                      )}
                      <button
                        type="button"
                        onClick={() => toggleCompare(destination)}
                        aria-pressed={compare.includes(destination.slug)}
                        className={cn(
                          'absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs font-bold backdrop-blur transition-all duration-200',
                          compare.includes(destination.slug)
                            ? 'border-transparent bg-brand-600 text-white shadow-float'
                            : 'border-white/40 bg-slate-950/40 text-white opacity-0 hover:bg-slate-950/65 focus-visible:opacity-100 group-hover:opacity-100',
                          view === 'row' && 'hidden'
                        )}
                      >
                        <Icon name={compare.includes(destination.slug) ? 'check' : 'plus'} size="xs" />
                        Compare
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {recent.length > 0 && (
                <section className="border-t border-line pt-8">
                  <SectionHeader eyebrow="Recently viewed" icon="history" title="Jump back in" />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {recent.slice(0, 3).map((item) => {
                      const match = destinations.find((d) => `dest-${d.slug}` === item.id);
                      return match ? (
                        <DestinationCard key={item.id} destination={match} layout="row" />
                      ) : null;
                    })}
                  </div>
                </section>
              )}
            </div>
          </div>
        </>
      )}

      {/* mobile filter sheet */}
      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" icon="filter" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Show {results.length} results</Button>
          </>
        }
      >
        {renderFilters('mobile')}
      </Modal>

      <CompareModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        items={compareItems}
        onRemove={(slug) => setCompare((prev) => prev.filter((item) => item !== slug))}
      />

      {/* floating compare bar */}
      {compare.length > 0 && !compareOpen && (
        <div className="fixed inset-x-4 bottom-20 z-[80] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface-raised p-3 shadow-lift animate-fade-up sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
          <div className="flex -space-x-2">
            {compareItems.map((item) => (
              <DestinationImage
                key={item.slug}
                destination={item}
                width={160}
                compact
                rounded="rounded-full"
                className="h-9 w-9 border-2 border-surface"
              />
            ))}
          </div>
          <p className="flex-1 text-xs font-semibold text-fg">
            {compare.length} selected
            <span className="block text-2xs font-normal text-fg-subtle">Compare up to 3</span>
          </p>
          <Button size="sm" onClick={() => setCompareOpen(true)} leadingIcon="layers">
            Compare
          </Button>
          <button
            type="button"
            onClick={() => setCompare([])}
            aria-label="Clear comparison"
            className="rounded-full p-1.5 text-fg-subtle transition hover:bg-surface-muted"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ExplorePage;
