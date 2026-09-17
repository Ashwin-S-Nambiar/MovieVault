import { useLayoutEffect, useRef } from 'react';
import { peekLogo } from '../lib/catalog';
import { arriveHero } from '../lib/hero';
import { useLogoTone } from '../lib/logo';
import { img, logoImg } from '../lib/tmdb';
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
  const logo = peekLogo(item);
  const tone = useLogoTone(logo);

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
              {logo ? (
                <img
                  key={logo}
                  className="ocase-logo"
                  data-tone={tone ?? undefined}
                  src={logoImg(logo)}
                  crossOrigin="anonymous"
                  alt={item.title}
                  draggable={false}
                />
              ) : (
                logo === null && <strong>{item.title}</strong>
              )}
              <hr />
              <p>{overview ?? item.overview}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
