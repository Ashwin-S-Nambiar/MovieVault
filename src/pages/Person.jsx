import {
  IconArrowLeft,
  IconBookmark,
  IconBookmarkFilled,
} from '@tabler/icons-react';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Poster } from '../components/Case';
import ExternalLinks from '../components/ExternalLinks';
import Footer from '../components/Footer';
import Img from '../components/Img';
import { toggleSaved } from '../components/SaveButton';
import Segmented from '../components/Segmented';
import Shelf from '../components/Shelf';
import TitleCard from '../components/TitleCard';
import Topbar from '../components/Topbar';
import { getPerson, prefetchTitle } from '../lib/catalog';
import {
  longDate,
  parseId,
  plural,
  TYPE_LABEL,
  titleHref,
  toItem,
} from '../lib/format';
import { isHero, launchHero, takeHero } from '../lib/hero';
import { usePageMeta } from '../lib/meta';
import { img } from '../lib/tmdb';
import { useQuery } from '../lib/useQuery';
import { useVault } from '../lib/watchlist';
import NotFound from './NotFound';

const NOT_STORY = [10763, 10764, 10767];
const SELF =
  /\b(self|himself|herself|themselves|host|narrator|archive footage)\b/i;
const PAGE = 30;
const ROLE_LABEL = {
  Acting: 'Actor',
  Directing: 'Director',
  Writing: 'Writer',
  Production: 'Producer',
  Creator: 'Creator',
  Sound: 'Composer',
  Camera: 'Cinematographer',
  Editing: 'Editor',
};

function credits(person) {
  const byDept = new Map();
  const add = (dept, credit, role) => {
    const item = toItem(credit);
    if (!item || NOT_STORY.some((g) => credit.genre_ids?.includes(g))) return;
    const list = byDept.get(dept) ?? new Map();
    const known = list.get(item.key);
    if (known) {
      if (role && !known.roles.includes(role)) known.roles.push(role);
      known.episodes += credit.episode_count ?? 0;
    } else {
      list.set(item.key, {
        ...item,
        roles: role ? [role] : [],
        episodes: credit.episode_count ?? 0,
      });
    }
    byDept.set(dept, list);
  };
  for (const c of person.combined_credits?.cast ?? []) {
    if (!SELF.test(c.character ?? '')) add('Acting', c, c.character);
  }
  for (const c of person.combined_credits?.crew ?? []) {
    add(c.department, c, c.job);
  }
  return [...byDept]
    .map(([dept, list]) => ({
      dept,
      items: [...list.values()].sort(
        (a, b) =>
          (b.date || '9999').localeCompare(a.date || '9999') ||
          b.popularity - a.popularity,
      ),
    }))
    .sort((a, b) => b.items.length - a.items.length);
}

function age(from, to) {
  const start = new Date(`${from}T00:00:00`);
  const end = to ? new Date(`${to}T00:00:00`) : new Date();
  let years = end.getFullYear() - start.getFullYear();
  if (
    end.getMonth() < start.getMonth() ||
    (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())
  ) {
    years -= 1;
  }
  return years;
}

function PersonSkeleton() {
  return (
    <div className="page phero-grid" aria-hidden="true">
      <div className="phero-face skeleton" />
      <div className="uhero-copy ghost-para">
        <span className="skeleton ghost-line" style={{ width: 80 }} />
        <span className="skeleton ghost-heading" style={{ height: 44 }} />
        <span className="skeleton ghost-line" style={{ width: '70%' }} />
        <span className="skeleton ghost-line" style={{ width: '92%' }} />
        <span className="skeleton ghost-line" style={{ width: '64%' }} />
      </div>
    </div>
  );
}

