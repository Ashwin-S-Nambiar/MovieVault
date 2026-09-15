import { useEffect, useMemo, useState } from 'react';
import { getProviderCatalog } from './catalog';
import { useRegion, useServices } from './prefs';

const storageKey = (region) => `mv:providers:${region}`;

function readCached(region) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(region))) ?? [];
  } catch {
    return [];
  }
}

export function useServiceCatalog() {
  const region = useRegion();
  const services = useServices();
  const [catalog, setCatalog] = useState(() => readCached(region));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCatalog(readCached(region));
    const controller = new AbortController();
    setLoading(true);
    getProviderCatalog(region, { signal: controller.signal })
      .then((list) => {
        setCatalog(list);
        try {
          localStorage.setItem(storageKey(region), JSON.stringify(list));
        } catch {}
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [region]);

  const picked = useMemo(() => {
    const byId = new Map(catalog.map((p) => [p.id, p]));
    return services.map((id) => byId.get(id)).filter(Boolean);
  }, [catalog, services]);

  return { region, services, catalog, picked, loading };
}
