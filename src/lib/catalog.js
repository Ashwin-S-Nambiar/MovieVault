import { toItem, toItems } from './format';
import { logoImg, peek, tmdb } from './tmdb';
import { UNIVERSES, universeHref } from './universes';

const ANIME_KEYWORD = 210024;

const hasPoster = (item) => Boolean(item.poster);

const page = (data, type) => ({
  items: toItems(data.results, type),
  page: data.page,
  totalPages: Math.min(data.total_pages, 500),
  total: data.total_results,
});

export async function trending({ window = 'week', signal } = {}) {
  const data = await tmdb(`/trending/all/${window}`, {}, { signal });
  return toItems(data.results).filter(hasPoster);
}

export async function discover(
  kind,
  { page: n = 1, sort = 'popularity.desc', providers, region, signal } = {},
) {
  const type = kind === 'movie' ? 'movie' : 'tv';
  const dateField =
    type === 'movie' ? 'primary_release_date' : 'first_air_date';
  const params = {
    page: n,
    sort_by: sort === 'newest' ? `${dateField}.desc` : sort,
    include_adult: false,
    'vote_count.gte': sort.startsWith('vote_average')
      ? 300
      : sort === 'newest'
        ? 20
        : undefined,
  };
  if (sort === 'newest') {
    params[`${dateField}.lte`] = new Date().toISOString().slice(0, 10);
  }
  if (kind === 'anime') params.with_keywords = ANIME_KEYWORD;
  if (kind === 'tv') params.without_keywords = ANIME_KEYWORD;
  if (providers?.length && region) {
    params.with_watch_providers = providers.join('|');
    params.watch_region = region;
    params.with_watch_monetization_types = 'flatrate|free|ads';
  }
  const data = await tmdb(`/discover/${type}`, params, { signal });
  const result = page(data, type);
  return { ...result, items: result.items.filter(hasPoster) };
}

export async function searchTitles(query, { page: n = 1, signal } = {}) {
  const data = await tmdb(
    '/search/multi',
    { query, page: n, include_adult: false },
    { signal },
  );
  return page(data);
}

const APPEND = {
  movie:
    'credits,release_dates,watch/providers,videos,recommendations,images,keywords,external_ids',
  tv: 'aggregate_credits,content_ratings,watch/providers,videos,recommendations,images,keywords,external_ids,episode_groups',
};

const titleParams = (type) => ({
  append_to_response: APPEND[type],
  include_image_language: 'en,null',
});

export function pickLogo(raw) {
  const logos = raw.images?.logos ?? [];
  const logo =
    logos.find((l) => l.iso_639_1 === 'en' && l.aspect_ratio >= 1.2) ??
    logos.find((l) => l.aspect_ratio >= 1.2) ??
    logos[0];
  return logo?.file_path ?? null;
}

const withLogo = (raw, type) => {
  const item = toItem(raw, type);
  return item && { ...item, logo: pickLogo(raw) };
};

export async function getTitle(type, id, { signal } = {}) {
  const raw = await tmdb(`/${type}/${id}`, titleParams(type), { signal });
  return { raw, item: withLogo(raw, type) };
}

export function peekLogo(item) {
  if (!item) return null;
  if (item.logo !== undefined) return item.logo;
  const raw = peek(`/${item.type}/${item.id}`, titleParams(item.type));
  return raw ? pickLogo(raw) : undefined;
}

export const prefetchTitle = (item) =>
  getTitle(item.type, item.id)
    .then(({ item: full }) => {
      if (!full?.logo) return;
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = logoImg(full.logo);
    })
    .catch(() => {});

export const getProviders = (type, id, { signal } = {}) =>
  tmdb(`/${type}/${id}/watch/providers`, {}, { signal });

export const getSeason = (tvId, season, { signal } = {}) =>
  tmdb(`/tv/${tvId}/season/${season}`, {}, { signal });

export async function getCollection(id, { signal } = {}) {
  const data = await tmdb(`/collection/${id}`, {}, { signal });
  const parts = toItems(data.parts, 'movie').sort((a, b) =>
    (a.date || '9999').localeCompare(b.date || '9999'),
  );
  return { ...data, parts };
}

const normalize = (text = '') =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const baseName = (text = '') =>
  normalize(
    text
      .split(/[:：|–—]| - /)[0]
      .replace(/\b(season|part|chapter|vol\.?|volume)\b.*$/i, '')
      .replace(/\s\d+$/, ''),
  );

const companies = (raw) =>
  new Set(
    [...(raw.production_companies ?? []), ...(raw.networks ?? [])].map(
      (c) => c.id,
    ),
  );

