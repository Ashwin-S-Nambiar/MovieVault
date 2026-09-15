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
  const mountedAt = useRef(0);
  const [state, setState] = useState(() =>
    seen.has(src) ? 'instant' : preview ? 'preview' : 'loading',
  );

  useLayoutEffect(() => {
    mountedAt.current = performance.now();
    const node = ref.current;
    if (node?.complete && node.naturalWidth > 0) {
      seen.add(src);
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
      decoding={props.loading === 'eager' ? 'sync' : cached ? 'auto' : 'async'}
      fetchPriority={props.loading === 'eager' ? 'high' : undefined}
      draggable={false}
      onLoad={() => {
        seen.add(src);
        const quick = performance.now() - mountedAt.current < 150;
        setState((s) =>
          s === 'loading' && !quick ? 'loaded' : s === 'error' ? s : 'instant',
        );
      }}
      onError={() => setState('error')}
    />
  );
}
