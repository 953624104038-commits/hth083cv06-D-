/**
 * X-Force High-Speed In-Browser Vision, Kinematic Feature Extractor & Gesture Classifier Engine
 * Optimized for ultra-fast (<6ms) recognition, relaxed natural human finger posture matching,
 * instant Frame-1 visual feedback, and 0ms release clearing when the hand leaves the camera view.
 */

import type { LandmarkPoint, PredictionResponse, AppMode } from '../types';

export const LANDMARK = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20
} as const;

export type FingerState = 'OPEN' | 'HALF' | 'FOLDED';

export interface FingerStatesMap {
  thumb: FingerState;
  index: FingerState;
  middle: FingerState;
  ring: FingerState;
  pinky: FingerState;
}

export interface TopCandidateMatch {
  id: string;
  name: string;
  letter?: string | null;
  confidence: number;
  reason: string;
}

export function distance(p1: LandmarkPoint, p2: LandmarkPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function distance2D(p1: LandmarkPoint, p2: LandmarkPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetweenPoints(pA: LandmarkPoint, pB: LandmarkPoint, pC: LandmarkPoint): number {
  const v1 = { x: pA.x - pB.x, y: pA.y - pB.y, z: (pA.z || 0) - (pB.z || 0) };
  const v2 = { x: pC.x - pB.x, y: pC.y - pB.y, z: (pC.z || 0) - (pB.z || 0) };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 === 0 || mag2 === 0) return 0;
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cosTheta) * (180 / Math.PI);
}

export function normalizeLandmarks(landmarks: LandmarkPoint[]): LandmarkPoint[] {
  if (!landmarks || landmarks.length < 21) return [];
  const wrist = landmarks[0];
  const middleMcp = landmarks[LANDMARK.MIDDLE_MCP];
  const palmScale = distance(wrist, middleMcp) || 1.0;

  return landmarks.map(lm => ({
    x: (lm.x - wrist.x) / palmScale,
    y: (lm.y - wrist.y) / palmScale,
    z: ((lm.z || 0) - (wrist.z || 0)) / palmScale
  }));
}

export function alignHandOrientation(normalizedLandmarks: LandmarkPoint[]): LandmarkPoint[] {
  if (!normalizedLandmarks || normalizedLandmarks.length < 21) return normalizedLandmarks;
  const middleMcp = normalizedLandmarks[LANDMARK.MIDDLE_MCP];
  const angleY = Math.atan2(middleMcp.x, -middleMcp.y);
  const cosZ = Math.cos(-angleY);
  const sinZ = Math.sin(-angleY);

  return normalizedLandmarks.map(lm => ({
    x: lm.x * cosZ - lm.y * sinZ,
    y: lm.x * sinZ + lm.y * cosZ,
    z: lm.z
  }));
}

/**
 * Fast anatomical hand check: rejects tiny noise blobs or huge screen artifacts
 * while allowing all valid hand orientations (including fists, side-views, and foreshortened poses).
 */
export function isAnatomicalHand(pts: LandmarkPoint[]): boolean {
  if (!pts || pts.length < 21) return false;

  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  const bboxW = Math.max(...xs) - Math.min(...xs);
  const bboxH = Math.max(...ys) - Math.min(...ys);

  if (bboxW < 0.045 || bboxH < 0.045 || bboxW > 0.88 || bboxH > 0.90) return false;

  const palmLen = distance2D(pts[0], pts[9]);
  if (palmLen < 0.038) return false;

  const knuckleSpan = distance2D(pts[5], pts[17]);
  if (knuckleSpan < 0.020) return false;

  return true;
}

const HINDI_MAP: Record<string, string> = {
  'Hello': 'नमस्ते',
  'Namaste': 'नमस्ते',
  'Help': 'मदद / सहायता',
  'Doctor': 'डॉक्टर / चिकित्सक',
  'Fever': 'बुखार',
  'Injury': 'चोट / घाव',
  'Medicine': 'दवाई',
  'Hospital': 'अस्पताल',
  'Water': 'पानी',
  'Drink': 'पीना',
  'Food': 'भोजन / खाना',
  'Need': 'चाहिए / आवश्यकता',
  'Please': 'कृपया',
  'Thank you': 'धन्यवाद',
  'Good morning': 'सुप्रभात',
  'Good afternoon': 'नमस्कार',
  'Good': 'अच्छा / ठीक है',
  'Bad': 'खराब / गलत',
  'Yes': 'हाँ',
  'No': 'नहीं',
  'Stop': 'रुकिए',
  'I': 'मैं',
  'Where': 'कहाँ',
  'Toilet': 'शौचालय',
  'Emergency': 'आपातकाल',
  'Cry': 'दर्द / रोना',
  'Fedup': 'परेशान / थका हुआ',
  'Money': 'पैसे / खाता',
  'ID Card': 'पहचान पत्र',
  'Phone': 'फ़ोन कॉल',
  'Sorry': 'क्षमा करें',
  'Come': 'आइए',
  'Give': 'दीजिए'
};

