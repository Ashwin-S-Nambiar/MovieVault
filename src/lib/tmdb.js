import { reportFailure, reportRetry, reportSuccess } from './health';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p';
const TTL = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const cache = new Map();
const inflight = new Map();

export const hasApiKey = Boolean(API_KEY);

export const img = (path, size = 'w342') =>
  path ? `${IMAGE_URL}/${size}${path}` : null;

class TmdbError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildUrl(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', API_KEY ?? '');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function fetchWithRetry(url) {
  let lastError;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      reportRetry();
      await wait(400 * 2.5 ** (attempt - 1) + Math.random() * 150);
    }

    const started = performance.now();
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        reportSuccess(performance.now() - started);
        return data;
      }
      lastError = new TmdbError(
        response.status === 401
          ? 'The TMDB API key was rejected'
          : `TMDB responded with ${response.status}`,
        response.status,
      );
      if (response.status !== 429 && response.status < 500) break;
    } catch {
      lastError = new TmdbError('Could not reach TMDB', 0);
    }
  }

  reportFailure(lastError);
  throw lastError;
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
