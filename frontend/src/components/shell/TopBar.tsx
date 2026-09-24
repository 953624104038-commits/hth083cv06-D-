import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PanelRightIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useRecognition } from '../../contexts/RecognitionContext';
import { StatusPill } from '../ui/StatusPill';
import { GlobalSearch } from './GlobalSearch';
import { VoxisLogo } from './VoxisLogo';

export function TopBar() {
  const { goBack, goForward, canGoBack, canGoForward, navigate, setDetailsOpen } = useNavigation();
  const { isConnected, prediction, isMuted, toggleMute } = useRecognition();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-2">
      <button
        type="button"
        onClick={() => navigate('translator')}
        className="flex h-12 shrink-0 items-center rounded-full px-2 md:w-[72px] md:justify-center md:px-0 xl:w-[280px] xl:justify-start xl:pl-5"
        aria-label="VOXIS home — Live Translator">
        
        <span className="xl:hidden">
          <VoxisLogo showWordmark={false} />
        </span>
        <span className="hidden xl:block">
          <VoxisLogo />
        </span>
      </button>

      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        <NavArrow label="Go back" disabled={!canGoBack} onClick={goBack}>
          <ChevronLeftIcon className="h-5 w-5" />
        </NavArrow>
        <NavArrow label="Go forward" disabled={!canGoForward} onClick={goForward}>
          <ChevronRightIcon className="h-5 w-5" />
        </NavArrow>
      </div>

      <div className="flex min-w-0 flex-1 justify-center px-1 md:px-4">
        <GlobalSearch />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden lg:inline-flex">
          <StatusPill
            tone={isConnected ? 'ok' : 'warn'}
            label={isConnected ? `Engine connected · ${prediction?.latency_ms ?? 14}ms` : 'Connecting to engine…'} />
          
        </span>
        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute automatic speech' : 'Mute automatic speech'}
          title={isMuted ? 'Speech muted' : 'Speech on'}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-raised text-ink transition-colors duration-150 hover:bg-[#333]">
          
          {isMuted ? <VolumeXIcon className="h-5 w-5 text-warn" /> : <Volume2Icon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          aria-label="Open context panel"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-raised text-ink transition-colors duration-150 hover:bg-[#333] lg:hidden">
          
          <PanelRightIcon className="h-5 w-5" />
        </button>
      </div>
    </header>);

}

function NavArrow({ label, disabled, onClick, children }: {label: string;disabled: boolean;onClick: () => void;children: React.ReactNode;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink transition-colors duration-150 hover:bg-raised disabled:cursor-not-allowed disabled:text-subtle disabled:hover:bg-surface">
      
      {children}
    </button>);

}