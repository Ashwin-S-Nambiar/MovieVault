import { useEffect, useRef, useState } from 'react';
import { healthStore } from './health';
import { useStore } from './store';

export function useQuery(key, fetcher, { enabled = true } = {}) {
  const [state, setState] = useState({
    data: undefined,
    error: null,
    loading: enabled,
  });
  const [attempt, setAttempt] = useState(0);
  const epoch = useStore(healthStore, (s) => s.epoch);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const failed = Boolean(state.error);
  const retryEpoch = failed ? epoch : 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: the key identifies the request
  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ data: s.data, error: null, loading: true }));
    fetcherRef
      .current(controller.signal)
      .then((data) => {
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
