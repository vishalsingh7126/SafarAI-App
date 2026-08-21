import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge, { Chip } from '../components/ui/Badge';
import Rating from '../components/ui/Rating';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Field, Input, Select, Checkbox, RangeSlider } from '../components/ui/Input';
import { cities, hotelsDatabase } from '../data/hotelsDatabase';
import DestinationImage from '../components/DestinationImage';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../lib/format';
import { cn } from '../lib/cn';

const AMENITY_LABELS = {
  wifi: 'Free WiFi',
  pool: 'Pool',
  breakfast: 'Breakfast included',
  parking: 'Parking',
};

const AMENITY_ICONS = {
  wifi: 'wifi',
  pool: 'pool',
  breakfast: 'coffee',
  parking: 'car',
};

const TIER_LABELS = { budget: 'Budget', standard: 'Standard', luxury: 'Luxury' };

const MAX_PRICE = Math.max(...hotelsDatabase.map((hotel) => hotel.pricePerNight));

function HotelCard({ hotel, nights, guests, onView }) {
  const { isFavourite, toggleFavourite } = useWorkspace();
  const toast = useToast();
  const saved = isFavourite(`hotel-${hotel.id}`);
  const totalCost = nights > 0 ? hotel.pricePerNight * nights : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift sm:flex-row">
      <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-auto sm:w-44">
        <DestinationImage
          destination={hotel}
          width={480}
          className="h-full w-full"
          imgClassName="transition-transform duration-700 group-hover:scale-110"
        />
        <span className="absolute left-2 top-2 rounded-full bg-slate-950/55 px-2 py-1 text-2xs font-bold text-white backdrop-blur">
          {hotel.city}
        </span>
        <button
          type="button"
          onClick={() => {
            const added = toggleFavourite({
              id: `hotel-${hotel.id}`,
              type: 'hotel',
              title: hotel.name,
              subtitle: `${hotel.city} · ${formatINR(hotel.pricePerNight)}/night`,
              href: `/hotels?city=${encodeURIComponent(hotel.city)}`,
            });
            toast[added ? 'success' : 'info'](added ? `${hotel.name} saved` : 'Removed from saved');
          }}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${hotel.name} from saved` : `Save ${hotel.name}`}
          className={cn(
            'absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition',
            saved
              ? 'border-rose-300 bg-rose-500 text-white'
              : 'border-white/35 bg-slate-950/40 text-white hover:bg-slate-950/65'
          )}
        >
          <Icon name="heart" size="sm" filled={saved} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-fg">{hotel.name}</h3>
            <p className="mt-0.5 truncate text-2xs text-fg-subtle">{hotel.address}</p>
            <div className="mt-1 flex items-center gap-2">
              <Rating value={hotel.rating} />
              <span className="text-xs text-fg-subtle">
                {hotel.rating}-star{hotel.opened ? ` · est. ${hotel.opened}` : ''}
              </span>
            </div>
          </div>
          <Badge tone={hotel.tier === 'luxury' ? 'warning' : hotel.tier === 'standard' ? 'brand' : 'success'} size="sm" uppercase>
            {TIER_LABELS[hotel.tier]}
          </Badge>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-fg-muted">{hotel.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {hotel.amenities.map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-muted px-2 py-1 text-2xs font-semibold text-fg-muted"
            >
              <Icon name={AMENITY_ICONS[amenity]} size="xs" />
              {AMENITY_LABELS[amenity]}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-2xs uppercase tracking-wide text-fg-subtle">From / night</p>
            <p className="text-xl font-extrabold text-fg">{formatINR(hotel.pricePerNight)}</p>
            {totalCost && (
              <p className="text-2xs text-fg-muted">
                {formatINR(totalCost)} total · {nights} night{nights !== 1 ? 's' : ''} · {guests} guest
                {guests !== '1' ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => onView(hotel)} leadingIcon="eye">
              Details
            </Button>
            <Button size="sm" onClick={() => onView(hotel)} leadingIcon="bookmark">
              Book stay
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function HotelsFinderPage() {
  usePageMeta('Hotels & Stay Finder | SafarAI', 'Search and discover hotels across popular Indian destinations with SafarAI.');

  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsRef = useRef(setSearchParams);
  searchParamsRef.current = setSearchParams;

  const [city, setCity] = useState(searchParams.get('city') || '');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [hasSearched, setHasSearched] = useState(Boolean(searchParams.get('city')));
  const [loading, setLoading] = useState(false);

  const [tiers, setTiers] = useState({ budget: false, standard: false, luxury: false });
  const [ratings, setRatings] = useState({ 3: false, 4: false, 5: false });
  const [amenities, setAmenities] = useState({ wifi: false, pool: false, breakfast: false, parking: false });
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const toast = useToast();

  const toggleTier = (key) => setTiers((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleRating = (key) => setRatings((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleAmenity = (key) => setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut) - new Date(checkIn);
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  }, [checkIn, checkOut]);

  const invalidDates = Boolean(checkIn && checkOut && nights <= 0);

  const handleSearch = () => {
    setLoading(true);
    setHasSearched(true);
    searchParamsRef.current(city ? { city } : {}, { replace: true });
    setTimeout(() => setLoading(false), 420);
  };

  useEffect(() => {
    if (!searchParams.get('city')) return;
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    if (!hasSearched) return [];

    const activeTiers = Object.keys(tiers).filter((key) => tiers[key]);
    const activeRatings = Object.keys(ratings)
      .filter((key) => ratings[key])
      .map(Number);
    const activeAmenities = Object.keys(amenities).filter((key) => amenities[key]);

    const list = hotelsDatabase.filter((hotel) => {
      if (city.trim() && hotel.city.toLowerCase() !== city.trim().toLowerCase()) return false;
      if (activeTiers.length && !activeTiers.includes(hotel.tier)) return false;
      if (activeRatings.length && !activeRatings.includes(hotel.rating)) return false;
      if (activeAmenities.length && !activeAmenities.every((amenity) => hotel.amenities.includes(amenity))) return false;
      if (hotel.pricePerNight > maxPrice) return false;
      return true;
    });

    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
    if (sort === 'price-desc') sorted.sort((a, b) => b.pricePerNight - a.pricePerNight);
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    if (sort === 'recommended') sorted.sort((a, b) => b.rating - a.rating || a.pricePerNight - b.pricePerNight);
    return sorted;
  }, [hasSearched, city, tiers, ratings, amenities, maxPrice, sort]);

  const activeFilters =
    Object.values(tiers).filter(Boolean).length +
    Object.values(ratings).filter(Boolean).length +
    Object.values(amenities).filter(Boolean).length +
    (maxPrice < MAX_PRICE ? 1 : 0);

  const resetFilters = () => {
    setTiers({ budget: false, standard: false, luxury: false });
    setRatings({ 3: false, 4: false, 5: false });
    setAmenities({ wifi: false, pool: false, breakfast: false, parking: false });
    setMaxPrice(MAX_PRICE);
    toast.info('Filters cleared');
  };

  const renderFilters = (prefix) => (
    <div className="space-y-6">
      <div>
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-fg-subtle">Price tier</p>
        <div className="space-y-2">
          {Object.keys(TIER_LABELS).map((key) => (
            <Checkbox
              key={key}
              id={`${prefix}-tier-${key}`}
              checked={tiers[key]}
              onChange={() => toggleTier(key)}
              label={TIER_LABELS[key]}
              count={hotelsDatabase.filter((hotel) => hotel.tier === key).length}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <RangeSlider
          id={`${prefix}-price-filter`}
          label="Max price / night"
          min={1500}
          max={MAX_PRICE}
          step={500}
          value={maxPrice}
          onChange={setMaxPrice}
          format={(value) => formatINR(value, { compact: true })}
        />
      </div>

      <div className="border-t border-line pt-5">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-fg-subtle">Hotel rating</p>
        <div className="space-y-2">
          {[5, 4, 3].map((value) => (
            <Checkbox
              key={value}
              id={`${prefix}-rating-${value}`}
              checked={ratings[value]}
              onChange={() => toggleRating(value)}
              label={`${value}★ and above`}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-fg-subtle">Amenities</p>
        <div className="space-y-2">
          {Object.keys(AMENITY_LABELS).map((key) => (
            <Checkbox
              key={key}
              id={`${prefix}-amenity-${key}`}
              checked={amenities[key]}
              onChange={() => toggleAmenity(key)}
              label={AMENITY_LABELS[key]}
            />
          ))}
        </div>
      </div>

      <Button variant="secondary" fullWidth leadingIcon="refresh" onClick={resetFilters} disabled={!activeFilters}>
        Reset filters
      </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Stays"
        icon="hotel"
        title="Find the right place to stay"
        description="Real, verified properties — palace hotels to hostels — filtered by tier, rating and amenities. Prices are indicative published rates."
        stats={[
          { label: 'Properties', value: hotelsDatabase.length },
          { label: 'Cities', value: cities.length },
          { label: 'In results', value: hasSearched ? results.length : '—' },
        ]}
      />

      {/* search */}
      <Card padding="lg">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Destination / city" htmlFor="hf-city">
            <Select id="hf-city" icon="mapPin" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">All cities</option>
              {cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Check-in" htmlFor="hf-in">
            <Input id="hf-in" type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
          </Field>

          <Field
            label="Check-out"
            htmlFor="hf-out"
            error={invalidDates ? 'Check-out must be after check-in.' : undefined}
          >
            <Input
              id="hf-out"
              type="date"
              value={checkOut}
              min={checkIn || undefined}
              invalid={invalidDates}
              onChange={(event) => setCheckOut(event.target.value)}
            />
          </Field>

          <Field label="Guests" htmlFor="hf-guests">
            <Select id="hf-guests" icon="users" value={guests} onChange={(event) => setGuests(event.target.value)}>
              {Array.from({ length: 8 }, (_, index) => String(index + 1)).map((value) => (
                <option key={value} value={value}>
                  {value} guest{value !== '1' ? 's' : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <div className="flex flex-wrap gap-2">
            {cities.slice(0, 5).map((item) => (
              <Chip key={item} active={city === item} onClick={() => setCity(city === item ? '' : item)}>
                {item}
              </Chip>
            ))}
          </div>
          <Button onClick={handleSearch} leadingIcon="search" loading={loading}>
            Search hotels
          </Button>
        </div>
      </Card>

      {!hasSearched ? (
        <EmptyState
          icon="hotel"
          title="Search stays to see availability"
          description="Pick a city (or search all cities), add your dates, and filter by the amenities that matter to you."
          action={{ label: 'Search all cities', onClick: handleSearch, icon: 'search' }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
          <aside className="hidden lg:block">
            <Card padding="md" className="sticky top-[calc(var(--nav-h)+1.5rem)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-fg">Filters</h2>
                {activeFilters > 0 && (
                  <Badge tone="brand" size="sm">
                    {activeFilters}
                  </Badge>
                )}
              </div>
              {renderFilters('desktop')}
            </Card>
          </aside>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-fg-muted">
                {loading
                  ? 'Searching stays…'
                  : `${results.length} ${results.length === 1 ? 'stay' : 'stays'}${city ? ` in ${city}` : ' across all cities'}`}
              </p>
              <div className="flex items-center gap-2">
                {nights > 0 && (
                  <Badge tone="neutral" icon="calendar">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </Badge>
                )}
                <Select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  icon="sort"
                  size="sm"
                  className="w-44"
                  aria-label="Sort hotels"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="rating">Highest rated</option>
                </Select>
                <Button variant="secondary" size="sm" leadingIcon="filter" onClick={() => setFiltersOpen(true)} className="lg:hidden">
                  Filters{activeFilters ? ` (${activeFilters})` : ''}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonCard key={index} media={false} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                icon="hotel"
                title="No stays match these filters"
                description="Loosen the price cap or clear an amenity filter — we index 18 properties across 6 cities."
                action={{ label: 'Reset filters', onClick: resetFilters, icon: 'refresh' }}
                secondaryAction={{ label: 'Search all cities', onClick: () => setCity(''), icon: 'globe' }}
              />
            ) : (
              <div className="space-y-4">
                {results.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} nights={nights} guests={guests} onView={setDetail} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" icon="filter"
        footer={
          <>
            <Button variant="secondary" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Show {results.length} stays</Button>
          </>
        }
      >
        {renderFilters('mobile')}
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name} icon="hotel" size="lg">
        {detail && (
          <div className="space-y-5">
            <DestinationImage destination={detail} width={900} rounded="rounded-xl" className="h-48 w-full" />
            <div className="flex flex-wrap items-center gap-3">
              <Rating value={detail.rating} showValue />
              <Badge tone={detail.tier === 'luxury' ? 'warning' : detail.tier === 'standard' ? 'brand' : 'success'}>
                {TIER_LABELS[detail.tier]}
              </Badge>
              <Badge tone="neutral" icon="mapPin">
                {detail.city}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-fg-muted">{detail.description}</p>

            <div className="grid gap-2 sm:grid-cols-2">
              {detail.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm text-fg-muted">
                  <Icon name={AMENITY_ICONS[amenity]} size="sm" className="text-brand-500" />
                  {AMENITY_LABELS[amenity]}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${detail.name} ${detail.city}`
                )}`}
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="secondary"
                leadingIcon="mapPin"
              >
                {detail.address}
              </Button>
              {detail.wiki && (
                <Button
                  href={`https://en.wikipedia.org/wiki/${detail.wiki}`}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  variant="ghost"
                  trailingIcon="arrowUpRight"
                >
                  About this hotel
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-line bg-surface-muted p-4">
              <div>
                <p className="text-2xs uppercase tracking-wide text-fg-subtle">From / night</p>
                <p className="text-2xl font-extrabold text-fg">{formatINR(detail.pricePerNight)}</p>
                {nights > 0 && (
                  <p className="text-xs text-fg-muted">
                    {formatINR(detail.pricePerNight * nights)} for {nights} night{nights !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <Button
                leadingIcon="checkCircle"
                onClick={() => {
                  setDetail(null);
                  toast.success('Stay shortlisted', {
                    description: `${detail.name} was added to your saved list. Booking partners launch soon.`,
                  });
                }}
              >
                Add to shortlist
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default HotelsFinderPage;
