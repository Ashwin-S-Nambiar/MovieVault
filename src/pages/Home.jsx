import { useCallback, useState } from 'react';
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
import { discover, prefetchTitle, trending } from '../lib/catalog';
import { TYPE_LABEL, titleHref, watchStatus } from '../lib/format';
import { useDebouncedValue } from '../lib/hooks';
import { useRegion, useServices } from '../lib/prefs';
import { img } from '../lib/tmdb';
import { UNIVERSES } from '../lib/universes';
import { useQuery } from '../lib/useQuery';

function Caption({ item }) {
  const settled = useDebouncedValue(item, 220);
  const rows = useStreaming(settled, Boolean(settled));
  const current = settled?.key === item?.key ? rows : null;
  const providers = current?.list;
  const status = watchStatus(settled, current);

  return (
    <div className="reel-caption">
      <h1 className="reel-title">
        <Swap id={item?.key} value={item}>
          {(v) => v?.title ?? ' '}
        </Swap>
      </h1>
      <div className="reel-meta">
        <Swap id={item?.key} value={item}>
          {(v) =>
            v ? [TYPE_LABEL[v.kind], v.year].filter(Boolean).join(' · ') : ''
          }
        </Swap>
      </div>
      <div className="reel-providers">
        {providers?.length > 0 && (
          <ProviderStack providers={providers} size={26} max={3} />
        )}
        {status && <WatchBadge status={status} />}
      </div>
      {item && (
        <div className="reel-cta">
          <Link
            to={titleHref(item)}
            state={{ item }}
            viewTransition
            className="btn btn-solid"
          >
            View details
          </Link>
          <SaveButton item={item} variant="pill" />
        </div>
      )}
    </div>
  );
}

function ReelSkeleton() {
  const ghost = { key: 'ghost', title: '', poster: null };
  return (
    <div className="reel" aria-hidden="true">
      <div
        className="reel-ring"
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <div
          className="reel-item skeleton"
          style={{ left: 'calc(var(--cw) / -2)', opacity: 0.6 }}
        >
          <Case item={ghost} />
        </div>
      </div>
    </div>
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
  const reel = useQuery('trending', (signal) => trending({ signal }));
  const items = reel.data?.slice(0, 16) ?? [];
  const [active, setActive] = useState(null);

  const mineMovies = useDiscover('movie', { mine: true });
  const mineSeries = useDiscover('tv', { mine: true });
  const anime = useDiscover('anime');
  const topRated = useDiscover('movie', { sort: 'vote_average.desc' });

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
        <Caption item={active} />
        <div />
      </section>

      <div className="page">
        {services.length > 0 && (
          <ItemShelf
            title="Films on your services"
            sub="Popular right now on what you already pay for"
            to="/search?type=movie&mine=1"
            query={mineMovies}
          />
        )}
        {services.length > 0 && (
          <ItemShelf
            title="Series on your services"
            to="/search?type=tv&mine=1"
            query={mineSeries}
          />
        )}

        <Shelf
          title={
            <>
              Follow a <span className="serif">universe</span>
            </>
          }
          sub="Every film in a franchise, in the order it came out"
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
              <p className="utile-kicker">Universe</p>
              <p className="utile-name">{u.name}</p>
            </Link>
          ))}
        </Shelf>

        <ItemShelf
          title="Popular anime"
          to="/search?type=anime"
          query={anime}
        />
        <ItemShelf
          title="Critically loved films"
          sub="Highest rated on TMDB with at least 300 votes"
          to="/search?type=movie&sort=rating"
          query={topRated}
        />
      </div>
      <Footer />
    </main>
  );
}
