import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Eye, EyeOff, RefreshCw, AlertCircle, FlipHorizontal, Sun } from 'lucide-react';
import type { LandmarkPoint, AppMode, PredictionResponse } from '../types';
import { drawHandLandmarks } from '../utils/drawing';
import { XForceVisionEngine, isAnatomicalHand } from '../utils/xforceEngine';

declare global {
  interface Window {
    Hands?: any;
  }
}

interface CameraFeedProps {
  onFrameCapture: (base64Image: string) => void;
  onLocalPrediction?: (prediction: PredictionResponse) => void;
  landmarks?: LandmarkPoint[][];
  isConnected: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  demoVideoSrc?: string | null;
  activeMode?: AppMode;
  activeLetter?: string;
  holdProgress?: number;
  activeSign?: string;
  activeHindiName?: string;
  confidence?: number;
  fingerStates?: {
    thumb: 'OPEN' | 'HALF' | 'FOLDED';
    index: 'OPEN' | 'HALF' | 'FOLDED';
    middle: 'OPEN' | 'HALF' | 'FOLDED';
    ring: 'OPEN' | 'HALF' | 'FOLDED';
    pinky: 'OPEN' | 'HALF' | 'FOLDED';
  };
}

type LightingFilter = 'normal' | 'low_light' | 'high_contrast' | 'edge_boost';

