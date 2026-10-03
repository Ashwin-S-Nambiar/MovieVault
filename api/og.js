import { ImageResponse } from '@vercel/og';
import { artworkData, cardAssets, movieCard } from '../server/card.js';
import { getShareMeta, parseRoute } from '../server/share.js';
import { routeImage } from '../src/lib/share-image.js';

export async function GET(request) {
  const url = new URL(request.url);
  const routes = url.searchParams.getAll('route');
  const parsed = routes.length === 1 ? parseRoute(routes[0]) : null;
  const canonical = parsed && routeImage(parsed.path);
  if (!canonical)
    return new Response('Image not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  if (url.search !== new URL(canonical).search) {
    return new Response(null, {
      status: 308,
      headers: { Location: canonical, 'Cache-Control': 'public, max-age=3600' },
    });
  }
  const meta = await getShareMeta(parsed.path);
  if (!meta?.imageType.includes('png') || meta.status === 404) {
    return new Response('Image not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  const [assets, artwork] = await Promise.all([
    cardAssets(),
    artworkData(meta.artwork),
  ]);
  return new ImageResponse(movieCard(meta, { icon: assets.icon, artwork }), {
    width: 1200,
    height: 630,
    fonts: assets.fonts,
    headers: {
      'cache-control': !meta.complete
        ? 'no-store'
        : meta.artwork && !artwork
          ? 'public, max-age=60, s-maxage=60'
          : 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
