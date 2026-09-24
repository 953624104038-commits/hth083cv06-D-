import React from 'react';
import type { SignClass } from '../../types/voxis';
import { getGroupTint, getSignMeta, primaryHindi } from '../../utils/signs';

interface SignArtworkProps {
  sign: SignClass;
  className?: string;
  large?: boolean;
}

/** Typographic card artwork: the Hindi name on the sign group's colour. No invented imagery. */
export function SignArtwork({ sign, className = '', large = false }: SignArtworkProps) {
  const meta = getSignMeta(sign.label);
  const hindi = primaryHindi(sign.hindi_name);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundColor: getGroupTint(sign.label) }}
      aria-hidden="true">
      
      <span className={`px-3 text-center font-hindi font-semibold leading-tight text-ink ${large ? 'text-4xl' : hindi.length > 8 ? 'text-lg' : 'text-2xl'}`}>
        {hindi}
      </span>
      <span className="absolute bottom-2 left-2 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-bold text-ink">
        {meta.hands === 2 ? '2 hands' : '1 hand'}
      </span>
    </div>);

}