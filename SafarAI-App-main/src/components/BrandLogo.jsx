import { cn } from '../lib/cn';

/**
 * BrandLogo — animated compass mark + wordmark.
 * `compact` renders just the mark (used in the mobile drawer / footer).
 */
function BrandLogo({ compact = false, className, inverted = false }) {
  return (
    <span className={cn('group inline-flex items-center gap-2.5', className)}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-float">
        <span
          className="absolute inset-0 rounded-xl bg-brand-gradient opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-70"
          aria-hidden="true"
        />
        <svg viewBox="0 0 24 24" className="relative h-6 w-6" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="white" strokeOpacity="0.85" strokeWidth="1.6" />
          <path
            d="m15.4 8.6-2.1 4.7-4.7 2.1 2.1-4.7 4.7-2.1Z"
            fill="white"
            className="origin-center transition-transform duration-500 ease-spring group-hover:rotate-[135deg]"
          />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span
            className={cn(
              'brand-title block text-[1.05rem] font-extrabold',
              inverted ? 'text-white' : 'text-fg'
            )}
          >
            SAFARAI
          </span>
          <span
            className={cn(
              'block text-[10px] font-semibold tracking-[0.14em]',
              inverted ? 'text-white/70' : 'text-fg-subtle'
            )}
          >
            TRAVEL SMART · TRAVEL SAFE
          </span>
        </span>
      )}
    </span>
  );
}

export default BrandLogo;
