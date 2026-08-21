/**
 * Shared geographic helpers for the globe and the map.
 * All maths is standard WGS84 spherical approximation — accurate enough for
 * visualisation, cheap enough to run per frame.
 */

/** Latitude/longitude (degrees) → unit sphere vector matching an equirectangular texture. */
export function latLngToVector3(lat, lng, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

/** Inverse of `latLngToVector3`. */
export function vector3ToLatLng({ x, y, z }) {
  const radius = Math.sqrt(x * x + y * y + z * z) || 1;
  const lat = 90 - (Math.acos(y / radius) * 180) / Math.PI;
  const lng = ((Math.atan2(z, -x) * 180) / Math.PI + 360) % 360 - 180;
  return { lat, lng };
}

/**
 * Sub-solar point for a given moment (NOAA low-precision solar position).
 * Drives the day/night terminator so the globe matches real time of day.
 */
export function subsolarPoint(date = new Date()) {
  const rad = Math.PI / 180;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  const fractionalYear = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (utcHours - 12) / 24);

  const declination =
    0.006918 -
    0.399912 * Math.cos(fractionalYear) +
    0.070257 * Math.sin(fractionalYear) -
    0.006758 * Math.cos(2 * fractionalYear) +
    0.000907 * Math.sin(2 * fractionalYear) -
    0.002697 * Math.cos(3 * fractionalYear) +
    0.00148 * Math.sin(3 * fractionalYear);

  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(fractionalYear) -
      0.032077 * Math.sin(fractionalYear) -
      0.014615 * Math.cos(2 * fractionalYear) -
      0.040849 * Math.sin(2 * fractionalYear));

  const lat = declination / rad;
  const lng = -15 * (utcHours - 12 + equationOfTime / 60);

  return { lat, lng: ((lng + 540) % 360) - 180 };
}

/** Great-circle distance in kilometres. */
export function haversine(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Device capability probe used to pick globe/map quality. */
export function detectQuality() {
  if (typeof window === 'undefined') return 'high';

  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 768;
  const saveData = navigator.connection?.saveData;
  const slowNetwork = /2g|3g/.test(navigator.connection?.effectiveType || '');
  const lowMemory = (navigator.deviceMemory || 8) <= 4;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (saveData || slowNetwork) return 'low';
  if (narrow || coarse || lowMemory) return 'medium';
  if (reducedMotion) return 'medium';
  return 'high';
}

export function supportsWebGL() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Great-circle path between two coordinates, sampled for drawing.
 * Handles the antimeridian by unwrapping longitudes.
 */
export function greatCirclePath(from, to, segments = 64) {
  const toRad = (value) => (value * Math.PI) / 180;
  const toDeg = (value) => (value * 180) / Math.PI;

  const lat1 = toRad(from.lat);
  const lng1 = toRad(from.lng);
  const lat2 = toRad(to.lat);
  const lng2 = toRad(to.lng);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
      )
    );

  if (!d) return [[from.lat, from.lng], [to.lat, to.lng]];

  const points = [];
  let previousLng = null;
  let offset = 0;

  for (let i = 0; i <= segments; i += 1) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    let lng = toDeg(Math.atan2(y, x));

    if (previousLng !== null && Math.abs(lng + offset - previousLng) > 180) {
      offset += lng + offset - previousLng > 0 ? -360 : 360;
    }
    lng += offset;
    previousLng = lng;
    points.push([lat, lng]);
  }

  return points;
}

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
