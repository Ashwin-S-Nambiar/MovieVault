import { createContext } from 'react';
import { flushSync } from 'react-dom';
import { titleHref } from './format';
import { createStore } from './store';

const KEY = 'mv:hero';
const HOLDERS = '.case, .sleeve, .pull-cover, .cover-body';

const SWING_MS = 400;
const LEAVE_MS = 150;
const FLY_MS = 560;
const FLY_AT = { open: 260, close: 90 };
const LAND_MS = 620;

const SWING = 'cubic-bezier(0.5, 0, 0.2, 1)';
const FLY = 'cubic-bezier(0.32, 0.72, 0, 1)';
const LAND = 'cubic-bezier(0.3, 0.1, 0.1, 1)';
const STEER = 'cubic-bezier(0.25, 0.8, 0.25, 1)';

export const flightStore = createStore(null);

export const HeroSlot = createContext('');

let flight = null;
let nextId = 1;
let navigateTo = null;

export const setHeroNavigate = (navigate) => {
  navigateTo = navigate;
};

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

const viewport = () => window.innerWidth;

export function markHero(key, source, rect, sk = 1) {
  writePending(
    key
      ? { key, source, rect, sk, viewport: viewport(), idx: historyIndex() }
      : null,
  );
}

export const isLanding = (key) =>
  flight?.dir === 'close' &&
  !flight.guess &&
  !flight.arrived &&
  flight.item.key === key;

export const isHero = (key, source) => {
  if (flight?.dir === 'open') return false;
  const pending = readPending();
  if (pending?.key === key && pending.idx === historyIndex()) {
    return pending.source === source;
  }
  return isLanding(key);
};

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const rectOf = (el) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

function layoutBox(el) {
  const parent = el.offsetParent;
  const origin = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return {
    left: origin.left + (parent?.clientLeft ?? 0) + el.offsetLeft,
    top: origin.top + (parent?.clientTop ?? 0) + el.offsetTop,
    width: el.offsetWidth,
    height: el.offsetHeight,
  };
}

const caseAround = (cover) => ({
  left: cover.left - cover.width / 2,
  top: cover.top,
  width: cover.width * 2,
  height: cover.height,
});

const boxToBox = (home, box) =>
  `translate(${box.left - home.left}px, ${box.top - home.top}px) scale(${
    box.width / home.width
  }, ${box.height / home.height})`;

const hide = (el) => {
  const holder = el.closest(HOLDERS) ?? el;
  holder.style.visibility = 'hidden';
  return holder;
};

const closedCase = (pw) => `translateX(${-pw / 2}px) rotateX(0deg)`;
const openCase = 'translateX(0px) rotateX(6deg)';
const closedDisc = { transform: 'rotate(-70deg) scale(0.94)', opacity: 0.4 };
const openDisc = { transform: 'none', opacity: 1 };

function place(f, box) {
  const { wrap, ocase } = f.parts;
  wrap.style.left = `${box.left}px`;
  wrap.style.top = `${box.top}px`;
  ocase.style.setProperty('--pw', `${box.width / 2}px`);
  ocase.style.height = `${box.height}px`;
  f.swingCase?.effect.setKeyframes(f.caseFrames(box.width / 2));
}

const skOf = (el) =>
  Number.parseFloat(getComputedStyle(el).getPropertyValue('--sk')) || 1;

const shade = (f, box, sk) => {
  const scale = box.width > 0 ? f.home.width / box.width : 1;
  f.parts?.ocase.style.setProperty('--sk', String(scale * sk));
};

const animate = (f, el, keyframes, options) => {
  if (!el) return null;
  const animation = el.animate(keyframes, { fill: 'both', ...options });
  f.animations.push(animation);
  return animation;
};

function swing(f, opening) {
  const { ocase, cover, disc } = f.parts;
  const timing = { duration: SWING_MS, easing: SWING };
  f.caseFrames = (pw) =>
    opening
      ? [{ transform: closedCase(pw) }, { transform: openCase }]
      : [{ transform: openCase }, { transform: closedCase(pw) }];
  f.swingCase = animate(f, ocase, f.caseFrames(f.pw), timing);
  const shut = `rotateY(${f.angle ?? 0}deg)`;
  animate(
    f,
    cover,
    opening
      ? [{ transform: shut }, { transform: 'rotateY(-178deg)' }]
      : [{ transform: 'rotateY(-178deg)' }, { transform: shut }],
    timing,
  );
  animate(
    f,
    disc,
    opening ? [closedDisc, openDisc] : [openDisc, closedDisc],
    opening
      ? { duration: SWING_MS + 200, delay: 80, easing: FLY }
      : { duration: SWING_MS * 0.6, easing: 'ease' },
  );
}

