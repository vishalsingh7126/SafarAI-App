/* Dev-only smoke test: server-renders every page inside the real providers to
   catch import/runtime errors without a browser.
   Run:  npx vite build -c vite.smoke.config.js && node node_modules/.smoke/smoke.js */
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
const { MemoryRouter, Routes, Route } = await import('react-router-dom');

const { ThemeProvider } = await import('../src/context/ThemeContext.jsx');
const { ToastProvider } = await import('../src/context/ToastContext.jsx');
const { WorkspaceProvider } = await import('../src/context/WorkspaceContext.jsx');
const { AuthProvider } = await import('../src/context/AuthContext.jsx');
const { AssistantProvider } = await import('../src/context/AssistantContext.jsx');

const HomePage = (await import('../src/pages/HomePage.jsx')).default;
const ExplorePage = (await import('../src/pages/ExplorePage.jsx')).default;
const WorldExplorer = (await import('../src/pages/WorldExplorer.jsx')).default;
const NearbyExplorer = (await import('../src/pages/NearbyExplorer.jsx')).default;
const PlanTripPage = (await import('../src/pages/PlanTripPage.jsx')).default;
const TransportPage = (await import('../src/pages/TransportPage.jsx')).default;
const SafetyPage = (await import('../src/pages/SafetyPage.jsx')).default;
const CommunityPage = (await import('../src/pages/CommunityPage.jsx')).default;
const ProfilePage = (await import('../src/pages/ProfilePage.jsx')).default;
const RailwayExplorer = (await import('../src/pages/RailwayExplorer.jsx')).default;
const TripPlanner = (await import('../src/pages/TripPlanner.jsx')).default;
const MyTrips = (await import('../src/pages/MyTrips.jsx')).default;
const DestinationDetails = (await import('../src/pages/DestinationDetails.jsx')).default;
const HotelsFinder = (await import('../src/pages/HotelsFinder.jsx')).default;
const FoodCultureExplorer = (await import('../src/pages/FoodCultureExplorer.jsx')).default;
const BudgetCalculator = (await import('../src/pages/BudgetCalculator.jsx')).default;
const EventsExplorer = (await import('../src/pages/EventsExplorer.jsx')).default;
const AIAssistant = (await import('../src/pages/AIAssistant.jsx')).default;
const AuthPage = (await import('../src/pages/AuthPage.jsx')).default;
const Navbar = (await import('../src/components/Navbar.jsx')).default;
const Footer = (await import('../src/components/Footer.jsx')).default;
const DestinationCard = (await import('../src/components/DestinationCard.jsx')).default;
const TravelAssistantChat = (await import('../src/components/TravelAssistantChat.jsx')).default;
const CommandPalette = (await import('../src/components/CommandPalette.jsx')).default;
const { destinations } = await import('../src/data/destinations.js');

const cases = [
  ['HomePage', HomePage],
  ['ExplorePage', ExplorePage],
  ['WorldExplorer', WorldExplorer],
  ['NearbyExplorer', NearbyExplorer],
  ['PlanTripPage', PlanTripPage],
  ['TransportPage', TransportPage],
  ['SafetyPage', SafetyPage],
  ['CommunityPage', CommunityPage],
  ['ProfilePage', ProfilePage],
  ['RailwayExplorer', RailwayExplorer],
  ['TripPlanner', TripPlanner],
  ['MyTrips', MyTrips],
  ['DestinationDetails', DestinationDetails, {}, '/destination/goa'],
  ['HotelsFinder', HotelsFinder],
  ['FoodCultureExplorer', FoodCultureExplorer],
  ['BudgetCalculator', BudgetCalculator],
  ['EventsExplorer', EventsExplorer],
  ['AIAssistant', AIAssistant],
  ['AuthPage', AuthPage],
  ['Navbar', Navbar, { onOpenCommand: () => {} }],
  ['Footer', Footer],
  ['DestinationCard', DestinationCard, { destination: destinations[0] }],
  ['TravelAssistantChat', TravelAssistantChat, { mode: 'page' }],
  ['CommandPalette', CommandPalette, { open: true, onClose: () => {} }],
];

let failures = 0;
let warnings = 0;

for (const [name, Component, props = {}, route = '/'] of cases) {
  try {
    const child =
      name === 'DestinationDetails'
        ? React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: '/destination/:name', element: React.createElement(Component, props) })
          )
        : React.createElement(Component, props);

    const tree = React.createElement(
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
            React.createElement(AuthProvider, null, React.createElement(AssistantProvider, null, child))
          )
        )
      )
    );

    const container = document.createElement('div');
    document.body.appendChild(container);

    let root;
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => errors.push(String(args[0]));

    await act(async () => {
      root = createRoot(container);
      root.render(tree);
    });

    const html = container.innerHTML || document.body.innerHTML;

    await act(async () => root.unmount());
    container.remove();
    console.error = originalError;

    if (!html || html.length < 40) throw new Error('rendered almost nothing');

    const realErrors = errors.filter((message) => !/useLayoutEffect|not wrapped in act|ReactDOMTestUtils.act|React Router Future Flag/.test(message));
    if (realErrors.length) {
      warnings += realErrors.length;
      console.log(`! ${name.padEnd(22)} ${realErrors[0].slice(0, 160)}`);
    } else {
      console.log(`✓ ${name.padEnd(22)} ${html.length.toLocaleString()} chars`);
    }
  } catch (error) {
    failures += 1;
    process.stdout.write(`x ${name}\n   ${error.message}\n${(error.stack || '').split('\n').slice(1, 4).join('\n')}\n`);
  }
}

console.log(
  failures === 0 && warnings === 0
    ? '\nAll components rendered cleanly.'
    : `\n${failures} failed, ${warnings} with React warnings.`
);
process.exit(failures === 0 ? 0 : 1);
