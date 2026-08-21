import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import Icon from './Icon';

/**
 * Tabs — animated underline tab bar with full keyboard support
 * (arrow keys + home/end), rendered as an ARIA tablist.
 */
export default function Tabs({ tabs, value, onChange, className, size = 'md', fill = false }) {
  const listRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    const update = () => {
      const active = list.querySelector('[data-active="true"]');
      if (!active) return;
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => observer.disconnect();
  }, [value, tabs]);

  const onKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.value === value);
    if (index < 0) return;
    let next = null;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange?.(tabs[next].value);
    listRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        'relative flex gap-1 overflow-x-auto rounded-full border border-line bg-surface-muted p-1 no-scrollbar',
        fill && 'w-full',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1 top-1 rounded-full bg-surface shadow-sm ring-1 ring-line transition-all duration-300 ease-smooth"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            data-active={active}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              'relative z-10 inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors duration-200',
              size === 'sm' ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-sm',
              active ? 'text-brand-700 dark:text-brand-200' : 'text-fg-muted hover:text-fg'
            )}
          >
            {tab.icon && <Icon name={tab.icon} size="sm" />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-2xs font-bold',
                  active ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' : 'bg-surface text-fg-subtle'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
