/**
 * SafarAI global destination catalogue.
 * ---------------------------------------------------------------------------
 * Every entry uses real geographic coordinates (WGS84) and factual travel data.
 * Photography is resolved at runtime from Wikipedia's REST API using the `wiki`
 * page title, so the dataset stays small and scales to thousands of rows
 * without shipping image URLs that rot.
 *
 * Adding a destination = one `make({...})` call. Nothing else in the app needs
 * to change: search, filters, the globe, the map and the detail pages all read
 * from this catalogue.
 */

/* ------------------------------------------------------------------ seasons */

export const SEASONS = {
  YEAR_ROUND: { label: 'Year-round', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  NOV_MAR: { label: 'Nov – Mar', months: [11, 12, 1, 2, 3] },
  OCT_APR: { label: 'Oct – Apr', months: [10, 11, 12, 1, 2, 3, 4] },
  DEC_MAR: { label: 'Dec – Mar', months: [12, 1, 2, 3] },
  OCT_MAR: { label: 'Oct – Mar', months: [10, 11, 12, 1, 2, 3] },
  MAR_MAY: { label: 'Mar – May', months: [3, 4, 5] },
  APR_JUN: { label: 'Apr – Jun', months: [4, 5, 6] },
  APR_OCT: { label: 'Apr – Oct', months: [4, 5, 6, 7, 8, 9, 10] },
  MAY_SEP: { label: 'May – Sep', months: [5, 6, 7, 8, 9] },
  JUN_SEP: { label: 'Jun – Sep', months: [6, 7, 8, 9] },
  JUN_AUG: { label: 'Jun – Aug', months: [6, 7, 8] },
  SEP_NOV: { label: 'Sep – Nov', months: [9, 10, 11] },
  MAR_JUN: { label: 'Mar – Jun', months: [3, 4, 5, 6] },
  SHOULDER: { label: 'Apr – Jun, Sep – Oct', months: [4, 5, 6, 9, 10] },
  DRY_SEASON: { label: 'May – Oct (dry)', months: [5, 6, 7, 8, 9, 10] },
};

export const CONTINENTS = [
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Africa',
  'Oceania',
  'Middle East',
  'Central America',
  'Caribbean',
];

/* Deterministic pseudo-random so sparklines/ratings stay stable per slug. */
function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function trendFor(slug, popularity) {
  const seed = hash(slug);
  return Array.from({ length: 7 }, (_, index) => {
    const wobble = ((seed >> (index * 3)) % 13) - 6;
    return Math.max(12, Math.min(99, Math.round(popularity - (6 - index) * 4 + wobble)));
  });
}

function budgetBand(dailyCost) {
  const low = Math.round((dailyCost * 4) / 1000) * 1000;
  const high = Math.round((dailyCost * 8) / 1000) * 1000;
  const fmt = (value) => `₹${value.toLocaleString('en-IN')}`;
  return `${fmt(low)} – ${fmt(high)}`;
}

let order = 0;

export function make(config) {
  const {
    slug,
    name,
    country,
    cc,
    continent,
    region,
    lat,
    lng,
    tagline,
    description,
    attractions = [],
    activities = [],
    season = SEASONS.YEAR_ROUND,
    dailyCost = 5000,
    rating = 4.6,
    safety = 80,
    duration = '3–5 days',
    tags = [],
    interests = [],
    wiki,
    image,
    popularity = 60,
    unesco = false,
  } = config;

  order += 1;

  return {
    slug,
    name,
    country,
    countryCode: cc,
    continent,
    region: region || country,
    coords: { lat, lng },
    tagline,
    description,
    topAttractions: attractions,
    highlights: activities,
    activities,
    bestTime: season.label,
    months: season.months,
    dailyCost,
    budget: budgetBand(dailyCost),
    budgetFrom: dailyCost * 4,
    rating,
    reviews: 320 + (hash(slug) % 3200),
    safetyScore: safety,
    duration,
    tags,
    interests,
    wiki: wiki || name.replace(/\s+/g, '_'),
    image,
    unesco,
    popularity,
    trend: trendFor(slug, popularity),
    order,
  };
}
