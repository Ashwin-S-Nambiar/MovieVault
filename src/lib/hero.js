const KEY = 'mv:hero';
let current = null;
let releaseTimer = 0;

const historyIndex = () => window.history.state?.idx ?? 0;

const readPending = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
};

const writePending = (value) => {
  try {
    if (value) sessionStorage.setItem(KEY, JSON.stringify(value));
    else sessionStorage.removeItem(KEY);
  } catch {}
};

export function claimHero(el, { transient = false } = {}) {
  clearTimeout(releaseTimer);
  if (current && current !== el) current.style.viewTransitionName = '';
  if (el) el.style.viewTransitionName = 'hero-case';
  current = el;
  if (el && transient) {
    releaseTimer = setTimeout(() => {
      if (current === el) claimHero(null);
    }, 1200);
  }
}

export function markHero(key, source) {
  writePending(key ? { key, source, idx: historyIndex() } : null);
}

export const isHero = (key, source) => {
  const pending = readPending();
  return (
    pending != null &&
    pending.key === key &&
    pending.source === source &&
    pending.idx === historyIndex()
  );
};

export function takeHero(el, key, source) {
  if (!el || !isHero(key, source)) return false;
  writePending(null);
  claimHero(el, { transient: true });
  return true;
}
