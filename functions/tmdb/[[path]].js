import { GET } from '../../server/tmdb.js';

export async function onRequest({ request, params, waitUntil }) {
  if (request.cf?.country !== 'IN')
    return Response.json(
      { status_message: 'The TMDB proxy only serves India' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  const cache = caches.default;
  if (request.method === 'GET') {
    const hit = await cache.match(request);
    if (hit) {
      const response = new Response(hit.body, hit);
      response.headers.set(
        'Cache-Control',
        'public, max-age=0, must-revalidate',
      );
      return response;
    }
  }
  const url = new URL(request.url);
  url.searchParams.append('path', [params.path].flat().join('/'));
  const response = await GET(new Request(url, { method: request.method }));
  const ttl = response.headers.get('CDN-Cache-Control');
  response.headers.delete('CDN-Cache-Control');
  if (request.method === 'GET' && ttl && ttl !== 'no-store') {
    const stored = new Response(response.clone().body, response);
    stored.headers.set('Cache-Control', ttl);
    waitUntil(cache.put(request, stored));
  }
  return response;
}
