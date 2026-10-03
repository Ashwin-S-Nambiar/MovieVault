import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { Agent } from 'node:https';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { pageHtml } from './server/html.js';
import { getShareMeta } from './server/share.js';

const agent = new Agent({ keepAlive: true, maxSockets: 8 });

const notFoundPage = () => {
  let outDir = 'dist';
  return {
    name: 'not-found-page',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const template = await readFile(resolve(outDir, 'index.html'), 'utf8');
      await mkdir(resolve(outDir, 'share'), { recursive: true });
      for (const name of ['search', 'vault', 'universes']) {
        await writeFile(
          resolve(outDir, 'share', `${name}.html`),
          pageHtml(template, await getShareMeta(`/${name}`)),
        );
      }
      await copyFile(
        resolve(outDir, 'index.html'),
        resolve(outDir, '404.html'),
      );
    },
  };
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), notFoundPage()],
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
