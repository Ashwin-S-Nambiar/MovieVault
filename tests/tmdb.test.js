import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import * as proxy from '../api/tmdb.js';

const originalKey = process.env.TMDB_API_KEY;
beforeEach(() => {
  process.env.TMDB_API_KEY = 'server-test-key';
});
afterEach(() => {
  mock.restoreAll();
  if (originalKey === undefined) delete process.env.TMDB_API_KEY;
  else process.env.TMDB_API_KEY = originalKey;
});
const request = (path, params = {}, method = 'GET') =>
  new Request(
    `https://movievault.test/api/tmdb?${new URLSearchParams({ path, ...params })}`,
    { method },
  );
const noCache = (response) => {
  for (const name of [
    'Cache-Control',
    'CDN-Cache-Control',
    'Vercel-CDN-Cache-Control',
  ]) {
    assert.equal(response.headers.get(name), 'no-store');
  }
};
const upstream = (body = { id: 11 }, status = 200, headers = {}) =>
  mock.method(globalThis, 'fetch', async () =>
    Response.json(body, { status, headers }),
  );

// Includes every endpoint family called by catalog.js / episodes.js / reconnect.
const cases = [
  ['configuration', {}, null],
  ['watch/providers/movie', { watch_region: 'IN' }, 86400],
  ['watch/providers/tv', { watch_region: 'US' }, 86400],
  ['watch/providers/regions', {}, 86400],
  ['genre/movie/list', {}, 86400],
  ['genre/tv/list', {}, 86400],
  ['trending/all/week', {}, 300],
  ['movie/now_playing', { region: 'IN' }, 300],
  [
    'discover/movie',
    {
      page: 500,
      sort_by: 'primary_release_date.desc',
      include_adult: false,
      'vote_count.gte': 300,
      with_keywords: 210024,
      without_keywords: 210024,
      with_watch_providers: '8|119',
      watch_region: 'IN',
      with_watch_monetization_types: 'flatrate|free|ads',
      with_genres: '28|12',
      without_genres: 99,
      with_original_language: 'ja',
      'with_runtime.lte': 100,
      'with_runtime.gte': 40,
      with_companies: 41077,
      'primary_release_date.lte': '2026-10-02',
      'primary_release_date.gte': '2026-01-01',
      region: 'IN',
      with_release_type: 4,
      'release_date.gte': '2026-09-01',
      'release_date.lte': '2026-10-02',
    },
    300,
  ],
  [
    'discover/tv',
    {
      with_networks: 213,
      sort_by: 'first_air_date.asc',
      without_genres: '99,10763,10764,10767',
      'first_air_date.lte': '2026-10-02',
      with_watch_monetization_types: 'free|ads',
    },
    300,
  ],
  [
    'search/multi',
    { query: '千と千尋 & friends', page: 2, include_adult: false },
    60,
  ],
  ['find/tt0133093', { external_source: 'imdb_id' }, 3600],
  ['find/nm0000158', { external_source: 'imdb_id' }, 3600],
  [
    'movie/11',
    {
      append_to_response:
        'credits,release_dates,watch/providers,videos,recommendations,images,keywords,external_ids',
      include_image_language: 'hi,en,null',
    },
    1800,
  ],
  [
    'tv/1396',
    {
      append_to_response:
        'aggregate_credits,content_ratings,watch/providers,videos,recommendations,images,keywords,external_ids,episode_groups',
      include_image_language: 'en,null',
    },
    1800,
  ],
  ['movie/11', {}, 3600],
  ['tv/1396', {}, 3600],
  ['movie/11/watch/providers', {}, 1800],
  ['tv/1396/watch/providers', {}, 1800],
  ['movie/11/release_dates', {}, 1800],
  ['movie/11/images', { include_image_language: 'en,null' }, 3600],
  ['tv/1396/images', { include_image_language: 'ja,en,null' }, 3600],
  ['tv/1396/season/0', {}, 3600],
  [
    'tv/1396/season/1/episode/1',
    { append_to_response: 'credits,videos,images' },
    3600,
  ],
  [
    'tv/1396',
    {
      append_to_response: Array.from(
        { length: 20 },
        (_, i) => `season/${i + 1}`,
      ).join(','),
    },
    3600,
  ],
  ['tv/episode_group/5acf93e60e0a26346d0000ce', {}, 3600],
  ['person/31', { append_to_response: 'combined_credits,external_ids' }, 3600],
  ...['collection', 'company', 'network', 'keyword'].map((kind) => [
    `${kind}/11`,
    {},
    3600,
  ]),
];
for (const [path, params, ttl] of cases) {
  test(`allows ${path} ${params.append_to_response ?? ''}`, async () => {
    const fetch = upstream();
    const response = await proxy.GET(
      request(path, { language: 'hi-IN', ...params }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id: 11 });
    const [url, options] = fetch.mock.calls[0].arguments;
    const forwarded = new URL(url);
    assert.equal(forwarded.origin, 'https://api.themoviedb.org');
    assert.equal(forwarded.pathname, `/3/${path}`);
    assert.equal(forwarded.searchParams.get('api_key'), 'server-test-key');
    assert.equal(forwarded.searchParams.get('language'), 'hi-IN');
    for (const [key, value] of Object.entries(params))
      assert.equal(forwarded.searchParams.get(key), String(value));
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    if (ttl) {
      assert.match(
        response.headers.get('Vercel-CDN-Cache-Control'),
        new RegExp(`^max-age=${ttl}, stale-while-revalidate=\\d+$`),
      );
      assert.equal(
        response.headers.get('Cache-Control'),
        'public, max-age=0, must-revalidate',
      );
    } else noCache(response);
  });
}