const inOrder = (items) =>
  [...items].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));

const isStory = (detail, type) => {
  const genres = (detail.genres ?? []).map((g) => g.id);
  if (type === 'tv') {
    return !genres.some((id) => [99, 10763, 10764, 10767].includes(id));
  }
  if (genres.includes(99)) return false;
  const released =
    detail.release_date && detail.release_date <= new Date().toISOString();
  return !released || !detail.runtime || detail.runtime >= 40;
};

async function namedGroup(raw, self, signal) {
  const names = [
    baseName(self.title),
    baseName(raw.original_title ?? raw.original_name),
  ].filter((name, i, all) => name.length >= 3 && all.indexOf(name) === i);
  const own = companies(raw);
  if (!names.length || !own.size) return null;

  const genres = new Set((raw.genres ?? []).map((g) => g.id));
  const pages = await Promise.all(
    names.map((query) =>
      tmdb('/search/multi', { query, include_adult: false }, { signal }),
    ),
  );
  const seen = new Set([self.key]);
  const candidates = pages
    .flatMap((page) => page.results)
    .filter((r) => {
      if (r.media_type !== 'movie' && r.media_type !== 'tv') return false;
      const key = `${r.media_type}-${r.id}`;
      if (seen.has(key) || !r.poster_path) return false;
      if (r.original_language !== raw.original_language) return false;
      if (genres.size && !r.genre_ids?.some((id) => genres.has(id))) {
        return false;
      }
      const titles = [r.title, r.name, r.original_title, r.original_name].map(
        normalize,
      );
      const match = names.some((name) =>
        titles.some((t) => t === name || t.startsWith(`${name} `)),
      );
      if (match) seen.add(key);
      return match;
    })
    .slice(0, 12);
  if (!candidates.length) return null;

  const verified = await Promise.all(
    candidates.map((r) =>
      tmdb(`/${r.media_type}/${r.id}`, {}, { signal })
        .then((detail) => {
          const shared = [...companies(detail)].some((id) => own.has(id));
          return shared && isStory(detail, r.media_type) ? r : null;
        })
        .catch(() => null),
    ),
  );
  const related = toItems(verified.filter(Boolean)).filter(
    (item) => !EXTRAS.test(item.title),
  );
  if (!related.length) return null;
  const parts = inOrder([self, ...related]);
  const shortest = parts.reduce((a, b) =>
    b.title.length < a.title.length ? b : a,
  );
  return { id: 'named', name: shortest.title, parts, href: null };
}

export async function getConnected(type, raw, { signal } = {}) {
  const self = toItem(raw, type);
  const keywords = new Set(
    (raw.keywords?.keywords ?? raw.keywords?.results ?? []).map((k) => k.id),
  );
  const collectionId = type === 'movie' ? raw.belongs_to_collection?.id : null;
  const tasks = [];

  if (collectionId) {
    const curated = UNIVERSES.find((u) => u.collection === collectionId);
    tasks.push(
      getCollection(collectionId, { signal }).then((c) => ({
        id: `collection-${c.id}`,
        name: curated?.name ?? c.name.replace(/ Collection$/, ''),
        parts: c.parts,
        href: universeHref(c.id),
      })),
    );
  }

  for (const u of UNIVERSES) {
    if (!u.keyword || !keywords.has(u.keyword)) continue;
    tasks.push(
      getKeywordUniverse(u.keyword, { signal }).then((parts) => ({
        id: `universe-${u.slug}`,
        name: u.name,
        parts: parts.some((p) => p.key === self.key)
          ? parts
          : inOrder([...parts, self]),
        href: `/universe/${u.slug}`,
      })),
    );
  }

  if (type === 'tv') tasks.push(namedGroup(raw, self, signal));

  const groups = await Promise.all(tasks.map((task) => task.catch(() => null)));
  return groups.filter((g) => g && g.parts.length > 1);
}

const NON_STORY_TV = '99,10763,10764,10767';
const EXTRAS =
  /\b(making of|behind the scenes|featurette|special look|recap|first look)\b/i;