export class XForceVisionEngine {
  private motionHistory: { leftHand: any[]; rightHand: any[] } = { leftHand: [], rightHand: [] };
  private maxHistoryLength = 18;

  // Ultra-fast 3-frame hysteresis buffer (2 agreeing frames = stable lock in ~60ms!)
  private historyBuffer: { signId: string | null; confidence: number; time: number }[] = [];
  private bufferSize = 3;

  // Fast ASL Hold-to-Type Stabilizer (5 frames ~ 165ms hold! Instant switch between different letters)
  private currentAslCandidate: string | null = null;
  private aslCandidateCount = 0;
  private aslHoldThreshold = 5;
  private aslHasTriggered = false;
  private lastAslCommitTime = 0;
  private lastCommittedAslLetter: string | null = null;

  // ISL Word Commit Tracker
  private lastStableIslSign: string | null = null;
  private lastIslCommitTime = 0;

  public reset() {
    this.motionHistory.leftHand = [];
    this.motionHistory.rightHand = [];
    this.historyBuffer = [];
    this.currentAslCandidate = null;
    this.aslCandidateCount = 0;
    this.aslHasTriggered = false;
    this.lastStableIslSign = null;
  }

  public analyzeFrame(
    rawHands: LandmarkPoint[][],
    handedness: { label: string; score: number }[],
    mode: AppMode,
    latencyMs: number
  ): PredictionResponse & { fingerStates?: FingerStatesMap; topMatches?: TopCandidateMatch[] } {
    const validHands = (rawHands || []).filter(h => isAnatomicalHand(h));

    // IMMEDIATE 0ms CLEAR WHEN NO HAND IS PRESENT
    if (validHands.length === 0) {
      this.reset();
      return {
        mode: mode === 'multilingual' ? 'isl' : mode,
        status: 'NO_HAND',
        sign: 'NO_HAND',
        display_name: 'No Hand Detected',
        hindi_name: '',
        category: 'General',
        confidence: 0,
        hand_detected: false,
        stable: false,
        new_stable_event: false,
        latency_ms: latencyMs,
        hands_count: 0,
        landmarks: [],
        letter: undefined,
        hold_progress: 0,
        trigger_type: false,
        typed_char: null,
        fingerStates: { thumb: 'FOLDED', index: 'FOLDED', middle: 'FOLDED', ring: 'FOLDED', pinky: 'FOLDED' },
        topMatches: []
      };
    }

    const extracted = this._extractFeatures(validHands, handedness);
    const primaryHand = extracted.hands[0];
    const secondaryHand = extracted.hands.length > 1 ? extracted.hands[1] : null;
    const motion = this._analyzeMotion(primaryHand.label);

    // =========================================================
    // MODE 1: ASL ALPHABET FINGERSPELLING & SENTENCE TYPIST
    // =========================================================
    if (mode === 'asl') {
      const aslCandidates = this._classifyASLAlphabet(primaryHand, motion);
      aslCandidates.sort((a, b) => b.confidence - a.confidence);

      const best = aslCandidates.length > 0 ? aslCandidates[0] : null;
      const topMatches: TopCandidateMatch[] = aslCandidates.slice(0, 3).map(c => ({
        id: c.id,
        name: `Letter ${c.letter}`,
        letter: c.letter,
        confidence: Math.round(c.confidence * 100),
        reason: c.reason
      }));

      if (!best || best.confidence < 0.50) {
        this.currentAslCandidate = null;
        this.aslCandidateCount = 0;
        this.aslHasTriggered = false;
        return {
          mode: 'asl',
          status: 'GESTURE_UNCLEAR',
          sign: 'GESTURE_UNCLEAR',
          display_name: 'Hold ASL Letter Steady',
          confidence: best ? Number(best.confidence.toFixed(2)) : 0,
          hand_detected: true,
          stable: false,
          latency_ms: latencyMs,
          hands_count: validHands.length,
          landmarks: validHands,
          letter: undefined,
          hold_progress: 0,
          trigger_type: false,
          typed_char: null,
          fingerStates: primaryHand.fingerStates,
          topMatches
        };
      }

      const predLetter = best.letter;
      const now = performance.now();

      if (predLetter === this.currentAslCandidate) {
        this.aslCandidateCount += 1;
      } else {
        this.currentAslCandidate = predLetter;
        this.aslCandidateCount = 1;
        this.aslHasTriggered = false;
      }

      const holdProg = Math.min(1.0, this.aslCandidateCount / this.aslHoldThreshold);
      let trigger = false;
      let typed: string | null = null;

      // Different letter = 0ms cooldown! Same letter repeat = 950ms cooldown.
      const cooldownOk = (predLetter !== this.lastCommittedAslLetter) || (now - this.lastAslCommitTime > 950);
      if (holdProg >= 1.0 && !this.aslHasTriggered && cooldownOk) {
        trigger = true;
        this.aslHasTriggered = true;
        this.lastAslCommitTime = now;
        this.lastCommittedAslLetter = predLetter;

        if (predLetter === 'space') typed = ' ';
        else if (predLetter === 'del') typed = 'BACKSPACE';
        else typed = predLetter.toUpperCase();
      }

      const displayLetter = predLetter === 'space' ? 'SPACE' : predLetter === 'del' ? 'DEL' : predLetter.toUpperCase();

      return {
        mode: 'asl',
        status: 'RECOGNIZED',
        sign: displayLetter,
        display_name: `ASL "${displayLetter}"`,
        confidence: Number(best.confidence.toFixed(2)),
        hand_detected: true,
        stable: holdProg >= 0.4,
        latency_ms: latencyMs,
        hands_count: validHands.length,
        landmarks: validHands,
        letter: displayLetter,
        hold_progress: Number(holdProg.toFixed(2)),
        trigger_type: trigger,
        typed_char: typed,
        fingerStates: primaryHand.fingerStates,
        topMatches
      };
    }

    // =========================================================
    // MODE 2: ISL GESTURES & MULTILINGUAL AI BRIDGE
    // =========================================================
    const gestureCandidates: { id: string; name: string; category: string; confidence: number; reason: string }[] = [];

    if (extracted.twoHandRelation && secondaryHand) {
      gestureCandidates.push(...this._classifyTwoHandedISL(primaryHand, secondaryHand, extracted.twoHandRelation, motion));
    }
    gestureCandidates.push(...this._classifySingleHandISL(primaryHand, motion));

    gestureCandidates.sort((a, b) => b.confidence - a.confidence);
    const bestGesture = gestureCandidates.length > 0 ? gestureCandidates[0] : null;
    const bestSignName = bestGesture && bestGesture.confidence >= 0.50 ? bestGesture.name : null;
    const bestConf = bestGesture ? bestGesture.confidence : 0;

    const smoothed = this._pushBuffer(bestSignName, bestConf);
    const topMatches: TopCandidateMatch[] = gestureCandidates.slice(0, 3).map(c => ({
      id: c.id,
      name: c.name,
      confidence: Math.round(c.confidence * 100),
      reason: c.reason
    }));

    // Instant Frame-1 display of bestSignName, while smoothed.isStable locks on 2 agreeing frames (~60ms)
    const activeSign = smoothed.stableSign || bestSignName;

    if (!activeSign) {
      return {
        mode: 'isl',
        status: 'GESTURE_UNCLEAR',
        sign: 'GESTURE_UNCLEAR',
        display_name: 'Analyzing Hand Pose...',
        hindi_name: '',
        category: 'General',
        confidence: Number(bestConf.toFixed(2)),
        hand_detected: true,
        stable: false,
        new_stable_event: false,
        latency_ms: latencyMs,
        hands_count: validHands.length,
        landmarks: validHands,
        fingerStates: primaryHand.fingerStates,
        topMatches
      };
    }

    const now = performance.now();
    let newStableEvent = false;
    if (smoothed.isStable) {
      if (activeSign !== this.lastStableIslSign || (now - this.lastIslCommitTime > 1800)) {
        this.lastStableIslSign = activeSign;
        this.lastIslCommitTime = now;
        newStableEvent = true;
      }
    }

    const matchedInfo = gestureCandidates.find(c => c.name === activeSign) || bestGesture;

    return {
      mode: 'isl',
      status: 'RECOGNIZED',
      sign: activeSign,
      display_name: activeSign,
      hindi_name: HINDI_MAP[activeSign] || '',
      category: matchedInfo?.category || 'General',
      confidence: Number(Math.min(0.98, Math.max(bestConf, smoothed.confidence)).toFixed(2)),
      hand_detected: true,
      stable: smoothed.isStable,
      new_stable_event: newStableEvent,
      latency_ms: latencyMs,
      hands_count: validHands.length,
      landmarks: validHands,
      fingerStates: primaryHand.fingerStates,
      topMatches
    };
  }

