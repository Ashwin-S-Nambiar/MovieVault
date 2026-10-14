export async function onRequest({ request, params }) {
  if (request.cf?.country !== 'IN')
    return new Response('The TMDB image proxy only serves India', {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    });
  const path = [params.path].flat().join('/');
  if (
    !/^(w\d{2,4}|h\d{2,4}|original)\/[A-Za-z0-9_-]+\.(jpg|png|svg)$/.test(path)
  )
    return new Response('Not found', { status: 404 });
  const upstream = await fetch(`https://image.tmdb.org/t/p/${path}`, {
    cf: { cacheEverything: true, cacheTtl: 31_536_000 },
  });
  const response = new Response(upstream.body, upstream);
  if (upstream.ok)
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable',
    );
  return response;
}
