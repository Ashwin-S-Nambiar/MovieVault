import { createPersistedStore, useStore } from './store';

const DEFAULT_SERVICES = {
  IN: [8, 119, 2336, 350, 283],
  US: [8, 9, 337, 350, 1899, 15],
  GB: [8, 9, 337, 350, 39],
  CA: [8, 230, 9, 337, 350],
  AU: [8, 119, 337, 350, 385],
};

function detectRegion() {
  for (const locale of [...(navigator.languages ?? []), navigator.language]) {
    const match = /-([A-Z]{2})$/i.exec(locale ?? '');
    if (match) return match[1].toUpperCase();
  }
  return 'US';
}

const region = detectRegion();

export const regionStore = createPersistedStore('mv:region', region);
export const servicesStore = createPersistedStore(
  'mv:services',
  DEFAULT_SERVICES[region] ?? [8, 119, 337, 350],
);
export const themeStore = createPersistedStore('mv:theme', 'system');
export const appsStore = createPersistedStore('mv:apps', []);
export const languageStore = createPersistedStore('mv:language', 'en-US');

export const useRegion = () => useStore(regionStore);
export const useServices = () => useStore(servicesStore);
export const useTheme = () => useStore(themeStore);
export const useApps = () => useStore(appsStore);
export const useLanguage = () => useStore(languageStore);

export const deviceLanguage = () => {
  const tag = navigator.language || 'en-US';
  return tag.includes('-') ? tag : `${tag}-${region}`;
};

export function toggleApp(id) {
  appsStore.set((list) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
  );
}

export function toggleService(id) {
  servicesStore.set((list) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
  );
}

function applyTheme() {
  const theme = themeStore.get();
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;
}

applyTheme();
themeStore.subscribe(applyTheme);
