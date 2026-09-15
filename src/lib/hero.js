let current = null;
let pending = null;

export function claimHero(el) {
  if (current && current !== el) current.style.viewTransitionName = '';
  if (el) el.style.viewTransitionName = 'hero-case';
  current = el;
}

export function markHero(key) {
  pending = key;
}

export const isHero = (key) => pending != null && pending === key;

export function takeHero(el, key) {
  if (!isHero(key)) return false;
  pending = null;
  claimHero(el);
  return true;
}
