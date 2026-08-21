import { useEffect, useState } from 'react';

/**
 * Destination photography is resolved at runtime from Wikipedia's REST API.
 *
 * Why: shipping 150+ hard-coded image URLs guarantees rot, and hotlinking a
 * stock service needs a key. Wikipedia's summary endpoint is CORS-enabled,
 * free, cached hard by their CDN, and returns a real photo of the place.
 *
 * Results are memoised in-module and in sessionStorage so a page revisit costs
 * nothing, and everything degrades to a gradient placeholder.
 */

const memory = new Map();
const inflight = new Map();
const STORAGE_KEY = 'safarai_wiki_images';

function readCache() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeCache(title, value) {
  try {
    const cache = readCache();
    cache[title] = value;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* storage full or unavailable — memory cache still applies */
  }
}

export async function fetchWikiImage(title, { width = 800 } = {}) {
  if (!title) return null;
  if (memory.has(title)) return memory.get(title);

  const cached = readCache()[title];
  if (cached !== undefined) {
    memory.set(title, cached);
    return cached;
  }

  if (inflight.has(title)) return inflight.get(title);

  const request = fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`,
    { headers: { Accept: 'application/json' } }
  )
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      const source = data?.thumbnail?.source || data?.originalimage?.source || null;
      // Ask Wikimedia for a right-sized render instead of the original.
      const sized = source ? source.replace(/\/\d+px-/, `/${width}px-`) : null;
      const value = sized ? { url: sized, extract: data?.extract || '', page: data?.content_urls?.desktop?.page } : null;
      memory.set(title, value);
      writeCache(title, value);
      return value;
    })
    .catch(() => {
      memory.set(title, null);
      return null;
    })
    .finally(() => inflight.delete(title));

  inflight.set(title, request);
  return request;
}

/** React hook wrapper. Returns `{ url, extract, loading }`. */
export default function useWikiImage(title, { width = 800, enabled = true } = {}) {
  const [state, setState] = useState(() => ({
    data: title && memory.has(title) ? memory.get(title) : null,
    loading: Boolean(enabled && title && !memory.has(title)),
  }));

  useEffect(() => {
    if (!enabled || !title) {
      setState({ data: null, loading: false });
      return undefined;
    }

    if (memory.has(title)) {
      setState({ data: memory.get(title), loading: false });
      return undefined;
    }

    let active = true;
    setState({ data: null, loading: true });

    fetchWikiImage(title, { width }).then((data) => {
      if (active) setState({ data, loading: false });
    });

    return () => {
      active = false;
    };
  }, [title, width, enabled]);

  return { url: state.data?.url || null, extract: state.data?.extract || '', loading: state.loading };
}