function veil(f, entering) {
  const el = f.parts?.veil;
  if (!el || f.veil === entering) return;
  f.veil = entering;
  f.veilAnimation?.cancel();
  f.veilAnimation = animate(
    f,
    el,
    entering
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ opacity: 0 }, { opacity: 1 }],
    entering
      ? { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      : { duration: LEAVE_MS, easing: 'ease-out' },
  );
}

const flyDelay = (f) =>
  Math.max(0, f.startedAt + FLY_AT[f.dir] - performance.now());

const offBy = (a, b) =>
  Math.max(
    Math.abs(a.left - b.left),
    Math.abs(a.top - b.top),
    Math.abs(a.width - b.width),
    Math.abs(a.height - b.height),
  );

function settle(f) {
  for (const el of f.hidden) el.style.visibility = '';
  for (const a of f.animations) a.cancel();
  window.clearTimeout(f.timer);
  window.clearTimeout(f.fallback);
  if (flight === f) {
    flight = null;
    flushSync(() => flightStore.set(null));
  }
}

function release(f) {
  if (flight !== f || f.released) return;
  f.released = true;
  for (const el of f.hidden) {
    el.dataset.landed = 'true';
    window.setTimeout(() => delete el.dataset.landed, 2400);
  }
  settle(f);
}

// rAF and the document timeline stall while hidden, so release() is unreachable.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && flight) release(flight);
});

function travel(f, keyframes, timing) {
  f.travel?.cancel();
  const animation = animate(f, f.parts.wrap, keyframes, timing);
  f.travel = animation;
  f.landed = false;
  animation.finished.then(
    () => {
      if (flight !== f || f.travel !== animation) return;
      f.landed = true;
      if (f.settledOn) release(f);
    },
    () => {},
  );
}

const flyTiming = (f) => ({
  duration: f.dir === 'open' ? FLY_MS : LAND_MS,
  delay: flyDelay(f),
  easing: f.dir === 'open' ? FLY : LAND,
});

function steer(f, to, off) {
  if (off < 0.5) return;
  const animation = f.travel;
  if (animation && animation.playState !== 'finished') {
    const { delay, duration } = animation.effect.getTiming();
    const elapsed = (animation.currentTime ?? 0) - delay;
    if (elapsed <= 0 || off < 12) {
      const [first] = animation.effect.getKeyframes();
      animation.effect.setKeyframes([
        { transform: first.transform },
        { transform: to },
      ]);
      return;
    }
    return travel(
      f,
      [
        { transform: getComputedStyle(f.parts.wrap).transform },
        { transform: to },
      ],
      { duration: Math.max(240, duration - elapsed), easing: STEER },
    );
  }
  travel(
    f,
    [
      { transform: getComputedStyle(f.parts.wrap).transform },
      { transform: to },
    ],
    { duration: 260, easing: STEER },
  );
}

function begin(state) {
  if (flight) settle(flight);
  flight = {
    id: nextId++,
    animations: [],
    hidden: [],
    startedAt: performance.now(),
    ...state,
  };
  flushSync(() => flightStore.set({ id: flight.id, item: state.item }));
  return flight;
}

