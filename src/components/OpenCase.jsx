import { useLayoutEffect, useRef } from 'react';
import { arriveHero } from '../lib/hero';
import { img } from '../lib/tmdb';
import { Art } from './Case';

export default function OpenCase({
  item,
  open = false,
  overview,
  hero = false,
  loading = false,
  style,
}) {
  const ref = useRef(null);
  const key = item?.key;

  useLayoutEffect(() => {
    if (hero && key) arriveHero(ref.current, key);
  }, [hero, key]);

  const poster = img(item?.poster, 'w500');

  return (
    <div ref={ref} className="ocase" data-open={open} style={style}>
      <div className="ocase-tray">
        {item && (
          <div className="disc">
            {poster && <img src={poster} alt="" draggable={false} />}
          </div>
        )}
      </div>
      <div className="ocase-cover">
        <div className="ocase-front">
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
