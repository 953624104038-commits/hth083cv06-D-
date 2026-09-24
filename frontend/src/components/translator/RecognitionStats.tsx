import React from 'react';
import { useRecognition } from '../../contexts/RecognitionContext';
import { describeStatus } from '../../utils/recognition';

export function RecognitionStats() {
  const { prediction, fps } = useRecognition();
  const status = describeStatus(prediction);
  const hands = prediction?.hands_count ?? (prediction?.hand_detected ? 1 : 0);
  const split =
  prediction?.mp_latency_ms !== undefined && prediction?.rf_latency_ms !== undefined ?
  `Hands ${prediction.mp_latency_ms}ms · Model ${prediction.rf_latency_ms}ms` :
  'End-to-end';

  const items = [
  { label: 'Status', value: status.label, hint: prediction?.stable ? 'Stable' : 'Live' },
  { label: 'Hands in frame', value: prediction ? String(hands) : '—', hint: prediction?.hand_detected ? 'Tracking' : 'Not tracking' },
  { label: 'Latency', value: prediction ? `${prediction.latency_ms}ms` : '—', hint: split },
  { label: 'Frame rate', value: `${fps} fps`, hint: 'Responses per second' }];


  return (
    <dl className="grid grid-cols-2 gap-y-4 border-y border-line py-4 lg:grid-cols-4 lg:divide-x lg:divide-line">
      {items.map((it) =>
      <div key={it.label} className="px-1 lg:px-5 lg:first:pl-0">
          <dt className="text-xs font-semibold text-muted">{it.label}</dt>
          <dd className="mt-1 truncate text-[15px] font-bold text-ink">{it.value}</dd>
          <dd className="truncate text-xs text-subtle">{it.hint}</dd>
        </div>
      )}
    </dl>);

}