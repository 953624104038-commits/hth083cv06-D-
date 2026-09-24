import React from 'react';
import { DeleteIcon, SpaceIcon, XIcon } from 'lucide-react';
import { useRecognition } from '../../contexts/RecognitionContext';
import { Button } from '../ui/Button';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

export function AslTypist() {
  const { prediction, aslSentence, lastTypedChar, aslSpace, aslDelete, aslClear } = useRecognition();
  const letter = (prediction?.letter || '').toUpperCase();
  const hold = Math.max(0, Math.min(1, prediction?.hold_progress ?? 0));
  const r = 26;
  const c = 2 * Math.PI * r;

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_auto]" aria-label="ASL typist">
      <div className="rounded-lg bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">Typed text</h2>
          {lastTypedChar &&
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-ink" aria-live="polite">
              Typed {lastTypedChar === ' ' ? 'space' : lastTypedChar === 'BACKSPACE' ? 'delete' : lastTypedChar}
            </span>
          }
        </div>
        <p className="mt-3 min-h-[48px] break-words font-mono text-3xl font-bold text-ink">
          {aslSentence}
          <span className="ml-0.5 inline-block h-8 w-0.5 translate-y-1 bg-accent" aria-hidden="true" />
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={SpaceIcon} onClick={aslSpace}>
            Space
          </Button>
          <Button size="sm" variant="secondary" icon={DeleteIcon} onClick={aslDelete} disabled={!aslSentence}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" icon={XIcon} onClick={aslClear} disabled={!aslSentence}>
            Clear
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-5 rounded-lg bg-card p-5">
        <svg viewBox="0 0 64 64" className="h-20 w-20 -rotate-90" role="img" aria-label={`Hold progress ${Math.round(hold * 100)}%`}>
          <circle cx="32" cy="32" r={r} fill="none" stroke="#2a2a2a" strokeWidth="6" />
          <circle cx="32" cy="32" r={r} fill="none" stroke="#1ed760" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - hold)} />
        </svg>
        <div>
          <p className="text-xs font-semibold text-muted">Detected letter</p>
          <p className="text-5xl font-extrabold text-ink">{letter || '—'}</p>
          <p className="text-xs text-subtle">Hold steady to type</p>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="mb-3 text-[13px] font-bold text-muted">Fingerspelling keyboard</h3>
        <div className="space-y-1.5" aria-hidden="true">
          {ROWS.map((row, ri) =>
          <div key={row} className="flex justify-center gap-1.5" style={{ paddingLeft: ri * 16 }}>
              {row.split('').map((k) =>
            <span
              key={k}
              className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold transition-colors duration-150 ${
              k === letter ? 'bg-accent text-accent-ink' : 'bg-raised text-ink'}`
              }>
              
                  {k}
                </span>
            )}
            </div>
          )}
        </div>
      </div>
    </section>);

}