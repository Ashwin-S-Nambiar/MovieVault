import { IconArrowUpRight, IconChevronDown } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Case from '../components/Case';
import Footer from '../components/Footer';
import Img from '../components/Img';
import {
  ProviderStack,
  useStreaming,
  WatchBadge,
} from '../components/Providers';
import Reel from '../components/Reel';
import SaveButton from '../components/SaveButton';
import Shelf from '../components/Shelf';
import Swap from '../components/Swap';
import TitleCard from '../components/TitleCard';
import Topbar, { ServicesButton } from '../components/Topbar';
import {
  discover,
  newOnDigital,
  nowPlaying,
  prefetchTitle,
  recentEpisodes,
  trending,
} from '../lib/catalog';
import { longDate, TYPE_LABEL, titleHref, watchStatus } from '../lib/format';
import { launchHero } from '../lib/hero';
import { useDebouncedValue, useReducedMotion } from '../lib/hooks';
import { usePageMeta } from '../lib/meta';
import { useRegion, useServices } from '../lib/prefs';
import { img } from '../lib/tmdb';
import { UNIVERSES } from '../lib/universes';
import { useQuery } from '../lib/useQuery';
import { useVault } from '../lib/watchlist';

function Caption({ item, failed, onHover }) {
  const settled = useDebouncedValue(item, 220);
  const rows = useStreaming(settled, Boolean(settled));
  const current = settled?.key === item?.key ? rows : null;
  const providers = current?.list;
  const status = watchStatus(settled, current);

  return (
    <div
      className="reel-caption"
      data-loading={!item && !failed}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') onHover(true);
      }}
      onPointerLeave={() => onHover(false)}
    >
      {!item && !failed && (
        <div className="reel-caption-ghost" aria-hidden="true">
          <span className="skeleton ghost-title" />
          <span className="skeleton ghost-line ghost-sm" />
        </div>
      )}
      <h1 className="reel-title">
        <Swap id={item?.key} value={item}>
          {(v) => v?.title ?? ' '}
        </Swap>
      </h1>
      <div className="reel-meta">
        <Swap id={item?.key} value={item}>
          {(v) =>
            v
              ? [TYPE_LABEL[v.kind], v.year].filter(Boolean).join(' · ')
              : '\u00a0'
          }
        </Swap>
      </div>
      <div className="reel-providers">
        {providers?.length > 0 && (
          <ProviderStack providers={providers} size={26} max={3} />
        )}
        {status && <WatchBadge status={status} />}
      </div>
      <div className="reel-cta">
        {item ? (
          <>
            <Link
              to={titleHref(item)}
              state={{ item }}
              viewTransition
              className="btn btn-solid"
              onClick={(event) =>
                launchHero(
                  document.querySelector(
                    '.reel-item[data-active="true"] .case',
                  ),
                  item,
                  'reel',
                  event,
                )
              }
            >
              View details
            </Link>
            <SaveButton item={item} variant="pill" />
          </>
        ) : (
          !failed && (
            <>
              <span className="skeleton ghost-btn" />
              <span className="skeleton ghost-btn ghost-btn-sm" />
            </>
          )
        )}
      </div>
    </div>
  );
}

const GHOSTS = [-3, -2, -1, 0, 1, 2, 3];

