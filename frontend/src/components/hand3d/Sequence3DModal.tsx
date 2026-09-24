import React, { useState, useEffect, useRef } from 'react';
import { X, Play, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Video } from 'lucide-react';
import { Hand3DViewer } from './Hand3DViewer';
import { getGesture3D } from './gestureAnimations';

interface Sequence3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  sequence: string[];
  onLaunchLive: () => void;
}

export const Sequence3DModal: React.FC<Sequence3DModalProps> = ({
  isOpen,
  onClose,
  sequence,
  onLaunchLive,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isSequenceComplete, setIsSequenceComplete] = useState<boolean>(false);
  const autoPlayTimerRef = useRef<any>(null);

  // Reset on open or sequence change
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsSequenceComplete(false);
      setIsAutoPlaying(true);
    }
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isOpen, sequence]);

  const currentSign = sequence[currentStepIndex] || sequence[0] || 'Hello';
  const gesture = getGesture3D(currentSign);

  // Auto-advance sequence timer
  useEffect(() => {
    if (!isOpen || !isAutoPlaying || isSequenceComplete) return;

    const duration = (gesture?.durationMs || 1800) + 900; // Duration + 900ms pause
    autoPlayTimerRef.current = setTimeout(() => {
      if (currentStepIndex + 1 < sequence.length) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        setIsSequenceComplete(true);
        setIsAutoPlaying(false);
      }
    }, duration);

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isOpen, isAutoPlaying, currentStepIndex, sequence, gesture, isSequenceComplete]);

  if (!isOpen) return null;

  const handlePrev = () => {
    setIsAutoPlaying(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setIsSequenceComplete(false);
    }
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    if (currentStepIndex + 1 < sequence.length) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setIsSequenceComplete(true);
    }
  };

  const handleReplaySequence = () => {
    setCurrentStepIndex(0);
    setIsSequenceComplete(false);
    setIsAutoPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>3D Sequence Demonstration</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                  {sequence.length} Steps
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Observe the hand movements in sequence before performing on camera.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition active:scale-95"
            title="Close 3D Sequence Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Chips Bar */}
        <div className="px-5 py-3 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            {sequence.map((word, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-600 text-xs font-bold">→</span>}
                  <button
                    onClick={() => {
                      setCurrentStepIndex(idx);
                      setIsAutoPlaying(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 border border-indigo-400 ring-2 ring-indigo-400/30'
                        : isPast
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800/70 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    <span>{word}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <button
            onClick={handleReplaySequence}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95 shrink-0"
            title="Replay sequence from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay All</span>
          </button>
        </div>

        {/* Main 3D Stage Area */}
        <div className="p-5 flex flex-col items-center justify-center space-y-4">
          <div className="w-full flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Current Step ({currentStepIndex + 1} of {sequence.length})
              </span>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                <span>{currentSign}</span>
                {gesture?.hindiName && (
                  <span className="text-sm font-semibold text-emerald-400">
                    ({gesture.hindiName})
                  </span>
                )}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition"
                title="Previous Sign"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentStepIndex + 1 >= sequence.length}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition"
                title="Next Sign"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive 3D Viewer */}
          <div className="w-full">
            <Hand3DViewer
              key={`${currentSign}_${currentStepIndex}`}
              signId={currentSign}
              fallbackImgSrc={`/gestures/${currentSign.toLowerCase().replace(/\s+/g, '_')}.svg`}
              autoPlay={true}
              className="w-full"
            />
          </div>

          {/* Sequence Completion Alert & Call to Action */}
          {isSequenceComplete ? (
            <div className="w-full p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2.5 animate-in fade-in">
              <div className="text-emerald-300 font-bold text-sm">
                🎉 Complete sequence demonstrated: "{sequence.join(' • ')}"
              </div>
              <p className="text-xs text-slate-300">
                You've reviewed all gestures. Ready to practice in front of the camera?
              </p>
              <button
                onClick={onLaunchLive}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Now try it yourself → (Launch Live Recognition)</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between pt-2">
              <button
                onClick={onLaunchLive}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-1"
              >
                <span>Skip to live camera test →</span>
              </button>

              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isAutoPlaying ? 'Auto-Advancing...' : 'Resume Auto-Play'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
