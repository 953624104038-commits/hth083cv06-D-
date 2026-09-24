import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, XIcon } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useRecognition } from '../../contexts/RecognitionContext';
import { findSign } from '../../utils/signs';
import { Hand3DViewer } from '../hand3d/Hand3DViewer';
import { has3D } from '../hand3d/gestureAnimations';
import { SignArtwork } from '../guide/SignArtwork';
import { Button } from '../ui/Button';

/** Step-through sequence learner; "Launch live" hands off to the target-sentence runner. */
export function SequencePlayerModal() {
  const { sequence, closeSequence, navigate } = useNavigation();
  const { vocabulary, startTargetSentence } = useRecognition();
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStep(0);
    if (sequence) setTimeout(() => dialogRef.current?.focus(), 0);
  }, [sequence]);

  const launchLive = () => {
    if (!sequence) return;
    startTargetSentence(sequence);
    closeSequence();
    navigate('translator');
  };

  const current = sequence ? sequence[step] : null;
  const sign = current ? findSign(vocabulary, current) : undefined;

  return (
    <AnimatePresence>
      {sequence && current &&
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
          className="absolute inset-0 bg-black/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeSequence}
          aria-hidden="true" />
        
          <motion.div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="seq-title"
          className="scroll-thin relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-xl bg-surface p-5 shadow-2xl shadow-black focus:outline-none md:p-6"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, sequence.length - 1));
            if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
          }}>
          
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-muted">Learn this sequence</p>
                <h2 id="seq-title" className="text-xl font-bold text-ink">
                  {sequence.map((s) => s.toUpperCase()).join(' → ')}
                </h2>
              </div>
              <button
              type="button"
              onClick={closeSequence}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-ink"
              aria-label="Close (Escape)">
              
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <ol className="mt-4 flex flex-wrap gap-2" aria-label="Steps">
              {sequence.map((s, i) =>
            <li key={`${s}-${i}`}>
                  <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? 'step' : undefined}
                className={`h-8 rounded-full px-3 text-[13px] font-bold transition-colors duration-150 ${
                i === step ? 'bg-ink text-canvas' : 'bg-raised text-muted hover:text-ink'}`
                }>
                
                    {i + 1}. {s.toUpperCase()}
                  </button>
                </li>
            )}
            </ol>

            <div className="mt-5">
              {has3D(current) ?
            <Hand3DViewer key={`${current}-${step}`} signId={current} stageClassName="h-64" /> :
            sign ?
            <SignArtwork sign={sign} className="h-64 w-full rounded-md" large /> :
            null}
            </div>

            <div className="mt-5">
              <h3 className="text-2xl font-extrabold text-ink">{sign?.display_name ?? current}</h3>
              {sign && <p className="font-hindi text-muted">{sign.hindi_name}</p>}
              {sign && <p className="mt-3 text-[15px] leading-relaxed text-ink">{sign.how_to_perform}</p>}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <div className="flex gap-2">
                <Button size="md" variant="secondary" icon={ChevronLeftIcon} disabled={step === 0} onClick={() => setStep((s) => s - 1)} aria-label="Previous sign" />
                <Button
                size="md"
                variant="secondary"
                icon={ChevronRightIcon}
                disabled={step === sequence.length - 1}
                onClick={() => setStep((s) => s + 1)}
                aria-label="Next sign" />
              
              </div>
              <Button variant="primary" icon={PlayIcon} onClick={launchLive}>
                Launch live
              </Button>
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}