import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/ui/Icon';
import { cn } from '../lib/cn';

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    icon: 'checkCircle',
    ring: 'ring-emerald-500/25',
    accent: 'bg-emerald-500',
    tone: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: 'alert',
    ring: 'ring-rose-500/25',
    accent: 'bg-rose-500',
    tone: 'text-rose-600 dark:text-rose-400',
  },
  info: {
    icon: 'info',
    ring: 'ring-brand-500/25',
    accent: 'bg-brand-500',
    tone: 'text-brand-600 dark:text-brand-300',
  },
  apple: {
    icon: 'info',
    ring: 'ring-indigo-400/30',
    accent: 'bg-indigo-400',
    tone: 'text-indigo-200',
  },
  loading: {
    icon: 'refresh',
    ring: 'ring-brand-500/25',
    accent: 'bg-brand-400',
    tone: 'text-brand-600 dark:text-brand-300',
  },
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [exiting, setExiting] = useState(() => new Set());
  const timers = useRef(new Map());
  const exitTimers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    if (exitTimers.current.has(id)) return;

    setExiting((prev) => new Set(prev).add(id));
    exitTimers.current.set(
      id,
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        setExiting((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        exitTimers.current.delete(id);
      }, 180)
    );
  }, []);

  const push = useCallback(
    ({ title, description, variant = 'info', duration = 4200, action } = {}) => {
      idCounter += 1;
      const id = idCounter;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant, action }]);
      if (duration !== Infinity) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const map = timers.current;
    const exitMap = exitTimers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      exitMap.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const api = useMemo(
    () => ({
      toast: push,
      success: (title, options = {}) => push({ title, variant: 'success', ...options }),
      error: (title, options = {}) => push({ title, variant: 'error', ...options }),
      info: (title, options = {}) => push({ title, variant: 'info', ...options }),
      loading: (title, options = {}) => push({ title, variant: 'loading', duration: Infinity, ...options }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 px-4 pb-4 sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:items-end sm:pb-0"
            role="region"
            aria-label="Notifications"
          >
            {toasts.map((toast) => {
              const variant = VARIANTS[toast.variant] || VARIANTS.info;
              return (
                <div
                  key={toast.id}
                  role="status"
                  aria-live="polite"
                  className={cn(
                    'pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-line bg-surface-raised p-3.5 shadow-lift ring-1 animate-slide-down',
                    variant.ring,
                    exiting.has(toast.id) && 'animate-toast-out',
                    toast.variant === 'apple' &&
                      'border-indigo-300/20 bg-slate-950/90 text-white shadow-[0_18px_50px_rgb(2_6_23_/_0.4),0_0_24px_rgb(99_102_241_/_0.12)] backdrop-blur-xl'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 rounded-lg bg-surface-muted p-1.5',
                      variant.tone,
                      toast.variant === 'apple' && 'bg-indigo-400/15 text-indigo-200'
                    )}
                  >
                    <Icon
                      name={variant.icon}
                      size="sm"
                      className={toast.variant === 'loading' ? 'animate-spin' : undefined}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-semibold text-fg', toast.variant === 'apple' && 'text-white')}>
                      {toast.title}
                    </p>
                    {toast.description && (
                      <p className={cn('mt-0.5 text-xs leading-5 text-fg-muted', toast.variant === 'apple' && 'text-slate-300')}>
                        {toast.description}
                      </p>
                    )}
                    {toast.action && (
                      <button
                        type="button"
                        onClick={() => {
                          toast.action.onClick?.();
                          dismiss(toast.id);
                        }}
                        className="mt-2 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
                      >
                        {toast.action.label}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="rounded-md p-1 text-fg-subtle transition hover:bg-surface-muted hover:text-fg"
                    aria-label="Dismiss notification"
                  >
                    <Icon name="close" size="sm" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Safe no-op fallback so components never crash outside the provider.
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      loading: () => {},
      dismiss: () => {},
    };
  }
  return context;
}

export default ToastContext;
