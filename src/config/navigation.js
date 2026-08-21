/**
 * Single source of truth for product navigation.
 * Used by the navbar, the mobile drawer, the footer and the command palette
 * so every surface stays in sync.
 */

export const navGroups = [
  {
    id: 'plan',
    label: 'Plan',
    icon: 'sparkles',
    description: 'Build the trip end to end',
    items: [
      {
        to: '/trip-planner',
        label: 'AI Trip Planner',
        description: 'Generate a day-by-day itinerary',
        icon: 'sparkles',
        badge: 'AI',
      },
      {
        to: '/plan-trip',
        label: 'Planning Workspace',
        description: 'Checklist, timeline & trip health',
        icon: 'layers',
      },
      {
        to: '/budget',
        label: 'Budget Calculator',
        description: 'Forecast cost by style & season',
        icon: 'wallet',
      },
      {
        to: '/my-trips',
        label: 'My Trips',
        description: 'Saved itineraries and plans',
        icon: 'luggage',
      },
    ],
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: 'compass',
    description: 'Find where to go next',
    items: [
      {
        to: '/world',
        label: '3D World Explorer',
        description: 'Photoreal globe and terrain map',
        icon: 'globe',
        badge: 'New',
      },
      {
        to: '/explore',
        label: 'Destination Explorer',
        description: 'Search, filter and compare places',
        icon: 'compass',
      },
      {
        to: '/nearby',
        label: 'Nearby Places',
        description: 'Attractions, cafés and stays around you',
        icon: 'mapPin',
      },
      {
        to: '/hotels',
        label: 'Hotels & Stays',
        description: 'Filter by price, rating and amenities',
        icon: 'hotel',
      },
      {
        to: '/food-culture',
        label: 'Food & Culture',
        description: 'Signature dishes and local experiences',
        icon: 'utensils',
      },
      {
        to: '/events',
        label: 'Events & Activities',
        description: 'What is happening while you are there',
        icon: 'ticket',
      },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: 'train',
    description: 'Move between places safely',
    items: [
      {
        to: '/railway',
        label: 'Railway Explorer',
        description: 'Trains, PNR and station intel',
        icon: 'train',
      },
      {
        to: '/transport',
        label: 'Transport Hub',
        description: 'Compare rail, road, air and local transit',
        icon: 'car',
      },
      {
        to: '/safety',
        label: 'Safety Intelligence',
        description: 'Risk scores, SOS kit and advisories',
        icon: 'shield',
      },
    ],
  },
];

export const primaryLinks = [
  { to: '/', label: 'Home', icon: 'compass' },
  { to: '/assistant', label: 'AI Assistant', icon: 'bot' },
  { to: '/community', label: 'Community', icon: 'users' },
];

export const allNavItems = [
  ...primaryLinks.map((item) => ({ ...item, group: 'General' })),
  ...navGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))),
  { to: '/profile', label: 'Dashboard & Profile', icon: 'user', group: 'Account', description: 'Your travel dashboard' },
];

export const footerColumns = [
  {
    title: 'Plan',
    links: navGroups[0].items.map(({ to, label }) => ({ to, label })),
  },
  {
    title: 'Discover',
    links: navGroups[1].items.map(({ to, label }) => ({ to, label })),
  },
  {
    title: 'Travel & Safety',
    links: [
      ...navGroups[2].items.map(({ to, label }) => ({ to, label })),
      { to: '/community', label: 'Community' },
    ],
  },
];

export default navGroups;
