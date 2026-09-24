import React, { useEffect, useRef } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts';
import { SequencePlayerModal } from '../builder/SequencePlayerModal';
import { CommunicationBar } from './CommunicationBar';
import { MobileNav } from './MobileNav';
import { RightPanel } from './RightPanel';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell({ children }: {children: React.ReactNode;}) {
  const { view } = useNavigation();
  const mainRef = useRef<HTMLElement>(null);
  useGlobalShortcuts();

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-canvas font-sans text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-canvas">
        
        Skip to content
      </a>
      <TopBar />
      <div className="flex min-h-0 flex-1 gap-2 px-2">
        <Sidebar />
        <main id="main" ref={mainRef} tabIndex={-1} className="scroll-thin min-w-0 flex-1 overflow-y-auto rounded-lg bg-surface focus:outline-none">
          {children}
        </main>
        <RightPanel />
      </div>
      <MobileNav />
      <CommunicationBar />
      <SequencePlayerModal />
    </div>);

}