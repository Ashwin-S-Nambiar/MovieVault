import { toItem, toItems } from './format';
import { languageStore } from './prefs';
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

const RUNTIME = {
  movie: { short: { lte: 100 }, long: { gte: 150 } },
  tv: { short: { lte: 30 }, long: { gte: 50 } },
};

export async function discover(
  kind,
  {
    page: n = 1,
    sort = 'popularity.desc',
    providers,
    region,
    genres,
    language,
    length,
    free,
    signal,
  } = {},
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
    params.with_watch_monetization_types = free
      ? 'free|ads'
      : 'flatrate|free|ads';
  } else if (free && region) {
    params.watch_region = region;
    params.with_watch_monetization_types = 'free|ads';
  }
  if (genres?.length) params.with_genres = genres.join('|');
  if (language && kind !== 'anime') params.with_original_language = language;
  const runtime = RUNTIME[type][length];
  if (runtime?.lte) params['with_runtime.lte'] = runtime.lte;
  if (runtime?.gte) params['with_runtime.gte'] = runtime.gte;
  const data = await tmdb(`/discover/${type}`, params, { signal });
  const result = page(data, type);
  return { ...result, items: result.items.filter(hasPoster) };
}

const IMDB = /(?:^|\/|\b)(tt|nm)\d{6,9}\b/;

export const imdbId = (query) =>
  IMDB.exec(query)?.[0].replace(/^\//, '') ?? null;

const toPerson = (p) => ({
  id: p.id,
  name: p.name,
  photo: p.profile_path,
  role: p.known_for_department,
});

export async function findImdb(id, { signal } = {}) {
  const data = await tmdb(
    `/find/${id}`,
    { external_source: 'imdb_id' },
    { signal },
  );
  const items = [
    ...toItems(data.movie_results, 'movie'),
    ...toItems(data.tv_results, 'tv'),
  ];
  return {
    items,
    people: (data.person_results ?? []).map(toPerson),
    page: 1,
    totalPages: 1,
    total: items.length + (data.person_results?.length ?? 0),
  };
}

export async function searchTitles(query, { page: n = 1, signal } = {}) {
  const id = imdbId(query);
  if (id) return findImdb(id, { signal });
  const data = await tmdb(
    '/search/multi',
    { query, page: n, include_adult: false },
    { signal },
  );
  return {
    ...page(data),
    people:
      n === 1
        ? data.results
            .filter(
              (r) =>
                r.media_type === 'person' && r.profile_path && r.popularity > 1,
            )
            .slice(0, 8)
            .map(toPerson)
        : [],
  };
}

export async function getGenres(kind, { signal } = {}) {
  const lists = await Promise.all(
    (kind === 'movie'
      ? ['movie']
      : kind === 'all'
        ? ['movie', 'tv']
        : ['tv']
    ).map((type) => tmdb(`/genre/${type}/list`, {}, { signal })),
  );
  const byName = new Map();
  for (const list of lists) {
    for (const g of list.genres) byName.set(g.name, g.id);
  }
  return [...byName].map(([name, id]) => ({ id, name }));
}

export async function nowPlaying(region, { signal } = {}) {
  const data = await tmdb('/movie/now_playing', { region }, { signal });
  return toItems(data.results, 'movie')
    .filter(hasPoster)
    .sort((a, b) => b.popularity - a.popularity);
}

export async function newOnDigital(region, { signal } = {}) {
  const today = new Date();
  const from = new Date(today.getTime() - 35 * 86_400_000);
  const data = await tmdb(
    '/discover/movie',
    {
      region,
      with_release_type: 4,
      'release_date.gte': from.toISOString().slice(0, 10),
      'release_date.lte': today.toISOString().slice(0, 10),
      sort_by: 'popularity.desc',
      'vote_count.gte': 5,
      include_adult: false,
    },
    { signal },
  );
  return toItems(data.results, 'movie').filter(hasPoster);
}

export async function recentEpisodes(saved, { signal } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const recent = new Date(Date.now() - 14 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const series = saved.filter((item) => item.type === 'tv').slice(0, 24);
  const details = await Promise.all(
    series.map((item) =>
      tmdb(`/tv/${item.id}`, {}, { signal })
        .then((raw) => ({ item, raw }))
        .catch(() => null),
    ),
  );
  return details
    .filter(Boolean)
    .map(({ item, raw }) => {
      const next = raw.next_episode_to_air;
      const last = raw.last_episode_to_air;
      if (next?.air_date && next.air_date <= soon) {
        return { item, date: next.air_date, upcoming: next.air_date > today };
      }
      if (last?.air_date && last.air_date >= recent) {
        return { item, date: last.air_date, upcoming: false };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) =>
      a.upcoming === b.upcoming
        ? a.upcoming
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date)
        : a.upcoming
          ? 1
          : -1,
    );
}

const APPEND = {
  movie:
    'credits,release_dates,watch/providers,videos,recommendations,images,keywords,external_ids',
  tv: 'aggregate_credits,content_ratings,watch/providers,videos,recommendations,images,keywords,external_ids,episode_groups',
};

const baseLanguage = () => languageStore.get().split('-')[0];

const titleParams = (type) => {
  const lang = baseLanguage();
  return {
    append_to_response: APPEND[type],
    include_image_language: lang === 'en' ? 'en,null' : `${lang},en,null`,
  };
};

export function pickLogo(raw) {
  const logos = raw.images?.logos ?? [];
  const lang = baseLanguage();
  const logo =
    logos.find((l) => l.iso_639_1 === lang && l.aspect_ratio >= 1.2) ??
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
