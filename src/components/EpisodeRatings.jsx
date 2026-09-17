import { useEffect, useRef, useState } from 'react';
import { getRatings, MIN_VOTES, partStats, yearSpan } from '../lib/episodes';
import { longDate } from '../lib/format';
import { useMediaQuery } from '../lib/hooks';
import { useQuery } from '../lib/useQuery';
import Sheet from './Sheet';

const LEVELS = [
  [9, 5],
  [8, 4],
  [7, 3],
  [6, 2],
  [0, 1],
];

function levelOf(ep) {
  if (!ep.votes) return 'none';
  if (ep.votes < MIN_VOTES) return 'few';
  return String(LEVELS.find(([min]) => ep.rating >= min)[1]);
}

function label(part, index) {
  const ep = part.episodes[index];
  if (part.short === `S${ep.season}`) return `S${ep.season} E${ep.number}`;
  return `${part.short} E${index + 1} (#${ep.number})`;
}

function summarize(parts) {
  const rated = parts
    .flatMap((part) =>
      part.episodes.map((ep, index) => ({ ...ep, code: label(part, index) })),
    )
    .filter((ep) => ep.votes >= MIN_VOTES);
  if (!rated.length) return null;
  const sorted = [...rated].sort(
    (a, b) => b.rating - a.rating || b.votes - a.votes,
  );
  return {
    average: rated.reduce((sum, ep) => sum + ep.rating, 0) / rated.length,
    best: sorted[0],
    worst: sorted[sorted.length - 1],
  };
}

const GHOST_ROWS = ['r1', 'r2', 'r3', 'r4', 'r5'];
const GHOST_COLS = Array.from({ length: 22 }, (_, i) => `c${i}`);

function Ghost() {
  return (
    <div className="heat-grid" aria-hidden="true" style={{ '--cols': 22 }}>
      {GHOST_ROWS.map((row) => (
        <div key={row} className="heat-row">
          <span className="heat-label">
            <span className="skeleton ghost-line" style={{ width: 20 }} />
          </span>
          {GHOST_COLS.map((col) => (
            <span key={col} className="heat-cell skeleton" />
          ))}
        </div>
      ))}
    </div>
  );
}

