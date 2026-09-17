import { createStore, useStore } from './store';

export const healthStore = createStore({
  status: 'idle',
  online: navigator.onLine,
  retrying: 0,
  failures: 0,
  lastError: null,
  latency: null,
  checkedAt: null,
  okAt: 0,
  epoch: 0,
});

const GRACE = 10_000;
const recentlyOk = (s) => Date.now() - s.okAt < GRACE;

export const isDown = () => healthStore.get().status === 'down';

export function startReconnect() {
  const { status } = healthStore.get();
  if (status === 'checking') return false;
  healthStore.set((s) => ({ ...s, status: 'checking', retrying: 0 }));
  return true;
}

export function retryFailed() {
  healthStore.set((s) => ({ ...s, epoch: s.epoch + 1 }));
}

export function reportRetry() {
  healthStore.set((s) =>
    s.status === 'down' || s.status === 'checking' || recentlyOk(s)
      ? s
      : { ...s, retrying: s.retrying + 1 },
  );
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
    okAt: Date.now(),
    epoch: s.failures > 0 ? s.epoch + 1 : s.epoch,
  }));
}

export function reportFailure(error) {
  healthStore.set((s) => ({
    ...s,
    retrying: 0,
    failures: s.failures + 1,
    lastError: error?.message ?? 'Request failed',
    status:
      error?.status === 401
        ? 'bad-key'
        : s.status === 'up' && recentlyOk(s)
          ? 'up'
          : 'down',
    checkedAt: Date.now(),
  }));
}

window.addEventListener('online', () =>
  healthStore.set((s) => ({ ...s, online: true })),
);
window.addEventListener('offline', () =>
  healthStore.set((s) => ({ ...s, online: false })),
);

export const useHealth = () => useStore(healthStore);

export function healthTone(health) {
  if (!health.online) return 'offline';
  if (
    health.status === 'checking' ||
    (health.retrying > 0 && health.status !== 'up')
  ) {
    return 'retrying';
  }
  return health.status;
}
