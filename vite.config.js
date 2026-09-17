import { Agent } from 'node:https';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const agent = new Agent({ keepAlive: true, maxSockets: 8 });

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const site = (loadEnv(mode, process.cwd()).VITE_SITE_URL ?? '').replace(
    /\/$/,
    '',
  );
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
          rewrite: (path) => path.replace(/^\/tmdb/, '/3'),
        },
      },
    },
  };
});
