import { cn } from '../../lib/cn';
import Icon from './Icon';

/** Star rating display (and optional input). */
export default function Rating({ value = 0, max = 5, size = 'sm', showValue = false, count, onChange, className }) {
  const px = size === 'lg' ? 20 : size === 'md' ? 16 : 14;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex items-center gap-0.5" role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of ${max} stars`}>
        {Array.from({ length: max }).map((_, index) => {
          const filled = index < Math.round(value);
          const Star = (
            <Icon
              name="star"
              size={px}
              filled={filled}
              strokeWidth={filled ? 0 : 1.5}
              className={filled ? 'text-gold-400' : 'text-slate-300 dark:text-slate-600'}
            />
          );
          return onChange ? (
            <button
              key={index}
              type="button"
              onClick={() => onChange(index + 1)}
              className="rounded transition-transform duration-150 hover:scale-110"
              aria-label={`Rate ${index + 1} star${index ? 's' : ''}`}
            >
              {Star}
            </button>
          ) : (
            <span key={index}>{Star}</span>
          );
        })}
      </span>
      {showValue && <span className="text-xs font-bold text-fg">{Number(value).toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-fg-subtle">({count})</span>}
    </div>
  );
}

export function Avatar({ name = '', src, size = 'md', className, tone = 'brand' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const sizes = {
    xs: 'h-7 w-7 text-2xs',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  };

  const tones = {
    brand: 'bg-brand-gradient text-white',
    muted: 'bg-surface-muted text-fg-muted',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cn('rounded-full object-cover ring-2 ring-surface', sizes[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold shadow-sm ring-2 ring-surface',
        sizes[size],
        tones[tone],
        className
      )}
      aria-hidden="true"
    >
      {initials || '?'}
    </span>
  );
}