  private _extractFeatures(multiHandLandmarks: LandmarkPoint[][], handedness: { label: string; score: number }[]) {
    const processedHands = multiHandLandmarks.map((rawLandmarks, index) => {
      const label = handedness[index]?.label || (index === 0 ? 'Right' : 'Left');
      return this._extractSingleHand(rawLandmarks, label);
    });

    this._updateMotionHistory(processedHands);

    const twoHandRelation = processedHands.length >= 2
      ? this._extractTwoHandRelation(processedHands[0], processedHands[1])
      : null;

    return {
      handsCount: processedHands.length,
      hands: processedHands,
      twoHandRelation
    };
  }

  private _extractSingleHand(raw: LandmarkPoint[], label: string) {
    const normalized = normalizeLandmarks(raw);
    const aligned = alignHandOrientation(normalized);
    const fingerStates = this._classifyFingers(raw);
    const angles = this._computeJointAngles(raw);
    const distances = this._computeKeyDistances(normalized);
    const orientation = this._computeHandOrientation(raw);

    return {
      label,
      raw,
      normalized,
      aligned,
      fingerStates,
      angles,
      distances,
      orientation,
      wristPosition: { x: raw[0].x, y: raw[0].y, z: raw[0].z || 0 },
      palmCenter: {
        x: (raw[0].x + raw[5].x + raw[17].x) / 3,
        y: (raw[0].y + raw[5].y + raw[17].y) / 3,
        z: 0
      }
    };
  }

