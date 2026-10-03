import { readFile } from 'node:fs/promises';
import { pageHtml } from '../server/html.js';
import { getShareMeta } from '../server/share.js';

let shell;
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const routes = params.getAll('route');
  const meta = routes.length === 1 ? await getShareMeta(routes[0]) : null;
  if (!meta)
    return new Response('Page not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  shell ??= readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  return new Response(pageHtml(await shell, meta), {
    status: meta.status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Vercel-CDN-Cache-Control': meta.complete
        ? 'max-age=300, stale-while-revalidate=3600'
        : 'no-store',
    },
  });
}