function ReelSkeleton() {
  return (
    <div className="reel reel-ghost" aria-hidden="true">
      <div className="reel-ring">
        {GHOSTS.map((o) => (
          <div
            key={o}
            className="reel-item"
            style={{
              '--o': o,
              '--d': `${Math.abs(o) * 70}ms`,
              opacity: Math.abs(o) === 3 ? 0.42 : undefined,
            }}
          >
            <Case item={null} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrollCue({ target }) {
  const reduced = useReducedMotion();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      className="scroll-cue"
      data-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      onClick={() =>
        target.current?.scrollIntoView({
          behavior: reduced ? 'auto' : 'smooth',
          block: 'start',
        })
      }
    >
      <span>Explore more</span>
      <IconChevronDown stroke={2} />
    </button>
  );
}

function useDiscover(kind, extra = {}) {
  const region = useRegion();
  const services = useServices();
  const mine = extra.mine;
  const key = [
    kind,
    extra.sort,
    mine ? `${region}:${services.join(',')}` : '',
  ].join('|');
  return useQuery(key, (signal) =>
    discover(kind, {
      sort: extra.sort,
      providers: mine ? services : undefined,
      region: mine ? region : undefined,
      signal,
    }).then((r) => r.items),
  );
}

const dayName = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
  });

function episodeNote({ date, upcoming }) {
  const today = new Date().toISOString().slice(0, 10);
  if (date === today) return { text: 'New episode today' };
  if (upcoming) return { tone: 'soon', text: `Next episode ${dayName(date)}` };
  return { text: `New episode ${longDate(date).replace(/,? \d{4}$/, '')}` };
}

function EpisodeShelf() {
  const vault = useVault();
  const series = vault.filter((item) => item.type === 'tv');
  const ids = series.map((item) => item.id).join('.');
  const query = useQuery(
    `episodes-${ids}`,
    (signal) => recentEpisodes(series, { signal }),
    { enabled: series.length > 0 },
  );
  if (!series.length || !query.data?.length) return null;
  return (
    <Shelf
      title="New episodes for you"
      sub="From series in your vault"
      to="/vault"
      className="content-in"
    >
      {query.data?.map(({ item, ...episode }, i) => (
        <TitleCard
          key={item.key}
          item={item}
          index={i}
          note={episodeNote(episode)}
        />
      ))}
    </Shelf>
  );
}

function ItemShelf({ title, sub, to, query, providers = true }) {
  return (
    <Shelf
      title={title}
      sub={sub}
      to={to}
      loading={query.loading && !query.data}
      error={query.error && !query.data}
      onRetry={query.retry}
    >
      {query.data?.map((item, i) => (
        <TitleCard key={item.key} item={item} index={i} providers={providers} />
      ))}
    </Shelf>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const services = useServices();
  usePageMeta({});
  const reel = useQuery('trending', (signal) => trending({ signal }));
  const items = reel.data?.slice(0, 16) ?? [];
  const [active, setActive] = useState(null);
  const [captionHover, setCaptionHover] = useState(false);
  const moreRef = useRef(null);

  const mineMovies = useDiscover('movie', { mine: true });
  const mineSeries = useDiscover('tv', { mine: true });
  const anime = useDiscover('anime');
  const topRated = useDiscover('movie', { sort: 'vote_average.desc' });
  const region = useRegion();
  const cinemas = useQuery(`now-playing-${region}`, (signal) =>
    nowPlaying(region, { signal }),
  );
  const digital = useQuery(`digital-${region}`, (signal) =>
    newOnDigital(region, { signal }),
  );

  const onActive = useCallback((item) => {
    setActive(item);
    if (item) prefetchTitle(item);
  }, []);

  const open = useCallback(
    (item) =>
      navigate(titleHref(item), { state: { item }, viewTransition: true }),
    [navigate],
  );

  return (
    <main className="route">
      <Topbar center={<ServicesButton />} />

      <section className="hero">
        <div />
        {items.length ? (
          <Reel
            items={items}
            memoryKey="home"
            label="Trending this week"
            onOpen={open}
            onActive={onActive}
            paused={captionHover}
          />
        ) : reel.error ? (
          <div className="state">
            <h2>Couldn't load what's trending</h2>
            <button type="button" className="btn" onClick={reel.retry}>
              Try again
            </button>
          </div>
        ) : (
          <ReelSkeleton />
        )}
        <Caption
          item={active}
          failed={Boolean(reel.error) && !items.length}
          onHover={setCaptionHover}
        />
        <div />
        <ScrollCue target={moreRef} />
      </section>

      <div ref={moreRef} className="page home-more">
        <EpisodeShelf />
        {services.length > 0 && (
          <ItemShelf
            title="Films on your services"
            sub="Popular on what you already pay for"
            to="/search?type=movie&mine=1"
            query={mineMovies}
          />
        )}
        {services.length > 0 && (
          <ItemShelf
            title="Series on your services"
            sub="Worth a binge, already included"
            to="/search?type=tv&mine=1"
            query={mineSeries}
          />
        )}

        <ItemShelf
          title="In cinemas now"
          sub="Showing near you this week"
          query={cinemas}
        />
        <ItemShelf
          title="New on digital"
          sub="Just out to rent, buy or stream"
          query={digital}
        />

        <Shelf
          title="Follow a universe"
          sub="Whole franchises, in release order"
          to="/universes"
          className="utrack"
        >
          {UNIVERSES.map((u) => (
            <Link
              key={u.slug}
              to={`/universe/${u.slug}`}
              className="utile"
              viewTransition
            >
              <Img src={img(u.backdrop, 'w780')} loading="lazy" />
              <p className="utile-name">{u.name}</p>
              <span className="utile-go" aria-hidden="true">
                <IconArrowUpRight stroke={2} />
              </span>
            </Link>
          ))}
        </Shelf>

        <ItemShelf
          title="Popular anime"
          sub="What anime fans are watching now"
          to="/search?type=anime"
          query={anime}
        />
        <ItemShelf
          title="Critically loved films"
          sub="The best reviewed, all time"
          to="/search?type=movie&sort=rating"
          query={topRated}
        />
      </div>
      <Footer />
    </main>
  );
}
