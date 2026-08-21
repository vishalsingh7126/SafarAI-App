import { useId, useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * Tooltip — hover/focus label. Pure CSS positioning, no portal needed
 * because tooltips are always short and adjacent to their trigger.
 */
export default function Tooltip({ label, children, side = 'top', className }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const positions = {
    top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
    left: 'right-full top-1/2 mr-2 -translate-y-1/2',
    right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  };

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-2xs font-semibold text-white shadow-lift transition-all duration-150 dark:bg-slate-700',
          positions[side],
          open ? 'opacity-100 translate-y-0' : 'invisible opacity-0'
        )}
      >
        {label}
      </span>
    </span>
  );
}
