let current = null;

export function claimHero(el) {
  if (current && current !== el) current.style.viewTransitionName = '';
  if (el) el.style.viewTransitionName = 'hero-case';
  current = el;
}
