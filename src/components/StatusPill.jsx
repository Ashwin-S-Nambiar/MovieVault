import { useEffect, useMemo, useRef, useState } from 'react';
import { useHealth } from '../lib/health';
import { reconnect } from '../lib/tmdb';

function describe(status, online, retrying) {
  if (status === 'bad-key') {
    return { tone: 'bad-key', text: 'TMDB rejected the API key' };
  }
  if (!online) return { tone: 'offline', text: "You're offline" };
  if (status === 'down') {
    return { tone: 'down', text: "TMDB isn't responding", retry: true };
  }
  if (status === 'checking' || retrying) {
    return { tone: 'retrying', text: 'Reconnecting to TMDB', spinner: true };
  }
  return null;
}

export default function StatusPill() {
  const { status, online, retrying } = useHealth();
  const isRetrying = retrying > 0;
  const problem = useMemo(
    () => describe(status, online, isRetrying),
    [status, online, isRetrying],
  );
  const [shown, setShown] = useState(null);
  const wasBad = useRef(false);

  useEffect(() => {
    if (problem) {
      const delay = problem.tone === 'retrying' ? 700 : 0;
      const timer = setTimeout(() => {
        wasBad.current = problem.tone !== 'retrying';
        setShown(problem);
      }, delay);
      return () => clearTimeout(timer);
    }
    if (!wasBad.current) {
      setShown(null);
      return;
    }
    wasBad.current = false;
    setShown({ tone: 'up', text: 'Back online' });
    const timer = setTimeout(() => setShown(null), 1800);
    return () => clearTimeout(timer);
  }, [problem]);

  const view = shown ?? problem;

  return (
    <output
      className="status-pill"
      data-shown={Boolean(shown)}
      aria-live="polite"
    >
      {view?.spinner ? (
        <span className="spinner" />
      ) : (
        <span className="dot" data-status={view?.tone} />
      )}
      <span className="status-text">{view?.text}</span>
      {view?.retry && (
        <button type="button" className="btn" onClick={reconnect}>
          Retry
        </button>
      )}
    </output>
  );
}
