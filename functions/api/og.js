import { ogImage } from '../../server/og.js';

export const onRequest = ({ request, env }) =>
  ogImage(request, async (name) => {
    const response = await env.ASSETS.fetch(new URL(`/${name}`, request.url));
    if (!response.ok) throw new Error(`Missing ${name}`);
    return response.arrayBuffer();
  });
