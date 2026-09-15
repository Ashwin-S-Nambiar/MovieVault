import { useLayoutEffect, useRef } from 'react';
import { claimHero } from '../lib/hero';
import { img } from '../lib/tmdb';
import { Art } from './Case';

export default function OpenCase({ item, open, overview, hero = true, style }) {
  const trayRef = useRef(null);

  useLayoutEffect(() => {
    if (hero) claimHero(trayRef.current);
  }, [hero]);

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
        <div className="ocase-front">
          {item && <Art item={item} size="w500" eager />}
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
