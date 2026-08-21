import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/cn';
import Icon from './ui/Icon';
import { allNavItems } from '../config/navigation';
import { destinations } from '../data/destinations';
import { hotelsDatabase } from '../data/hotelsDatabase';
import { foodCultureDatabase } from '../data/foodCultureDatabase';
import { useWorkspace } from '../context/WorkspaceContext';

/**
 * CommandPalette — the product's smart search layer (⌘K / Ctrl+K).
 *
 * Searches destinations, stays, food spots, saved trips and every page,
 * keeps a history of recent searches, and always offers an
 * "Ask the AI assistant" escape hatch for natural-language questions.
 */

const GROUP_ORDER = ['Suggestions', 'Destinations', 'Stays', 'Food & Culture', 'My Trips', 'Pages', 'AI'];

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { recentSearches, trackSearch, recent, trips, favourites } = useWorkspace();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 30);
      const { overflow } = document.body.style;
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = overflow;
      };
    }
    return undefined;
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const items = [];

    if (!needle) {
      destinations.slice(0, 4).forEach((destination) =>
        items.push({
          id: `d-${destination.slug}`,
          group: 'Suggestions',
          title: destination.name,
          subtitle: destination.tagline,
          icon: 'mapPin',
          to: `/destination/${destination.slug}`,
        })
      );
      recent.slice(0, 3).forEach((item) =>
        items.push({
          id: `r-${item.id}`,
          group: 'Suggestions',
          title: item.title,
          subtitle: 'Recently viewed',
          icon: 'history',
          to: item.href,
        })
      );
      allNavItems.slice(0, 6).forEach((item) =>
        items.push({
          id: `n-${item.to}`,
          group: 'Pages',
          title: item.label,
          subtitle: item.description || item.group,
          icon: item.icon,
          to: item.to,
        })
      );
      return items;
    }

    destinations
      .filter((destination) =>
        [destination.name, destination.country, destination.continent, destination.region, ...destination.tags]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 6)
      .forEach((destination) =>
        items.push({
          id: `d-${destination.slug}`,
          group: 'Destinations',
          title: destination.name,
          subtitle: `${destination.country} · ${destination.bestTime} · ${destination.budget}`,
          icon: 'mapPin',
          to: `/destination/${destination.slug}`,
        })
      );

    hotelsDatabase
      .filter((hotel) => `${hotel.name} ${hotel.city} ${hotel.tier}`.toLowerCase().includes(needle))
      .slice(0, 4)
      .forEach((hotel) =>
        items.push({
          id: `h-${hotel.id}`,
          group: 'Stays',
          title: hotel.name,
          subtitle: `${hotel.city} · ₹${hotel.pricePerNight.toLocaleString('en-IN')} / night`,
          icon: 'hotel',
          to: `/hotels?city=${encodeURIComponent(hotel.city)}`,
        })
      );

    foodCultureDatabase
      .filter((item) => `${item.dish} ${item.city} ${item.place}`.toLowerCase().includes(needle))
      .slice(0, 4)
      .forEach((item) =>
        items.push({
          id: `f-${item.id}`,
          group: 'Food & Culture',
          title: item.dish,
          subtitle: `${item.place} · ${item.city}`,
          icon: 'utensils',
          to: `/food-culture?q=${encodeURIComponent(item.city)}`,
        })
      );

    trips
      .filter((trip) => String(trip.destination || '').toLowerCase().includes(needle))
      .slice(0, 3)
      .forEach((trip) =>
        items.push({
          id: `t-${trip.id}`,
          group: 'My Trips',
          title: `${trip.destination} · ${trip.days} days`,
          subtitle: 'Saved itinerary',
          icon: 'luggage',
          to: '/my-trips',
        })
      );

    allNavItems
      .filter((item) => `${item.label} ${item.description || ''}`.toLowerCase().includes(needle))
      .slice(0, 5)
      .forEach((item) =>
        items.push({
          id: `n-${item.to}`,
          group: 'Pages',
          title: item.label,
          subtitle: item.description || item.group,
          icon: item.icon,
          to: item.to,
        })
      );

    items.push({
      id: 'ai',
      group: 'AI',
      title: `Ask SafarAI: “${query.trim()}”`,
      subtitle: 'Get a natural-language answer from the travel assistant',
      icon: 'sparkles',
      to: `/assistant?q=${encodeURIComponent(query.trim())}`,
    });

    return items;
  }, [query, recent, trips]);

  const grouped = useMemo(() => {
    const map = new Map();
    results.forEach((item) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group).push(item);
    });
    return [...map.entries()].sort(
      (a, b) => GROUP_ORDER.indexOf(a[0]) - GROUP_ORDER.indexOf(b[0])
    );
  }, [results]);

  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  const select = useCallback(
    (item) => {
      if (!item) return;
      if (query.trim()) trackSearch(query.trim());
      onClose?.();
      navigate(item.to);
    },
    [navigate, onClose, query, trackSearch]
  );

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(flat.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flat.length) % Math.max(flat.length, 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(flat[activeIndex]);
    } else if (event.key === 'Escape') {
      onClose?.();
    }
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const node = listRef.current?.querySelector('[data-active="true"]');
    if (typeof node?.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open || typeof document === 'undefined') return null;

  let runningIndex = -1;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-start justify-center p-4 pt-[12vh] sm:pt-[14vh]">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search SafarAI"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-lift animate-scale-in"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" size="md" className="text-fg-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search destinations, stays, food, trips or ask the AI…"
            className="h-14 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
            aria-label="Search"
            autoComplete="off"
          />
          <kbd className="hidden rounded-md border border-line bg-surface-muted px-1.5 py-0.5 text-2xs font-semibold text-fg-subtle sm:block">
            ESC
          </kbd>
        </div>

        {!query && recentSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-fg-subtle">Recent</span>
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

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Icon name="search" size={28} className="mx-auto text-fg-subtle" />
              <p className="mt-3 text-sm font-semibold text-fg">No matches for “{query}”</p>
              <p className="mt-1 text-xs text-fg-muted">Try a city, a dish, or ask the assistant instead.</p>
            </div>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-fg-subtle">{group}</p>
                {items.map((item) => {
                  runningIndex += 1;
                  const index = runningIndex;
                  const active = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-active={active}
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() => select(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-100',
                        active ? 'bg-brand-50 dark:bg-brand-500/12' : 'hover:bg-surface-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          active
                            ? 'bg-brand-gradient text-white'
                            : 'bg-surface-muted text-fg-muted'
                        )}
                      >
                        <Icon name={item.icon} size="sm" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-fg">{item.title}</span>
                        {item.subtitle && (
                          <span className="block truncate text-xs text-fg-muted">{item.subtitle}</span>
                        )}
                      </span>
                      {active && <Icon name="arrowRight" size="sm" className="text-brand-500" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-muted px-4 py-2.5 text-2xs text-fg-subtle">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-semibold">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-semibold">↵</kbd> open
            </span>
          </span>
          <span className="hidden sm:block">
            {favourites.length} saved · {trips.length} trips
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
