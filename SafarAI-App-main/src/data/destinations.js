/**
 * SafarAI destination catalogue — the single source of truth for every
 * discovery surface (globe, map, explorer, search, planner, dashboard).
 *
 * Composition:
 *   • `world/india.js`              — 12 curated Indian destinations (with art)
 *   • `world/asia.js`               — 32 across Asia (incl. more of India)
 *   • `world/europe.js`             — 33 across Europe
 *   • `world/africa-middleeast.js`  — 24 across Africa and the Middle East
 *   • `world/americas-oceania.js`   — 40 across the Americas, Caribbean, Oceania
 *
 * Adding destinations = append a `make({...})` call in the relevant region
 * file. Nothing downstream needs to change.
 */

import indiaDestinations from './world/india.js';
import asia from './world/asia.js';
import europe from './world/europe.js';
import africaMiddleEast from './world/africa-middleeast.js';
import americasOceania from './world/americas-oceania.js';

export { SEASONS, CONTINENTS } from './world/_shared.js';

const catalogue = [...indiaDestinations, ...asia, ...europe, ...africaMiddleEast, ...americasOceania];

/* De-duplicate by slug (India appears in both the curated set and Asia). */
const bySlug = new Map();
catalogue.forEach((destination) => {
  if (!bySlug.has(destination.slug)) bySlug.set(destination.slug, destination);
});

export const destinations = [...bySlug.values()];
export const destinationBySlug = Object.fromEntries(bySlug);

/* ------------------------------------------------------------- dimensions */

export const continents = [...new Set(destinations.map((d) => d.continent))].sort();
export const countries = [...new Set(destinations.map((d) => d.country))].sort();
export const allTags = [...new Set(destinations.flatMap((d) => d.tags))].sort();
export const allInterests = [...new Set(destinations.flatMap((d) => d.interests))].sort();

/** Legacy export: the four Indian regions used by the India-specific views. */
export const allRegions = ['North', 'South', 'East', 'West'];

export const continentCounts = continents.reduce((acc, continent) => {
  acc[continent] = destinations.filter((d) => d.continent === continent).length;
  return acc;
}, {});

/* ---------------------------------------------------------------- lookups */

export function findDestination(term = '') {
  const needle = String(term).trim().toLowerCase();
  if (!needle) return null;
  return (
    destinationBySlug[needle.replace(/\s+/g, '-')] ||
    destinations.find((d) => d.name.toLowerCase() === needle) ||
    destinations.find((d) => d.country.toLowerCase() === needle) ||
    destinations.find((d) => d.name.toLowerCase().includes(needle)) ||
    null
  );
}

export function searchDestinations(term = '', limit = Infinity) {
  const needle = String(term).trim().toLowerCase();
  if (!needle) return destinations.slice(0, limit);

  const scored = destinations
    .map((destination) => {
      const name = destination.name.toLowerCase();
      const haystack = `${destination.name} ${destination.country} ${destination.region} ${destination.continent} ${destination.tagline} ${destination.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(needle)) return null;
      let score = destination.popularity / 100;
      if (name === needle) score += 10;
      else if (name.startsWith(needle)) score += 6;
      else if (name.includes(needle)) score += 4;
      else if (destination.country.toLowerCase().includes(needle)) score += 2;
      return { destination, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.destination);
}

/** Great-circle distance in kilometres. */
export function distanceKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearbyDestinations(destination, count = 4) {
  if (!destination) return [];
  return destinations
    .filter((entry) => entry.slug !== destination.slug)
    .map((entry) => ({ entry, km: distanceKm(destination.coords, entry.coords) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, count)
    .map(({ entry, km }) => ({ ...entry, distanceKm: Math.round(km) }));
}

export function inSeason(month = new Date().getMonth() + 1) {
  return destinations.filter((destination) => destination.months.includes(month));
}

export function filterDestinations({
  query = '',
  continents: continentFilter = [],
  tags: tagFilter = [],
  interests: interestFilter = [],
  maxDailyCost = Infinity,
  minSafety = 0,
  month = null,
  unescoOnly = false,
} = {}) {
  const base = query ? searchDestinations(query) : destinations;

  return base.filter((destination) => {
    if (continentFilter.length && !continentFilter.includes(destination.continent)) return false;
    if (tagFilter.length && !tagFilter.some((tag) => destination.tags.includes(tag))) return false;
    if (interestFilter.length && !interestFilter.some((i) => destination.interests.includes(i))) return false;
    if (destination.dailyCost > maxDailyCost) return false;
    if (destination.safetyScore < minSafety) return false;
    if (month && !destination.months.includes(Number(month))) return false;
    if (unescoOnly && !destination.unesco) return false;
    return true;
  });
}

export const maxDailyCost = Math.max(...destinations.map((d) => d.dailyCost));
export const minDailyCost = Math.min(...destinations.map((d) => d.dailyCost));

export default destinations;
