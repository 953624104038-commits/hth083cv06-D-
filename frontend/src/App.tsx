import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { CameraFeed } from './components/CameraFeed';
import { RecognitionCard } from './components/RecognitionCard';
import { SentenceBuilder } from './components/SentenceBuilder';
import { ASLKeyboardGuide } from './components/ASLKeyboardGuide';
import { TranscriptTimeline } from './components/TranscriptTimeline';
import { StaffTwoWayPanel } from './components/StaffTwoWayPanel';
import { VocabularyModal } from './components/VocabularyModal';
import { DemoModeModal } from './components/DemoModeModal';
import { MultilingualStudio } from './components/MultilingualStudio';
import type { PredictionResponse, TranscriptEntry, SignClass, AppMode } from './types';
import { speechService } from './utils/speech';

export const App: React.FC = () => {
  // Mode: 'isl' (61-word gestures) or 'asl' (alphabet fingerspelling & typing) or 'multilingual' (Multilingual AI Bridge)
  const [activeMode, setActiveMode] = useState<AppMode>('isl');
  
  // Real-time perception state
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // ASL Typist sentence buffer - starts blank
  const [sentence, setSentence] = useState<string>('');
  const [lastTypedChar, setLastTypedChar] = useState<string | null>(null);

  // ISL Live Gesture Sentence Builder sequence
  const [islWords, setIslWords] = useState<string[]>([]);
  const [targetPracticeSign, setTargetPracticeSign] = useState<string | null>(null);
  const [targetSentence, setTargetSentence] = useState<string[] | null>(null);
  const [targetStepIndex, setTargetStepIndex] = useState<number>(0);
  const targetSentenceRef = useRef<string[] | null>(null);
  const targetStepIndexRef = useRef<number>(0);

  useEffect(() => {
    targetSentenceRef.current = targetSentence;
  }, [targetSentence]);

  useEffect(() => {
    targetStepIndexRef.current = targetStepIndex;
  }, [targetStepIndex]);

  // Modals
  const [isVocabOpen, setIsVocabOpen] = useState<boolean>(false);
  const [isDemoOpen, setIsDemoOpen] = useState<boolean>(false);
  const [demoVideo, setDemoVideo] = useState<string | null>(null);

  // Dynamic Vocabulary
  const [vocabulary, setVocabulary] = useState<SignClass[]>([]);

  // Telemetry FPS & Latency
  const [fps, setFps] = useState<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsCalcRef = useRef<number>(Date.now());

  // WebSocket Connection
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Fetch vocabulary whenever activeMode changes
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/classes?mode=${activeMode}`)
      .then(res => res.json())
      .then(data => {
        if (data.classes) {
          setVocabulary(data.classes);
        }
      })
      .catch(err => console.log('Could not fetch classes:', err));
  }, [activeMode]);

  // Handle Mode Change
  const handleSelectMode = (newMode: AppMode) => {
    setActiveMode(newMode);
    setPrediction(null);
    // Tell backend to switch mode
    fetch('http://127.0.0.1:8000/api/set-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: newMode })
    }).catch(() => {});
  };

  const inFlightRef = useRef<boolean>(false);

  // Unified prediction processor for both WebSocket and REST fallback
  const handlePredictionResult = useCallback((data: PredictionResponse) => {
    setPrediction(data);
    setIsConnected(true);

    // Calculate FPS
    frameCountRef.current += 1;
    const now = Date.now();
    if (now - lastFpsCalcRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsCalcRef.current = now;
    }

    // Handle Mode 1 (ASL Typist): Commit letter when triggered
    if (data.mode === 'asl' && data.trigger_type && data.typed_char) {
      setLastTypedChar(data.typed_char);
      setTimeout(() => setLastTypedChar(null), 1500);

      if (data.typed_char === 'BACKSPACE') {
        setSentence(prev => prev.slice(0, -1));
      } else {
        setSentence(prev => prev + data.typed_char);
      }
    }

    // Handle Mode 2 (ISL Words): Add to transcript and live sentence builder on stable event
    if (data.mode === 'isl' && data.status === 'RECOGNIZED' && data.stable && data.new_stable_event) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newEntry: TranscriptEntry = {
        id: `${Date.now()}_${Math.random()}`,
        timestamp: timeStr,
        speaker: 'VISITOR',
        sign: data.sign,
        text: data.display_name,
        hindi_name: data.hindi_name,
        confidence: data.confidence,
      };

      setTranscript(prev => [newEntry, ...prev.slice(0, 49)]);
      setIslWords(prev => [...prev, data.display_name]);

      // If active target sequence demo is running, advance step if recognized sign matches
      if (targetSentenceRef.current && targetStepIndexRef.current < targetSentenceRef.current.length) {
        const currentTarget = targetSentenceRef.current[targetStepIndexRef.current].trim().toLowerCase();
        const recognizedDisplay = (data.display_name || '').trim().toLowerCase();
        const recognizedSign = (data.sign || '').trim().toLowerCase();

        if (recognizedDisplay === currentTarget || recognizedSign === currentTarget) {
          const nextIdx = targetStepIndexRef.current + 1;
          targetStepIndexRef.current = nextIdx;
          setTargetStepIndex(nextIdx);

          if (nextIdx >= targetSentenceRef.current.length) {
            const completedPhrase = targetSentenceRef.current.join(' ');
            if (!isMuted) {
              setTimeout(() => {
                speechService.speak(`Demo sentence completed: ${completedPhrase}`);
              }, 700);
            }
          }
        }
      }

      if (!isMuted) {
        const toSpeak = data.hindi_name ? `${data.display_name}. ${data.hindi_name}` : data.display_name;
        speechService.speak(toSpeak);
      }
    }
  }, [isMuted]);

  const frameSeqRef = useRef<number>(0);
  const lastProcessedFrameIdRef = useRef<number>(0);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    try {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }
      const ws = new WebSocket('ws://127.0.0.1:8000/ws/predict');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        inFlightRef.current = false;
        console.log('Connected to VOXIS recognition engine');
      };

      ws.onmessage = (event) => {
        inFlightRef.current = false;
        try {
          const data: PredictionResponse = JSON.parse(event.data);
          // Latest-frame guarantee: drop stale or out-of-order responses
          if (data.frame_id && lastProcessedFrameIdRef.current && data.frame_id < lastProcessedFrameIdRef.current) {
            return;
          }
          if (data.frame_id) {
            lastProcessedFrameIdRef.current = data.frame_id;
          }
          handlePredictionResult(data);
        } catch (e) {
          console.error('Failed to parse WS response:', e);
        }
      };

      ws.onclose = () => {
        inFlightRef.current = false;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = () => {
        inFlightRef.current = false;
        ws.close();
      };
    } catch (e) {
      inFlightRef.current = false;
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
    }
  }, [handlePredictionResult]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  // Send captured frame to backend with in-flight latest-frame guard
  const handleFrameCapture = useCallback((base64Image: string) => {
    if (inFlightRef.current) return; // Drop frame: strict latest-frame policy to eliminate stale queues!
    inFlightRef.current = true;

    const targetMode = activeMode === 'multilingual' ? 'isl' : activeMode;
    const currentFrameId = ++frameSeqRef.current;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ image: base64Image, mode: targetMode, frame_id: currentFrameId }));
        // Safety timeout to unlock inFlightRef if frame response drops
        setTimeout(() => {
          inFlightRef.current = false;
        }, 250);
        return;
      } catch {
        inFlightRef.current = false;
      }
    }

    // Reliable REST call fallback
    fetch('http://127.0.0.1:8000/api/predict-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64Image, mode: targetMode }),
    })
      .then(res => res.json())
      .then((data: PredictionResponse) => {
        inFlightRef.current = false;
        handlePredictionResult(data);
      })
      .catch(() => {
        inFlightRef.current = false;
      });
  }, [activeMode, handlePredictionResult]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    speechService.setMuted(nextMuted);
  };

  const handleSpeak = (text: string) => {
    speechService.speak(text, true);
  };

  const handleStaffMessage = (text: string, visualHint?: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newEntry: TranscriptEntry = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: timeStr,
      speaker: 'STAFF',
      text,
      visualHint,
    };
    setTranscript(prev => [newEntry, ...prev.slice(0, 49)]);

    if (!isMuted) {
      speechService.speak(text);
    }
  };

  const handleSelectTargetSentence = (seq: string[]) => {
    if (activeMode !== 'isl') {
      handleSelectMode('isl');
    }
    setTargetSentence(seq);
    setTargetStepIndex(0);
    targetSentenceRef.current = seq;
    targetStepIndexRef.current = 0;
    setIslWords([]);
    setIsVocabOpen(false);
  };

  const handleSelectDemoVideo = (videoName: string) => {
    setDemoVideo(`/sample_videos/${videoName}`);
  };

  const handleExitDemo = () => {
    setDemoVideo(null);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Application Bar */}
      <Header
        activeMode={activeMode}
        onSelectMode={handleSelectMode}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenVocab={() => setIsVocabOpen(true)}
        onOpenDemo={() => setIsDemoOpen(true)}
        isDemoMode={demoVideo !== null}
        onExitDemo={handleExitDemo}
        isAIKeyActive={true}
        latencyMs={prediction?.latency_ms || 14}
        isConnected={isConnected}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Top Perceptual Split: Camera Viewport (Left) & Active Mode Perception Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Camera Viewport */}
          <div className={`${activeMode === 'multilingual' ? 'lg:col-span-5' : 'lg:col-span-7'} flex flex-col gap-3`}>
            <CameraFeed
              onFrameCapture={handleFrameCapture}
              onLocalPrediction={handlePredictionResult}
              landmarks={prediction?.landmarks}
              isConnected={isConnected}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
              demoVideoSrc={demoVideo}
              activeMode={activeMode}
              activeLetter={prediction?.letter}
              holdProgress={prediction?.hold_progress}
              activeSign={prediction?.sign}
              activeHindiName={prediction?.hindi_name}
              confidence={prediction?.confidence}
              fingerStates={prediction?.fingerStates}
            />

            {/* Quick Context Tip & Target Practice Banner */}
            <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              {targetPracticeSign ? (
                <div className="flex items-center gap-2 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Target Practice Sign: <strong className="text-white font-bold">{targetPracticeSign}</strong></span>
                  <button
                    onClick={() => setTargetPracticeSign(null)}
                    className="text-[10px] text-slate-400 hover:text-rose-400 underline ml-2"
                  >
                    Clear Target
                  </button>
                </div>
              ) : (
                <span>
                  {activeMode === 'asl'
                    ? '💡 Hold sign steady for ~0.2s to type letter into sentence box below'
                    : '💡 Hold any ISL sign steady (~0.2s) to commit word into live sentence'}
                </span>
              )}
              <button
                onClick={() => setIsVocabOpen(true)}
                className="text-indigo-400 hover:text-indigo-300 font-medium underline ml-2 whitespace-nowrap"
              >
                ISL Gesture Guide
              </button>
            </div>

            {/* Target Sentence Sequence Runner */}
            {targetSentence && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-indigo-950/80 border border-indigo-500/40 shadow-xl space-y-2.5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Target Sentence (Demo combination using supported signs)
                    </span>
                  </div>
                  <button
                    onClick={() => { setTargetSentence(null); setTargetStepIndex(0); }}
                    className="text-xs text-slate-400 hover:text-rose-400 font-medium px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 transition-colors"
                  >
                    Exit Target Mode ✕
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {targetSentence.map((word, idx) => {
                    const isDone = idx < targetStepIndex;
                    const isCurrent = idx === targetStepIndex;
                    return (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-slate-500 text-xs font-bold">→</span>}
                        <div
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                              : isCurrent
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 border border-indigo-400 ring-2 ring-indigo-400/30 animate-pulse'
                              : 'bg-slate-800/70 text-slate-400 border border-slate-700/50'
                          }`}
                        >
                          {isDone ? '✓ ' : isCurrent ? '▶ ' : `${idx + 1}. `}
                          <span>{word}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-slate-300">
                    {targetStepIndex >= targetSentence.length ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        🎉 Recognized in sequence: "{targetSentence.join(' ')}"
                      </span>
                    ) : (
                      <span>
                        Next gesture to perform: <strong className="text-amber-300 font-bold uppercase">{targetSentence[targetStepIndex]}</strong>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setTargetStepIndex(0);
                      targetStepIndexRef.current = 0;
                      setIslWords([]);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
                  >
                    Restart Sequence
                  </button>
                </div>
              </div>
            )}

            {/* In Multilingual AI mode, display Live Recognition Card below Camera so Left & Right columns align in height */}
            {activeMode === 'multilingual' && (
              <RecognitionCard
                prediction={prediction}
                onSpeak={handleSpeak}
                fps={fps}
              />
            )}
          </div>

          {/* Right Column: Mode-Specific Workspace */}
          <div className={`${activeMode === 'multilingual' ? 'lg:col-span-7' : 'lg:col-span-5'} flex flex-col gap-6`}>
            {activeMode === 'multilingual' ? (
              <MultilingualStudio
                currentDetectedSign={prediction?.display_name || prediction?.sign}
                isStableEvent={Boolean(prediction?.status === 'RECOGNIZED' && prediction?.stable && prediction?.new_stable_event)}
              />
            ) : activeMode === 'asl' ? (
              <>
                {/* Sentence Typist & Studio */}
                <SentenceBuilder
                  activeMode="asl"
                  sentence={sentence}
                  onUpdateSentence={setSentence}
                  activeLetter={prediction?.letter}
                  holdProgress={prediction?.hold_progress}
                  lastTypedChar={lastTypedChar}
                />

                {/* ASL Virtual Keyboard Guide */}
                <ASLKeyboardGuide
                  activeLetter={prediction?.letter}
                  onSelectLetter={(char) => {
                    if (char === 'SPACE') setSentence(prev => prev + ' ');
                    else if (char === 'DEL') setSentence(prev => prev.slice(0, -1));
                    else setSentence(prev => prev + char);
                  }}
                />
              </>
            ) : (
              <>
                {/* 61-Class ISL Recognition Spotlight Card */}
                <RecognitionCard
                  prediction={prediction}
                  onSpeak={handleSpeak}
                  fps={fps}
                />

                {/* ISL Live Gesture Sentence Studio & Demo Builder */}
                <SentenceBuilder
                  activeMode="isl"
                  sentence={sentence}
                  onUpdateSentence={setSentence}
                  islWords={islWords}
                  onUpdateIslWords={setIslWords}
                  currentSign={prediction?.sign}
                  currentHindiName={prediction?.hindi_name}
                  confidence={prediction?.confidence}
                  isStable={prediction?.stable}
                  onSelectPracticeSign={(sign) => setTargetPracticeSign(sign)}
                />

                {/* Staff Two-Way Response Panel */}
                <StaffTwoWayPanel onSendMessage={handleStaffMessage} />
              </>
            )}
          </div>
        </div>

        {/* Bottom Section: Conversation History Timeline (only in ISL mode, or shared history) */}
        {activeMode === 'isl' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12">
              <TranscriptTimeline
                entries={transcript}
                onClear={() => setTranscript([])}
                onSpeak={handleSpeak}
              />
            </div>
          </div>
        )}
      </main>

      {/* Dictionary & Benchmark Modals */}
      <VocabularyModal
        isOpen={isVocabOpen}
        onClose={() => setIsVocabOpen(false)}
        classes={vocabulary}
        activeMode={activeMode}
        onSelectPracticeSign={(sign) => setTargetPracticeSign(sign)}
        onSelectTargetSentence={handleSelectTargetSentence}
      />

      <DemoModeModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onSelectVideo={handleSelectDemoVideo}
      />
    </div>
  );
};

export default App;
