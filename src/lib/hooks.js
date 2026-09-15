import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)');

export function useInView({ rootMargin = '200px', once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, once]);

  return [ref, inView];
}

export function trackEdges(node) {
  if (!node) return;
  const update = () => {
    node.dataset.start = String(node.scrollLeft < 8);
    node.dataset.end = String(
      node.scrollLeft + node.clientWidth > node.scrollWidth - 8,
    );
  };
  update();
  node.addEventListener('scroll', update, { passive: true });
  const resize = new ResizeObserver(update);
  resize.observe(node);
  const mutations = new MutationObserver(update);
  mutations.observe(node, { childList: true });
  return () => {
    node.removeEventListener('scroll', update);
    resize.disconnect();
    mutations.disconnect();
  };
}

export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setInset(
        Math.max(
          0,
          Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
        ),
      );
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    update();
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}

export function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
