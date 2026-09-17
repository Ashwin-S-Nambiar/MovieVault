import {
  IconChevronLeft,
  IconChevronRight,
  IconPlayerPlayFilled,
  IconStarFilled,
} from '@tabler/icons-react';
import { Fragment, useState } from 'react';
import { Link } from 'react-router';
import { getEpisode } from '../lib/catalog';
import { longDate, personHref, runtime } from '../lib/format';
import { img } from '../lib/tmdb';
import { useQuery } from '../lib/useQuery';
import Img from './Img';
import Sheet from './Sheet';

const uniqueBy = (list) => [...new Map(list.map((p) => [p.id, p])).values()];

function Crew({ label, people }) {
  if (!people.length) return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {people.map((p, i) => (
          <Fragment key={p.id}>
            {i > 0 && ', '}
            <Link to={personHref(p)} className="hover-underline" viewTransition>
              {p.name}
            </Link>
          </Fragment>
        ))}
      </dd>
    </div>
  );
}

function EpisodeBody({ tvId, ep }) {
  const [video, setVideo] = useState(null);
  const query = useQuery(
    `episode-${tvId}-${ep.season}-${ep.number}`,
    (signal) => getEpisode(tvId, ep.season, ep.number, { signal }),
  );
  const data = query.data;
  const still = data?.still_path ?? null;
  const stills = (data?.images?.stills ?? [])
    .map((s) => s.file_path)
    .filter((path) => path !== still)
    .slice(0, 8);
  const videos = (data?.videos?.results ?? []).filter(
    (v) => v.site === 'YouTube',
  );
  const crew = data?.crew ?? data?.credits?.crew ?? [];
  const guests = uniqueBy(
    data?.guest_stars ?? data?.credits?.guest_stars ?? [],
  ).slice(0, 16);
  const rating = data?.vote_count ? data.vote_average : null;

  return (
    <div className="ep-sheet content-in" key={`${ep.season}-${ep.number}`}>
      <div className="ep-media">
        {video ? (
          <iframe
            key={video}
            src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0`}
            title={ep.name}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : still ? (
          <Img src={img(still, 'w780')} loading="eager" />
        ) : (
          <span className={query.loading ? 'skeleton' : 'ep-media-empty'} />
        )}
      </div>

      <p className="ep-meta">
        {[
          `S${ep.season} E${ep.number}`,
          ep.absolute && `#${ep.absolute}`,
          runtime(data?.runtime ?? ep.runtime),
          longDate(data?.air_date ?? ep.air),
        ]
          .filter(Boolean)
          .join(' · ')}
        {rating ? (
          <span className="ep-rating">
            <IconStarFilled />
            {rating.toFixed(1)}
            <small>({data.vote_count.toLocaleString()})</small>
          </span>
        ) : null}
      </p>

      {(data?.overview || ep.overview) && (
        <p className="ep-overview">{data?.overview || ep.overview}</p>
      )}

      {query.error && !data && (
        <p className="empty-note">
          Couldn't load the rest of this episode.{' '}
          <button type="button" className="btn btn-sm" onClick={query.retry}>
            Try again
          </button>
        </p>
      )}

      {data && (
        <dl className="facts ep-facts">
          <Crew
            label="Directed by"
            people={uniqueBy(crew.filter((c) => c.job === 'Director'))}
          />
          <Crew
            label="Written by"
            people={uniqueBy(
              crew.filter((c) =>
                ['Writer', 'Screenplay', 'Teleplay', 'Story'].includes(c.job),
              ),
            ).slice(0, 3)}
          />
        </dl>
      )}

      {guests.length > 0 && (
        <section className="block">
          <h3 className="block-title">Guest stars</h3>
          <div className="shelf-track people">
            {guests.map((p) => (
              <Link
                key={p.id}
                to={personHref(p)}
                className="person"
                viewTransition
              >
                <div className="person-face">
                  {p.profile_path ? (
                    <Img src={img(p.profile_path, 'w185')} loading="lazy" />
                  ) : (
                    p.name[0]
                  )}
                </div>
                <div>
                  <div className="person-name">{p.name}</div>
                  {p.character && (
                    <div className="person-role">{p.character}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="block">
          <h3 className="block-title">Clips</h3>
          <ul className="video-list">
            {videos.map((v) => (
              <li key={v.key}>
                <button
                  type="button"
                  className="video-item"
                  aria-pressed={v.key === video}
                  onClick={() => setVideo(v.key)}
                >
                  <span className="video-thumb">
                    <Img
                      src={`https://i.ytimg.com/vi/${v.key}/mqdefault.jpg`}
                      loading="lazy"
                    />
                    <IconPlayerPlayFilled />
                  </span>
                  <span className="video-name">{v.name}</span>
                  <span className="video-type">{v.type}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stills.length > 0 && (
        <section className="block">
          <h3 className="block-title">Stills</h3>
          <div className="shelf-track ep-stills">
            {stills.map((path) => (
              <span key={path} className="ep-still">
                <Img src={img(path, 'w300')} loading="lazy" />
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function EpisodeSheet({ tvId, list, index, onIndex, onClose }) {
  const ep = list[index] ?? null;
  const [shown, setShown] = useState(ep);
  if (ep && ep !== shown) setShown(ep);
  const current = ep ?? shown;

  return (
    <Sheet
      open={Boolean(ep)}
      onClose={onClose}
      title={current?.name ?? ''}
      wide
      actions={
        list.length > 1 && (
          <>
            <button
              type="button"
              className="icon-btn"
              aria-label="Previous episode"
              disabled={index <= 0}
              onClick={() => onIndex(index - 1)}
            >
              <IconChevronLeft stroke={1.8} />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Next episode"
              disabled={index >= list.length - 1}
              onClick={() => onIndex(index + 1)}
            >
              <IconChevronRight stroke={1.8} />
            </button>
          </>
        )
      }
    >
      {current && (
        <EpisodeBody
          key={`${current.season}-${current.number}`}
          tvId={tvId}
          ep={current}
        />
      )}
    </Sheet>
  );
}
