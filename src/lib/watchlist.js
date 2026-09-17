import { createPersistedStore, useStore } from './store';

export const vaultStore = createPersistedStore('mv:vault', []);

const pick = ({
  key,
  id,
  type,
  kind,
  title,
  year,
  date,
  poster,
  backdrop,
  rating,
}) => ({
  key,
  id,
  type,
  kind,
  title,
  year,
  date: date ?? null,
  poster,
  backdrop: backdrop ?? null,
  rating: rating ?? null,
});

export function addToVault(item) {
  vaultStore.set((list) =>
    list.some((x) => x.key === item.key)
      ? list
      : [{ ...pick(item), addedAt: Date.now() }, ...list],
  );
}

export function removeFromVault(key) {
  vaultStore.set((list) => list.filter((x) => x.key !== key));
}

export function restoreToVault(entry) {
  vaultStore.set((list) =>
    list.some((x) => x.key === entry.key)
      ? list
      : [...list, entry].sort((a, b) => b.addedAt - a.addedAt),
  );
}

export function clearVault() {
  const previous = vaultStore.get();
  vaultStore.set([]);
  return () => vaultStore.set(previous);
}

export const useVault = () => useStore(vaultStore);
export const useInVault = (key) =>
  useStore(vaultStore, (list) => list.some((x) => x.key === key));
