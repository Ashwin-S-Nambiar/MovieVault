import { readFile } from 'node:fs/promises';
import { createElement as h } from 'react';
import { clip } from './share.js';

let assets;
export function cardAssets() {
  assets ??= Promise.all([
    readFile(new URL('./fonts/geist-regular.ttf', import.meta.url)),
    readFile(new URL('./fonts/geist-bold.ttf', import.meta.url)),
    readFile(new URL('../public/film.svg', import.meta.url)),
  ]).then(([regular, bold, icon]) => ({
    fonts: [
      { name: 'Geist', data: regular, weight: 400, style: 'normal' },
      { name: 'Geist', data: bold, weight: 700, style: 'normal' },
    ],
    icon: `data:image/svg+xml;base64,${icon.toString('base64')}`,
  }));
  return assets;
}

async function loadArtwork(path, fetcher) {
  if (!/^\/[A-Za-z0-9_-]+\.(jpg|png)$/.test(path || '')) return null;
  try {
    const response = await fetcher(`https://image.tmdb.org/t/p/w780${path}`, {
      signal: AbortSignal.timeout(2_500),
      redirect: 'error',
    });
    const type = response.headers.get('content-type')?.split(';')[0];
    if (!response.ok || !['image/jpeg', 'image/png'].includes(type))
      return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 4_000_000) return null;
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

const artworkCache = new Map();
export async function artworkData(path, fetcher) {
  if (fetcher) return loadArtwork(path, fetcher);
  if (!/^\/[A-Za-z0-9_-]+\.(jpg|png)$/.test(path || '')) return null;
  const cached = artworkCache.get(path);
  if (cached && cached.until > Date.now()) return cached.value;
  const value = loadArtwork(path, fetch);
  artworkCache.delete(path);
  artworkCache.set(path, { value, until: Date.now() + 3_600_000 });
  if (artworkCache.size > 12)
    artworkCache.delete(artworkCache.keys().next().value);
  const result = await value;
  if (!result) artworkCache.delete(path);
  return result;
}

export function movieCard(meta, { icon, artwork }) {
  const headingSize =
    meta.name.length > 65 ? 38 : meta.name.length > 35 ? 44 : 53;
  const text = { display: 'flex', flexDirection: 'column' };
  return h(
    'div',
    {
      style: {
        display: 'flex',
        width: 1200,
        height: 630,
        background: '#fafaf9',
        color: '#171716',
        fontFamily: 'Geist',
        alignItems: 'center',
        position: 'relative',
      },
    },
    h(
      'div',
      { style: { ...text, marginLeft: 72, width: 485 } },
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 26,
            fontWeight: 700,
          },
        },
        h('img', { src: icon, width: 42, height: 42, alt: '' }),
        'MovieVault',
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: headingSize,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: '-.045em',
            marginTop: 42,
            maxHeight: 200,
            overflow: 'hidden',
          },
        },
        clip(meta.name, 100),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            color: '#e5302f',
            fontSize: 15,
            marginTop: 18,
          },
        },
        meta.label,
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: 21,
            lineHeight: 1.5,
            color: '#71716b',
            marginTop: 18,
          },
        },
        clip(meta.description, 135),
      ),
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          position: 'absolute',
          left: 594,
          top: 128,
          width: 534,
          height: 374,
          border: '5px solid #efefeb',
          borderRadius: 22,
          overflow: 'hidden',
          background: '#fafaf9',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
      artwork
        ? h('img', {
            src: artwork,
            width: meta.portrait ? 218 : 524,
            height: meta.portrait ? 330 : 364,
            style: {
              objectFit: meta.portrait ? 'cover' : 'contain',
              borderRadius: meta.portrait ? 3 : 0,
              border: ['movie', 'tv'].includes(meta.kind)
                ? '4px solid #171716'
                : 'none',
              boxShadow: meta.portrait ? '6px 8px 15px #00000022' : 'none',
            },
            alt: '',
          })
        : h(
            'div',
            {
              style: {
                ...text,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
              },
            },
            h('img', { src: icon, width: 92, height: 92, alt: '' }),
            h(
              'div',
              { style: { display: 'flex', fontSize: 24, color: '#71716b' } },
              meta.label,
            ),
          ),
    ),
  );
}
