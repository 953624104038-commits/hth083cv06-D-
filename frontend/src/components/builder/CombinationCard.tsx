import React from 'react';
import { BoxIcon, PlayIcon } from 'lucide-react';
import type { DemoCombination } from '../../types/voxis';
import { SequenceChips } from './SequenceChips';

interface CombinationCardProps {
  combo: DemoCombination;
  onTry: () => void;
  onLearn3D: () => void;
}

export function CombinationCard({ combo, onTry, onLearn3D }: CombinationCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-lg bg-card p-4 transition-colors duration-150 hover:bg-card-hover">
      <div className="relative flex min-h-[112px] items-center rounded-md bg-[#1f1f1f] p-4">
        <SequenceChips signs={combo.signs} size="md" />
        <button
          type="button"
          onClick={onTry}
          aria-label={`Try ${combo.title} live`}
          className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lg shadow-black/40 transition-[transform,background-color] duration-150 ease-snappy hover:scale-105 hover:bg-accent-hover">
          
          <PlayIcon className="ml-0.5 h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <h3 className="mt-4 truncate text-[15px] font-bold text-ink">{combo.title}</h3>
      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{combo.description}</p>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-xs font-semibold text-subtle">
          {combo.category} · {combo.signs.length} signs
        </span>
        <button
          type="button"
          onClick={onLearn3D}
          className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-muted transition-colors duration-150 hover:bg-raised hover:text-ink">
          
          <BoxIcon className="h-4 w-4" aria-hidden="true" />
          Learn
        </button>
      </div>
    </article>);

}