import { IconX } from '@tabler/icons-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const EXIT_MS = 240;

export default function Sheet({
  open,
  onClose,
  title,
  actions,
  wide = false,
  children,
}) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef(null);
  const drag = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    sheetRef.current?.focus({ preventScroll: true });

    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      root.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const onPointerDown = (event) => {
    if (window.matchMedia('(min-width: 720px)').matches) return;
    if (event.target.closest('button, a, input, select')) return;
    drag.current = { y: event.clientY, t: performance.now(), dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    sheetRef.current.dataset.dragging = 'true';
  };

  const onPointerMove = (event) => {
    if (!drag.current) return;
    const raw = event.clientY - drag.current.y;
    const dy = raw < 0 ? -Math.sqrt(-raw) * 2 : raw;
    drag.current.dy = dy;
    sheetRef.current.style.transform = `translateY(${dy}px)`;
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    const { dy, t } = drag.current;
    const velocity = dy / (performance.now() - t);
    drag.current = null;
    const node = sheetRef.current;
    delete node.dataset.dragging;
    if (dy > 120 || velocity > 0.5) {
      node.style.transition = 'transform 240ms var(--ease-drawer)';
      node.style.transform = 'translateY(100%)';
      onClose();
    } else {
      node.style.transition = 'transform 300ms var(--ease-drawer)';
      node.style.transform = '';
    }
  };

  return createPortal(
    <div
      className={`sheet-root ${wide ? 'sheet-wide' : ''}`}
      data-closing={closing}
    >
      <button
        type="button"
        className="sheet-scrim"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="sheet-grabber" />
          <div className="sheet-head">
            <h2 id={titleId}>{title}</h2>
            <div className="topbar-end">
              {actions}
              <button
                type="button"
                className="icon-btn"
                aria-label="Close"
                onClick={onClose}
              >
                <IconX stroke={1.8} />
              </button>
            </div>
          </div>
        </div>
        <div className="sheet-scroll">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
