import { cn } from '../../lib/cn';
import Icon from './Icon';

const tones = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-500/12 dark:text-brand-200 dark:border-brand-400/20',
  accent: 'bg-accent-50 text-accent-700 border-accent-100 dark:bg-accent-500/12 dark:text-accent-200 dark:border-accent-400/20',
  neutral: 'bg-surface-muted text-fg-muted border-line',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/12 dark:text-emerald-300 dark:border-emerald-400/20',
  warning: 'bg-gold-50 text-gold-700 border-gold-200 dark:bg-gold-500/12 dark:text-gold-300 dark:border-gold-400/20',
  danger: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-400/20',
  violet: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/12 dark:text-violet-300 dark:border-violet-400/20',
  dark: 'bg-slate-900 text-white border-slate-800 dark:bg-white/10 dark:border-white/15',
};

const sizes = {
  sm: 'px-2 py-0.5 text-2xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({ tone = 'brand', size = 'md', icon, dot, uppercase = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        tones[tone] || tones.brand,
        sizes[size],
        uppercase && 'uppercase tracking-[0.14em]',
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {icon && <Icon name={icon} size="xs" />}
      {children}
    </span>
  );
}

export function Chip({ active, onClick, icon, children, className, count, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        active
          ? 'border-transparent bg-brand-gradient text-white shadow-float'
          : 'border-line bg-surface text-fg-muted hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm dark:hover:text-brand-200',
        className
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size="sm" />}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 text-2xs font-bold',
            active ? 'bg-white/20' : 'bg-surface-muted text-fg-subtle'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
