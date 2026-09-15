import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { claimHero } from '../lib/hero';
import { useReducedMotion } from '../lib/hooks';
import Case from './Case';

const memory = new Map();
const mod = (a, n) => ((a % n) + n) % n;
const TAU = 0.12;

export default function Reel({ items, memoryKey, label, onOpen, onActive }) {
  const n = items.length;
  const saved = memory.get(memoryKey) ?? 0;
  const rootRef = useRef(null);
  const ringRef = useRef(null);
  const itemRefs = useRef([]);
  const frontRefs = useRef([]);
  const pos = useRef(saved);
  const target = useRef(saved);
  const frame = useRef(0);
  const lastTime = useRef(0);
  const drag = useRef(null);
  const dragged = useRef(false);
  const geo = useRef({ step: 30, radius: 400, spacing: 200 });
  const [active, setActive] = useState(() => mod(Math.round(saved), n));
  const activeRef = useRef(active);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const onActiveRef = useRef(onActive);
  onActiveRef.current = onActive;

  const render = () => {
    const { step, radius } = geo.current;
    const p = pos.current;
    if (ringRef.current) {
      ringRef.current.style.transform = `translateZ(${-radius}px)`;
    }
    for (let i = 0; i < n; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      let o = i - p;
      o -= n * Math.round(o / n);
      const a = Math.abs(o);
      if (a > 3.6) {
        el.style.visibility = 'hidden';
        continue;
      }
      el.style.visibility = '';
      el.style.opacity =
        a > 2.3 ? String(Math.max(0, 1 - (a - 2.3) / 1.2)) : '';
      el.style.transform = `rotateY(${o * step}deg) translateZ(${radius}px)`;
    }
    const index = mod(Math.round(p), n);
    if (index !== activeRef.current) {
      activeRef.current = index;
      setActive(index);
    }
  };

  const tick = (now) => {
    const dt = Math.min(0.05, (now - lastTime.current) / 1000);
    lastTime.current = now;
    if (!drag.current?.moved) {
      const k = reducedRef.current ? 1 : 1 - Math.exp(-dt / TAU);
      pos.current += (target.current - pos.current) * k;
      if (Math.abs(target.current - pos.current) < 0.0006) {
        pos.current = target.current;
      }
    }
    render();
    if (drag.current?.moved || pos.current !== target.current) {
      frame.current = requestAnimationFrame(tick);
    } else {
      frame.current = 0;
      memory.set(memoryKey, pos.current);
    }
  };

  const kick = () => {
    if (frame.current) return;
    lastTime.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  };

  const goTo = (index) => {
    const from = Math.round(target.current);
    let delta = index - mod(from, n);
    delta -= n * Math.round(delta / n);
    target.current = from + delta;
    kick();
  };

  const step = (dir) => {
    target.current = Math.round(target.current) + dir;
    kick();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: geometry depends only on layout
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !n) return;
    const measure = () => {
      const cw = itemRefs.current[0]?.offsetWidth || 180;
      const stepDeg =
        Number.parseFloat(getComputedStyle(root).getPropertyValue('--step')) ||
        30;
      const gap = cw * 1.1;
      geo.current = {
        step: stepDeg,
        radius: gap / (2 * Math.sin((stepDeg * Math.PI) / 360)),
        spacing: gap,
      };
      render();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      memory.set(memoryKey, target.current);
    };
  }, [n]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: listeners read refs
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let snap;
    const onWheel = (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      target.current += event.deltaX / geo.current.spacing;
      clearTimeout(snap);
      snap = setTimeout(() => {
        target.current = Math.round(target.current);
        kick();
      }, 120);
      kick();
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      clearTimeout(snap);
      root.removeEventListener('wheel', onWheel);
    };
  }, []);

  useLayoutEffect(() => {
    claimHero(frontRefs.current[active]);
    if (rootRef.current?.contains(document.activeElement)) {
      itemRefs.current[active]?.focus({ preventScroll: true });
    }
    onActiveRef.current?.(items[active], active);
  }, [active, items]);

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    dragged.current = false;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      from: pos.current,
      moved: false,
      id: event.pointerId,
      samples: [{ x: event.clientX, t: event.timeStamp }],
    };
  };

  const onPointerMove = (event) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      if (Math.abs(event.clientY - d.y) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      d.moved = true;
      dragged.current = true;
      rootRef.current.setPointerCapture(d.id);
      rootRef.current.dataset.dragging = 'true';
    }
    pos.current = d.from - dx / geo.current.spacing;
    target.current = pos.current;
    d.samples.push({ x: event.clientX, t: event.timeStamp });
    while (d.samples.length > 2 && event.timeStamp - d.samples[0].t > 90) {
      d.samples.shift();
    }
    kick();
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    delete rootRef.current.dataset.dragging;
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const elapsed = last.t - first.t;
    const velocity = elapsed > 0 ? (last.x - first.x) / elapsed : 0;
    const fling = (-velocity * 1000 * 0.2) / geo.current.spacing;
    const base = Math.round(d.from);
    target.current = Math.min(
      base + 5,
      Math.max(base - 5, Math.round(pos.current + fling)),
    );
    kick();
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    }
  };

  const onItemClick = (index) => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (index === activeRef.current && pos.current === target.current) {
      onOpen(items[index]);
    } else {
      goTo(index);
    }
  };

  return (
    <section
      ref={rootRef}
      className="reel"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div ref={ringRef} className="reel-ring">
        {items.map((item, i) => (
          <button
            key={item.key}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            type="button"
            className="reel-item"
            data-active={i === active}
            tabIndex={i === active ? 0 : -1}
            aria-label={i === active ? `Open ${item.title}` : item.title}
            aria-hidden={i !== active}
            onClick={() => onItemClick(i)}
          >
            <Case
              item={item}
              inside={i === active}
              eager={Math.abs(i - active) <= 2}
              frontRef={(el) => {
                frontRefs.current[i] = el;
              }}
            />
          </button>
        ))}
      </div>
      <div className="reel-nav">
        <button
          type="button"
          className="icon-btn"
          aria-label="Previous title"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => step(-1)}
        >
          <IconArrowLeft stroke={1.8} />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Next title"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => step(1)}
        >
          <IconArrowRight stroke={1.8} />
        </button>
      </div>
    </section>
  );
}
