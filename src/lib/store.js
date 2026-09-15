import { useSyncExternalStore } from 'react';

export function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    get: () => state,
    set(next) {
      const value = typeof next === 'function' ? next(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function createPersistedStore(key, fallback) {
  const store = createStore(readStorage(key, fallback));

  store.subscribe(() => {
    try {
      localStorage.setItem(key, JSON.stringify(store.get()));
    } catch {}
  });

  window.addEventListener('storage', (event) => {
    if (event.key === key) store.set(readStorage(key, fallback));
  });

  return store;
}

export function useStore(store, selector = (s) => s) {
  const read = () => selector(store.get());
  return useSyncExternalStore(store.subscribe, read, read);
}