function vanish(f) {
  if (!f.parts || f.vanishing) return f.parts ? undefined : settle(f);
  f.vanishing = true;
  window.clearTimeout(f.fallback);
  f.travel?.pause();
  veil(f, true);
  for (const el of f.hidden) el.style.visibility = '';
  const from = getComputedStyle(f.parts.wrap).transform;
  const base = from === 'none' ? '' : `${from} `;
  const out = animate(
    f,
    f.parts.wrap,
    [
      { opacity: 1, transform: base || 'none' },
      { opacity: 0, transform: `${base}translateY(18px) scale(0.92)` },
    ],
    { duration: 340, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  );
  out.finished.then(
    () => settle(f),
    () => {},
  );
}

const PROBE =
  '<main class="detail"><div class="detail-grid"><div><div class="stage"><div><div class="ocase"></div></div></div></div></div></main>';

function probeHome() {
  const probe = document.createElement('div');
  probe.className = 'hero-probe';
  probe.innerHTML = PROBE;
  document.body.append(probe);
  const box = layoutBox(probe.querySelector('.ocase'));
  probe.remove();
  return box;
}

export function launchHero(el, item, source, event) {
  if (
    event &&
    (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
  ) {
    return false;
  }
  const away = el ? rectOf(el) : null;
  const rest = el ? rectOf(el.closest('.reel-item, .sleeve') ?? el) : null;
  markHero(item.key, source, rest, el ? skOf(el) : 1);
  if (!el || !navigateTo || reducedMotion()) return false;
  event?.preventDefault();
  const hovered = el.classList.contains('case') && el.matches(':hover');
  const home = probeHome();
  const f = begin({
    dir: 'open',
    item,
    home,
    from: caseAround(away),
    pw: home.width / 2,
    angle: hovered ? -32 : 0,
  });
  f.hidden.push(hide(el));
  f.timer = window.setTimeout(
    () => navigateTo(titleHref(item), { state: { item } }),
    LEAVE_MS,
  );
  f.fallback = window.setTimeout(() => {
    if (flight === f && !f.arrived) vanish(f);
  }, LEAVE_MS + 1500);
  return true;
}

export function departHero(el, item, leave) {
  if (!el || !item || reducedMotion()) return false;
  const pending = readPending();
  const guess =
    pending?.key === item.key &&
    pending.rect &&
    pending.viewport === viewport() &&
    pending.idx === historyIndex() - 1
      ? pending.rect
      : null;
  const home = layoutBox(el);
  const f = begin({
    dir: 'close',
    item,
    home,
    guess,
    guessSk: guess ? (pending.sk ?? 1) : 1,
    pw: home.width / 2,
  });
  f.hidden.push(hide(el));
  f.timer = window.setTimeout(leave, LEAVE_MS);
  f.fallback = window.setTimeout(
    () => {
      if (flight === f && !f.arrived) vanish(f);
    },
    LEAVE_MS + (guess ? 1200 : 700),
  );
  return true;
}

export function attachFlight(id, node) {
  const f = flight;
  if (!f || f.id !== id || !node || f.parts) return;
  f.parts = {
    wrap: node.querySelector('.flight-case'),
    veil: node.querySelector('.flight-veil'),
    ocase: node.querySelector('.ocase'),
    cover: node.querySelector('.ocase-cover'),
    disc: node.querySelector('.disc'),
  };
  place(f, f.home);
  swing(f, f.dir === 'open');
  veil(f, false);
  if (f.dir === 'open') {
    travel(
      f,
      [{ transform: boxToBox(f.home, f.from) }, { transform: 'none' }],
      flyTiming(f),
    );
  } else if (f.guess) {
    shade(f, caseAround(f.guess), f.guessSk);
    travel(
      f,
      [
        { transform: 'none' },
        { transform: boxToBox(f.home, caseAround(f.guess)) },
      ],
      flyTiming(f),
    );
  }
}

const UNCLAIMED_MS = 220;

export const enterHero = () => {
  const f = flight;
  if (!f?.parts) return;
  veil(f, true);
  if (f.dir === 'close' && !f.guess && !f.arrived && !f.entered) {
    f.entered = true;
    window.clearTimeout(f.fallback);
    f.fallback = window.setTimeout(() => {
      if (flight === f && !f.arrived) vanish(f);
    }, UNCLAIMED_MS);
  }
};

export const isArriving = (key) =>
  flight?.dir === 'open' && flight.item.key === key;

export function arriveHero(el, key) {
  const f = flight;
  if (!el || f?.dir !== 'open' || f.item.key !== key) return false;
  if (f.arrived === el) return true;
  f.arrived = el;
  f.hidden.push(hide(el));
  enterHero();
  requestAnimationFrame(() => {
    if (flight !== f || !f.parts || !el.isConnected) return;
    const home = layoutBox(el);
    steer(f, boxToBox(f.home, home), offBy(home, f.home));
    f.settledOn = true;
    if (f.landed) release(f);
  });
  return true;
}

const onScreen = (el) => {
  const r = el.getBoundingClientRect();
  return (
    r.width > 0 &&
    r.bottom > 0 &&
    r.right > 0 &&
    r.top < window.innerHeight &&
    r.left < window.innerWidth
  );
};

export function takeHero(el, key, source) {
  if (!el || !isHero(key, source)) return false;
  const f = flight;
  const unguided = isLanding(key);
  if (unguided && !onScreen(el)) return false;
  if (!unguided) writePending(null);
  if (f?.dir !== 'close' || f.item.key !== key || f.arrived || f.vanishing) {
    return false;
  }
  window.clearTimeout(f.fallback);
  f.arrived = el;
  f.hidden.push(hide(el));
  enterHero();
  requestAnimationFrame(() => {
    if (flight !== f || !f.parts) return;
    if (!el.isConnected) return vanish(f);
    const target = rectOf(el);
    shade(f, caseAround(target), skOf(el));
    if (!f.guess) {
      travel(
        f,
        [
          { transform: 'none' },
          { transform: boxToBox(f.home, caseAround(target)) },
        ],
        flyTiming(f),
      );
    } else {
      steer(f, boxToBox(f.home, caseAround(target)), offBy(target, f.guess));
    }
    f.settledOn = true;
    if (f.landed) release(f);
  });
  return true;
}
