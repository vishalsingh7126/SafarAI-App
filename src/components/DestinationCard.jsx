import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/cn';
import Icon from './ui/Icon';
import Rating from './ui/Rating';
import useTilt from '../hooks/useTilt';
import DestinationImage from './DestinationImage';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';

/**
 * DestinationCard — the primary discovery unit.
 * Used by the home explorer, the Explore page and recommendation rails.
 */
export default function DestinationCard({ destination, layout = 'grid', tilt = true, className, priority = false }) {
  const { isFavourite, toggleFavourite, trackView } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();
  const { ref, onPointerMove, onPointerLeave } = useTilt({ max: 5, scale: 1.01 });

  const href = `/destination/${destination.slug}`;
  const saved = isFavourite(`dest-${destination.slug}`);

  const onSave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const added = toggleFavourite({
      id: `dest-${destination.slug}`,
      type: 'destination',
      title: destination.name,
      subtitle: destination.tagline,
      image: destination.image || null,
      href,
    });
    toast[added ? 'success' : 'info'](added ? `${destination.name} saved` : `${destination.name} removed`, {
      description: added ? 'Find it in your dashboard under Saved.' : undefined,
      action: added ? { label: 'View saved', onClick: () => navigate('/profile?tab=saved') } : undefined,
    });
  };

  if (layout === 'row') {
    return (
      <Link
        to={href}
        onClick={() => trackView({ id: `dest-${destination.slug}`, type: 'destination', title: destination.name, href })}
        className={cn(
          'group flex gap-4 rounded-2xl border border-line bg-surface p-3 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift',
          className
        )}
      >
        <DestinationImage
          destination={destination}
          width={320}
          compact
          rounded="rounded-xl"
          className="h-24 w-28 shrink-0"
          imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-fg">{destination.name}</h3>
              <p className="truncate text-xs text-fg-muted">{destination.tagline}</p>
            </div>
            <button
              type="button"
              onClick={onSave}
              aria-label={saved ? 'Remove from saved' : 'Save destination'}
              className="rounded-full p-1.5 text-fg-subtle transition hover:bg-surface-muted"
            >
              <Icon name="heart" size="sm" filled={saved} className={saved ? 'text-rose-500' : undefined} />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs font-semibold text-fg-subtle">
            <Rating value={destination.rating} showValue />
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" size="xs" /> {destination.bestTime}
            </span>
            <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-300">
              <Icon name="wallet" size="xs" /> {destination.budget}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article
      ref={tilt ? ref : undefined}
      onPointerMove={tilt ? onPointerMove : undefined}
      onPointerLeave={tilt ? onPointerLeave : undefined}
      className={cn(
        'tilt group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow duration-300 hover:shadow-lift',
        className
      )}
    >
      <Link
        to={href}
        onClick={() => trackView({ id: `dest-${destination.slug}`, type: 'destination', title: destination.name, href })}
        className="relative block h-52 overflow-hidden"
        aria-label={`Explore ${destination.name}`}
      >
        <DestinationImage
          destination={destination}
          width={800}
          eager={priority}
          className="h-full w-full"
          imgClassName="transition-transform duration-[900ms] ease-smooth group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-2xs font-bold text-brand-800 shadow-sm backdrop-blur">
            <Icon name="wallet" size="xs" />
            {destination.budget}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/55 px-2.5 py-1 text-2xs font-bold text-white backdrop-blur">
            <Icon name="star" size="xs" filled className="text-gold-400" />
            {destination.rating}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-white">{destination.name}</p>
              <p className="truncate text-xs font-medium text-white/80">
                {destination.state || destination.country} · {destination.continent}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-2xs font-bold text-white backdrop-blur">
              {destination.bestTime}
            </span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={onSave}
        aria-label={saved ? `Remove ${destination.name} from saved` : `Save ${destination.name}`}
        aria-pressed={saved}
        className={cn(
          'absolute right-3 top-12 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-all duration-200',
          saved
            ? 'border-rose-300 bg-rose-500 text-white shadow-float'
            : 'border-white/40 bg-slate-950/35 text-white opacity-0 hover:bg-slate-950/60 focus-visible:opacity-100 group-hover:opacity-100'
        )}
      >
        <Icon name="heart" size="sm" filled={saved} />
      </button>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-6 text-fg-muted">{destination.tagline}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {destination.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line bg-surface-muted px-2 py-0.5 text-2xs font-semibold text-fg-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-surface-muted p-3 text-center">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">Days</dt>
            <dd className="mt-0.5 text-xs font-bold text-fg">{destination.duration}</dd>
          </div>
          <div className="border-x border-line">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">Per day</dt>
            <dd className="mt-0.5 text-xs font-bold text-fg">₹{destination.dailyCost.toLocaleString('en-IN')}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">Safety</dt>
            <dd className="mt-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {destination.safetyScore}/100
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex gap-2">
          <Link
            to={href}
            onClick={() => trackView({ id: `dest-${destination.slug}`, type: 'destination', title: destination.name, href })}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-float transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
          >
            Explore
            <Icon name="arrowRight" size="sm" className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            to={`/trip-planner?destination=${encodeURIComponent(destination.name)}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-fg-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-200"
            aria-label={`Plan a trip to ${destination.name}`}
          >
            <Icon name="sparkles" size="sm" />
            Plan
          </Link>
        </div>
      </div>
    </article>
  );
}
