import {
  IconArrowLeft,
  IconBookmark,
  IconBookmarkFilled,
} from '@tabler/icons-react';
import { Link, useParams } from 'react-router';
import { Poster } from '../components/Case';
import Footer from '../components/Footer';
import Img from '../components/Img';
import { toggleSaved } from '../components/SaveButton';
import Topbar from '../components/Topbar';
import {
  getCollection,
  getKeywordUniverse,
  prefetchTitle,
} from '../lib/catalog';
import { longDate, TYPE_LABEL, titleHref } from '../lib/format';
import { claimHero, isHero, markHero, takeHero } from '../lib/hero';
import { backdropImage, usePageMeta } from '../lib/meta';
import { img } from '../lib/tmdb';
import { toast } from '../lib/ui';
import { findUniverse } from '../lib/universes';
import { useQuery } from '../lib/useQuery';
import { addToVault, useVault } from '../lib/watchlist';

const today = () => new Date().toISOString().slice(0, 10);

function useUniverse(slug) {
  const curated = findUniverse(slug);
  const collectionId = curated?.collection ?? Number.parseInt(slug, 10);

  return useQuery(`universe-v2-${slug}`, async (signal) => {
    if (curated?.keyword) {
      const parts = await getKeywordUniverse(curated.keyword, { signal });
      return {
        name: curated.name,
        overview: `Every film TMDB tags as part of the ${curated.name}, in release order.`,
        backdrop: curated.backdrop,
        parts,
      };
    }
    if (!collectionId)
      throw Object.assign(new Error('Unknown universe'), { status: 404 });
    const data = await getCollection(collectionId, { signal });
    return {
      name: curated?.name ?? data.name.replace(/ Collection$/, ''),
      overview: data.overview,
      backdrop: data.backdrop_path ?? curated?.backdrop,
      parts: data.parts,
    };
  });
}

