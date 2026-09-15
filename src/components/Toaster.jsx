import { useEffect, useRef, useState } from 'react';
import { img } from '../lib/tmdb';
import { dismissToast, useToasts } from '../lib/ui';

function Toast({ toast, depth }) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);

  useEffect(() => {
    if (leaving) {
      const timer = setTimeout(() => dismissToast(toast.id), 220);
      return () => clearTimeout(timer);
    }
    if (paused) return;
    const started = performance.now();
    const timer = setTimeout(() => setLeaving(true), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= performance.now() - started;
    };
  }, [leaving, paused, toast.id]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <output
      className="toast"
      data-leaving={leaving}
      style={{ '--depth': depth }}
      aria-live="polite"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {toast.poster && (
        <img className="toast-poster" src={img(toast.poster, 'w92')} alt="" />
      )}
      <span className="toast-text">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="btn"
          onClick={() => {
            toast.action.onClick();
            setLeaving(true);
          }}
        >
          {toast.action.label}
        </button>
      )}
    </output>
  );
}

export default function Toaster() {
  const toasts = useToasts();
  return (
    <div className="toaster">
      {toasts.map((t, i) => (
        <Toast key={t.id} toast={t} depth={toasts.length - 1 - i} />
      ))}
    </div>
  );
}
