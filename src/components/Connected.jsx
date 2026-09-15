import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { getConnected } from '../lib/catalog';
import { TYPE_LABEL, titleHref } from '../lib/format';
import { claimHero, isHero, markHero, takeHero } from '../lib/hero';
import { trackEdges } from '../lib/hooks';
import { UNIVERSES, universeHref } from '../lib/universes';
import { useQuery } from '../lib/useQuery';
import { Poster } from './Case';

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

function Neighbor({ item, label, empty, Icon }) {
  if (!item) {
    return (
      <div className="link-card" data-empty="true">
        <span className="link-card-label">
          <Icon stroke={2} />
          {label}
        </span>
        <strong>{empty}</strong>
      </div>
    );
  }
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

export default function Connected({ type, raw }) {
  const query = useQuery(`connected-${type}-${raw.id}`, (signal) =>
    getConnected(type, raw, { signal }),
  );
  const selfKey = `${type}-${raw.id}`;
  const keywords = raw.keywords?.keywords ?? raw.keywords?.results ?? [];
  const curated = UNIVERSES.find(
    (u) => u.keyword && keywords.some((k) => k.id === u.keyword),
  );
  const data = query.data;
  const parts = data?.parts ?? [];
  const index = parts.findIndex((p) => p.key === selfKey);

  if (query.loading && !data) {
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

  const href = data?.collectionId
    ? universeHref(data.collectionId)
    : curated
      ? `/universe/${curated.slug}`
      : null;
  if (parts.length < 2 && !href) return null;
  const name = curated?.name ?? data?.name;

  return (
    <section className="block">
      <h2 className="block-title">
        Universe
        {parts.length > 1 && (
          <small>
            {index + 1} of {parts.length}, in release order
          </small>
        )}
      </h2>

      {parts.length > 1 && (
        <>
          <div className="connected-pair">
            <Neighbor
              item={parts[index - 1]}
              label="Previous"
              empty="This is where it starts"
              Icon={IconArrowLeft}
            />
            <Neighbor
              item={parts[index + 1]}
              label="Next"
              empty="The latest so far"
              Icon={IconArrowRight}
            />
          </div>
          <div ref={centerCurrent} className="connected-strip">
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
        </>
      )}

      {href && name && (
        <Link to={href} className="connected-more" viewTransition>
          Explore the {name} universe
          <IconArrowUpRight stroke={1.8} />
        </Link>
      )}
    </section>
  );
}