function Tip({ tip }) {
  if (!tip) return null;
  const { ep, part, index, x, y, below } = tip;
  return (
    <div
      className="heat-tip"
      data-below={below}
      style={{ '--x': `${x}px`, '--y': `${y}px` }}
      role="status"
    >
      <strong>
        {ep.votes ? ep.rating.toFixed(1) : 'No rating'}
        <span>{label(part, index)}</span>
      </strong>
      <span className="heat-tip-name">{ep.name}</span>
      {!/^Season \d+$/.test(part.name) && <span>{part.name}</span>}
      <span>
        {[
          ep.air && longDate(ep.air),
          ep.votes
            ? `${ep.votes.toLocaleString()} vote${ep.votes === 1 ? '' : 's'}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </span>
    </div>
  );
}

export default function EpisodeRatings({ raw, open, onClose }) {
  const hover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const boxRef = useRef(null);
  const [tip, setTip] = useState(null);
  const query = useQuery(
    `ratings-v2-${raw.id}`,
    (signal) => getRatings(raw, { signal }),
    { enabled: open },
  );
  const parts = query.data;
  const summary = parts ? summarize(parts) : null;
  const cols = parts
    ? Math.max(1, ...parts.map((part) => part.episodes.length))
    : 0;
  const axis = Array.from({ length: cols }, (_, i) => i + 1);
  const total = parts?.reduce((n, part) => n + part.episodes.length, 0) ?? 0;

  useEffect(() => {
    if (!tip || hover) return;
    const onDown = (event) => {
      if (!event.target.closest?.('.heat-cell')) setTip(null);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [tip, hover]);

  const show = (event, ep, part, index) => {
    const box = boxRef.current?.getBoundingClientRect();
    const cell = event.currentTarget.getBoundingClientRect();
    if (!box) return;
    const below = cell.top - box.top < 96;
    const half = Math.min(120, (box.width - 16) / 2);
    setTip({
      ep,
      part,
      index,
      below,
      x: Math.min(
        Math.max(cell.left + cell.width / 2 - box.left, half),
        box.width - half,
      ),
      y: below ? cell.bottom - box.top + 8 : cell.top - box.top - 8,
    });
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        setTip(null);
        onClose();
      }}
      title={`${raw.name} ratings`}
      wide
    >
      {summary && (
        <dl className="stats heat-stats">
          <div>
            <dt>average</dt>
            <dd>{summary.average.toFixed(1)}</dd>
          </div>
          <div>
            <dt>best · {summary.best.code}</dt>
            <dd>{summary.best.rating.toFixed(1)}</dd>
          </div>
          <div>
            <dt>lowest · {summary.worst.code}</dt>
            <dd>{summary.worst.rating.toFixed(1)}</dd>
          </div>
        </dl>
      )}

      {query.error && !parts ? (
        <div className="state">
          <p>Couldn't load the episode ratings.</p>
          <button type="button" className="btn" onClick={query.retry}>
            Try again
          </button>
        </div>
      ) : parts?.length === 0 ? (
        <p className="empty-note">TMDB has no episodes for this series yet.</p>
      ) : (
        <div
          ref={boxRef}
          className="heat"
          onPointerLeave={hover ? () => setTip(null) : undefined}
        >
          <div className="heat-scroll" onScroll={() => setTip(null)}>
            {!parts ? (
              <Ghost />
            ) : (
              <div className="heat-grid content-in" style={{ '--cols': cols }}>
                <div className="heat-row heat-axis" aria-hidden="true">
                  <span className="heat-label" />
                  {axis.map((n) => (
                    <span key={n} className="heat-cell">
                      {n === 1 || n % 5 === 0 ? n : ''}
                    </span>
                  ))}
                </div>
                {parts.map((part) => {
                  const stats = partStats(part.episodes);
                  return (
                    <div key={part.key} className="heat-row">
                      <span
                        className="heat-label"
                        title={[
                          part.name,
                          yearSpan(stats),
                          stats.average && `★ ${stats.average.toFixed(1)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      >
                        {part.short}
                      </span>
                      {part.episodes.map((ep, index) => (
                        <button
                          key={ep.id}
                          type="button"
                          className="heat-cell"
                          data-level={levelOf(ep)}
                          aria-pressed={tip?.ep.id === ep.id}
                          aria-label={`${label(part, index)}, ${ep.name}, ${ep.votes ? `rated ${ep.rating.toFixed(1)}` : 'no votes'}`}
                          onPointerEnter={
                            hover
                              ? (event) => show(event, ep, part, index)
                              : undefined
                          }
                          onFocus={(event) => {
                            if (event.currentTarget.matches(':focus-visible')) {
                              show(event, ep, part, index);
                            }
                          }}
                          onClick={(event) =>
                            tip?.ep.id === ep.id && !hover
                              ? setTip(null)
                              : show(event, ep, part, index)
                          }
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="heat-foot">
            <span>
              {parts
                ? `${total.toLocaleString()} episodes · ${parts.length} ${parts.length === 1 ? 'row' : 'rows'}`
                : 'Loading episodes'}
            </span>
            <span className="heat-key">
              <span className="heat-cell" data-level="few" />
              Few votes
              <span className="heat-key-scale">
                Lower
                {[1, 2, 3, 4, 5].map((level) => (
                  <span key={level} className="heat-cell" data-level={level} />
                ))}
                Higher
              </span>
            </span>
          </div>
          <Tip tip={tip} />
        </div>
      )}

      {parts?.length > 0 && (
        <p className="attribution">
          Ratings from TMDB users, from under 6 to 9 and up. Episodes with fewer
          than {MIN_VOTES} votes are shown hollow. {hover ? 'Hover' : 'Tap'} a
          square for details.
        </p>
      )}
    </Sheet>
  );
}
