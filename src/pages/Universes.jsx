import { IconArrowUpRight } from '@tabler/icons-react';
import { Link } from 'react-router';
import Footer from '../components/Footer';
import Img from '../components/Img';
import Topbar from '../components/Topbar';
import { usePageMeta } from '../lib/meta';
import { img } from '../lib/tmdb';
import { UNIVERSES } from '../lib/universes';

export default function Universes() {
  usePageMeta({
    title: 'Universes',
    description:
      'Franchises and shared worlds, every film laid out in release order with where each one streams.',
  });
  return (
    <main className="route">
      <Topbar back="/" />
      <div className="page">
        <header className="vault-head">
          <h1 className="vault-title">Universes</h1>
          <p className="section-sub">
            Franchises and shared worlds, every film laid out in release order
            with where each one streams.
          </p>
        </header>
        <div className="ugrid">
          {UNIVERSES.map((u, i) => (
            <Link
              key={u.slug}
              to={`/universe/${u.slug}`}
              className="utile rise"
              style={{ '--i': i }}
              viewTransition
            >
              <Img
                src={img(u.backdrop, 'w780')}
                loading={i < 6 ? 'eager' : 'lazy'}
              />
              <p className="utile-name">{u.name}</p>
              <span className="utile-go" aria-hidden="true">
                <IconArrowUpRight stroke={2} />
              </span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
