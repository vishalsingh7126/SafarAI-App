import { cn } from '../lib/cn';

/**
 * BrandLogo — official logo mark with the shared SafarAI wordmark lockup.
 * `compact` renders just the mark (used in the mobile drawer / footer).
 */
function BrandLogo({ compact = false, className, inverted = false }) {
  return (
    <span className={cn('group inline-flex items-center gap-2.5', className)}>
      <img
        src="/SafarAI%20main%20LOGO.png"
        alt="SafarAI - Travel Smart, Travel Safe"
        className="h-10 w-10 rounded-xl object-contain shadow-float transition-transform duration-500 ease-spring group-hover:scale-105"
      />
      {!compact && (
        <span className="leading-tight">
          <span
            className={cn(
              'brand-title block text-[1.05rem] font-bold',
              inverted ? 'text-white' : 'text-fg'
            )}
          >
            SAFARAI
          </span>
          <span
            className={cn(
              'brand-tagline block text-[10px] font-semibold',
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
