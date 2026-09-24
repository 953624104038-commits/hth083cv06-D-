import React from 'react';
import { CrosshairIcon, XIcon } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useRecognition } from '../../contexts/RecognitionContext';
import { Button } from '../ui/Button';

export function PracticeBanner() {
  const { practiceSign, setPracticeSign, prediction } = useRecognition();
  const { navigate, selectSign } = useNavigation();
  if (!practiceSign) return null;

  const matched =
  prediction?.status === 'RECOGNIZED' &&
  [prediction.display_name, prediction.sign].some((v) => (v || '').toLowerCase() === practiceSign.toLowerCase());

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-lg bg-card p-4" aria-label="Practice target">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <CrosshairIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-muted">Target practice sign</p>
        <p className="text-lg font-bold text-ink">
          {practiceSign.toUpperCase()}
          <span className={`ml-3 text-sm font-bold ${matched ? 'text-accent' : 'text-muted'}`} aria-live="polite">
            {matched ? '✓ Recognized' : 'Perform the sign in frame'}
          </span>
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            selectSign(practiceSign);
            navigate('guide');
          }}>
          
          View demonstration
        </Button>
        <Button size="sm" variant="ghost" icon={XIcon} onClick={() => setPracticeSign(null)}>
          Clear target
        </Button>
      </div>
    </section>);

}