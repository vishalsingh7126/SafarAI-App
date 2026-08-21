import { cn } from '../../lib/cn';
import Icon from './Icon';
import useReveal from '../../hooks/useReveal';

/** Reveal — wraps children in a scroll-triggered fade/slide. */
export function Reveal({ children, delay = 0, className, as: Component = 'div', ...rest }) {
  const [ref, visible] = useReveal();
  return (
    <Component
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Component>
  );
}

/** SectionHeader — consistent eyebrow → title → description rhythm. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  icon,
  className,
  as: Heading = 'h2',
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
        {eyebrow && (
          <p
            className={cn(
              'mb-2.5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1 text-2xs font-bold uppercase tracking-[0.2em] text-brand-700',
              'dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-200'
            )}
          >
            {icon && <Icon name={icon} size="xs" />}
            {eyebrow}
          </p>
        )}
        <Heading className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">{title}</Heading>
        {description && (
          <p className="mt-2.5 text-sm leading-6 text-fg-muted sm:text-base">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/** PageHeader — the top block of every inner page. */
export function PageHeader({ eyebrow, title, description, actions, icon, stats, className, children }) {
  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl dark:bg-brand-500/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-accent-300/20 blur-3xl dark:bg-accent-500/10"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/80 px-3 py-1 text-2xs font-bold uppercase tracking-[0.2em] text-brand-700 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-200">
              {icon && <Icon name={icon} size="xs" />}
              {eyebrow}
            </p>
          )}
          <h1 className="text-[clamp(1.7rem,1.2rem+2vw,2.5rem)] font-extrabold leading-tight tracking-tight text-fg">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm leading-7 text-fg-muted sm:text-base">{description}</p>
          )}
          {children}
        </div>

        {(actions || stats) && (
          <div className="flex w-full flex-col gap-4 lg:w-auto lg:items-end">
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            {stats && (
              <dl className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:w-auto">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-line bg-surface-muted px-4 py-3 text-left"
                  >
                    <dt className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">
                      {stat.label}
                    </dt>
                    <dd className="mt-1 text-lg font-extrabold text-fg">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default SectionHeader;
