import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { View } from '../types/voxis';

interface NavigationValue {
  view: View;
  navigate: (v: View) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  guideQuery: string;
  setGuideQuery: (q: string) => void;
  selectedSign: string | null;
  selectSign: (label: string | null) => void;
  detailsOpen: boolean;
  setDetailsOpen: (open: boolean) => void;
  sequence: string[] | null;
  openSequence: (signs: string[]) => void;
  closeSequence: () => void;
}

const NavigationContext = createContext<NavigationValue | null>(null);

export function NavigationProvider({ children }: {children: React.ReactNode;}) {
  const [historyState, setHistoryState] = useState<{stack: View[];index: number;}>({
    stack: ['translator'],
    index: 0
  });
  const [guideQuery, setGuideQuery] = useState('');
  const [selectedSign, setSelectedSign] = useState<string | null>('Hello');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sequence, setSequence] = useState<string[] | null>(null);

  const view = historyState.stack[historyState.index];

  const navigate = useCallback((v: View) => {
    setHistoryState((prev) => {
      if (prev.stack[prev.index] === v) return prev;
      const stack = [...prev.stack.slice(0, prev.index + 1), v];
      return { stack, index: stack.length - 1 };
    });
    setDetailsOpen(false);
  }, []);

  const goBack = useCallback(() => {
    setHistoryState((prev) => prev.index > 0 ? { ...prev, index: prev.index - 1 } : prev);
  }, []);

  const goForward = useCallback(() => {
    setHistoryState((prev) => prev.index < prev.stack.length - 1 ? { ...prev, index: prev.index + 1 } : prev);
  }, []);

  const selectSign = useCallback((label: string | null) => {
    setSelectedSign(label);
    if (label && typeof window !== 'undefined' && window.innerWidth < 1024) setDetailsOpen(true);
  }, []);

  const value = useMemo<NavigationValue>(
    () => ({
      view,
      navigate,
      goBack,
      goForward,
      canGoBack: historyState.index > 0,
      canGoForward: historyState.index < historyState.stack.length - 1,
      guideQuery,
      setGuideQuery,
      selectedSign,
      selectSign,
      detailsOpen,
      setDetailsOpen,
      sequence,
      openSequence: (signs: string[]) => setSequence(signs),
      closeSequence: () => setSequence(null)
    }),
    [view, navigate, goBack, goForward, historyState, guideQuery, selectedSign, selectSign, detailsOpen, sequence]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}