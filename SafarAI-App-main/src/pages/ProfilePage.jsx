import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useSyncedSearchParams from '../hooks/useSyncedSearchParams';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader, SectionHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge, { Chip } from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Rating';
import { Field, Input, Select, Switch } from '../components/ui/Input';
import { Progress } from '../components/ui/Progress';
import { BarChart, DonutChart, Sparkline } from '../components/charts/Charts';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { destinations } from '../data/destinations';
import { formatINR, formatRelative, formatDate } from '../lib/format';
import { cn } from '../lib/cn';

const TYPE_META = {
  destination: { icon: 'mapPin', label: 'Destinations' },
  hotel: { icon: 'hotel', label: 'Stays' },
  food: { icon: 'utensils', label: 'Food' },
  place: { icon: 'camera', label: 'Places' },
  train: { icon: 'train', label: 'Trains' },
  station: { icon: 'building', label: 'Stations' },
};

const INTEREST_OPTIONS = ['culture', 'food', 'nature', 'adventure', 'beach', 'wellness', 'heritage', 'nightlife'];

function ProfilePage() {
  usePageMeta('Dashboard | SafarAI', 'Manage account preferences, saved trips, and personalization settings in SafarAI.');

  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview');
  const [savedFilter, setSavedFilter] = useState('all');

  const {
    trips,
    favourites,
    recent,
    activity,
    preferences,
    updatePreferences,
    clearRecent,
    clearFavourites,
    toggleFavourite,
  } = useWorkspace();
  const { user, displayName, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  useSyncedSearchParams({ tab: tab === 'overview' ? '' : tab });

  /* ---------------------------------------------------------------- derived */
  const totalDays = trips.reduce((sum, trip) => sum + (trip.days || trip.itinerary?.length || 0), 0);
  const totalSpend = trips.reduce((sum, trip) => sum + (trip.estimate || 0), 0);

  const styleBreakdown = useMemo(() => {
    const counts = trips.reduce((acc, trip) => {
      const key = trip.travelStyle || 'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const palette = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#a855f7', '#f43f5e'];
    return Object.entries(counts).map(([label, value], index) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
      color: palette[index % palette.length],
    }));
  }, [trips]);

  const monthlyActivity = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const label = date.toLocaleDateString('en-IN', { month: 'short' });
      const count =
        trips.filter((trip) => {
          const created = new Date(trip.dateCreated);
          return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
        }).length +
        activity.filter((entry) => {
          const at = new Date(entry.at);
          return at.getMonth() === date.getMonth() && at.getFullYear() === date.getFullYear();
        }).length;
      return { label, value: count };
    });
  }, [trips, activity]);

  const filteredFavourites =
    savedFilter === 'all' ? favourites : favourites.filter((item) => item.type === savedFilter);

  const savedTypes = [...new Set(favourites.map((item) => item.type))];

  const recommendations = useMemo(() => {
    const savedSlugs = favourites
      .filter((item) => item.type === 'destination')
      .map((item) => item.id.replace('dest-', ''));
    const interests = preferences.interests || [];
    return destinations
      .filter((item) => !savedSlugs.includes(item.slug))
      .map((item) => ({
        item,
        score:
          item.interests.filter((interest) => interests.includes(interest)).length * 2 +
          (item.safetyScore > 85 ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score || b.item.rating - a.item.rating)
      .slice(0, 3)
      .map((entry) => entry.item);
  }, [favourites, preferences.interests]);

  const profileCompletion = useMemo(() => {
    let score = 20;
    if (user) score += 25;
    if (trips.length) score += 20;
    if (favourites.length) score += 15;
    if (preferences.interests?.length) score += 20;
    return Math.min(100, score);
  }, [user, trips.length, favourites.length, preferences.interests]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        icon="chart"
        title={user ? `Welcome back, ${displayName}` : 'Your travel dashboard'}
        description={
          user
            ? 'Everything you have planned, saved and explored — in one analytical view.'
            : 'You are browsing as a guest. Your trips and saved items are stored on this device; sign in to keep them across devices.'
        }
        actions={
          user ? (
            <>
              <Button to="/trip-planner" leadingIcon="sparkles">
                New trip
              </Button>
              <Button
                variant="secondary"
                leadingIcon="logout"
                onClick={async () => {
                  await signOut().catch(() => {});
                  toast.success('Signed out');
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button to="/auth" leadingIcon="login">
                Sign in
              </Button>
              <Button to="/trip-planner" variant="secondary" leadingIcon="sparkles">
                Plan a trip
              </Button>
            </>
          )
        }
      />

      {/* identity strip */}
      <Card padding="lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={user ? displayName : 'Guest Traveller'} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-fg">{user ? displayName : 'Guest traveller'}</h2>
              <Badge tone={user ? 'success' : 'neutral'} dot>
                {user ? 'Signed in' : 'Local session'}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-fg-muted">{user?.email || 'Sign in to sync across devices'}</p>
            <div className="mt-3 max-w-sm">
              <Progress value={profileCompletion} label="Profile strength" showValue tone="brand" size="sm" />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" leadingIcon={theme === 'dark' ? 'sun' : 'moon'} onClick={toggleTheme}>
              {theme === 'dark' ? 'Light' : 'Dark'} mode
            </Button>
            <Button variant="secondary" size="sm" leadingIcon="settings" onClick={() => setTab('preferences')}>
              Preferences
            </Button>
          </div>
        </div>
      </Card>

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview', icon: 'chart' },
          { value: 'saved', label: 'Saved', icon: 'heart', count: favourites.length },
          { value: 'trips', label: 'Trips', icon: 'luggage', count: trips.length },
          { value: 'activity', label: 'Activity', icon: 'history', count: activity.length },
          { value: 'preferences', label: 'Preferences', icon: 'settings' },
        ]}
        value={tab}
        onChange={setTab}
        className="w-full overflow-x-auto"
      />

      {/* ------------------------------------------------------------ overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Trips planned"
              numericValue={trips.length}
              icon="luggage"
              tone="brand"
              deltaLabel="saved itineraries"
              spark={<Sparkline data={monthlyActivity.map((item) => item.value + 1)} className="mt-3" />}
            />
            <StatCard label="Days mapped" numericValue={totalDays} icon="calendar" tone="emerald" deltaLabel="across all trips" />
            <StatCard
              label="Planned spend"
              value={totalSpend ? formatINR(totalSpend, { compact: true }) : '—'}
              icon="wallet"
              tone="gold"
              deltaLabel="estimated"
            />
            <StatCard label="Saved items" numericValue={favourites.length} icon="heart" tone="violet" deltaLabel="destinations, stays, food" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card padding="lg">
              <SectionHeader
                title="Planning activity"
                description="Trips created and actions taken over the last six months."
                as="h2"
              />
              <div className="mt-5">
                <BarChart data={monthlyActivity} height={180} valueFormatter={(value) => `${value} actions`} />
              </div>
            </Card>

            <Card padding="lg">
              <h2 className="text-base font-bold text-fg">Travel style mix</h2>
              {styleBreakdown.length === 0 ? (
                <EmptyState
                  compact
                  className="mt-4"
                  icon="target"
                  title="No trips yet"
                  description="Generate your first itinerary to see your style mix."
                  action={{ label: 'Plan a trip', to: '/trip-planner', icon: 'sparkles' }}
                />
              ) : (
                <div className="mt-4">
                  <DonutChart data={styleBreakdown} size={140} thickness={18} centerLabel="Trips" centerValue={trips.length} />
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card padding="lg">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-fg">Recently viewed</h2>
                {recent.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearRecent();
                      toast.info('Recently viewed cleared');
                    }}
                    className="text-xs font-semibold text-fg-subtle transition hover:text-rose-500"
                  >
                    Clear
                  </button>
                )}
              </div>
              {recent.length === 0 ? (
                <p className="mt-4 text-sm text-fg-muted">Destinations you open will show up here for quick access.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {recent.slice(0, 5).map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.href || '/'}
                        className="group flex items-center gap-3 rounded-xl border border-line bg-surface-muted px-3.5 py-2.5 transition hover:border-brand-300"
                      >
                        <Icon name="history" size="sm" className="text-brand-500" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-fg">{item.title}</span>
                          <span className="block text-2xs text-fg-subtle">{formatRelative(item.viewedAt)}</span>
                        </span>
                        <Icon name="arrowRight" size="sm" className="text-fg-subtle transition-transform group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card padding="lg">
              <h2 className="text-base font-bold text-fg">Recommended for you</h2>
              <p className="mt-1 text-xs text-fg-muted">
                Based on your interests: {(preferences.interests || []).join(', ') || 'set your interests in preferences'}
              </p>
              <ul className="mt-4 space-y-2">
                {recommendations.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/destination/${item.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-line p-2.5 transition hover:border-brand-300 hover:bg-surface-muted"
                    >
                      <img src={item.image} alt="" loading="lazy" className="h-11 w-11 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-fg">{item.name}</span>
                        <span className="block truncate text-2xs text-fg-muted">{item.tagline}</span>
                      </span>
                      <span className="shrink-0 text-2xs font-bold text-brand-600 dark:text-brand-300">{item.bestTime}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card padding="lg">
            <h2 className="text-base font-bold text-fg">Quick actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'New itinerary', to: '/trip-planner', icon: 'sparkles' },
                { label: 'Estimate a budget', to: '/budget', icon: 'wallet' },
                { label: 'Find stays', to: '/hotels', icon: 'hotel' },
                { label: 'Safety toolkit', to: '/safety', icon: 'shield' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-surface-muted p-4 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-card"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-float">
                    <Icon name={action.icon} size="md" />
                  </span>
                  <span className="text-sm font-bold text-fg">{action.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* --------------------------------------------------------------- saved */}
      {tab === 'saved' && (
        <div className="space-y-5">
          {favourites.length === 0 ? (
            <EmptyState
              icon="heart"
              title="Nothing saved yet"
              description="Tap the heart on any destination, stay or dish to keep it here for later."
              action={{ label: 'Explore destinations', to: '/explore', icon: 'compass' }}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Chip active={savedFilter === 'all'} onClick={() => setSavedFilter('all')} count={favourites.length}>
                    All
                  </Chip>
                  {savedTypes.map((type) => (
                    <Chip
                      key={type}
                      icon={TYPE_META[type]?.icon}
                      active={savedFilter === type}
                      onClick={() => setSavedFilter(type)}
                      count={favourites.filter((item) => item.type === type).length}
                    >
                      {TYPE_META[type]?.label || type}
                    </Chip>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="dangerSoft"
                  leadingIcon="trash"
                  onClick={() => {
                    clearFavourites();
                    toast.success('Saved list cleared');
                  }}
                >
                  Clear all
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredFavourites.map((item) => (
                  <Card key={item.id} padding="none" interactive className="overflow-hidden">
                    <Link to={item.href || '/'} className="block">
                      {item.image ? (
                        <img src={item.image} alt="" loading="lazy" className="h-32 w-full object-cover" />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-brand-500/12 to-accent-500/12">
                          <Icon name={TYPE_META[item.type]?.icon || 'bookmark'} size={32} className="text-brand-500" />
                        </div>
                      )}
                    </Link>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link to={item.href || '/'} className="block truncate text-sm font-bold text-fg hover:underline">
                            {item.title}
                          </Link>
                          <p className="truncate text-2xs text-fg-muted">{item.subtitle}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            toggleFavourite(item);
                            toast.info('Removed from saved');
                          }}
                          aria-label={`Remove ${item.title}`}
                          className="rounded-full p-1.5 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        >
                          <Icon name="heart" size="sm" filled />
                        </button>
                      </div>
                      <p className="mt-2 text-2xs text-fg-subtle">Saved {formatRelative(item.savedAt)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------- trips */}
      {tab === 'trips' && (
        <div className="space-y-4">
          {trips.length === 0 ? (
            <EmptyState
              icon="luggage"
              title="No saved trips"
              description="Generate an itinerary and save it — it will appear here and in My Trips."
              action={{ label: 'Open Trip Planner', to: '/trip-planner', icon: 'sparkles' }}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-fg-muted">{trips.length} saved itineraries</p>
                <Button to="/my-trips" size="sm" variant="secondary" trailingIcon="arrowRight">
                  Manage in My Trips
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[...trips]
                  .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
                  .map((trip) => (
                    <Card key={trip.id} padding="lg" interactive>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-fg">{trip.destination}</h3>
                          <p className="text-2xs text-fg-muted">
                            {trip.startDate ? formatDate(trip.startDate) : 'No dates'} · {trip.days} days
                          </p>
                        </div>
                        <Badge tone="brand" size="sm">
                          {trip.travelStyle}
                        </Badge>
                      </div>
                      {trip.estimate && (
                        <p className="mt-3 text-lg font-extrabold text-fg">{formatINR(trip.estimate)}</p>
                      )}
                      <Button to="/my-trips" size="sm" variant="secondary" className="mt-4" trailingIcon="arrowRight">
                        View itinerary
                      </Button>
                    </Card>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ activity */}
      {tab === 'activity' && (
        <Card padding="lg">
          {activity.length === 0 ? (
            <EmptyState
              compact
              icon="history"
              title="No activity yet"
              description="Plans, saves and budget estimates will be logged here."
            />
          ) : (
            <ol className="relative space-y-1">
              {activity.map((entry, index) => (
                <li key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                  {index < activity.length - 1 && (
                    <span className="absolute left-[1.15rem] top-9 h-full w-px bg-line" aria-hidden="true" />
                  )}
                  <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300">
                    <Icon name={entry.icon || 'zap'} size="sm" />
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-sm font-semibold text-fg">{entry.title}</p>
                    <p className="mt-0.5 text-2xs text-fg-subtle">{formatRelative(entry.at)}</p>
                  </div>
                  {entry.href && (
                    <Link
                      to={entry.href}
                      className="shrink-0 self-center rounded-lg p-2 text-fg-subtle transition hover:bg-surface-muted hover:text-brand-600"
                      aria-label={`Open ${entry.title}`}
                    >
                      <Icon name="arrowUpRight" size="sm" />
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}

      {/* --------------------------------------------------------- preferences */}
      {tab === 'preferences' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <Card padding="lg">
            <h2 className="text-base font-bold text-fg">Travel preferences</h2>
            <p className="mt-1 text-sm text-fg-muted">
              These personalise recommendations, the assistant’s answers and default planner values.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Home city" htmlFor="pref-home">
                <Input
                  id="pref-home"
                  icon="mapPin"
                  value={preferences.homeCity}
                  onChange={(event) => updatePreferences({ homeCity: event.target.value })}
                />
              </Field>

              <Field label="Preferred travel style" htmlFor="pref-style">
                <Select
                  id="pref-style"
                  icon="target"
                  value={preferences.travelStyle}
                  onChange={(event) => updatePreferences({ travelStyle: event.target.value })}
                >
                  {['adventure', 'relaxation', 'cultural', 'food', 'nature'].map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="mt-5">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-fg-subtle">Interests</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = (preferences.interests || []).includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        updatePreferences({
                          interests: active
                            ? preferences.interests.filter((item) => item !== interest)
                            : [...(preferences.interests || []), interest],
                        })
                      }
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all duration-200',
                        active
                          ? 'border-transparent bg-brand-gradient text-white shadow-float'
                          : 'border-line bg-surface text-fg-muted hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-200'
                      )}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-2.5 border-t border-line pt-5">
              <Switch
                label="Dark appearance"
                description="Switch the entire interface theme"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <Switch
                label="Reduce heavy imagery"
                description="Prefer lighter pages on slow connections"
                checked={preferences.reducedImagery}
                onChange={(value) => updatePreferences({ reducedImagery: value })}
              />
            </div>

            <Button
              className="mt-6"
              leadingIcon="checkCircle"
              onClick={() => toast.success('Preferences saved', { description: 'Applied across the product.' })}
            >
              Save preferences
            </Button>
          </Card>

          <div className="space-y-4">
            <Card padding="lg">
              <h2 className="text-base font-bold text-fg">Account</h2>
              {user ? (
                <>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-fg-subtle">Name</dt>
                      <dd className="font-semibold text-fg">{displayName}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-fg-subtle">Email</dt>
                      <dd className="truncate font-semibold text-fg">{user.email}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-fg-subtle">Member since</dt>
                      <dd className="font-semibold text-fg">{formatDate(user.created_at)}</dd>
                    </div>
                  </dl>
                  <Button
                    variant="dangerSoft"
                    fullWidth
                    className="mt-5"
                    leadingIcon="logout"
                    onClick={async () => {
                      await signOut().catch(() => {});
                      toast.success('Signed out');
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-fg-muted">
                    Create an account to sync trips, saved places and preferences across devices.
                  </p>
                  <Button to="/auth" fullWidth className="mt-4" leadingIcon="login">
                    Sign in or sign up
                  </Button>
                </>
              )}
            </Card>

            <Card padding="lg" tone="muted">
              <h2 className="text-base font-bold text-fg">Your data</h2>
              <p className="mt-2 text-xs leading-5 text-fg-muted">
                Trips, saved items and preferences live in this browser’s local storage. Clearing site data removes them.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leadingIcon="download"
                  onClick={() => {
                    const blob = new Blob(
                      [JSON.stringify({ trips, favourites, preferences, activity }, null, 2)],
                      { type: 'application/json' }
                    );
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'safarai-data.json';
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success('Data exported');
                  }}
                >
                  Export my data
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
