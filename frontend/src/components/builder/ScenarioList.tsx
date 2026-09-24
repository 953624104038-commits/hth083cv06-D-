import React from 'react';
import { PlayIcon } from 'lucide-react';
import type { DemoScenario } from '../../types/voxis';
import { SequenceChips } from './SequenceChips';

interface ScenarioListProps {
  scenarios: DemoScenario[];
  onTry: (signs: string[]) => void;
}

export function ScenarioList({ scenarios, onTry }: ScenarioListProps) {
  return (
    <div role="table" aria-label="Verified demo scenarios" className="w-full">
      <div role="row" className="hidden grid-cols-[40px_minmax(0,1.2fr)_minmax(0,2fr)_80px_96px] items-center gap-4 border-b border-line px-4 pb-2 text-xs font-semibold text-muted md:grid">
        <span role="columnheader">#</span>
        <span role="columnheader">Scenario</span>
        <span role="columnheader">Sequence</span>
        <span role="columnheader">Signs</span>
        <span role="columnheader" className="sr-only">
          Action
        </span>
      </div>
      <div className="mt-2 space-y-0.5">
        {scenarios.map((s, i) =>
        <div
          key={s.id}
          role="row"
          className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-md px-4 py-3 transition-colors duration-150 hover:bg-raised md:grid-cols-[40px_minmax(0,1.2fr)_minmax(0,2fr)_80px_96px]">
          
            <span role="cell" className="hidden text-sm tabular-nums text-muted md:block">
              {i + 1}
            </span>
            <div role="cell" className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-ink">{s.title}</p>
              <div className="mt-1.5 md:hidden">
                <SequenceChips signs={s.signs} />
              </div>
            </div>
            <div role="cell" className="hidden min-w-0 md:block">
              <SequenceChips signs={s.signs} />
            </div>
            <span role="cell" className="hidden text-sm text-muted md:block">
              {s.signs.length}
            </span>
            <div role="cell" className="flex justify-end">
              <button
              type="button"
              onClick={() => onTry(s.signs)}
              className="flex h-8 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-bold text-canvas transition-transform duration-150 ease-snappy hover:scale-[1.03] active:scale-[0.98]"
              aria-label={`Try ${s.title} live`}>
              
                <PlayIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Try
              </button>
            </div>
          </div>
        )}
      </div>
    </div>);

}