import React, { createContext, useContext } from 'react';
import { useRecognitionEngine, type RecognitionEngine } from '../hooks/useRecognitionEngine';

const RecognitionContext = createContext<RecognitionEngine | null>(null);

export function RecognitionProvider({ children }: {children: React.ReactNode;}) {
  const engine = useRecognitionEngine();
  return <RecognitionContext.Provider value={engine}>{children}</RecognitionContext.Provider>;
}

export function useRecognition(): RecognitionEngine {
  const ctx = useContext(RecognitionContext);
  if (!ctx) throw new Error('useRecognition must be used within RecognitionProvider');
  return ctx;
}