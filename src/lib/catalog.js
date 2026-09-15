import { toItem, toItems } from './format';
import { tmdb } from './tmdb';

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
    'credits,release_dates,watch/providers,videos,recommendations,images,keywords',
  tv: 'aggregate_credits,content_ratings,watch/providers,videos,recommendations,images,keywords',
};

export async function getTitle(type, id, { signal } = {}) {
  const raw = await tmdb(
    `/${type}/${id}`,
    { append_to_response: APPEND[type], include_image_language: 'en,null' },
    { signal },
  );
  return { raw, item: toItem(raw, type) };
}

export const prefetchTitle = (item) =>
  getTitle(item.type, item.id).catch(() => {});

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

export async function getKeywordUniverse(keywordId, { signal } = {}) {
  const pages = await Promise.all(
    [1, 2, 3, 4].map((n) =>
      tmdb(
        '/discover/movie',
        {
          with_keywords: keywordId,
          sort_by: 'primary_release_date.asc',
          page: n,
        },
        { signal },
      ).catch(() => ({ results: [] })),
    ),
  );
  const seen = new Set();
  return toItems(
    pages.flatMap((p) => p.results),
    'movie',
  ).filter((item) => {
    if (!item.poster || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
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
