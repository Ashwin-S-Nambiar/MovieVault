import { toast } from './ui';

export const APPS = [
  {
    id: 'nuvio',
    name: 'Nuvio',
    icon: '/apps/nuvio.png',
    platforms: 'Android and iOS, desktop in alpha',
    site: 'https://nuvio.tv',
    link: (item) =>
      `nuvio://tmdb/${item.type === 'movie' ? 'movie' : 'tv'}/${item.id}`,
  },
  {
    id: 'stremio',
    name: 'Stremio',
    icon: '/apps/stremio.svg',
    platforms: 'Desktop and Android, or Stremio Web',
    site: 'https://www.stremio.com/downloads',
    link: (item, imdb) =>
      imdb
        ? `stremio:///detail/${item.type === 'movie' ? 'movie' : 'series'}/${imdb}`
        : `stremio:///search?search=${encodeURIComponent(item.title)}`,
    web: (item, imdb) =>
      imdb
        ? `https://web.stremio.com/#/detail/${item.type === 'movie' ? 'movie' : 'series'}/${imdb}`
        : `https://web.stremio.com/#/search?search=${encodeURIComponent(item.title)}`,
  },
];

const WAIT_MS = 1600;

export function watchLaunch(app, item, imdb) {
  let left = false;
  const onLeave = () => {
    if (document.hidden || !document.hasFocus()) left = true;
  };
  document.addEventListener('visibilitychange', onLeave);
  window.addEventListener('blur', onLeave);
  window.addEventListener('pagehide', onLeave);

  setTimeout(() => {
    document.removeEventListener('visibilitychange', onLeave);
    window.removeEventListener('blur', onLeave);
    window.removeEventListener('pagehide', onLeave);
    if (left || document.hidden) return;
    const web = app.web?.(item, imdb);
    toast(`${app.name} didn't open. Is it installed?`, {
      duration: 6000,
      action: {
        label: web ? 'Use Stremio Web' : `Get ${app.name}`,
        onClick: () => window.open(web ?? app.site, '_blank', 'noopener'),
      },
    });
  }, WAIT_MS);
}
