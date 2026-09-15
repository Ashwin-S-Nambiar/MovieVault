import { IconFilter2, IconSearch, IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import Segmented from '../components/Segmented';
import Sheet from '../components/Sheet';
import TitleCard from '../components/TitleCard';
import Topbar from '../components/Topbar';
import { discover, searchTitles, trending } from '../lib/catalog';
import { useDebouncedValue, useInView, useKeyboardInset } from '../lib/hooks';
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

const HEADINGS = {
  all: 'Everything',
  movie: 'Films',
  tv: 'Series',
  anime: 'Anime',
};

function usePaged(key, fetchPage, enabled) {
  const [state, setState] = useState({
    items: [],
    page: 0,
    totalPages: 1,
    total: 0,
    loading: false,
    error: null,
  });
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
        setState((s) => ({ ...s, loading: false, error }));
      });
  }, []);

  useEffect(() => {
    current.current.controller?.abort();
    current.current = { key, controller: null };
    setState({
      items: [],
      page: 0,
      totalPages: 1,
      total: 0,
      loading: enabled,
      error: null,
    });
    if (enabled) load(1);
    return () => current.current.controller?.abort();
  }, [key, enabled, load]);

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

function SpineStack({ items, busy }) {
  const [cover, ...spines] = items.slice(0, 9).reverse();
  if (!cover) return <div className="shelf-stack" aria-hidden="true" />;
  return (
    <Link
      to="/"
      className="shelf-stack"
      data-busy={busy}
      aria-label="Back to the reel"
      viewTransition
    >
      {spines.reverse().map((item, i) => (
        <span key={item.key} className="shelf-spine" style={{ '--i': i }}>
          {item.poster && <img src={img(item.poster, 'w92')} alt="" />}
          <span>{item.title}</span>
        </span>
      ))}
      <span className="shelf-cover" style={{ '--i': spines.length }}>
        {cover.poster && <img src={img(cover.poster, 'w185')} alt="" />}
      </span>
    </Link>
  );
}

function Landing({ trendingItems }) {
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
          <Link to="/search?type=movie" className="chip-sky" viewTransition>
            <span>Every</span>
            <strong>Film</strong>
          </Link>
          <Link to="/search?type=tv" className="chip-mint" viewTransition>
            <span>Binge a</span>
            <strong>Series</strong>
          </Link>
          <Link to="/search?type=anime" className="chip-lilac" viewTransition>
            <span>Tonight's</span>
            <strong>Anime</strong>
          </Link>
          <Link to="/universes" className="chip-butter" viewTransition>
            <span>Follow a</span>
            <strong>Universe</strong>
          </Link>
        </div>
      </section>

      {trendingItems.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Trending this week</h2>
          </div>
          <div className="grid">
            {trendingItems.map((item, i) => (
              <TitleCard key={item.key} item={item} index={i} />
            ))}
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
      type,
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
        <SpineStack items={trend.data ?? []} busy={busy} />

        {enabled || text ? (
          <>
            <div className="search-head">
              <div>
                <h1>{heading}</h1>
                {!results.loading && results.total > 0 && (
                  <p className="section-sub">
                    {q
                      ? `${results.total.toLocaleString()} matches`
                      : `${results.total.toLocaleString()} titles${mine ? ' on your services' : ''}`}
                  </p>
                )}
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
              <div className="grid" aria-busy={busy}>
                {filtered.map((item, i) => (
                  <TitleCard
                    key={item.key}
                    item={item}
                    index={i % 20}
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
          <Landing trendingItems={trend.data?.slice(0, 12) ?? []} />
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
              {busy ? (
                <span className="spinner" />
              ) : (
                <IconSearch stroke={1.8} />
              )}
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
