const TIMEOUT = 8_000;
const NO_STORE = {
  'Cache-Control': 'no-store',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};
const CACHE = {
  reference: 'max-age=86400, stale-while-revalidate=604800',
  detail: 'max-age=3600, stale-while-revalidate=21600',
  availability: 'max-age=1800, stale-while-revalidate=3600',
  discovery: 'max-age=300, stale-while-revalidate=900',
  search: 'max-age=60, stale-while-revalidate=120',
};

const integer = (max) => (value) =>
  /^(0|[1-9]\d*)$/.test(value) && Number(value) <= max;
const ids = (value) => /^[1-9]\d{0,9}([,|][1-9]\d{0,9}){0,49}$/.test(value);
const language = (value) =>
  /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,2}$/.test(value);
const region = (value) => /^[A-Z]{2}$/.test(value);
const date = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const imageLanguages = (value) =>
  /^(?:[a-z]{2,3}|null)(,(?:[a-z]{2,3}|null)){0,2}$/.test(value);
const page = (value) => integer(500)(value) && Number(value) > 0;
const common = { language };
const discovery = {
  ...common,
  page,
  include_adult: (value) => value === 'false',
  sort_by: (value) => /^(popularity|vote_average)\.desc$/.test(value),
  'vote_count.gte': integer(1_000_000),
  with_keywords: ids,
  without_keywords: ids,
  with_watch_providers: ids,
  watch_region: region,
  with_watch_monetization_types: (value) =>
    /^(flatrate\|)?free\|ads$/.test(value),
  with_genres: ids,
  without_genres: ids,
  with_original_language: (value) => /^[a-z]{2,3}$/.test(value),
  'with_runtime.gte': integer(10000),
  'with_runtime.lte': integer(10000),
  with_companies: ids,
};

const append =
  (names, seasons = false) =>
  (value) => {
    const parts = value.split(',');
    return (
      parts.length <= 20 &&
      new Set(parts).size === parts.length &&
      parts.every(
        (part) =>
          names.includes(part) ||
          (seasons && /^season\/(0|[1-9]\d{0,3})$/.test(part)),
      )
    );
  };
const movieAppend = append([
  'credits',
  'release_dates',
  'watch/providers',
  'videos',
  'recommendations',
  'images',
  'keywords',
  'external_ids',
]);
const tvAppend = append(
  [
    'aggregate_credits',
    'content_ratings',
    'watch/providers',
    'videos',
    'recommendations',
    'images',
    'keywords',
    'external_ids',
    'episode_groups',
  ],
  true,
);

