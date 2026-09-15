import { img } from '../lib/tmdb';
import Img, { isLoaded } from './Img';

const PREVIEW_SIZES = ['w500', 'w342', 'w185', 'w154', 'w92'];

export function Art({ item, size = 'w342', eager = false }) {
  if (!item) return <span className="case-art art-loading" />;
  const empty = <div className="case-art case-art-empty">{item.title}</div>;
  if (!item.poster) return empty;
  const src = img(item.poster, size);
  const preview = isLoaded(src)
    ? null
    : PREVIEW_SIZES.map((s) => img(item.poster, s)).find(isLoaded);
  return (
    <Img
      key={item.poster}
      src={src}
      preview={preview}
      className="art"
      loading={eager ? 'eager' : 'lazy'}
      fallback={empty}
    />
  );
}

export function Disc({ item, className = '', load = true }) {
  return (
    <span className={`disc ${className}`}>
      {load && item.poster && (
        <img src={img(item.poster, 'w342')} alt="" draggable={false} />
      )}
    </span>
  );
}

export default function Case({ item, eager, frontRef, style, inside = false }) {
  return (
    <div className="case" style={style}>
      <div className="case-face case-back" />
      {inside && item && (
        <div className="case-face case-inside">
          <Disc item={item} />
        </div>
      )}
      <div className="case-face case-edge" />
      <div className="case-face case-spine">
        <span>{item?.title}</span>
      </div>
      <div className="case-face case-front" ref={frontRef}>
        <Art item={item} size="w500" eager={eager} />
      </div>
    </div>
  );
}

export function Poster({ item, size, eager, className = '', ...props }) {
  return (
    <span className={`poster ${className}`} {...props}>
      <Art item={item} size={size} eager={eager} />
    </span>
  );
}
