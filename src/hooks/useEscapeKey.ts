import { useEffect } from 'react';

/**
 * Calls `onEscape` when Esc is pressed while `active` (e.g. a modal is open).
 * Ignored while an IME composition is in progress.
 */
export function useEscapeKey(onEscape: () => void, active = true): void {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.isComposing) {
        e.stopPropagation();
        onEscape();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape, active]);
}
