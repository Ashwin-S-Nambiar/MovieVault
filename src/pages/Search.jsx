import {
  IconArrowUpRight,
  IconDeviceTv,
  IconFilter2,
  IconMovie,
  IconSearch,
  IconStack2,
  IconTorii,
  IconX,
} from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Art } from '../components/Case';
import Img from '../components/Img';
import Segmented from '../components/Segmented';
import Sheet from '../components/Sheet';
import TitleCard, { CardSkeletons } from '../components/TitleCard';
import Topbar from '../components/Topbar';
import {
  discover,
  prefetchTitle,
  searchTitles,
  trending,
} from '../lib/catalog';
import { titleHref } from '../lib/format';
import { claimHero, markHero } from '../lib/hero';
import {
  useDebouncedValue,
  useInView,
  useKeyboardInset,
  useReducedMotion,
} from '../lib/hooks';
import { pageImage, usePageMeta } from '../lib/meta';
import { useRegion, useServices } from '../lib/prefs';
import { img } from '../lib/tmdb';
import { openSheet, recentStore, rememberSearch, useRecent } from '../lib/ui';
import { useQuery } from '../lib/useQuery';

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Series' },
  { value: 'anime', label: 'Anime' },
];

const SORTS = [
  { value: 'relevance', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
];

const BROWSE = [
  {
    to: '/search?type=movie',
    tone: 'chip-sky',
    Icon: IconMovie,
    title: 'Films',
    sub: 'Every film on TMDB',
  },
  {
    to: '/search?type=tv',
    tone: 'chip-mint',
    Icon: IconDeviceTv,
    title: 'Series',
    sub: 'Shows worth a binge',
  },
  {
    to: '/search?type=anime',
    tone: 'chip-lilac',
    Icon: IconTorii,
    title: 'Anime',
    sub: 'Popular right now',
  },
  {
    to: '/universes',
    tone: 'chip-butter',
    Icon: IconStack2,
    title: 'Universes',
    sub: 'Franchises in order',
  },
];

const HEADINGS = {
  all: 'Everything',
  movie: 'Films',
  tv: 'Series',
  anime: 'Anime',
};

const PAGED_TTL = 10 * 60 * 1000;
const pagedCache = new Map();

const blank = (key, loading) => ({
  key,
  items: [],
  page: 0,
  totalPages: 1,
  total: 0,
  loading,
  error: null,
});

const cachedPages = (key) => {
  const hit = pagedCache.get(key);
  return hit && Date.now() - hit.at < PAGED_TTL ? hit.state : null;
};

function usePaged(key, fetchPage, enabled) {
  const [state, setState] = useState(
    () => (enabled && cachedPages(key)) || blank(key, enabled),
  );
  const current = useRef({ key, controller: null });
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const load = useCallback((page) => {
    const run = current.current;
    run.controller?.abort();
    const controller = new AbortController();
    run.controller = controller;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchRef
      .current(page, controller.signal)
      .then((result) => {
        if (controller.signal.aborted || run !== current.current) return;
        setState((s) => {
          const seen = new Set(page === 1 ? [] : s.items.map((i) => i.key));
          const fresh = result.items.filter(
            (i) => !seen.has(i.key) && seen.add(i.key),
          );
          return {
            key: run.key,
            stale: false,
            items: page === 1 ? fresh : [...s.items, ...fresh],
            page: result.page,
            totalPages: result.totalPages,
            total: result.total,
            loading: false,
            error: null,
          };
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || run !== current.current) return;
        setState((s) =>
          page === 1
            ? { ...s, items: [], page: 0, stale: false, loading: false, error }
            : { ...s, loading: false, error },
        );
      });
  }, []);

  useEffect(() => {
    current.current.controller?.abort();
    current.current = { key, controller: null };
    const hit = enabled && cachedPages(key);
    setState((s) => {
      if (hit) return s === hit ? s : hit;
      if (!enabled || !s.items.length) return blank(key, enabled);
      return { ...s, key, loading: true, error: null, stale: true };
    });
    if (enabled && !hit) load(1);
    return () => current.current.controller?.abort();
  }, [key, enabled, load]);

  useEffect(() => {
    if (state.key === key && state.page > 0 && !state.loading) {
      pagedCache.set(key, { state, at: Date.now() });
    }
  }, [state, key]);

  const loadMore = () => {
    if (!state.loading && !state.error && state.page < state.totalPages) {
      load(state.page + 1);
    }
  };

  return { ...state, loadMore, retry: () => load(Math.max(1, state.page + 1)) };
}

function sortItems(items, sort) {
  if (sort === 'newest') {
    return [...items].sort((a, b) =>
      (b.date || '').localeCompare(a.date || ''),
    );
  }
  if (sort === 'rating') {
    return [...items]
      .filter((i) => i.votes >= 20)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
  return items;
}

const SPINE_GHOSTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function SpineStack({ items }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [pulling, setPulling] = useState(null);
  const [peeked, setPeeked] = useState(() => new Set());
  const [cover, ...spines] = items.slice(0, 9).reverse();

  const peek = (item) => {
    prefetchTitle(item);
    setPeeked((prev) =>
      prev.has(item.key) ? prev : new Set(prev).add(item.key),
    );
  };

  const pull = (event, item) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (pulling) return;
    const link = event.currentTarget;
    peek(item);
    const go = () => {
      claimHero(link.querySelector('.pull-cover, .cover-body'), {
        transient: true,
      });
      markHero(item.key, 'spine');
      navigate(titleHref(item), { state: { item }, viewTransition: true });
    };
    if (reduced) return go();
    setPulling(item.key);
    setTimeout(go, 600);
  };

  if (!cover) {
    return (
      <div className="shelf-stack" data-ghost="true" aria-hidden="true">
        {SPINE_GHOSTS.map((id, i) => (
          <span key={id} className="shelf-spine" style={{ '--i': i }}>
            <span className="spine-body art-loading" />
          </span>
        ))}
        <span className="shelf-cover" style={{ '--i': 8 }}>
          <span className="cover-body">
            <Art item={null} />
          </span>
        </span>
      </div>
    );
  }

  return (
    <nav
      className="shelf-stack"
      data-pulling={Boolean(pulling)}
      aria-label="Trending this week"
    >
      {spines.reverse().map((item, i) => (
        <Link
          key={item.key}
          to={titleHref(item)}
          state={{ item }}
          className="shelf-spine"
          style={{ '--i': i }}
          aria-label={item.title}
          title={item.title}
          data-pulling={pulling === item.key}
          onPointerEnter={() => peek(item)}
          onFocus={() => peek(item)}
          onClick={(event) => pull(event, item)}
        >
          <span className="spine-body">
            {item.poster && <Img src={img(item.poster, 'w92')} />}
          </span>
          <span className="spine-pull" aria-hidden="true">
            <span className="pull-cover">
              {peeked.has(item.key) && <Art item={item} size="w185" eager />}
            </span>
          </span>
        </Link>
      ))}
      <Link
        to={titleHref(cover)}
        state={{ item: cover }}
        className="shelf-cover"
        style={{ '--i': spines.length }}
        aria-label={cover.title}
        title={cover.title}
        data-pulling={pulling === cover.key}
        onPointerEnter={() => peek(cover)}
        onFocus={() => peek(cover)}
        onClick={(event) => pull(event, cover)}
      >
        <span className="cover-body">
          <Art item={cover} size="w185" eager />
        </span>
      </Link>
    </nav>
  );
}

function Landing({ trendingItems, loading }) {
  const recent = useRecent();
  const [, setParams] = useSearchParams();

  return (
    <>
      {recent.length > 0 && (
        <section className="section" style={{ marginTop: 0 }}>
          <div className="section-head">
            <h2 className="section-title">Recent</h2>
            <button
              type="button"
              className="section-link"
              style={{ border: 0, background: 'none' }}
              onClick={() => recentStore.set([])}
            >
              Clear
            </button>
          </div>
          <div className="recent">
            {recent.map((r) => (
              <button
                key={r}
                type="button"
                className="chip"
                onClick={() => setParams({ q: r })}
              >
                {r}
              </button>
            ))}
          </div>
        </section>
      )}

      <section
        className="section"
        style={recent.length ? undefined : { marginTop: 0 }}
      >
        <div className="section-head">
          <h2 className="section-title">Browse</h2>
        </div>
        <div className="browse">
          {BROWSE.map(({ to, tone, Icon, title, sub }) => (
            <Link key={to} to={to} className={tone} viewTransition>
              <span className="browse-icon">
                <Icon stroke={1.8} />
              </span>
              <span className="browse-text">
                <strong>{title}</strong>
                <span>{sub}</span>
              </span>
              <IconArrowUpRight className="browse-go" stroke={2} />
            </Link>
          ))}
        </div>
      </section>

      {(loading || trendingItems.length > 0) && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Trending this week</h2>
          </div>
          <div className="grid" aria-busy={loading}>
            {loading ? (
              <CardSkeletons count={12} />
            ) : (
              trendingItems.map((item, i) => (
                <TitleCard key={item.key} item={item} index={i} eager={i < 6} />
              ))
            )}
          </div>
        </section>
      )}
    </>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const region = useRegion();
  const services = useServices();
  const keyboard = useKeyboardInset();
  const inputRef = useRef(null);
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') ?? '';
  const type = TYPES.some((t) => t.value === params.get('type'))
    ? params.get('type')
    : 'all';
  const sort = SORTS.some((s) => s.value === params.get('sort'))
    ? params.get('sort')
    : 'relevance';
  const mine = params.get('mine') === '1';

  const [text, setText] = useState(q);
  const debounced = useDebouncedValue(text.trim(), 280);
  const lastPushed = useRef(q);

  const update = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v == null || v === '' || v === 'all' || v === 'relevance')
              next.delete(k);
            else next.set(k, v);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  useEffect(() => {
    if (debounced !== lastPushed.current) {
      lastPushed.current = debounced;
      update({ q: debounced });
    }
  }, [debounced, update]);

  useEffect(() => {
    if (q !== lastPushed.current) {
      lastPushed.current = q;
      setText(q);
    }
  }, [q]);

  const focusOnArrival = useRef(!q);
  useEffect(() => {
    if (focusOnArrival.current)
      inputRef.current?.focus({ preventScroll: true });
  }, []);

  const trend = useQuery('trending', (signal) => trending({ signal }));
  const browsing = !q && type !== 'all';
  const enabled = Boolean(q) || browsing;
  const discoverSort =
    sort === 'rating'
      ? 'vote_average.desc'
      : sort === 'newest'
        ? 'newest'
        : 'popularity.desc';

  const results = usePaged(
    [
      q,
      q ? '' : type,
      q ? '' : sort,
      !q && mine ? `${region}:${services.join(',')}` : '',
    ].join('|'),
    (page, signal) =>
      q
        ? searchTitles(q, { page, signal })
        : discover(type, {
            page,
            sort: discoverSort,
            providers: mine ? services : undefined,
            region: mine ? region : undefined,
            signal,
          }),
    enabled,
  );

  const filtered = q
    ? sortItems(
        results.items.filter((i) => type === 'all' || i.kind === type),
        sort,
      )
    : results.items;

  const [sentinel, nearEnd] = useInView({ rootMargin: '600px', once: false });
  const { loadMore } = results;
  useEffect(() => {
    if (nearEnd && enabled) loadMore();
  }, [nearEnd, enabled, loadMore]);

  const typing = text.trim() !== q;
  const busy = enabled && (results.loading || typing);

  const close = () => {
    if (location.key !== 'default') navigate(-1, { viewTransition: true });
    else navigate('/', { viewTransition: true });
  };

  const heading = q ? `“${q}”` : HEADINGS[type];
  usePageMeta({
    image: pageImage('search'),
    title: q
      ? `${q} · Search`
      : type !== 'all'
        ? `${HEADINGS[type]}${mine ? ' on your services' : ''}`
        : 'Search',
    description:
      type === 'all'
        ? 'Search every film, series and anime on TMDB and see where each one streams in your region.'
        : `Browse popular ${HEADINGS[type].toLowerCase()} and see where each one streams in your region.`,
  });

  return (
    <main className="search-page route">
      <Topbar
        end={
          <button
            type="button"
            className="icon-btn"
            aria-label="Filters"
            onClick={() => setFiltersOpen(true)}
          >
            <IconFilter2 stroke={1.8} />
            {(mine || sort !== 'relevance') && <span className="badge">•</span>}
          </button>
        }
      />

      <div className="page">
        <SpineStack items={trend.data ?? []} />

        {enabled || text ? (
          <>
            <div className="search-head">
              <div>
                <h1>{heading}</h1>
                <p
                  className="section-sub results"
                  data-stale={Boolean(results.stale)}
                >
                  {results.total > 0 ? (
                    q ? (
                      `${results.total.toLocaleString()} matches`
                    ) : (
                      `${results.total.toLocaleString()} titles${mine ? ' on your services' : ''}`
                    )
                  ) : results.loading ? (
                    <span className="skeleton ghost-line ghost-sm" />
                  ) : (
                    '\u00a0'
                  )}
                </p>
              </div>
              <Segmented
                label="Type"
                options={TYPES}
                value={type}
                onChange={(value) => update({ type: value })}
              />
            </div>

            {results.error && !filtered.length ? (
              <div className="state">
                <h2>Search is having a moment</h2>
                <p>{results.error.message}</p>
                <button type="button" className="btn" onClick={results.retry}>
                  Try again
                </button>
              </div>
            ) : !busy && enabled && filtered.length === 0 ? (
              <div className="state">
                <h2>Nothing matched</h2>
                <p>
                  {type !== 'all'
                    ? `No ${HEADINGS[type].toLowerCase()} for that. Try All, or check the spelling.`
                    : 'Check the spelling or try the original title.'}
                </p>
              </div>
            ) : (
              <div
                className="grid results"
                aria-busy={busy}
                data-stale={Boolean(results.stale)}
              >
                {busy && filtered.length === 0 && !results.error && (
                  <CardSkeletons count={18} />
                )}
                {filtered.map((item, i) => (
                  <TitleCard
                    key={item.key}
                    item={item}
                    index={i % 20}
                    eager={i < 12}
                    onlyMine={Boolean(q) && mine}
                    onOpen={() => rememberSearch(q)}
                  />
                ))}
              </div>
            )}

            <div ref={sentinel} className="sentinel">
              {results.loading && results.page > 0 && (
                <span className="spinner" />
              )}
            </div>
          </>
        ) : (
          <Landing
            trendingItems={trend.data?.slice(0, 12) ?? []}
            loading={trend.loading && !trend.data}
          />
        )}
      </div>

      <div
        className="search-dock"
        style={keyboard ? { bottom: keyboard + 10 } : undefined}
      >
        <search>
          <form
            className="search-dock-row"
            onSubmit={(event) => {
              event.preventDefault();
              lastPushed.current = text.trim();
              update({ q: text.trim() });
              rememberSearch(text);
              inputRef.current?.blur();
            }}
          >
            <label className="search-pill">
              <span className="search-glyph" data-busy={results.loading}>
                <IconSearch stroke={1.8} />
                <span className="spinner" />
              </span>
              <span className="sr-only">Search movies, series and anime</span>
              <input
                ref={inputRef}
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (text) setText('');
                    else close();
                  }
                }}
                placeholder="Movies, series and anime"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
              />
              {text && (
                <button
                  type="button"
                  className="search-clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setText('');
                    inputRef.current?.focus();
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" fill="currentColor" />
                    <path
                      d="m9 9 6 6m0-6-6 6"
                      stroke="var(--bg)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </label>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close search"
              onClick={close}
            >
              <IconX stroke={1.8} />
            </button>
          </form>
        </search>
      </div>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
      >
        <div className="filter-group">
          <strong>Show</strong>
          <Segmented
            label="Type"
            options={TYPES}
            value={type}
            onChange={(value) => update({ type: value })}
          />
        </div>
        <div className="filter-group">
          <strong>Sort by</strong>
          <Segmented
            label="Sort"
            options={SORTS}
            value={sort}
            onChange={(value) => update({ sort: value })}
          />
        </div>
        <div className="filter-group">
          <div className="pref-row" style={{ border: 0, padding: 0 }}>
            <div>
              <strong>Only on my services</strong>
              <span>
                {services.length
                  ? `${services.length} services in ${region}`
                  : 'Pick your services first'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              className="switch"
              aria-checked={mine}
              aria-label="Only on my services"
              onClick={() => update({ mine: mine ? null : '1' })}
            />
          </div>
          <button
            type="button"
            className="btn"
            style={{ justifySelf: 'start' }}
            onClick={() => {
              setFiltersOpen(false);
              openSheet('services');
            }}
          >
            Edit services
          </button>
        </div>
        <button
          type="button"
          className="btn btn-solid"
          style={{ width: '100%', minHeight: 48, marginTop: 8 }}
          onClick={() => setFiltersOpen(false)}
        >
          Show results
        </button>
      </Sheet>
    </main>
  );
}
