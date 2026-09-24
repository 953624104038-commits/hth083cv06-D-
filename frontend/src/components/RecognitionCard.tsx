import React from 'react';
import { Volume2, CheckCircle2, AlertTriangle, Hand, Zap, Gauge, ShieldCheck } from 'lucide-react';
import type { PredictionResponse } from '../types';

interface RecognitionCardProps {
  prediction: PredictionResponse | null;
  onSpeak: (text: string) => void;
  fps: number;
}

export const RecognitionCard: React.FC<RecognitionCardProps> = ({
  prediction,
  onSpeak,
  fps,
}) => {
  const status = prediction?.status || 'NO_HAND';
  const sign = prediction?.sign || 'NO_HAND';
  const displayName = prediction?.display_name || sign;
  const hindiName = prediction?.hindi_name || '';
  const category = prediction?.category || 'General';
  const confidence = Math.round((prediction?.confidence || 0) * 100);
  const latency = prediction?.latency_ms || 0;
  const isStable = prediction?.stable || false;
  const handsCount = prediction?.hands_count || 0;
  const fingerStates = prediction?.fingerStates;
  const topMatches = prediction?.topMatches || [];

  const getStatusBadge = () => {
    switch (status) {
      case 'RECOGNIZED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isStable ? 'COMMITTED RECOGNITION ✓' : 'DETECTING SIGN...'}
          </span>
        );
      case 'GESTURE_UNCLEAR':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            ANALYZING KINEMATICS
          </span>
        );
      case 'NO_HAND':
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-medium border border-slate-700 text-xs">
            <Hand className="w-3.5 h-3.5" />
            NO HAND DETECTED
          </span>
        );
    }
  };

  const getCardBorder = () => {
    if (status === 'RECOGNIZED' && isStable) return 'border-emerald-500/60 shadow-emerald-950/40 shadow-2xl';
    if (status === 'GESTURE_UNCLEAR') return 'border-amber-500/40 shadow-amber-950/20';
    return 'border-slate-800';
  };

  return (
    <div className={`flex flex-col bg-[#0E1322] border ${getCardBorder()} rounded-2xl p-5 transition-all duration-150 shadow-2xl`}>
      {/* Top Status & Telemetry Bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3">
        <div>{getStatusBadge()}</div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          {prediction?.mp_latency_ms !== undefined && prediction?.rf_latency_ms !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
              <span className="text-indigo-300">MP: {prediction.mp_latency_ms}ms</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-300">RF: {prediction.rf_latency_ms}ms</span>
            </div>
          )}
          <div className="flex items-center gap-1" title="Inference Pipeline Latency">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{latency} ms</span>
          </div>
          <div className="flex items-center gap-1" title="Processing Frames per Second">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <span>{fps} FPS</span>
          </div>
        </div>
      </div>

      {/* Main Recognized Sign Area */}
      <div className="flex-1 flex flex-col justify-center items-center text-center my-2 py-2">
        {status === 'RECOGNIZED' && handsCount > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 text-[11px] font-semibold uppercase tracking-wider">
                {category}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {handsCount === 1 ? '1 Hand' : '2 Hands'}
              </span>
            </div>

            {/* Giant English Sign */}
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none mb-2">
              {displayName}
            </h2>

            {/* Hindi Translation */}
            {hindiName && (
              <div className="text-lg md:text-xl font-medium text-emerald-300/90 mb-3 bg-emerald-950/30 px-4 py-1 rounded-xl border border-emerald-800/30">
                {hindiName}
              </div>
            )}

            {/* Confidence Progress Bar */}
            <div className="w-full max-w-xs flex flex-col gap-1.5 mt-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Kinematic Confidence</span>
                <span className="font-mono font-bold text-emerald-400">{confidence}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    confidence > 80 ? 'bg-emerald-500' : confidence > 60 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>

            {/* X-Force Top Candidate Matches */}
            {topMatches.length > 0 && (
              <div className="w-full flex flex-wrap items-center justify-center gap-1.5 mt-3">
                {topMatches.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                    title={m.reason}
                  >
                    {m.name}: <strong className="text-emerald-400">{m.confidence}%</strong>
                  </span>
                ))}
              </div>
            )}

            {/* Speak Button */}
            <button
              onClick={() => onSpeak(`${displayName}. ${hindiName}`)}
              className="mt-4 flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              <Volume2 className="w-4 h-4" /> Replay Speech (TTS)
            </button>
          </>
        ) : status === 'GESTURE_UNCLEAR' && handsCount > 0 ? (
          <div className="py-4 flex flex-col items-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-2 animate-pulse" />
            <h3 className="text-sm font-semibold text-amber-200 mb-1">Analyzing Hand Pose</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Hand tracked. Hold the sign steady for 0.25s to confirm recognition.
            </p>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center">
            <Hand className="w-10 h-10 text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-300 mb-1">Awaiting Signer</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Raise your hand into the camera frame. Predictions clear immediately when your hand leaves the view.
            </p>
          </div>
        )}
      </div>

      {/* X-Force 5-Finger Kinematic Joint State Bar */}
      {handsCount > 0 && fingerStates && (
        <div className="py-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1">
          {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((fName) => {
            const st = fingerStates[fName];
            return (
              <div
                key={fName}
                className={`flex-1 py-1 px-1.5 rounded-lg text-center border text-[10px] font-mono uppercase ${
                  st === 'OPEN'
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 font-bold'
                    : st === 'HALF'
                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[9px] text-slate-400">{fName}</div>
                <div>{st}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grounded Provenance Footer */}
      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> X-Force Kinematic + ISLRTC Engine
        </span>
        <span className="font-mono text-slate-500">61 ISL + 28 ASL</span>
      </div>
    </div>
  );
};
