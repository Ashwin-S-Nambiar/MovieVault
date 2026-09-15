import { IconSearch } from '@tabler/icons-react';
import { useEffect } from 'react';
import {
  Link,
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from 'react-router';
import ServicesSheet from './ServicesSheet';
import StatusPill from './StatusPill';
import Toaster from './Toaster';

const DOCKED = /^\/($|vault|universes?)/;

function SearchDock() {
  return (
    <div className="search-dock">
      <Link to="/search" className="search-pill" viewTransition>
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
