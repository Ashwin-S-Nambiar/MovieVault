import { useLayoutEffect, useRef } from 'react';
import { claimHero } from '../lib/hero';
import { img } from '../lib/tmdb';
import { Art } from './Case';

export default function OpenCase({
  item,
  open,
  overview,
  hero = true,
  loading = false,
  style,
}) {
  const trayRef = useRef(null);
  const frontRef = useRef(null);

  useLayoutEffect(() => {
    if (!hero) return;
    const tray = trayRef.current;
    if (open) {
      claimHero(tray);
      return;
    }
    claimHero(frontRef.current);
    tray.style.viewTransitionName = 'hero-tray';
    return () => {
      tray.style.viewTransitionName = '';
    };
  }, [hero, open]);

  const poster = img(item?.poster, 'w500');

  return (
    <div className="ocase" data-open={open} style={style}>
      <div ref={trayRef} className="ocase-tray">
        {item && (
          <div className="disc">
            {poster && <img src={poster} alt="" draggable={false} />}
          </div>
        )}
      </div>
      <div className="ocase-cover">
        <div ref={frontRef} className="ocase-front">
          {(item || loading) && <Art item={item} size="w500" eager />}
        </div>
        <div className="ocase-inner">
          {poster && <img src={poster} alt="" draggable={false} />}
          {item && (
            <div>
              <strong>{item.title}</strong>
              <hr />
              <p>{overview ?? item.overview}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
