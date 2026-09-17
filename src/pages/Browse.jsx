import { IconArrowLeft } from '@tabler/icons-react';
import { useEffect } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';
import Footer from '../components/Footer';
import Segmented from '../components/Segmented';
import TitleCard, { CardSkeletons } from '../components/TitleCard';
import Topbar from '../components/Topbar';
import { browseEntity, ENTITY, getEntity } from '../lib/catalog';
import { parseId } from '../lib/format';
import { useInView } from '../lib/hooks';
import { usePageMeta } from '../lib/meta';
import { img } from '../lib/tmdb';
import { usePaged } from '../lib/usePaged';
import { useQuery } from '../lib/useQuery';
import NotFound from './NotFound';

const KICKER = { company: 'Studio', network: 'Network', keyword: 'Tagged' };
const MISSING = {
  company: 'Studio not found',
  network: 'Network not found',
  keyword: 'Tag not found',
};
const TYPE_OPTIONS = [
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Series' },
];
const SORTS = [
  { value: 'popularity.desc', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'vote_average.desc', label: 'Top rated' },
];

const regionName = (code) => {
  try {
    return new Intl.DisplayNames(undefined, { type: 'region' }).of(code);
  } catch {
    return code;
  }
};

const display = (kind, name) =>
  kind === 'keyword' && name
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : name;

function BrowseView({ kind, id }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const types = ENTITY[kind].types;
  const type = types.includes(params.get('type'))
    ? params.get('type')
    : types[0];
  const sort = SORTS.some((s) => s.value === params.get('sort'))
    ? params.get('sort')
    : SORTS[0].value;

  const entity = useQuery(`${kind}-${id}`, (signal) =>
    getEntity(kind, id, { signal }),
  );
  const results = usePaged(
    [kind, id, type, sort].join('|'),
    (page, signal) => browseEntity(kind, id, { type, page, sort, signal }),
    true,
  );
  const [sentinel, nearEnd] = useInView({ rootMargin: '600px', once: false });
  const { loadMore } = results;
  useEffect(() => {
    if (nearEnd) loadMore();
  }, [nearEnd, loadMore]);

  const data = entity.data;
  const name = display(kind, data?.name);
  const notFound = entity.error?.status === 404 && !data;
  const noun = type === 'movie' ? 'films' : 'series';

  usePageMeta({
    title: notFound
      ? MISSING[kind]
      : name
        ? `${name} · ${types.length > 1 ? 'Films and series' : 'Series'}`
        : KICKER[kind],
    description: name
      ? `Every ${noun === 'films' ? 'film and series' : 'series'} ${kind === 'keyword' ? `tagged ${data.name}` : `from ${name}`}, with where each one streams.`
      : undefined,
  });

  if (notFound) {
    return (
      <NotFound
        title={MISSING[kind]}
        message="TMDB doesn't have anything under that id."
      />
    );
  }

  const set = (patch) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) next.set(key, value);
        return next;
      },
      { replace: true },
    );

  const goBack = () =>
    location.key !== 'default'
      ? navigate(-1, { viewTransition: true })
      : navigate('/', { viewTransition: true });

  const meta = data
    ? [
        data.origin_country && regionName(data.origin_country),
        data.headquarters,
        results.total > 0 && `${results.total.toLocaleString()} ${noun}`,
      ].filter(Boolean)
    : [];

  return (
    <main className="route">
      <Topbar />
      <div className="page">
        <header className="vault-head entity-head">
          <button type="button" className="back-pill" onClick={goBack}>
            <IconArrowLeft stroke={2} />
            Back
          </button>
          <div className="entity-title">
            {data?.logo_path && (
              <span className="entity-logo">
                <img src={img(data.logo_path, 'w300')} alt="" />
              </span>
            )}
            <div>
              <p className="uhero-kicker">{KICKER[kind]}</p>
              <h1 className="vault-title">
                {name ?? <span className="skeleton ghost-heading" />}
              </h1>
              <p className="section-sub">
                {meta.length ? (
                  meta.join(' · ')
                ) : (
                  <span className="skeleton ghost-line ghost-sm" />
                )}
              </p>
            </div>
          </div>
          <div className="toolbar">
            {types.length > 1 ? (
              <Segmented
                label="Type"
                options={TYPE_OPTIONS}
                value={type}
                onChange={(value) => set({ type: value })}
              />
            ) : (
              <span />
            )}
            <div className="toolbar-end">
              <select
                className="select"
                value={sort}
                aria-label="Sort"
                onChange={(event) => set({ sort: event.target.value })}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {results.error && !results.items.length ? (
          <div className="state">
            <h2>Couldn't load these</h2>
            <button type="button" className="btn" onClick={results.retry}>
              Try again
            </button>
          </div>
        ) : !results.loading && !results.items.length ? (
          <div className="state">
            <h2>No {noun} yet</h2>
            {types.length > 1 && (
              <p>
                Try{' '}
                <Link to={`?type=${type === 'movie' ? 'tv' : 'movie'}`} replace>
                  {type === 'movie' ? 'series' : 'films'}
                </Link>{' '}
                instead.
              </p>
            )}
          </div>
        ) : (
          <div
            className="grid results"
            aria-busy={results.loading}
            data-stale={Boolean(results.stale)}
          >
            {results.loading && !results.items.length && (
              <CardSkeletons count={18} />
            )}
            {results.items.map((item, i) => (
              <TitleCard
                key={item.key}
                item={item}
                index={i % 20}
                eager={i < 12}
              />
            ))}
          </div>
        )}
        <div ref={sentinel} className="sentinel">
          {results.loading && results.page > 0 && <span className="spinner" />}
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function Browse({ kind }) {
  const { id } = useParams();
  const numeric = parseId(id);
  if (!numeric) {
    return (
      <NotFound
        title={MISSING[kind]}
        message="That link doesn't point to anything."
      />
    );
  }
  return <BrowseView key={`${kind}-${numeric}`} kind={kind} id={numeric} />;
}
