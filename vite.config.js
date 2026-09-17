import { Agent } from 'node:https';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const agent = new Agent({ keepAlive: true, maxSockets: 8 });

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const site = (env.VITE_SITE_URL ?? '').replace(/\/$/, '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'site-url',
        transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', site),
      },
    ],
    server: {
      proxy: {
        '/tmdb-img': {
          target: 'https://image.tmdb.org',
          changeOrigin: true,
          agent,
          rewrite: (path) => path.replace(/^\/tmdb-img/, '/t/p'),
        },
        '/tmdb': {
          target: 'https://api.themoviedb.org',
          changeOrigin: true,
          agent,
          rewrite: (path) => {
            const url = new URL(path.replace(/^\/tmdb/, '/3'), 'http://x');
            url.searchParams.set('api_key', env.TMDB_API_KEY ?? '');
            return url.pathname + url.search;
          },
        },
      },
    },
  };
});
