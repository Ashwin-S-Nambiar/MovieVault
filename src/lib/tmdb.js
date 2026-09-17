import {
  isDown,
  reportFailure,
  reportRetry,
  reportSuccess,
  retryFailed,
  startReconnect,
} from './health';
import { languageStore } from './prefs';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = '/tmdb';
const IMAGE_URL = '/tmdb-img';
const TTL = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const TIMEOUT = 10_000;

const cache = new Map();
const inflight = new Map();

export const hasApiKey = Boolean(API_KEY);

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
  url.searchParams.set('api_key', API_KEY ?? '');
  const language = languageStore.get();
  if (language !== 'en-US' && params.language === undefined) {
    url.searchParams.set('language', language);
  }
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
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
  if (!API_KEY || !startReconnect()) return;
  try {
    await fetchWithRetry(buildUrl('/configuration'));
    retryFailed();
  } catch {}
}

window.addEventListener('online', () => {
  if (isDown()) reconnect();
});

export function peek(path, params) {
  const hit = cache.get(buildUrl(path, params));
  return hit && Date.now() - hit.at < TTL ? hit.data : null;
}

export function tmdb(path, params, { signal } = {}) {
  if (!API_KEY) {
    return Promise.reject(new TmdbError('Missing VITE_TMDB_API_KEY', 401));
  }

  const url = buildUrl(path, params);
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return Promise.resolve(hit.data);

  let pending = inflight.get(url);
  if (!pending) {
    pending = fetchWithRetry(url)
      .then((data) => {
        cache.set(url, { data, at: Date.now() });
        return data;
      })
      .finally(() => inflight.delete(url));
    inflight.set(url, pending);
  }

  if (!signal) return pending;

  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    signal.addEventListener('abort', () => reject(signal.reason), {
      once: true,
    });
    pending.then(resolve, reject);
  });
}
