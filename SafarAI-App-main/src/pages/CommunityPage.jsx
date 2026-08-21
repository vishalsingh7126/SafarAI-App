import { useEffect, useMemo, useState } from 'react';
import usePageMeta from '../hooks/usePageMeta';
import { PageHeader } from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge, { Chip } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Rating, { Avatar } from '../components/ui/Rating';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import useLocalStorage from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { destinations } from '../data/destinations';
import { formatRelative } from '../lib/format';
import { cn } from '../lib/cn';

/**
 * Community — traveller stories and reviews.
 * Seeded with editorial posts; user posts are stored locally (same pattern as
 * events) so the page works without a backend.
 */

const SEED_POSTS = [
  {
    id: 'seed-1',
    author: 'Ananya Rao',
    location: 'Bengaluru',
    destination: 'Varanasi',
    rating: 5,
    title: 'Solo in Varanasi: calmer than I expected',
    body: 'Booked a guesthouse two lanes from Assi Ghat and did the 5:30am boat ride on day one. Mornings are peaceful, evenings are intense. Keep cash for the ghats, and use the SafarAI safety checklist — sharing my live location every night made my family relax.',
    tags: ['Solo', 'Spiritual', 'Budget'],
    likes: 128,
    comments: 14,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 'seed-2',
    author: 'Rahul Mehta',
    location: 'Mumbai',
    destination: 'Leh Ladakh',
    rating: 5,
    title: '8 days in Ladakh, ₹58k for two',
    body: 'Flew into Leh, acclimatised for two full days (do not skip this), then Nubra and Pangong. Shared taxis are half the price of private ones if you post on the Leh traveller boards a day early. September light is unreal.',
    tags: ['Road trip', 'Mountains', 'Photography'],
    likes: 264,
    comments: 31,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
  },
  {
    id: 'seed-3',
    author: 'Priya Nair',
    location: 'Kochi',
    destination: 'Kerala',
    rating: 4,
    title: 'Backwaters with parents — what worked',
    body: 'One night on the houseboat is plenty; two gets repetitive. Munnar in the same trip needs a full travel day, so budget for it. The tea estate sunrise was the highlight for my parents, and wheelchair access at Fort Kochi was better than expected.',
    tags: ['Family', 'Backwaters', 'Slow travel'],
    likes: 96,
    comments: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
  {
    id: 'seed-4',
    author: 'Dev Sharma',
    location: 'Delhi',
    destination: 'Hampi',
    rating: 5,
    title: 'Hampi on ₹2,000 a day',
    body: 'Stayed on the Virupapur Gaddi side, rented a scooter for ₹350/day and ate at the same three places all week. Sunrise from Matanga Hill is worth the 4:45am alarm. Carry a torch — the boulder paths are unlit after sunset.',
    tags: ['Budget', 'Heritage', 'Backpacking'],
    likes: 187,
    comments: 22,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 150).toISOString(),
  },
];

const FILTERS = ['All', 'Solo', 'Family', 'Budget', 'Adventure', 'Food'];

function PostCard({ post, liked, onLike, onOpen }) {
  return (
    <Card padding="lg" interactive className="flex h-full flex-col">
      <div className="flex items-start gap-3">
        <Avatar name={post.author} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-fg">{post.author}</p>
          <p className="truncate text-2xs text-fg-subtle">
            {post.location} · {formatRelative(post.createdAt)}
          </p>
        </div>
        <Badge tone="brand" size="sm" icon="mapPin">
          {post.destination}
        </Badge>
      </div>

      <button type="button" onClick={() => onOpen(post)} className="mt-4 text-left">
        <h3 className="text-base font-bold text-fg transition-colors hover:text-brand-600 dark:hover:text-brand-300">
          {post.title}
        </h3>
      </button>
      <Rating value={post.rating} className="mt-1.5" />
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-fg-muted">{post.body}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-line bg-surface-muted px-2 py-0.5 text-2xs font-semibold text-fg-muted">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => onLike(post.id)}
          aria-pressed={liked}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
            liked ? 'text-rose-500' : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
          )}
        >
          <Icon name="heart" size="sm" filled={liked} />
          {post.likes + (liked ? 1 : 0)}
        </button>
        <button
          type="button"
          onClick={() => onOpen(post)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-fg-muted transition hover:bg-surface-muted hover:text-fg"
        >
          <Icon name="users" size="sm" />
          {post.comments}
        </button>
        <Button size="xs" variant="ghost" className="ml-auto" trailingIcon="arrowRight" onClick={() => onOpen(post)}>
          Read
        </Button>
      </div>
    </Card>
  );
}