  /**
   * Robust, natural human finger state classifier:
   * Accurately detects OPEN vs FOLDED even when fingers are slightly relaxed or tilted toward the webcam.
   */
  private _classifyFingers(raw: LandmarkPoint[]): FingerStatesMap {
    const wrist = raw[0];
    const palmScale = distance2D(raw[0], raw[9]) || 0.1;

    const evaluateFinger = (mcpIdx: number, pipIdx: number, dipIdx: number, tipIdx: number): FingerState => {
      const pipAngle = angleBetweenPoints(raw[mcpIdx], raw[pipIdx], raw[dipIdx]);
      const dipAngle = angleBetweenPoints(raw[pipIdx], raw[dipIdx], raw[tipIdx]);
      const tipDistToWrist = distance2D(raw[tipIdx], wrist);
      const pipDistToWrist = distance2D(raw[pipIdx], wrist);
      const mcpDistToWrist = distance2D(raw[mcpIdx], wrist);

      // Extended check: tip is clearly farther from wrist than PIP and MCP, with straight-ish PIP angle
      const isExtended =
        tipDistToWrist > pipDistToWrist * 1.05 &&
        tipDistToWrist > mcpDistToWrist * 1.22 &&
        pipAngle > 122;

      if (isExtended) return 'OPEN';
      if (tipDistToWrist <= pipDistToWrist * 1.03 || pipAngle < 110 || dipAngle < 105) return 'FOLDED';
      return 'HALF';
    };

    // Thumb extension: check distance from Thumb Tip (4) to Index MCP (5) & Pinky MCP (17) normalized by palm size
    const palmWidth = distance2D(raw[5], raw[17]) + 1e-5;
    const thumbToPinkyMcp = distance2D(raw[4], raw[17]);
    const thumbToIndexMcp = distance2D(raw[4], raw[5]);
    const thumbIpAngle = angleBetweenPoints(raw[2], raw[3], raw[4]);

    let thumbState: FingerState = 'FOLDED';
    if (
      (thumbToPinkyMcp > palmWidth * 1.22 && thumbToIndexMcp > palmScale * 0.44) ||
      (thumbIpAngle > 138 && thumbToIndexMcp > palmScale * 0.52)
    ) {
      thumbState = 'OPEN';
    } else if (thumbToIndexMcp > palmScale * 0.34) {
      thumbState = 'HALF';
    }

    return {
      thumb: thumbState,
      index: evaluateFinger(LANDMARK.INDEX_MCP, LANDMARK.INDEX_PIP, LANDMARK.INDEX_DIP, LANDMARK.INDEX_TIP),
      middle: evaluateFinger(LANDMARK.MIDDLE_MCP, LANDMARK.MIDDLE_PIP, LANDMARK.MIDDLE_DIP, LANDMARK.MIDDLE_TIP),
      ring: evaluateFinger(LANDMARK.RING_MCP, LANDMARK.RING_PIP, LANDMARK.RING_DIP, LANDMARK.RING_TIP),
      pinky: evaluateFinger(LANDMARK.PINKY_MCP, LANDMARK.PINKY_PIP, LANDMARK.PINKY_DIP, LANDMARK.PINKY_TIP)
    };
  }

