import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useInView } from '../lib/hooks';
import { BrandMark } from './Topbar';

const COLUMNS = [
  {
    heading: 'Browse',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Search', to: '/search' },
      { label: 'Universes', to: '/universes' },
      { label: 'Your vault', to: '/vault' },
    ],
  },
  {
    heading: 'Discover',
    links: [
      { label: 'Films', to: '/search?type=movie' },
      { label: 'Series', to: '/search?type=tv' },
      { label: 'Anime', to: '/search?type=anime' },
      { label: 'Top rated', to: '/search?type=movie&sort=rating' },
    ],
  },
  {
    heading: 'Made with',
    links: [
      { label: 'TMDB', href: 'https://www.themoviedb.org' },
      { label: 'JustWatch', href: 'https://www.justwatch.com' },
      {
        label: 'GitHub',
        href: 'https://github.com/Ashwin-S-Nambiar/MovieVault',
      },
    ],
  },
];

function Wordmark() {
  const textRef = useRef(null);
  const [ref, shown] = useInView({ rootMargin: '-40px' });
  const [box, setBox] = useState('0 0 1000 250');

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      const node = textRef.current;
      if (cancelled || !node) return;
      const { x, y, width, height } = node.getBBox();
      setBox(`${x} ${y + height * 0.14} ${width} ${height * 0.66}`);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      ref={ref}
      className="footer-mark"
      data-shown={shown}
      aria-hidden="true"
    >
      <svg viewBox={box} preserveAspectRatio="xMidYMid meet">
        <title>ashwin</title>
        <text ref={textRef} x="0" y="0" fontSize="300">
          ashwin.
        </text>
      </svg>
    </div>
  );
}

function useFooterInView() {
  const [ref, inView] = useInView({ rootMargin: '0px', once: false });

  useEffect(() => {
    const root = document.documentElement;
    if (inView) root.dataset.footer = 'visible';
    else delete root.dataset.footer;
    return () => {
      delete root.dataset.footer;
    };
  }, [inView]);

  return ref;
}

export default function Footer() {
  const barRef = useFooterInView();
  return (
    <footer className="footer">
      <div className="footer-top">
        <Wordmark />
        <div className="page footer-grid">
          <div>
            <Link to="/" className="footer-brand" viewTransition>
              <BrandMark className="footer-brand-mark" />
              MovieVault
            </Link>
            <p className="footer-blurb">
              Where to stream any film, series or anime, whole universes in the
              order they came out, and a vault for what's next.
            </p>
          </div>

          <nav className="footer-cols" aria-label="Footer">
            {COLUMNS.map(({ heading, links }) => (
              <div key={heading} className="footer-col">
                <p className="footer-heading">{heading}</p>
                {links.map((link) =>
                  link.href ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.label} to={link.to} viewTransition>
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div ref={barRef} className="page footer-bar">
        <p>
          &copy; {new Date().getFullYear()} Made by{' '}
          <a
            href="https://ashwin.co.in"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ashwin S Nambiar
          </a>
        </p>
        <p>
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </div>
    </footer>
  );
}
