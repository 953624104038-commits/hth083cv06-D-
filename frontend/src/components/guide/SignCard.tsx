import React from 'react';
import { CameraIcon } from 'lucide-react';
import type { SignClass } from '../../types/voxis';
import { primaryHindi } from '../../utils/signs';
import { SignArtwork } from './SignArtwork';

interface SignCardProps {
  sign: SignClass;
  selected: boolean;
  onSelect: () => void;
  onPractice: () => void;
}

export function SignCard({ sign, selected, onSelect, onPractice }: SignCardProps) {
  return (
    <div
      className={`group relative flex flex-col rounded-lg p-3 transition-colors duration-150 ${
      selected ? 'bg-raised' : 'bg-card hover:bg-card-hover'}`
      }>
      
      <div className="relative">
        <SignArtwork sign={sign} className="aspect-square w-full rounded-md" />
        <button
          type="button"
          onClick={onPractice}
          tabIndex={-1}
          aria-label={`Practice ${sign.display_name} live`}
          title="Practice live"
          className="absolute bottom-2 right-2 z-10 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-accent text-accent-ink opacity-0 shadow-lg shadow-black/40 transition-[opacity,transform] duration-200 ease-snappy hover:scale-105 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
          
          <CameraIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        data-sign-card
        onClick={onSelect}
        aria-pressed={selected}
        className="mt-3 text-left after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-ink">
        
        <span className={`block truncate text-[15px] font-bold ${selected ? 'text-accent' : 'text-ink'}`}>{sign.display_name}</span>
        <span className="mt-0.5 block truncate text-[13px] text-muted">
          <span className="font-hindi">{primaryHindi(sign.hindi_name)}</span> · {sign.category}
        </span>
        {selected && <span className="sr-only">(selected)</span>}
      </button>
    </div>);

}