export async function getKeywordUniverse(keywordId, { signal } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const discoverPages = (type, params, pages) =>
    Promise.all(
      pages.map((n) =>
        tmdb(
          `/discover/${type}`,
          { with_keywords: keywordId, page: n, ...params },
          { signal },
        )
          .then((data) => toItems(data.results, type))
          .catch(() => []),
      ),
    ).then((all) => all.flat());

  const [films, upcoming, series] = await Promise.all([
    discoverPages(
      'movie',
      {
        without_genres: 99,
        'with_runtime.gte': 40,
        'primary_release_date.lte': today,
        sort_by: 'primary_release_date.asc',
      },
      [1, 2, 3, 4],
    ),
    discoverPages(
      'movie',
      {
        without_genres: 99,
        'primary_release_date.gte': today,
        sort_by: 'primary_release_date.asc',
      },
      [1],
    ),
    discoverPages(
      'tv',
      { without_genres: NON_STORY_TV, sort_by: 'first_air_date.asc' },
      [1, 2],
    ),
  ]);

  const seen = new Set();
  return inOrder(
    [...films, ...upcoming, ...series].filter((item) => {
      if (!item.poster || seen.has(item.key) || EXTRAS.test(item.title)) {
        return false;
      }
      seen.add(item.key);
      return true;
    }),
  );
}

export async function getProviderCatalog(region, { signal } = {}) {
  const [movie, tv] = await Promise.all([
    tmdb('/watch/providers/movie', { watch_region: region }, { signal }),
    tmdb('/watch/providers/tv', { watch_region: region }, { signal }),
  ]);
  const byId = new Map();
  for (const p of [...movie.results, ...tv.results]) {
    const priority = p.display_priorities?.[region] ?? p.display_priority;
    const known = byId.get(p.provider_id);
    if (!known || priority < known.priority) {
      byId.set(p.provider_id, {
        id: p.provider_id,
        name: p.provider_name,
        logo: p.logo_path,
        priority,
      });
    }
  }
  return [...byId.values()].sort((a, b) => a.priority - b.priority);
}

export async function getRegions({ signal } = {}) {
  const data = await tmdb('/watch/providers/regions', {}, { signal });
  return data.results
    .map((r) => ({ code: r.iso_3166_1, name: r.english_name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const MONETIZATION = [
  ['flatrate', 'Stream'],
  ['free', 'Free'],
  ['ads', 'With ads'],
  ['rent', 'Rent'],
  ['buy', 'Buy'],
];

export function providerRows(block, services = []) {
  if (!block) return { mine: [], others: [], streaming: [], link: null };
  const rows = new Map();
  for (const [field, how] of MONETIZATION) {
    for (const p of block[field] ?? []) {
      if (rows.has(p.provider_id)) continue;
      rows.set(p.provider_id, {
        id: p.provider_id,
        name: p.provider_name,
        logo: p.logo_path,
        priority: p.display_priority,
        how,
        field,
      });
    }
  }
  const all = [...rows.values()].sort((a, b) => a.priority - b.priority);
  const picked = new Set(services);
  return {
    mine: all.filter((r) => picked.has(r.id)),
    others: all.filter((r) => !picked.has(r.id)),
    streaming: all.filter((r) => r.field !== 'rent' && r.field !== 'buy'),
    link: block.link ?? null,
  };
}

export function certification(raw, type, region) {
  for (const code of [region, 'US']) {
    const cert =
      type === 'movie'
        ? raw.release_dates?.results
            ?.find((r) => r.iso_3166_1 === code)
            ?.release_dates?.map((d) => d.certification)
            .find(Boolean)
        : raw.content_ratings?.results?.find((r) => r.iso_3166_1 === code)
            ?.rating;
    if (cert) return { cert, region: code };
  }
  return null;
}

export function pickTrailer(raw) {
  const videos = (raw.videos?.results ?? []).filter(
    (v) => v.site === 'YouTube',
  );
  return (
    videos.find((v) => v.type === 'Trailer' && v.official) ??
    videos.find((v) => v.type === 'Trailer') ??
    videos.find((v) => v.type === 'Teaser') ??
    null
  );
}

const RELEASE = { theatrical: [2, 3], digital: [4], physical: [5] };

export function releaseDates(raw, region) {
  const results = raw.release_dates?.results ?? [];
  for (const code of [region, 'US']) {
    const dates = results.find((r) => r.iso_3166_1 === code)?.release_dates;
    if (!dates?.length) continue;
    const first = (types) =>
      dates
        .filter((d) => types.includes(d.type) && d.release_date)
        .map((d) => d.release_date.slice(0, 10))
        .sort()[0] ?? null;
    return {
      region: code,
      theatrical: first(RELEASE.theatrical),
      digital: first(RELEASE.digital),
      physical: first(RELEASE.physical),
    };
  }
  return null;
}

export const getReleaseDates = (id, region, { signal } = {}) =>
  tmdb(`/movie/${id}/release_dates`, {}, { signal }).then((data) =>
    releaseDates({ release_dates: data }, region),
  );

export const getPerson = (id, { signal } = {}) =>
  tmdb(
    `/person/${id}`,
    { append_to_response: 'combined_credits,external_ids' },
    { signal },
  );
