import { createPersistedStore, createStore, useStore } from './store';

export const sheetStore = createStore(null);
export const openSheet = (name) => sheetStore.set(name);
export const closeSheet = () => sheetStore.set(null);
export const useSheet = () => useStore(sheetStore);

export const toastStore = createStore([]);
let nextToast = 1;

export function toast(message, { poster, action, duration = 4000 } = {}) {
  const id = nextToast++;
  toastStore.set((list) =>
    [...list, { id, message, poster, action, duration }].slice(-3),
  );
  return id;
}

export function dismissToast(id) {
  toastStore.set((list) => list.filter((t) => t.id !== id));
}

export const useToasts = () => useStore(toastStore);

export const recentStore = createPersistedStore('mv:recent', []);
export const useRecent = () => useStore(recentStore);

export function rememberSearch(query) {
  const q = query.trim();
  if (!q) return;
  recentStore.set((list) =>
    [q, ...list.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8),
  );
}
