import { IconChartDots3, IconChevronRight } from '@tabler/icons-react';
import { lazy, Suspense, useCallback, useState } from 'react';
import { getSeason } from '../lib/catalog';
import {
  getEpisodeGuide,
  needsSplit,
  partStats,
  regularSeasons,
  splitSeason,
  toEpisode,
  withAbsolute,
  yearSpan,
} from '../lib/episodes';
import { longDate, runtime } from '../lib/format';
import { useInView } from '../lib/hooks';
import { useQuery } from '../lib/useQuery';
import { Poster } from './Case';
import Segmented from './Segmented';

const EpisodeRatings = lazy(() => import('./EpisodeRatings'));
const EpisodeSheet = lazy(() => import('./EpisodeSheet'));

const EPISODE_PAGE = 24;

const episodeCount = (n) =>
  `${n.toLocaleString()} episode${n === 1 ? '' : 's'}`;

function SeasonRow({
  raw,
  season,
  name,
  poster,
  sub,
  episodes: preset,
  onEpisode,
}) {
  const tvId = raw.id;
  const [open, setOpen] = useState(false);
  const count = preset?.length ?? season.episode_count;
  const [newest, setNewest] = useState(count > EPISODE_PAGE);
  const [limit, setLimit] = useState(EPISODE_PAGE);
  const fetched = useQuery(
    `season-${tvId}-${season.season_number}`,
    (signal) => getSeason(tvId, season.season_number, { signal }),
    { enabled: open && !preset },
  );
  const loaded = fetched.data?.episodes
    ? withAbsolute(
        raw,
        fetched.data.episodes.map((ep) => toEpisode(ep)),
      )
    : undefined;
  const episodes = preset ?? loaded;
  const parts = !preset && loaded ? splitSeason(season, loaded) : null;

  return (
    <li className="season">
      <button
        type="button"
        className="season-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Poster item={{ title: name, poster }} size="w92" />
        <span>
          <span className="season-name">{name}</span>
          <br />
          <span className="season-sub">{sub}</span>
        </span>
        <IconChevronRight stroke={1.8} />
      </button>
      <div className="disclose" data-open={open}>
        <div>
          {open && !episodes ? (
            <div className="sentinel">
              <span className="spinner" />
            </div>
          ) : (
            episodes && (
              <EpisodeList
                episodes={episodes}
                parts={parts?.length > 1 ? parts : null}
                newest={newest}
                limit={limit}
                onNewest={setNewest}
                onMore={() => setLimit((n) => n + EPISODE_PAGE * 2)}
                onOpen={(index) => onEpisode(episodes, index)}
              />
            )
          )}
        </div>
      </div>
    </li>
  );
}

function EpisodeList({
  episodes,
  parts,
  newest,
  limit,
  onNewest,
  onMore,
  onOpen,
}) {
  const long = episodes.length > EPISODE_PAGE;
  const ordered = newest ? [...episodes].reverse() : episodes;
  const shown = ordered.slice(0, limit);
  const partOf = new Map();
  for (const part of parts ?? []) {
    for (const ep of part.episodes) partOf.set(ep.id, part);
  }
  let previous = null;

  return (
    <>
      {long && (
        <div className="episodes-bar">
          <span>
            {shown.length.toLocaleString()} of{' '}
            {episodes.length.toLocaleString()}
          </span>
          <Segmented
            label="Episode order"
            value={newest ? 'newest' : 'oldest'}
            onChange={(value) => onNewest(value === 'newest')}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'First' },
            ]}
          />
        </div>
      )}
      <ol className="episodes">
        {shown.map((ep) => {
          const part = partOf.get(ep.id);
          const heading = part && part !== previous;
          previous = part;
          return [
            heading && (
              <li key={part.key} className="episode-part">
                {part.name.split(' · ').pop()}
                <span>{yearSpan(partStats(part.episodes))}</span>
              </li>
            ),
            <li key={ep.id}>
              <button
                type="button"
                className="episode"
                onClick={() => onOpen(episodes.indexOf(ep))}
              >
                <span className="episode-num">
                  {String(ep.number).padStart(2, '0')}
                </span>
                <span>
                  <strong className="episode-name">{ep.name}</strong>
                  <span className="muted">
                    {ep.absolute ? ` · #${ep.absolute}` : ''}
                    {ep.runtime ? ` · ${runtime(ep.runtime)}` : ''}
                    {ep.air ? ` · ${longDate(ep.air)}` : ''}
                  </span>
                  {ep.overview && (
                    <span className="episode-overview">{ep.overview}</span>
                  )}
                </span>
              </button>
            </li>,
          ];
        })}
      </ol>
      {shown.length < episodes.length && (
        <button type="button" className="btn episodes-more" onClick={onMore}>
          Show {Math.min(EPISODE_PAGE * 2, episodes.length - shown.length)} more
        </button>
      )}
    </>
  );
}

