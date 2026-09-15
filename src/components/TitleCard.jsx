import { IconX } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { prefetchTitle } from '../lib/catalog';
import { TYPE_LABEL, titleHref } from '../lib/format';
import { claimHero } from '../lib/hero';
import { Disc, Poster } from './Case';
import { LazyProviders } from './Providers';

export default function TitleCard({
  item,
  index = 0,
  providers = true,
  onlyMine = false,
  onRemove,
  onOpen,
}) {
  const [hidden, setHidden] = useState(false);
  const [peeked, setPeeked] = useState(false);

  const onResolve = useCallback(
    (rows) => setHidden(onlyMine && rows.mine.length === 0),
    [onlyMine],
  );

  if (hidden) return null;

  return (
    <div className="tcard rise" style={{ '--i': index }}>
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
          claimHero(event.currentTarget.querySelector('.poster'));
          onOpen?.(item);
        }}
      >
        <span className="sleeve">
          {item.poster && (
            <Disc item={item} className="sleeve-disc" load={peeked} />
          )}
          <Poster item={item} />
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
