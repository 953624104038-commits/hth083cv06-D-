import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HandIcon, Undo2Icon, Volume2Icon, XIcon } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useRecognition } from '../../contexts/RecognitionContext';
import { confidenceTone, describeStatus, toPercent } from '../../utils/recognition';
import { findSign, getGroupTint, primaryHindi } from '../../utils/signs';
import { Button } from '../ui/Button';

const TONE_TEXT = { ok: 'text-accent', warn: 'text-warn', danger: 'text-danger', off: 'text-muted' } as const;
const TONE_BG = { ok: 'bg-accent', warn: 'bg-warn', danger: 'bg-danger', off: 'bg-subtle' } as const;

export function CurrentCommunicationPanel() {
  const { mode, prediction, islWords, aslSentence, transcript, undoWord, clearWords, aslClear, speak, vocabulary } = useRecognition();
  const { navigate, selectSign } = useNavigation();

  const isIsl = mode === 'isl';
  const recognized = prediction?.status === 'RECOGNIZED';
  const name = recognized ? isIsl ? prediction?.display_name : prediction?.letter || prediction?.display_name : null;
  const sign = name && isIsl ? findSign(vocabulary, name) : undefined;
  const hindi = recognized ? prediction?.hindi_name || sign?.hindi_name || '' : '';
  const pct = prediction ? toPercent(prediction.confidence) : 0;
  const tone = confidenceTone(pct);
  const status = describeStatus(prediction);
  const sentence = isIsl ? islWords.join(' ') : aslSentence;
  const recent = transcript.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="text-base font-bold text-ink">Current communication</h2>

      {/* Hero: current sign */}
      <section aria-labelledby="cc-current">
        <h3 id="cc-current" className="sr-only">
          Current sign
        </h3>
        <div
          className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-card"
          style={sign ? { backgroundColor: getGroupTint(sign.label) } : undefined}>
          
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={name ?? 'idle'}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="px-4 text-center"
              aria-live="polite">
              
              {name ?
              <>
                  <p className="text-4xl font-extrabold tracking-tight text-ink">{name.toUpperCase()}</p>
                  {hindi && <p className="mt-2 font-hindi text-2xl font-semibold text-ink/90">{primaryHindi(hindi)}</p>}
                </> :

              <>
                  <HandIcon className="mx-auto h-10 w-10 text-subtle" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-muted">Sign in front of the camera</p>
                </>
              }
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <span className={`text-sm font-bold ${TONE_TEXT[status.tone]}`}>{status.label}</span>
          <span className="text-sm font-semibold text-ink">{prediction ? `${pct}%` : '—'}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised" aria-hidden="true">
          <div className={`h-full rounded-full transition-[width] duration-200 ease-snappy ${TONE_BG[tone]}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-subtle">Confidence</p>
      </section>

      {/* Current sentence */}
      <section aria-labelledby="cc-sentence" className="rounded-lg bg-card p-4">
        <h3 id="cc-sentence" className="text-[13px] font-bold text-muted">
          {isIsl ? 'Current sentence' : 'Typed text'}
        </h3>
        <p className="mt-2 min-h-[28px] break-words text-lg font-bold leading-snug text-ink">
          {sentence || <span className="text-sm font-medium text-subtle">Nothing yet</span>}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" icon={Volume2Icon} onClick={() => speak(sentence)} disabled={!sentence.trim()}>
            Speak
          </Button>
          {isIsl &&
          <Button variant="secondary" size="sm" icon={Undo2Icon} onClick={undoWord} disabled={!islWords.length}>
              Undo
            </Button>
          }
          <Button variant="secondary" size="sm" icon={XIcon} onClick={isIsl ? clearWords : aslClear} disabled={!sentence}>
            Clear
          </Button>
        </div>
      </section>

      {/* Recent signs */}
      {isIsl &&
      <section aria-labelledby="cc-recent">
          <div className="flex items-center justify-between">
            <h3 id="cc-recent" className="text-[13px] font-bold text-muted">
              Recent signs
            </h3>
            {transcript.length > 0 &&
          <button type="button" onClick={() => navigate('history')} className="text-xs font-bold text-muted hover:text-ink hover:underline">
                Show all
              </button>
          }
          </div>
          {recent.length === 0 ?
        <p className="mt-2 text-sm text-subtle">Recognized signs will be listed here.</p> :

        <ul className="mt-2 space-y-0.5">
              {recent.map((e) => {
            const s = findSign(vocabulary, e.text);
            return (
              <li key={e.id}>
                    <button
                  type="button"
                  onClick={() => {
                    if (s) {
                      selectSign(s.label);
                      navigate('guide');
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors duration-150 hover:bg-raised">
                  
                      <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded font-hindi text-xs font-semibold text-ink"
                    style={{ backgroundColor: s ? getGroupTint(s.label) : '#2a2a2a' }}
                    aria-hidden="true">
                    
                        {s ? primaryHindi(s.hindi_name).slice(0, 2) : e.text.slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{e.text}</span>
                        <span className="block truncate text-xs text-muted">{e.timestamp}</span>
                      </span>
                      {typeof e.confidence === 'number' &&
                  <span className="shrink-0 text-xs font-semibold text-muted">{toPercent(e.confidence)}%</span>
                  }
                    </button>
                  </li>);

          })}
            </ul>
        }
        </section>
      }
    </div>);

}