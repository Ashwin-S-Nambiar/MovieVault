import {
  IconArrowLeft,
  IconChevronRight,
  IconPlayerPlayFilled,
  IconShare2,
  IconStarFilled,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useViewTransitionState,
} from 'react-router';
import { Poster } from '../components/Case';
import Connected from '../components/Connected';
import Footer from '../components/Footer';
import Img from '../components/Img';
import OpenCase from '../components/OpenCase';
import { WatchBadge } from '../components/Providers';
import SaveButton from '../components/SaveButton';
import Segmented from '../components/Segmented';
import Sheet from '../components/Sheet';
import Shelf, { RowNav } from '../components/Shelf';
import TitleCard from '../components/TitleCard';
import Topbar from '../components/Topbar';
import {
  certification,
  getSeason,
  getTitle,
  pickTrailer,
  providerRows,
} from '../lib/catalog';
import {
  compactMoney,
  longDate,
  parseId,
  plural,
  runtime,
  TYPE_LABEL,
  toItems,
  watchStatus,
} from '../lib/format';
import { claimHero } from '../lib/hero';
import { trackEdges, useMediaQuery, useReducedMotion } from '../lib/hooks';
import { backdropImage, usePageMeta } from '../lib/meta';
import { useRegion, useServices } from '../lib/prefs';
import { img } from '../lib/tmdb';
import { openSheet, toast } from '../lib/ui';
import { useQuery } from '../lib/useQuery';

const regionName = (code) => {
  try {
    return new Intl.DisplayNames(undefined, { type: 'region' }).of(code);
  } catch {
    return code;
  }
};

function useStageScroll(stageRef, hintRef, enabled) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const p = Math.min(
        1,
        Math.max(0, window.scrollY / (stage.offsetHeight * 0.8)),
      );
      stage.style.transform = `scale(${1 - p * 0.1})`;
      stage.style.filter = p > 0.01 ? `blur(${p * 16}px)` : '';
      stage.style.opacity = String(1 - p * 0.85);
      hintRef.current?.style.setProperty(
        '--hint-angle',
        `${22 * Math.max(0, 1 - p * 6)}deg`,
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      stage.style.transform = '';
      stage.style.filter = '';
      stage.style.opacity = '';
    };
  }, [stageRef, hintRef, enabled]);
}

const STATUS_NOTES = {
  soon: 'Not released yet. Save it and check back once it lands.',
  cinema: 'Showing in cinemas. Streaming usually follows a few months later.',
  rent: 'Not on a subscription service, but you can rent or buy it.',
  none: 'Not on any service in your region right now.',
};

function ProviderRow({ p, mine, link }) {
  return (
    <li>
      <a
        className={`provider ${mine ? 'provider-mine' : ''}`}
        href={link}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img className="plogo" src={img(p.logo, 'w92')} alt="" loading="lazy" />
        <span className="provider-name">{p.name}</span>
        <span className="provider-how">{p.how}</span>
      </a>
    </li>
  );
}

