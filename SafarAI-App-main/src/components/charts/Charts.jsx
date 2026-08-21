import { useMemo, useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * Lightweight, dependency-free SVG charts.
 * They are responsive (viewBox based), theme-aware and keyboard/hover
 * interactive where it adds meaning.
 */

/* ------------------------------------------------------------------ spark */
export function Sparkline({ data = [], className, stroke = '#6366f1', fill = true, height = 44 }) {
  const path = useMemo(() => {
    if (data.length < 2) return { line: '', area: '' };
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = 100 / (data.length - 1);
    const points = data.map((value, index) => [index * step, 30 - ((value - min) / range) * 26 - 2]);
    const line = points
      .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(' ');
    const area = `${line} L100,32 L0,32 Z`;
    return { line, area };
  }, [data]);

  const gradientId = `spark-${stroke.replace('#', '')}`;

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={path.area} fill={`url(#${gradientId})`} />}
      <path d={path.line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ------------------------------------------------------------------ donut */
export function DonutChart({ data = [], size = 180, thickness = 22, centerLabel, centerValue, className }) {
  const [active, setActive] = useState(null);
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((item) => {
    const fraction = item.value / total;
    const segment = {
      ...item,
      fraction,
      dash: fraction * circumference,
      offset,
    };
    offset += fraction * circumference;
    return segment;
  });

  const activeItem = active !== null ? segments[active] : null;

  return (
    <div className={cn('flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(var(--c-surface-muted))"
            strokeWidth={thickness}
          />
          {segments.map((segment, index) => (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={active === index ? thickness + 5 : thickness}
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="butt"
              className="cursor-pointer transition-[stroke-width,opacity] duration-200"
              opacity={active === null || active === index ? 1 : 0.45}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">
            {activeItem ? activeItem.label : centerLabel}
          </span>
          <span className="mt-1 text-xl font-extrabold text-fg">
            {activeItem ? activeItem.display ?? activeItem.value : centerValue}
          </span>
          {activeItem && (
            <span className="text-2xs font-semibold text-fg-muted">
              {Math.round(activeItem.fraction * 100)}%
            </span>
          )}
        </div>
      </div>

      <ul className="w-full space-y-2">
        {segments.map((segment, index) => (
          <li key={segment.label}>
            <button
              type="button"
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-200',
                active === index ? 'bg-surface-muted' : 'hover:bg-surface-muted'
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: segment.color }} />
              <span className="flex-1 truncate text-sm font-medium text-fg-muted">{segment.label}</span>
              <span className="text-sm font-bold text-fg">{segment.display ?? segment.value}</span>
              <span className="w-10 text-right text-xs font-semibold text-fg-subtle">
                {Math.round(segment.fraction * 100)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------- bars */
export function BarChart({ data = [], height = 200, className, valueFormatter = (v) => v, tone = '#6366f1' }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, index) => {
          const pct = (item.value / max) * 100;
          return (
            <button
              key={`${item.label}-${index}`}
              type="button"
              className="group relative flex h-full flex-1 flex-col justify-end rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              aria-label={`${item.label}: ${valueFormatter(item.value)}`}
            >
              <span
                className={cn(
                  'pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-2xs font-bold text-white shadow-lift transition-opacity duration-150 dark:bg-slate-700',
                  active === index ? 'opacity-100' : 'opacity-0'
                )}
              >
                {valueFormatter(item.value)}
              </span>
              <span
                className="w-full rounded-t-lg transition-all duration-500 ease-smooth"
                style={{
                  height: `${Math.max(pct, 3)}%`,
                  background: item.color || tone,
                  opacity: active === null || active === index ? 1 : 0.5,
                }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((item, index) => (
          <span key={`${item.label}-${index}`} className="flex-1 truncate text-center text-2xs font-medium text-fg-subtle">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- radial */
export function RadialScore({ value = 0, size = 120, label, tone = '#4f46e5', className }) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(var(--c-surface-muted))" strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-[stroke-dasharray] duration-1000 ease-smooth"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-fg">{value}</span>
        {label && <span className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">{label}</span>}
      </div>
    </div>
  );
}
