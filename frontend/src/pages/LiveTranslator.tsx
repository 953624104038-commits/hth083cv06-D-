import React from 'react';
import { BookOpenIcon, ListOrderedIcon } from 'lucide-react';
import { AslTypist } from '../components/translator/AslTypist';
import { CameraPanel } from '../components/translator/CameraPanel';
import { PracticeBanner } from '../components/translator/PracticeBanner';
import { RecognitionStats } from '../components/translator/RecognitionStats';
import { TargetSentenceRunner } from '../components/translator/TargetSentenceRunner';
import { StatusPill } from '../components/ui/StatusPill';
import { useNavigation } from '../contexts/NavigationContext';
import { useRecognition } from '../contexts/RecognitionContext';
import { PRIMARY_SEQUENCE } from '../data/combinations';
import { describeCamera } from '../utils/recognition';
import type { AppMode } from '../types/voxis';

const MODES: {id: AppMode;label: string;meta: string;}[] = [
{ id: 'isl', label: 'ISL signs', meta: '61' },
{ id: 'asl', label: 'ASL typist', meta: 'A–Z' }];


export function LiveTranslator() {
  const { mode, selectMode, cameraStatus, isConnected, startTargetSentence, targetSentence } = useRecognition();
  const { navigate } = useNavigation();
  const camera = describeCamera(cameraStatus);

  return (
    <div className="space-y-6 px-4 pb-10 pt-6 md:px-6 xl:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-ink">Live Translator</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusPill tone={camera.tone} label={camera.label} />
            <StatusPill tone={isConnected ? 'ok' : 'warn'} label={isConnected ? 'Engine connected' : 'Connecting to engine'} />
          </div>
        </div>
        <div role="radiogroup" aria-label="Recognition mode" className="flex rounded-full bg-raised p-1">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectMode(m.id)}
                className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors duration-150 ${
                active ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'}`
                }>
                
                {m.label}
                <span className={`text-xs font-semibold ${active ? 'text-canvas/70' : 'text-subtle'}`}>{m.meta}</span>
              </button>);

          })}
        </div>
      </header>

      {mode === 'isl' && <PracticeBanner />}
      {mode === 'isl' && <TargetSentenceRunner />}

      <CameraPanel />

      {mode === 'isl' ?
      <>
          <RecognitionStats />
          <section aria-labelledby="shortcuts-heading">
            <h2 id="shortcuts-heading" className="mb-3 text-xl font-bold text-ink">
              Jump back in
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <Shortcut
              icon={<BookOpenIcon className="h-6 w-6" aria-hidden="true" />}
              title="Gesture Guide"
              meta="Browse all 61 supported signs"
              onClick={() => navigate('guide')} />
            
              {!targetSentence &&
            <Shortcut
              icon={<ListOrderedIcon className="h-6 w-6" aria-hidden="true" />}
              title={PRIMARY_SEQUENCE.map((s) => s.toUpperCase()).join(' → ')}
              meta="Try the primary demo sentence"
              onClick={() => startTargetSentence(PRIMARY_SEQUENCE)} />

            }
            </div>
          </section>
        </> :

      <AslTypist />
      }
    </div>);

}

function Shortcut({ icon, title, meta, onClick }: {icon: React.ReactNode;title: string;meta: string;onClick: () => void;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-16 items-center gap-4 overflow-hidden rounded-md bg-raised/70 pr-4 text-left transition-colors duration-150 hover:bg-raised">
      
      <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-accent-soft text-accent">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-bold text-ink">{title}</span>
        <span className="block truncate text-xs text-muted">{meta}</span>
      </span>
    </button>);

}