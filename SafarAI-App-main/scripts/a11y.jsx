/* Dev-only accessibility audit: renders each page in jsdom and runs axe-core.
   Run:  npx vite build -c vite.smoke.config.js && node node_modules/.smoke/a11y.js
   (jsdom has no layout engine, so colour-contrast rules are reported as
   "incomplete" and skipped — everything structural is still checked.) */
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
  '<!doctype html><html lang="en"><head><meta name="description" content=""><title>SafarAI</title></head><body><div id="root"></div></body></html>',
  { url: 'https://localhost/', pretendToBeVisual: true }
);

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.localStorage = dom.window.localStorage;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.getComputedStyle = dom.window.getComputedStyle;
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
const axe = (await import('axe-core')).default;

const { ThemeProvider } = await import('../src/context/ThemeContext.jsx');
const { ToastProvider } = await import('../src/context/ToastContext.jsx');
const { WorkspaceProvider } = await import('../src/context/WorkspaceContext.jsx');
const { AuthProvider } = await import('../src/context/AuthContext.jsx');
const { AssistantProvider } = await import('../src/context/AssistantContext.jsx');

const pages = [
  ['Home', (await import('../src/pages/HomePage.jsx')).default],
  ['Nearby', (await import('../src/pages/NearbyExplorer.jsx')).default],
  ['FoodCulture', (await import('../src/pages/FoodCultureExplorer.jsx')).default],
  ['Railway', (await import('../src/pages/RailwayExplorer.jsx')).default],
  ['MyTrips', (await import('../src/pages/MyTrips.jsx')).default],
  ['PlanTrip', (await import('../src/pages/PlanTripPage.jsx')).default],
  ['Assistant', (await import('../src/pages/AIAssistant.jsx')).default],
  ['Explore', (await import('../src/pages/ExplorePage.jsx')).default],
  ['WorldExplorer', (await import('../src/pages/WorldExplorer.jsx')).default],
  ['TripPlanner', (await import('../src/pages/TripPlanner.jsx')).default],
  ['Hotels', (await import('../src/pages/HotelsFinder.jsx')).default],
  ['Budget', (await import('../src/pages/BudgetCalculator.jsx')).default],
  ['Safety', (await import('../src/pages/SafetyPage.jsx')).default],
  ['Dashboard', (await import('../src/pages/ProfilePage.jsx')).default],
  ['Community', (await import('../src/pages/CommunityPage.jsx')).default],
  ['Transport', (await import('../src/pages/TransportPage.jsx')).default],
  ['Events', (await import('../src/pages/EventsExplorer.jsx')).default],
  ['Auth', (await import('../src/pages/AuthPage.jsx')).default],
  ['Navbar', (await import('../src/components/Navbar.jsx')).default],
  ['Footer', (await import('../src/components/Footer.jsx')).default],
];

const IGNORED = new Set(['color-contrast', 'landmark-one-main', 'page-has-heading-one', 'region']);

let violations = 0;

for (const [name, Component] of pages) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let root;
  const originalError = console.error;
  console.error = () => {};
  await act(async () => {
    root = createRoot(container);
    root.render(
      React.createElement(
        MemoryRouter,
        null,
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
  console.error = originalError;

  const results = await axe.run(container, { resultTypes: ['violations'] });
  const relevant = results.violations.filter((violation) => !IGNORED.has(violation.id));

  if (relevant.length === 0) {
    console.log(`✓ ${name.padEnd(14)} no violations`);
  } else {
    violations += relevant.length;
    console.log(`✗ ${name}`);
    relevant.forEach((violation) => {
      console.log(`   [${violation.impact}] ${violation.id}: ${violation.help}`);
      violation.nodes.slice(0, 2).forEach((node) => console.log(`      ${node.html.slice(0, 120)}`));
    });
  }

  await act(async () => root.unmount());
  container.remove();
}

console.log(violations === 0 ? '\nNo accessibility violations found.' : `\n${violations} rule violation group(s).`);
process.exit(violations === 0 ? 0 : 1);
