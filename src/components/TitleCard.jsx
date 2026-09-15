import { IconX } from '@tabler/icons-react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { prefetchTitle } from '../lib/catalog';
import { TYPE_LABEL, titleHref } from '../lib/format';
import { claimHero, isHero, markHero, takeHero } from '../lib/hero';
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
  onlyMine = false,
  onRemove,
  onOpen,
}) {
  const posterRef = useRef(null);
  const [returning] = useState(() => isHero(item.key));
  const [hidden, setHidden] = useState(false);
  const [peeked, setPeeked] = useState(false);

  const onResolve = useCallback(
    (rows) => setHidden(onlyMine && rows.mine.length === 0),
    [onlyMine],
  );

  useLayoutEffect(() => {
    if (returning) takeHero(posterRef.current, item.key);
  }, [returning, item.key]);

  if (hidden) return null;

  return (
    <div
      className={`tcard ${returning ? '' : 'rise'}`}
      style={{ '--i': index }}
    >
      <Link
        to={titleHref(item)}
        state={{ item }}
        viewTransition
        className="tcard-link"
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setPeeked(true);
          prefetchTitle(item);
        }}
        onClick={() => {
          claimHero(posterRef.current);
          markHero(item.key);
          onOpen?.(item);
        }}
      >
        <span className="sleeve">
          {item.poster && (
            <Disc item={item} className="sleeve-disc" load={peeked} />
          )}
          <Poster ref={posterRef} item={item} />
        </span>
        <div>
          <h3 className="tcard-title">{item.title}</h3>
          <div className="tcard-meta">
            {item.year && <span>{item.year}</span>}
            {item.kind !== 'movie' && <span>{TYPE_LABEL[item.kind]}</span>}
          </div>
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