test('normalizes one optional boundary slash and rejects ambiguous paths', async () => {
  const fetch = upstream();
  assert.equal((await proxy.GET(request('/movie/11/'))).status, 200);
  for (const path of [
    '',
    '//movie/11',
    'movie//11',
    'movie/../account',
    'movie/%2e%2e/account',
    'movie/11%2fimages',
    'movie\\11',
    'https://example.com',
    'movie/11?api_key=bad',
    'movie/11#x',
  ]) {
    const response = await proxy.GET(request(path));
    assert.equal(response.status, 400, path);
    noCache(response);
  }
  assert.equal(fetch.mock.callCount(), 1);
});

test('rejects unused, authentication and account endpoints without fetching', async () => {
  const fetch = upstream();
  for (const path of [
    'authentication/token/new',
    'account/11',
    'movie/11/account_states',
    'movie/11/similar',
    'movie/11/credits',
    'search/person',
    'trending/all/day',
    'movie/0',
    'movie/11/changes',
  ]) {
    const response = await proxy.GET(request(path));
    assert.equal(response.status, 404, path);
    noCache(response);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('rejects secrets, unknown parameters, invalid pagination and unsafe appends', async () => {
  const fetch = upstream();
  for (const params of [
    { api_key: 'attacker' },
    { session_id: 'secret' },
    { guest_session_id: 'secret' },
    { access_token: 'secret' },
    { callback: 'evil' },
    { cache_bust: '123' },
    { append_to_response: 'account_states' },
    { append_to_response: 'images,images' },
    { append_to_response: 'images,../account' },
    { append_to_response: 'season/1' },
    { include_image_language: 'en&api_key=evil' },
    { language: 'x'.repeat(1001) },
    { constructor: 'oops' },
  ]) {
    const response = await proxy.GET(request('movie/11', params));
    assert.equal(response.status, 400);
    noCache(response);
  }
  for (const page of ['0', '501', '-1', '1.5', '01']) {
    assert.equal(
      (await proxy.GET(request('discover/movie', { page }))).status,
      400,
    );
  }
  const tooMany = Array.from({ length: 21 }, (_, i) => `season/${i}`).join(',');
  assert.equal(
    (await proxy.GET(request('tv/11', { append_to_response: tooMany }))).status,
    400,
  );
  for (const query of ['', ' ', '\u0000test', 'x'.repeat(501)]) {
    assert.equal(
      (await proxy.GET(request('search/multi', { query }))).status,
      400,
    );
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('rejects duplicate routing and query parameters', async () => {
  const fetch = upstream();
  for (const query of [
    'path=movie/11&path=tv/11',
    'path=movie/11&language=en&language=hi',
    'language=en',
  ]) {
    assert.equal(
      (
        await proxy.GET(
          new Request(`https://movievault.test/api/tmdb?${query}`),
        )
      ).status,
      400,
    );
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('rejects every non-GET method before fetching', async () => {
  const fetch = upstream();
  for (const method of ['HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    // biome-ignore lint/performance/noDynamicNamespaceImportAccess: exercise each exported HTTP handler in this server-only test
    const response = await proxy[method](request('movie/11', {}, method));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Allow'), 'GET');
    noCache(response);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

for (const status of [401, 403, 404, 422, 429, 500, 503]) {
  test(`preserves upstream ${status} JSON without caching`, async () => {
    const body = {
      success: false,
      status_code: 7,
      status_message: 'TMDB error',
    };
    upstream(body, status, {
      'Retry-After': '15',
      'Set-Cookie': 'untrusted=value',
    });
    const response = await proxy.GET(request('movie/11'));
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), body);
    assert.equal(response.headers.get('Retry-After'), '15');
    assert.equal(response.headers.get('Set-Cookie'), null);
    noCache(response);
  });
}

test('does not cache a nested TMDB-style top-level error with HTTP 200', async () => {
  upstream({ success: false, status_code: 7 });
  noCache(await proxy.GET(request('movie/11')));
});

test('missing configuration fails closed without an upstream call', async () => {
  const fetch = upstream();
  delete process.env.TMDB_API_KEY;
  const response = await proxy.GET(request('movie/11'));
  assert.equal(response.status, 503);
  noCache(response);
  assert.equal(fetch.mock.callCount(), 0);
});

test('network failures and invalid JSON become uncached 502 responses', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Network failed with a secret URL');
  });
  let response = await proxy.GET(request('movie/11'));
  assert.equal(response.status, 502);
  noCache(response);
  assert.doesNotMatch(await response.text(), /secret/);
  fetch.mock.mockImplementation(async () => new Response('<html>error</html>'));
  response = await proxy.GET(request('movie/11'));
  assert.equal(response.status, 502);
  noCache(response);
});

test('timeout covers upstream headers and body consumption', async () => {
  const controller = new AbortController();
  mock.method(AbortSignal, 'timeout', (ms) => {
    assert.equal(ms, 8000);
    return controller.signal;
  });
  mock.method(globalThis, 'fetch', async (_url, { signal }) => ({
    json: async () => {
      controller.abort(new DOMException('Timed out', 'TimeoutError'));
      throw signal.reason;
    },
  }));
  const response = await proxy.GET(request('movie/11'));
  assert.equal(response.status, 504);
  noCache(response);
});