function Availability({ raw, item }) {
  const region = useRegion();
  const services = useServices();
  const [showOthers, setShowOthers] = useState(false);
  const rows = providerRows(
    raw['watch/providers']?.results?.[region],
    services,
  );
  const primary = rows.mine.length ? rows.mine : rows.others.slice(0, 3);
  const shownIds = new Set(primary.map((p) => p.id));
  const rest = (rows.mine.length ? rows.others : rows.others.slice(3)).filter(
    (p) => !shownIds.has(p.id) && p.name,
  );
  const status = watchStatus(item, {
    list: rows.streaming,
    buyable: rows.streaming.length < rows.mine.length + rows.others.length,
  });

  return (
    <section className="block">
      <h2 className="block-title">
        Available on <small>{regionName(region)}</small>
      </h2>
      {status && (
        <div className="availability-status">
          <WatchBadge status={status} />
          <span>{STATUS_NOTES[status.tone]}</span>
        </div>
      )}
      {primary.length === 0 ? (
        !status && (
          <p className="empty-note">
            Not available to stream, rent or buy in {regionName(region)} right
            now.
          </p>
        )
      ) : (
        <>
          {rows.mine.length === 0 && (
            <p className="section-sub" style={{ margin: '-6px 0 8px' }}>
              Not on your services.{' '}
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 28, padding: '0 8px' }}
                onClick={() => openSheet('services')}
              >
                Edit services
              </button>
            </p>
          )}
          <ul className="providers">
            {primary.map((p) => (
              <ProviderRow
                key={p.id}
                p={p}
                mine={rows.mine.length > 0}
                link={rows.link}
              />
            ))}
          </ul>
          {rest.length > 0 && (
            <>
              <button
                type="button"
                className="disclosure"
                aria-expanded={showOthers}
                onClick={() => setShowOthers((v) => !v)}
              >
                Other services
                <IconChevronRight stroke={1.8} />
              </button>
              <div className="disclose" data-open={showOthers}>
                <div>
                  <ul className="providers">
                    {rest.map((p) => (
                      <ProviderRow key={p.id} p={p} link={rows.link} />
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
          <p className="attribution">Availability from JustWatch</p>
        </>
      )}
    </section>
  );
}

const EPISODE_PAGE = 24;

function Season({ tvId, season }) {
  const [open, setOpen] = useState(false);
  const [newest, setNewest] = useState(season.episode_count > EPISODE_PAGE);
  const [limit, setLimit] = useState(EPISODE_PAGE);
  const episodes = useQuery(
    `season-${tvId}-${season.season_number}`,
    (signal) => getSeason(tvId, season.season_number, { signal }),
    { enabled: open },
  );
  const item = { title: season.name, poster: season.poster_path };

  return (
    <li className="season">
      <button
        type="button"
        className="season-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Poster item={item} size="w92" />
        <span>
          <span className="season-name">{season.name}</span>
          <br />
          <span className="season-sub">
            {[
              season.air_date?.slice(0, 4),
              `${season.episode_count.toLocaleString()} episode${season.episode_count === 1 ? '' : 's'}`,
              season.vote_average
                ? `★ ${season.vote_average.toFixed(1)}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <IconChevronRight stroke={1.8} />
      </button>
      <div className="disclose" data-open={open}>
        <div>
          {episodes.loading && !episodes.data ? (
            <div className="sentinel">
              <span className="spinner" />
            </div>
          ) : (
            <EpisodeList
              episodes={episodes.data?.episodes ?? []}
              newest={newest}
              limit={limit}
              onNewest={setNewest}
              onMore={() => setLimit((n) => n + EPISODE_PAGE * 2)}
            />
          )}
        </div>
      </div>
    </li>
  );
}

function EpisodeList({ episodes, newest, limit, onNewest, onMore }) {
  const long = episodes.length > EPISODE_PAGE;
  const ordered = newest ? [...episodes].reverse() : episodes;
  const shown = ordered.slice(0, limit);

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
        {shown.map((ep) => (
          <li key={ep.id} className="episode">
            <span className="episode-num">
              {String(ep.episode_number).padStart(2, '0')}
            </span>
            <div>
              <strong style={{ fontWeight: 500 }}>{ep.name}</strong>
              <span className="muted">
                {ep.runtime ? ` · ${runtime(ep.runtime)}` : ''}
                {ep.air_date ? ` · ${longDate(ep.air_date)}` : ''}
              </span>
              {ep.overview && <p>{ep.overview}</p>}
            </div>
          </li>
        ))}
      </ol>
      {shown.length < episodes.length && (
        <button type="button" className="btn episodes-more" onClick={onMore}>
          Show {Math.min(EPISODE_PAGE * 2, episodes.length - shown.length)} more
        </button>
      )}
    </>
  );
}

function Cast({ raw, type }) {
  const track = useRef(null);
  const people =
    type === 'tv'
      ? (raw.aggregate_credits?.cast ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          photo: p.profile_path,
          role: p.roles?.[0]?.character,
        }))
      : (raw.credits?.cast ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          photo: p.profile_path,
          role: p.character,
        }));
  if (!people.length) return null;

  return (
    <section className="block">
      <div className="block-head">
        <h2 className="block-title">Cast</h2>
        <RowNav track={track} label="cast" />
      </div>
      <div
        ref={(el) => {
          track.current = el;
          return trackEdges(el);
        }}
        className="shelf-track people"
      >
        {people.slice(0, 16).map((p) => (
          <div key={p.id} className="person">
            <div className="person-face">
              {p.photo ? (
                <Img src={img(p.photo, 'w185')} loading="lazy" />
              ) : (
                p.name[0]
              )}
            </div>
            <div>
              <div className="person-name">{p.name}</div>
              {p.role && <div className="person-role">{p.role}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Facts({ raw, type }) {
  const crew = raw.credits?.crew ?? [];
  const directors = crew.filter((c) => c.job === 'Director').map((c) => c.name);
  const writers = [
    ...new Set(
      crew
        .filter((c) => ['Screenplay', 'Writer', 'Novel'].includes(c.job))
        .map((c) => c.name),
    ),
  ];
  const language = (() => {
    try {
      return new Intl.DisplayNames(undefined, { type: 'language' }).of(
        raw.original_language,
      );
    } catch {
      return raw.original_language;
    }
  })();

  const facts =
    type === 'movie'
      ? [
          ['Directed by', directors.join(', ')],
          ['Written by', writers.slice(0, 3).join(', ')],
          ['Released', longDate(raw.release_date)],
          ['Runtime', runtime(raw.runtime)],
          ['Status', raw.status],
          ['Language', language],
          ['Budget', compactMoney(raw.budget)],
          ['Box office', compactMoney(raw.revenue)],
          [
            'Studio',
            raw.production_companies
              ?.slice(0, 2)
              .map((c) => c.name)
              .join(', '),
          ],
        ]
      : [
          ['Created by', raw.created_by?.map((c) => c.name).join(', ')],
          ['First aired', longDate(raw.first_air_date)],
          ['Last aired', longDate(raw.last_air_date)],
          ['Episodes', raw.number_of_episodes],
          ['Status', raw.status],
          [
            'Network',
            [
              raw.networks
                ?.slice(0, 3)
                .map((n) => n.name)
                .join(', '),
              raw.networks?.length > 3
                ? `+${raw.networks.length - 3} more`
                : '',
            ]
              .filter(Boolean)
              .join(' '),
          ],
          ['Language', language],
          ['Episode length', runtime(raw.episode_run_time?.[0])],
        ];

  const shown = facts.filter(([, v]) => v);
  if (!shown.length) return null;

  return (
    <section className="block">
      <h2 className="block-title">Details</h2>
      <dl className="facts">
        {shown.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TitleView({ type, id }) {
  const location = useLocation();
  const navigate = useNavigate();
  const region = useRegion();
  const desktop = useMediaQuery('(min-width: 960px)');
  const reduced = useReducedMotion();
  const stageRef = useRef(null);
  const hintRef = useRef(null);
  const contentRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const transitioning = useViewTransitionState(location.pathname);
  const arrived = useRef(transitioning);

  const query = useQuery(`${type}-${id}`, (signal) =>
    getTitle(type, id, { signal }),
  );
  const raw = query.data?.raw;
  const item = query.data?.item ?? location.state?.item ?? null;

  useStageScroll(stageRef, hintRef, !desktop && !reduced);

  useEffect(() => {
    if (transitioning) return;
    const delay = reduced ? 0 : arrived.current ? 90 : 420;
    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
  }, [reduced, transitioning]);

  usePageMeta({
    title: item?.title
      ? `${item.title}${item.year ? ` (${item.year})` : ''}`
      : TYPE_LABEL[type],
    description:
      raw?.overview || item?.overview
        ? `${raw?.overview || item.overview}`
        : undefined,
    image: backdropImage(raw?.backdrop_path ?? item?.backdrop),
    type: type === 'movie' ? 'video.movie' : 'video.tv_show',
  });

  if (query.error && !raw) {
    const notFound = query.error.status === 404;
    return (
      <main className="nf route">
        <Topbar />
        <p className="nf-code">{notFound ? '404' : ':('}</p>
        <p>
          {notFound
            ? `There's no ${TYPE_LABEL[type].toLowerCase()} with that id on TMDB.`
            : "We couldn't load this title."}
        </p>
        <div className="detail-actions">
          {!notFound && (
            <button
              type="button"
              className="btn btn-solid"
              onClick={query.retry}
            >
              Try again
            </button>
          )}
          <Link to="/" className="btn" viewTransition>
            Go home
          </Link>
        </div>
      </main>
    );
  }

  const goBack = () => {
    const leave = () =>
      location.key !== 'default'
        ? navigate(-1, { viewTransition: true })
        : navigate('/', { viewTransition: true });
    const stage = stageRef.current;
    if (!desktop && stage && window.scrollY > stage.offsetHeight * 0.2) {
      claimHero(null);
      stage
        .querySelector('.ocase-tray')
        ?.style.removeProperty('view-transition-name');
      return leave();
    }
    if (!open || reduced || closing) return leave();
    setClosing(true);
    setTimeout(() => {
      setClosing('settled');
      requestAnimationFrame(leave);
    }, 500);
  };

  const cert = raw ? certification(raw, type, region) : null;
  const trailer = raw ? pickTrailer(raw) : null;
  const genres = raw?.genres ?? [];
  const recommendations = toItems(raw?.recommendations?.results, type).filter(
    (r) => r.poster,
  );
  const seasons = (raw?.seasons ?? []).filter(
    (s) => s.season_number > 0 || raw.seasons.length === 1,
  );

  const meta = [
    ['kind', item && TYPE_LABEL[item.kind]],
    ['year', item?.year],
    [
      'cert',
      cert && (
        <span className="cert" title={`Rated in ${cert.region}`}>
          {cert.cert}
        </span>
      ),
    ],
    [
      'length',
      type === 'movie'
        ? runtime(raw?.runtime)
        : raw && plural(raw.number_of_seasons, 'season'),
    ],
    [
      'rating',
      item?.rating ? (
        <>
          <IconStarFilled />
          {item.rating.toFixed(1)}/10 TMDB
        </>
      ) : null,
    ],
  ].filter(([, value]) => value);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: item?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      }
    } catch {}
  };

  return (
    <main className="detail route">
      <div className="detail-back">
        <button
          type="button"
          className="icon-btn"
          aria-label="Back"
          onClick={goBack}
        >
          <IconArrowLeft stroke={1.8} />
        </button>
      </div>

      <div className="detail-grid">
        <div>
          <div ref={stageRef} className="stage">
            <div>
              <OpenCase
                item={item}
                open={open && Boolean(item) && !closing}
                closing={closing}
                overview={raw?.overview}
                loading={!item}
              />
              <button
                ref={hintRef}
                type="button"
                className="stage-hint"
                aria-label="Scroll to details"
                onClick={() =>
                  contentRef.current?.scrollIntoView({
                    behavior: reduced ? 'auto' : 'smooth',
                  })
                }
              >
                <i />
                <i />
              </button>
            </div>
          </div>
        </div>

        <div ref={contentRef} className="sheet-body">
          <div className="detail-content">
            <div className="detail-head">
              <div>
                <h1 className="detail-title">
                  {item ? (
                    item.title
                  ) : (
                    <span className="skeleton ghost-heading" />
                  )}
                </h1>
                <div className="detail-meta">
                  {item ? (
                    meta.map(([key, value]) => <span key={key}>{value}</span>)
                  ) : (
                    <span
                      className="skeleton ghost-line"
                      style={{ width: 180 }}
                    />
                  )}
                </div>
              </div>
              {item ? (
                <SaveButton item={item} />
              ) : (
                <span className="skeleton ghost-save" />
              )}
            </div>

            {raw?.tagline && <p className="detail-tagline">{raw.tagline}</p>}

            {raw ? (
              <p className="detail-overview">
                {raw.overview || 'No overview on TMDB yet.'}
              </p>
            ) : (
              <div className="detail-ghost" aria-hidden="true">
                <div className="ghost-para">
                  {[96, 100, 88, 62].map((w) => (
                    <span
                      key={w}
                      className="skeleton ghost-line"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
                <div className="detail-chips">
                  {[64, 82, 56].map((w) => (
                    <span
                      key={w}
                      className="skeleton ghost-chip"
                      style={{ width: w }}
                    />
                  ))}
                </div>
                <div className="detail-actions">
                  <span className="skeleton ghost-btn" />
                  <span className="skeleton ghost-btn ghost-btn-sm" />
                </div>
                <section className="block">
                  <span
                    className="skeleton ghost-line"
                    style={{ width: 150, height: 15 }}
                  />
                  <ul className="providers ghost-providers">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="provider">
                        <span className="skeleton ghost-logo" />
                        <span
                          className="skeleton ghost-line"
                          style={{ width: `${48 - i * 8}%` }}
                        />
                        <span
                          className="skeleton ghost-line ghost-sm"
                          style={{ width: 44 }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}

            {(genres.length > 0 || item?.kind === 'anime') && (
              <div className="detail-chips">
                {item?.kind === 'anime' && (
                  <span className="chip chip-lilac">Anime</span>
                )}
                {genres.map((g) => (
                  <span key={g.id} className="chip">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {raw && (
              <div className="detail-actions">
                {trailer && (
                  <button
                    type="button"
                    className="btn btn-solid"
                    onClick={() => setTrailerOpen(true)}
                  >
                    <IconPlayerPlayFilled />
                    Trailer
                  </button>
                )}
                <button type="button" className="btn" onClick={share}>
                  <IconShare2 stroke={1.8} />
                  Share
                </button>
              </div>
            )}

            {type === 'tv' && raw?.next_episode_to_air && (
              <div className="next-up">
                <i />
                Next episode {longDate(raw.next_episode_to_air.air_date)}
              </div>
            )}

            {raw && <Availability raw={raw} item={item} />}

            {raw && <Connected type={type} raw={raw} />}

            {type === 'tv' && seasons.length > 0 && (
              <section className="block">
                <h2 className="block-title">
                  Seasons{' '}
                  <small>{`${raw.number_of_episodes.toLocaleString()} episodes`}</small>
                </h2>
                <ul className="seasons">
                  {seasons.map((s) => (
                    <Season key={s.id} tvId={raw.id} season={s} />
                  ))}
                </ul>
              </section>
            )}

            {raw && <Cast raw={raw} type={type} />}
            {raw && <Facts raw={raw} type={type} />}
          </div>
        </div>
      </div>

      {!raw ? (
        <div className="page" aria-hidden="true">
          <Shelf title="More like this" loading />
        </div>
      ) : (
        recommendations.length > 0 && (
          <div className="page">
            <Shelf title="More like this">
              {recommendations.map((r, i) => (
                <TitleCard key={r.key} item={r} index={i} />
              ))}
            </Shelf>
          </div>
        )
      )}

      <Footer />

      {trailer && (
        <Sheet
          open={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          title={trailer.name}
          wide
        >
          {trailerOpen && (
            <div className="trailer">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
                title={trailer.name}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </Sheet>
      )}
    </main>
  );
}

export default function Title({ type }) {
  const { id } = useParams();
  const numeric = parseId(id);

  if (!numeric) {
    return (
      <main className="nf route">
        <Topbar />
        <p className="nf-code">404</p>
        <p>That link doesn't point to a title.</p>
        <Link to="/" className="btn" viewTransition>
          Go home
        </Link>
      </main>
    );
  }

  return <TitleView key={`${type}-${numeric}`} type={type} id={numeric} />;
}