  private _computeJointAngles(raw: LandmarkPoint[]) {
    return {
      indexPip: angleBetweenPoints(raw[LANDMARK.INDEX_MCP], raw[LANDMARK.INDEX_PIP], raw[LANDMARK.INDEX_DIP]),
      middlePip: angleBetweenPoints(raw[LANDMARK.MIDDLE_MCP], raw[LANDMARK.MIDDLE_PIP], raw[LANDMARK.MIDDLE_DIP]),
      ringPip: angleBetweenPoints(raw[LANDMARK.RING_MCP], raw[LANDMARK.RING_PIP], raw[LANDMARK.RING_DIP]),
      pinkyPip: angleBetweenPoints(raw[LANDMARK.PINKY_MCP], raw[LANDMARK.PINKY_PIP], raw[LANDMARK.PINKY_DIP]),
      thumbIndexSpread: angleBetweenPoints(raw[LANDMARK.INDEX_MCP], raw[LANDMARK.WRIST], raw[LANDMARK.THUMB_TIP]),
      indexMiddleSpread: angleBetweenPoints(raw[LANDMARK.INDEX_TIP], raw[LANDMARK.INDEX_MCP], raw[LANDMARK.MIDDLE_TIP])
    };
  }

  private _computeKeyDistances(norm: LandmarkPoint[]) {
    return {
      thumbTipToIndexTip: distance(norm[LANDMARK.THUMB_TIP], norm[LANDMARK.INDEX_TIP]),
      thumbTipToMiddleTip: distance(norm[LANDMARK.THUMB_TIP], norm[LANDMARK.MIDDLE_TIP]),
      thumbTipToRingTip: distance(norm[LANDMARK.THUMB_TIP], norm[LANDMARK.RING_TIP]),
      thumbTipToPinkyTip: distance(norm[LANDMARK.THUMB_TIP], norm[LANDMARK.PINKY_TIP]),
      indexTipToMiddleTip: distance(norm[LANDMARK.INDEX_TIP], norm[LANDMARK.MIDDLE_TIP]),
      indexTipToPinkyTip: distance(norm[LANDMARK.INDEX_TIP], norm[LANDMARK.PINKY_TIP])
    };
  }

  private _computeHandOrientation(raw: LandmarkPoint[]) {
    const wrist = raw[0];
    const middleMcp = raw[LANDMARK.MIDDLE_MCP];
    return {
      pointingUp: middleMcp.y < wrist.y - 0.02,
      pointingDown: middleMcp.y > wrist.y + 0.03,
      pointingSide: Math.abs(middleMcp.x - wrist.x) > Math.abs(middleMcp.y - wrist.y) * 1.12
    };
  }

  private _updateMotionHistory(processedHands: any[]) {
    const now = performance.now();
    processedHands.forEach(hand => {
      const key = hand.label === 'Left' ? 'leftHand' : 'rightHand';
      const history = this.motionHistory[key];
      history.push({
        time: now,
        palmCenter: hand.palmCenter,
        wrist: hand.wristPosition
      });
      if (history.length > this.maxHistoryLength) history.shift();
    });
  }

  private _analyzeMotion(handLabel = 'Right') {
    const key = handLabel === 'Left' ? 'leftHand' : 'rightHand';
    const history = this.motionHistory[key];
    if (!history || history.length < 4) {
      return {
        velocity: { x: 0, y: 0, speed: 0 },
        isWaving: false,
        isNodding: false,
        isShaking: false,
        isStationary: true,
        xReversals: 0,
        yReversals: 0
      };
    }

    const first = history[0];
    const last = history[history.length - 1];
    const dt = Math.max(0.04, (last.time - first.time) / 1000);
    const totalDx = last.palmCenter.x - first.palmCenter.x;
    const totalDy = last.palmCenter.y - first.palmCenter.y;
    const speed = Math.sqrt(totalDx * totalDx + totalDy * totalDy) / dt;

    let xReversals = 0;
    let yReversals = 0;
    let prevDx = 0;
    let prevDy = 0;

    for (let i = 1; i < history.length; i++) {
      const cdx = history[i].palmCenter.x - history[i - 1].palmCenter.x;
      const cdy = history[i].palmCenter.y - history[i - 1].palmCenter.y;
      if (Math.abs(cdx) > 0.004 && prevDx !== 0 && cdx * prevDx < 0) xReversals++;
      if (Math.abs(cdy) > 0.004 && prevDy !== 0 && cdy * prevDy < 0) yReversals++;
      if (Math.abs(cdx) > 0.003) prevDx = cdx;
      if (Math.abs(cdy) > 0.003) prevDy = cdy;
    }

    return {
      velocity: { x: totalDx / dt, y: totalDy / dt, speed },
      isWaving: xReversals >= 2 && speed > 0.08,
      isShaking: xReversals >= 3,
      isNodding: yReversals >= 2,
      isStationary: speed < 0.05 && xReversals < 2 && yReversals < 2,
      xReversals,
      yReversals
    };
  }

