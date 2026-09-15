import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
} from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { getConnected } from '../lib/catalog';
import { TYPE_LABEL, titleHref } from '../lib/format';
import { claimHero, isHero, markHero, takeHero } from '../lib/hero';
import { trackEdges } from '../lib/hooks';
import { useQuery } from '../lib/useQuery';
import { Poster } from './Case';
import { RowNav } from './Shelf';

const heroProps = (item) => ({
  ref: (el) => {
    if (el && isHero(item.key, 'connected')) {
      takeHero(el.querySelector('.poster'), item.key, 'connected');
    }
  },
  to: titleHref(item),
  state: { item },
  viewTransition: true,
  onClick: (event) => {
    claimHero(event.currentTarget.querySelector('.poster'), {
      transient: true,
    });
    markHero(item.key, 'connected');
  },
});

const centerCurrent = (strip) => {
  const current = strip?.querySelector('[aria-current="true"]');
  if (current) {
    strip.scrollLeft =
      current.offsetLeft - strip.clientWidth / 2 + current.offsetWidth / 2;
  }
  return trackEdges(strip);
};

function Neighbor({ item, label, Icon }) {
  return (
    <Link className="link-card" {...heroProps(item)}>
      <Poster item={item} size="w154" />
      <span className="link-card-text">
        <span className="link-card-label">
          <Icon stroke={2} />
          {label}
        </span>
        <strong>{item.title}</strong>
        <span>
          {[item.year, TYPE_LABEL[item.kind]].filter(Boolean).join(' · ')}
        </span>
      </span>
    </Link>
  );
}

function Group({ group, selfKey }) {
  const track = useRef(null);
  const { parts } = group;
  const index = parts.findIndex((p) => p.key === selfKey);
  const previous = parts[index - 1];
  const next = parts[index + 1];

  return (
    <>
      <p className="connected-position">
        {index + 1} of {parts.length} in release order
        {!next && ' · the latest'}
        {!previous && ' · where it starts'}
      </p>
      <div className="connected-pair" data-single={!previous || !next}>
        {previous && (
          <Neighbor item={previous} label="Previous" Icon={IconArrowLeft} />
        )}
        {next && <Neighbor item={next} label="Next" Icon={IconArrowRight} />}
      </div>
      <div className="strip-wrap">
        <RowNav track={track} label="universe" overlay />
        <div
          ref={(el) => {
            track.current = el;
            return centerCurrent(el);
          }}
          className="connected-strip"
        >
          {parts.map((p) =>
            p.key === selfKey ? (
              <span
                key={p.key}
                className="connected-item"
                aria-current="true"
                title={p.title}
              >
                <Poster item={p} size="w154" />
                <span className="connected-year">{p.year || 'TBA'}</span>
              </span>
            ) : (
              <Link
                key={p.key}
                className="connected-item"
                title={`${p.title}${p.year ? ` (${p.year})` : ''}`}
                {...heroProps(p)}
              >
                <Poster item={p} size="w154" />
                <span className="connected-year">{p.year || 'TBA'}</span>
              </Link>
            ),
          )}
        </div>
      </div>
      {group.href && (
        <Link to={group.href} className="connected-more" viewTransition>
          Explore {group.name}
          <IconArrowUpRight stroke={1.8} />
        </Link>
      )}
    </>
  );
}

export default function Connected({ type, raw }) {
  const [selected, setSelected] = useState(0);
  const query = useQuery(`connected-v3-${type}-${raw.id}`, (signal) =>
    getConnected(type, raw, { signal }),
  );
  const groups = query.data ?? [];
  const selfKey = `${type}-${raw.id}`;

  if (query.loading && !query.data) {
    return (
      <section className="block" aria-hidden="true">
        <span
          className="skeleton ghost-line"
          style={{ width: 120, height: 15 }}
        />
        <div className="connected-pair" style={{ marginTop: 14 }}>
          <span className="skeleton link-card-ghost" />
          <span className="skeleton link-card-ghost" />
        </div>
      </section>
    );
  }
  if (!groups.length) return null;

  const group = groups[Math.min(selected, groups.length - 1)];

  return (
    <section className="block">
      <h2 className="block-title">
        Universe
        {groups.length > 1 && <small>Part of {groups.length}</small>}
      </h2>
      {groups.length > 1 && (
        <div className="connected-tabs" role="tablist">
          {groups.map((g, i) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={g === group}
              onClick={() => setSelected(i)}
            >
              {g.name}
              <span>{g.parts.length}</span>
            </button>
          ))}
        </div>
      )}
      <Group key={group.id} group={group} selfKey={selfKey} />
    </section>
  );
}
