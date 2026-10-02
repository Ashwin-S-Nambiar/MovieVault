import {
  isDown,
  reportFailure,
  reportRetry,
  reportSuccess,
  retryFailed,
  startReconnect,
} from './health';
import { languageStore } from './prefs';

const BASE_URL = '/tmdb';
const IMAGE_URL = '/tmdb-img';
const TTL = 10 * 60 * 1000;
const REFERENCE_TTL = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const TIMEOUT = 10_000;

const cache = new Map();
const inflight = new Map();

export const img = (path, size = 'w342') =>
  path ? `${IMAGE_URL}/${size}${path}` : null;

export const logoImg = (path, size = 'w300') =>
  img(path, path?.endsWith('.svg') ? 'original' : size);

class TmdbError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildUrl(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`, location.origin);
  const language = languageStore.get();
  if (language !== 'en-US' && params.language === undefined) {
    url.searchParams.set('language', language);
  }
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  url.searchParams.sort();
  return url.toString();
}

const ttl = (url) =>
  /\/tmdb\/(watch\/providers\/(movie|tv|regions)|genre\/(movie|tv)\/list)$/.test(
    new URL(url).pathname,
  )
    ? REFERENCE_TTL
    : TTL;

function remember(url, data) {
  const at = Date.now();
  cache.set(url, { data, at });
  const parent = new URL(url);
  const appended = parent.searchParams.get('append_to_response');
  if (!appended) return;
  parent.searchParams.delete('append_to_response');
  // Appended payloads also satisfy the app's standalone resource requests.
  // Keep image-language filters only on images, and keep response language
  // on every key so localized entries never leak into another language.
  for (const name of appended.split(',')) {
    const value = data[name];
    if (!value || typeof value !== 'object' || value.success === false)
      continue;
    const child = new URL(parent);
    child.pathname += `/${name}`;
    if (name !== 'images') child.searchParams.delete('include_image_language');
    child.searchParams.sort();
    cache.set(child.toString(), { data: value, at });
  }
  parent.searchParams.delete('include_image_language');
  parent.searchParams.sort();
  cache.set(parent.toString(), { data, at });
}

async function fetchWithRetry(url) {
  let lastError;
  const attempts = isDown() ? 1 : MAX_ATTEMPTS;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      reportRetry();
      await wait(400 * 2.5 ** (attempt - 1) + Math.random() * 150);
    }

    const started = performance.now();
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
      if (response.ok) {
        const data = await response.json();
        reportSuccess(performance.now() - started);
        return data;
      }
    } catch {
      lastError = new TmdbError('Could not reach TMDB', 0);
      continue;
    }

    const { status } = response;
    lastError = new TmdbError(
      status === 401
        ? 'The TMDB API key was rejected'
        : `TMDB responded with ${status}`,
      status,
    );
    if (status === 401) break;
    if (status !== 429 && status < 500) {
      reportSuccess(performance.now() - started);
      throw lastError;
    }
  }

  reportFailure(lastError);
  throw lastError;
}

export async function reconnect() {
  if (!startReconnect()) return;
  try {
    await fetchWithRetry(buildUrl('/configuration'));
    retryFailed();
  } catch {}
}

window.addEventListener('online', () => {
  if (isDown()) reconnect();
});

export function peek(path, params) {
  const url = buildUrl(path, params);
  const hit = cache.get(url);
  return hit && Date.now() - hit.at < ttl(url) ? hit.data : null;
}

export function tmdb(path, params, { signal } = {}) {
  if (signal?.aborted) return Promise.reject(signal.reason);
  const url = buildUrl(path, params);
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttl(url)) return Promise.resolve(hit.data);

  let pending = inflight.get(url);
  if (!pending) {
    pending = fetchWithRetry(url)
      .then((data) => {
        remember(url, data);
        return data;
      })
      .finally(() => inflight.delete(url));
    inflight.set(url, pending);
  }

  if (!signal) return pending;

  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, {
      once: true,
    });
    pending.then(
      (data) => {
        signal.removeEventListener('abort', abort);
        resolve(data);
      },
      (error) => {
        signal.removeEventListener('abort', abort);
        reject(error);
      },
    );
  });
}