  private _extractTwoHandRelation(handA: any, handB: any) {
    const wristDist = distance(handA.wristPosition, handB.wristPosition);
    const indexTipDist = distance(handA.raw[LANDMARK.INDEX_TIP], handB.raw[LANDMARK.INDEX_TIP]);
    const palmDist = distance(handA.palmCenter, handB.palmCenter);
    return {
      wristDistance: wristDist,
      palmDistance: palmDist,
      indexTipDistance: indexTipDist,
      areHandsTouching: palmDist < 0.24 || indexTipDist < 0.15 || wristDist < 0.25
    };
  }

  /**
   * Complete ASL Alphabet Classifier (A - Z + Space + Del)
   * Uses relaxed non-extended finger tolerance so natural human fingerspelling always matches cleanly.
   */
  private _classifyASLAlphabet(hand: any, motion: any) {
    const results: { id: string; letter: string; confidence: number; reason: string }[] = [];
    const f: FingerStatesMap = hand.fingerStates;
    const d = hand.distances;
    const a = hand.angles;
    const o = hand.orientation;
    const raw: LandmarkPoint[] = hand.raw;

    const I = f.index === 'OPEN';
    const M = f.middle === 'OPEN';
    const R = f.ring === 'OPEN';
    const P = f.pinky === 'OPEN';
    const T = f.thumb === 'OPEN';
    const openCount = [I, M, R, P].filter(Boolean).length;

    // 1. SPACE: Open 5-finger spread palm OR horizontal flat open hand
    if ((openCount === 4 && T && d.indexTipToPinkyTip > 0.65) || (openCount >= 3 && o.pointingSide)) {
      results.push({ id: 'ASL_SPACE', letter: 'space', confidence: 0.96, reason: 'Open Spread Palm (SPACE)' });
    }

    // 2. B: 4 fingers extended upright, thumb folded across palm
    if (I && M && R && P && !T) {
      results.push({ id: 'ASL_B', letter: 'B', confidence: 0.96, reason: 'ASL Letter B (4 fingers up, thumb in)' });
    }

    // 3. F: Index & thumb touching in OK circle, middle + ring + pinky open
    if (!I && M && R && P && d.thumbTipToIndexTip < 0.42) {
      results.push({ id: 'ASL_F', letter: 'F', confidence: 0.96, reason: 'ASL Letter F (OK circle + 3 fingers up)' });
    }

    // 4. W: Index, Middle, Ring open (3 fingers), Pinky not open
    if (I && M && R && !P) {
      results.push({ id: 'ASL_W', letter: 'W', confidence: 0.96, reason: 'ASL Letter W (3 fingers up)' });
    }

    // 5. Y: Thumb + Pinky open ("Hang Loose"), middle 3 not open
    if (T && P && !I && !M && !R) {
      results.push({ id: 'ASL_Y', letter: 'Y', confidence: 0.97, reason: 'ASL Letter Y (Thumb & pinky out)' });
    }

    // 6. I / J: Only Pinky open
    if (P && !I && !M && !R && !T) {
      if (motion.velocity.speed > 0.10 || motion.yReversals >= 1) {
        results.push({ id: 'ASL_J', letter: 'J', confidence: 0.94, reason: 'ASL Letter J (Pinky J-swoop)' });
      } else {
        results.push({ id: 'ASL_I', letter: 'I', confidence: 0.96, reason: 'ASL Letter I (Pinky finger up)' });
      }
    }

    // 7. L / G / Q: Index + Thumb open, Middle + Ring + Pinky not open
    if (I && T && !M && !R && !P) {
      if (o.pointingDown) {
        results.push({ id: 'ASL_Q', letter: 'Q', confidence: 0.92, reason: 'ASL Letter Q (Downward thumb & index)' });
      } else if (o.pointingSide) {
        results.push({ id: 'ASL_G', letter: 'G', confidence: 0.93, reason: 'ASL Letter G (Horizontal index & thumb)' });
      } else {
        results.push({ id: 'ASL_L', letter: 'L', confidence: 0.96, reason: 'ASL Letter L (90° L-shape)' });
      }
    }

    // 8. D / Z: Only Index open, Thumb not open
    if (I && !M && !R && !P && !T) {
      if (motion.xReversals >= 2 && motion.velocity.speed > 0.08) {
        results.push({ id: 'ASL_Z', letter: 'Z', confidence: 0.94, reason: 'ASL Letter Z (Index air trajectory)' });
      } else {
        results.push({ id: 'ASL_D', letter: 'D', confidence: 0.95, reason: 'ASL Letter D (Single index upright)' });
      }
    }

    // 9. V / U / R / K / H / P: Index + Middle open, Ring + Pinky not open
    if (I && M && !R && !P) {
      if (o.pointingDown && T) {
        results.push({ id: 'ASL_P', letter: 'P', confidence: 0.92, reason: 'ASL Letter P (Downward K shape)' });
      } else if (o.pointingSide) {
        results.push({ id: 'ASL_H', letter: 'H', confidence: 0.93, reason: 'ASL Letter H (Horizontal 2 fingers)' });
      } else if (T) {
        results.push({ id: 'ASL_K', letter: 'K', confidence: 0.94, reason: 'ASL Letter K (2 fingers + thumb)' });
      } else if (d.indexTipToMiddleTip < 0.14 || a.indexMiddleSpread < 11) {
        results.push({ id: 'ASL_U', letter: 'U', confidence: 0.94, reason: 'ASL Letter U (2 fingers together)' });
      } else {
        results.push({ id: 'ASL_V', letter: 'V', confidence: 0.96, reason: 'ASL Letter V (Peace / V-sign)' });
      }
    }

    // 10. O / C / A / S / E (0 fingers fully open)
    if (openCount === 0) {
      if (d.thumbTipToIndexTip < 0.36 && d.thumbTipToMiddleTip < 0.42) {
        results.push({ id: 'ASL_O', letter: 'O', confidence: 0.95, reason: 'ASL Letter O (Fingertips touching thumb)' });
      } else if (f.index === 'HALF' && d.thumbTipToIndexTip >= 0.36 && d.thumbTipToIndexTip <= 0.80) {
        results.push({ id: 'ASL_C', letter: 'C', confidence: 0.93, reason: 'ASL Letter C (Curved hand)' });
      } else if (T || raw[LANDMARK.THUMB_TIP].y < raw[LANDMARK.INDEX_PIP].y) {
        results.push({ id: 'ASL_A', letter: 'A', confidence: 0.94, reason: 'ASL Letter A (Fist with thumb up)' });
      } else {
        results.push({ id: 'ASL_S', letter: 'S', confidence: 0.93, reason: 'ASL Letter S (Closed fist)' });
      }
    }

    return results;
  }

