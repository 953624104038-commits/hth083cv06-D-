import React from 'react';
import { CameraIcon } from 'lucide-react';
import type { QuickLearnSign } from '../../types/voxis';
import { Hand3DViewer } from '../hand3d/Hand3DViewer';
import { Button } from '../ui/Button';

interface QuickLearnCardProps {
  item: QuickLearnSign;
  selected: boolean;
  onSelect: () => void;
  onPractice: () => void;
}

export function QuickLearnCard({ item, selected, onSelect, onPractice }: QuickLearnCardProps) {
  return (
    <article
      className={`flex h-full flex-col rounded-lg p-3 transition-colors duration-150 ${selected ? 'bg-raised' : 'bg-card hover:bg-card-hover'}`}
      aria-label={`${item.name}, ${item.hindiName}`}>
      
      <div onClick={onSelect} className="cursor-pointer">
        <Hand3DViewer signId={item.id} compact stageClassName="aspect-square" />
      </div>
      <button type="button" onClick={onSelect} aria-pressed={selected} className="mt-3 text-left">
        <span className={`block truncate text-base font-bold ${selected ? 'text-accent' : 'text-ink'}`}>{item.name}</span>
        <span className="block truncate font-hindi text-sm text-muted">{item.hindiName}</span>
      </button>
      <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-muted">{item.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <span className="truncate text-xs font-semibold text-subtle">
          {item.hands} · {item.motion}
        </span>
        <Button size="sm" variant="primary" icon={CameraIcon} onClick={onPractice}>
          Practice
        </Button>
      </div>
    </article>);

}