function TimelineSkeleton() {
  return (
    <ol className="timeline" aria-hidden="true">
      {[70, 54, 82, 46, 64, 58].map((w) => (
        <li key={w}>
          <div className="tl-item">
            <span
              className="skeleton ghost-line tl-year"
              style={{ width: 36 }}
            />
            <Poster item={null} />
            <div className="ghost-para">
              <span
                className="skeleton ghost-line"
                style={{ width: `${w}%` }}
              />
              <span
                className="skeleton ghost-line ghost-sm"
                style={{ width: '88%' }}
              />
            </div>
            <span className="skeleton ghost-round" />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Universe() {
  const { slug } = useParams();
  const curated = findUniverse(slug);
  const query = useUniverse(slug);
  const vault = useVault();
  const saved = new Set(vault.map((v) => v.key));
  const data = query.data;

  const loading = query.loading && !data;
  const name = data?.name ?? curated?.name;
  const backdrop = data?.backdrop ?? curated?.backdrop;
  usePageMeta({
    title: name ? `${name} universe` : 'Universe',
    description:
      data?.overview ||
      (name
        ? `Every ${name} film in release order, with where each one streams.`
        : undefined),
    image: backdropImage(backdrop),
  });

  if (query.error && !data) {
    return (
      <main className="nf route">
        <Topbar />
        <p className="nf-code">404</p>
        <p>We couldn't find that universe.</p>
        <Link to="/universes" className="btn" viewTransition>
          All universes
        </Link>
      </main>
    );
  }

  const now = today();
  const parts = data?.parts ?? [];
  const released = parts.filter((p) => p.date && p.date <= now);
  const rated = released.filter((p) => p.rating && p.votes > 20);
  const average = rated.length
    ? (rated.reduce((sum, p) => sum + p.rating, 0) / rated.length).toFixed(1)
    : null;
  const first = released[0]?.year;
  const last = released[released.length - 1]?.year;

  const saveAll = () => {
    const missing = released.filter((p) => !saved.has(p.key));
    for (const p of [...missing].reverse()) addToVault(p);
    toast(
      missing.length
        ? `Saved ${missing.length} films from ${data.name}`
        : 'Already in your vault',
    );
  };

  return (
    <main className="route">
      <Topbar />
      <section className="uhero">
        <div className="page">
          <Link to="/universes" className="back-pill" viewTransition>
            <IconArrowLeft stroke={2} />
            Universes
          </Link>
        </div>
        <div className="page uhero-grid">
          <div className="uhero-art">
            {backdrop ? (
              <Img src={img(backdrop, 'w1280')} loading="eager" />
            ) : (
              <span className="skeleton" />
            )}
          </div>
          <div className="uhero-copy">
            <p className="uhero-kicker">The universe of</p>
            <h1 className="uhero-title">
              {name ?? <span className="skeleton ghost-heading" />}
            </h1>
            {data?.overview && (
              <p className="uhero-overview">{data.overview}</p>
            )}

            {loading && (
              <div aria-hidden="true">
                <div className="uhero-overview ghost-para">
                  <span
                    className="skeleton ghost-line"
                    style={{ width: '94%' }}
                  />
                  <span
                    className="skeleton ghost-line"
                    style={{ width: '58%' }}
                  />
                </div>
                <div className="stats">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="ghost-stat">
                      <span className="skeleton ghost-line ghost-num" />
                      <span className="skeleton ghost-line ghost-sm" />
                    </div>
                  ))}
                </div>
                <div className="detail-actions">
                  <span className="skeleton ghost-btn ghost-btn-lg" />
                  <span className="skeleton ghost-btn ghost-btn-sm" />
                </div>
              </div>
            )}

            {parts.length > 0 && (
              <dl className="stats">
                <div>
                  <dt>films</dt>
                  <dd>{released.filter((p) => p.type === 'movie').length}</dd>
                </div>
                {released.some((p) => p.type === 'tv') && (
                  <div>
                    <dt>series</dt>
                    <dd>{released.filter((p) => p.type === 'tv').length}</dd>
                  </div>
                )}
                {first && (
                  <div>
                    <dt>span</dt>
                    <dd>{first === last ? first : `${first} - ${last}`}</dd>
                  </div>
                )}
                {average && (
                  <div>
                    <dt>average rating</dt>
                    <dd>{average}</dd>
                  </div>
                )}
                {parts.length > released.length && (
                  <div>
                    <dt>upcoming</dt>
                    <dd>{parts.length - released.length}</dd>
                  </div>
                )}
              </dl>
            )}

            {released.length > 0 && (
              <div className="detail-actions">
                <Link
                  to={titleHref(released[0])}
                  state={{ item: released[0] }}
                  className="btn btn-solid"
                  viewTransition
                >
                  Start from the beginning
                </Link>
                <button type="button" className="btn" onClick={saveAll}>
                  <IconBookmark stroke={1.8} />
                  Save all
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="page">
        {loading ? (
          <TimelineSkeleton />
        ) : (
          <ol className="timeline content-in">
            {parts.map((p) => {
              const upcoming = !p.date || p.date > now;
              const isSaved = saved.has(p.key);
              return (
                <li key={p.key}>
                  <div className="tl-item" data-upcoming={upcoming}>
                    <span className="tl-year">{p.year || 'TBA'}</span>
                    <Link
                      ref={(el) => {
                        if (el && isHero(p.key, 'timeline')) {
                          takeHero(
                            el.querySelector('.poster'),
                            p.key,
                            'timeline',
                          );
                        }
                      }}
                      to={titleHref(p)}
                      state={{ item: p }}
                      viewTransition
                      onPointerEnter={() => prefetchTitle(p)}
                      onClick={(e) => {
                        claimHero(e.currentTarget.querySelector('.poster'), {
                          transient: true,
                        });
                        markHero(p.key, 'timeline');
                      }}
                    >
                      <Poster item={p} size="w154" />
                    </Link>
                    <Link
                      to={titleHref(p)}
                      state={{ item: p }}
                      viewTransition
                      style={{
                        color: 'inherit',
                        textDecoration: 'none',
                        minWidth: 0,
                      }}
                    >
                      <div className="tl-title">
                        {p.title}
                        {p.type === 'tv' && (
                          <span className="tl-kind">{TYPE_LABEL[p.kind]}</span>
                        )}
                      </div>
                      <div className="tl-sub">
                        {upcoming
                          ? `Upcoming${p.date ? ` · ${longDate(p.date)}` : ''}`
                          : p.overview}
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-pressed={isSaved}
                      aria-label={
                        isSaved ? `Remove ${p.title}` : `Save ${p.title}`
                      }
                      onClick={() => toggleSaved(p)}
                    >
                      {isSaved ? (
                        <IconBookmarkFilled />
                      ) : (
                        <IconBookmark stroke={1.8} />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <Footer />
    </main>
  );
}