  private _classifyTwoHandedISL(hand1: any, hand2: any, rel: any, _motion: any) {
    const results: { id: string; name: string; category: string; confidence: number; reason: string }[] = [];
    const h1F = hand1.fingerStates;
    const h2F = hand2.fingerStates;

    const h1IdxToH2Wrist = distance(hand1.raw[LANDMARK.INDEX_TIP], hand2.wristPosition);
    const h2IdxToH1Wrist = distance(hand2.raw[LANDMARK.INDEX_TIP], hand1.wristPosition);
    if (h1IdxToH2Wrist < 0.24 || h2IdxToH1Wrist < 0.24) {
      results.push({ id: 'DOCTOR', name: 'Doctor', category: 'Medical', confidence: 0.96, reason: 'Two-hand wrist pulse check (Doctor)' });
    }

    if (rel.areHandsTouching) {
      const h1OpenCount = [h1F.index, h1F.middle, h1F.ring, h1F.pinky].filter(s => s === 'OPEN').length;
      const h2OpenCount = [h2F.index, h2F.middle, h2F.ring, h2F.pinky].filter(s => s === 'OPEN').length;
      if (h1OpenCount >= 3 && h2OpenCount >= 3) {
        results.push({ id: 'NAMASTE', name: 'Namaste', category: 'Courtesy', confidence: 0.96, reason: 'Joined palms (Namaste / Greeting)' });
      } else {
        results.push({ id: 'HELP', name: 'Help', category: 'Emergency', confidence: 0.96, reason: 'Supported hand gesture (Help)' });
      }
    } else if (rel.wristDistance > 0.26) {
      results.push({ id: 'HOSPITAL', name: 'Hospital', category: 'Medical', confidence: 0.93, reason: 'Dual open hands (Hospital)' });
    }

    return results;
  }

