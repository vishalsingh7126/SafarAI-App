import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp — animates a number from 0 → `value` once the element is
 * visible. Honours prefers-reduced-motion by jumping straight to the end.
 */
export default function useCountUp(value, { duration = 1400, start = 0, decimals = 0 } = {}) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(start);
  const frame = useRef();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setDisplay(value);
      return undefined;
    }

    let started = false;
    const run = () => {
      const t0 = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - t0) / duration, 1);
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const next = start + (value - start) * eased;
        setDisplay(decimals ? Number(next.toFixed(decimals)) : Math.round(next));
        if (progress < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            run();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, duration, start, decimals]);

  return [ref, display];
}
