import { useEffect, useMemo } from 'react';
import { getProviderCatalog } from './catalog';
import { useLanguage, useRegion, useServices } from './prefs';
import { createStore, useStore } from './store';
import { useReconnect } from './useQuery';

const TTL = 24 * 60 * 60 * 1000;
const catalogs = new Map();

function sharedCatalog(region, language) {
  const key = `mv:providers:v2:${region}:${language}`;
  if (catalogs.has(key)) return catalogs.get(key);
  let cached;
  try {
    cached = JSON.parse(localStorage.getItem(key));
  } catch {}
  const store = createStore({
    data: Array.isArray(cached?.data) ? cached.data : [],
    at: typeof cached?.at === 'number' ? cached.at : 0,
    loading: false,
    failed: false,
  });
  const load = () => {
    const state = store.get();
    if (state.loading || (state.at && Date.now() - state.at < TTL)) return;
    store.set({ ...state, loading: true, failed: false });
    // Shared work survives an individual consumer closing or unmounting.
    getProviderCatalog(region)
      .then((data) => {
        const entry = { data, at: Date.now() };
        store.set({ ...entry, loading: false, failed: false });
        try {
          localStorage.setItem(key, JSON.stringify(entry));
        } catch {}
      })
      .catch(() => store.set((s) => ({ ...s, loading: false, failed: true })));
  };
  const entry = { store, load };
  catalogs.set(key, entry);
  return entry;
}

export function useServiceCatalog({ enabled } = {}) {
  const region = useRegion();
  const services = useServices();
  const language = useLanguage();
  const { store, load } = sharedCatalog(region, language);
  const { data: catalog, loading, failed } = useStore(store);
  // The toolbar needs logos only when services are selected. The sheet opts in
  // when opened, including when the selection is empty.
  const needed = enabled ?? services.length > 0;
  useEffect(() => {
    if (needed) load();
  }, [needed, load]);
  useReconnect(needed && failed, load);

  const picked = useMemo(() => {
    const byId = new Map(catalog.map((p) => [p.id, p]));
    return services.map((id) => byId.get(id)).filter(Boolean);
  }, [catalog, services]);

  return { region, services, catalog, picked, loading };
}