  /**
   * High-recall Single-Hand ISL Gesture Classifier
   * Matches natural human hand poses reliably without requiring rigid joint angles.
   */
  private _classifySingleHandISL(hand: any, motion: any) {
    const results: { id: string; name: string; category: string; confidence: number; reason: string }[] = [];
    const f: FingerStatesMap = hand.fingerStates;
    const d = hand.distances;
    const o = hand.orientation;
    const raw: LandmarkPoint[] = hand.raw;

    const I = f.index === 'OPEN';
    const M = f.middle === 'OPEN';
    const R = f.ring === 'OPEN';
    const P = f.pinky === 'OPEN';
    const T = f.thumb === 'OPEN';
    const openCount = [I, M, R, P].filter(Boolean).length;

    // 1. FEVER: Hand raised high near forehead/temple (y < 0.36) with 2+ fingers extended
    if (raw[LANDMARK.MIDDLE_MCP].y < 0.36 && openCount >= 2) {
      results.push({ id: 'FEVER', name: 'Fever', category: 'Medical', confidence: 0.96, reason: 'Hand near forehead/temple (Fever)' });
    }

    // 2. HELLO / PLEASE / HELP (All 4 fingers extended)
    if (openCount === 4) {
      if (motion.isWaving) {
        results.push({ id: 'HELLO', name: 'Hello', category: 'Courtesy', confidence: 0.97, reason: 'Open palm wave (Hello)' });
      } else if (!T) {
        results.push({ id: 'HELP', name: 'Help', category: 'Emergency', confidence: 0.95, reason: '4 fingers upright, thumb folded (Help)' });
      } else if (o.pointingSide) {
        results.push({ id: 'PLEASE', name: 'Please', category: 'Courtesy', confidence: 0.94, reason: 'Flat palm across chest (Please)' });
      } else {
        results.push({ id: 'HELLO', name: 'Hello', category: 'Courtesy', confidence: 0.95, reason: 'Open 5-finger palm (Hello)' });
      }
    }

    // 3. WATER: 3 fingers up (Index + Middle + Ring OPEN, Pinky NOT OPEN)
    if (I && M && R && !P) {
      results.push({ id: 'WATER', name: 'Water', category: 'Essentials', confidence: 0.96, reason: '3-finger W gesture (Water)' });
    }

    // 4. DOCTOR / NEED: 2 fingers up (Index + Middle OPEN, Ring + Pinky NOT OPEN)
    if (I && M && !R && !P) {
      if (T) {
        results.push({ id: 'NEED', name: 'Need', category: 'Core', confidence: 0.95, reason: 'Thumb + 2 fingers extended (Need)' });
      } else {
        results.push({ id: 'DOCTOR', name: 'Doctor', category: 'Medical', confidence: 0.96, reason: '2-finger medical sign (Doctor)' });
      }
    }

    // 5. NEED: L-shape (Thumb + Index OPEN, Middle + Ring + Pinky NOT OPEN)
    if (T && I && !M && !R && !P) {
      results.push({ id: 'NEED', name: 'Need', category: 'Core', confidence: 0.96, reason: 'L-shape thumb & index (Need)' });
    }

    // 6. I (Self) / WHERE: Single Index finger extended
    if (I && !M && !R && !P && !T) {
      if (motion.xReversals >= 2) {
        results.push({ id: 'WHERE', name: 'Where', category: 'Question', confidence: 0.94, reason: 'Index finger side-to-side (Where)' });
      } else {
        results.push({ id: 'I', name: 'I', category: 'Pronoun', confidence: 0.96, reason: 'Single index finger pointing (I)' });
      }
    }

    // 7. DRINK / GOOD: Thumb + Pinky (Y-shape) or Thumbs Up
    if (T && !I && !M && !R) {
      if (P) {
        results.push({ id: 'DRINK', name: 'Drink', category: 'Essentials', confidence: 0.96, reason: 'Thumb & pinky gesture (Drink)' });
      } else if (raw[LANDMARK.THUMB_TIP].y < raw[LANDMARK.WRIST].y) {
        results.push({ id: 'GOOD', name: 'Good', category: 'Courtesy', confidence: 0.95, reason: 'Thumbs up gesture (Good)' });
      }
    }

    // 8. TOILET: Only Pinky finger extended
    if (P && !I && !M && !R && !T) {
      results.push({ id: 'TOILET', name: 'Toilet', category: 'Essentials', confidence: 0.95, reason: 'Pinky finger sign (Toilet)' });
    }

    // 9. FOOD / YES: 0 fingers extended
    if (openCount === 0 && !T) {
      if (d.thumbTipToIndexTip < 0.38) {
        results.push({ id: 'FOOD', name: 'Food', category: 'Essentials', confidence: 0.95, reason: 'Fingertips bunched to thumb (Food)' });
      } else {
        results.push({ id: 'YES', name: 'Yes', category: 'Courtesy', confidence: 0.93, reason: 'Closed affirmative fist (Yes)' });
      }
    }

    return results;
  }

  private _pushBuffer(signId: string | null, confidence: number) {
    this.historyBuffer.push({ signId, confidence, time: performance.now() });
    if (this.historyBuffer.length > this.bufferSize) {
      this.historyBuffer.shift();
    }

    const counts: Record<string, number> = {};
    let totalConf = 0;
    let validCount = 0;

    this.historyBuffer.forEach(item => {
      if (item.signId) {
        counts[item.signId] = (counts[item.signId] || 0) + 1;
        totalConf += item.confidence;
        validCount++;
      }
    });

    let majoritySign: string | null = null;
    let maxCount = 0;
    for (const [id, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        majoritySign = id;
      }
    }

    // 2 agreeing frames out of 3 = stable lock (~60ms!)
    const isStable = maxCount >= 2;
    const avgConfidence = validCount > 0 ? totalConf / validCount : 0;

    return {
      stableSign: isStable ? majoritySign : null,
      confidence: avgConfidence,
      isStable
    };
  }
}
