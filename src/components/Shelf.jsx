import {
  IconArrowUpRight,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { CardSkeletons } from './TitleCard';

export function RowNav({ track, label = 'row', overlay = false }) {
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const update = () =>
      setEdges({
        start: node.scrollLeft < 8,
        end: node.scrollLeft + node.clientWidth > node.scrollWidth - 8,
      });
    update();
    node.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      node.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [track]);

  if (edges.start && edges.end) return null;

  const page = (dir) =>
    track.current?.scrollBy({
      left: dir * track.current.clientWidth * 0.8,
      behavior: 'smooth',
    });

  return (
    <div className={`shelf-nav row-nav ${overlay ? 'row-nav-overlay' : ''}`}>
      <button
        type="button"
        className="icon-btn"
        aria-label={`Scroll ${label} back`}
        disabled={edges.start}
        onClick={() => page(-1)}
      >
        <IconChevronLeft stroke={1.8} />
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label={`Scroll ${label} forward`}
        disabled={edges.end}
        onClick={() => page(1)}
      >
        <IconChevronRight stroke={1.8} />
      </button>
    </div>
  );
}

export function SectionHead({
  title,
  sub,
  to,
  linkLabel = 'See all',
  children,
}) {
  return (
    <div className="section-head">
      <div>
        <h2 className="section-title">{title}</h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {children}
      {to && (
        <Link to={to} className="section-link" viewTransition>
          {linkLabel}
          <IconArrowUpRight stroke={1.8} />
        </Link>
      )}
    </div>
  );
}

export default function Shelf({
  title,
  sub,
  to,
  loading,
  error,
  onRetry,
  className = '',
  skeleton = 8,
  children,
  ...props
}) {
  const track = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const update = () => {
      const start = node.scrollLeft < 8;
      const end = node.scrollLeft + node.clientWidth > node.scrollWidth - 8;
      node.dataset.start = String(start);
      node.dataset.end = String(end);
      setEdges({ start, end });
    };
    update();
    node.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      node.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  const page = (dir) =>
    track.current?.scrollBy({
      left: dir * track.current.clientWidth * 0.85,
      behavior: 'smooth',
    });

  return (
    <section className="section shelf" {...props}>
      <SectionHead title={title} sub={sub} to={to}>
        <div className="shelf-nav" style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className="icon-btn"
            aria-label="Scroll back"
            disabled={edges.start}
            onClick={() => page(-1)}
          >
            <IconChevronLeft stroke={1.8} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Scroll forward"
            disabled={edges.end}
            onClick={() => page(1)}
          >
            <IconChevronRight stroke={1.8} />
          </button>
        </div>
      </SectionHead>
      {error ? (
        <div className="empty-note">
          Couldn't load this row.{' '}
          <button type="button" className="btn btn-ghost" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : (
        <div ref={track} className={`shelf-track ${className}`}>
          {loading ? <CardSkeletons count={skeleton} /> : children}
        </div>
      )}
    </section>
  );
}
