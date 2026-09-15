import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router';
import Footer from '../components/Footer';
import OpenCase from '../components/OpenCase';
import Segmented from '../components/Segmented';
import Sheet from '../components/Sheet';
import TitleCard from '../components/TitleCard';
import Topbar from '../components/Topbar';
import { plural } from '../lib/format';
import { usePageMeta } from '../lib/meta';
import { toast } from '../lib/ui';
import {
  clearVault,
  removeFromVault,
  restoreToVault,
  useVault,
} from '../lib/watchlist';

const SORTS = {
  added: (a, b) => b.addedAt - a.addedAt,
  title: (a, b) => a.title.localeCompare(b.title),
  year: (a, b) => (b.year || '0').localeCompare(a.year || '0'),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
};

export default function Vault() {
  const vault = useVault();
  const [kind, setKind] = useState('all');
  const [sort, setSort] = useState('added');
  const [confirming, setConfirming] = useState(false);
  usePageMeta({
    title: 'Your vault',
    description:
      'Everything you want to watch, in one place, with where each title is streaming right now.',
  });

  const counts = {};
  for (const item of vault) counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  const shown = vault
    .filter((item) => kind === 'all' || item.kind === kind)
    .sort(SORTS[sort]);

  const remove = (item) => {
    const entry = vault.find((x) => x.key === item.key);
    removeFromVault(item.key);
    toast(`Removed ${item.title}`, {
      poster: item.poster,
      action: { label: 'Undo', onClick: () => restoreToVault(entry) },
    });
  };

  const summary = [
    counts.movie && plural(counts.movie, 'film'),
    counts.tv && `${counts.tv} series`,
    counts.anime && `${counts.anime} anime`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <main className="route">
      <Topbar back="/" />
      <div className="page">
        <header className="vault-head">
          <h1 className="vault-title">Your vault</h1>
          <p className="section-sub">
            {vault.length
              ? summary
              : 'Everything you want to watch, in one place.'}
          </p>

          {vault.length > 0 && (
            <div className="toolbar">
              <Segmented
                label="Show"
                value={kind}
                onChange={setKind}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'movie', label: 'Films' },
                  { value: 'tv', label: 'Series' },
                  { value: 'anime', label: 'Anime' },
                ]}
              />
              <div className="toolbar-end">
                <select
                  className="select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort"
                >
                  <option value="added">Recently saved</option>
                  <option value="title">Title</option>
                  <option value="year">Release year</option>
                  <option value="rating">Rating</option>
                </select>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setConfirming(true)}
                >
                  <IconTrash stroke={1.8} />
                  Clear
                </button>
              </div>
            </div>
          )}
        </header>

        {vault.length === 0 ? (
          <div className="shelf-empty">
            <OpenCase open hero={false} />
            <h2>Nothing saved yet</h2>
            <p>
              Tap the bookmark on any film, series or anime and it lands here,
              with where it's streaming.
            </p>
            <div
              className="detail-actions"
              style={{ justifyContent: 'center' }}
            >
              <Link to="/" className="btn btn-solid" viewTransition>
                Browse what's trending
              </Link>
              <Link to="/universes" className="btn" viewTransition>
                Explore universes
              </Link>
            </div>
          </div>
        ) : shown.length === 0 ? (
          <div className="state">
            <h2>
              No{' '}
              {kind === 'tv' ? 'series' : kind === 'movie' ? 'films' : 'anime'}{' '}
              saved
            </h2>
          </div>
        ) : (
          <div className="grid">
            {shown.map((item, i) => (
              <TitleCard
                key={item.key}
                item={item}
                index={i}
                onRemove={remove}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />

      <Sheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Clear your vault?"
      >
        <p className="muted" style={{ marginTop: 0 }}>
          This removes all {plural(vault.length, 'title')}. You can undo it for
          a few seconds.
        </p>
        <div className="detail-actions">
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => {
              const undo = clearVault();
              setConfirming(false);
              toast('Vault cleared', {
                action: { label: 'Undo', onClick: undo },
              });
            }}
          >
            Clear everything
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setConfirming(false)}
          >
            Keep them
          </button>
        </div>
      </Sheet>
    </main>
  );
}
