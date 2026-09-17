export async function GET(request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') ?? '';
  if (!/^[\w/-]+$/.test(path)) {
    return Response.json({ status_message: 'Bad path' }, { status: 400 });
  }
  url.searchParams.delete('path');
  url.searchParams.set('api_key', process.env.TMDB_API_KEY ?? '');

  let upstream;
  try {
    upstream = await fetch(
      `https://api.themoviedb.org/3/${path}?${url.searchParams}`,
    );
  } catch {
    return Response.json(
      { status_message: 'TMDB unreachable' },
      { status: 502 },
    );
  }

  const headers = new Headers({
    'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
  });
  if (upstream.ok) headers.set('CDN-Cache-Control', 'max-age=600');
  return new Response(upstream.body, { status: upstream.status, headers });
}