function CreditRow({ item, saved }) {
  const upcoming = !item.date || item.date > new Date().toISOString();
  const sub = [
    item.roles.slice(0, 2).join(', '),
    item.type === 'tv' && item.episodes
      ? plural(item.episodes, 'episode')
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const open = (event) =>
    launchHero(
      event.currentTarget.closest('.tl-item')?.querySelector('.poster'),
      item,
      'person',
      event,
    );
  const link = {
    to: titleHref(item),
    state: { item },
    viewTransition: true,
    onPointerEnter: () => prefetchTitle(item),
    onClick: open,
  };

  return (
    <li>
      <div
        className="tl-item"
        data-upcoming={upcoming}
        ref={(el) => {
          if (el && isHero(item.key, 'person')) {
            takeHero(el.querySelector('.poster'), item.key, 'person');
          }
        }}
      >
        <span className="tl-year">{item.year || 'TBA'}</span>
        <Link {...link}>
          <Poster item={item} size="w154" />
        </Link>
        <Link {...link} className="tl-link">
          <div className="tl-title">
            <span className="tl-title-text">{item.title}</span>
            {item.type === 'tv' && (
              <span className="tl-kind">{TYPE_LABEL[item.kind]}</span>
            )}
          </div>
          <div className="tl-sub">
            {upcoming ? ['Upcoming', sub].filter(Boolean).join(' · ') : sub}
          </div>
        </Link>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${item.title}` : `Save ${item.title}`}
          onClick={() => toggleSaved(item)}
        >
          {saved ? <IconBookmarkFilled /> : <IconBookmark stroke={1.8} />}
        </button>
      </div>
    </li>
  );
}

function PersonView({ id }) {
  const location = useLocation();
  const navigate = useNavigate();
  const query = useQuery(`person-${id}`, (signal) => getPerson(id, { signal }));
  const person = query.data;
  const cachedOnMount = useState(() => Boolean(person))[0];
  const vault = useVault();
  const saved = new Set(vault.map((v) => v.key));
  const [tab, setTab] = useState(null);
  const [limit, setLimit] = useState(PAGE);
  const [bioOpen, setBioOpen] = useState(false);
  const notFound = query.error?.status === 404 && !person;

  const groups = person ? credits(person) : [];
  const known = person?.known_for_department;
  const active =
    groups.find((g) => g.dept === tab) ??
    groups.find((g) => g.dept === known) ??
    groups[0];
  const tabs = groups.slice(0, 4);
  if (active && !tabs.includes(active)) tabs[tabs.length - 1] = active;

  const all = groups.flatMap((g) => g.items);
  const unique = new Map(all.map((item) => [item.key, item]));
  const films = [...unique.values()].filter((i) => i.type === 'movie').length;
  const series = unique.size - films;
  const years = [...unique.values()]
    .map((i) => i.year)
    .filter((y) => y && y <= String(new Date().getFullYear()))
    .sort();
  const knownFor = [...(active?.items ?? [])]
    .filter(
      (i) =>
        i.poster &&
        i.votes > 20 &&
        (i.type === 'movie' || i.episodes >= 3 || active.dept !== 'Acting'),
    )
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 12);

  usePageMeta({
    title: notFound ? 'Person not found' : (person?.name ?? 'Person'),
    description: person?.biography || undefined,
    image: person?.profile_path ? img(person.profile_path, 'h632') : undefined,
    type: 'profile',
  });

  if (notFound) {
    return (
      <NotFound
        title="Person not found"
        message="There's no one with that id on TMDB."
      />
    );
  }

  if (query.error && !person) {
    return (
      <main className="nf route">
        <Topbar />
        <p className="nf-code">:(</p>
        <p>We couldn't load this person.</p>
        <div className="detail-actions">
          <button type="button" className="btn btn-solid" onClick={query.retry}>
            Try again
          </button>
          <Link to="/" className="btn" viewTransition>
            Go home
          </Link>
        </div>
      </main>
    );
  }

  const goBack = () =>
    location.key !== 'default'
      ? navigate(-1, { viewTransition: true })
      : navigate('/', { viewTransition: true });

  const born = person?.birthday;
  const facts = person
    ? [
        born &&
          `Born ${longDate(born)}${person.deathday ? '' : ` (${age(born)})`}`,
        person.deathday &&
          `Died ${longDate(person.deathday)}${born ? ` (${age(born, person.deathday)})` : ''}`,
        person.place_of_birth,
      ].filter(Boolean)
    : [];
  const bio = person?.biography?.trim();
  const longBio = bio && bio.length > 360;
  const shown = active?.items.slice(0, limit) ?? [];

  return (
    <main className="route">
      <Topbar />
      <section className="uhero phero">
        <div className="page">
          <button type="button" className="back-pill" onClick={goBack}>
            <IconArrowLeft stroke={2} />
            Back
          </button>
        </div>
        {!person ? (
          <PersonSkeleton />
        ) : (
          <div
            className={`page phero-grid ${cachedOnMount ? '' : 'content-in'}`}
          >
            <div className="phero-face">
              {person.profile_path ? (
                <Img
                  src={img(person.profile_path, 'h632')}
                  loading="eager"
                  alt=""
                />
              ) : (
                <span>{person.name[0]}</span>
              )}
            </div>
            <div className="uhero-copy">
              {known && (
                <p className="uhero-kicker">{ROLE_LABEL[known] ?? known}</p>
              )}
              <h1 className="uhero-title">{person.name}</h1>
              {facts.length > 0 && (
                <p className="phero-facts">{facts.join(' · ')}</p>
              )}
              {unique.size > 0 && (
                <dl className="stats">
                  {films > 0 && (
                    <div>
                      <dt>films</dt>
                      <dd>{films}</dd>
                    </div>
                  )}
                  {series > 0 && (
                    <div>
                      <dt>series</dt>
                      <dd>{series}</dd>
                    </div>
                  )}
                  {years.length > 0 && (
                    <div>
                      <dt>active</dt>
                      <dd>
                        {years[0] === years[years.length - 1]
                          ? years[0]
                          : `${years[0]} - ${years[years.length - 1]}`}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              {bio && (
                <>
                  <p
                    className="uhero-overview phero-bio"
                    data-clamped={longBio && !bioOpen}
                  >
                    {bio}
                  </p>
                  {longBio && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm phero-more"
                      aria-expanded={bioOpen}
                      onClick={(e) => {
                        const btn = e.currentTarget;
                        const top = btn.getBoundingClientRect().top;
                        flushSync(() => setBioOpen((v) => !v));
                        if (bioOpen) {
                          window.scrollBy(
                            0,
                            btn.getBoundingClientRect().top - top,
                          );
                        }
                      }}
                    >
                      <span className="swap">
                        <span aria-hidden={bioOpen}>Read more</span>
                        <span aria-hidden={!bioOpen}>Show less</span>
                      </span>
                    </button>
                  )}
                </>
              )}
              <ExternalLinks
                ids={person.external_ids}
                homepage={person.homepage}
                person
              />
            </div>
          </div>
        )}
      </section>

      <div className="page">
        {!person ? (
          <Shelf title="Known for" loading />
        ) : (
          knownFor.length > 2 && (
            <Shelf title="Known for">
              {knownFor.map((item, i) => (
                <TitleCard key={item.key} item={item} index={i} />
              ))}
            </Shelf>
          )
        )}

        {active && (
          <section className="block">
            <div className="block-head pfilm-head">
              <h2 className="block-title">
                Filmography{' '}
                <small>{plural(active.items.length, 'title')}</small>
              </h2>
              {tabs.length > 1 && (
                <Segmented
                  label="Department"
                  value={active.dept}
                  onChange={(value) => {
                    setTab(value);
                    setLimit(PAGE);
                  }}
                  options={tabs.map((g) => ({
                    value: g.dept,
                    label: g.dept,
                  }))}
                />
              )}
            </div>
            <ol className="timeline" key={active.dept}>
              {shown.map((item) => (
                <CreditRow
                  key={item.key}
                  item={item}
                  saved={saved.has(item.key)}
                />
              ))}
            </ol>
            {shown.length < active.items.length && (
              <button
                type="button"
                className="btn episodes-more pfilm-more"
                onClick={() => setLimit((n) => n + PAGE * 2)}
              >
                Show {Math.min(PAGE * 2, active.items.length - shown.length)}{' '}
                more
              </button>
            )}
          </section>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function Person() {
  const { id } = useParams();
  const numeric = parseId(id);
  if (!numeric) {
    return (
      <NotFound
        title="Person not found"
        message="That link doesn't point to anyone."
      />
    );
  }
  return <PersonView key={numeric} id={numeric} />;
}
