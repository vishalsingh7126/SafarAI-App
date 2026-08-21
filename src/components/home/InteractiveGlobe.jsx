import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { destinations } from '../../data/destinations';
import { cn } from '../../lib/cn';

/**
 * InteractiveGlobe — a dependency-free 3D dot globe rendered on canvas.
 *
 * • Auto-rotates, drag to spin, markers map to real destination coordinates.
 * • Pauses when off-screen and respects prefers-reduced-motion.
 * • Falls back gracefully: markers remain clickable via the list below.
 */

const DOT_ROWS = 34;
const RADIUS_RATIO = 0.42;

function buildDots() {
  const dots = [];
  for (let i = 0; i < DOT_ROWS; i += 1) {
    const lat = -90 + (180 * i) / (DOT_ROWS - 1);
    const radius = Math.cos((lat * Math.PI) / 180);
    const count = Math.max(4, Math.round(DOT_ROWS * 2 * radius));
    for (let j = 0; j < count; j += 1) {
      const lng = -180 + (360 * j) / count;
      dots.push([lat, lng]);
    }
  }
  return dots;
}

const DOTS = buildDots();

function project(lat, lng, rotation, radius, cx, cy, tilt = -0.35) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + rotation) * (Math.PI / 180);

  let x = radius * Math.sin(phi) * Math.cos(theta);
  let y = radius * Math.cos(phi);
  let z = radius * Math.sin(phi) * Math.sin(theta);

  // tilt around the X axis for a more natural viewing angle
  const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
  const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
  y = y2;
  z = z2;

  return { x: cx + x, y: cy - y, z };
}

export default function InteractiveGlobe({ className, size = 420 }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rotation = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const velocity = useRef(0.14);
  const [active, setActive] = useState(null);
  const [markerPositions, setMarkerPositions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let frame;
    let visible = true;
    let width = size;
    let height = size;
    let lastMarkerSync = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(240, rect.width);
      height = width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { visible = entry.isIntersecting; }),
      { threshold: 0.05 }
    );
    io.observe(wrap);

    const isDark = () => document.documentElement.classList.contains('dark');

    const draw = () => {
      const cx = width / 2;
      const cy = height / 2;
      const radius = width * RADIUS_RATIO;

      ctx.clearRect(0, 0, width, height);

      // soft halo
      const halo = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius * 1.25);
      halo.addColorStop(0, isDark() ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.14)');
      halo.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // globe body
      const body = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      body.addColorStop(0, isDark() ? 'rgba(30,41,90,0.55)' : 'rgba(238,242,255,0.85)');
      body.addColorStop(1, isDark() ? 'rgba(12,17,38,0.6)' : 'rgba(224,231,255,0.55)');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // dot grid
      for (let i = 0; i < DOTS.length; i += 1) {
        const [lat, lng] = DOTS[i];
        const point = project(lat, lng, rotation.current, radius, cx, cy);
        if (point.z < 0) continue;
        const depth = point.z / radius;
        const alpha = 0.18 + depth * 0.55;
        ctx.fillStyle = isDark()
          ? `rgba(148,163,255,${alpha * 0.75})`
          : `rgba(79,70,229,${alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.1 + depth * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // rim light
      ctx.strokeStyle = isDark() ? 'rgba(129,140,248,0.35)' : 'rgba(79,70,229,0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // destination markers
      const positions = [];
      destinations.forEach((destination) => {
        const point = project(destination.coords.lat, destination.coords.lng, rotation.current, radius, cx, cy);
        const front = point.z >= 0;
        if (front) {
          const depth = point.z / radius;
          ctx.fillStyle = `rgba(6,182,212,${0.35 + depth * 0.5})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5 + depth * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1.8 + depth, 0, Math.PI * 2);
          ctx.fill();
        }
        positions.push({ slug: destination.slug, name: destination.name, x: point.x, y: point.y, front });
      });

      // Marker hit-areas are React state, so they are refreshed on a timer
      // rather than every frame (keeps the render loop off the main thread).
      const now = performance.now();
      if (now - lastMarkerSync > 120) {
        lastMarkerSync = now;
        setMarkerPositions(positions);
      }
    };

    const tick = () => {
      if (visible) {
        if (!dragging.current && !reduced) rotation.current += velocity.current;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };

    tick();

    const onPointerDown = (event) => {
      dragging.current = true;
      lastX.current = event.clientX;
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const onPointerMove = (event) => {
      if (!dragging.current) return;
      const delta = event.clientX - lastX.current;
      lastX.current = event.clientX;
      rotation.current += delta * 0.35;
      velocity.current = Math.max(-0.6, Math.min(0.6, delta * 0.02)) || 0.14;
    };
    const onPointerUp = (event) => {
      dragging.current = false;
      canvas.releasePointerCapture?.(event.pointerId);
      canvas.style.cursor = 'grab';
      if (Math.abs(velocity.current) < 0.05) velocity.current = 0.14;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [size]);

  return (
    <div ref={wrapRef} className={cn('relative mx-auto w-full max-w-[26rem] select-none', className)}>
      <canvas
        ref={canvasRef}
        className="block cursor-grab touch-none"
        role="img"
        aria-label="Interactive globe showing SafarAI destinations"
      />

      {/* Accessible + hoverable marker layer */}
      <div className="pointer-events-none absolute inset-0">
        {markerPositions
          .filter((marker) => marker.front)
          .map((marker) => (
            <button
              key={marker.slug}
              type="button"
              onMouseEnter={() => setActive(marker.slug)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(marker.slug)}
              onBlur={() => setActive(null)}
              onClick={() => navigate(`/destination/${marker.slug}`)}
              className="pointer-events-auto absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:ring-2 focus-visible:ring-brand-400"
              style={{ left: marker.x, top: marker.y }}
              aria-label={`Open ${marker.name}`}
            >
              <span
                className={cn(
                  'pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900/90 px-2 py-1 text-2xs font-bold text-white shadow-lift transition-opacity duration-150',
                  active === marker.slug ? 'opacity-100' : 'opacity-0'
                )}
              >
                {marker.name}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
