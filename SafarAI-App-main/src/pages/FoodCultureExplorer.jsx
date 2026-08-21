import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useSyncedSearchParams from '../hooks/useSyncedSearchParams';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge, { Chip } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Input } from '../components/ui/Input';
import { foodCultureDatabase } from '../data/foodCultureDatabase';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useAssistant } from '../context/AssistantContext';

function FoodCultureExplorer() {
  usePageMeta(
    'Food & Culture Explorer | SafarAI',
    'Explore local dishes, restaurants, and cultural experiences across destinations with SafarAI.'
  );

  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const debounced = useDebouncedValue(query, 220);
  const [loading, setLoading] = useState(false);
  const { toggleFavourite, isFavourite, trackSearch } = useWorkspace();
  const toast = useToast();
  const { send, openDock } = useAssistant();

  const cities = useMemo(() => [...new Set(foodCultureDatabase.map((item) => item.city))].sort(), []);

  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 220);
    return () => clearTimeout(id);
  }, [debounced]);

  useSyncedSearchParams({ q: debounced });

  useEffect(() => {
    if (debounced.trim().length > 2) trackSearch(debounced.trim());
  }, [debounced, trackSearch]);

  const results = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    if (!needle) return foodCultureDatabase;
    return foodCultureDatabase.filter((item) =>
      `${item.city} ${item.dish} ${item.place} ${item.description}`.toLowerCase().includes(needle)
    );
  }, [debounced]);

  const savedCount = results.filter((item) => isFavourite(`food-${item.id}`)).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Food & culture"
        icon="utensils"
        title="Eat where the locals actually eat"
        description="Signature dishes matched to the exact place that does them best — save them straight to your trip list."
        stats={[
          { label: 'Dishes', value: foodCultureDatabase.length },
          { label: 'Cities', value: cities.length },
          { label: 'Saved here', value: savedCount },
        ]}
        actions={
          <Button
            variant="secondary"
            leadingIcon="bot"
            onClick={() => {
              openDock();
              send(`Build a one-day food crawl in ${debounced.trim() || cities[0]} with timings and rough costs.`);
            }}
          >
            Plan a food crawl
          </Button>
        }
      />

      <Card padding="lg">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            icon="search"
            placeholder="Search a city, dish or restaurant…"
            aria-label="Search food and culture"
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
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Chip active={!query} onClick={() => setQuery('')} count={foodCultureDatabase.length}>
            All cities
          </Chip>
          {cities.map((city) => (
            <Chip
              key={city}
              active={query.toLowerCase() === city.toLowerCase()}
              onClick={() => setQuery(city)}
              count={foodCultureDatabase.filter((item) => item.city === city).length}
            >
              {city}
            </Chip>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-fg-muted">
          {loading
            ? 'Searching…'
            : `${results.length} food & culture ${results.length === 1 ? 'spot' : 'spots'}`}
          {debounced && !loading && <span className="text-fg-subtle"> for “{debounced}”</span>}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} media={false} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon="utensils"
          title={`Nothing matches “${debounced}” yet`}
          description="Our food index covers Goa, Delhi, Jaipur, Mumbai and Kerala. Ask the assistant for anywhere else in India."
          action={{ label: 'Clear search', onClick: () => setQuery(''), icon: 'refresh' }}
          secondaryAction={{
            label: 'Ask the AI assistant',
            onClick: () => {
              openDock();
              send(`What should I eat in ${debounced.trim()}? Give five dishes and where to find them.`);
            },
            icon: 'bot',
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => {
            const saved = isFavourite(`food-${item.id}`);
            return (
              <Card key={item.id} padding="lg" interactive className="flex flex-col">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300">
                      <Icon name="utensils" size="md" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-fg">{item.dish}</h3>
                      <p className="truncate text-xs text-fg-subtle">{item.place}</p>
                    </div>
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
                      toast[added ? 'success' : 'info'](added ? 'Added to your trip list' : 'Removed from trip list');
                    }}
                  >
                    {saved ? 'Added to trip' : 'Add to trip'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FoodCultureExplorer;