// Derived from src/lib/catalog.js, src/lib/episodes.js and reconnect() in
// src/lib/tmdb.js. Nested resources used only via append stay append-only.
const routes = [
  [/^configuration$/, common, null], // A recovery probe must reach TMDB.
  [
    /^watch\/providers\/(movie|tv)$/,
    { ...common, watch_region: region },
    'reference',
  ],
  [/^watch\/providers\/regions$/, common, 'reference'],
  [/^genre\/(movie|tv)\/list$/, common, 'reference'],
  [/^trending\/all\/week$/, common, 'discovery'],
  [/^movie\/now_playing$/, { ...common, region }, 'discovery'],
  [
    /^discover\/movie$/,
    {
      ...discovery,
      region,
      sort_by: (value) =>
        discovery.sort_by(value) ||
        /^primary_release_date\.(asc|desc)$/.test(value),
      with_release_type: (value) => value === '4',
      'release_date.gte': date,
      'release_date.lte': date,
      'primary_release_date.gte': date,
      'primary_release_date.lte': date,
    },
    'discovery',
  ],
  [
    /^discover\/tv$/,
    {
      ...discovery,
      with_networks: ids,
      sort_by: (value) =>
        discovery.sort_by(value) || /^first_air_date\.(asc|desc)$/.test(value),
      'first_air_date.lte': date,
    },
    'discovery',
  ],
  [
    /^search\/multi$/,
    {
      ...common,
      page,
      include_adult: discovery.include_adult,
      query: (value) =>
        value.trim().length > 0 &&
        value.length <= 500 &&
        [...value].every(
          (char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127,
        ),
    },
    'search',
  ],
  [
    /^find\/(tt|nm)\d{6,9}$/,
    { ...common, external_source: (value) => value === 'imdb_id' },
    'detail',
  ],
  [
    /^movie\/[1-9]\d{0,9}$/,
    {
      ...common,
      append_to_response: movieAppend,
      include_image_language: imageLanguages,
    },
    'detail',
  ],
  [
    /^tv\/[1-9]\d{0,9}$/,
    {
      ...common,
      append_to_response: tvAppend,
      include_image_language: imageLanguages,
    },
    'detail',
  ],
  [/^(movie|tv)\/[1-9]\d{0,9}\/watch\/providers$/, common, 'availability'],
  [/^movie\/[1-9]\d{0,9}\/release_dates$/, common, 'availability'],
  [
    /^(movie|tv)\/[1-9]\d{0,9}\/images$/,
    { ...common, include_image_language: imageLanguages },
    'detail',
  ],
  [/^tv\/[1-9]\d{0,9}\/season\/(0|[1-9]\d{0,3})$/, common, 'detail'],
  [
    /^tv\/[1-9]\d{0,9}\/season\/(0|[1-9]\d{0,3})\/episode\/[1-9]\d{0,4}$/,
    {
      ...common,
      append_to_response: append(['credits', 'videos', 'images']),
    },
    'detail',
  ],
  [/^tv\/episode_group\/[a-f0-9]{24}$/, common, 'detail'],
  [
    /^person\/[1-9]\d{0,9}$/,
    {
      ...common,
      append_to_response: append(['combined_credits', 'external_ids']),
    },
    'detail',
  ],
  [/^(collection|company|network|keyword)\/[1-9]\d{0,9}$/, common, 'detail'],
];

const error = (status, message, headers = {}) =>
  Response.json(
    { status_message: message },
    { status, headers: { ...NO_STORE, ...headers } },
  );

export async function GET(request) {
  if (request.method !== 'GET')
    return error(405, 'Only GET is allowed', { Allow: 'GET' });
  const url = new URL(request.url);
  const paths = url.searchParams.getAll('path');
  if (paths.length !== 1) return error(400, 'Expected one TMDB path');
  // URLSearchParams decodes once. Reject remaining escapes, dot segments,
  // backslashes, repeated separators and URLs rather than resolving them.
  const path = paths[0].replace(/^\//, '').replace(/\/$/, '');
  if (
    path.length > 200 ||
    !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path)
  ) {
    return error(400, 'Bad path');
  }
  const route = routes.find(([pattern]) => pattern.test(path));
  if (!route) return error(404, 'TMDB endpoint not allowed');
  const [, validators, category] = route;
  const params = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key === 'path') continue;
    if (
      params.has(key) ||
      value.length > 1000 ||
      !Object.hasOwn(validators, key) ||
      !validators[key](value)
    ) {
      return error(400, 'Unsupported or invalid query parameter');
    }
    params.set(key, value);
  }
  if (path === 'search/multi' && !params.has('query'))
    return error(400, 'Search query required');
  if (path.startsWith('find/') && !params.has('external_source'))
    return error(400, 'External source required');

  const key = process.env.TMDB_API_KEY;
  if (!key) return error(503, 'TMDB is not configured');
  params.set('api_key', key);
  const signal = AbortSignal.timeout(TIMEOUT);
  try {
    const upstream = await fetch(
      `https://api.themoviedb.org/3/${path}?${params}`,
      {
        signal,
        redirect: 'error',
        headers: { Accept: 'application/json' },
      },
    );
    // Read the body within the timeout so a stalled/invalid body cannot become
    // a cached successful response. Preserve TMDB's JSON and HTTP status.
    const data = await upstream.json();
    const headers = new Headers(NO_STORE);
    if (upstream.ok && data?.success !== false && category) {
      const availability = params
        .get('append_to_response')
        ?.split(',')
        .some((part) => part === 'watch/providers' || part === 'release_dates');
      headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      headers.set(
        'Vercel-CDN-Cache-Control',
        CACHE[availability ? 'availability' : category],
      );
    }
    const retryAfter = upstream.headers.get('Retry-After');
    if (retryAfter) headers.set('Retry-After', retryAfter);
    return Response.json(data, { status: upstream.status, headers });
  } catch {
    return signal.aborted
      ? error(504, 'TMDB request timed out')
      : error(502, 'TMDB unreachable or returned an invalid response');
  }
}

// Explicit handlers prevent automatic HEAD handling from making upstream calls.
export {
  GET as HEAD,
  GET as POST,
  GET as PUT,
  GET as PATCH,
  GET as DELETE,
  GET as OPTIONS,
};
