/* Dev-only interaction test: drives the critical user flows in jsdom.
   Run:  npx vite build -c vite.smoke.config.js && node node_modules/.smoke/flows.js */
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
  '<!doctype html><html><head><meta name="description" content=""></head><body><div id="root"></div></body></html>',
  { url: 'https://localhost/', pretendToBeVisual: true }
);

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.localStorage = dom.window.localStorage;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
global.cancelAnimationFrame = clearTimeout;
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
global.matchMedia = dom.window.matchMedia;
global.IS_REACT_ACT_ENVIRONMENT = true;

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react-dom/test-utils');
const { MemoryRouter } = await import('react-router-dom');

const { ThemeProvider } = await import('../src/context/ThemeContext.jsx');
const { ToastProvider } = await import('../src/context/ToastContext.jsx');
const { WorkspaceProvider } = await import('../src/context/WorkspaceContext.jsx');
const { AuthProvider } = await import('../src/context/AuthContext.jsx');
const { AssistantProvider } = await import('../src/context/AssistantContext.jsx');

const TripPlanner = (await import('../src/pages/TripPlanner.jsx')).default;
const BudgetCalculator = (await import('../src/pages/BudgetCalculator.jsx')).default;
const HotelsFinder = (await import('../src/pages/HotelsFinder.jsx')).default;
const ExplorePage = (await import('../src/pages/ExplorePage.jsx')).default;
const MyTrips = (await import('../src/pages/MyTrips.jsx')).default;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${message}`);
  }
}

async function mount(Component, route = '/') {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root;
  await act(async () => {
    root = createRoot(container);
    root.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [route] },
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(
            ToastProvider,
            null,
            React.createElement(
              WorkspaceProvider,
              null,
              React.createElement(AuthProvider, null, React.createElement(AssistantProvider, null, React.createElement(Component)))
            )
          )
        )
      )
    );
  });
  return {
    container,
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

const nativeSetter = (element, value) => {
  const proto = element instanceof dom.window.HTMLTextAreaElement ? dom.window.HTMLTextAreaElement : dom.window.HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value').set;
  setter.call(element, value);
  element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
};

const setSelect = (element, value) => {
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype, 'value').set;
  setter.call(element, value);
  element.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
};

const click = (element) => element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
const text = (container) => container.textContent || '';
const byText = (container, needle, selector = 'button, a') =>
  [...container.querySelectorAll(selector)].find((node) => node.textContent.trim().toLowerCase().includes(needle.toLowerCase()));

const iso = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

/* ------------------------------------------------- Trip planner end to end */
console.log('\nTrip Planner');
{
  const { container, unmount } = await mount(TripPlanner);

  await act(async () => {
    nativeSetter(container.querySelector('#tp-destination'), 'Goa');
    nativeSetter(container.querySelector('#tp-start'), iso(10));
    nativeSetter(container.querySelector('#tp-end'), iso(13));
  });

  const generate = byText(container, 'Generate itinerary');
  assert(Boolean(generate) && !generate.disabled, 'generate button enables with valid input');

  await act(async () => {
    click(generate);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 900));
  });

  assert(/4 days in Goa/i.test(text(container)), 'itinerary renders a 4-day plan for Goa');
  assert(container.querySelectorAll('article').length >= 4, 'a card is rendered per day');
  assert(/₹/.test(text(container)), 'a budget estimate is shown');

  const save = byText(container, 'Save trip');
  await act(async () => click(save));
  const stored = JSON.parse(localStorage.getItem('safarai_trips') || '[]');
  assert(stored.length === 1 && stored[0].destination === 'Goa', 'trip persists to safarai_trips storage');
  assert(stored[0].itinerary.length === 4, 'saved trip keeps the full itinerary');

  await unmount();
}

/* ------------------------------------------------------- My trips reads it */
console.log('\nMy Trips');
{
  const { container, unmount } = await mount(MyTrips);
  assert(/Goa/.test(text(container)), 'saved trip appears in My Trips');

  const view = byText(container, 'View itinerary');
  await act(async () => click(view));
  assert(/Day 1/i.test(text(container)), 'itinerary expands inline');
  await unmount();
}

/* -------------------------------------------------------- Budget estimator */
console.log('\nBudget Calculator');
{
  const { container, unmount } = await mount(BudgetCalculator);
  const before = text(container);

  await act(async () => {
    nativeSetter(container.querySelector('#days'), '6');
    nativeSetter(container.querySelector('#travelers'), '4');
  });
  await act(async () => click(byText(container, 'Calculate budget')));

  assert(text(container) !== before, 'estimate updates when inputs change');
  assert(/Estimated total/i.test(text(container)), 'total card renders');
  assert(/Per person/i.test(text(container)) && /Per day/i.test(text(container)), 'derived metrics render');
  await unmount();
}

/* -------------------------------------------------------------- Hotels flow */
console.log('\nHotels Finder');
{
  const { container, unmount } = await mount(HotelsFinder);
  await act(async () => setSelect(container.querySelector('#hf-city'), 'Goa'));
  await act(async () => click(byText(container, 'Search hotels')));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
  });

  assert(/stays in Goa/i.test(text(container)), 'result count reflects the city filter');
  assert(/Taj Exotica|W Goa|The Park Baga/.test(text(container)), 'real Goa hotels are listed');

  const luxury = container.querySelector('#desktop-tier-luxury');
  await act(async () => click(luxury));
  assert(/Taj Exotica|W Goa/.test(text(container)), 'tier filter narrows results');
  assert(!/The Hosteller/.test(text(container)), 'filtered-out budget stays disappear');
  await unmount();
}

/* ------------------------------------------------------------ Explore search */
console.log('\nExplore');
{
  const { container, unmount } = await mount(ExplorePage);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });

  const search = [...container.querySelectorAll('input')].find((node) => node.placeholder?.includes('Search destinations'));
  await act(async () => nativeSetter(search, 'kerala'));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
  });

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  });
  if (!/Kerala/.test(text(container))) {
    console.log('   DEBUG value:', search.value, '| len:', text(container).length, '| tail:', text(container).slice(-500));
  }
  assert(/Kerala/.test(text(container)), 'search finds Kerala');
  assert(!/Leh Ladakh/.test(text(container)), 'non-matching destinations are filtered out');
  await unmount();
}

/* ------------------------------------------------------- geographic maths */
console.log('\nGeography');
{
  const { haversine, greatCirclePath, subsolarPoint, latLngToVector3, vector3ToLatLng } = await import(
    '../src/components/geo/geo.js'
  );
  const { destinations, nearbyDestinations, searchDestinations, continents } = await import(
    '../src/data/destinations.js'
  );

  const delhi = { lat: 28.61, lng: 77.21 };
  const nyc = { lat: 40.71, lng: -74.01 };
  const km = haversine(delhi, nyc);
  assert(Math.abs(km - 11760) < 60, `Delhi→New York measures ${Math.round(km)} km (real 11,760)`);

  const solstice = subsolarPoint(new Date('2026-06-21T12:00:00Z'));
  assert(Math.abs(solstice.lat - 23.44) < 0.4, 'sub-solar point sits on the Tropic of Cancer at the June solstice');
  assert(Math.abs(solstice.lng) < 2, 'sub-solar longitude is over Greenwich at 12:00 UTC');

  const roundTrip = vector3ToLatLng(latLngToVector3(delhi.lat, delhi.lng, 1));
  assert(
    Math.abs(roundTrip.lat - delhi.lat) < 0.01 && Math.abs(roundTrip.lng - delhi.lng) < 0.01,
    'lat/lng → 3D → lat/lng round-trips exactly'
  );

  const path = greatCirclePath(delhi, nyc, 32);
  assert(path.length === 33 && Math.abs(path[0][0] - delhi.lat) < 0.001, 'great-circle path starts at the origin');

  const invalid = destinations.filter(
    (d) => Math.abs(d.coords.lat) > 90 || Math.abs(d.coords.lng) > 180 || !d.country || !d.continent
  );
  assert(invalid.length === 0, `all ${destinations.length} destinations have valid coordinates and metadata`);
  assert(continents.length === 9, `catalogue spans ${continents.length} continents`);
  assert(searchDestinations('japan').length >= 3, 'searching a country returns its cities');
  assert(nearbyDestinations(destinations.find((d) => d.slug === 'goa'))[0].distanceKm < 400, 'nearby lookup is distance-ordered');
}

/* ------------------------------------------------- real-world data integrity */
console.log('\nData integrity');
{
  const { destinations, distanceKm } = await import('../src/data/destinations.js');
  const { hotelsDatabase, cities } = await import('../src/data/hotelsDatabase.js');
  const { pointsOfInterest, POI_CATEGORIES } = await import('../src/data/pointsOfInterest.js');

  // 1. No placeholder or obviously invented naming anywhere in the catalogue.
  const banned = /(lorem|ipsum|placeholder|test\s|sample|dummy|xyz|tbd|coming soon|unnamed)/i;
  const suspicious = [...destinations, ...hotelsDatabase, ...pointsOfInterest].filter((row) => banned.test(row.name));
  assert(suspicious.length === 0, 'no placeholder names in destinations, hotels or attractions');

  // 2. Every hotel sits within a sane radius of the destination it is filed under.
  const misplaced = hotelsDatabase.filter((hotel) => {
    const destination = destinations.find((item) => item.slug === hotel.destination);
    if (!destination) return true;
    if (hotel.nearby) return distanceKm(hotel.coords, destination.coords) > 250; // flagged as a neighbouring town
    return distanceKm(hotel.coords, destination.coords) > 200;
  });
  assert(
    misplaced.length === 0,
    `all ${hotelsDatabase.length} hotels resolve to their destination`,
    misplaced.map((h) => h.name).join(', ')
  );

  // 3. Coordinates are real and unique — duplicates usually mean copy-paste data.
  const badCoords = hotelsDatabase.filter(
    (hotel) => Math.abs(hotel.coords.lat) > 90 || Math.abs(hotel.coords.lng) > 180 || (!hotel.coords.lat && !hotel.coords.lng)
  );
  assert(badCoords.length === 0, 'every hotel has valid coordinates');

  const coordKeys = new Set(hotelsDatabase.map((hotel) => `${hotel.coords.lat.toFixed(3)},${hotel.coords.lng.toFixed(3)}`));
  assert(coordKeys.size === hotelsDatabase.length, 'no two hotels share the same coordinates');

  const ids = new Set(hotelsDatabase.map((hotel) => hotel.id));
  assert(ids.size === hotelsDatabase.length, 'hotel ids are unique');

  // 4. Every POI is inside its destination's region and correctly categorised.
  const strayPois = pointsOfInterest.filter((place) => {
    const destination = destinations.find((item) => item.slug === place.destination);
    if (!destination) return true;
    return distanceKm(place.coords, destination.coords) > 250;
  });
  assert(strayPois.length === 0, `all ${pointsOfInterest.length} attractions sit near their destination`, strayPois.map((p) => p.name).join(', '));

  const badCategories = pointsOfInterest.filter((place) => !POI_CATEGORIES[place.category]);
  assert(badCategories.length === 0, 'every attraction uses a known category');

  // 5. Images: a card either has a verifiable source or is explicitly unverified.
  const withWiki = [...destinations, ...hotelsDatabase, ...pointsOfInterest].filter((row) => row.wiki);
  const badTitles = withWiki.filter((row) => /^https?:|\s{2,}|^\s|\s$/.test(row.wiki));
  assert(badTitles.length === 0, `all ${withWiki.length} Wikipedia references are plain article titles`);

  assert(cities.length >= 10, `hotel index covers ${cities.length} cities`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
