import { useState } from 'react';

export default function Img({
  className = '',
  alt = '',
  fallback = null,
  ...props
}) {
  const [state, setState] = useState('loading');
  if (state === 'error' && fallback) return fallback;
  return (
    <img
      {...props}
      alt={alt}
      className={`fade-img ${className}`}
      data-loaded={state === 'loaded'}
      decoding="async"
      draggable={false}
      onLoad={() => setState('loaded')}
      onError={() => setState('error')}
    />
  );
}
