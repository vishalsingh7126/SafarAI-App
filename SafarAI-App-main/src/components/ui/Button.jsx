import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import Icon from './Icon';

/**
 * Button — the single source of truth for actions across SafarAI.
 * Variants map to intent, never to decoration.
 */
const base =
  'relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold ' +
  'transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-smooth ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-55 active:translate-y-px';

const variants = {
  primary:
    'bg-brand-gradient bg-[length:180%_180%] text-white shadow-float hover:-translate-y-0.5 hover:shadow-glow hover:bg-[position:100%_50%]',
  secondary:
    'border border-line bg-surface text-fg shadow-sm hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-card dark:hover:text-brand-200',
  soft:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/12 dark:text-brand-200 dark:hover:bg-brand-500/20',
  ghost:
    'text-fg-muted hover:bg-surface-muted hover:text-fg',
  outline:
    'border border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-400/40 dark:text-brand-200 dark:hover:bg-brand-500/10',
  danger:
    'bg-rose-500 text-white shadow-sm hover:-translate-y-0.5 hover:bg-rose-600',
  dangerSoft:
    'border border-rose-200 bg-surface text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10',
  success:
    'bg-emerald-500 text-white shadow-sm hover:-translate-y-0.5 hover:bg-emerald-600',
  glass:
    'border border-white/25 bg-white/15 text-white backdrop-blur-md hover:bg-white/25',
};

const sizes = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
  xl: 'h-14 px-8 text-base',
};

const iconSizes = { xs: 'h-8 w-8', sm: 'h-9 w-9', md: 'h-11 w-11', lg: 'h-12 w-12', xl: 'h-14 w-14' };

const Button = forwardRef(function Button(
  {
    as,
    to,
    href,
    variant = 'primary',
    size = 'md',
    className,
    children,
    leadingIcon,
    trailingIcon,
    loading = false,
    iconOnly = false,
    fullWidth = false,
    type = 'button',
    ...rest
  },
  ref
) {
  const classes = cn(
    base,
    variants[variant] || variants.primary,
    iconOnly ? cn(iconSizes[size], 'px-0') : sizes[size],
    fullWidth && 'w-full',
    className
  );

  const content = (
    <>
      {loading ? (
        <Icon name="refresh" size="sm" className="animate-spin" />
      ) : (
        leadingIcon && <Icon name={leadingIcon} size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} />
      )}
      {!iconOnly && children}
      {trailingIcon && !loading && (
        <Icon
          name={trailingIcon}
          size={size === 'xs' || size === 'sm' ? 'sm' : 'md'}
          className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={cn('group/btn', classes)} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={cn('group/btn', classes)} {...rest}>
        {content}
      </a>
    );
  }

  const Component = as || 'button';

  return (
    <Component
      ref={ref}
      type={Component === 'button' ? type : undefined}
      className={cn('group/btn', classes)}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </Component>
  );
});

export default Button;
