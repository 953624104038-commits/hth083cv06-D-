import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CameraIcon,
  CameraOffIcon,
  FlipHorizontal2Icon,
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  SplineIcon,
  VideoOffIcon } from
'lucide-react';
import { useRecognition } from '../../contexts/RecognitionContext';
import { useCamera } from '../../hooks/useCamera';
import { drawHands, parseHands } from '../../utils/handSkeleton';
import { confidenceTone, toPercent } from '../../utils/recognition';
import { primaryHindi } from '../../utils/signs';
import { Button } from '../ui/Button';

const TONE_BG = { ok: 'bg-accent', warn: 'bg-warn', danger: 'bg-danger', off: 'bg-subtle' } as const;

export function CameraPanel() {
  const { cameraStatus, setCameraStatus, sendFrame, cameraWanted, setCameraWanted, prediction, isConnected, mode } = useRecognition();
  const [mirrored, setMirrored] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const { videoRef, start, stop, togglePause } = useCamera({ status: cameraStatus, setStatus: setCameraStatus, onFrame: sendFrame });

  // Resume the camera when returning to this screen if it was on before.
  useEffect(() => {
    if (cameraWanted) void start();
    return () => setCameraStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skeleton overlay from backend landmarks
  useEffect(() => {
    const canvas = overlayRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (!showSkeleton || cameraStatus !== 'live') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    drawHands(ctx, parseHands(prediction?.landmarks), canvas.width, canvas.height);
  }, [prediction, showSkeleton, cameraStatus]);

  const handleStart = () => {
    setCameraWanted(true);
    void start();
  };
  const handleStop = () => {
    setCameraWanted(false);
    stop();
  };

  const active = cameraStatus === 'live' || cameraStatus === 'paused';
  const recognized = prediction?.status === 'RECOGNIZED';
  const name = recognized ? mode === 'isl' ? prediction?.display_name : prediction?.letter || prediction?.display_name : null;
  const pct = prediction ? toPercent(prediction.confidence) : 0;
  const hands = prediction?.hands_count ?? (prediction?.hand_detected ? 1 : 0);

  return (
    <section className="overflow-hidden rounded-lg bg-card" aria-label="Live camera">
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {/* 4:3 capture frame, cropped to 16:9 like object-cover so the skeleton stays aligned */}
        <div className="absolute left-0 top-1/2 aspect-[4/3] w-full" style={{ transform: `translateY(-50%) ${mirrored ? 'scaleX(-1)' : ''}` }}>
          <video ref={videoRef} className={`h-full w-full object-cover ${active ? '' : 'invisible'}`} playsInline muted aria-label="Your camera feed" />
          <canvas ref={overlayRef} width={640} height={480} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
        </div>

        {!active && <CameraPlaceholder status={cameraStatus} onStart={handleStart} />}

        {active &&
        <>
            <div className="absolute left-4 top-4 flex gap-2">
              <span className="flex h-7 items-center gap-2 rounded-full bg-black/70 px-3 text-xs font-bold text-ink">
                <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-accent' : 'bg-warn'}`} aria-hidden="true" />
                {isConnected ? `${mode.toUpperCase()} stream` : 'Connecting…'}
              </span>
            </div>
            <span className="absolute right-4 top-4 flex h-7 items-center rounded-full bg-black/70 px-3 text-xs font-bold text-ink">
              {hands > 0 ? `${hands} ${hands === 1 ? 'hand' : 'hands'} in frame` : 'No hand in frame'}
            </span>

            {cameraStatus === 'paused' &&
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="flex items-center gap-2 text-lg font-bold text-ink">
                  <PauseIcon className="h-5 w-5" aria-hidden="true" /> Recognition paused
                </span>
              </div>
          }

            {/* Current sign readout */}
            <div className="absolute bottom-4 left-4 min-w-[220px] max-w-[70%] rounded-lg bg-black/75 px-4 py-3" aria-live="polite" aria-atomic="true">
              <p className="text-[11px] font-bold text-muted">Current sign</p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                key={name ?? 'none'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}>
                
                  <p className="truncate text-3xl font-extrabold tracking-tight text-ink">{name ? name.toUpperCase() : '—'}</p>
                  {name && prediction?.hindi_name &&
                <p className="truncate font-hindi text-lg text-ink/90">{primaryHindi(prediction.hindi_name)}</p>
                }
                </motion.div>
              </AnimatePresence>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
                  <div className={`h-full rounded-full transition-[width] duration-200 ease-snappy ${TONE_BG[confidenceTone(pct)]}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-ink">Confidence {pct}%</span>
              </div>
            </div>
          </>
        }
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        {active ?
        <>
            <Button size="sm" variant="secondary" icon={cameraStatus === 'paused' ? PlayIcon : PauseIcon} onClick={togglePause}>
              {cameraStatus === 'paused' ? 'Resume' : 'Pause'}
            </Button>
            <Button size="sm" variant="ghost" icon={CameraOffIcon} onClick={handleStop}>
              Stop camera
            </Button>
          </> :

        <Button size="sm" variant="primary" icon={CameraIcon} onClick={handleStart} disabled={cameraStatus === 'starting'}>
            Start camera
          </Button>
        }
        <div className="ml-auto flex gap-1">
          <ToggleChip pressed={mirrored} onClick={() => setMirrored((m) => !m)} icon={<FlipHorizontal2Icon className="h-4 w-4" aria-hidden="true" />}>
            Mirror
          </ToggleChip>
          <ToggleChip pressed={showSkeleton} onClick={() => setShowSkeleton((s) => !s)} icon={<SplineIcon className="h-4 w-4" aria-hidden="true" />}>
            Skeleton
          </ToggleChip>
        </div>
      </div>
    </section>);

}

function ToggleChip({ pressed, onClick, icon, children }: {pressed: boolean;onClick: () => void;icon: React.ReactNode;children: React.ReactNode;}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors duration-150 ${
      pressed ? 'bg-ink text-canvas' : 'bg-raised text-ink hover:bg-[#333]'}`
      }>
      
      {icon}
      {children}
      <span className="sr-only">{pressed ? 'on' : 'off'}</span>
    </button>);

}

function CameraPlaceholder({ status, onStart }: {status: string;onStart: () => void;}) {
  if (status === 'starting') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
        <Loader2Icon className="h-8 w-8 animate-spin" aria-hidden="true" />
        <p className="text-sm font-semibold">Requesting camera access…</p>
      </div>);

  }
  const blocked = status === 'denied';
  const missing = status === 'unavailable';
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <VideoOffIcon className="h-10 w-10 text-subtle" aria-hidden="true" />
      <div>
        <p className="text-xl font-bold text-ink">{blocked ? 'Camera access is blocked' : missing ? 'No camera found' : 'Camera is off'}</p>
        <p className="mx-auto mt-1 max-w-[400px] text-sm text-muted">
          {blocked ?
          'Allow camera access in your browser’s site settings, then try again.' :
          missing ?
          'Connect a webcam to translate signs in real time.' :
          'Start the camera and sign within the frame. Recognized signs build your sentence below.'}
        </p>
      </div>
      {!missing &&
      <Button variant="primary" size="lg" icon={CameraIcon} onClick={onStart}>
          {blocked ? 'Try again' : 'Start camera'}
        </Button>
      }
    </div>);

}