import { routeImage } from '../src/lib/share-image.js';
import { findUniverse } from '../src/lib/universes.js';

export const ORIGIN = 'https://movievault.ashwin.co.in';
const DESCRIPTION =
  'Find where to stream any film, series or anime, follow whole universes in release order, and keep a vault of what to watch next.';
const STATIC = {
  search: [
    'Search',
    'Find any film, series or anime and see where it streams.',
  ],
  vault: ['Your vault', 'Everything you want to watch, with where it streams.'],
  universes: [
    'Universes',
    'Every franchise, in release order, with where each chapter streams.',
  ],
};
const LABELS = {
  movie: 'Film',
  tv: 'Series',
  person: 'Person',
  company: 'Studio',
  network: 'Network',
  keyword: 'Tag',
  universe: 'Universe',
};

export function parseRoute(value) {
  if (typeof value !== 'string' || value.length > 160) return null;
  const path = value.replace(/\/$/, '') || '/';
  if (path === '/') return { path, kind: 'home' };
  if (path === '/watchlist') return { path: '/vault', kind: 'vault' };
  const kind = path.slice(1);
  if (Object.hasOwn(STATIC, kind)) return { path, kind };
  const detail = path.match(
    /^\/(movie|tv|person|company|network|keyword)\/([1-9]\d{0,9})$/,
  );
  if (detail) return { path, kind: detail[1], id: detail[2] };
  const universe = path.match(/^\/universe\/([a-z0-9-]{1,60})$/);
  if (
    universe &&
    (findUniverse(universe[1]) || /^[1-9]\d{0,9}$/.test(universe[1]))
  ) {
    return { path, kind: 'universe', id: universe[1] };
  }
  return null;
}

export const clip = (text, max = 160) => {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= max) return clean;
  const part = clean.slice(0, max - 1);
  const boundary = part.lastIndexOf(' ');
  return `${(boundary > max * 0.6 ? part.slice(0, boundary) : part).trimEnd()}…`;
};

async function resolveShareMeta(
  route,
  { fetcher = fetch, key = process.env.TMDB_API_KEY } = {},
) {
  const parsed = parseRoute(route);
  if (!parsed) return null;
  const { path, kind, id } = parsed;
  const meta = {
    path,
    kind,
    name: 'MovieVault',
    label: 'Films · Series · Anime',
    title: 'MovieVault · Where to stream anything',
    description: DESCRIPTION,
    type: 'website',
    image: `${ORIGIN}/og.jpg?v=2`,
    imageType: 'image/jpeg',
    status: 200,
    complete: true,
  };
  if (kind === 'home') return meta;
  if (STATIC[kind]) {
    const [name, description] = STATIC[kind];
    return {
      ...meta,
      name,
      title: `${name} · MovieVault`,
      description,
      image: `${ORIGIN}/og/${kind}.jpg?v=1`,
    };
  }
  const curated = kind === 'universe' && findUniverse(id);
  meta.name = curated?.name || LABELS[kind];
  meta.image = routeImage(path);
  meta.imageType = 'image/png';
  meta.title = `${meta.name} · MovieVault`;
  meta.label = LABELS[kind];
  meta.type =
    kind === 'movie'
      ? 'video.movie'
      : kind === 'tv'
        ? 'video.tv_show'
        : kind === 'person'
          ? 'profile'
          : 'website';
  meta.description =
    kind === 'universe'
      ? `Every ${meta.name} film in release order, with where each one streams.`
      : `Explore ${meta.name.toLowerCase()} details and find what to watch on MovieVault.`;
  if (curated) {
    meta.artwork = curated.backdrop;
    return meta;
  }
  if (!['movie', 'tv', 'universe'].includes(kind)) {
    return { ...meta, image: `${ORIGIN}/og.jpg?v=2`, imageType: 'image/jpeg' };
  }
  if (!key) return { ...meta, complete: false };
  try {
    const endpoint = kind === 'universe' ? `collection/${id}` : `${kind}/${id}`;
    const params = new URLSearchParams({ api_key: key, language: 'en-US' });
    const response = await fetcher(
      `https://api.themoviedb.org/3/${endpoint}?${params}`,
      {
        signal: AbortSignal.timeout(3_000),
        redirect: 'error',
        headers: { Accept: 'application/json' },
      },
    );
    if (response.status === 404)
      return {
        ...meta,
        title: `${LABELS[kind]} not found · MovieVault`,
        status: 404,
        complete: false,
      };
    if (!response.ok) return { ...meta, complete: false };
    const data = await response.json();
    meta.name = clip(data.title || data.name || meta.name, 120);
    meta.portrait = ['movie', 'tv', 'person'].includes(kind);
    const year = (data.release_date || data.first_air_date || '').slice(0, 4);
    meta.label = `${LABELS[kind]}${year ? ` · ${year}` : ''}`;
    meta.title = `${meta.name}${year ? ` (${year})` : ''} · MovieVault`;
    meta.description = clip(
      data.overview ||
        data.biography ||
        (kind === 'universe'
          ? `Every ${meta.name} film in release order, with where each one streams.`
          : `Explore ${meta.name} on MovieVault, with films, series and where to stream them.`),
    );
    meta.artwork =
      data.poster_path ||
      data.profile_path ||
      data.logo_path ||
      data.backdrop_path;
    return meta;
  } catch {
    return { ...meta, complete: false };
  }
}
const metadata = new Map();
export async function getShareMeta(route, options) {
  if (options) return resolveShareMeta(route, options);
  const parsed = parseRoute(route);
  if (!parsed) return null;
  const cached = metadata.get(parsed.path);
  if (cached && cached.until > Date.now()) return cached.value;
  const value = resolveShareMeta(parsed.path);
  metadata.delete(parsed.path);
  metadata.set(parsed.path, { value, until: Date.now() + 300_000 });
  if (metadata.size > 256) metadata.delete(metadata.keys().next().value);
  const result = await value;
  if (!result?.complete) metadata.delete(parsed.path);
  return result;
}
