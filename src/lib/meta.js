import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { img } from './tmdb';

const SITE = 'MovieVault';
const ORIGIN = 'https://movievault.ashwin.co.in';

export const DEFAULT_DESCRIPTION =
  'Find where to stream any film, series or anime, follow whole universes in release order, and keep a vault of what to watch next.';

const DEFAULT_IMAGE = `${ORIGIN}/og.jpg`;

export const pageImage = (name) => `${ORIGIN}/og/${name}.jpg`;

function setMeta(attr, key, value) {
  let node = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attr, key);
    document.head.append(node);
  }
  node.setAttribute('content', value);
}

const clip = (text, max = 160) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export const backdropImage = (path) => (path ? img(path, 'w1280') : null);

export function usePageMeta({ title, description, image, type = 'website' }) {
  const { pathname } = useLocation();
  useEffect(() => {
    const fullTitle = title
      ? `${title} · ${SITE}`
      : `${SITE} · Where to stream anything`;
    const desc = clip(description || DEFAULT_DESCRIPTION);
    const path =
      pathname === '/index.html' ? '/' : pathname.replace(/\/$/, '') || '/';
    const url = `${ORIGIN}${path}`;
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', image || DEFAULT_IMAGE);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', type);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', image || DEFAULT_IMAGE);
    setMeta('property', 'og:image:alt', fullTitle);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = url;
  }, [title, description, image, type, pathname]);
}
