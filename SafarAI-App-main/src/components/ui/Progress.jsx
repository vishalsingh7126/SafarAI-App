import { cn } from '../../lib/cn';

/** Linear progress bar with an accessible role + animated fill. */
export function Progress({ value = 0, max = 100, tone = 'brand', size = 'md', label, showValue, className }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));

  const tones = {
    brand: 'bg-brand-gradient',
    success: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    warning: 'bg-gradient-to-r from-gold-400 to-orange-500',
    danger: 'bg-gradient-to-r from-rose-400 to-rose-600',
    violet: 'bg-gradient-to-r from-violet-500 to-purple-600',
  };

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && <span className="font-semibold text-fg-muted">{label}</span>}
          {showValue && <span className="font-bold text-fg">{Math.round(percent)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={typeof label === 'string' ? label : 'Progress'}
        className={cn('w-full overflow-hidden rounded-full bg-surface-muted', heights[size])}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-smooth', tones[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** Multi-step indicator used by the itinerary + budget flows. */
export function Steps({ steps, current = 0, className }) {
  return (
    <ol className={cn('flex w-full items-center gap-2', className)}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                done && 'bg-emerald-500 text-white',
                active && 'bg-brand-gradient text-white shadow-float ring-4 ring-brand-500/15',
                !done && !active && 'border border-line bg-surface text-fg-subtle'
              )}
            >
              {done ? '✓' : index + 1}
            </span>
            <span
              className={cn(
                'hidden truncate text-xs font-semibold sm:block',
                active ? 'text-fg' : 'text-fg-subtle'
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <span
                className={cn(
                  'h-px flex-1 transition-colors duration-300',
                  done ? 'bg-emerald-400' : 'bg-line'
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default Progress;
