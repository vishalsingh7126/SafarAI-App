import { useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge, { Chip } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Field, Input, Select } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { cn } from '../lib/cn';

const CATEGORY_OPTIONS = ['Attractions', 'Restaurants', 'Hotels', 'Cafes'];

const CATEGORY_ICONS = {
  Attractions: 'camera',
  Restaurants: 'utensils',
  Hotels: 'hotel',
  Cafes: 'coffee',
};

/* Original mock dataset, extended with more cities and entries -------------- */
const PLACE_DATA = {
  goa: {
    coords: { lat: 15.3, lng: 74.1 },
    places: [
      { name: 'Baga Beach', category: 'Attractions', description: 'Popular beach with water sports, nightlife, and lively local markets.', rating: 4.4, priceLevel: '₹₹' },
      { name: 'Fort Aguada', category: 'Attractions', description: 'Historic Portuguese fort with sea views and scenic sunset points.', rating: 4.5, priceLevel: '₹' },
      { name: 'Cafe Mambo', category: 'Cafes', description: 'Beachside cafe known for music, bites, and late-evening ambience.', rating: 4.2, priceLevel: '₹₹₹' },
      { name: "Martin's Corner", category: 'Restaurants', description: 'Legendary Goan seafood institution in Betalbatim with live music.', rating: 4.6, priceLevel: '₹₹₹' },
      { name: 'Taj Exotica Resort & Spa', category: 'Hotels', description: '56 acres of gardens behind Benaulim beach in quiet South Goa.', rating: 4.6, priceLevel: '₹₹₹₹' },
      { name: 'Artjuna Cafe', category: 'Cafes', description: 'Garden cafe in Anjuna serving Mediterranean plates and cold brew.', rating: 4.5, priceLevel: '₹₹' },
    ],
  },
  delhi: {
    coords: { lat: 28.61, lng: 77.21 },
    places: [
      { name: 'Red Fort', category: 'Attractions', description: 'Iconic Mughal-era fort complex with museums and architecture.', rating: 4.5, priceLevel: '₹' },
      { name: 'India Gate', category: 'Attractions', description: 'Landmark war memorial surrounded by gardens and evening food stalls.', rating: 4.6, priceLevel: 'Free' },
      { name: 'Chandni Chowk', category: 'Restaurants', description: 'Historic market lane famous for authentic street food and old-city vibes.', rating: 4.4, priceLevel: '₹' },
      { name: 'Humayun’s Tomb', category: 'Attractions', description: 'UNESCO-listed garden tomb that inspired the Taj Mahal.', rating: 4.7, priceLevel: '₹' },
      { name: 'Indian Accent', category: 'Restaurants', description: 'Modern Indian tasting menus in a refined Lodhi Road setting.', rating: 4.8, priceLevel: '₹₹₹₹' },
      { name: 'Blue Tokai, Champa Gali', category: 'Cafes', description: 'Specialty roastery tucked into a leafy Saket art lane.', rating: 4.4, priceLevel: '₹₹' },
      { name: 'The Imperial', category: 'Hotels', description: '1936 art-deco hotel on Janpath with a colonial-era art collection.', rating: 4.7, priceLevel: '₹₹₹₹' },
    ],
  },
  mumbai: {
    coords: { lat: 19.08, lng: 72.88 },
    places: [
      { name: 'Gateway of India', category: 'Attractions', description: 'Waterfront monument and city icon with ferry access and photo spots.', rating: 4.6, priceLevel: 'Free' },
      { name: 'Marine Drive', category: 'Attractions', description: 'Scenic seaside promenade perfect for evening walks and city views.', rating: 4.7, priceLevel: 'Free' },
      { name: 'Leopold Cafe', category: 'Cafes', description: 'Historic cafe in Colaba known for global travelers and classic ambience.', rating: 4.1, priceLevel: '₹₹' },
      { name: 'Britannia & Co.', category: 'Restaurants', description: 'Irani institution famous for berry pulao and caramel custard.', rating: 4.5, priceLevel: '₹₹' },
      { name: 'The Taj Mahal Palace', category: 'Hotels', description: 'The 1903 harbourfront landmark beside the Gateway of India.', rating: 4.8, priceLevel: '₹₹₹₹' },
      { name: 'Kala Ghoda Cafe', category: 'Cafes', description: 'Minimal courtyard cafe with single-origin coffee near the art district.', rating: 4.4, priceLevel: '₹₹' },
    ],
  },
  jaipur: {
    coords: { lat: 26.91, lng: 75.78 },
    places: [
      { name: 'Amber Fort', category: 'Attractions', description: 'Hilltop fort with mirrored halls, ramparts and an evening light show.', rating: 4.7, priceLevel: '₹₹' },
      { name: 'Hawa Mahal', category: 'Attractions', description: 'The five-storey palace of winds overlooking the old city bazaar.', rating: 4.5, priceLevel: '₹' },
      { name: 'Tapri Central', category: 'Cafes', description: 'Rooftop chai cafe with views over Central Park.', rating: 4.4, priceLevel: '₹₹' },
      { name: 'Laxmi Misthan Bhandar', category: 'Restaurants', description: 'Century-old sweet shop and thali institution on Johari Bazaar.', rating: 4.4, priceLevel: '₹' },
      { name: 'Samode Haveli', category: 'Hotels', description: 'A 175-year-old haveli inside the old city walls with a courtyard pool.', rating: 4.6, priceLevel: '₹₹₹' },
    ],
  },
  kerala: {
    coords: { lat: 9.93, lng: 76.26 },
    places: [
      { name: 'Alleppey Backwaters', category: 'Attractions', description: 'Houseboat cruises through palm-lined canals and paddy fields.', rating: 4.8, priceLevel: '₹₹₹' },
      { name: 'Fort Kochi Beach', category: 'Attractions', description: 'Chinese fishing nets, colonial streets and sunset ferry rides.', rating: 4.4, priceLevel: 'Free' },
      { name: 'Kashi Art Cafe', category: 'Cafes', description: 'Fort Kochi favourite serving strong filter coffee and art shows.', rating: 4.5, priceLevel: '₹₹' },
      { name: 'Dhe Puttu', category: 'Restaurants', description: 'Modern Malabar dining built around puttu and slow-cooked curries.', rating: 4.3, priceLevel: '₹₹' },
      { name: 'Windermere Estate, Munnar', category: 'Hotels', description: 'A working cardamom plantation above Munnar with valley-view cottages.', rating: 4.5, priceLevel: '₹₹₹' },
    ],
  },
};

