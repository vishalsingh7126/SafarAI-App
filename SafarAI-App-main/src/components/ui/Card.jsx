import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * Card — the base surface. `interactive` adds hover elevation,
 * `glass` is reserved for overlays on imagery.
 */
const tones = {
  default: 'bg-surface border-line',
  muted: 'bg-surface-muted border-line',
  glass: 'glass border-white/20',
  gradient:
    'border-brand-100/70 bg-gradient-to-br from-brand-50 via-surface to-accent-50 dark:border-brand-500/20 dark:from-brand-500/10 dark:via-surface dark:to-accent-500/10',
  outline: 'border-dashed border-line bg-transparent',
};

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const Card = forwardRef(function Card(
  { as: Component = 'div', tone = 'default', padding = 'md', interactive = false, halo = false, className, children, ...rest },
  ref
) {
  return (
    <Component
      ref={ref}
      className={cn(
        'relative rounded-2xl border shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-smooth',
        tones[tone] || tones.default,
        paddings[padding],
        interactive && 'hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift dark:hover:border-brand-500/30',
        halo && 'halo',
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});

export function CardHeader({ title, subtitle, icon, action, className }) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-float">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-fg">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default Card;
