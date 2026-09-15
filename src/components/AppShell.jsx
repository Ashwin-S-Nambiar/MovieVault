import { IconSearch } from '@tabler/icons-react';
import { useContext, useEffect } from 'react';
import {
  Link,
  Outlet,
  ScrollRestoration,
  UNSAFE_ViewTransitionContext,
  useLocation,
  useNavigate,
} from 'react-router';
import ServicesSheet from './ServicesSheet';
import StatusPill from './StatusPill';
import Toaster from './Toaster';

const DOCKED = /^\/($|vault|universes?)/;
const HAS_PILL = /^\/($|search|vault|universes?)/;

export function usePillTransition() {
  const vt = useContext(UNSAFE_ViewTransitionContext);
  const morphs =
    vt?.isTransitioning &&
    HAS_PILL.test(vt.currentLocation.pathname) &&
    HAS_PILL.test(vt.nextLocation.pathname);
  return morphs ? { viewTransitionName: 'search-pill' } : undefined;
}

function SearchDock() {
  const pill = usePillTransition();
  return (
    <div className="search-dock">
      <Link to="/search" className="search-pill" style={pill} viewTransition>
        <IconSearch stroke={1.8} />
        <span className="grow">Movies, series and anime</span>
        <kbd className="kbd">/</kbd>
      </Link>
    </div>
  );
}

export default function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event) => {
      const typing = event.target.closest?.(
        'input, textarea, select, [contenteditable="true"]',
      );
      const combo =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (combo || (event.key === '/' && !typing)) {
        event.preventDefault();
        if (pathname === '/search') {
          document.querySelector('.search-pill input')?.focus();
        } else {
          navigate('/search');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pathname, navigate]);

  return (
    <>
      <Outlet />
      {DOCKED.test(pathname) && <SearchDock />}
      <StatusPill />
      <Toaster />
      <ServicesSheet />
      <ScrollRestoration />
    </>
  );
}
