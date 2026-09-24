import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BoxIcon, PlayIcon, PlusIcon, Undo2Icon, XIcon } from 'lucide-react';
import { useRecognition } from '../../contexts/RecognitionContext';
import { Button } from '../ui/Button';

interface CustomSentenceComposerProps {
  onTry: (signs: string[]) => void;
  onLearn3D: (signs: string[]) => void;
}

export function CustomSentenceComposer({ onTry, onLearn3D }: CustomSentenceComposerProps) {
  const { vocabulary } = useRecognition();
  const [sequence, setSequence] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('Hello');

  return (
    <div className="rounded-lg bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="custom-sign" className="sr-only">
          Choose a sign to add
        </label>
        <select
          id="custom-sign"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-full border border-line-strong bg-raised px-4 text-sm font-semibold text-ink focus:border-ink focus:outline-none sm:max-w-[320px]">
          
          {vocabulary.map((s) =>
          <option key={s.label} value={s.display_name}>
              {s.display_name} — {s.hindi_name}
            </option>
          )}
        </select>
        <Button variant="secondary" icon={PlusIcon} onClick={() => setSequence((p) => [...p, selected])}>
          Add sign
        </Button>
      </div>

      <div className="mt-5 flex min-h-[56px] flex-wrap items-center gap-2 rounded-md border border-dashed border-line-strong p-3" aria-live="polite">
        {sequence.length === 0 ?
        <p className="px-1 text-sm text-subtle">Add signs to compose a sequence.</p> :

        <AnimatePresence initial={false}>
            {sequence.map((s, i) =>
          <motion.span
            key={`${s}-${i}`}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-2">
            
                {i > 0 && <span className="text-subtle" aria-hidden="true">→</span>}
                <span className="rounded-full bg-raised px-3 py-1 text-sm font-bold text-ink">{s.toUpperCase()}</span>
              </motion.span>
          )}
          </AnimatePresence>
        }
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" icon={PlayIcon} disabled={!sequence.length} onClick={() => onTry(sequence)}>
          Try live
        </Button>
        <Button variant="secondary" size="sm" icon={BoxIcon} disabled={!sequence.length} onClick={() => onLearn3D(sequence)}>
          Learn 3D
        </Button>
        <Button variant="ghost" size="sm" icon={Undo2Icon} disabled={!sequence.length} onClick={() => setSequence((p) => p.slice(0, -1))}>
          Remove last
        </Button>
        <Button variant="ghost" size="sm" icon={XIcon} disabled={!sequence.length} onClick={() => setSequence([])}>
          Clear
        </Button>
      </div>
    </div>);

}