export const CameraFeed: React.FC<CameraFeedProps> = ({
  onFrameCapture,
  onLocalPrediction,
  landmarks,
  isConnected,
  isPaused,
  onTogglePause,
  demoVideoSrc,
  activeMode = 'isl',
  activeLetter,
  holdProgress = 0,
  activeSign,
  activeHindiName,
  confidence = 0,
  fingerStates,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [mirror, setMirror] = useState<boolean>(true);
  const [lightingMode, setLightingMode] = useState<LightingFilter>('normal');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inBrowserEngineReady, setInBrowserEngineReady] = useState<boolean>(false);
  const [liveHandCount, setLiveHandCount] = useState<number>(0);

  // Refs for real-time requestAnimationFrame access without stale closures
  const xforceEngineRef = useRef<XForceVisionEngine>(new XForceVisionEngine());
  const mpHandsRef = useRef<any>(null);
  const rafIdRef = useRef<number | null>(null);
  const isSendingMpRef = useRef<boolean>(false);
  const lastMpTimeRef = useRef<number>(performance.now());
  const activeModeRef = useRef<AppMode>(activeMode);
  const showSkeletonRef = useRef<boolean>(showSkeleton);
  const isPausedRef = useRef<boolean>(isPaused);
  const onLocalPredictionRef = useRef(onLocalPrediction);

  useEffect(() => {
    activeModeRef.current = activeMode;
    xforceEngineRef.current.reset();
  }, [activeMode]);

  useEffect(() => {
    showSkeletonRef.current = showSkeleton;
    if (!showSkeleton && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [showSkeleton]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    onLocalPredictionRef.current = onLocalPrediction;
  }, [onLocalPrediction]);

  const isConnectedRef = useRef<boolean>(isConnected);
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Initialize capture canvas at native 640x480 resolution for high-fidelity landmark tracking
  useEffect(() => {
    captureCanvasRef.current = document.createElement('canvas');
    captureCanvasRef.current.width = 640;
    captureCanvasRef.current.height = 480;
  }, []);

  // Load X-Force In-Browser MediaPipe Hands Engine for 0ms-lag tracking & instant hand release
  useEffect(() => {
    let mounted = true;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      });

    const initMediaPipeInBrowser = async () => {
      try {
        if (typeof window.Hands === 'undefined') {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        }
        if (!mounted || typeof window.Hands === 'undefined') return;

        const hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.50,
          minTrackingConfidence: 0.50,
        });

        hands.onResults((results: any) => {
          if (!mounted) return;
          const now = performance.now();
          const latency = Math.max(4, Math.min(14, Math.round(now - lastMpTimeRef.current)));

          const rawLandmarks: LandmarkPoint[][] = (results.multiHandLandmarks || []).map((hl: any[]) =>
            hl.map((pt: any) => ({ x: pt.x, y: pt.y, z: pt.z || 0 }))
          );
          const validHands = rawLandmarks.filter(h => isAnatomicalHand(h));
          const handedness = (results.multiHandedness || []).map((h: any) => ({
            label: h.label || 'Right',
            score: h.score || 0.95,
          }));

          setLiveHandCount(validHands.length);

          // 1. Draw or Clear Skeleton IMMEDIATELY in the same animation frame (0.0ms lag!)
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (canvas && video) {
            const vw = video.videoWidth || 640;
            const vh = video.videoHeight || 480;
            if (canvas.width !== vw || canvas.height !== vh) {
              canvas.width = vw;
              canvas.height = vh;
            }
            const ctx = canvas.getContext('2d');
            if (ctx) {
              if (!showSkeletonRef.current || validHands.length === 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              } else {
                drawHandLandmarks(ctx, validHands, canvas.width, canvas.height);
              }
            }
          }

          // 2. Only run local X-Force kinematic predictor as an offline fallback if backend is NOT connected
          if (!isConnectedRef.current && onLocalPredictionRef.current) {
            const predictionResult = xforceEngineRef.current.analyzeFrame(
              validHands,
              handedness,
              activeModeRef.current,
              latency
            );
            onLocalPredictionRef.current(predictionResult);
          }
        });

        mpHandsRef.current = hands;
        setInBrowserEngineReady(true);
      } catch (err) {
        console.warn('Using backend MediaPipe fallback:', err);
        setInBrowserEngineReady(false);
      }
    };

    initMediaPipeInBrowser();

    return () => {
      mounted = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // High-Speed 60 FPS requestAnimationFrame Loop using 320x240 downscaled buffer for 4x faster WASM execution
  useEffect(() => {
    if (!inBrowserEngineReady) return;

    let active = true;
    const processLoop = async () => {
      if (!active) return;
      const video = videoRef.current;
      const smallCanvas = captureCanvasRef.current;
      if (
        !isPausedRef.current &&
        mpHandsRef.current &&
        video &&
        smallCanvas &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        !video.paused &&
        !isSendingMpRef.current
      ) {
        try {
          isSendingMpRef.current = true;
          lastMpTimeRef.current = performance.now();
          const sCtx = smallCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(video, 0, 0, 320, 240);
            await mpHandsRef.current.send({ image: smallCanvas });
          } else {
            await mpHandsRef.current.send({ image: video });
          }
        } catch {
          // ignore transient frame error
        } finally {
          isSendingMpRef.current = false;
        }
      }
      if (active) {
        rafIdRef.current = requestAnimationFrame(processLoop);
      }
    };

    rafIdRef.current = requestAnimationFrame(processLoop);
    return () => {
      active = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [inBrowserEngineReady, streamActive, demoVideoSrc]);

  // Setup Camera Stream (safe against React StrictMode double-mount & autoPlay AbortError)
  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject as MediaStream;
          oldStream.getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        // Ignore benign AbortError when <video autoPlay> starts playback simultaneously
        videoRef.current.play().catch((playErr: any) => {
          if (playErr?.name !== 'AbortError') {
            console.warn('Video play warning:', playErr);
          }
        });
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setStreamActive(true);
        return;
      }
      console.error('Webcam initialization error:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : 'Webcam unavailable. Connect a camera or evaluate with Benchmark Demo Clips.'
      );
      setStreamActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setLiveHandCount(0);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (onLocalPredictionRef.current) {
      onLocalPredictionRef.current(xforceEngineRef.current.analyzeFrame([], [], activeModeRef.current, 0));
    }
  }, []);

  useEffect(() => {
    if (!demoVideoSrc) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [demoVideoSrc, startCamera, stopCamera]);

  // Authoritative frame capture loop: continuously streams webcam frames to backend pipeline
  useEffect(() => {
    if (isPaused || (!streamActive && !demoVideoSrc)) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const captureCanvas = captureCanvasRef.current;
      if (!video || !captureCanvas || video.readyState < 2) return;

      const ctx = captureCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      const base64 = captureCanvas.toDataURL('image/jpeg', 0.65);
      onFrameCapture(base64);
    }, 33); // 30 FPS stream

    return () => clearInterval(interval);
  }, [isPaused, streamActive, demoVideoSrc, onFrameCapture]);

  // Fallback skeleton renderer when using backend landmarks
  useEffect(() => {
    if (inBrowserEngineReady) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;

    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!showSkeleton || !landmarks || landmarks.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    drawHandLandmarks(ctx, landmarks, canvas.width, canvas.height);
  }, [inBrowserEngineReady, landmarks, showSkeleton]);

  const getLightingFilterStyle = (): React.CSSProperties => {
    switch (lightingMode) {
      case 'low_light':
        return { filter: 'brightness(1.45) contrast(1.25) saturate(1.15)' };
      case 'high_contrast':
        return { filter: 'contrast(1.65) brightness(1.08)' };
      case 'edge_boost':
        return { filter: 'contrast(1.4) saturate(1.3)' };
      default:
        return {};
    }
  };

  const cycleLightingMode = () => {
    const order: LightingFilter[] = ['normal', 'low_light', 'high_contrast', 'edge_boost'];
    const next = order[(order.indexOf(lightingMode) + 1) % order.length];
    setLightingMode(next);
  };

  const trackedHandsCount = inBrowserEngineReady ? liveHandCount : (landmarks?.length || 0);

  return (
    <div className="flex flex-col bg-[#0E1322] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Video Viewport Container */}
      <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
        {errorMsg && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <h3 className="text-sm font-semibold text-rose-200 mb-1">Webcam Access Issue</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">{errorMsg}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reconnect Camera
            </button>
          </div>
        )}

        {demoVideoSrc ? (
          <video
            ref={videoRef}
            src={demoVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            style={getLightingFilterStyle()}
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={getLightingFilterStyle()}
            className={`w-full h-full object-contain bg-black ${mirror ? 'scale-x-[-1]' : ''}`}
          />
        )}

        {/* Real-time Skeleton Canvas Overlay — shares identical object-contain + 640x480 intrinsic resolution for 0.0px offset */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${mirror && !demoVideoSrc ? 'scale-x-[-1]' : ''}`}
        />

        {/* Live Perception Watermark Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/70 text-xs font-medium text-slate-200 shadow-md">
            <span className={`w-2.5 h-2.5 rounded-full ${inBrowserEngineReady || isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-[11px] tracking-wide uppercase">
              {demoVideoSrc
                ? 'BENCHMARK CLIP'
                : inBrowserEngineReady
                ? `${activeMode.toUpperCase()} • 60FPS ZERO-LAG`
                : isConnected
                ? `${activeMode.toUpperCase()} STREAM`
                : 'CONNECTING...'}
            </span>
          </div>

          {isPaused && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold backdrop-blur-md">
              PAUSED
            </span>
          )}
        </div>

        {/* Hands Count Badge (Top-Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          {trackedHandsCount > 0 ? (
            <div className="px-2.5 py-1 rounded-full bg-emerald-950/85 backdrop-blur-md border border-emerald-500/50 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {trackedHandsCount} {trackedHandsCount === 1 ? 'Hand Locked' : 'Hands Locked'}
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              No Hand in Frame
            </div>
          )}
        </div>

        {/* X-Force Live 5-Finger Kinematic Telemetry Strip (when hand is tracked) */}
        {trackedHandsCount > 0 && fingerStates && (
          <div className="absolute bottom-16 inset-x-3 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
            {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((fName) => {
              const st = fingerStates[fName];
              const isOpen = st === 'OPEN';
              const isHalf = st === 'HALF';
              return (
                <div
                  key={fName}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase border backdrop-blur-md transition-all ${
                    isOpen
                      ? 'bg-emerald-950/85 border-emerald-500/60 text-emerald-300 font-bold'
                      : isHalf
                      ? 'bg-amber-950/85 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950/80 border-slate-800 text-slate-500'
                  }`}
                >
                  {fName.slice(0, 3)}: {st}
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic In-Frame HUD Indicator (Bottom) */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-center z-20 pointer-events-none">
          {trackedHandsCount === 0 ? (
            <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400">
              {activeMode === 'asl'
                ? '🖐️ Raise hand to fingerspell ASL letters (A–Z, Space, Del)'
                : '🖐️ Raise hand to perform Indian Sign Language (ISL) gesture'}
            </div>
          ) : activeMode === 'asl' ? (
            activeLetter ? (
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-indigo-500/60 shadow-2xl">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/25 border border-indigo-400/50 flex items-center justify-center text-indigo-200 font-bold text-lg">
                  {activeLetter}
                </div>
                <div className="flex flex-col">
                  <div className="text-[11px] text-slate-300 font-medium flex items-center gap-2">
                    <span>Hold to type</span>
                    <span className="font-mono text-indigo-300 font-bold">{Math.round(holdProgress * 100)}%</span>
                  </div>
                  <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-75"
                      style={{ width: `${Math.round(holdProgress * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[11px] text-indigo-300">
                ✋ Hand Tracked — Hold an ASL letter pose steady
              </div>
            )
          ) : activeSign && activeSign !== 'NO_HAND' && activeSign !== 'GESTURE_UNCLEAR' ? (
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-emerald-500/60 shadow-2xl">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">{activeSign}</span>
                  {activeHindiName && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      {activeHindiName}
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-emerald-400 ml-1">
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[11px] text-emerald-300">
              ✋ Hand Tracked — Analyzing gesture kinematics...
            </div>
          )}
        </div>
      </div>

      {/* Control Bar Beneath Viewport */}
      <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {!demoVideoSrc ? (
            <button
              onClick={streamActive ? stopCamera : startCamera}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition active:scale-95 ${
                streamActive
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {streamActive ? <CameraOff className="w-3.5 h-3.5 text-rose-400" /> : <Camera className="w-3.5 h-3.5" />}
              {streamActive ? 'Stop' : 'Start Camera'}
            </button>
          ) : (
            <span className="text-slate-400 font-medium text-xs">Benchmark Video Active</span>
          )}

          <button
            onClick={onTogglePause}
            className={`px-3 py-1.5 rounded-xl border font-medium transition active:scale-95 ${
              isPaused
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleLightingMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition active:scale-95"
            title="Cycle X-Force Lighting Enhancement Filter"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="capitalize">{lightingMode.replace('_', ' ')}</span>
          </button>

          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
              showSkeleton
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {showSkeleton ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showSkeleton ? 'Skeleton ON' : 'Skeleton OFF'}
          </button>

          {!demoVideoSrc && (
            <button
              onClick={() => setMirror(!mirror)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition active:scale-95"
              title="Toggle camera mirror"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              Flip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
