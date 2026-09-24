import React from 'react';
import type { Tone } from '../../utils/recognition';

const DOT: Record<Tone, string> = {
  ok: 'bg-accent',
  warn: 'bg-warn',
  off: 'bg-subtle',
  danger: 'bg-danger'
};

interface StatusPillProps {
  tone: Tone;
  label: string;
  className?: string;
}

/** Status is always spelled out in text — colour only reinforces it. */
export function StatusPill({ tone, label, className = '' }: StatusPillProps) {
  return (
    <span className={`inline-flex h-7 items-center gap-2 whitespace-nowrap rounded-full bg-raised px-3 text-xs font-semibold text-ink ${className}`}>
      <span className={`h-2 w-2 rounded-full ${DOT[tone]}`} aria-hidden="true" />
      {label}
    </span>);

}