import { useCallback, useEffect, useRef, useState } from 'react';
import { useReconnect } from './useQuery';

const PAGED_TTL = 10 * 60 * 1000;
const pagedCache = new Map();

const blank = (key, loading) => ({
  key,
  items: [],
  people: [],
  page: 0,
  totalPages: 1,
  total: 0,
  loading,
  error: null,
});

const cachedPages = (key) => {
  const hit = pagedCache.get(key);
  return hit && Date.now() - hit.at < PAGED_TTL ? hit.state : null;
};

export function usePaged(key, fetchPage, enabled) {
  const [state, setState] = useState(
    () => (enabled && cachedPages(key)) || blank(key, enabled),
  );
  const current = useRef({ key, controller: null });
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const load = useCallback((page) => {
    const run = current.current;
    run.controller?.abort();
    const controller = new AbortController();
    run.controller = controller;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchRef
      .current(page, controller.signal)
      .then((result) => {
        if (controller.signal.aborted || run !== current.current) return;
        setState((s) => {
          const seen = new Set(page === 1 ? [] : s.items.map((i) => i.key));
          const fresh = result.items.filter(
            (i) => !seen.has(i.key) && seen.add(i.key),
          );
          return {
            key: run.key,
            stale: false,
            items: page === 1 ? fresh : [...s.items, ...fresh],
            people: page === 1 ? (result.people ?? []) : s.people,
            page: result.page,
            totalPages: result.totalPages,
            total: result.total,
            loading: false,
            error: null,
          };
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || run !== current.current) return;
        setState((s) =>
          page === 1
            ? { ...s, items: [], page: 0, stale: false, loading: false, error }
            : { ...s, loading: false, error },
        );
      });
  }, []);

  useEffect(() => {
    current.current.controller?.abort();
    current.current = { key, controller: null };
    const hit = enabled && cachedPages(key);
    setState((s) => {
      if (hit) return s === hit ? s : hit;
      if (!enabled || !s.items.length) return blank(key, enabled);
      return { ...s, key, loading: true, error: null, stale: true };
    });
    if (enabled && !hit) load(1);
    return () => current.current.controller?.abort();
  }, [key, enabled, load]);

  useEffect(() => {
    if (state.key === key && state.page > 0 && !state.loading) {
      pagedCache.set(key, { state, at: Date.now() });
    }
  }, [state, key]);

  const loadMore = () => {
    if (!state.loading && !state.error && state.page < state.totalPages) {
      load(state.page + 1);
    }
  };
  const retry = () => load(Math.max(1, state.page + 1));
  useReconnect(Boolean(state.error), retry);

  return { ...state, loadMore, retry };
}
