import { useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

/**
 * Escape closes the topmost layer (sequence player → details drawer → gesture details).
 * "/" focuses search. Nothing overrides browser shortcuts.
 */
export function useGlobalShortcuts() {
  const { sequence, closeSequence, detailsOpen, setDetailsOpen, view, selectedSign, selectSign } = useNavigation();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        if (sequence) closeSequence();else
        if (detailsOpen) setDetailsOpen(false);else
        if (view === 'guide' && selectedSign && !isTypingTarget(e.target)) selectSign(null);
        return;
      }
      if (e.key === '/' && !isTypingTarget(e.target)) {
        const input = document.getElementById('voxis-search');
        if (input) {
          e.preventDefault();
          input.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sequence, closeSequence, detailsOpen, setDetailsOpen, view, selectedSign, selectSign]);
}