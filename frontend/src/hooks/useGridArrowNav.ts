import { useCallback } from 'react';

/** Arrow-key roving between `[data-sign-card]` buttons inside a CSS grid. */
export function useGridArrowNav() {
  return useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-sign-card]'));
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;
    const top = items[0].getBoundingClientRect().top;
    let cols = items.findIndex((el) => el.getBoundingClientRect().top > top + 4);
    if (cols <= 0) cols = items.length;
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key] ?? 0;
    const next = items[idx + delta];
    if (next) {
      e.preventDefault();
      next.focus();
      next.scrollIntoView({ block: 'nearest' });
    }
  }, []);
}