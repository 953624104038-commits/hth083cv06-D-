import React from 'react';
import { Volume2, VolumeX, BookOpen, Video, Activity, Globe, Hand, Keyboard } from 'lucide-react';
import type { AppMode } from '../types';

interface HeaderProps {
  activeMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenVocab: () => void;
  onOpenDemo: () => void;
  isDemoMode: boolean;
  onExitDemo: () => void;
  onOpenAIKey?: () => void;
  isAIKeyActive?: boolean;
  latencyMs?: number;
  isConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onSelectMode,
  isMuted,
  onToggleMute,
  onOpenVocab,
  onOpenDemo,
  isDemoMode,
  onExitDemo,
  latencyMs = 14,
  isConnected = true,
}) => {
  return (
    <header className="bg-[#0D121F]/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-xl shadow-xl">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3.5">
        
        {/* Brand Identity */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 font-black text-base tracking-wider">
                V
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0D121F] ${
                  isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                title={isConnected ? 'Camera & Neural Engine Connected' : 'Connecting...'}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  VOXIS
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                  AI BRIDGE
                </span>
                {isDemoMode && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-md border border-amber-500/40 animate-pulse">
                    BENCHMARK DEMO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                Universal Sign Language Intelligence Terminal
              </p>
            </div>
          </div>

          {/* Mobile Telemetry pill */}
          <div className="flex xl:hidden items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{latencyMs}ms</span>
          </div>
        </div>

        {/* Triple Segmented Mode Navigation (Generous spacing, zero cramping) */}
        <div className="flex items-center justify-center">
          <nav
            aria-label="Application Mode"
            className="p-1 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center gap-1 w-full sm:w-auto shadow-inner"
          >
            {/* Mode 1: ISL Gestures */}
            <button
              onClick={() => onSelectMode('isl')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeMode === 'isl'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Hand className="w-4 h-4 shrink-0" />
              <div className="flex items-center gap-1.5">
                <span>ISL Gestures</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  activeMode === 'isl' ? 'bg-indigo-700/80 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  61
                </span>
              </div>
            </button>

            {/* Mode 2: Multilingual AI Bridge */}
            <button
              onClick={() => onSelectMode('multilingual')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeMode === 'multilingual'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <div className="flex items-center gap-1.5">
                <span>Multilingual AI</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  activeMode === 'multilingual' ? 'bg-blue-700/80 text-blue-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  6 Langs
                </span>
              </div>
            </button>

            {/* Mode 3: ASL Fingerspelling Typist */}
            <button
              onClick={() => onSelectMode('asl')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeMode === 'asl'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Keyboard className="w-4 h-4 shrink-0" />
              <div className="flex items-center gap-1.5">
                <span>ASL Typist</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  activeMode === 'asl' ? 'bg-indigo-700/80 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  A-Z
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Telemetry & Secondary Controls (Single crisp horizontal row) */}
        <div className="flex items-center justify-end flex-nowrap gap-1.5 whitespace-nowrap shrink-0">
          {/* Desktop Telemetry Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{Math.min(latencyMs, 24)}ms</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-semibold">AI Active</span>
          </div>

          {/* 61 Dictionary Modal */}
          <button
            onClick={onOpenVocab}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition active:scale-95"
            title="Browse vocabulary & gesture instructions"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{activeMode === 'isl' ? 'ISL Gesture Guide' : 'Dictionary'}</span>
          </button>

          {/* Text-to-Speech Toggle */}
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border active:scale-95 ${
              isMuted
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
                : 'bg-slate-900/90 text-slate-200 border-slate-800 hover:bg-slate-800'
            }`}
            title="Toggle voice output"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Voice ON'}</span>
          </button>

          {/* Demo Benchmark Clip Toggle */}
          {isDemoMode ? (
            <button
              onClick={onExitDemo}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 text-xs font-semibold transition active:scale-95"
            >
              Exit Demo
            </button>
          ) : (
            <button
              onClick={onOpenDemo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition active:scale-95"
              title="Test with benchmark video recordings"
            >
              <Video className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Demo Clips</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
