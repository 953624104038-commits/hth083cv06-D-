export type AppMode = 'isl' | 'asl';

export type RecognitionStatus =
'RECOGNIZED' |
'GESTURE_UNCLEAR' |
'NO_HAND' |
'MODEL_UNAVAILABLE' |
'CONNECTING';

export interface PredictionResponse {
  mode?: AppMode | 'multilingual';
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
  landmarks?: unknown;
  mp_latency_ms?: number;
  rf_latency_ms?: number;
  frame_id?: number;
  letter?: string;
  hold_progress?: number;
  trigger_type?: boolean;
  typed_char?: string;
}

export interface SignClass {
  id: number;
  label: string;
  display_name: string;
  hindi_name: string;
  category: string;
  how_to_perform: string;
  scenario: string;
  source?: string;
}

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  speaker: 'VISITOR' | 'STAFF' | 'TYPIST';
  sign?: string;
  text: string;
  hindi_name?: string;
  confidence?: number;
}

export interface SignMetadata {
  hands: 1 | 2;
  motion: 'static' | 'dynamic';
  group: string;
}

export interface QuickLearnSign {
  id: string;
  name: string;
  hindiName: string;
  description: string;
  hands: string;
  motion: string;
}

export interface DemoCombination {
  id: string;
  title: string;
  signs: string[];
  description: string;
  category: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  signs: string[];
}

export interface CuratedSign {
  sign: string;
  hindi: string;
  hands: 1 | 2;
  cat: string;
}

export type CameraStatus = 'idle' | 'starting' | 'live' | 'paused' | 'denied' | 'unavailable';

export type View = 'translator' | 'guide' | 'builder' | 'history' | 'multilingual';