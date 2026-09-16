import { useLayoutEffect, useRef, useState } from 'react';

const KEEP = 240;
const seen = new Map();

function remember(src) {
  const kept = seen.get(src);
  seen.delete(src);
  if (kept) {
    seen.set(src, kept);
    return;
  }
  const image = new Image();
  image.src = src;
  seen.set(src, image);
  if (seen.size > KEEP) seen.delete(seen.keys().next().value);
}

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
  const mountedAt = useRef(0);
  const [state, setState] = useState(() =>
    seen.has(src) ? 'instant' : preview ? 'preview' : 'loading',
  );

  useLayoutEffect(() => {
    mountedAt.current = performance.now();
    const node = ref.current;
    if (node?.complete && node.naturalWidth > 0) {
      remember(src);
      setState((s) => (s === 'loaded' ? s : 'instant'));
    }
  }, [src]);

  if (state === 'error' && fallback) return fallback;
  const cached = state === 'instant';
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
      loading={cached ? 'eager' : props.loading}
      decoding="async"
      fetchPriority={props.loading === 'eager' ? 'high' : undefined}
      draggable={false}
      onLoad={() => {
        remember(src);
        const quick = performance.now() - mountedAt.current < 150;
        setState((s) =>
          s === 'loading' && !quick ? 'loaded' : s === 'error' ? s : 'instant',
        );
      }}
      onError={() => setState('error')}
    />
  );
}
