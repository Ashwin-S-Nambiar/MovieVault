import {
  IconCalendarEvent,
  IconEyeOff,
  IconShoppingBag,
  IconTicket,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { getProviders, getReleaseDates, providerRows } from '../lib/catalog';
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
      {shown.map((p, i) => (
        <img
          key={p.id}
          className="plogo"
          src={img(p.logo, 'w92')}
          alt=""
          loading="lazy"
          style={{ '--n': i }}
        />
      ))}
      {extra > 0 && (
        <span className="pstack-more" style={{ '--n': shown.length }}>
          +{extra}
        </span>
      )}
    </Tag>
  );
}

const DAY = 86_400_000;

export function useStreaming(item, enabled = true) {
  const region = useRegion();
  const services = useServices();
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const type = item?.type;
  const id = item?.id;
  const date = item?.date;
  const year = item?.year;
  useReconnect(failed, () => setAttempt((n) => n + 1));

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt re-runs the fetch
  useEffect(() => {
    if (!type || !id || !enabled) return;
    const controller = new AbortController();
    setRows(null);
    setFailed(false);
    getProviders(type, id, { signal: controller.signal })
      .then(async (data) => {
        const { mine, others, streaming } = providerRows(
          data.results?.[region],
          services,
        );
        const mineIds = new Set(mine.map((p) => p.id));
        const list = [
          ...mine.filter((p) => p.field !== 'rent' && p.field !== 'buy'),
          ...streaming.filter((p) => !mineIds.has(p.id)),
        ];
        const recent =
          type === 'movie' &&
          !list.length &&
          (date
            ? Date.now() - Date.parse(date) < 240 * DAY
            : !year || Number(year) >= new Date().getFullYear() - 1);
        const release = recent
          ? await getReleaseDates(id, region, {
              signal: controller.signal,
            }).catch(() => null)
          : null;
        if (controller.signal.aborted) return;
        setRows({
          for: `${type}:${id}`,
          mine,
          buyable: [...mine, ...others].some(
            (p) => p.field === 'rent' || p.field === 'buy',
          ),
          list,
          release,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [type, id, date, year, region, services, enabled, attempt]);

  return rows?.for === `${type}:${id}` ? rows : null;
}

const EXIT_MS = 180;

export function Availability({ id, providers, status, size, max, compact }) {
  const hasProviders = providers?.length > 0;
  const key =
    hasProviders || status
      ? [
          id,
          hasProviders && providers.map((p) => p.id).join(),
          status?.label,
        ].join('|')
      : null;
  const latest = useRef(null);
  latest.current = { providers: hasProviders ? providers : null, status };
  const [shown, setShown] = useState(() =>
    key ? { key, ...latest.current } : null,
  );
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (key) {
      setShown({ key, ...latest.current });
      setLeaving(false);
      return;
    }
    setLeaving(true);
    const timer = setTimeout(() => {
      setShown(null);
      setLeaving(false);
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [key]);

  if (!shown) return null;

  return (
    <span
      key={shown.key}
      className="availability"
      data-leaving={leaving}
      aria-hidden={leaving || undefined}
    >
      {shown.providers && (
        <ProviderStack providers={shown.providers} size={size} max={max} />
      )}
      {shown.status && <WatchBadge status={shown.status} compact={compact} />}
    </span>
  );
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
      <Availability
        id={item.key}
        providers={rows?.list}
        status={status}
        size={size}
        max={max}
        compact
      />
    </div>
  );
}

const STATUS_ICONS = {
  soon: IconCalendarEvent,
  digital: IconCalendarEvent,
  cinema: IconTicket,
  rent: IconShoppingBag,
  none: IconEyeOff,
};

export function WatchBadge({ status, compact = false }) {
  const region = useRegion();
  const Icon = STATUS_ICONS[status.tone];
  const label =
    status.tone === 'none' ? `Not streaming in ${region}` : status.label;
  const short = compact && status.short && status.short !== label;
  return (
    <span
      className="watch-badge"
      data-tone={status.tone}
      data-compact={compact}
      title={short ? label : undefined}
    >
      <Icon stroke={1.8} />
      <span className="watch-badge-text">{label}</span>
      {short && (
        <span className="watch-badge-short" aria-hidden="true">
          {status.short}
        </span>
      )}
    </span>
  );
}