function CommunityPage() {
  usePageMeta('Community | SafarAI', 'Read and share traveller reviews and stories on SafarAI.');

  const toast = useToast();
  const { user, displayName } = useAuth();

  const [userPosts, setUserPosts] = useLocalStorage('safarai_community_posts', []);
  const [likes, setLikes] = useLocalStorage('safarai_community_likes', []);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [composerOpen, setComposerOpen] = useState(false);
  const [reading, setReading] = useState(null);
  const [form, setForm] = useState({ destination: '', title: '', body: '', rating: 5, tags: '' });
  const [error, setError] = useState('');

  const posts = useMemo(() => [...userPosts, ...SEED_POSTS], [userPosts]);

  const visible = useMemo(() => {
    let list = posts.filter((post) => {
      if (filter !== 'All' && !post.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase()))) return false;
      if (query.trim()) {
        const needle = query.trim().toLowerCase();
        return `${post.title} ${post.body} ${post.destination} ${post.author}`.toLowerCase().includes(needle);
      }
      return true;
    });

    list = [...list];
    if (sort === 'recent') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'popular') list.sort((a, b) => b.likes - a.likes);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [posts, filter, query, sort]);

  const toggleLike = (id) => {
    setLikes((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const submitPost = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !form.destination.trim()) {
      setError('Destination, title and story are all required.');
      return;
    }

    const post = {
      id: `post_${Date.now()}`,
      author: user ? displayName : 'You',
      location: 'Your device',
      destination: form.destination.trim(),
      rating: Number(form.rating),
      title: form.title.trim(),
      body: form.body.trim(),
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 4),
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      mine: true,
    };

    setUserPosts((prev) => [post, ...prev]);
    setForm({ destination: '', title: '', body: '', rating: 5, tags: '' });
    setError('');
    setComposerOpen(false);
    toast.success('Story published', { description: 'Thanks for helping other travellers.' });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community"
        icon="users"
        title="Traveller reviews & stories"
        description="Real trips, honest budgets and the small details guidebooks miss — written by people who just came back."
        stats={[
          { label: 'Stories', value: posts.length },
          { label: 'Your posts', value: userPosts.length },
          { label: 'Destinations', value: new Set(posts.map((post) => post.destination)).size },
        ]}
        actions={
          <Button leadingIcon="edit" onClick={() => setComposerOpen(true)}>
            Share your trip
          </Button>
        }
      />

      <Card padding="md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            icon="search"
            placeholder="Search stories, destinations or travellers…"
            aria-label="Search community stories"
            className="flex-1"
          />
          <Select
            id="community-sort"
            aria-label="Sort stories"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            icon="sort"
            className="w-full lg:w-48"
          >
            <option value="recent">Most recent</option>
            <option value="popular">Most liked</option>
            <option value="rating">Highest rated</option>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {FILTERS.map((item) => (
            <Chip key={item} active={filter === item} onClick={() => setFilter(item)}>
              {item}
            </Chip>
          ))}
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon="users"
          title="No stories match that search"
          description="Try another destination or clear the filters — or be the first to write about it."
          action={{
            label: 'Clear filters',
            onClick: () => {
              setQuery('');
              setFilter('All');
            },
            icon: 'refresh',
          }}
          secondaryAction={{ label: 'Share your trip', onClick: () => setComposerOpen(true), icon: 'edit' }}
        />
      ) : (
        <section aria-labelledby="stories-heading" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <h2 id="stories-heading" className="sr-only">
            Traveller stories
          </h2>
          {visible.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              liked={likes.includes(post.id)}
              onLike={toggleLike}
              onOpen={setReading}
            />
          ))}
        </section>
      )}

      {/* composer */}
      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title="Share your trip"
        description="A short, specific story helps far more than a five-star rating."
        icon="edit"
        size="lg"
      >
        <form onSubmit={submitPost} className="grid gap-4 sm:grid-cols-2">
          <Field label="Destination" required htmlFor="c-dest">
            <Input
              id="c-dest"
              data-autofocus
              list="community-destinations"
              icon="mapPin"
              value={form.destination}
              onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))}
              placeholder="Where did you go?"
            />
            <datalist id="community-destinations">
              {destinations.map((item) => (
                <option key={item.slug} value={item.name} />
              ))}
            </datalist>
          </Field>

          <Field label="Your rating" htmlFor="c-rating">
            <div className="flex h-11 items-center rounded-xl border border-line bg-surface px-3.5">
              <Rating
                value={Number(form.rating)}
                size="md"
                onChange={(value) => setForm((prev) => ({ ...prev, rating: value }))}
              />
            </div>
          </Field>

          <Field label="Headline" required htmlFor="c-title" className="sm:col-span-2">
            <Input
              id="c-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="e.g. 4 days in Goa without the crowds"
            />
          </Field>

          <Field
            label="Your story"
            required
            htmlFor="c-body"
            className="sm:col-span-2"
            hint={`${form.body.length}/800 characters`}
          >
            <Textarea
              id="c-body"
              rows={5}
              maxLength={800}
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              placeholder="What worked, what you would skip, what it actually cost…"
            />
          </Field>

          <Field label="Tags" htmlFor="c-tags" className="sm:col-span-2" hint="Comma separated, up to four">
            <Input
              id="c-tags"
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="Solo, Budget, Food"
            />
          </Field>

          {error && (
            <p className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              <Icon name="alert" size="sm" />
              {error}
            </p>
          )}

          <div className="sm:col-span-2 flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" leadingIcon="send">
              Publish story
            </Button>
          </div>
        </form>
      </Modal>

      {/* reader */}
      <Modal open={Boolean(reading)} onClose={() => setReading(null)} title={reading?.title} size="lg">
        {reading && (
          <article className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={reading.author} size="md" />
              <div>
                <p className="text-sm font-bold text-fg">{reading.author}</p>
                <p className="text-2xs text-fg-subtle">
                  {reading.location} · {formatRelative(reading.createdAt)}
                </p>
              </div>
              <Badge tone="brand" className="ml-auto" icon="mapPin">
                {reading.destination}
              </Badge>
            </div>

            <Rating value={reading.rating} showValue />
            <p className="whitespace-pre-line text-sm leading-7 text-fg-muted">{reading.body}</p>

            <div className="flex flex-wrap gap-1.5">
              {reading.tags.map((tag) => (
                <Badge key={tag} tone="neutral" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <Button
                size="sm"
                variant={likes.includes(reading.id) ? 'success' : 'secondary'}
                leadingIcon="heart"
                onClick={() => toggleLike(reading.id)}
              >
                {likes.includes(reading.id) ? 'Liked' : 'Like this story'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leadingIcon="sparkles"
                to={`/trip-planner?destination=${encodeURIComponent(reading.destination)}`}
              >
                Plan this trip
              </Button>
            </div>
          </article>
        )}
      </Modal>
    </div>
  );
}

export default CommunityPage;
