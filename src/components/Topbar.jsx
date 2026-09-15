import {
  IconArrowLeft,
  IconBookmark,
  IconChevronDown,
  IconDeviceTv,
} from '@tabler/icons-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
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

export function ServicesButton() {
  const { picked, region } = useServiceCatalog();
  return (
    <button
      type="button"
      className="services-btn"
      onClick={() => openSheet('services')}
      aria-label={
        picked.length
          ? `Your services: ${picked.map((p) => p.name).join(', ')}. Change services, region and appearance`
          : 'Pick your streaming services'
      }
    >
      {picked.length ? (
        <ProviderStack providers={picked} max={4} size={24} />
      ) : (
        <IconDeviceTv stroke={1.8} />
      )}
      <span className="services-btn-label">
        {picked.length ? 'Your services' : 'Pick your services'}
        <small>{region}</small>
      </span>
      <IconChevronDown stroke={2} />
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
              Vault{count > 0 && <span className="muted"> {count}</span>}
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
        </div>
      </div>
    </header>
  );
}
