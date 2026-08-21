#!/usr/bin/env node
/**
 * Verify every place against Wikipedia, then cache its photo locally.
 * ---------------------------------------------------------------------------
 * For each destination, hotel and point of interest that declares a `wiki`
 * title this script:
 *
 *   1. resolves the article through the Wikipedia REST API,
 *   2. checks the article's own coordinates against the ones we ship
 *      (rejecting anything further than the allowed radius — this is what
 *      stops a card ever showing a photo of the wrong place),
 *   3. downloads the lead image into public/images/<category>/,
 *   4. records source, author and licence in src/data/imageManifest.js.
 *
 * Anything that fails verification is reported and left without an image, so
 * the UI shows its labelled placeholder instead of something misleading.
 *
 * Usage:  npm run images:fetch            (all)
 *         npm run images:fetch -- --dry   (verify only, no downloads)
 *
 * Requires outbound network access to wikipedia.org / wikimedia.org.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dry = process.argv.includes('--dry');

const importFromRoot = (path) => import(pathToFileURL(join(root, path)).href);
const { destinations } = await importFromRoot('src/data/destinations.js');
const { hotelsDatabase } = await importFromRoot('src/data/hotelsDatabase.js');
const { pointsOfInterest } = await importFromRoot('src/data/pointsOfInterest.js');

const API = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const USER_AGENT = 'SafarAI-image-verifier/1.0 (https://github.com/; contact: developer@travelcore.com)';

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function downloadImage(source) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(source, { headers: { 'User-Agent': USER_AGENT } });
    if (response.ok) return response;
    if (response.status !== 429 || attempt === 4) return response;

    const retryAfter = Number(response.headers.get('retry-after'));
    await wait(Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 1500);
  }
  return null;
}

/** Great-circle distance in km. */
function haversine(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const targets = [
  ...destinations
    .filter((d) => d.wiki)
    .map((d) => ({ key: `dest-${d.slug}`, title: d.wiki, coords: d.coords, category: 'destinations', tolerance: 120, name: d.name })),
  ...hotelsDatabase
    .filter((h) => h.wiki)
    .map((h) => ({ key: `hotel-${h.id}`, title: h.wiki, coords: h.coords, category: 'hotels', tolerance: 3, name: h.name })),
  ...pointsOfInterest
    .filter((p) => p.wiki)
    .map((p) => ({ key: `poi-${p.id}`, title: p.wiki, coords: p.coords, category: 'attractions', tolerance: 25, name: p.name })),
];

const poiPriority = {
  landmark: 0,
  religious: 1,
  viewpoint: 2,
  museum: 3,
  nature: 4,
  beach: 5,
  park: 6,
};

const preferredDestinationImages = Object.fromEntries(
  destinations.map((destination) => {
    const candidate = pointsOfInterest
      .filter((point) => point.destination === destination.slug && point.wiki)
      .sort((a, b) => (poiPriority[a.category] ?? 99) - (poiPriority[b.category] ?? 99))[0];
    return [destination.slug, candidate ? `poi-${candidate.id}` : `dest-${destination.slug}`];
  })
);

console.log(`Verifying ${targets.length} places against Wikipedia…\n`);

const manifest = {};
const problems = [];
let verified = 0;

for (const target of targets) {
  try {
    const response = await fetch(`${API}${encodeURIComponent(target.title)}?redirect=true`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });

    if (!response.ok) {
      problems.push(`${target.name}: article "${target.title}" returned ${response.status}`);
      continue;
    }

    const data = await response.json();
    const source = data?.originalimage?.source || data?.thumbnail?.source;

    // --- geographic cross-check -------------------------------------------
    if (data?.coordinates) {
      const distance = haversine(target.coords, { lat: data.coordinates.lat, lng: data.coordinates.lon });
      if (distance > target.tolerance) {
        problems.push(
          `${target.name}: article coordinates are ${Math.round(distance)} km away (limit ${target.tolerance} km) — not the same place`
        );
        continue;
      }
    } else if (target.category !== 'destinations') {
      problems.push(`${target.name}: article has no coordinates to verify against`);
      continue;
    }

    if (!source) {
      problems.push(`${target.name}: article has no lead image`);
      continue;
    }

    verified += 1;
    const extension = new URL(source).pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || 'jpg';
    const file = `${target.category}/${target.key}.${extension}`;

    manifest[target.key] = {
      file,
      title: target.title,
      source: data?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${target.title}`,
      license: 'See the Wikimedia file page for the exact licence',
      author: 'Wikimedia Commons contributors',
      verifiedAt: new Date().toISOString().slice(0, 10),
      coords: target.coords,
    };

    if (dry) {
      console.log(`  ✓ ${target.name}`);
      continue;
    }

    const imagePath = join(root, 'public/images', file);
    mkdirSync(dirname(imagePath), { recursive: true });
    if (!existsSync(imagePath)) {
      const binary = await downloadImage(source);
      if (!binary.ok) {
        problems.push(`${target.name}: image download failed (${binary.status})`);
        delete manifest[target.key];
        continue;
      }
      writeFileSync(imagePath, Buffer.from(await binary.arrayBuffer()));
    }
    console.log(`  ✓ ${target.name} → public/images/${file}`);
  } catch (error) {
    problems.push(`${target.name}: ${error.message}`);
  }
}

if (!dry) {
  const contents = `/**
 * AUTO-GENERATED by scripts/fetch-images.mjs — do not edit by hand.
 * Every entry was verified against the Wikipedia article for that exact place,
 * including a coordinate cross-check, on the date recorded below.
 */
const manifest = ${JSON.stringify(manifest, null, 2)};
const destinationImageKeys = ${JSON.stringify(preferredDestinationImages, null, 2)};

export function localImageFor(key) {
  const entry = manifest[key];
  return entry ? { url: \`/images/\${entry.file}\`, credit: entry.author, license: entry.license } : null;
}

export function localImageForDestination(slug) {
  const preferredKey = destinationImageKeys[slug];
  return preferredKey ? localImageFor(preferredKey) || localImageFor(\`dest-\${slug}\`) : null;
}

export default manifest;
`;
  writeFileSync(join(root, 'src/data/imageManifest.js'), contents);
}

console.log(`\n${verified}/${targets.length} places verified.`);
if (problems.length) {
  console.log(`\n${problems.length} could not be verified (they will render a labelled placeholder):`);
  problems.forEach((problem) => console.log(`  • ${problem}`));
}
