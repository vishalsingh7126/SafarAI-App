import { useState } from 'react';
import { cn } from '../lib/cn';
import Icon from './ui/Icon';
import useWikiImage from '../hooks/useWikiImage';
import { localImageFor, localImageForDestination } from '../data/imageManifest';

const CONTINENT_GRADIENTS = {
  Asia: 'from-amber-500/25 to-rose-500/20',
  Europe: 'from-sky-500/25 to-indigo-500/20',
  Africa: 'from-emerald-500/25 to-lime-500/20',
  'North America': 'from-pink-500/25 to-violet-500/20',
  'South America': 'from-violet-500/25 to-fuchsia-500/20',
  Oceania: 'from-cyan-500/25 to-blue-500/20',
  'Middle East': 'from-orange-500/25 to-amber-500/20',
  'Central America': 'from-green-500/25 to-teal-500/20',
  Caribbean: 'from-teal-500/25 to-sky-500/20',
};

/**
 * DestinationImage — resolves photography for a destination.
 * Curated `image` URLs win; everything else lazy-loads a real photo from
 * Wikipedia and falls back to a themed gradient with the place's initials.
 */
export default function DestinationImage({
  destination,
  className,
  imgClassName,
  width = 800,
  eager = false,
  rounded = 'rounded-none',
  compact = false,
}) {
  // Resolution order: verified local copy → curated URL → runtime Wikipedia
  // lookup for this exact article → labelled placeholder.
  const cacheKey =
    destination?.imageKey ||
    (destination?.slug ? `dest-${destination.slug}` : destination?.id ? `hotel-${destination.id}` : null);
  const local = destination?.slug
    ? localImageForDestination(destination.slug) || (cacheKey ? localImageFor(cacheKey) : null)
    : cacheKey
    ? localImageFor(cacheKey)
    : null;

  const useWiki = !local && !destination?.image && Boolean(destination?.wiki);
  const { url, loading } = useWikiImage(destination?.wiki, { width, enabled: useWiki });
  const [failed, setFailed] = useState(false);

  const source = !failed ? local?.url || destination?.image || url : null;
  const unverifiable = !loading && !source && !destination?.wiki;
  const gradient = CONTINENT_GRADIENTS[destination?.continent] || 'from-brand-500/25 to-accent-500/20';

  return (
    <div className={cn('relative overflow-hidden bg-surface-muted', rounded, className)}>
      {source ? (
        <img
          src={source}
          alt={`${destination.name}, ${destination.country}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center bg-gradient-to-br',
            gradient,
            loading && 'animate-pulse'
          )}
          aria-hidden="true"
        >
          {loading ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
          ) : (
            <span className="flex w-full flex-col items-center gap-1 px-2 text-center text-fg-muted">
              <Icon name="mapPin" size={compact ? 16 : 20} />
              {!compact && (
                <>
                  <span className="w-full truncate text-2xs font-bold text-fg">{destination?.name}</span>
                  <span className="w-full truncate text-[9px] font-semibold uppercase tracking-wider text-fg-subtle">
                    {unverifiable ? 'Photo not verified' : destination?.country}
                  </span>
                </>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
