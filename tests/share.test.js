import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { GET as imageRequest } from '../api/og.js';
import { artworkData } from '../server/card.js';
import { pageHtml } from '../server/html.js';
import { getShareMeta, parseRoute } from '../server/share.js';

test('share routes reject external URLs, malformed IDs and unknown universes', () => {
  for (const path of [
    'https://example.com/movie/1',
    '/movie/0',
    '/movie/-1',
    '/movie/1/extra',
    '/movie/%2F1',
    '/universe/unknown',
    '/movie/12345678901',
  ])
    assert.equal(parseRoute(path), null);
  assert.equal(parseRoute('/watchlist').path, '/vault');
});

test('movie metadata arrives in initial HTML, escaped, with versioned matching OG/Twitter images', async () => {
  let calls = 0;
  const meta = await getShareMeta('/movie/550', {
    key: 'fixture',
    fetcher: async (url) => {
      calls++;
      assert.equal(new URL(url).origin, 'https://api.themoviedb.org');
      return Response.json({
        title: 'A "film" <script>alert(1)</script>',
        release_date: '1999-10-15',
        overview: 'A story & more.',
        poster_path: '/poster.jpg',
      });
    },
  });
  const html = pageHtml(
    await readFile(new URL('../index.html', import.meta.url), 'utf8'),
    meta,
  );
  assert.equal(calls, 1);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(
    html,
    /property="og:image" content="https:\/\/movievault.ashwin.co.in\/api\/og\?route=%2Fmovie%2F550&amp;v=1"/,
  );
  assert.match(
    html,
    /name="twitter:image" content="https:\/\/movievault.ashwin.co.in\/api\/og\?route=%2Fmovie%2F550&amp;v=1"/,
  );
  assert.match(html, /property="og:image:type" content="image\/png"/);
  assert.match(html, /href="https:\/\/movievault.ashwin.co.in\/movie\/550"/);
  assert.match(html, /src="\/src\/main.jsx"/);
});

test('fixed pages and curated universes do not fetch metadata; outages and 404s are distinguished', async () => {
  const noFetch = async () => {
    throw new Error('Unexpected fetch');
  };
  const search = await getShareMeta('/search', {
    key: 'fixture',
    fetcher: noFetch,
  });
  assert.equal(
    search.image,
    'https://movievault.ashwin.co.in/og/search.jpg?v=1',
  );
  assert.equal(search.complete, true);
  const unavailable = await getShareMeta('/movie/550', {
    key: 'fixture',
    fetcher: noFetch,
  });
  assert.equal(unavailable.complete, false);
  assert.equal(unavailable.status, 200);
  const absent = await getShareMeta('/tv/99999', {
    key: 'fixture',
    fetcher: async () => new Response(null, { status: 404 }),
  });
  assert.equal(absent.status, 404);
  const studio = await getShareMeta('/company/1', {
    key: 'fixture',
    fetcher: noFetch,
  });
  assert.equal(studio.imageType, 'image/jpeg');
});

test('artwork only comes from the fixed TMDB image origin and accepted image types', async () => {
  let calls = 0;
  const fetcher = async (url) => {
    calls++;
    assert.equal(new URL(url).origin, 'https://image.tmdb.org');
    return new Response('not an image', {
      headers: { 'content-type': 'text/html' },
    });
  };
  for (const path of [
    'https://example.com/img.jpg',
    '/../secret.jpg',
    '/asset.svg',
  ])
    assert.equal(await artworkData(path, fetcher), null);
  assert.equal(calls, 0);
  assert.equal(await artworkData('/poster.jpg', fetcher), null);
  assert.equal(calls, 1);
});

test('image requests normalize cache keys, reject unsupported routes, and do not cache a failed lookup', async () => {
  const invalid = await imageRequest(
    new Request(
      'https://movievault.ashwin.co.in/api/og?route=%2Fcompany%2F1&v=1',
    ),
  );
  assert.equal(invalid.status, 404);
  const redirect = await imageRequest(
    new Request(
      'https://movievault.ashwin.co.in/api/og?route=/movie/550&v=1&noise=123',
    ),
  );
  assert.equal(redirect.status, 308);
  assert.equal(
    redirect.headers.get('location'),
    'https://movievault.ashwin.co.in/api/og?route=%2Fmovie%2F550&v=1',
  );
  const oldKey = process.env.TMDB_API_KEY;
  process.env.TMDB_API_KEY = '';
  try {
    const response = await imageRequest(
      new Request(
        'https://movievault.ashwin.co.in/api/og?route=%2Fmovie%2F550&v=1',
      ),
    );
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('content-type'), 'image/png');
    const png = Buffer.from(await response.arrayBuffer());
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
  } finally {
    if (oldKey === undefined) delete process.env.TMDB_API_KEY;
    else process.env.TMDB_API_KEY = oldKey;
  }
});