function SeasonGhosts() {
  return (
    <ul className="seasons" aria-hidden="true">
      {[62, 48, 56].map((w) => (
        <li key={w} className="season">
          <div className="season-head">
            <Poster item={null} />
            <span className="ghost-para">
              <span
                className="skeleton ghost-line"
                style={{ width: `${w}%` }}
              />
              <span className="skeleton ghost-line ghost-sm" />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Seasons({ raw }) {
  const [ref, inView] = useInView({ rootMargin: '400px' });
  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [ratingsUsed, setRatingsUsed] = useState(false);
  const [episode, setEpisode] = useState(null);
  const openEpisode = useCallback(
    (list, index) => setEpisode({ list, index }),
    [],
  );
  const moveEpisode = useCallback(
    (index) => setEpisode((e) => ({ ...e, index })),
    [],
  );
  const closeEpisode = useCallback(
    () => setEpisode((e) => ({ ...e, index: -1 })),
    [],
  );
  const split = needsSplit(raw);
  const guide = useQuery(
    `guide-${raw.id}`,
    (signal) => getEpisodeGuide(raw, { signal }),
    { enabled: split && inView },
  );
  const seasons = regularSeasons(raw);
  const specials = (raw.seasons ?? []).find(
    (s) => s.season_number === 0 && s.episode_count > 0,
  );
  const posterOf = (n) =>
    raw.seasons?.find((s) => s.season_number === n)?.poster_path ??
    raw.poster_path;
  const waiting = split && guide.data === undefined && !guide.error;

  if (!seasons.length && !specials) return null;

  const rows = guide.data
    ? guide.data.map((part) => {
        const stats = partStats(part.episodes);
        return {
          key: part.key,
          season: { season_number: part.season },
          name: part.name,
          poster: posterOf(part.season),
          episodes: part.episodes,
          sub: [
            yearSpan(stats),
            episodeCount(part.episodes.length),
            stats.average ? `★ ${stats.average.toFixed(1)}` : null,
          ],
        };
      })
    : seasons.map((s) => ({
        key: s.id,
        season: s,
        name: s.name,
        poster: s.poster_path ?? raw.poster_path,
        sub: [
          s.air_date?.slice(0, 4),
          episodeCount(s.episode_count),
          s.vote_average ? `★ ${s.vote_average.toFixed(1)}` : null,
        ],
      }));
  if (!seasons.length) {
    rows.push({
      key: specials.id,
      season: specials,
      name: specials.name,
      poster: specials.poster_path,
      sub: [episodeCount(specials.episode_count)],
    });
  }

  return (
    <section ref={ref} className="block">
      <div className="block-head">
        <h2 className="block-title">
          Seasons <small>{episodeCount(raw.number_of_episodes ?? 0)}</small>
        </h2>
        {seasons.length > 0 && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setRatingsUsed(true);
              setRatingsOpen(true);
            }}
          >
            <IconChartDots3 stroke={1.8} />
            Ratings
          </button>
        )}
      </div>
      {waiting ? (
        <SeasonGhosts />
      ) : (
        <ul className={guide.data ? 'seasons content-in' : 'seasons'}>
          {rows.map((row) => (
            <SeasonRow
              key={row.key}
              raw={raw}
              season={row.season}
              name={row.name}
              poster={row.poster}
              episodes={row.episodes}
              sub={row.sub.filter(Boolean).join(' · ')}
              onEpisode={openEpisode}
            />
          ))}
        </ul>
      )}
      {episode && (
        <Suspense fallback={null}>
          <EpisodeSheet
            tvId={raw.id}
            list={episode.list}
            index={episode.index}
            onIndex={moveEpisode}
            onClose={closeEpisode}
          />
        </Suspense>
      )}
      {ratingsUsed && (
        <Suspense fallback={null}>
          <EpisodeRatings
            raw={raw}
            open={ratingsOpen}
            onClose={() => setRatingsOpen(false)}
          />
        </Suspense>
      )}
    </section>
  );
}
