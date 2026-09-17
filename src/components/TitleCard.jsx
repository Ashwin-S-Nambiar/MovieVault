import { IconX } from '@tabler/icons-react';
import { use, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { prefetchTitle } from '../lib/catalog';
import { TYPE_LABEL, titleHref } from '../lib/format';
import { HeroSlot, isHero, launchHero, takeHero } from '../lib/hero';
import { Disc, Poster } from './Case';
import { LazyProviders } from './Providers';

export function CardSkeleton() {
  return (
    <div className="tcard tcard-ghost" aria-hidden="true">
      <div className="tcard-link">
        <span className="sleeve">
          <Poster item={null} />
        </span>
        <div>
          <span className="skeleton ghost-line" style={{ width: '82%' }} />
          <span className="skeleton ghost-line ghost-sm" />
        </div>
      </div>
      <div className="tcard-providers">
        <span className="skeleton ghost-pill" />
      </div>
    </div>
  );
}

const GHOST_IDS = Array.from({ length: 24 }, (_, i) => `ghost-${i}`);

export function CardSkeletons({ count = 12 }) {
  return GHOST_IDS.slice(0, count).map((id) => <CardSkeleton key={id} />);
}

export default function TitleCard({
  item,
  index = 0,
  providers = true,
  eager = false,
  onlyMine = false,
  onRemove,
  onOpen,
  note,
}) {
  const posterRef = useRef(null);
  const slot = use(HeroSlot);
  const source = slot ? `card:${slot}` : 'card';
  const [returning] = useState(() => isHero(item.key, source));
  const [hidden, setHidden] = useState(false);
  const [peeked, setPeeked] = useState(false);

  const onResolve = useCallback(
    (rows) => setHidden(onlyMine && rows.mine.length === 0),
    [onlyMine],
  );

  useLayoutEffect(() => {
    if (returning) takeHero(posterRef.current, item.key, source);
  }, [returning, item.key, source]);

  if (hidden) return null;

  return (
    <div className="tcard" style={{ '--i': index }}>
      <Link
        to={titleHref(item)}
        state={{ item }}
        viewTransition
        className="tcard-link"
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setPeeked(true);
          prefetchTitle(item);
        }}
        onClick={(event) => {
          launchHero(posterRef.current, item, source, event);
          onOpen?.(item);
        }}
      >
        <span className="sleeve">
          {item.poster && (
            <Disc item={item} className="sleeve-disc" load={peeked} />
          )}
          <Poster ref={posterRef} item={item} eager={eager} />
        </span>
        <div>
          <h3 className="tcard-title">{item.title}</h3>
          <div className="tcard-meta">
            {item.year && <span>{item.year}</span>}
            {item.kind !== 'movie' && <span>{TYPE_LABEL[item.kind]}</span>}
          </div>
          {note && (
            <div className="tcard-note" data-tone={note.tone}>
              <i />
              {note.text}
            </div>
          )}
        </div>
      </Link>
      {providers && <LazyProviders item={item} onResolve={onResolve} />}
      {onRemove && (
        <button
          type="button"
          className="icon-btn tcard-remove"
          aria-label={`Remove ${item.title}`}
          onClick={() => onRemove(item)}
        >
          <IconX stroke={2} />
        </button>
      )}
    </div>
  );
}
