import React, { useState } from 'react';
import { AppShell } from './components/shell/AppShell';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { RecognitionProvider, useRecognition } from './contexts/RecognitionContext';
import { ConversationHistory } from './pages/ConversationHistory';
import { GestureGuide } from './pages/GestureGuide';
import { LiveTranslator } from './pages/LiveTranslator';
import { SentenceBuilder } from './pages/SentenceBuilder';
import { MultilingualStudio } from './components/MultilingualStudio';
import { AIKeyModal } from './components/AIKeyModal';

function CurrentView({ onOpenAIKey }: { onOpenAIKey: () => void }) {
  const { view } = useNavigation();
  const { prediction } = useRecognition();

  switch (view) {
    case 'guide':
      return <GestureGuide />;
    case 'builder':
      return <SentenceBuilder />;
    case 'history':
      return <ConversationHistory />;
    case 'multilingual':
      return (
        <div className="p-4 md:p-6 xl:p-8">
          <MultilingualStudio
            currentDetectedSign={prediction?.display_name}
            isStableEvent={prediction?.stable}
            onOpenAIKey={onOpenAIKey}
          />
        </div>
      );
    default:
      return <LiveTranslator />;
  }
}

export function App() {
  const [isAIKeyOpen, setIsAIKeyOpen] = useState(false);

  return (
    <RecognitionProvider>
      <NavigationProvider>
        <AppShell>
          <CurrentView onOpenAIKey={() => setIsAIKeyOpen(true)} />
        </AppShell>
        <AIKeyModal isOpen={isAIKeyOpen} onClose={() => setIsAIKeyOpen(false)} onKeyUpdated={() => {}} />
      </NavigationProvider>
    </RecognitionProvider>
  );
}

export default App;
