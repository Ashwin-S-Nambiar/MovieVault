import { useLayoutEffect, useRef, useState } from 'react';

const seen = new Set();

export const isLoaded = (src) => seen.has(src);

export default function Img({
  src,
  preview,
  className = '',
  alt = '',
  fallback = null,
  style,
  ...props
}) {
  const ref = useRef(null);
  const [state, setState] = useState(() =>
    seen.has(src) ? 'instant' : preview ? 'preview' : 'loading',
  );

  useLayoutEffect(() => {
    const node = ref.current;
    if (node?.complete && node.naturalWidth > 0) {
      seen.add(src);
      setState((s) => (s === 'loaded' ? s : 'instant'));
    }
  }, [src]);

  if (state === 'error' && fallback) return fallback;
  return (
    <img
      {...props}
      ref={ref}
      src={src}
      alt={alt}
      className={`fade-img ${className}`}
      data-state={state}
      style={
        state === 'preview'
          ? { ...style, backgroundImage: `url(${preview})` }
          : style
      }
      decoding="async"
      draggable={false}
      onLoad={() => {
        seen.add(src);
        setState((s) =>
          s === 'loading' ? 'loaded' : s === 'error' ? s : 'instant',
        );
      }}
      onError={() => setState('error')}
    />
  );
}
