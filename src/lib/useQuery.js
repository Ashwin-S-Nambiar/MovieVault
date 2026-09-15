import { useEffect, useRef, useState } from 'react';
import { healthStore } from './health';
import { useStore } from './store';

const TTL = 10 * 60 * 1000;
const results = new Map();

const fresh = (key) => {
  const hit = results.get(key);
  return hit && Date.now() - hit.at < TTL ? hit : null;
};

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
  const epoch = useStore(healthStore, (s) => s.epoch);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const failed = Boolean(state.error);
  const retryEpoch = failed ? epoch : 0;

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const hit = fresh(key);
    if (hit && attempt === 0 && !retryEpoch) {
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
        results.set(key, { data, at: Date.now() });
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
  }, [key, enabled, attempt, retryEpoch]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
