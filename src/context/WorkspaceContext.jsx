import { createContext, useCallback, useContext, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

/**
 * WorkspaceContext — the personalisation layer of SafarAI.
 *
 * Everything is persisted locally (no backend change required) and the
 * original storage keys/shapes are preserved so existing saved data keeps
 * working:
 *   • `safarai_trips`    — itineraries saved from the Trip Planner
 *   • `safarai_events`   — user created events (managed by EventsExplorer)
 * New keys add favourites, recently viewed items and an activity feed.
 */

const TRIPS_KEY = 'safarai_trips';
const FAVOURITES_KEY = 'safarai_favourites';
const RECENT_KEY = 'safarai_recent';
const ACTIVITY_KEY = 'safarai_activity';
const PREFS_KEY = 'safarai_preferences';
const SEARCHES_KEY = 'safarai_recent_searches';

const defaultPreferences = {
  homeCity: 'Delhi',
  currency: 'INR',
  travelStyle: 'cultural',
  interests: ['culture', 'food'],
  reducedImagery: false,
};

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [trips, setTrips] = useLocalStorage(TRIPS_KEY, []);
  const [favourites, setFavourites] = useLocalStorage(FAVOURITES_KEY, []);
  const [recent, setRecent] = useLocalStorage(RECENT_KEY, []);
  const [activity, setActivity] = useLocalStorage(ACTIVITY_KEY, []);
  const [preferences, setPreferences] = useLocalStorage(PREFS_KEY, defaultPreferences);
  const [recentSearches, setRecentSearches] = useLocalStorage(SEARCHES_KEY, []);

  /* ---------------------------------------------------------------- activity */
  const logActivity = useCallback(
    (entry) => {
      setActivity((prev) =>
        [
          {
            id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            at: new Date().toISOString(),
            ...entry,
          },
          ...prev,
        ].slice(0, 40)
      );
    },
    [setActivity]
  );

  /* ------------------------------------------------------------------- trips */
  const addTrip = useCallback(
    (trip) => {
      const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        dateCreated: new Date().toISOString(),
        ...trip,
      };
      setTrips((prev) => [...(Array.isArray(prev) ? prev : []), record]);
      logActivity({
        type: 'trip',
        title: `Saved a ${record.days}-day trip to ${record.destination}`,
        href: '/my-trips',
        icon: 'luggage',
      });
      return record;
    },
    [setTrips, logActivity]
  );

  const deleteTrip = useCallback(
    (id) => {
      setTrips((prev) => (Array.isArray(prev) ? prev.filter((trip) => trip.id !== id) : []));
    },
    [setTrips]
  );

  const updateTrip = useCallback(
    (id, patch) => {
      setTrips((prev) =>
        (Array.isArray(prev) ? prev : []).map((trip) => (trip.id === id ? { ...trip, ...patch } : trip))
      );
    },
    [setTrips]
  );

  /* -------------------------------------------------------------- favourites */
  const isFavourite = useCallback(
    (id) => favourites.some((item) => item.id === id),
    [favourites]
  );

  const toggleFavourite = useCallback(
    (item) => {
      let added = false;
      setFavourites((prev) => {
        const exists = prev.some((entry) => entry.id === item.id);
        added = !exists;
        return exists
          ? prev.filter((entry) => entry.id !== item.id)
          : [{ ...item, savedAt: new Date().toISOString() }, ...prev].slice(0, 60);
      });
      logActivity({
        type: 'favourite',
        title: `${added ? 'Saved' : 'Removed'} ${item.title}`,
        href: item.href,
        icon: 'heart',
      });
      return added;
    },
    [setFavourites, logActivity]
  );

  const clearFavourites = useCallback(() => setFavourites([]), [setFavourites]);

  /* ----------------------------------------------------------- recently seen */
  const trackView = useCallback(
    (item) => {
      if (!item?.id) return;
      setRecent((prev) =>
        [{ ...item, viewedAt: new Date().toISOString() }, ...prev.filter((entry) => entry.id !== item.id)].slice(
          0,
          12
        )
      );
    },
    [setRecent]
  );

  const clearRecent = useCallback(() => setRecent([]), [setRecent]);

  /* --------------------------------------------------------- recent searches */
  const trackSearch = useCallback(
    (term) => {
      const value = String(term || '').trim();
      if (value.length < 2) return;
      setRecentSearches((prev) => [value, ...prev.filter((entry) => entry.toLowerCase() !== value.toLowerCase())].slice(0, 8));
    },
    [setRecentSearches]
  );

  const clearSearches = useCallback(() => setRecentSearches([]), [setRecentSearches]);

  /* ------------------------------------------------------------- preferences */
  const updatePreferences = useCallback(
    (patch) => setPreferences((prev) => ({ ...defaultPreferences, ...prev, ...patch })),
    [setPreferences]
  );

  const value = useMemo(
    () => ({
      trips: Array.isArray(trips) ? trips : [],
      addTrip,
      deleteTrip,
      updateTrip,
      favourites,
      isFavourite,
      toggleFavourite,
      clearFavourites,
      recent,
      trackView,
      clearRecent,
      recentSearches,
      trackSearch,
      clearSearches,
      activity,
      logActivity,
      preferences: { ...defaultPreferences, ...preferences },
      updatePreferences,
    }),
    [
      trips,
      addTrip,
      deleteTrip,
      updateTrip,
      favourites,
      isFavourite,
      toggleFavourite,
      clearFavourites,
      recent,
      trackView,
      clearRecent,
      recentSearches,
      trackSearch,
      clearSearches,
      activity,
      logActivity,
      preferences,
      updatePreferences,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  return context;
}

export default WorkspaceContext;
