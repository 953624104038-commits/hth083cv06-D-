import React from 'react';

export function VoxisLogo({ showWordmark = true }: {showWordmark?: boolean;}) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#1ed760" />
        <path d="M9 10.5l7 12 7-12" fill="none" stroke="#000" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWordmark && <span className="text-xl font-extrabold tracking-tight text-ink">VOXIS</span>}
    </span>);

}