/**
 * End-to-end audit harness.
 * ---------------------------------------------------------------------------
 * Drives a real headless Chromium (WebGL enabled) against the dev server:
 *   • visits every route and records console errors + failed requests
 *   • verifies the WebGL globe actually paints and reacts to input
 *   • verifies the Leaflet map mounts with markers and controls
 *   • exercises search, filters, marker selection and the globe → map hand-off
 *   • writes screenshots to .audit/ for visual review
 *
 * Usage:  node scripts/audit.mjs [baseUrl]
 * Requires: CHROMIUM_PATH env var (or @sparticuz/chromium installed).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import zlib from 'node:zlib';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = process.env.AUDIT_OUT || '.audit';
mkdirSync(OUT, { recursive: true });

/* Hosts that simply cannot resolve inside a sandboxed CI box. Failures against
   these are environmental, not application bugs. */
const EXTERNAL = [
  'wss://localhost',
  'https://localhost',
  'wikipedia.org',
  'wikimedia.org',
  'arcgisonline.com',
  'opentopomap.org',
  'cartocdn.com',
  'openstreetmap.org',
  'unsplash.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'supabase.co',
  'groq.com',
];

const isExternal = (url) => EXTERNAL.some((host) => url.includes(host));

/** Minimal PNG stats: decode with the platform's own zlib + PNG unfiltering. */
function analysePng(buffer) {
  const { inflateSync } = zlib;
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  const idat = [];

  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + length;
  }

  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) return { range: 0, unique: 0 };

  const channels = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? out[y * stride + x - channels] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? out[(y - 1) * stride + x - channels] : 0;
      let value = line[x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y * stride + x] = value & 0xff;
    }
  }

  let min = 255;
  let max = 0;
  const seen = new Set();
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const i = y * stride + x * channels;
      const luma = (out[i] * 0.299 + out[i + 1] * 0.587 + out[i + 2] * 0.114) | 0;
      min = Math.min(min, luma);
      max = Math.max(max, luma);
      seen.add((out[i] >> 3) << 10 | (out[i + 1] >> 3) << 5 | (out[i + 2] >> 3));
    }
  }
  return { range: max - min, unique: seen.size };
}

let failures = 0;
let checks = 0;

