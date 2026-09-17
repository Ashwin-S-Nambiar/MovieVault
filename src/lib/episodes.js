import { isAnime } from './format';
import { tmdb } from './tmdb';
import { primeQuery } from './useQuery';

const LONG = 30;
const MAX_PART = 60;
const CHUNK = 25;
const GAP_DAYS = 56;
const APPEND_LIMIT = 20;
const TYPE_RANK = [1, 6, 4, 3, 7, 5, 2];
const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{S}\s]+$/u;
const DAY = 86_400_000;

export const MIN_VOTES = 3;

export const regularSeasons = (raw) =>
  (raw.seasons ?? []).filter((s) => s.season_number > 0 && s.episode_count > 0);

export const needsSplit = (raw) =>
  regularSeasons(raw).some((s) => s.episode_count > LONG);

export const toEpisode = (ep, overview = true) => ({
  id: ep.id,
  season: ep.season_number,
  number: ep.episode_number,
  name: ep.name,
  overview: overview ? ep.overview : undefined,
  air: ep.air_date ?? '',
  runtime: ep.runtime,
  rating: ep.vote_average ?? 0,
  votes: ep.vote_count ?? 0,
});

export function withAbsolute(raw, episodes) {
  const first = episodes[0];
  if (!first || !isAnime(raw) || first.number !== 1) return episodes;
  let offset = 0;
  for (const s of regularSeasons(raw)) {
    if (s.season_number === first.season) break;
    offset += s.episode_count;
  }
  if (!offset) return episodes;
  return episodes.map((ep) => ({ ...ep, absolute: offset + ep.number }));
}

const chunk = (list, size) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) =>
    list.slice(i * size, i * size + size),
  );

const byOrder = (a, b) => a.order - b.order;

function candidates(raw) {
  const seasons = regularSeasons(raw);
  const total = seasons.reduce((n, s) => n + s.episode_count, 0);
  const rank = (g) => {
    const i = TYPE_RANK.indexOf(g.type);
    return (i < 0 ? TYPE_RANK.length : i) + (LATIN.test(g.name) ? 0 : 10);
  };
  return (raw.episode_groups?.results ?? [])
    .filter(
      (g) =>
        g.episode_count === total &&
        g.group_count > seasons.length &&
        total / g.group_count <= MAX_PART,
    )
    .sort((a, b) => rank(a) - rank(b) || a.group_count - b.group_count);
}

function partsFromGroup(detail, total) {
  const groups = [...detail.groups].sort(byOrder);
  const seen = new Set();
  let last = -1;
  const parts = [];
  for (const [i, group] of groups.entries()) {
    const episodes = [...group.episodes].sort(byOrder);
    if (!episodes.length || episodes.length > MAX_PART) return null;
    for (const ep of episodes) {
      const at = ep.season_number * 100_000 + ep.episode_number;
      if (ep.season_number === 0 || at <= last || seen.has(at)) return null;
      seen.add(at);
      last = at;
    }
    const latin = LATIN.test(group.name);
    const numbered = latin && /season (\d+)/i.exec(group.name);
    parts.push({
      key: `g-${group.id}`,
      name: latin ? group.name : `Part ${i + 1}`,
      short: numbered ? `S${numbered[1]}` : `P${i + 1}`,
      season: episodes[0].season_number,
      episodes: episodes.map((ep) => toEpisode(ep)),
    });
  }
  return seen.size === total ? parts : null;
}

export async function getEpisodeGuide(raw, { signal } = {}) {
  if (!needsSplit(raw)) return null;
  const total = regularSeasons(raw).reduce((n, s) => n + s.episode_count, 0);
  for (const group of candidates(raw).slice(0, 2)) {
    const detail = await tmdb(
      `/tv/episode_group/${group.id}`,
      {},
      { signal },
    ).catch((error) => {
      if (signal?.aborted) throw error;
      return null;
    });
    const parts = detail && partsFromGroup(detail, total);
    if (parts) return parts;
  }
  return null;
}

const days = (date) => Date.parse(`${date}T00:00:00`) / DAY;

export function splitSeason(season, episodes) {
  const name = season.name || `Season ${season.season_number}`;
  const whole = [
    {
      key: `s-${season.season_number}`,
      name,
      short: `S${season.season_number}`,
      season: season.season_number,
      episodes,
    },
  ];
  if (episodes.length <= LONG) return whole;

  const runs = [[]];
  for (const ep of episodes) {
    const run = runs[runs.length - 1];
    const prev = run[run.length - 1];
    if (prev?.air && ep.air && days(ep.air) - days(prev.air) > GAP_DAYS) {
      runs.push([ep]);
    } else {
      run.push(ep);
    }
  }
  const pieces = runs.flatMap((run) =>
    run.length > MAX_PART ? chunk(run, CHUNK) : [run],
  );
  if (pieces.length === 1) return whole;
  return pieces.map((part, i) => ({
    key: `s-${season.season_number}-${i}`,
    name: `${name} · Part ${i + 1}`,
    short: `S${season.season_number}.${i + 1}`,
    season: season.season_number,
    episodes: part,
  }));
}

async function loadSeasons(raw, signal) {
  const numbers = regularSeasons(raw).map((s) => s.season_number);
  const pages = await Promise.all(
    chunk(numbers, APPEND_LIMIT).map((batch) =>
      tmdb(
        `/tv/${raw.id}`,
        { append_to_response: batch.map((n) => `season/${n}`).join(',') },
        { signal },
      ),
    ),
  );
  const seasons = new Map();
  for (const page of pages) {
    for (const n of numbers) {
      const season = page[`season/${n}`];
      if (!season) continue;
      seasons.set(n, season);
      primeQuery(`season-${raw.id}-${n}`, season);
    }
  }
  return seasons;
}

const slim = (parts) =>
  parts.map((part) => ({
    ...part,
    episodes: part.episodes.map(({ overview, ...ep }) => ep),
  }));

export async function getRatings(raw, { signal } = {}) {
  const guide = await getEpisodeGuide(raw, { signal });
  if (guide) return slim(guide);
  const seasons = await loadSeasons(raw, signal);
  return regularSeasons(raw).flatMap((s) => {
    const data = seasons.get(s.season_number);
    return data
      ? splitSeason(
          s,
          withAbsolute(
            raw,
            (data.episodes ?? []).map((ep) => toEpisode(ep, false)),
          ),
        )
      : [];
  });
}

export function partStats(episodes) {
  const rated = episodes.filter((ep) => ep.votes >= MIN_VOTES);
  const years = episodes.map((ep) => ep.air.slice(0, 4)).filter(Boolean);
  return {
    average: rated.length
      ? rated.reduce((sum, ep) => sum + ep.rating, 0) / rated.length
      : null,
    from: years[0] ?? null,
    to: years[years.length - 1] ?? null,
  };
}

export const yearSpan = ({ from, to }) =>
  from ? (to && to !== from ? `${from} - ${to}` : from) : '';
