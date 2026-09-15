import { IconBookmark, IconBookmarkFilled } from '@tabler/icons-react';
import { toast } from '../lib/ui';
import {
  addToVault,
  removeFromVault,
  restoreToVault,
  useInVault,
  vaultStore,
} from '../lib/watchlist';

export function toggleSaved(item) {
  const existing = vaultStore.get().find((x) => x.key === item.key);
  if (existing) {
    removeFromVault(item.key);
    toast(`Removed ${item.title}`, {
      poster: item.poster,
      action: { label: 'Undo', onClick: () => restoreToVault(existing) },
    });
  } else {
    addToVault(item);
    toast(`Saved ${item.title} to your vault`, {
      poster: item.poster,
      action: { label: 'Undo', onClick: () => removeFromVault(item.key) },
    });
  }
}

export default function SaveButton({ item, variant = 'round' }) {
  const saved = useInVault(item?.key);
  if (!item) return null;

  if (variant === 'pill') {
    return (
      <button
        type="button"
        className="btn"
        aria-pressed={saved}
        onClick={() => toggleSaved(item)}
      >
        {saved ? <IconBookmarkFilled /> : <IconBookmark stroke={1.8} />}
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="save-btn"
      aria-pressed={saved}
      aria-label={saved ? 'Remove from vault' : 'Save to vault'}
      onClick={() => toggleSaved(item)}
    >
      <IconBookmarkFilled data-on={saved} />
      <IconBookmark data-on={!saved} stroke={2} />
    </button>
  );
}