function assert(condition, message, detail = '') {
  checks += 1;
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${message}${detail ? `\n      ${detail}` : ''}`);
  }
}

async function resolveExecutable() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const chromium = (await import('@sparticuz/chromium')).default;
  return chromium.executablePath();
}

const executablePath = await resolveExecutable();

const browser = await puppeteer.launch({
  executablePath,
  headless: 'shell',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
  ],
  defaultViewport: { width: 1440, height: 900 },
});

function watch(page, log) {
  page.on('console', (message) => {
    if (message.type() !== 'error' && message.type() !== 'warning') return;
    const text = message.text();
    if (isExternal(text)) return;
    if (/WebSocket connection to 'wss:\/\/localhost/.test(text)) return;
    if (/Failed to load resource/.test(text)) return; // covered by requestfailed
    log.console.push(`${message.type()}: ${text}`);
  });
  page.on('pageerror', (error) => log.errors.push(String(error.message || error)));
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (isExternal(url)) log.external.push(url);
    else log.failed.push(`${url} — ${request.failure()?.errorText}`);
  });
}

async function visit(path, { wait = 1200 } = {}) {
  const page = await browser.newPage();
  const log = { console: [], errors: [], failed: [], external: [] };
  watch(page, log);
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, wait));
  return { page, log };
}

/* ------------------------------------------------------------ route sweep */
console.log('\n▸ Route sweep');
const ROUTES = [
  '/', '/world', '/explore', '/nearby', '/plan-trip', '/transport', '/railway',
  '/trip-planner', '/my-trips', '/hotels', '/food-culture', '/assistant',
  '/safety', '/budget', '/events', '/community', '/profile', '/auth',
  '/destination/goa', '/destination/tokyo', '/destination/machu-picchu',
  '/this-route-does-not-exist',
];

for (const route of ROUTES) {
  const { page, log } = await visit(route, { wait: 700 });
  const bodyText = await page.evaluate(() => document.body.innerText.trim().length).catch(() => 0);
  const problems = [...log.errors, ...log.console, ...log.failed];
  assert(
    bodyText > 200 && problems.length === 0,
    `${route.padEnd(30)} ${bodyText} chars`,
    problems.slice(0, 3).join('\n      ')
  );
  await page.close();
}

/* ----------------------------------------------------------------- globe  */
console.log('\n▸ 3D globe (/world)');
{
  const { page, log } = await visit('/world', { wait: 3500 });

  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { present: false };
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return {
      present: true,
      width: canvas.width,
      height: canvas.height,
      cssWidth: canvas.clientWidth,
      cssHeight: canvas.clientHeight,
      contextLost: gl ? gl.isContextLost() : null,
    };
  });

  assert(canvasInfo.present, 'a WebGL canvas is mounted');
  assert(canvasInfo.width > 100 && canvasInfo.height > 100, `canvas is sized (${canvasInfo.width}×${canvasInfo.height})`);
  assert(canvasInfo.contextLost === false, 'WebGL context is alive');

  // Is anything actually painted? Compare pixel signatures of two screenshots.
  const box = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  const shot1 = await page.screenshot({ clip: box });
  writeFileSync(join(OUT, 'globe-1.png'), shot1);

  // Screenshots capture the composited WebGL frame (reading the canvas back
  // directly would need preserveDrawingBuffer, which costs performance).
  const stats = analysePng(shot1);
  assert(stats.range > 60, `globe paints real detail (luma range ${stats.range})`);
  assert(stats.unique > 400, `frame has photographic variety (${stats.unique} distinct colours sampled)`);

  // Drag should rotate the camera and change the frame.
  const before = await page.screenshot({ clip: box, encoding: 'base64' });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2 + 40, { steps: 22 });
  await page.mouse.up();
  await new Promise((resolve) => setTimeout(resolve, 900));
  const after = await page.screenshot({ clip: box, encoding: 'base64' });
  assert(before !== after, 'dragging rotates the globe');
  writeFileSync(join(OUT, 'globe-2-dragged.png'), Buffer.from(after, 'base64'));

  // Zoom via wheel.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel({ deltaY: -420 });
  await new Promise((resolve) => setTimeout(resolve, 800));
  const zoomed = await page.screenshot({ clip: box, encoding: 'base64' });
  assert(zoomed !== after, 'scroll wheel zooms the globe');
  writeFileSync(join(OUT, 'globe-3-zoomed.png'), Buffer.from(zoomed, 'base64'));

  // Textures actually fetched from our own origin.
  const textureRequests = await page.evaluate(() =>
    performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/textures/')).map((entry) => ({
      name: entry.name.split('/').pop(),
      size: entry.transferSize || entry.decodedBodySize,
    }))
  );
  assert(textureRequests.length >= 1, `earth textures loaded (${textureRequests.map((t) => t.name).join(', ') || 'none'})`);

  const problems = [...log.errors, ...log.console, ...log.failed];
  assert(problems.length === 0, 'no console errors on the globe', problems.slice(0, 4).join('\n      '));

  await page.screenshot({ path: join(OUT, 'world-globe-full.png'), fullPage: false });
  await page.close();
}

/* ------------------------------------------------------- markers + panel  */
console.log('\n▸ Globe interactions');
{
  const { page, log } = await visit('/world', { wait: 3500 });

  // Click the first destination in the sidebar list → panel opens, globe flies.
  const clicked = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('aside button')];
    const target = buttons.find((button) => /\d★|\/d/.test(button.innerText));
    if (!target) return null;
    target.click();
    return target.innerText.split('\n')[0];
  });
  await new Promise((resolve) => setTimeout(resolve, 1800));

  assert(Boolean(clicked), `selecting a destination from the list (${clicked || 'no row found'})`);

  const panel = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasKeyAttractions: /key attractions/i.test(text),
      hasActivities: /popular activities/i.test(text),
      hasZoomButton: /zoom into the map/i.test(text),
    };
  });
  assert(panel.hasKeyAttractions && panel.hasActivities, 'detail panel shows attractions and activities');
  assert(panel.hasZoomButton, 'globe → map hand-off button is offered');
  await page.screenshot({ path: join(OUT, 'world-selected.png') });

  // Hand-off to the map.
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((b) => b.innerText.includes('Zoom into the map'));
    button?.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 2600));

  const mapState = await page.evaluate(() => ({
    container: Boolean(document.querySelector('.leaflet-container')),
    markers: document.querySelectorAll('.safarai-marker, .safarai-cluster').length,
    controls: document.querySelectorAll('.leaflet-control-attribution').length,
    zoomBadge: /zoom \d+/.test(document.body.innerText),
  }));

  assert(mapState.container, 'Leaflet map mounts after the hand-off');
  assert(mapState.markers > 0, `map renders markers/clusters (${mapState.markers})`);
  assert(mapState.controls > 0, 'attribution control present (licence compliance)');
  await page.screenshot({ path: join(OUT, 'world-map.png') });

  const problems = [...log.errors, ...log.console, ...log.failed];
  assert(problems.length === 0, 'no console errors during interaction', problems.slice(0, 4).join('\n      '));
  await page.close();
}

/* --------------------------------------------- points of interest + hotels */
console.log('\n▸ Real places on the map');
{
  const { page, log } = await visit('/world?focus=tokyo&view=map', { wait: 3500 });

  // Land on Tokyo, then zoom past the POI threshold.
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((b) => /Map$/.test(b.innerText.trim()));
    button?.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 2500));

  await page.evaluate(() => {
    for (let i = 0; i < 6; i += 1) {
      document.querySelector('[aria-label="Zoom in"]')?.click();
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const poiState = await page.evaluate(() => ({
    pois: document.querySelectorAll('.safarai-poi').length,
    tooltips: document.querySelectorAll('.safarai-tooltip').length,
    legend: /zoom in to see them|places in/i.test(document.body.innerText),
    zoom: (document.body.innerText.match(/zoom (\d+)/i) || [])[1],
  }));

  assert(Number(poiState.zoom) >= 7, `map zoomed to level ${poiState.zoom}`);
  assert(poiState.pois > 0, `attractions, airports and hotels render as category markers (${poiState.pois})`);
  await page.screenshot({ path: join(OUT, 'map-pois.png') });

  const problems = [...log.errors, ...log.console, ...log.failed];
  assert(problems.length === 0, 'no console errors on the POI layer', problems.slice(0, 3).join('\n      '));
  await page.close();
}

console.log('\n▸ Hotels');
{
  const { page, log } = await visit('/hotels', { wait: 1500 });
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((b) => /Search hotels/i.test(b.innerText));
    button?.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const text = await page.evaluate(() => document.body.innerText);
  const realNames = ['Taj Mahal Palace', 'The Imperial', 'Marina Bay Sands', 'Ritz Paris', 'Raffles'];
  const found = realNames.filter((name) => text.includes(name));
  assert(found.length >= 2, `hotel list shows real properties (${found.join(', ') || 'none found'})`);

  const inventedNames = ['Sea Breeze Resort', 'Capital Comforts', 'Marine Drive Grand', 'Pink City Budget Inn', 'Snow Crest Inn'];
  const leftovers = inventedNames.filter((name) => text.includes(name));
  assert(leftovers.length === 0, 'no invented hotels remain', leftovers.join(', '));

  assert(/star|est\. \d{4}/i.test(text), 'hotel cards show verifiable detail (class, year)');
  await page.screenshot({ path: join(OUT, 'hotels.png') });

  const problems = [...log.errors, ...log.console, ...log.failed];
  assert(problems.length === 0, 'no console errors on hotels', problems.slice(0, 3).join('\n      '));
  await page.close();
}

/* ------------------------------------------------------------ search/UI  */
console.log('\n▸ Search, filters and cards');
{
  const { page, log } = await visit('/world', { wait: 2500 });

  await page.type('input[aria-label="Search destinations"]', 'japan', { delay: 25 });
  await new Promise((resolve) => setTimeout(resolve, 900));
  const searchResults = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('aside li button')];
    return rows.map((row) => row.innerText.replace(/\s+/g, ' ').trim());
  });
  assert(
    searchResults.length >= 3 && searchResults.some((row) => /Tokyo/i.test(row)),
    `search "japan" returns ${searchResults.length} rows including Tokyo`
  );

  const problems = [...log.errors, ...log.console, ...log.failed];
  assert(problems.length === 0, 'no console errors while searching', problems.slice(0, 3).join('\n      '));
  await page.close();
}

/* -------------------------------------------------------------- home page */
console.log('\n▸ Landing page');
{
  const { page, log } = await visit('/', { wait: 4000 });
  await page.evaluate(() => window.scrollTo(0, 900));
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.screenshot({ path: join(OUT, 'home-top.png') });

  const heroGlobe = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas ? { w: canvas.width, h: canvas.height } : null;
  });
  assert(Boolean(heroGlobe), `hero globe canvas present (${heroGlobe?.w}×${heroGlobe?.h})`);

  const problems = [...log.errors, ...log.console, ...log.failed];
  assert(problems.length === 0, 'landing page is clean', problems.slice(0, 4).join('\n      '));
  await page.close();
}

/* ------------------------------------------------------------- responsive */
console.log('\n▸ Mobile viewport');
{
  const page = await browser.newPage();
  const log = { console: [], errors: [], failed: [], external: [] };
  watch(page, log);
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/world`, { waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert(overflow.scrollWidth <= overflow.clientWidth + 2, `no horizontal overflow (${overflow.scrollWidth} ≤ ${overflow.clientWidth})`);
  await page.screenshot({ path: join(OUT, 'mobile-world.png') });

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const homeOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert(homeOverflow.scrollWidth <= homeOverflow.clientWidth + 2, `home has no horizontal overflow (${homeOverflow.scrollWidth} ≤ ${homeOverflow.clientWidth})`);
  await page.screenshot({ path: join(OUT, 'mobile-home.png') });
  await page.close();
}

await browser.close();

console.log(`\n${checks - failures}/${checks} checks passed${failures ? ` · ${failures} FAILED` : ''}`);
console.log(`Screenshots written to ${OUT}/`);
process.exit(failures ? 1 : 0);
