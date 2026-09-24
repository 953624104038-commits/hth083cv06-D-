import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, RotateCcwIcon, XIcon } from 'lucide-react';
import { useRecognition } from '../../contexts/RecognitionContext';
import { Button } from '../ui/Button';

export function TargetSentenceRunner() {
  const { targetSentence, targetStepIndex, startTargetSentence, clearTargetSentence } = useRecognition();
  if (!targetSentence) return null;
  const done = targetStepIndex >= targetSentence.length;

  return (
    <section className="rounded-lg bg-accent-soft p-4 md:p-5" aria-labelledby="target-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="target-heading" className="text-[15px] font-bold text-ink">
            {done ? 'Sentence complete' : 'Target sentence'}
          </h2>
          <p className="text-[13px] text-muted" aria-live="polite">
            {done ?
            'Every sign was recognized in order.' :
            `Sign ${targetStepIndex + 1} of ${targetSentence.length}: perform “${targetSentence[targetStepIndex]}”`}
          </p>
        </div>
        <div className="flex gap-2">
          {done &&
          <Button size="sm" variant="secondary" icon={RotateCcwIcon} onClick={() => startTargetSentence(targetSentence)}>
              Run again
            </Button>
          }
          <Button size="sm" variant="ghost" icon={XIcon} onClick={clearTargetSentence}>
            Clear target
          </Button>
        </div>
      </div>

      <ol className="mt-4 flex flex-wrap items-center gap-2" aria-label="Sentence steps">
        {targetSentence.map((word, i) => {
          const state = i < targetStepIndex ? 'done' : i === targetStepIndex ? 'current' : 'upcoming';
          return (
            <li key={`${word}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span className="text-subtle" aria-hidden="true">→</span>}
              <motion.span
                layout
                initial={false}
                animate={{ scale: state === 'current' ? 1.03 : 1 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${
                state === 'done' ?
                'bg-accent text-accent-ink' :
                state === 'current' ?
                'bg-ink text-canvas' :
                'bg-black/40 text-muted'}`
                }
                aria-current={state === 'current' ? 'step' : undefined}>
                
                {state === 'done' && <CheckIcon className="h-4 w-4" aria-hidden="true" />}
                {word.toUpperCase()}
                <span className="sr-only">{state === 'done' ? '(done)' : state === 'current' ? '(now)' : '(upcoming)'}</span>
              </motion.span>
            </li>);

        })}
      </ol>
    </section>);

}