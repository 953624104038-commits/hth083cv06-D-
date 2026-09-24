import { useCallback, useEffect, useRef, useState } from 'react';
import { islSigns } from '../data/islSigns';
import { API_BASE, WS_PREDICT_URL } from '../utils/backend';
import { speechService } from '../utils/speech';
import type { AppMode, CameraStatus, PredictionResponse, SignClass, TranscriptEntry } from '../types/voxis';

/**
 * Recognition pipeline — same WebSocket/REST contract, sentence logic and target-sentence
 * tracking as the original VOXIS App.tsx. Only the surrounding UI changed.
 */
export function useRecognitionEngine() {
  const [mode, setMode] = useState<AppMode>('isl');
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fps, setFps] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [islWords, setIslWords] = useState<string[]>([]);
  const [aslSentence, setAslSentence] = useState('');
  const [lastTypedChar, setLastTypedChar] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [practiceSign, setPracticeSign] = useState<string | null>(null);
  const [targetSentence, setTargetSentence] = useState<string[] | null>(null);
  const [targetStepIndex, setTargetStepIndex] = useState(0);
  const [vocabulary, setVocabulary] = useState<SignClass[]>(islSigns);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraWanted, setCameraWanted] = useState(false);

  const targetSentenceRef = useRef<string[] | null>(null);
  const targetStepIndexRef = useRef(0);
  const mutedRef = useRef(false);
  const modeRef = useRef<AppMode>('isl');
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(Date.now());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const frameSeqRef = useRef(0);
  const lastProcessedFrameIdRef = useRef(0);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ISL lexicon for the Gesture Guide (falls back to bundled vocabulary_isl.json copy).
  useEffect(() => {
    fetch(`${API_BASE}/classes?mode=isl`).
    then((res) => res.json()).
    then((data: {classes?: SignClass[];}) => {
      if (data.classes && data.classes.length) setVocabulary(data.classes);
    }).
    catch(() => undefined);
  }, []);

  const selectMode = useCallback((newMode: AppMode) => {
    setMode(newMode);
    setPrediction(null);
    fetch(`${API_BASE}/api/set-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: newMode })
    }).catch(() => undefined);
  }, []);

  const handlePredictionResult = useCallback((data: PredictionResponse) => {
    setPrediction(data);
    setIsConnected(true);

    frameCountRef.current += 1;
    const now = Date.now();
    if (now - lastFpsCalcRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsCalcRef.current = now;
    }

    // ASL typist: commit letter when triggered
    if (data.mode === 'asl' && data.trigger_type && data.typed_char) {
      const typed = data.typed_char;
      setLastTypedChar(typed);
      setTimeout(() => setLastTypedChar(null), 1500);
      if (typed === 'BACKSPACE') setAslSentence((prev) => prev.slice(0, -1));else
      setAslSentence((prev) => prev + typed);
    }

    // ISL words: add to transcript and live sentence on stable event
    if (data.mode === 'isl' && data.status === 'RECOGNIZED' && data.stable && data.new_stable_event) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const entry: TranscriptEntry = {
        id: `${Date.now()}_${Math.random()}`,
        timestamp: timeStr,
        speaker: 'VISITOR',
        sign: data.sign,
        text: data.display_name,
        hindi_name: data.hindi_name,
        confidence: data.confidence
      };
      setTranscript((prev) => [entry, ...prev.slice(0, 49)]);
      setIslWords((prev) => [...prev, data.display_name]);

      const target = targetSentenceRef.current;
      if (target && targetStepIndexRef.current < target.length) {
        const currentTarget = target[targetStepIndexRef.current].trim().toLowerCase();
        const recognizedDisplay = (data.display_name || '').trim().toLowerCase();
        const recognizedSign = (data.sign || '').trim().toLowerCase();
        if (recognizedDisplay === currentTarget || recognizedSign === currentTarget) {
          const nextIdx = targetStepIndexRef.current + 1;
          targetStepIndexRef.current = nextIdx;
          setTargetStepIndex(nextIdx);
          if (nextIdx >= target.length && !mutedRef.current) {
            const completedPhrase = target.join(' ');
            setTimeout(() => speechService.speak(`Demo sentence completed: ${completedPhrase}`), 700);
          }
        }
      }

      if (!mutedRef.current) {
        speechService.speak(data.hindi_name ? `${data.display_name}. ${data.hindi_name}` : data.display_name);
      }
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    try {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }
      const ws = new WebSocket(WS_PREDICT_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        inFlightRef.current = false;
      };
      ws.onmessage = (event: MessageEvent<string>) => {
        inFlightRef.current = false;
        try {
          const data: PredictionResponse = JSON.parse(event.data);
          if (data.frame_id && lastProcessedFrameIdRef.current && data.frame_id < lastProcessedFrameIdRef.current) return;
          if (data.frame_id) lastProcessedFrameIdRef.current = data.frame_id;
          handlePredictionResult(data);
        } catch (e) {
          console.error('Failed to parse WS response:', e);
        }
      };
      ws.onclose = () => {
        inFlightRef.current = false;
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
      };
      ws.onerror = () => {
        inFlightRef.current = false;
        ws.close();
      };
    } catch {
      inFlightRef.current = false;
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
    }
  }, [handlePredictionResult]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Send a captured frame with the in-flight latest-frame guard (WS first, REST fallback).
  const sendFrame = useCallback(
    (base64Image: string) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      const targetMode = modeRef.current;
      const currentFrameId = ++frameSeqRef.current;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ image: base64Image, mode: targetMode, frame_id: currentFrameId }));
          setTimeout(() => {
            inFlightRef.current = false;
          }, 250);
          return;
        } catch {
          inFlightRef.current = false;
        }
      }

      fetch(`${API_BASE}/api/predict-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64Image, mode: targetMode })
      }).
      then((res) => res.json()).
      then((data: PredictionResponse) => {
        inFlightRef.current = false;
        handlePredictionResult(data);
      }).
      catch(() => {
        inFlightRef.current = false;
      });
    },
    [handlePredictionResult]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      speechService.setMuted(next);
      return next;
    });
  }, []);

  const speak = useCallback((text: string) => speechService.speak(text, true), []);

  const startTargetSentence = useCallback(
    (seq: string[]) => {
      if (modeRef.current !== 'isl') selectMode('isl');
      setTargetSentence(seq);
      setTargetStepIndex(0);
      targetSentenceRef.current = seq;
      targetStepIndexRef.current = 0;
      setIslWords([]);
    },
    [selectMode]
  );

  const clearTargetSentence = useCallback(() => {
    setTargetSentence(null);
    setTargetStepIndex(0);
    targetSentenceRef.current = null;
    targetStepIndexRef.current = 0;
  }, []);

  const undoWord = useCallback(() => setIslWords((prev) => prev.slice(0, -1)), []);
  const clearWords = useCallback(() => setIslWords([]), []);
  const appendWord = useCallback((word: string) => setIslWords((prev) => [...prev, word]), []);
  const aslSpace = useCallback(() => setAslSentence((prev) => prev + ' '), []);
  const aslDelete = useCallback(() => setAslSentence((prev) => prev.slice(0, -1)), []);
  const aslClear = useCallback(() => setAslSentence(''), []);
  const clearTranscript = useCallback(() => setTranscript([]), []);

  const exportTranscript = useCallback(() => {
    const lines = [...transcript].
    reverse().
    map((e) => {
      const conf = typeof e.confidence === 'number' ? ` — ${Math.round(e.confidence <= 1 ? e.confidence * 100 : e.confidence)}%` : '';
      return `[${e.timestamp}] ${e.speaker}: ${e.text}${e.hindi_name ? ` (${e.hindi_name})` : ''}${conf}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ISL_Counter_Transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcript]);

  return {
    mode,
    selectMode,
    prediction,
    isConnected,
    fps,
    transcript,
    clearTranscript,
    exportTranscript,
    islWords,
    undoWord,
    clearWords,
    appendWord,
    aslSentence,
    lastTypedChar,
    aslSpace,
    aslDelete,
    aslClear,
    isMuted,
    toggleMute,
    speak,
    practiceSign,
    setPracticeSign,
    targetSentence,
    targetStepIndex,
    startTargetSentence,
    clearTargetSentence,
    vocabulary,
    sendFrame,
    cameraStatus,
    setCameraStatus,
    cameraWanted,
    setCameraWanted
  };
}

export type RecognitionEngine = ReturnType<typeof useRecognitionEngine>;