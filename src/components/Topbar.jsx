import {
  IconArrowLeft,
  IconBookmark,
  IconChevronDown,
  IconDeviceTv,
  IconSettings,
} from '@tabler/icons-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { healthTone, useHealth } from '../lib/health';
import { useMediaQuery } from '../lib/hooks';
import { useServiceCatalog } from '../lib/services';
import { openSheet } from '../lib/ui';
import { useVault } from '../lib/watchlist';
import { ProviderStack } from './Providers';

export function BrandMark({ className = 'wordmark-mark' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="var(--ink)" />
      <circle cx="32" cy="32" r="19" fill="var(--accent)" />
      <circle
        cx="32"
        cy="32"
        r="12.5"
        fill="none"
        stroke="#fff"
        strokeOpacity=".28"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="32" r="5" fill="var(--ink)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link
      to="/"
      className="wordmark"
      viewTransition
      aria-label="MovieVault home"
    >
      <BrandMark />
      <span className="wordmark-text">MovieVault</span>
    </Link>
  );
}

function ServiceStackGhost({ count, max }) {
  const shown = Math.min(count, max);
  return (
    <span className="pstack" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <span key={i} className="plogo plogo-ghost" />
      ))}
      {count > shown && <span className="pstack-more">+{count - shown}</span>}
    </span>
  );
}

export function ServicesButton() {
  const { picked, region, services } = useServiceCatalog();
  const narrow = useMediaQuery('(max-width: 419px)');
  const max = narrow ? 3 : 4;
  const pending = services.length > 0 && picked.length === 0;
  return (
    <button
      type="button"
      className="services-btn"
      onClick={() => openSheet('services')}
      aria-label={
        picked.length
          ? `Your services: ${picked.map((p) => p.name).join(', ')}. Change services and region`
          : pending
            ? 'Your services. Change services and region'
            : 'Pick your streaming services'
      }
    >
      {picked.length ? (
        <ProviderStack providers={picked} max={max} />
      ) : pending ? (
        <ServiceStackGhost count={services.length} max={max} />
      ) : (
        <IconDeviceTv stroke={1.8} />
      )}
      <span className="services-btn-label">
        {picked.length || pending ? 'Your services' : 'Pick your services'}
        <small>{region}</small>
      </span>
      <IconChevronDown stroke={2} />
    </button>
  );
}

const PROBLEMS = new Set(['down', 'offline', 'bad-key']);

export function SettingsButton() {
  const problem = PROBLEMS.has(healthTone(useHealth()));
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => openSheet('settings')}
      aria-label={problem ? 'Settings, connection problem' : 'Settings'}
    >
      <IconSettings stroke={1.8} />
      {problem && <span className="icon-btn-dot" />}
    </button>
  );
}

export function BackButton({ fallback = '/', className = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      aria-label="Back"
      onClick={() =>
        location.key !== 'default'
          ? navigate(-1, { viewTransition: true })
          : navigate(fallback, { viewTransition: true })
      }
    >
      <IconArrowLeft stroke={1.8} />
    </button>
  );
}

export default function Topbar({ center, end }) {
  const count = useVault().length;
  return (
    <header className="topbar">
      <div className="page topbar-row">
        <Wordmark />
        <div>{center}</div>
        <div className="topbar-end">
          <nav className="nav-links" aria-label="Primary">
            <NavLink to="/universes" className="nav-link" viewTransition>
              Universes
            </NavLink>
            <NavLink to="/vault" className="nav-link" viewTransition>
              Vault{count > 0 && <span className="muted"> ({count})</span>}
            </NavLink>
          </nav>
          {end}
          <Link
            to="/vault"
            className="icon-btn nav-vault"
            aria-label={`Your vault, ${count} saved`}
            viewTransition
          >
            <IconBookmark stroke={1.8} />
            {count > 0 && (
              <span key={count} className="badge">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          <SettingsButton />
        </div>
      </div>
    </header>
  );
}