const CITY_LABELS = { goa: 'Goa', delhi: 'Delhi', mumbai: 'Mumbai', jaipur: 'Jaipur', kerala: 'Kerala' };

function distanceKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function NearbyExplorer() {
  usePageMeta(
    'Nearby Places Explorer | SafarAI',
    'Discover nearby attractions, restaurants, hotels, and cafes in your destination with SafarAI.'
  );

  const toast = useToast();
  const { toggleFavourite, isFavourite, preferences } = useWorkspace();

  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState('Attractions');
  const [sort, setSort] = useState('rating');
  const [searchedDestination, setSearchedDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const cityKey = searchedDestination.trim().toLowerCase();
  const cityEntry = PLACE_DATA[cityKey];

  const places = useMemo(() => {
    const all = cityEntry?.places || [];
    const filtered = category === 'All' ? all : all.filter((place) => place.category === category);
    const sorted = [...filtered];
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [cityEntry, category, sort]);

  const runSearch = (value) => {
    const term = (value ?? destination).trim();
    if (!term) return;
    setLoading(true);
    setDestination(term);
    setTimeout(() => {
      setSearchedDestination(term);
      setLoading(false);
    }, 380);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location unavailable', { description: 'Your browser does not support geolocation.' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const here = { lat: position.coords.latitude, lng: position.coords.longitude };
        const nearest = Object.entries(PLACE_DATA)
          .map(([key, value]) => ({ key, km: distanceKm(here, value.coords) }))
          .sort((a, b) => a.km - b.km)[0];
        setLocating(false);
        runSearch(CITY_LABELS[nearest.key]);
        toast.success(`Closest covered city: ${CITY_LABELS[nearest.key]}`, {
          description: `About ${Math.round(nearest.km)} km from your location.`,
        });
      },
      () => {
        setLocating(false);
        toast.error('Could not get your location', { description: 'Allow location access or type a city instead.' });
      },
      { timeout: 8000 }
    );
  };

  const hasSearch = searchedDestination.trim().length > 0;
  const categoryCounts = useMemo(() => {
    const all = cityEntry?.places || [];
    return CATEGORY_OPTIONS.reduce((acc, option) => {
      acc[option] = all.filter((place) => place.category === option).length;
      return acc;
    }, {});
  }, [cityEntry]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Nearby"
        icon="mapPin"
        title="What is worth your time around you"
        description="Attractions, restaurants, cafés and stays curated per city — with ratings, price level and one-tap directions."
        actions={
          <Button variant="secondary" leadingIcon="target" onClick={useMyLocation} loading={locating}>
            Use my location
          </Button>
        }
      />

      <Card padding="lg">
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
          <Field label="Destination" htmlFor="nearby-city" hint={`We cover ${Object.keys(PLACE_DATA).length} cities today`}>
            <Input
              id="nearby-city"
              icon="search"
              list="nearby-cities"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && runSearch()}
              placeholder={`e.g. ${preferences.homeCity || 'Goa'}, Delhi, Mumbai`}
            />
            <datalist id="nearby-cities">
              {Object.values(CITY_LABELS).map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </Field>

          <Field label="Category" htmlFor="nearby-category">
            <Select
              id="nearby-category"
              icon={CATEGORY_ICONS[category] || 'grid'}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="All">All categories</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Button onClick={() => runSearch()} disabled={!destination.trim()} leadingIcon="search" loading={loading} className="sm:mb-0.5">
            Search places
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          {Object.values(CITY_LABELS).map((city) => (
            <Chip key={city} active={searchedDestination === city} onClick={() => runSearch(city)}>
              {city}
            </Chip>
          ))}
        </div>
      </Card>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} media={false} />
          ))}
        </div>
      )}

      {!loading && hasSearch && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-fg">
                {category === 'All' ? 'All places' : category} in{' '}
                <span className="text-brand-600 dark:text-brand-300">{searchedDestination.trim()}</span>
              </h2>
              <p className="text-sm text-fg-muted">{places.length} curated {places.length === 1 ? 'place' : 'places'}</p>
            </div>
            <Select value={sort} onChange={(event) => setSort(event.target.value)} icon="sort" size="sm" className="w-44">
              <option value="rating">Highest rated</option>
              <option value="name">Name A → Z</option>
            </Select>
          </div>

          {cityEntry && (
            <div className="flex flex-wrap gap-2">
              <Chip active={category === 'All'} onClick={() => setCategory('All')} count={cityEntry.places.length}>
                All
              </Chip>
              {CATEGORY_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  icon={CATEGORY_ICONS[option]}
                  active={category === option}
                  onClick={() => setCategory(option)}
                  count={categoryCounts[option]}
                >
                  {option}
                </Chip>
              ))}
            </div>
          )}

          {!cityEntry ? (
            <EmptyState
              icon="mapPin"
              title={`We have not mapped ${searchedDestination.trim()} yet`}
              description="Try one of our covered cities, or ask the assistant for recommendations anywhere in India."
              action={{ label: 'Try Goa', onClick: () => runSearch('Goa'), icon: 'compass' }}
              secondaryAction={{ label: 'Ask the AI assistant', to: '/assistant', icon: 'bot' }}
            />
          ) : places.length === 0 ? (
            <EmptyState
              compact
              icon={CATEGORY_ICONS[category] || 'search'}
              title={`No ${category.toLowerCase()} listed for ${searchedDestination.trim()}`}
              description="Switch category — attractions usually have the deepest coverage."
              action={{ label: 'Show all categories', onClick: () => setCategory('All'), icon: 'grid' }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {places.map((place) => {
                const id = `place-${searchedDestination}-${place.name}`.toLowerCase().replace(/\s+/g, '-');
                const saved = isFavourite(id);
                return (
                  <Card key={place.name} padding="lg" interactive className="flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600',
                          'dark:bg-brand-500/12 dark:text-brand-300'
                        )}
                      >
                        <Icon name={CATEGORY_ICONS[place.category]} size="md" />
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const added = toggleFavourite({
                            id,
                            type: 'place',
                            title: place.name,
                            subtitle: `${place.category} · ${searchedDestination.trim()}`,
                            href: '/nearby',
                          });
                          toast[added ? 'success' : 'info'](added ? `${place.name} saved` : 'Removed from saved');
                        }}
                        aria-pressed={saved}
                        aria-label={saved ? `Remove ${place.name}` : `Save ${place.name}`}
                        className="rounded-full p-1.5 text-fg-subtle transition hover:bg-surface-muted"
                      >
                        <Icon name="heart" size="sm" filled={saved} className={saved ? 'text-rose-500' : undefined} />
                      </button>
                    </div>

                    <h3 className="mt-4 text-base font-bold text-fg">{place.name}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge tone="neutral" size="sm">
                        {place.category}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-2xs font-bold text-gold-600 dark:text-gold-400">
                        <Icon name="star" size="xs" filled /> {place.rating}
                      </span>
                      <span className="text-2xs font-semibold text-fg-subtle">{place.priceLevel}</span>
                    </div>

                    <p className="mt-3 flex-1 text-sm leading-6 text-fg-muted">{place.description}</p>

                    <Button
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${place.name} ${searchedDestination.trim()}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                      variant="secondary"
                      className="mt-4"
                      leadingIcon="mapPin"
                    >
                      Directions
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!loading && !hasSearch && (
        <EmptyState
          icon="mapPin"
          title="Search a city to see what is nearby"
          description="Pick one of the covered cities above, or let SafarAI detect the closest one to you."
          action={{ label: 'Use my location', onClick: useMyLocation, icon: 'target' }}
          secondaryAction={{ label: 'Browse destinations', to: '/explore', icon: 'compass' }}
        />
      )}
    </div>
  );
}

export default NearbyExplorer;
