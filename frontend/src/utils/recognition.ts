import type { CameraStatus, PredictionResponse } from '../types/voxis';

export type Tone = 'ok' | 'warn' | 'off' | 'danger';

export function describeStatus(prediction: PredictionResponse | null): {label: string;tone: Tone;} {
  if (!prediction) return { label: 'Waiting for frames', tone: 'off' };
  switch (prediction.status) {
    case 'RECOGNIZED':
      return prediction.stable ?
      { label: 'Committed recognition', tone: 'ok' } :
      { label: 'Detecting sign…', tone: 'warn' };
    case 'GESTURE_UNCLEAR':
      return { label: 'Analyzing movement', tone: 'warn' };
    case 'NO_HAND':
      return { label: 'No hand detected', tone: 'off' };
    case 'MODEL_UNAVAILABLE':
      return { label: 'Model unavailable', tone: 'danger' };
    default:
      return { label: 'Connecting…', tone: 'warn' };
  }
}

export function describeCamera(status: CameraStatus): {label: string;tone: Tone;} {
  switch (status) {
    case 'live':
      return { label: 'Camera ready', tone: 'ok' };
    case 'paused':
      return { label: 'Camera paused', tone: 'warn' };
    case 'starting':
      return { label: 'Starting camera', tone: 'warn' };
    case 'denied':
      return { label: 'Camera blocked', tone: 'danger' };
    case 'unavailable':
      return { label: 'No camera', tone: 'danger' };
    default:
      return { label: 'Camera off', tone: 'off' };
  }
}

/** Confidence colour thresholds preserved from RecognitionCard (>80 / >60 / else). */
export function confidenceTone(pct: number): Tone {
  if (pct > 80) return 'ok';
  if (pct > 60) return 'warn';
  return 'danger';
}

export function toPercent(confidence: number): number {
  const pct = confidence <= 1 ? confidence * 100 : confidence;
  return Math.round(Math.max(0, Math.min(100, pct)));
}