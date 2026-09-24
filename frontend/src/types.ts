export type AppMode = 'isl' | 'multilingual' | 'asl';

export type RecognitionStatus = 'RECOGNIZED' | 'GESTURE_UNCLEAR' | 'NO_HAND' | 'MODEL_UNAVAILABLE' | 'CONNECTING';

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface PredictionResponse {
  mode?: AppMode;
  status: RecognitionStatus;
  sign: string;
  display_name: string;
  hindi_name?: string;
  category?: string;
  confidence: number;
  hand_detected: boolean;
  stable: boolean;
  new_stable_event?: boolean;
  latency_ms: number;
  hands_count?: number;
  landmarks?: LandmarkPoint[][];
  
  mp_latency_ms?: number;
  rf_latency_ms?: number;
  frame_id?: number;
  
  // ASL Typist specific fields
  letter?: string;
  hold_progress?: number; // 0.0 to 1.0
  trigger_type?: boolean; // True on the frame the character was committed
  typed_char?: string | null; // e.g. "A", " ", or "BACKSPACE"

  // X-Force Kinematic Telemetry
  fingerStates?: {
    thumb: 'OPEN' | 'HALF' | 'FOLDED';
    index: 'OPEN' | 'HALF' | 'FOLDED';
    middle: 'OPEN' | 'HALF' | 'FOLDED';
    ring: 'OPEN' | 'HALF' | 'FOLDED';
    pinky: 'OPEN' | 'HALF' | 'FOLDED';
  };
  topMatches?: {
    id: string;
    name: string;
    letter?: string | null;
    confidence: number;
    reason: string;
  }[];
}

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  speaker: 'VISITOR' | 'STAFF' | 'TYPIST';
  sign?: string;
  text: string;
  hindi_name?: string;
  confidence?: number;
  visualHint?: string;
}

export interface SignClass {
  id: number;
  label: string;
  display_name: string;
  hindi_name?: string;
  category: string;
  scenario?: string;
  how_to_perform?: string;
  source?: string;
  hands?: 1 | 2;
  motion?: 'static' | 'dynamic';
  type?: 'letter' | 'action' | 'neutral';
}

export interface ModelInfo {
  status: string;
  model_architecture: string;
  language: string;
  num_classes: number;
  classes: string[];
  test_accuracy?: number;
  test_balanced_accuracy?: number;
  test_macro_f1?: number;
  inference_latency_ms?: number;
}
