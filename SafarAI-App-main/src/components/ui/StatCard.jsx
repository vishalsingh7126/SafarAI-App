import { cn } from '../../lib/cn';
import Icon from './Icon';
import useCountUp from '../../hooks/useCountUp';

/**
 * StatCard — KPI tile used on the dashboard and hero surfaces.
 * Numeric values animate into view; strings render as-is.
 */
export default function StatCard({
  label,
  value,
  numericValue,
  prefix = '',
  suffix = '',
  delta,
  deltaLabel,
  icon,
  tone = 'brand',
  spark,
  className,
  onClick,
}) {
  const [ref, animated] = useCountUp(numericValue ?? 0);
  const positive = typeof delta === 'number' ? delta >= 0 : undefined;

  const tones = {
    brand: 'from-brand-500/12 to-accent-500/10 text-brand-600 dark:text-brand-300',
    emerald: 'from-emerald-500/12 to-teal-500/10 text-emerald-600 dark:text-emerald-300',
    gold: 'from-gold-500/14 to-orange-500/10 text-gold-600 dark:text-gold-300',
    violet: 'from-violet-500/12 to-fuchsia-500/10 text-violet-600 dark:text-violet-300',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      ref={ref}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border border-line bg-surface p-5 text-left shadow-card transition-all duration-300 ease-smooth',
        onClick && 'hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-80 blur-2xl transition-opacity duration-300 group-hover:opacity-100',
          tones[tone]
        )}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{label}</p>
          <p className="mt-2 text-[1.75rem] font-extrabold leading-none tracking-tight text-fg">
            {numericValue !== undefined ? `${prefix}${animated.toLocaleString('en-IN')}${suffix}` : value}
          </p>
          {(delta !== undefined || deltaLabel) && (
            <p
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-semibold',
                positive === undefined
                  ? 'text-fg-subtle'
                  : positive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {positive !== undefined && <Icon name={positive ? 'trendUp' : 'trendDown'} size="xs" />}
              {delta !== undefined && `${positive ? '+' : ''}${delta}%`}
              {deltaLabel && <span className="font-medium text-fg-subtle">{deltaLabel}</span>}
            </p>
          )}
        </div>
        {icon && (
          <span
            className={cn(
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
              tones[tone]
            )}
          >
            <Icon name={icon} size="md" />
          </span>
        )}
      </div>
      {spark}
    </Component>
  );
}
