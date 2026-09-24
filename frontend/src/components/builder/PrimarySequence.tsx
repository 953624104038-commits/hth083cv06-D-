import React from 'react';
import { ArrowRightIcon, BoxIcon, PlayIcon } from 'lucide-react';
import { useRecognition } from '../../contexts/RecognitionContext';
import { findSign, primaryHindi } from '../../utils/signs';
import { Button } from '../ui/Button';

interface PrimarySequenceProps {
  signs: string[];
  onTry: () => void;
  onLearn3D: () => void;
}

export function PrimarySequence({ signs, onTry, onLearn3D }: PrimarySequenceProps) {
  const { vocabulary } = useRecognition();

  return (
    <section className="rounded-lg bg-[#0f2a1b] p-5 md:p-8" aria-labelledby="primary-seq-heading">
      <p className="text-[13px] font-semibold text-ink/80">Primary live demo combination</p>
      <h2 id="primary-seq-heading" className="mt-1 text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
        Standard emergency communication request
      </h2>

      <ol className="mt-6 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-3" aria-label="Signs in order">
        {signs.map((s, i) => {
          const sign = findSign(vocabulary, s);
          return (
            <li key={s} className="flex flex-col items-center gap-2 md:flex-1 md:flex-row md:gap-3">
              <div className="flex w-full items-center gap-4 rounded-lg bg-black/35 px-4 py-4 md:flex-col md:items-start md:gap-1 md:px-5 md:py-5">
                <span className="text-xs font-bold text-ink/70">Step {i + 1}</span>
                <span className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">{s.toUpperCase()}</span>
                <span className="ml-auto font-hindi text-base text-ink/80 md:ml-0">{sign ? primaryHindi(sign.hindi_name) : ''}</span>
              </div>
              {i < signs.length - 1 &&
              <ArrowRightIcon className="h-5 w-5 shrink-0 rotate-90 text-ink/60 md:rotate-0" aria-hidden="true" />
              }
            </li>);

        })}
      </ol>

      <p className="mt-4 text-[13px] text-ink/70">Demo combination using supported signs</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" icon={PlayIcon} onClick={onTry}>
          Try this sentence
        </Button>
        <Button variant="secondary" size="lg" icon={BoxIcon} onClick={onLearn3D}>
          Learn this sequence (3D)
        </Button>
      </div>
    </section>);

}