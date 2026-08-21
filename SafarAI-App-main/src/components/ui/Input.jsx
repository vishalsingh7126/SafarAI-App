import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';
import Icon from './Icon';

/* --------------------------------------------------------------- shared bits */

const controlBase =
  'w-full rounded-xl border bg-surface text-fg placeholder:text-fg-subtle shadow-xs outline-none ' +
  'transition-[border-color,box-shadow,background-color] duration-200 ' +
  'focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-subtle';

const sizes = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-11 px-3.5 text-sm',
  lg: 'h-12 px-4 text-[15px]',
};

export function Field({ label, hint, error, success, required, htmlFor, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-fg-muted"
        >
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
          <Icon name="alert" size="xs" />
          {error}
        </p>
      ) : success ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <Icon name="checkCircle" size="xs" />
          {success}
        </p>
      ) : hint ? (
        <p className="text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------- inputs */

export const Input = forwardRef(function Input(
  { className, size = 'md', icon, trailing, invalid, ...rest },
  ref
) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">
          <Icon name={icon} size="sm" />
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          controlBase,
          sizes[size],
          icon && 'pl-10',
          trailing && 'pr-10',
          invalid && 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/15',
          className
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      {trailing && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-subtle">{trailing}</span>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 4, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        controlBase,
        'px-3.5 py-3 text-sm leading-6',
        invalid && 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/15',
        className
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export const Select = forwardRef(function Select(
  { className, size = 'md', children, icon, invalid, ...rest },
  ref
) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">
          <Icon name={icon} size="sm" />
        </span>
      )}
      <select
        ref={ref}
        className={cn(
          controlBase,
          sizes[size],
          'cursor-pointer appearance-none pr-10',
          icon && 'pl-10',
          invalid && 'border-rose-400',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="chevronDown"
        size="sm"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle"
      />
    </div>
  );
});

/* ------------------------------------------------------------------ toggles */

export function Switch({ checked, onChange, label, description, id: idProp, disabled }) {
  const generatedId = useId();
  const id = idProp || generatedId;

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'group flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        checked
          ? 'border-brand-300 bg-brand-50 text-brand-800 shadow-xs dark:border-brand-400/30 dark:bg-brand-500/12 dark:text-brand-100'
          : 'border-line bg-surface text-fg-muted hover:border-brand-200 hover:shadow-sm',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-fg-subtle">{description}</span>}
      </span>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-spring',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </span>
    </button>
  );
}

export function Checkbox({ id, checked, onChange, label, count }) {
  return (
    <label
      htmlFor={id}
      className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-fg-muted transition hover:text-fg"
    >
      <span className="relative flex h-[18px] w-[18px] items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <span
          className={cn(
            'flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border transition-all duration-150',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas',
            checked
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-line-strong bg-surface group-hover:border-brand-400'
          )}
        >
          {checked && <Icon name="check" size={12} strokeWidth={3} />}
        </span>
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-fg-subtle">{count}</span>}
    </label>
  );
}

export function RangeSlider({ value, min = 0, max = 100, step = 1, onChange, format = (v) => v, label, id }) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {label}
          </label>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
            {format(value)}
          </span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
        className="range-brand"
        style={{
          background: `linear-gradient(90deg, #4f46e5 ${percent}%, rgb(var(--c-line)) ${percent}%)`,
        }}
      />
      <div className="flex justify-between text-2xs text-fg-subtle">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

export default Input;
