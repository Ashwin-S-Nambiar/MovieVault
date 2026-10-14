import { pageHtml } from './html.js';
import { getShareMeta } from './share.js';

export async function sharePage(route, shell) {
  const meta = await getShareMeta(route);
  if (!meta)
    return new Response('Page not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  return new Response(pageHtml(await shell(), meta), {
    status: meta.status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': meta.complete
        ? 'public, max-age=300, stale-while-revalidate=3600'
        : 'no-store',
    },
  });
}

const BOT =
  /bot|crawler|facebookexternalhit|whatsapp|preview|embedly|iframely/i;

export function shareRoute({ request, env }) {
  const home = new URL('/', request.url);
  if (!BOT.test(request.headers.get('user-agent') || ''))
    return env.ASSETS.fetch(home);
  return sharePage(new URL(request.url).pathname, () =>
    env.ASSETS.fetch(home).then((response) => response.text()),
  );
}
