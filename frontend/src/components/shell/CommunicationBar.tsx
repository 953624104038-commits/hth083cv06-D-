import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DeleteIcon, HandIcon, Undo2Icon, Volume2Icon, XIcon } from 'lucide-react';
import { useRecognition } from '../../contexts/RecognitionContext';
import { confidenceTone, describeCamera, toPercent } from '../../utils/recognition';
import { findSign, getGroupTint, primaryHindi } from '../../utils/signs';

const BAR_TONE = { ok: 'bg-accent', warn: 'bg-warn', danger: 'bg-danger', off: 'bg-subtle' } as const;

export function CommunicationBar() {
  const {
    mode,
    prediction,
    islWords,
    aslSentence,
    undoWord,
    clearWords,
    aslDelete,
    aslClear,
    speak,
    targetSentence,
    targetStepIndex,
    cameraStatus,
    vocabulary
  } = useRecognition();

  const isIsl = mode === 'isl';
  const sentence = isIsl ? islWords.join(' ') : aslSentence;
  const recognized = prediction?.status === 'RECOGNIZED' ? prediction : null;
  const signName = recognized ? (isIsl ? recognized.display_name : recognized.letter || recognized.display_name) || null : null;
  const sign = signName && isIsl ? findSign(vocabulary, signName) : undefined;
  const hindi = recognized ? recognized.hindi_name || (sign ? sign.hindi_name : '') : '';
  const pct = prediction ? toPercent(prediction.confidence) : 0;
  const camera = describeCamera(cameraStatus);
  const hasTarget = !!targetSentence;
  const targetPct = targetSentence ? Math.min(100, targetStepIndex / targetSentence.length * 100) : 0;

  return (
    <footer
      className="flex h-[76px] shrink-0 items-center gap-4 bg-canvas px-4"
      aria-label="Communication controls">
      
      {/* Current sign */}
      <div className="flex min-w-0 flex-1 items-center gap-3 md:w-[30%] md:flex-none">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-raised"
          style={sign ? { backgroundColor: getGroupTint(sign.label) } : undefined}
          aria-hidden="true">
          
          {sign ?
          <span className="font-hindi text-base font-semibold text-ink">{primaryHindi(sign.hindi_name).slice(0, 2)}</span> :
          signName ?
          <span className="text-xl font-extrabold text-ink">{signName}</span> :

          <HandIcon className="h-6 w-6 text-subtle" />
          }
        </div>
        <div className="min-w-0" aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={signName ?? 'none'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}>
              
              <p className="truncate text-[15px] font-bold text-ink">{signName ? signName.toUpperCase() : 'No sign yet'}</p>
              {signName ?
              <p className="truncate text-[13px] text-muted">
                  {hindi && <span className="font-hindi">{primaryHindi(hindi)} · </span>}
                  {pct}% confidence
                </p> :

              <p className="truncate text-[13px] text-muted">
                  <span className="md:hidden">{sentence || 'Waiting for a sign'}</span>
                  <span className="hidden md:inline">Waiting for a sign</span>
                </p>
              }
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sentence + progress */}
      <div className="hidden min-w-0 flex-1 flex-col items-center gap-2 md:flex">
        <p className="w-full truncate text-center text-[15px] font-semibold text-ink" aria-live="polite">
          {sentence ?
          <span>{sentence}</span> :

          <span className="font-medium text-subtle">{isIsl ? 'Your sentence builds here as signs are recognized' : 'Typed letters appear here'}</span>
          }
        </p>
        <div className="flex w-full max-w-[560px] items-center gap-3">
          <span className="w-16 shrink-0 text-right text-[11px] font-semibold text-muted">
            {hasTarget ? 'Target' : 'Confidence'}
          </span>
          <div
            className="h-1 flex-1 overflow-hidden rounded-full bg-raised"
            role="progressbar"
            aria-label={hasTarget ? 'Target sentence progress' : 'Recognition confidence'}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(hasTarget ? targetPct : pct)}>
            
            <div
              className={`h-full rounded-full transition-[width] duration-200 ease-snappy ${hasTarget ? 'bg-accent' : BAR_TONE[prediction ? confidenceTone(pct) : 'off']}`}
              style={{ width: `${hasTarget ? targetPct : pct}%` }} />
            
          </div>
          <span className="w-16 shrink-0 text-[11px] font-semibold text-muted">
            {hasTarget && targetSentence ? `${Math.min(targetStepIndex, targetSentence.length)} of ${targetSentence.length}` : `${pct}%`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center justify-end gap-1 md:w-[30%]">
        <button
          type="button"
          onClick={() => speak(sentence)}
          disabled={!sentence.trim()}
          className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-canvas transition-transform duration-150 ease-snappy hover:scale-[1.03] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
          aria-label="Speak full sentence">
          
          <Volume2Icon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Speak</span>
        </button>
        <IconAction label={isIsl ? 'Undo last sign' : 'Delete last letter'} onClick={isIsl ? undoWord : aslDelete} disabled={!sentence} className="hidden sm:flex">
          {isIsl ? <Undo2Icon className="h-5 w-5" /> : <DeleteIcon className="h-5 w-5" />}
        </IconAction>
        <IconAction label="Clear sentence" onClick={isIsl ? clearWords : aslClear} disabled={!sentence}>
          <XIcon className="h-5 w-5" />
        </IconAction>
        <span className="ml-2 hidden items-center gap-2 text-xs font-semibold text-muted lg:flex" title={camera.label}>
          <span className={`h-2 w-2 rounded-full ${BAR_TONE[camera.tone]}`} aria-hidden="true" />
          {camera.label}
        </span>
      </div>
    </footer>);

}

function IconAction({
  label,
  onClick,
  disabled,
  className = '',
  children






}: {label: string;onClick: () => void;disabled?: boolean;className?: string;children: React.ReactNode;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-ink disabled:pointer-events-none disabled:opacity-40 ${className}`}>
      
      {children}
    </button>);

}