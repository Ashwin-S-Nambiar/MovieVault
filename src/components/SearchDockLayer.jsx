import { createPortal } from 'react-dom';

// Keep fixed search controls outside route animation stacking contexts.
export default function SearchDockLayer({ children, style }) {
  return createPortal(
    <div className="search-dock" style={style}>
      {children}
    </div>,
    document.body,
  );
}
