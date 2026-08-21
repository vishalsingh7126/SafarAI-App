import { cn } from '../../lib/cn';
import Icon from './Icon';
import Button from './Button';

/**
 * EmptyState — never leave the user staring at a blank panel.
 * Always pairs an explanation with the next best action.
 */
export default function EmptyState({
  icon = 'compass',
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
  tone = 'default',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/60 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
        tone === 'danger' && 'border-rose-200 bg-rose-50/40 dark:border-rose-500/25 dark:bg-rose-500/5',
        className
      )}
    >
      <span
        className={cn(
          'relative mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl',
          tone === 'danger'
            ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
            : 'bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300'
        )}
      >
        <span
          className={cn(
            'absolute inset-0 rounded-2xl opacity-60',
            tone === 'danger' ? 'bg-rose-200/40' : 'bg-brand-200/40 dark:bg-brand-500/10'
          )}
          aria-hidden="true"
        />
        <Icon name={icon} size={28} className="relative" />
      </span>
      <h2 className="text-base font-bold text-fg sm:text-lg">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-fg-muted">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Button size="sm" leadingIcon={action.icon} onClick={action.onClick} to={action.to}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size="sm"
              variant="secondary"
              leadingIcon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
              to={secondaryAction.to}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
