import { useEffect, useRef, useState } from 'react';
import { healthStore } from './health';
import { useStore } from './store';

const TTL = 10 * 60 * 1000;
const MAX_STORED = 150_000;
const results = new Map();

function remember(key, data) {
  const entry = { data, at: Date.now() };
  results.set(key, entry);
  try {
    const json = JSON.stringify(entry);
    if (json.length < MAX_STORED) sessionStorage.setItem(`mv:q:${key}`, json);
  } catch {}
}

function recall(key) {
  if (results.has(key)) return results.get(key);
  try {
    const entry = JSON.parse(sessionStorage.getItem(`mv:q:${key}`));
    if (entry) results.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

const fresh = (key) => {
  const hit = recall(key);
  return hit && Date.now() - hit.at < TTL ? hit : null;
};

export function useReconnect(failed, retry) {
  const epoch = useStore(healthStore, (s) => s.epoch);
  const seen = useRef(epoch);
  const latest = useRef({ failed, retry });
  latest.current = { failed, retry };

  useEffect(() => {
    if (epoch === seen.current) return;
    seen.current = epoch;
    if (latest.current.failed) latest.current.retry();
  }, [epoch]);
}

export function useQuery(key, fetcher, { enabled = true } = {}) {
  const [state, setState] = useState(() => {
    const hit = enabled ? fresh(key) : null;
    return {
      data: hit?.data,
      error: null,
      loading: enabled && !hit,
    };
  });
  const [attempt, setAttempt] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const retry = () => setAttempt((n) => n + 1);
  useReconnect(Boolean(state.error), retry);

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const hit = fresh(key);
    if (hit && attempt === 0) {
      setState((s) =>
        s.data === hit.data && !s.loading
          ? s
          : { data: hit.data, error: null, loading: false },
      );
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ data: s.data, error: null, loading: true }));
    fetcherRef
      .current(controller.signal)
      .then((data) => {
        remember(key, data);
        if (!controller.signal.aborted) {
          setState({ data, error: null, loading: false });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState((s) => ({ data: s.data, error, loading: false }));
        }
      });
    return () => controller.abort();
  }, [key, enabled, attempt]);

  return { ...state, retry };
}
