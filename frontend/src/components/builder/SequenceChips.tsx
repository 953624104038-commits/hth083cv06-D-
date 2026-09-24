import React from 'react';

/** Compact inline sequence: HELLO → NEED → HELP */
export function SequenceChips({ signs, size = 'sm' }: {signs: string[];size?: 'sm' | 'md';}) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label={`Sequence: ${signs.join(', then ')}`}>
      {signs.map((s, i) =>
      <li key={`${s}-${i}`} className="flex items-center gap-1.5">
          {i > 0 &&
        <span className="text-subtle" aria-hidden="true">
              →
            </span>
        }
          <span
          className={`whitespace-nowrap rounded-full bg-raised font-bold text-ink ${size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'}`}>
          
            {s.toUpperCase()}
          </span>
        </li>
      )}
    </ol>);

}