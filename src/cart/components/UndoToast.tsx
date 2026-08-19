'use client';

import { useEffect } from 'react';
import { useCartStore } from '../store';

const AUTO_DISMISS_MS = 7000;

/** "Item removed — Undo". Cheap insurance against an accidental tap. */
export function UndoToast() {
  const lastRemoved = useCartStore((state) => state.lastRemoved);
  const undoRemove = useCartStore((state) => state.undoRemove);

  useEffect(() => {
    if (!lastRemoved) return;
    const timer = window.setTimeout(
      () => useCartStore.setState({ lastRemoved: null }),
      AUTO_DISMISS_MS,
    );
    return () => window.clearTimeout(timer);
  }, [lastRemoved]);

  if (!lastRemoved) return null;

  return (
    <div
      role="status"
      className="pointer-events-auto mx-5 mb-3 flex items-center justify-between gap-3 rounded-panel bg-slate-900 px-4 py-3 text-sm text-white shadow-overlay motion-safe:animate-[cart-toast-in_200ms_ease-out]"
    >
      <span className="min-w-0 truncate">
        Removed <span className="font-medium">{lastRemoved.line.name}</span>
      </span>
      <button
        type="button"
        onClick={undoRemove}
        className="shrink-0 rounded font-semibold text-emerald-300 underline-offset-4 hover:underline focus-visible:focus-ring-inverse"
      >
        Undo
      </button>
    </div>
  );
}
