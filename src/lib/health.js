import { createStore, useStore } from './store';

export const healthStore = createStore({
  status: import.meta.env.VITE_TMDB_API_KEY ? 'idle' : 'missing-key',
  online: navigator.onLine,
  retrying: 0,
  failures: 0,
  lastError: null,
  latency: null,
  checkedAt: null,
  epoch: 0,
});

export function retryFailed() {
  healthStore.set((s) => ({
    ...s,
    status: s.status === 'down' ? 'idle' : s.status,
    epoch: s.epoch + 1,
  }));
}

export function reportRetry() {
  healthStore.set((s) => ({ ...s, retrying: s.retrying + 1 }));
}

export function reportSuccess(ms) {
  healthStore.set((s) => ({
    ...s,
    status: 'up',
    retrying: 0,
    failures: 0,
    lastError: null,
    latency: s.latency == null ? ms : Math.round(s.latency * 0.8 + ms * 0.2),
    checkedAt: Date.now(),
  }));
}

export function reportFailure(error) {
  healthStore.set((s) =>
    s.status === 'missing-key'
      ? s
      : {
          ...s,
          retrying: 0,
          failures: s.failures + 1,
          lastError: error?.message ?? 'Request failed',
          status: error?.status === 401 ? 'bad-key' : 'down',
          checkedAt: Date.now(),
        },
  );
}

window.addEventListener('online', () =>
  healthStore.set((s) => ({ ...s, online: true })),
);
window.addEventListener('offline', () =>
  healthStore.set((s) => ({ ...s, online: false })),
);

export const useHealth = () => useStore(healthStore);
