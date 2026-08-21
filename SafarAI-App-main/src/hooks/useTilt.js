import { useCallback, useRef } from 'react';

/**
 * useTilt — subtle 3D pointer tilt for cards. Disabled for touch input and
 * when the user prefers reduced motion.
 */
export default function useTilt({ max = 8, scale = 1.015, glare = true } = {}) {
  const ref = useRef(null);
  const raf = useRef(null);

  const onPointerMove = useCallback(
    (event) => {
      const node = ref.current;
      if (!node) return;
      if (event.pointerType === 'touch') return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * max * 2;
      const ry = (px - 0.5) * max * 2;

      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        node.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(
          2
        )}deg) scale(${scale})`;
        node.style.transitionDuration = '80ms';
        if (glare) {
          node.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
          node.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
        }
      });
    },
    [max, scale, glare]
  );

  const onPointerLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    node.style.transitionDuration = '420ms';
    node.style.transform = '';
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
