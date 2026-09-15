import {
  IconCalendarEvent,
  IconEyeOff,
  IconShoppingBag,
  IconTicket,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { getProviders, providerRows } from '../lib/catalog';
import { watchStatus } from '../lib/format';
import { useInView } from '../lib/hooks';
import { useRegion, useServices } from '../lib/prefs';
import { img } from '../lib/tmdb';
import { useReconnect } from '../lib/useQuery';

export function ProviderStack({ providers, max = 3, size, onClick, label }) {
  const shown = providers.slice(0, max);
  const extra = providers.length - shown.length;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className="pstack"
      style={size ? { '--size': `${size}px` } : undefined}
      onClick={onClick}
      aria-label={label ?? providers.map((p) => p.name).join(', ')}
      title={onClick ? undefined : providers.map((p) => p.name).join(', ')}
    >
      {shown.map((p) => (
        <img
          key={p.id}
          className="plogo"
          src={img(p.logo, 'w92')}
          alt=""
          loading="lazy"
        />
      ))}
      {extra > 0 && <span className="pstack-more">+{extra}</span>}
    </Tag>
  );
}

export function useStreaming(item, enabled = true) {
  const region = useRegion();
  const services = useServices();
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const type = item?.type;
  const id = item?.id;
  useReconnect(failed, () => setAttempt((n) => n + 1));

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt re-runs the fetch
  useEffect(() => {
    if (!type || !id || !enabled) return;
    const controller = new AbortController();
    setRows(null);
    setFailed(false);
    getProviders(type, id, { signal: controller.signal })
      .then((data) => {
        const { mine, others, streaming } = providerRows(
          data.results?.[region],
          services,
        );
        const mineIds = new Set(mine.map((p) => p.id));
        setRows({
          mine,
          buyable: [...mine, ...others].some(
            (p) => p.field === 'rent' || p.field === 'buy',
          ),
          list: [
            ...mine.filter((p) => p.field !== 'rent' && p.field !== 'buy'),
            ...streaming.filter((p) => !mineIds.has(p.id)),
          ],
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [type, id, region, services, enabled, attempt]);

  return rows;
}

export function LazyProviders({ item, size = 20, max = 3, onResolve }) {
  const [ref, inView] = useInView({ rootMargin: '300px' });
  const rows = useStreaming(item, inView);

  useEffect(() => {
    if (rows) onResolve?.(rows);
  }, [rows, onResolve]);

  const status = watchStatus(item, rows);

  return (
    <div ref={ref} className="tcard-providers">
      {rows?.list.length > 0 && (
        <ProviderStack providers={rows.list} size={size} max={max} />
      )}
      {status && <WatchBadge status={status} compact />}
    </div>
  );
}

const STATUS_ICONS = {
  soon: IconCalendarEvent,
  cinema: IconTicket,
  rent: IconShoppingBag,
  none: IconEyeOff,
};

export function WatchBadge({ status, compact = false }) {
  const region = useRegion();
  const Icon = STATUS_ICONS[status.tone];
  return (
    <span
      className="watch-badge"
      data-tone={status.tone}
      data-compact={compact}
    >
      <Icon stroke={1.8} />
      <span className="watch-badge-text">
        {status.tone === 'none' ? `Not streaming in ${region}` : status.label}
      </span>
    </span>
  );
}
